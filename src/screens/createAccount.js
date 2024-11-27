import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';

export default function PaymentAccountForm() {
  const navigate = useNavigate();

  const [accountName,setAccountName] = useState('');
  const [balance,setBalance] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const [step, setStep] = useState(1);


  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;


  function changeRef(e, nextRef) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  }

  const accountNameRef = useRef();
  const balanceRef = useRef();



  const handleSubmitDamageBill = async (e) => {
    e.preventDefault();
    if (!accountName) {
      alert('Please fill all required fields');
      return;
    }

    try{
        const response = await api.post('/api/accounts/create', {
          accountName,
          balance: parseFloat(balance) || 0,
          userId: userInfo?._id
        });

        if (response.status === 201) {
          setShowSuccessMessage('Account created successfully.');
          setShowErrorMessage('');
          setAccountName('');
          setBalance(0);
        } else {
          setShowErrorMessage('Failed to create account. Please try again.');
        }
    }catch(error){
        setShowErrorMessage('Failed to create account. Please try again.');
    }
    }

  return (
    <div className="container mx-auto p-6">
      {/* Top Banner */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Account Creation And Opening Balance</p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-8">
        <div className='flex justify-between mb-4'>
          <p className='text-sm font-bold mb-5 text-gray-500'> <i className='fa fa-list'/></p>
          <div className='text-right'>
            <button
              onClick={handleSubmitDamageBill}
              className="mb-2 bg-red-500 text-sm text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600"
            >
            Creating Account
            </button>
            <p className='text-xs text-gray-400'>Fill all fields before submission</p>
          </div>
        </div>

        {/* User Information */}
        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Account Name</label>
          <input
            type="text"
            ref={accountNameRef}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            onKeyDown={(e) => changeRef(e, balanceRef)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Enter Account Name"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Balance Amount</label>
          <input
            type="number"
            ref={balanceRef}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Enter Account Name"
          />
        </div>
        
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 bg-green-500 text-white px-4 py-2 rounded shadow-md">
          {showSuccessMessage}
        </div>
      )}

      {/* Error Message */}
      {showErrorMessage && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 bg-red-500 text-white px-4 py-2 rounded shadow-md">
          {showErrorMessage}
        </div>
      )}
    </div>
  );
}
