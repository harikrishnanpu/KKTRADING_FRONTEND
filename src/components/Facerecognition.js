import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import MessageBox from './MessageBox';
import { useNavigate } from 'react-router-dom';
import { signout } from '../actions/userActions';

const FaceRecognition = ({modal,login}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [descriptor, setDescriptor] = useState(null);
  const [Loading,setLoading] = useState(false);
  const [error,setError] = useState(null);


  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  const stopCameraStream = () => {

    const videoStream = webcamRef.current?.video.srcObject;
        // Stop all tracks
        if (videoStream) {
            videoStream.getTracks().forEach((track) => {
              if (track.readyState === "live") {
                track.stop();
              }
            });
          }
}


  // Load face-api.js models
  useEffect(() => {

    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
      }
    };

    loadModels();

    return () =>{
        stopCameraStream()
    }

  }, []);


  // Capture the face from the webcam and compute the face descriptor
  const captureFace = async () => {
    setError(null)
    setLoading(true)
    const webcamElement = webcamRef.current.video;
    const detections = await faceapi.detectSingleFace(webcamElement).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
      const faceDescriptor = detections.descriptor;
      setDescriptor(faceDescriptor);
      await sendDescriptorToBackend(faceDescriptor);
      setLoading(false)
      modal()
      navigate('/')
      stopCameraStream()
    } else {
      setError('No Face Detected')
      console.log('No face detected.');
      setLoading(false)
    }
  };

  const unlockFace = async () => {
    setError(null)
    setLoading(true)
    console.log(descriptor)
    const webcamElement = webcamRef.current.video;
    const detections = await faceapi.detectSingleFace(webcamElement).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
      const faceDescriptor = detections.descriptor;
      setDescriptor(faceDescriptor);
      await unlockFaceIdBackend(faceDescriptor);
      setLoading(false)
      modal()
      navigate('/')
      stopCameraStream()
    } else {
      alert('No Face Detected')
      console.log('No face detected.');
      setLoading(false)
    }
  }


  const unlockFaceIdBackend = async (descriptor) => {
    try{

      await axios.post(`/api/users/recognize-face/${userInfo._id}`,{
        faceDescriptor: Array.from(descriptor)
      })

      localStorage.setItem('faceId',true)
      navigate('/')

    }catch (error){
      alert('Face Not Recognised')
      console.log(error)
    }
  }

  // Send the face descriptor to the backend
  const sendDescriptorToBackend = async (descriptor) => {
    try {
      setLoading(true)
       await axios.post(`/api/users/register-face/${userInfo._id}`, {
     // Add user ID here for identification
        faceDescriptor: Array.from(descriptor),
      });
    } catch (error) {
        setError('Error Occured')
        console.error('Error sending face descriptor:', error);
    }
  };

  const signoutHandler = () => {
    dispatch(signout(userInfo._id));
  };

  return (
    <div className='text-center mx-auto'>
        {error && <MessageBox variant="danger">{error}</MessageBox>}
      <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" /> 
      {login ? ( 
        <div>
        <button  className="mt-5 w-2/3 font-bold text-white bg-red-500 border-0 py-2 px-8 focus:outline-none hover:bg-red-600 rounded text-lg"
       onClick={unlockFace} disabled={!modelsLoaded || Loading}>
        {Loading ? 'loading..' : 'Unlock'}
      </button> 
      <p onClick={()=> signoutHandler()} className='text-blue-500 cursor-pointer mt-5'>Signout</p>
      </div>
      ): (<button  className="mt-5 w-2/3 font-bold text-white bg-red-500 border-0 py-2 px-8 focus:outline-none hover:bg-red-600 rounded text-lg"
       onClick={captureFace} disabled={!modelsLoaded || Loading}>
        {Loading ? 'loading..' : 'Register'}
      </button> ) }
    </div>
  );
};

export default FaceRecognition;
