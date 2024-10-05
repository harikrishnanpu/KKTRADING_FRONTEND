import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Auto table plugin for jsPDF

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [error, setError] = useState('');
  const [selectedReturn,setSelectedReturn] = useState(null);

  // Fetch all returns from the server
  const fetchReturns = async () => {
    try {
      const { data } = await Axios.get('/api/returns');
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
      try{
         await Axios.delete(`/api/returns/return/delete/${id}`)
      }catch(error){
        setError('Error Occured')
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
              <div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>
    <div className="container mx-auto mt-10">
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg p-6 md:p-6">
        <h2 className="text-md font-bold text-left mb-6 text-red-600">All Returns</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {returns.length === 0 ? (
          <p className="text-gray-600 text-center">No returns found.</p>
        ) : (
          <>
              {/* Table layout for larger screens */}
              <div className="hidden md:block">
              <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Invoice No</th>
                    <th className="px-4 py-2 text-left">Return Date</th>
                    <th className="px-4 py-2 text-left">Return No.</th>
                    <th className="px-4 py-2 text-left">Customer Name</th>
                    <th className="px-4 py-2 text-left">Total Products</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((returnEntry) => (
                    <tr key={returnEntry._id} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">{returnEntry.billingNo}</td>
                      <td className="border px-4 py-2">{new Date(returnEntry.createdAt).toLocaleDateString()}</td>
                      <td className="border px-4 py-2">{returnEntry.returnNo}</td>
                      <td className="border px-4 py-2">{returnEntry.customerName}</td>
                      <td className="border px-4 py-2">{returnEntry.products.length}</td>
                      <td className="border px-4 py-2">
                      <div className="mt-4 flex justify-between text-right">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generateReturnPDF(returnEntry)}
                    >
                      View PDF
                    </button>
                    <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleView(returnEntry)}
                  >
                    <i className="fa fa-eye mr-2"></i> View
                  </button>
                  <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleRemove(returnEntry._id)}
                  >
                    <i className="fa fa-trash mr-2"></i> Remove
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
                <div key={returnEntry.returnNo} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">
                    Return No: {returnEntry.returnNo}
                  </h3>
                  <p className="text-sm mb-1">Return Date: {new Date(returnEntry.returnDate).toLocaleDateString()}</p>
                  <p className="text-sm mb-1">Customer: {returnEntry.customerName}</p>
                  <p className="text-sm font-semibold mb-2">Products:</p>
                  <ul className="pl-4 list-disc text-sm">
                    {returnEntry.products.map((product) => (
                      <>
                      <li key={product.item_id}>
                        {product.name} (Qty: {product.quantity})
                      </li>
                      <p className='font-bold'>....</p>
                    </>
                    )).slice(0,1)}
                  </ul>
                  <div className="mt-4 flex justify-between text-right">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generateReturnPDF(returnEntry)}
                    >
                      View PDF
                    </button>
                    <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleView(returnEntry)}
                  >
                    <i className="fa fa-eye mr-2"></i> View
                  </button>
                  <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleRemove(returnEntry._id)}
                  >
                    <i className="fa fa-trash mr-2"></i> Remove
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
            <button 
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={closeModal}
            >
              <i className="fa fa-times"></i>
            </button>

            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Return Details</h2>
            <p><strong>Customer Name:</strong> {selectedReturn.customerName}</p>
            <p><strong>Return No.:</strong> {selectedReturn.returnNo}</p>
            <p><strong>Return Date:</strong> {new Date(selectedReturn.returnDate).toLocaleDateString()}</p>
            <p><strong>Invoice No:</strong> {selectedReturn.billingNo}</p>
            <p><strong>Customer Address:</strong> {selectedReturn.customerAddress}</p>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Items:</h3>
              <ul className="list-inside list-[square] ml-5">
                {selectedReturn.products.map((item, index) => (
                  <>
                  <li key={index} className="text-gray-600 flex">
                    <span class="bg-golden-gradient bg-clip-text text-transparent">Test1</span>
                  </li>
                  <li className='flex '>
                  <p className='text-sm'>{item.name} </p> 
                  <p className='text-sm font-bold'> - {item.itemId} </p>
                  <p className='text-sm'> -- {item.quantity} Nos</p>
                  </li>
                  </>
                ))}
              </ul>
            </div>

            <button 
              className="mt-6 w-full bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition duration-150"
              onClick={closeModal}
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
