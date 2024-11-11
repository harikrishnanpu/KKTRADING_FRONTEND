import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import Modal from 'react-modal';

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/api/users/alllogs/all');
        setLogs(data);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch logs');
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDetails = (details) => {
    try {
      const parsedDetails = JSON.parse(details);
      return (
        <div>
          {parsedDetails.params && (
            <p>
              <strong>Parameters:</strong>{' '}
              {Object.entries(parsedDetails.params)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </p>
          )}
          {parsedDetails.query && (
            <p>
              <strong>Query:</strong>{' '}
              {Object.entries(parsedDetails.query)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </p>
          )}
          {parsedDetails.body && (
            <p>
              <strong>Body:</strong>{' '}
              {Object.entries(parsedDetails.body)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join(', ')}
            </p>
          )}
        </div>
      );
    } catch {
      return <p>{details}</p>;
    }
  };

  const formatAction = (action) => {
    // Map of API endpoints to human-readable messages
    const actionMap = [
      // Billing actions
      { pattern: /^POST \/api\/billing\/create$/, message: 'Created a new billing entry' },
      { pattern: /^POST \/api\/billing\/edit\/(.+)$/, message: 'Edited a billing entry' },
      { pattern: /^GET \/api\/billing\/$/, message: 'Fetched all billing entries' },
      { pattern: /^GET \/api\/billing\/(.+)$/, message: 'Fetched billing details' },
      { pattern: /^DELETE \/api\/billing\/(.+)$/, message: 'Deleted a billing entry' },
      // Product actions
      { pattern: /^GET \/api\/products\/$/, message: 'Fetched products list' },
      { pattern: /^POST \/api\/products\/$/, message: 'Created a new product' },
      { pattern: /^PUT \/api\/products\/(.+)$/, message: 'Updated a product' },
      { pattern: /^DELETE \/api\/products\/(.+)$/, message: 'Deleted a product' },
      // Return actions
      { pattern: /^POST \/api\/returns\/create$/, message: 'Created a new return' },
      { pattern: /^DELETE \/api\/returns\/delete\/(.+)$/, message: 'Deleted a return' },
      // User actions
      { pattern: /^POST \/api\/users\/signin$/, message: 'User signed in' },
      { pattern: /^POST \/api\/users\/register$/, message: 'User registered' },
      { pattern: /^PUT \/api\/users\/(.+)$/, message: 'Updated user profile' },
      { pattern: /^DELETE \/api\/users\/(.+)$/, message: 'Deleted a user' },
      // Additional mappings can be added here
      { pattern: /^POST \/api\/users\/billing\/start-delivery/, message: 'Delivery Started' },
      { pattern: /^POST \/api\/users\/billing\/end-delivery/, message: 'Delivery Updated ( Submitted)' },

    ];

    for (const entry of actionMap) {
      const match = action.match(entry.pattern);
      if (match) {
        // if (match[1]) {
        //   return `${entry.message} (ID: ${match[1]})`;
        // }
        return entry.message;
      }
    }

    // Default action if no pattern matches
    return action;
  };

  const openModal = (details) => {
    setSelectedLogDetails(details);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedLogDetails(null);
  };

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div
          onClick={() => {
            navigate('/');
          }}
          className="text-center cursor-pointer"
        >
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            All Logs and Users Tracking
          </p>
        </div>
        <i
          onClick={() => {
            api.post('/api/users/alllogs/all').then(() => {
              alert('All Logs Deleted');
              navigate(0);
            });
          }}
          className="fa fa-trash cursor-pointer text-red-500"
        />
      </div>

      {/* Logs Section */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-lg font-semibold">Loading logs...</p>
        ) : error ? (
          <p className="text-center text-lg font-semibold text-red-600">
            {error}
          </p>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-sm text-gray-600 text-right font-bold mb-6">
              Activity Logs
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">
                      User
                    </th>
                    <th className="px-4 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">
                      Action
                    </th>
                    <th className="px-4 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">
                      Details
                    </th>
                    <th className="px-4 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openModal(log.details)}
                    >
                      <td className="px-4 py-2 flex mt-5 border-b border-gray-200 text-xs">
                        <i className="fa fa-user text-red-500 mr-2" />{' '}
                        {log?.username || 'Unknown User'}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 text-xs">
                        <i className="fa fa-info-circle text-red-500 mr-2" />{' '}
                        {formatAction(log.action)}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 text-xs">
                        {/* Show a preview or a button to view details */}
                        <button className="text-blue-500 underline">
                          View Details
                        </button>
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal for displaying details */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Log Details"
        ariaHideApp={false}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2 className="text-lg font-semibold mb-4">Log Details</h2>
        {selectedLogDetails && formatDetails(selectedLogDetails)}
        <button
          onClick={closeModal}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
        >
          Close
        </button>
      </Modal>
    </div>
  );
}
