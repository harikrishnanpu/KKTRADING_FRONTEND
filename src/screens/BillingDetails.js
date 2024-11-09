import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from './api';

const BillingList = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);
  const [selectedBillings, setSelectedBillings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const paginateBillings = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return billings?.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(billings.length / itemsPerPage);

  const fetchBillings = async () => {
    try {
      const response = await api.get('/api/billing'); // Replace with your endpoint
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
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.setFont('Helvetica', 'bold');
    doc.text('Invoice', 14, 22);
    doc.setFont('Helvetica', 'normal');

    const invoiceDate = new Date(billing.invoiceDate);
    doc.setFontSize(12);
    doc.text(`Invoice No: ${billing.invoiceNo}`, 14, 40);
    doc.text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Salesman Name: ${billing.salesmanName}`, 14, 60);

    doc.setFontSize(14);
    doc.text('Bill To:', 14, 75);

    doc.setFontSize(12);
    doc.text(`Customer Name: ${billing.customerName}`, 14, 85);
    doc.text(`Customer Address: ${billing.customerAddress}`, 14, 95);

    doc.autoTable({
      head: [['Item ID', 'Name', 'Quantity', 'Price', 'Total']],
      body: billing.products.map((product) => [
        product.item_id || 'N/A',
        product.name || 'N/A',
        product.quantity ? product.quantity.toString() : '0',
        product.price ? product.price.toFixed(2) : '0.00',
        (product.price * product.quantity).toFixed(2),
      ]),
      startY: 105,
      theme: 'striped',
      styles: { overflow: 'linebreak', cellWidth: 'auto', fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
    });

    const total = billing.products.reduce((sum, product) => sum + (product.price * product.quantity || 0), 0);
    const finalY = doc.autoTable.previous.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total: $${total.toFixed(2)}`, 14, finalY);

    doc.save('invoice.pdf');
  };

  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this purchase?')) {
      try {
        await api.delete(`/api/billing/billings/delete/${id}`);
      } catch (error) {
        setError('Error Occurred');
      }
      setBillings(billings.filter((billing) => billing._id !== id));
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


  const renderCard = (billing) => (
    <div key={billing.invoiceNo} className="bg-white rounded-lg shadow-md p-6 mb-4 transition-transform transform hover:scale-102 duration-200">
      <div className="flex justify-between items-center">
        <p onClick={()=> navigate(`/bills/edit/${billing._id}`)} className="text-md cursor-pointer font-bold text-gray-700">{billing.invoiceNo}</p>
        <div className="flex items-center">
          {/* Status Indicator */}
          {billing.deliveryStatus === 'Delivered' && billing.paymentStatus === 'Paid' && (
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
          )}
          {billing.deliveryStatus === 'Delivered' && billing.paymentStatus !== 'Paid' && (
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </div>
          )}
          {billing.deliveryStatus !== 'Delivered' && billing.paymentStatus === 'Paid' && (
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </div>
          )}
          {billing.deliveryStatus !== 'Delivered' && billing.paymentStatus !== 'Paid' && (
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
          )}
        </div>
      </div>
      <p className="text-gray-500 font-bold  text-xs mt-2">Customer: {billing.customerName}</p>
      <p className="text-gray-500 font-bold text-xs mt-1">Salesman: {billing.salesmanName}</p>
      <p className="text-gray-500 font-bold text-xs mt-1">Expected Delivery: {new Date(billing.expectedDeliveryDate).toLocaleDateString()}</p>
      <div className='flex justify-between'>
      <p className="text-gray-500 text-xs font-bold mt-1">Total Products: {billing.products.length}</p>
      <p className="text-gray-400 italic text-xs mt-1">Last Editted: {new Date(billing.updatedAt ? billing.updatedAt : billing.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex mt-4 text-xs space-x-2">
                
      <button onClick={()=> navigate(`/bills/edit/${billing._id}`)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
          <i className="fa fa-pen mr-2"></i> Edit
        </button>
        <button onClick={() => generatePDF(billing)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
          <i className="fa fa-file-pdf-o mr-2"></i> PDF
        </button>
        <button onClick={() => setSelectedBillings(billing)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
          <i className="fa fa-eye mr-2"></i> View
        </button>
        <button onClick={() => handleRemove(billing._id)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
          <i className="fa fa-trash mr-2"></i> Delete
        </button>
      </div>
    </div>
  );
  

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">All Billings Information And Updation</p>
  </div>
  <i className="fa fa-list text-gray-500" />
</div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr className='divide-y'>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-2 py-2">Invoice No</th>
                  <th className="px-2 py-2">Invoice Date</th>
                  <th className="px-2 py-2">Exp. Delivery</th>
                  <th className="px-2 py-2">Salesman Name</th>
                  <th className="px-2 py-2">Customer Name</th>
                  <th className="px-2 py-2">Products</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginateBillings().map((billing) => (
                  <tr key={billing.invoiceNo} className="hover:bg-gray-100 divide-y divide-x">
                    <td className="px-4 py-2 text-center">
 {/* Indicator Dot */}
 {billing.deliveryStatus === 'Delivered' && billing.paymentStatus === 'Paid' && (
    <div className="">
      <span className="relative flex h-3 w-3 mx-auto">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
  )}

  {billing.deliveryStatus === 'Delivered' && billing.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3 mx-auto">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

  {billing.deliveryStatus !== 'Delivered' && billing.paymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3 mx-auto">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

{billing.deliveryStatus !== 'Delivered' && billing.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3 mx-auto">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </div>
  )}
                    </td>
                    <td className="px-2 text-xs font-bold py-2">{billing.invoiceNo}</td>
                    <td className="px-2 text-xs py-2">{new Date(billing.invoiceDate).toLocaleDateString()}</td>
                    <td className="px-4 text-xs py-2">
                      {new Date(billing.expectedDeliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-2 text-xs py-2">{billing.salesmanName}</td>
                    <td className="px-2  text-xs py-2">{billing.customerName}</td>
                    <td className="px-2 text-xs py-2">{billing.products.length}</td>
                    <td className="px-2 text-xs  py-2">
                    <div className="flex mt-4 text-xs space-x-2">
                
                <button onClick={()=> navigate(`/bills/edit/${billing._id}`)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
                    <i className="fa fa-pen mr-2"></i> Edit
                  </button>
                  <button onClick={() => generatePDF(billing)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
                    <i className="fa fa-file-pdf-o mr-2"></i> PDF
                  </button>
                  <button onClick={() => setSelectedBillings(billing)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
                    <i className="fa fa-eye mr-2"></i> View
                  </button>
                  <button onClick={() => handleRemove(billing._id)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
                    <i className="fa fa-trash mr-2"></i> Delete
                  </button>
                </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {paginateBillings().map(renderCard)}
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 text-xs font-bold py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-500"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 text-xs font-bold py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-500"
            >
              Next
            </button>
          </div>
        </>
      )}
        

      {selectedBillings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-5 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <i className="fa fa-times"></i>
            </button>
            <p className="text-md text-gray-700 font-bold mb-2">
              Details for Invoice No. {selectedBillings.invoiceNo}
            </p>
            <p className="text-sm mb-1">
              Salesman Name: <span className="text-gray-700">{selectedBillings.salesmanName}</span>
            </p>
            <p className="text-sm mb-1">
              Customer Name: <span className="text-gray-700">{selectedBillings.customerName}</span>
            </p>
            <p className="text-sm mb-1">
              Invoice Date: <span className="text-gray-700">{new Date(selectedBillings.invoiceDate).toLocaleDateString()}</span>
            </p>
            <p className="text-sm mb-1">
              Delivery Status: <span className="text-gray-700">{selectedBillings.deliveryStatus}</span>
            </p>
            <p className="text-sm mb-1">
              Payment Status: <span className="text-gray-700">{selectedBillings.paymentStatus}</span>
            </p>
            <p className="text-sm mb-1">
              Bill Amount: <span className="text-gray-700">{selectedBillings.billingAmount}</span>
            </p>
            
            <h3 className="text-md font-bold text-red-600 mt-5 ">Products</h3>
            <div className="mx-auto my-8">


<div className="relative overflow-hidden">
    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-4 text-xs py-3">
                    Product
                </th>
                <th scope="col" className="px-2 text-center text-xs py-3">
                  ID
                </th>
                <th scope="col" className="px-2 text-xs py-3">
                  Qty
                </th>
                <th scope="col" className="px-2 text-xs py-3">
                 deliv. Qty
                </th>
                <th scope="col" className="px-2 text-xs py-3">
                  Delivered
                </th>
            </tr>
        </thead>
        <tbody>
          {selectedBillings?.products.map((product,index)=>(
            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" className="px-2 py-4 text-xs font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {product.name.slice(0,7)}...
               </th>
                <td className="px-6 text-center text-xs py-4">
                    {product.item_id}
                </td>
                <td className="px-6 text-xs py-4">
                    {product.quantity}
                </td>
                <td className="px-6 text-center text-xs py-4">
                    {product.deliveredQuantity}
                </td>
                <td className="px-6 text-xs py-4">
                            <input
                              type="checkbox"
                              className="text-green-500 focus:ring-0 focus:outline-0 focus:border-0"
                              checked={product.deliveryStatus === "Delivered"}
                            />
                          </td>
            </tr> 
          ))
}

        </tbody>
    </table>
</div>

  </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillingList;




