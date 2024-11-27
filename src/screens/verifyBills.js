// src/components/VerifyBill.jsx

import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import './VerifyBill.css'; // For animations
import api from './api';

const VerifyBill = () => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'verified' or 'not_verified'
  const [billId, setBillId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [scanEnabled, setScanEnabled] = useState(true);

  // Handler when QR code is scanned
  const handleScan = async (data) => {
    if (data && scanEnabled && !isVerifying) {
      const qrcodeId = data.text; // In react-qr-scanner, data is the scanned text

      setIsVerifying(true);
      setScannedText(qrcodeId);

      try {
        const response = await api.post('/api/print/verify-qr-code', { qrcodeId });
        const result = response.data;

        if (response.status === 200 && result.verified) {
          setVerificationStatus('verified');
          setBillId(result.billId);
        } else {
          setVerificationStatus('not_verified');
          setErrorMessage(result.message || 'Verification failed.');
        }
      } catch (error) {
        console.error('Error verifying QR Code:', error);
        setVerificationStatus('not_verified');
        setErrorMessage('An unexpected error occurred during verification.');
      } finally {
        setIsVerifying(false);
        setShowModal(true);
        setScanEnabled(false); // Stop scanning after first scan
      }
    }
  };

  // Handler for scan errors
  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    setVerificationStatus('not_verified');
    setErrorMessage('Camera error. Please ensure camera permissions are granted.');
    setShowModal(true);
    setScanEnabled(false); // Stop scanning
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setVerificationStatus(null);
    setBillId('');
    setErrorMessage('');
    setScannedText('');
    setScanEnabled(true); // Restart scanning
  };

  // Toggle camera facing mode
  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === 'environment' ? 'user' : 'environment'));
  };

  // QR Scanner delay (in ms)
  const delay = 500;

  // QR Scanner preview style
  const previewStyle = {
    height: 240,
    width: 320,
  };

  return (
    <div>


<div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">All Invoice Verification</p>
        </div>
        <i className="fa fa-recycle text-gray-500 text-2xl" />
      </div>

    
    <div className="verify-bill-container flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2 className="title text-2xl font-bold text-red-600 mb-6">Verify Bill</h2>
      <div className="qr-scanner-wrapper mb-4 shadow-lg rounded overflow-hidden relative">
        {scanEnabled ? (
          <QrScanner
  delay={delay}
  style={previewStyle}
  onError={handleError}
  onScan={handleScan}
  constraints={{
    video: {
      facingMode: facingMode, // Use the current facing mode ('user' or 'environment')
      width: { ideal: 1280 }, // Ideal resolution
      height: { ideal: 720 },
    },
  }}
/>

        ) : (
          <div className="flex items-center justify-center w-full bg-gray-200">
            <p className="text-gray-500">Scanning Paused</p>
          </div>
        )}
        <button
          onClick={toggleCamera}
          className="absolute top-2 right-2 bg-white bg-opacity-50 p-2 rounded-full"
        >
          <i className="fa fa-refresh text-xl text-gray-700"></i> {/* Font Awesome 4 icon */}
        </button>
      </div>
      {isVerifying && <p className="verifying text-gray-700">Verifying QR Code...</p>}

      {/* Display scanned text */}
      {scannedText && (
        <p className="scanned-text text-gray-700 mb-4">
          Scanned QR Code: <span className="font-bold">{scannedText}</span>
        </p>
      )}

      {/* Modal */}
      {showModal && (
         <div className="fixed inset-0 flex justify-center z-50 bg-black bg-opacity-50">
         <div className="bg-white animate-slide-up rounded-lg shadow-xl  w-full py-40 flex flex-col items-center">
           {/* Animated Checkmark */}
           <div className="checkmark-container mb-6">
             {verificationStatus == "verified" ?  <i className="fa fa-check checkmark"></i> :  <i className="fa fa-times checkmark"></i> }
           </div>

           {verificationStatus == "verified" ?  <p className='font-bold text-xs'>Verified</p> : <p className='font-bold text-xs'>Not Verified</p>  }
        
           
           {/* Optional Button */}
           <button onClick={()=> navigate('/')} className="mt-4 px-6 text-xs font-bold py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300">
             Continue
           </button>
     
         </div>
       </div>
      )}
    </div>
    </div>
  );
};

export default VerifyBill;
