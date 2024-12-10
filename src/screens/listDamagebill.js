import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from './api';

export default function DamagedDataScreen() {
  const [damagedData, setDamagedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchDamagedData = async () => {
      try {
        const { data } = await api.get('/api/returns/damage/getDamagedData');
        setDamagedData(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching damaged data');
        setLoading(false);
        console.error('Error fetching damaged data', err);
      }
    };

    fetchDamagedData();
  }, []);

  const handleRemove = async (damageId, itemId) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      try {
        await api.delete(`/api/returns/damage/delete/${damageId}/${itemId}`);
        // Update the state after removing
        setDamagedData(damagedData.map(damage => {
          if (damage._id === damageId) {
            return {
              ...damage,
              damagedItems: damage.damagedItems.filter(item => item.item_id !== itemId),
            };
          }
          return damage;
        }));
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
        // Refresh the data to reflect the changes
        const { data } = await api.get('/api/returns/damage/getDamagedData');
        setDamagedData(data);
      } catch (err) {
        setError('Error removing the damaged item');
        console.error(err);
      }
    }
  };

  const generatePDF = (damage) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204); // red color
    doc.setFont('Helvetica', 'bold');
    doc.text('Damaged Items Report', 14, 22);

    // Reset font for content
    doc.setFont('Helvetica', 'normal');
    
    const reportDate = new Date(damage.createdAt);

    // Details
    doc.setFontSize(12);
    doc.text(`Report Date: ${reportDate.toLocaleDateString()}`, 14, 40);
    doc.text(`Reported By: ${damage.userName}`, 14, 50);
    doc.text(`Remark: ${damage.remark}`, 14, 60);

    // Damaged items table
    doc.autoTable({
      head: [['Item ID', 'Name', 'Quantity', 'Price']],
      body: damage.damagedItems.map(item => [
        item.item_id || 'N/A',
        item.name || 'N/A',
        item.quantity ? item.quantity.toString() : '0',
        item.price ? `$${item.price.toFixed(2)}` : 'N/A',
      ]),
      startY: 70, // start the table below the details
      theme: 'striped',
      styles: { fontSize: 10 },
    });

    // Total number of damaged items
    const totalItems = damage.damagedItems.reduce((sum, item) => sum + item.quantity, 0);
    const finalY = doc.autoTable.previous.finalY + 10; // Position after the table

    doc.text(`Total Damaged Items: ${totalItems}`, 14, finalY);

    // Download the PDF
    doc.save(`Damaged_Report_${damage._id}.pdf`);
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => { window.history.back(); }} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Damaged Items Overview</p>
        </div>
        <i className="fa fa-undo text-gray-500" />
      </div>
    
      <div className="container mx-auto mt-10">
        <div className="max-w-full mx-auto bg-white rounded-lg p-4">
          {error && <p className="text-red-500 text-center">{error}</p>}
          {showSuccessMessage && (
            <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 bg-green-500 text-white px-4 py-2 rounded shadow-md">
              Damaged item successfully removed
            </div>
          )}

          {damagedData.length === 0 ? (
            <p className="text-gray-600 text-center">No damaged items found.</p>
          ) : (
            <>
              {/* Table layout for larger screens */}
              <div className="hidden md:block">
                <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Item ID</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Item Name</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Remark</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Quantity</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Price</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {damagedData.map((damage) =>
                      damage.damagedItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="border-t font-bold text-xs px-4 py-2 text-gray-600">{item.item_id}</td>
                          <td className="border-t text-xs px-4 py-2 text-gray-600">{item.name}</td>
                          <td className="border-t text-xs px-4 py-2 text-gray-600">{damage.remark}</td>
                          <td className="border-t text-xs px-4 py-2 text-gray-600">{item.quantity}</td>
                          <td className="border-t text-xs px-4 py-2 text-gray-600">{item.price ? `${item.price.toFixed(2)}` : 'N/A'}</td>
                          <td className="border-t px-4 py-2">
                            <div className="flex text-xs space-x-2">
                              <button
                                className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                                onClick={() => generatePDF(damage)}
                              >
                                <i className="fa fa-file-pdf-o mr-1"></i> PDF
                              </button>
                              <button
                                className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                                onClick={() => handleViewDetails(item)}
                              >
                                <i className="fa fa-eye mr-1"></i> View
                              </button>
                              <button
                                className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                                onClick={() => handleRemove(damage._id, item.item_id)}
                              >
                                <i className="fa fa-trash mr-1"></i> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Card layout for mobile screens */}
              <div className="md:hidden space-y-4">
                {damagedData.map((damage) =>
                  damage.damagedItems.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                      <h3 className="text-sm font-bold text-red-600 mb-2">{item.name}</h3>
                      <h3 className="text-sm font-bold text-red-600 mb-2">{damage.remark}</h3>
                      <p className='text-xs font-bold mb-1 text-gray-500'><strong>Item ID:</strong> {item.item_id}</p>
                      <p className='text-xs font-bold mb-1 text-gray-500'><strong>Quantity:</strong> {item.quantity}</p>
                      <p className='text-xs font-bold mb-1 text-gray-500'><strong>Biller Name:</strong> {damage.userName}</p>
                      <p className='text-xs font-bold mb-1 text-gray-500'><strong>Price:</strong> {item.price ? `$${item.price.toFixed(2)}` : 'N/A'}</p>
                      <div className="mt-4 text-xs font-bold flex space-x-2">
                        <button
                          className="flex-grow font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                          onClick={() => generatePDF(damage)}
                        >
                          <i className="fa fa-file-pdf-o mr-1"></i> PDF
                        </button>
                        <button
                          className="flex-grow font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                          onClick={() => handleViewDetails(item)}
                        >
                          <i className="fa fa-eye mr-1"></i> View
                        </button>
                        <button
                          className="flex-grow bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                          onClick={() => handleRemove(damage._id, item.item_id)}
                        >
                          <i className="fa fa-trash mr-1"></i> Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* View Modal */}
        {selectedItem && (
          <div className="fixed p-4 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                onClick={() => setSelectedItem(null)}
              >
                <i className="fa fa-times"></i>
              </button>

              <h2 className="text-sm font-bold mb-4">Item Details</h2>
              <p className='text-xs mt-1'><strong>Item ID:</strong> {selectedItem.item_id}</p>
              <p className='text-xs mt-1'><strong>Item ID:</strong> {selectedItem.item_id}</p>
              <p className='text-xs mt-1'><strong>Name:</strong> {selectedItem.name}</p>
              <p className='text-xs mt-1'><strong>Quantity:</strong> {selectedItem.quantity}</p>
              <p className='text-xs mt-1'><strong>Count In Stock:</strong> {selectedItem.count}</p>
              <p className='text-xs mt-1'><strong>Price:</strong> {selectedItem.price ? `$${selectedItem.price.toFixed(2)}` : 'N/A'}</p>
            
            </div>
          </div>
        )}
      </div>
    </div>
  );
}