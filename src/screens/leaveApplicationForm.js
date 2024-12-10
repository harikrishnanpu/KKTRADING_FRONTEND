import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import api from './api'; // Axios instance
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // for animation

const LeaveApplicationForm = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector(state => state.userSignin);
  
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!reason || !startDate || !endDate) {
      setError('Please fill all fields.');
      return;
    }
    setError('');
    try {
      await api.post('/api/leaves', {
        userId: userInfo?._id,
        userName: userInfo?.name,
        reason,
        startDate,
        endDate
      });
      setShowSuccess(true);
      setReason('');
      setStartDate('');
      setEndDate('');
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/all-leaves');
      }, 3000);
    } catch (err) {
      setError('Failed to submit leave application.');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div onClick={() => navigate('/')} className="text-center cursor-pointer mb-4">
        <h2 className="text-base font-bold text-red-600">KK TRADING</h2>
        <p className="text-gray-400 text-xs font-bold">Leave Application</p>
      </div>

      <form onSubmit={submitHandler} className="bg-white rounded shadow p-4 space-y-4">
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div>
          <label className="block text-xs font-bold mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-xs"
            placeholder="Enter reason for leave"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-xs"
          />
        </div>
        <button className="w-full bg-red-500 text-white font-bold py-2 rounded text-xs">Submit</button>
      </form>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-green-500 text-white p-3 text-center font-bold text-xs"
          >
            Successfully submitted leave application!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveApplicationForm;
