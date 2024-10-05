import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DamagedDataScreen() {
  const [damagedData, setDamagedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchDamagedData = async () => {
      try {
        const { data } = await Axios.get('/api/returns/damage/getDamagedData');
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
        await Axios.delete(`/api/returns/damage/delete/${damageId}`);
        // Update the state after removing
        setDamagedData(damagedData.filter(damage => damage._id !== damageId));
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
    doc.setTextColor(0, 102, 204); // blue color
    doc.setFont('Helvetica', 'bold');
    doc.text('Damaged Items Report', 14, 22);

    // Reset font for content
    doc.setFont('Helvetica', 'normal');
    
    const reportDate = new Date(damage.createdAt);

    // Details
    doc.setFontSize(12);
    doc.text(`Report Date: ${reportDate.toLocaleDateString()}`, 14, 40);
    doc.text(`Reported By: ${damage.userName}`, 14, 50);

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
      <div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>
    
    <div className="container mx-auto p-6">

      <h2 className="text-lg font-extrabold text-left text-gray-800 mb-8">
        Damaged Items Overview
      </h2>

      {/* Table layout for larger screens */}
      <div className="hidden lg:block">
        <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Item ID</th>
              <th className="px-4 py-2 text-left">Item Name</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {damagedData.map(damage => (
              damage.damagedItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border px-4 py-2">{item.item_id}</td>
                  <td className="border px-4 py-2">{item.name}</td>
                  <td className="border px-4 py-2">{item.quantity}</td>
                  <td className="border px-4 py-2">{item.price ? `$${item.price.toFixed(2)}` : 'N/A'}</td>
                  <td className="border px-4 py-2 flex space-x-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition duration-300"
                      onClick={() => handleViewDetails(item)}
                    >
                      View
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generatePDF(damage)}
                    >
                      PDF
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => handleRemove(damage._id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-4">
        {damagedData.map((damage) => (
          damage.damagedItems.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-md font-semibold text-gray-800 mb-2">{item.name}</h3>
              <p className='text-sm'><strong>Item ID:</strong> {item.item_id}</p>
              <p className='text-sm'><strong>Quantity:</strong> {item.quantity}</p>
              <p className='text-sm'><strong>Biller Name:</strong> {damage.userName}</p>
              <p className='text-sm'><strong>Price:</strong> {item.price ? `$${item.price.toFixed(2)}` : 'N/A'}</p>
              <div className="mt-4 flex justify-between text-right">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generatePDF(damage)}
                    >
                      View PDF
                    </button>
                    <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleViewDetails(damage)}
                  >
                    <i className="fa fa-eye mr-2"></i> View
                  </button>
                  <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleRemove(damage._id)}
                  >
                    <i className="fa fa-trash mr-2"></i> Remove
                  </button>
                  </div>
            </div>
          ))
        ))}
      </div>

      {/* View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold mb-4">Item Details</h3>
            <p><strong>Item ID:</strong> {selectedItem.item_id}</p>
            <p><strong>Name:</strong> {selectedItem.name}</p>
            <p><strong>Quantity:</strong> {selectedItem.quantity}</p>
            <p><strong>Price:</strong> {selectedItem.price ? `$${selectedItem.price.toFixed(2)}` : 'N/A'}</p>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
