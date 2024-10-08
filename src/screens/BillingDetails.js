import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BillingList = () => {
  const [billings, setBillings] = useState([]);
  const [selectedBillings, setSelectedBillings] = useState(null);  // For modal details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all billings from the backend
  const fetchBillings = async () => {
    try {
      const response = await Axios.get('/api/billing'); // Replace with your endpoint
      setBillings(response.data);
    } catch (err) {
      setError('Failed to fetch billings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const generatePDF = (billing) => {
    const doc = new jsPDF();

    // Set title with color and bold font
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204); // Set color to a shade of blue
    doc.setFont("Helvetica", "bold"); // Set font to bold
    doc.text('Invoice', 14, 22);

    // Reset font style for other texts
    doc.setFont("Helvetica", "normal"); // Reset to normal

    // Convert invoiceDate to Date object if it's a string
    const invoiceDate = new Date(billing.invoiceDate);

    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice No: ${billing.invoiceNo}`, 14, 40);
    doc.text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Salesman Name: ${billing.salesmanName}`, 14, 60);

    // Add Billing To Section
    doc.setFontSize(14);
    doc.text('Bill To:', 14, 75);

    doc.setFontSize(12);
    doc.text(`Customer Name: ${billing.customerName}`, 14, 85);
    doc.text(`Customer Address: ${billing.customerAddress}`, 14, 95);

    // Start table for products
    doc.autoTable({
      head: [['Item ID', 'Name', 'Quantity', 'Price', 'Total']],
      body: billing.products.map(product => [
        product.item_id || 'N/A',
        product.name || 'N/A',
        product.quantity ? product.quantity.toString() : '0',
        product.price ? product.price.toFixed(2) : '0.00',
        (product.price * product.quantity).toFixed(2) // Total price
      ]),
      startY: 105, // Position the table after invoice details
      theme: 'striped', // Optional: adds a striped theme to the table
      styles: {
        overflow: 'linebreak', // Allow line breaks
        cellWidth: 'auto', // Automatically adjust cell width
        fontSize: 10, // Adjust font size as needed
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Set specific widths for columns if needed
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
    });

    // Calculate total
    const total = billing.products.reduce((sum, product) => {
      return sum + (product.price * product.quantity || 0);
    }, 0);

    // Add Total Section
    const finalY = doc.autoTable.previous.finalY + 10; // Positioning based on previous table
    doc.setFontSize(12);
    doc.text(`Total: $${total.toFixed(2)}`, 14, finalY); // Add total amount

    // Finalize the PDF and download
    doc.save('invoice.pdf'); // Download the PDF
  };


  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this purchase?')) {
      try{
         await Axios.delete(`/api/billing/billings/delete/${id}`)
      }catch(error){
        setError('Error Occured')
      }
      setBillings(billings.filter(billing => billing._id !== id));
    }
  };

  const handleView = (billing) => {
    setSelectedBillings(billing);
  };

  const closeModal = () => {
    setSelectedBillings(null);
  };

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <>
      <div className="container mx-auto p-6">
      <div className='flex justify-between'>
      <a href='/' className='font-bold left-4 text-blue-500'><i className='fa fa-angle-left' /> Back</a>
      <h2 className='text-2xl font-bold text-red-600 '>KK TRADING</h2>
      </div>
        <p className='font-bold text-lg lg:text-center mb-5'>All Billings</p>
        {billings.length === 0 ? (
          <p className="text-center text-gray-600">No billing records found.</p>
        ) : (
          <>
            {/* Table layout for larger screens */}
            <div className="hidden md:block">
              <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-200">
                  <tr>
                  <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Invoice No</th>
                    <th className="px-4 py-2 text-left">Exp. Delivery</th>
                    <th className="px-4 py-2 text-left">Salesman Name</th>
                    <th className="px-4 py-2 text-left">Customer Name</th>
                    <th className="px-4 py-2 text-left">Total Products</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billings.map((billing) => (
                    <tr key={billing.invoiceNo} className="hover:bg-gray-100">
                      <td className="border text-center mx-auto px-4 py-2">

 {/* Indicator Dot */}
 {billing.deliveryStatus === 'Delivered' && billing.paymentStatus === 'Paid' && (
    <div className="ml-5">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
  )}

  {billing.deliveryStatus === 'Delivered' && billing.paymentStatus !== 'Paid' && (
    <div className="ml-5">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

  {billing.deliveryStatus !== 'Delivered' && billing.paymentStatus === 'Paid' && (
    <div className="ml-5">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

{billing.deliveryStatus !== 'Delivered' && billing.paymentStatus !== 'Paid' && (
    <div className="ml-5">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </div>
  )}


                      </td>
                      <td className="border px-4 py-2">{billing.invoiceNo}</td>
                      <td className="border px-4 py-2">{new Date(billing.expectedDeliveryDate).toLocaleDateString()}</td>
                      <td className="border px-4 py-2">{billing.salesmanName}</td>
                      <td className="border px-4 py-2">{billing.customerName}</td>
                      <td className="border px-4 py-2">{billing.products.length}</td>
                      <td className="border px-4 py-2">
                      <div className="mt-4 flex justify-between text-right">
                    <button
                      className="bg-red-500 mr-2 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generatePDF(billing)}
                    >
                      PDF
                    </button>
                    <button 
                    className="bg-red-500 mr-2 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleView(billing)}
                  >
                    <i className="text-center fa fa-eye "></i> 
                  </button>
                  <button 
                    className="bg-red-500 mr-2 text-white px-2 py-1 text-center rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleRemove(billing._id)}
                  >
                    <i className="text-center fa fa-trash"></i>
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
              {billings.map((billing) => (
                <div key={billing.invoiceNo} className="bg-white p-4 rounded-lg shadow-md">
                  <div className='flex justify-between'>
                  <h3 className="text-lg font-semibold text-red-600 mb-2">
                    Invoice No: {billing.invoiceNo}
                  </h3>

                   {/* Indicator Dot */}
  {billing.deliveryStatus === 'Delivered' && billing.paymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
  )}

  {billing.deliveryStatus === 'Delivered' && billing.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

  {billing.deliveryStatus !== 'Delivered' && billing.paymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

{billing.deliveryStatus !== 'Delivered' && billing.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </div>
  )}

                  </div>

                  <p className="text-sm mb-1">Invoice Date: {new Date(billing.invoiceDate).toLocaleDateString()}</p>
                  <p className="text-sm mb-1">Customer: {billing.customerName}</p>
                  <p className={`text-sm mb-1 ${billing.deliveryStatus === 'Delivered' ? 'text-green-500' : 'text-yellow-600'}`}>Delivery Status: {billing.deliveryStatus}</p>
                  <p className={`text-sm mb-1 ${billing.paymentStatus === 'Paid' ? 'text-green-500' : 'text-yellow-600'}`}>Payment: {billing.paymentStatus}</p>
                  <p className="text-sm font-semibold mb-2">Products:</p>
                  <ul className="pl-4 list-disc text-sm text-gray-600">
                    {billing.products.map((product) => (
                      <li key={product.item_id}>
                        {product.name} (Qty: {product.quantity})
                      </li>
                    )).slice(0,1)}
                    <p className='font-bold'>...</p>
                  </ul>
                  <div className="mt-4 text-right">
                  <div className="mt-4 flex justify-between text-right">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generatePDF(billing)}
                    >
                      View PDF
                    </button>
                    <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleView(billing)}
                  >
                    <i className="fa fa-eye mr-2"></i> View
                  </button>
                  <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleRemove(billing._id)}
                  >
                    <i className="fa fa-trash mr-2"></i> Remove
                  </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>


        {/* Modal for Viewing Details */}
        {selectedBillings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
            <button 
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={closeModal}
            >
              <i className="fa fa-times"></i>
            </button>

            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Billing Details</h2>
            <p className="text-sm font-bold mb-1">Invoice no: {selectedBillings.invoiceNo}</p>
            <p className="text-sm mb-1">salesman name: {selectedBillings.salesmanName}</p>
            <p className="text-sm mb-1">Customer: {selectedBillings.customerName}</p>
            <p className="text-sm mb-1">Address: {selectedBillings.customerAddress}</p>
            <p className="text-sm mb-1">Expected Delivery Date: {new Date(selectedBillings.expectedDeliveryDate).toLocaleDateString()}</p>
            <p className="text-sm mb-1">Invoice Date: {new Date(selectedBillings.invoiceDate).toLocaleDateString()}</p>
            <p className={`text-sm mb-1 ${selectedBillings.deliveryStatus === 'Delivered' ? 'text-green-500' : 'text-yellow-600'}`}>Delivery Status: {selectedBillings.deliveryStatus}</p>
            <p className={`text-sm mb-1 ${selectedBillings.paymentStatus === 'Paid' ? 'text-green-500' : 'text-yellow-600'}`}>Payment: {selectedBillings.paymentStatus}</p>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Items:</h3>
              <ul className="list-inside list-[square] ml-5">
                {selectedBillings.products.map((item, index) => (
                  <>
                  <li key={index} className='flex'>
                  <p className='text-sm'>{item.name} </p> 
                  <p className='text-sm font-bold'> - {item.item_id} - </p>
                  <p className='text-sm'>{item.quantity} Nos</p>
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
    </>
  );
};

export default BillingList;
