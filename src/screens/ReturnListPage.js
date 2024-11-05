import React, { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from './api';

export default function ReturnListingScreen() {
  const [returns, setReturns] = useState([]);
  const [error, setError] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Fetch all returns from the server
  const fetchReturns = async () => {
    try {
      const { data } = await api.get('/api/returns');
      setReturns(data);
    } catch (err) {
      setError('Error fetching returns data');
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // Function to generate PDF of a specific return
  const generateReturnPDF = (returnData) => {
    const doc = new jsPDF();

    // Set title with color and bold font
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204); // Set color to a shade of red
    doc.setFont("Helvetica", "bold"); // Set font to bold
    doc.text('Return Bill', 14, 22);

    // Reset font style for other texts
    doc.setFont("Helvetica", "normal");

    // Convert returnDate to Date object if it's a string
    const returnDate = new Date(returnData.returnDate);

    // Add return details
    doc.setFontSize(12);
    doc.text(`Return No: ${returnData.returnNo}`, 14, 40);
    doc.text(`Return Date: ${returnDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Customer Name: ${returnData.customerName}`, 14, 60);

    // Add "Returned Products" section
    doc.setFontSize(14);
    doc.text('Returned Products:', 14, 75);

    // Table for Returned Products
    doc.autoTable({
      head: [['Item ID', 'Product Name', 'Quantity', 'Price per Unit', 'Total']],
      body: returnData.products.map(product => [
        product.item_id || 'N/A',
        product.name || 'N/A',
        product.quantity ? product.quantity.toString() : '0',
        `$${product.price ? product.price.toFixed(2) : '0.00'}`,
        `$${(product.price * product.quantity).toFixed(2)}`
      ]),
      startY: 85, 
      theme: 'striped',
      styles: {
        cellPadding: 4,
        fontSize: 10,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });

    const totalReturnValue = returnData.products.reduce((sum, product) => sum + (product.price * product.quantity || 0), 0);
    const finalY = doc.autoTable.previous.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Return Value: $${totalReturnValue.toFixed(2)}`, 14, finalY);
    doc.save(`Return_${returnData.returnNo}.pdf`);
  };

  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this returnEntry?')) {
      try {
        await api.delete(`/api/returns/return/delete/${id}`);
      } catch (error) {
        setError('Error Occurred');
      }
      setReturns(returns.filter(returnEntry => returnEntry._id !== id));
    }
  };

  const handleView = (returnEntry) => {
    setSelectedReturn(returnEntry);
  };

  const closeModal = () => {
    setSelectedReturn(null);
  };

  return (
    <div>
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => { window.history.back(); }} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Return Listing and Management</p>
        </div>
        <i className="fa fa-undo text-gray-500" />
      </div>

      <div className="container mx-auto mt-10">
        <div className="max-w-full mx-auto bg-white rounded-lg p-4">
          {error && <p className="text-red-500 text-center">{error}</p>}

          {returns.length === 0 ? (
            <p className="text-gray-600 text-center">No returns found.</p>
          ) : (
            <>
              {/* Table layout for larger screens */}
              <div className="hidden md:block">
                <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Invoice No</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Return Date</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Return No.</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Customer Name</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Total Products</th>
                      <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody >
                    {returns.map((returnEntry) => (
                      <tr key={returnEntry._id} className="hover:bg-gray-50 transition">
                        <td className="border-t font-bold text-xs px-4 py-2 text-gray-600">{returnEntry.billingNo}</td>
                        <td className="border-t text-xs px-4 py-2 text-gray-600">{new Date(returnEntry.createdAt).toLocaleDateString()}</td>
                        <td className="border-t text-xs px-4 py-2 text-gray-600">{returnEntry.returnNo}</td>
                        <td className="border-t text-xs px-4 py-2 text-gray-600">{returnEntry.customerName}</td>
                        <td className="border-t text-xs px-4 py-2 text-gray-600">{returnEntry.products.length}</td>
                        <td className="border-t px-4 py-2">
                          <div className="flex text-xs space-x-2">
                            <button
                              className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                              onClick={() => generateReturnPDF(returnEntry)}
                            >
                              <i className="fa fa-file-pdf-o mr-1"></i> PDF
                            </button>
                            <button
                              className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                              onClick={() => handleView(returnEntry)}
                            >
                              <i className="fa fa-eye mr-1"></i> View
                            </button>
                            <button
                              className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                              onClick={() => handleRemove(returnEntry._id)}
                            >
                              <i className="fa fa-trash mr-1"></i> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card layout for mobile screens */}
              <div className="md:hidden space-y-4">
                {returns.map((returnEntry) => (
                  <div key={returnEntry.returnNo} className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-sm font-bold text-red-600 mb-2">
                      Return No: {returnEntry.returnNo}
                    </h3>
                    <p className="text-xs font-bold mb-1 text-gray-500">Return Date: {new Date(returnEntry.returnDate).toLocaleDateString()}</p>
                    <p className="text-xs font-bold mb-1 text-gray-500">Customer: {returnEntry.customerName}</p>
                    <div className="mt-4 text-xs font-bold flex space-x-2">
                      <button
                        className="flex-grow font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => generateReturnPDF(returnEntry)}
                      >
                        <i className="fa fa-file-pdf-o mr-1"></i> PDF
                      </button>
                      <button
                        className="flex-grow font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleView(returnEntry)}
                      >
                        <i className="fa fa-eye mr-1"></i> View
                      </button>
                      <button
                        className="flex-grow bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleRemove(returnEntry._id)}
                      >
                        <i className="fa fa-trash mr-1"></i> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal for Viewing Details */}
        {selectedReturn && (
          <div className="fixed p-4 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                onClick={closeModal}
              >
                <i className="fa fa-times"></i>
              </button>

              <h2 className="text-sm font-semibold mb-4 text-gray-800">Return Details</h2>
              <p className='text-xs mt-1'><strong>Customer Name:</strong> {selectedReturn.customerName}</p>
              <p className='text-xs mt-1'><strong>Return No.:</strong> {selectedReturn.returnNo}</p>
              <p className='text-xs mt-1'><strong>Return Date:</strong> {new Date(selectedReturn.returnDate).toLocaleDateString()}</p>
              <p className='text-xs mt-1'><strong>Invoice No:</strong> {selectedReturn.billingNo}</p>
              <p className='text-xs mt-1'><strong>Customer Address:</strong> {selectedReturn.customerAddress}</p>
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-800 mb-3">All Items:</h3>
                <table className="min-w-full rounded-lg bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-xs font-semibold text-gray-700">Item ID</th>
                      <th className="py-2 px-4 text-xs font-semibold text-gray-700">Name</th>
                      <th className="py-2 px-4 text-xs font-semibold text-gray-700">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReturn.products.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2 px-4 text-xs text-gray-600">{item.item_id}</td>
                        <td className="py-2 px-4 text-xs text-gray-600">{item.name}</td>
                        <td className="py-2 px-4 text-xs text-gray-600">{item.quantity} Nos</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
