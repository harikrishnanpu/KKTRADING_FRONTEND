import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { useDispatch, useSelector } from 'react-redux';
import MessageBox from './MessageBox';
import { useNavigate } from 'react-router-dom';
import { signout } from '../actions/userActions';
import api from '../screens/api';
import debounce from 'lodash.debounce'; // Install lodash.debounce for throttling

const FaceRecognition = ({ modal, login }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Stop the webcam stream
  const stopCameraStream = useCallback(() => {
    const videoStream = webcamRef.current?.video.srcObject;
    if (videoStream) {
      videoStream.getTracks().forEach((track) => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
    }
  }, []);

  // Load face-api.js models once when the app starts
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = process.env.PUBLIC_URL + '/models';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log('Face-api.js models loaded');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
      }
    };

    loadModels();

    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Throttled face detection to improve performance
  const detectFace = useCallback(
    debounce(async () => {
      if (!modelsLoaded || loading) return;

      const webcamElement = webcamRef.current?.video;
      if (webcamElement && webcamElement.readyState === 4) {
        try {
          const detections = await faceapi
            .detectSingleFace(webcamElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detections) {
            const faceDescriptor = detections.descriptor;
            if (login) {
              await unlockFaceIdBackend(faceDescriptor);
            } else {
              await sendDescriptorToBackend(faceDescriptor);
            }
            modal();
            navigate('/');
            stopCameraStream();
          } else {
            setError('No Face Detected');
            console.log('No face detected.');
          }
        } catch (err) {
          console.error('Face detection error:', err);
          setError('Face detection failed');
        } finally {
          setLoading(false);
        }
      }
    }, 1000), // Adjust the delay as needed
    [modelsLoaded, loading, login, modal, navigate, stopCameraStream]
  );

  // Automatically capture face when models are loaded and webcam is ready
  useEffect(() => {
    if (modelsLoaded) {
      detectFace();
    }
  }, [modelsLoaded, detectFace]);

  const unlockFaceIdBackend = async (descriptor) => {
    try {
      setLoading(true);
      await api.post(`/api/users/recognize-face/${userInfo._id}`, {
        faceDescriptor: Array.from(descriptor),
      });

      localStorage.setItem('faceId', true);
      console.log('Face recognized successfully');
    } catch (error) {
      alert('Face Not Recognised');
      console.error(error);
      setError('Face not recognized');
    } finally {
      setLoading(false);
    }
  };

  // Send the face descriptor to the backend for registration
  const sendDescriptorToBackend = async (descriptor) => {
    try {
      setLoading(true);
      await api.post(`/api/users/register-face/${userInfo._id}`, {
        faceDescriptor: Array.from(descriptor),
      });
      console.log('Face registered successfully');
    } catch (error) {
      setError('Error occurred while registering face');
      console.error('Error sending face descriptor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignout = () => {
    dispatch(signout(userInfo._id));
    stopCameraStream();
    navigate('/signin'); // Redirect to sign-in page after signout
  };

  // Webcam video constraints for lower resolution
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  return (
    <div className="text-center mx-auto">
      {error && <MessageBox variant="danger">{error}</MessageBox>}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        onUserMediaError={(err) => {
          console.error('Webcam error:', err);
          setError('Cannot access webcam');
        }}
        style={{ width: '100%', maxWidth: '640px' }}
      />
      {loading && <p className="mt-2">Processing...</p>}
      {!loading && !login && (
        <button
          className="mt-5 w-2/3 font-bold text-white bg-red-500 border-0 py-2 px-8 focus:outline-none hover:bg-red-600 rounded text-lg"
          onClick={detectFace}
          disabled={!modelsLoaded}
        >
          Register
        </button>
      )}
      {!loading && login && (
        <div>
          <button
            className="mt-5 w-2/3 font-bold text-white bg-red-500 border-0 py-2 px-8 focus:outline-none hover:bg-red-600 rounded text-lg"
            onClick={detectFace}
            disabled={!modelsLoaded}
          >
            Unlock
          </button>
          <p onClick={handleSignout} className="text-blue-500 cursor-pointer mt-5">
            Signout
          </p>
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;
