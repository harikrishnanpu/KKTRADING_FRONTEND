import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';

const BillingList = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);
  const [selectedBillings, setSelectedBillings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

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

  const generatePDF = async (bill) => {
    setLoading(true);

    const cgst = (((parseFloat(bill.billingAmount) - parseFloat(bill.billingAmount / 1.18 ))) / 2 ).toFixed(2);
    const sgst = (((parseFloat(bill.billingAmount) - parseFloat(bill.billingAmount / 1.18 ))) / 2 ).toFixed(2);
    const discount = bill.discount || 0;
    const subTotal = (parseFloat(bill.billingAmount) - parseFloat(cgst + sgst)).toFixed(2);

    const formData = {
      invoiceNo: bill.invoiceNo,
      customerName: bill.customerName,
      customerAddress: bill.customerAddress,
      customerContactNumber: bill.customerContactNumber,
      marketedBy: bill.marketedBy,
      salesmanName: bill.salesmanName,
      invoiceDate: bill.invoiceDate,
      expectedDeliveryDate: bill.expectedDeliveryDate,
      deliveryStatus: bill.deliveryStatus,
      paymentStatus: bill.paymentStatus,
      paymentAmount: bill.billingAmountReceived,
      subTotal,
      cgst,
      sgst,
      discount,
      products: bill.products,
      billingAmount: bill.billingAmount
    }



    try {
      const response = await api.post('https://kktrading-backend.vercel.app/generate-pdf',formData , {
        responseType: 'blob'
      });
  
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Invoice_${bill.invoiceNo}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating invoice:', error);
    }finally {
      setLoading(false);
    }
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
        <p onClick={()=> navigate(`/driver/${billing._id}`)} className="text-md cursor-pointer font-bold text-gray-600">{billing.invoiceNo}</p>
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
      <p className="text-gray-500 text-xs mt-2">Customer: {billing.customerName}</p>
      <p className="text-gray-500 text-xs mt-1">Salesman: {billing.salesmanName}</p>
      <p className="text-gray-500 text-xs mt-1">Expected Delivery: {new Date(billing.expectedDeliveryDate).toLocaleDateString()}</p>
      <div className='flex justify-between'>
      <p className="text-gray-500 text-xs font-bold mt-1">Total Products: {billing.products.length}</p>
      <p className="text-gray-400 italic text-xs mt-1">Last Editted: {new Date(billing.updatedAt ? billing.updatedAt : billing.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex mt-4 text-xs space-x-2" >
                
      <button onClick={()=> navigate(`/bills/edit/${billing._id}`)} className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
          <i className="fa fa-pen mr-2"></i> Edit
        </button>
        <button onClick={() => {if(userInfo.isAdmin){
           generatePDF(billing)
           }else{
             alert('You are not authorized to generate PDF')
           } }}
        className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center">
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
                    <td onClick={()=> navigate(`/driver/${billing._id}`)} className="px-2 cursor-pointer text-xs font-bold py-2">{billing.invoiceNo}</td>
                    <td className="px-2 text-xs py-2">{new Date(billing.invoiceDate).toLocaleDateString()}</td>
                    {/* <td className="px-4 text-xs py-2">
                      {new Date(billing.expectedDeliveryDate).toLocaleDateString()}
                    </td> */}
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
          <div className="bg-white h-screen rounded-lg p-5 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <i className="fa fa-times"></i>
            </button>
            <div className="h-screen mt-2 p-2  overflow-y-auto">
            <p className="text-sm text-gray-600 font-bold mb-2">
              Details for Invoice No. {selectedBillings.invoiceNo}
            </p>

            <div className='flex justify-between'>
            <p className="text-xs mb-1">
              Salesman Name: <span className="text-gray-700">{selectedBillings.salesmanName}</span>
            </p>

            <p className="text-xs mb-1">
              Marketed By: <span className="text-gray-700">{selectedBillings.marketedBy}</span>
            </p>

            </div>

            <div className='flex justify-between'>
            <p className="text-xs mb-1">
              Customer Name: <span className="text-gray-700">{selectedBillings.customerName}</span>
            </p>
            <p className="text-xs  mb-1">
              Invoice Date: <span className="text-gray-700">{new Date(selectedBillings.invoiceDate).toLocaleDateString()}</span>
            </p>
            </div>
            <div className='flex justify-between'>
            <p className="text-xs  mb-1">
              Delivery Status: <span className={`${selectedBillings.deliveryStatus === 'Delivered' ? 'text-green-500' : 'text-red-500'} font-bold`}>{selectedBillings.deliveryStatus}</span>
            </p>
            <p className="text-xs  mb-1">
              Payment Status: <span className={`${selectedBillings.paymentStatus === 'Paid' ? 'text-green-500' : 'text-red-500'} font-bold`}>{selectedBillings.paymentStatus}</span>
            </p>
            </div>
            
            <h3 className="text-sm font-bold text-red-600 mt-5 ">Products: {selectedBillings.products?.length}</h3>
            <div className="mx-auto my-8">


<div className="relative">
    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
            <th scope="col" className="px-4 text-xs py-3">
                    Sl
                </th>
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
                 D.Qty
                </th>
                <th scope="col" className="px-2 text-xs py-3">
                  Delivered
                </th>
            </tr>
        </thead>
        <tbody>
          {selectedBillings?.products.map((product,index)=>(
            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" className="px-2 text-center py-4 text-xs font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {index + 1}
               </th>
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
                              className={`text-green-500 ${product.deliveryStatus === "Delivered" ? 'bg-green-500' : 'bg-red-500 border-white'} focus:ring-0 focus:outline-0 focus:border-0`}
                              checked={product.deliveryStatus === "Delivered"}
                            />
                          </td>
            </tr> 
          ))
}

        </tbody>
    </table>

    <div className='mt-10 text-right mr-2'>

    <p className="text-xs mb-1">
              Sub Total: <span className="text-gray-600">{((parseFloat(selectedBillings.billingAmount) / parseFloat(1.18))).toFixed(2)}</span>
      </p>
      <p className="text-xs  mb-1">
              Gst (18%): <span className="text-gray-600">{(parseFloat(selectedBillings.billingAmount) - (parseFloat(selectedBillings.billingAmount) / parseFloat(1.18))).toFixed(2)}</span>
      </p>

            
            <p className="text-xs  mb-1">
              Bill Amount: <span className="text-gray-600">Rs. {selectedBillings.billingAmount.toFixed(2)}</span>
            </p>

            <p className="text-xs mb-1">
              Disscount: <span className="text-gray-600">Rs. {selectedBillings.discount.toFixed(2)}</span>
            </p>

            <p className="text-sm font-bold mb-1">
              Total Amount: <span className="text-gray-600">Rs. {(selectedBillings.billingAmount - selectedBillings.discount).toFixed(2)}</span>
            </p>


            <p className="text-xs mb-1">
              Amount Received: <span className="text-green-500 font-bold">{selectedBillings.billingAmountReceived}</span>
            </p>
            </div>

      </div>
</div>

  </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillingList;




