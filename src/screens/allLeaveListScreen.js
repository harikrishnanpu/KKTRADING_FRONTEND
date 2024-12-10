import React, { useState, useEffect } from 'react';
import api from './api';
import { useSelector } from 'react-redux';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

const AllLeavesPage = () => {
  const { userInfo } = useSelector(state => state.userSignin);

  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLeave, setEditLeave] = useState(null);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/api/leaves');
      setLeaves(data);
    } catch (err) {
      setError('Failed to fetch leaves.');
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const approveLeave = async (id) => {
    try {
      await api.put(`/api/leaves/${id}/approve`);
      fetchLeaves();
    } catch (err) {
      setError('Failed to approve leave.');
    }
  };

  const rejectLeave = async (id) => {
    try {
      await api.put(`/api/leaves/${id}/reject`);
      fetchLeaves();
    } catch (err) {
      setError('Failed to reject leave.');
    }
  };

  const deleteLeave = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave application?')) return;
    try {
      const { data } = await api.delete(`/api/leaves/${id}`);
      setDeleteMessage(data.message);
      fetchLeaves();
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete leave application.');
    }
  };

  const openEditModal = (leave) => {
    setEditLeave(leave);
    setReason(leave.reason);
    setStartDate(leave.startDate.split('T')[0]);
    setEndDate(leave.endDate.split('T')[0]);
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!reason || !startDate || !endDate) {
      setError('Fill all fields for edit.');
      return;
    }
    try {
      await api.put(`/api/leaves/${editLeave._id}`, {
        reason, startDate, endDate
      });
      setEditModalOpen(false);
      fetchLeaves();
    } catch (err) {
      setError('Failed to update leave.');
    }
  };

  const generatePDF = async (leave) => {
    try {
      // Prepare formData for backend
      const formData = {
        userName: leave.userName,
        userId: leave.userId,
        reason: leave.reason,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
        _id: leave._id
      };
  
      // Make a request to the backend PDF generation endpoint
      const response = await api.post('/api/print/generate-leave-application-pdf', formData, {
        responseType: 'text', // Expect HTML response
      });

      const htmlContent = response.data; // HTML content returned from backend

      // Open the HTML content in a new popup window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        // The window.onload in the returned HTML will trigger the print dialog
      } else {
        alert('Popup blocked! Please allow popups for this website.');
      }
    } catch (error) {
      console.error('Error generating leave application PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div onClick={() => window.location.href='/'} className="text-center cursor-pointer mb-4">
        <h2 className="text-base font-bold text-red-600">KK TRADING</h2>
        <p className="text-red-400 text-xs font-bold">All Leave Applications</p>
      </div>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      {deleteMessage && <p className="text-red-600 text-xs mb-2">{deleteMessage}</p>}

      <div className="overflow-x-auto bg-white rounded shadow p-2">
        <table className="w-full text-xs text-red-500">
          <thead className="bg-red-100 text-red-700">
            <tr>
              <th className="py-2 px-2 text-left">Name</th>
              <th className="py-2 px-2 text-left">Reason</th>
              <th className="py-2 px-2 text-left">Start</th>
              <th className="py-2 px-2 text-left">End</th>
              <th className="py-2 px-2 text-left">Status</th>
              <th className="py-2 px-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave._id} className="border-b hover:bg-red-50">
                <td className="py-2 px-2">{leave.userName}</td>
                <td className="py-2 px-2 truncate" style={{maxWidth: '150px'}}>{leave.reason}</td>
                <td className="py-2 px-2">{new Date(leave.startDate).toLocaleDateString()}</td>
                <td className="py-2 px-2">{new Date(leave.endDate).toLocaleDateString()}</td>
                <td className="py-2 px-2 font-bold">
                  {leave.status === 'Pending' && <span className="text-yellow-600">Pending</span>}
                  {leave.status === 'Approved' && <span className="text-red-600">Approved</span>}
                  {leave.status === 'Rejected' && <span className="text-red-600">Rejected</span>}
                </td>
                <td className="py-2 px-2 text-center space-x-2">
                  {userInfo?.isAdmin && leave.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => approveLeave(leave._id)}
                        className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectLeave(leave._id)}
                        className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openEditModal(leave)}
                    className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteLeave(leave._id)}
                    className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => generatePDF(leave)}
                    className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-600"
                  >
                    <i className='fa fa-file' />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-red-800 bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-4 rounded shadow max-w-md w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h2 className="text-sm font-bold mb-2 text-red-700">Edit Leave</h2>
              {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-red-300 rounded p-2 text-xs"
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-red-300 rounded p-2 text-xs"
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-red-300 rounded p-2 text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-600"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllLeavesPage;
