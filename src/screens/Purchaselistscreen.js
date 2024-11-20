import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const PurchaseList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Fetch all purchases
  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/products/purchases/all');
      setPurchases(response.data);
    } catch (err) {
      setError('Failed to fetch purchases.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Pagination logic
  const paginatePurchases = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return purchases.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(purchases.length / itemsPerPage);

  // PDF Generation
  const generatePDF = async (purchase) => {
    setPdfLoading(true);

    const formData = {
      invoiceNo: purchase.invoiceNo,
      sellerName: purchase.sellerName,
      invoiceDate: purchase.createdAt,
      items: purchase.items,
      totalAmount: purchase.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0),
    };

    try {
      const response = await api.post(
        'https://kktrading-backend.vercel.app/generate-pdf-purchase', // Ensure this endpoint exists on your backend
        formData,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Purchase_Invoice_${purchase.invoiceNo}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating purchase invoice:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle Remove Purchase
  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this purchase?')) {
      try {
        await api.delete(`/api/products/purchases/delete/${id}`);
        setPurchases(purchases.filter((purchase) => purchase._id !== id));
      } catch (error) {
        setError('Error occurred while deleting the purchase.');
        console.error(error);
      }
    }
  };

  // Handle View Purchase Details
  const handleView = (purchase) => {
    setSelectedPurchase(purchase);
  };

  // Close Modal
  const closeModal = () => {
    setSelectedPurchase(null);
  };

  // Render Status Indicator (if needed, adjust based on purchase status)
  const renderStatusIndicator = (purchase) => {
    const { paymentStatus } = purchase;
    let color = 'red';
    if (paymentStatus === 'Completed') {
      color = 'green';
    } else if (paymentStatus === 'Partial') {
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

  // Render Purchase Card for Mobile
  const renderCard = (purchase) => (
    <div
      key={purchase.invoiceNo}
      className="bg-white rounded-lg shadow-md p-6 mb-4 transition-transform transform hover:scale-100 duration-200"
    >
      <div className="flex justify-between items-center">
        <p
          onClick={() => navigate(`/purchase/${purchase._id}`)}
          className={`text-md flex cursor-pointer font-bold text-red-600`}
        >
          {purchase.invoiceNo}
        </p>
        <div className="flex items-center">
          {renderStatusIndicator(purchase)}
        </div>
      </div>
      <p className="text-gray-600 text-xs mt-2">Supplier: {purchase.sellerName}</p>
      <p className="text-gray-600 text-xs mt-1">
        Invoice Date: {new Date(purchase.createdAt).toLocaleDateString()}
      </p>
      <p className="text-gray-600 text-xs mt-1">
        Total Items: {purchase.items.length}
      </p>
      <div className="flex justify-between">
        <p className="text-gray-600 text-xs font-bold mt-1">
          Total Amount: Rs. {purchase.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0).toFixed(2)}
        </p>
        <p className="text-gray-400 italic text-xs mt-1">
          Last Edited: {new Date(purchase.updatedAt ? purchase.updatedAt : purchase.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex mt-4 text-xs space-x-2">
        {userInfo.isAdmin && (
          <button
            onClick={() => navigate(`/purchase/edit/${purchase._id}`)}
            className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
          >
            <i className="fa fa-pen mr-2"></i> Edit
          </button>
        )}
        {userInfo.isAdmin && (
          <button
            onClick={() => generatePDF(purchase)}
            className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
          >
            <i className="fa fa-file-pdf-o mr-2"></i> PDF
          </button>
        )}
        <button
          onClick={() => handleView(purchase)}
          className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
        >
          <i className="fa fa-eye mr-2"></i> View
        </button>
        <button
          onClick={() => handleRemove(purchase._id)}
          className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
        >
          <i className="fa fa-trash mr-2"></i> Delete
        </button>
      </div>
    </div>
  );

  // Render Skeleton for Table
  const renderTableSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr className="divide-y text-xs">
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-2 py-2">Invoice No</th>
            <th className="px-2 py-2">Invoice Date</th>
            <th className="px-2 py-2">Supplier Name</th>
            <th className="px-2 py-2">Total Items</th>
            <th className="px-2 py-2">Total Amount</th>
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

  // Render Skeleton for Cards
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

  // Handle Page Change
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
            All Purchases Information And Updation
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
          {/* Purchases List */}
          {purchases.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No purchases available.
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
                      <th className="px-2 py-2">Supplier Name</th>
                      <th className="px-2 py-2">Total Items</th>
                      <th className="px-2 py-2">Total Amount</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatePurchases().map((purchase) => (
                      <tr
                        key={purchase.invoiceNo}
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        <td className="px-4 py-2 text-center">
                          {renderStatusIndicator(purchase)}
                        </td>
                        <td
                          onClick={() => navigate(`/purchase/${purchase._id}`)}
                          className={`px-2 cursor-pointer flex text-xs font-bold py-2 text-red-600`}
                        >
                          {purchase.invoiceNo}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {purchase.sellerName}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {purchase.items.length}
                        </td>
                        <td className="px-2 text-xs py-2">
                          Rs. {purchase.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-2 text-xs py-2">
                          <div className="flex mt-2 text-xs space-x-1">
                            {userInfo.isAdmin && (
                              <button
                                onClick={() => navigate(`/purchase/edit/${purchase._id}`)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                              >
                                <i className="fa fa-pen mr-1"></i> Edit
                              </button>
                            )}
                            {userInfo.isAdmin && (
                              <button
                                onClick={() => generatePDF(purchase)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                              >
                                <i className="fa fa-file-pdf-o mr-1"></i> PDF
                              </button>
                            )}
                            <button
                              onClick={() => handleView(purchase)}
                              className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                            >
                              <i className="fa fa-eye mr-1"></i> View
                            </button>
                            <button
                              onClick={() => handleRemove(purchase._id)}
                              className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                            >
                              <i className="fa fa-trash mr-1"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for Small Screens */}
              <div className="md:hidden">
                {paginatePurchases().map(renderCard)}
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

      {/* Modal for Viewing Purchase Details */}
      {selectedPurchase && (
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
                Details for Invoice No. {selectedPurchase.invoiceNo}
              </p>

              <div className="flex justify-between">
                <p className="text-xs mb-1">
                  Supplier Name:{' '}
                  <span className="text-gray-700">{selectedPurchase.sellerName}</span>
                </p>
                <p className="text-xs mb-1">
                  Invoice Date:{' '}
                  <span className="text-gray-700">
                    {new Date(selectedPurchase.createdAt).toLocaleDateString()}
                  </span>
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-xs mb-1">
                  Payment Status:{' '}
                  <span
                    className={`${
                      selectedPurchase.paymentStatus === 'Completed'
                        ? 'text-green-500'
                        : selectedPurchase.paymentStatus === 'Pending'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    } font-bold`}
                  >
                    {selectedPurchase.paymentStatus}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Total Amount:{' '}
                  <span className="text-gray-700">
                    Rs. {selectedPurchase.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0).toFixed(2)}
                  </span>
                </p>
              </div>

              <h3 className="text-sm font-bold text-red-600 mt-5">
                Items: {selectedPurchase.items?.length}
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
                          Price
                        </th>
                        <th scope="col" className="px-2 py-3">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchase?.items.map((item, index) => (
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
                            {item.name.length > 15
                              ? `${item.name.slice(0, 15)}...`
                              : item.name}
                          </td>
                          <td className="px-2 py-4 text-xs text-center">
                            {item.item_id || 'N/A'}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            {item.quantity}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            Rs. {item.price.toFixed(2)}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            Rs. {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-10 text-right mr-2">
                    <p className="text-xs mb-1">
                      Sub Total:{' '}
                      <span className="text-gray-600">
                        Rs. {selectedPurchase.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      GST (18%):{' '}
                      <span className="text-gray-600">
                        Rs. {(selectedPurchase.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0) * 0.18).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Discount:{' '}
                      <span className="text-gray-600">
                        Rs. {parseFloat(selectedPurchase.discount || 0).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm font-bold mb-1">
                      Total Amount:{' '}
                      <span className="text-gray-600">
                        Rs. {(selectedPurchase.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0) + (selectedPurchase.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0) * 0.18) - parseFloat(selectedPurchase.discount || 0)).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Amount Received:{' '}
                      <span className="text-green-500 font-bold">
                        Rs. {parseFloat(selectedPurchase.amountReceived || 0).toFixed(2)}
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

export default PurchaseList;
