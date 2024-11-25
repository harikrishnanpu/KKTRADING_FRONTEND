import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const BillingList = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Fetch and filter billings based on user role and salesman name
  const fetchBillings = async () => {
    setLoading(true);
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

  // Filter billings for display
  const approvedBillings = userInfo.isAdmin
    ? billings
    : billings.filter(
        (billing) =>
          billing.isApproved ||
          billing.submittedBy == userInfo._id
      );

  const unapprovedBillings = billings.filter((billing) => !billing.isApproved && billing.submittedBy == userInfo._id);
  const unapprovedAdminBillings = billings.filter((billing) => !billing.isApproved);

  const paginateBillings = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return approvedBillings.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(approvedBillings.length / itemsPerPage);

  const generatePDF = async (bill) => {
    setPdfLoading(true);

    const cgst = (
      (parseFloat(bill.billingAmount) - parseFloat(bill.billingAmount / 1.18)) /
      2
    ).toFixed(2);
    const sgst = (
      (parseFloat(bill.billingAmount) - parseFloat(bill.billingAmount / 1.18)) /
      2
    ).toFixed(2);
    const discount = parseFloat(bill.discount) || 0;
    const subTotal = (
      parseFloat(bill.billingAmount) -
      parseFloat(cgst) -
      parseFloat(sgst)
    ).toFixed(2);

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
      billingAmount: bill.billingAmount,
    };

    try {
      const response = await api.post(
        'https://kktrading-backend.vercel.app/generate-pdf', 
        formData,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Invoice_${bill.invoiceNo}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };


  function printInvoice(bill) {

    const cgst = (
      (parseFloat(bill.billingAmount) - parseFloat(bill.billingAmount / 1.18)) /
      2
    ).toFixed(2);

    const sgst = (
      (parseFloat(bill.billingAmount) - parseFloat(bill.billingAmount / 1.18)) /
      2
    ).toFixed(2);

    const subTotal = (
      parseFloat(bill.billingAmount) -
      parseFloat(cgst) -
      parseFloat(sgst)
    ).toFixed(2);

    const formData = {
      invoiceNo: bill.invoiceNo,
      invoiceDate: bill.invoiceDate,
      salesmanName: bill.salesmanName,
      expectedDeliveryDate: bill.expectedDeliveryDate ,
      deliveryStatus: bill.deliveryStatus,
      salesmanPhoneNumber: bill.salesmanPhoneNumber,
      paymentStatus: bill.paymentStatus,
      billingAmount: bill.billingAmount,
      paymentAmount: bill.paymentAmount,
      paymentMethod: bill.paymentMethod || '',
      paymentReceivedDate: bill.updatedAt || '',
      customerName: bill.customerName,
      customerAddress: bill.customerAddress,
      customerContactNumber: bill.customerContactNumber,
      marketedBy: bill.marketedBy,
      subTotal,
      cgst,
      sgst,
      discount: bill.discount,
      products: bill.products.map((product) => ({
        item_id: product.item_id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity,
        sellingPrice: product.sellingPrice,
        enteredQty: product.enteredQty,
        sellingPriceinQty: product.sellingPriceinQty,
        unit: product.unit,
        size: product.size
      })),
    };

    api.post('https://kktrading-backend.vercel.app/generate-invoice-html', formData)
    .then(response => {
      const htmlContent = response.data; // Extract the HTML content
      const printWindow = window.open('', '', 'height=800,width=600');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
  }

  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this billing?')) {
      try {
        await api.delete(`/api/billing/billings/delete/${id}`);
        setBillings(billings.filter((billing) => billing._id !== id));
      } catch (error) {
        setError('Error occurred while deleting the billing.');
        console.error(error);
      }
    }
  };

  const handleApprove = async (bill)=>{
    try {
      if(window.confirm('Are you sure you want to  approve this billing?')){
      await api.put(`/api/billing/bill/approve/${bill._id}`,{userId: userInfo._id});
      setBillings(
        billings.map((b) =>
          b._id === bill._id? {...b, isApproved: true } : b
        )
      );
    }
    } catch (error) {
      setError('Error occurred while approving the billing.');
      console.error(error);
    }
  }

  const handleView = (billing) => {
    setSelectedBilling(billing);
  };

  const closeModal = () => {
    setSelectedBilling(null);
  };

  const renderStatusIndicator = (billing) => {
    const { deliveryStatus, paymentStatus } = billing;
    let color = 'red';
    if (deliveryStatus === 'Delivered' && paymentStatus === 'Paid') {
      color = 'green';
    } else if (deliveryStatus === 'Delivered' || paymentStatus === 'Paid') {
      color = 'yellow';
    }

    return (
      <span className="relative flex h-3 w-3 mx-auto">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-3 w-3 bg-${color}-500`}
        ></span>
      </span>
    );
  };

  const renderCard = (billing) => (
    <div
      key={billing.invoiceNo}
      className="bg-white rounded-lg shadow-md p-6 mb-4 transition-transform transform hover:scale-100 duration-200"
    >
      <div className="flex justify-between items-center">
        <p
          onClick={() => navigate(`/driver/${billing._id}`)}
          className={`text-md flex cursor-pointer font-bold ${billing.isApproved ? 'text-red-600' : 'text-yellow-600'}`}
        >
          {billing.invoiceNo} {billing.isApproved && <img className='h-4 w-4 ml-1 mt-1' src='/images/tick.svg' /> }
        </p>
        <div className="flex items-center">
          {renderStatusIndicator(billing)}
        </div>
      </div>
      <p className="text-gray-600 text-xs mt-2">Customer: {billing.customerName}</p>
      <p className="text-gray-600 text-xs mt-1">Salesman: {billing.salesmanName}</p>
      <p className="text-gray-600 text-xs mt-1">
        Expected Delivery:{' '}
        {new Date(billing.expectedDeliveryDate).toLocaleDateString()}
      </p>
      <div className="flex justify-between">
        <p className="text-gray-600 text-xs font-bold mt-1">
          Total Products: {billing.products.length}
        </p>
        <p className="text-gray-400 italic text-xs mt-1">
          Last Edited:{' '}
          {new Date(billing.updatedAt ? billing.updatedAt : billing.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex mt-4 text-xs space-x-2">
        <button
        disabled={!userInfo.isAdmin && billing.isApproved}
          onClick={() => navigate(`/bills/edit/${billing._id}`)}
          className={`${billing.isApproved && !userInfo.isAdmin ? 'bg-gray-300' :'bg-red-500'} text-white px-3 font-bold py-1 rounded ${!userInfo.isAdmin && billing.isApproved ? '' : 'hover:bg-red-600'} flex items-center`}
        >
          <i className="fa fa-pen mr-2"></i> Edit
        </button> 
        {userInfo.isAdmin && (
          <button
            onClick={() => generatePDF(billing)}
            className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
          >
            <i className="fa fa-file-pdf-o mr-2"></i> PDF
          </button>
        )}
        <button
          onClick={() => handleView(billing)}
          className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
        >
          <i className="fa fa-eye mr-2"></i> View
        </button>
        <button
          onClick={() => handleRemove(billing._id)}
          className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
        >
          <i className="fa fa-trash mr-2"></i> Delete
        </button>

       {userInfo.isAdmin && <button
          onClick={() => printInvoice(billing)}
          className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
        >
          <i className="fa fa-print mr-2"></i>
        </button> }

       {userInfo.isAdmin && !billing.isApproved && <button
          onClick={() => handleApprove(billing)}
          className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
        >
          Approve
        </button> }
      </div>
    </div>
  );

  const renderTableSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr className="divide-y text-xs">
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
          {skeletonRows.map((row) => (
            <tr key={row} className="hover:bg-gray-100 divide-y divide-x">
              <td className="px-4 py-2 text-center">
                <Skeleton circle={true} height={12} width={12} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCardSkeleton = () => {
    const skeletonCards = Array.from({ length: itemsPerPage }, (_, index) => index);
    return skeletonCards.map((card) => (
      <div
        key={card}
        className="bg-white rounded-lg shadow-md p-6 mb-4 animate-pulse"
      >
        <div className="flex justify-between items-center">
          <Skeleton height={20} width={`60%`} />
          <Skeleton circle={true} height={12} width={12} />
        </div>
        <p className="text-gray-600 text-xs mt-2">
          <Skeleton height={10} width={`80%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`70%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`50%`} />
        </p>
        <div className="flex justify-between">
          <p className="text-gray-600 text-xs font-bold mt-1">
            <Skeleton height={10} width={`40%`} />
          </p>
          <p className="text-gray-400 italic text-xs mt-1">
            <Skeleton height={10} width={`30%`} />
          </p>
        </div>
        <div className="flex mt-4 text-xs space-x-2">
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
        </div>
      </div>
    ));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div
          onClick={() => navigate('/')}
          className="text-center cursor-pointer"
        >
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            All Billings Information And Updation
          </p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

      {/* PDF Loading Spinner */}
      {pdfLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="flex flex-col items-center">
            <i className="fa fa-spinner fa-spin text-white text-4xl mb-4"></i>
            <p className="text-white text-xs">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-center mb-4 text-xs">{error}</p>
      )}

      {/* Submitted for Review Section */}
      {!userInfo.isAdmin && unapprovedBillings.length > 0 && (
        <div className="bg-yellow-100 rounded-md border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold text-xs">Submitted for Review</p>
          <p className="text-xs">
            You have {unapprovedBillings.length} billing(s) awaiting approval.
          </p>
        </div>
      )}

{userInfo.isAdmin && unapprovedAdminBillings.length > 0 && (
        <div className="bg-yellow-100 rounded-md border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold text-xs">Submitted for Review</p>
          <p className="text-xs">
            {unapprovedAdminBillings.length} billing(s) awaiting approval.
          </p>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div>
          {/* Table Skeleton for Large Screens */}
          <div className="hidden md:block">
            {renderTableSkeleton()}
          </div>
          {/* Card Skeleton for Small Screens */}
          <div className="md:hidden">
            {renderCardSkeleton()}
          </div>
        </div>
      ) : (
        <>
          {/* Approved Billings */}
          {approvedBillings.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No billings available.
            </p>
          ) : (
            <>
              {/* Table for Large Screens */}
              <div className="hidden md:block">
                <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-red-600 text-xs text-white">
                    <tr className="divide-y">
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
                      <tr
                        key={billing.invoiceNo}
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        <td className="px-4 py-2 text-center">
                          {renderStatusIndicator(billing)}
                        </td>
                        <td
                          onClick={() => navigate(`/driver/${billing._id}`)}
                          className={` px-2 cursor-pointer flex text-xs font-bold py-2 ${billing.isApproved ? 'text-red-600' : 'text-yellow-600'} `}
                        >
                          {billing.invoiceNo} {billing.isApproved && <img className='h-2 w-2 ml-1 mt-1' src='/images/tick.svg' /> }
                        </td>
                        <td className="px-2 text-xs py-2">
                          {new Date(billing.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {billing.salesmanName}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {billing.customerName}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {billing.products.length}
                        </td>
                        <td className="px-2 text-xs py-2">
                          <div className="flex mt-2 text-xs space-x-1">
                          {userInfo.isAdmin && ( <button
                              onClick={() => navigate(`/bills/edit/${billing._id}`)}
                              className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                            >
                              <i className="fa fa-pen mr-1"></i> Edit
                            </button> )}
                            {userInfo.isAdmin && (
                              <button
                                onClick={() => generatePDF(billing)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                              >
                                <i className="fa fa-file-pdf-o mr-1"></i> PDF
                              </button>
                            )}
                            <button
                              onClick={() => handleView(billing)}
                              className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                            >
                              <i className="fa fa-eye mr-1"></i> View
                            </button>
                            <button
                              onClick={() => handleRemove(billing._id)}
                              className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                            >
                              <i className="fa fa-trash mr-1"></i> Delete
                            </button>
                            {userInfo.isAdmin && !billing.isApproved && <button
          onClick={() => handleApprove(billing)}
          className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
        >
          Approve
        </button> }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for Small Screens */}
              <div className="md:hidden">
                {paginateBillings().map(renderCard)}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 text-xs font-bold py-2 rounded-lg ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 text-xs font-bold py-2 rounded-lg ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Modal for Viewing Billing Details */}
      {selectedBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-auto">
          <div className="bg-white rounded-lg p-5 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <i className="fa fa-times"></i>
            </button>
            <div className="mt-2 p-2">
              <p className="text-sm text-gray-600 font-bold mb-2 text-red-600">
                Details for Invoice No. {selectedBilling.invoiceNo}
              </p>

              <div className="flex justify-between">
                <p className="text-xs mb-1">
                  Salesman Name:{' '}
                  <span className="text-gray-700">{selectedBilling.salesmanName}</span>
                </p>
                <p className="text-xs mb-1">
                  Marketed By:{' '}
                  <span className="text-gray-700">{selectedBilling.marketedBy}</span>
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-xs mb-1">
                  Customer Name:{' '}
                  <span className="text-gray-700">{selectedBilling.customerName}</span>
                </p>
                <p className="text-xs mb-1">
                  Invoice Date:{' '}
                  <span className="text-gray-700">
                    {new Date(selectedBilling.invoiceDate).toLocaleDateString()}
                  </span>
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-xs mb-1">
                  Delivery Status:{' '}
                  <span
                    className={`${
                      selectedBilling.deliveryStatus === 'Delivered'
                        ? 'text-green-500'
                        : 'text-red-500'
                    } font-bold`}
                  >
                    {selectedBilling.deliveryStatus}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Payment Status:{' '}
                  <span
                    className={`${
                      selectedBilling.paymentStatus === 'Paid'
                        ? 'text-green-500'
                        : 'text-red-500'
                    } font-bold`}
                  >
                    {selectedBilling.paymentStatus}
                  </span>
                </p>
              </div>

              <h3 className="text-sm font-bold text-red-600 mt-5">
                Products: {selectedBilling.products?.length}
              </h3>
              <div className="mx-auto my-8">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Sl
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Product
                        </th>
                        <th scope="col" className="px-2 py-3 text-center">
                          ID
                        </th>
                        <th scope="col" className="px-2 py-3">
                          Qty
                        </th>
                        <th scope="col" className="px-2 py-3">
                          D.Qty
                        </th>
                        <th scope="col" className="px-2 py-3">
                          Delivered
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBilling?.products.map((product, index) => (
                        <tr
                          key={index}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <th
                            scope="row"
                            className="px-2 py-4 text-xs font-medium text-gray-900 whitespace-nowrap"
                          >
                            {index + 1}
                          </th>
                          <td className="px-2 py-4 text-xs text-gray-900">
                            {product.name.length > 7
                              ? `${product.name.slice(0, 7)}...`
                              : product.name}
                          </td>
                          <td className="px-2 py-4 text-xs text-center">
                            {product.item_id}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            {product.quantity}
                          </td>
                          <td className="px-2 py-4 text-xs text-center">
                            {product.deliveredQuantity}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            <input
                              type="checkbox"
                              className={`text-green-500 ${
                                product.deliveryStatus === 'Delivered'
                                  ? 'bg-green-500'
                                  : 'bg-red-500 border-white'
                              } focus:ring-0 focus:outline-0`}
                              checked={product.deliveryStatus === 'Delivered'}
                              readOnly
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-10 text-right mr-2">
                    <p className="text-xs mb-1">
                      Sub Total:{' '}
                      <span className="text-gray-600">
                        Rs. {((parseFloat(selectedBilling.billingAmount) / 1.18)).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      GST (18%):{' '}
                      <span className="text-gray-600">
                        Rs. {(parseFloat(selectedBilling.billingAmount) - parseFloat(selectedBilling.billingAmount / 1.18)).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Discount:{' '}
                      <span className="text-gray-600">
                        Rs. {parseFloat(selectedBilling.discount).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm font-bold mb-1">
                      Total Amount:{' '}
                      <span className="text-gray-600">
                        Rs. {(parseFloat(selectedBilling.billingAmount) - parseFloat(selectedBilling.discount)).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Amount Received:{' '}
                      <span className="text-green-500 font-bold">
                        Rs. {parseFloat(selectedBilling.billingAmountReceived).toFixed(2)}
                      </span>
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
