// BillingSuccess.js
import React, { useEffect, useRef, useState } from 'react';
import './BillingSuccess.css'; // Import the CSS for animations
import {useNavigate} from 'react-router-dom'; 

const BillingSuccess = ({estimationNo, isAdmin}) => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const handleContinue = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
    }
  };

 console.log(estimationNo)


  useEffect(()=>{
    setTimeout(()=>{
      handleContinue()
    },1000)
  },[]);

  return (
    <div className="fixed z-20 w-full top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white animate-slide-up rounded-lg shadow-xl  w-full py-40 flex flex-col items-center">
        {/* Animated Checkmark */}
        <div className="checkmark-container mb-6">
          <i className="fa fa-check checkmark"></i>
        </div>

       {!isAdmin && <h1 className='text-sm font-bold mb-2'>Estimation No: {estimationNo || 'error'}</h1> }
       {isAdmin && <h1 className='text-sm font-bold mb-2'>Bill No: {estimationNo || 'error'}</h1> }
        
        {/* Success Message */}
        {!isAdmin && <div style={{textAlign:'center'}}>  <h2 className="text-sm font-bold text-red-800 mb-4">
          Successfully Submitted
        </h2>
        <p className="text-gray-600 italic text-gray-300 animate-pulse mb-6 text-xs text-center">
          Your Estimation Bill Is Successfully Submitted To The Admin Panel for Review
        </p> </div>}


        {isAdmin && <div style={{textAlign:'center'}}> 
          <h2 className="text-sm font-bold text-red-800 mb-4">
          Successfully Submitted Bill
        </h2>
        <p className="text-gray-600 italic text-gray-300 animate-pulse mb-6 text-xs text-center">
          Your Bill Is Successfully Submitted 
        </p>
          </div>}
        
        {/* Optional Button */}
        <button onClick={()=> navigate('/')} className="mt-4 px-6 text-xs font-bold py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300">
          Continue
        </button>

        <audio ref={audioRef} src={`${process.env.PUBLIC_URL}/sounds/success.mp3`} preload="auto" />

      </div>
    </div>
  );
};

export default BillingSuccess;
