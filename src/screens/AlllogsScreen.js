import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          {parsedDetails.params && <p><strong>Parameters:</strong> {Object.entries(parsedDetails.params).map(([key, value]) => `${key}: ${value}`).join(', ')}</p>}
          {parsedDetails.query && <p><strong>Query:</strong> {Object.entries(parsedDetails.query).map(([key, value]) => `${key}: ${value}`).join(', ')}</p>}
          {parsedDetails.body && <p><strong>Body:</strong> {Object.entries(parsedDetails.body).map(([key, value]) => `${key}: ${value}`).join(', ')}</p>}
        </div>
      );
    } catch {
      return details;
    }
  };

  const formatAction = (action) => {
    if (action.includes('/api/billing/')) {
      const billId = action.split('/').pop();
      return `A bill was Updated. Bill ID: ${billId}`;
    } else if (action.includes('/api/billing')) {
      return 'A new bill was Updated.';
    } else if (action.includes('/api/orders/')) {
      const orderId = action.split('/').pop();
      return `An order was Updated. Order ID: ${orderId}`;
    } else if (action.includes('/api/products/')) {
      const productId = action.split('/').pop();
      return `A product was updated. Product ID: ${productId}`;
    }
    return action;
  };

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => { navigate('/'); }} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">All Logs and Users Tracking</p>
        </div>
        <i onClick={()=> {
           api.post('/api/users/alllogs/all')
           .then(() => {
            alert('All Logs Deleted')
              navigate(0)
            });
            }} className="fa fa-trash cursor-pointer text-red-500" />
      </div>

      {/* Logs Section */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-lg font-semibold">Loading logs...</p>
        ) : error ? (
          <p className="text-center text-lg font-semibold text-red-600">{error}</p>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-sm text-gray-600 text-right font-bold mb-6">Activity Logs</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-4 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    <th className="px-4 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                    <th className="px-4 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 flex mt-5 border-b border-gray-200 text-xs">
                        <i className="fa fa-user text-red-500 mr-2" /> {log?.username || 'Unknown User'}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 text-xs">
                        <i className="fa fa-info-circle text-red-500 mr-2" /> {formatAction(log.action)}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 text-xs">
                        {formatDetails(log.details.slice(25,50))}
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
    </div>
  );
}
