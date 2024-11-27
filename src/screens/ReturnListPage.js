// src/screens/ReturnListingScreen.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function ReturnListingScreen() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [error, setError] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Fetch all returns from the server
  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/returns'); // Ensure this endpoint exists
      setReturns(data);
      setFilteredReturns(data);
    } catch (err) {
      setError('Error fetching returns data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // Function to print return invoice via backend API
  const printReturnInvoice = async (returnEntry) => {
    setPrintLoading(true);
    try {
      const response = await api.post(
        '/api/print/generate-return-invoice-html',
        { returnNo: returnEntry.returnNo }, // Send only returnNo
        { responseType: 'blob' }
      );

      // Create a Blob from the response
      const blob = new Blob([response.data], { type: 'text/html' });

      // Create a URL for the Blob and open it in a new tab
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating return invoice:', error);
      alert('Failed to load the return invoice. Please try again.');
    } finally {
      setPrintLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this return entry?')) {
      try {
        await api.delete(`/api/returns/return/delete/${id}/`); // Ensure this endpoint exists
        const updatedReturns = returns.filter((returnEntry) => returnEntry._id !== id);
        setReturns(updatedReturns);
        setFilteredReturns(updatedReturns);
      } catch (error) {
        setError('Error occurred while deleting the return entry.');
        console.error(error);
      }
    }
  };

  const handleApprove = async (returnEntry) => {
    try {
      if (window.confirm('Are you sure you want to approve this return?')) {
        await api.put(`/api/returns/approve/${returnEntry._id}`, { userId: userInfo._id });
        const updatedReturns = returns.map((r) =>
          r._id === returnEntry._id ? { ...r, isApproved: true } : r
        );
        setReturns(updatedReturns);
        setFilteredReturns(updatedReturns);
      }
    } catch (error) {
      setError('Error occurred while approving the return.');
      console.error(error);
    }
  };

  const handleView = (returnEntry) => {
    setSelectedReturn(returnEntry);
  };

  const closeModal = () => {
    setSelectedReturn(null);
  };

  // Pagination Logic
  const paginateReturns = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReturns.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);

  const handleSearch = (e) => {
    const keyword = e.target.value.toLowerCase();
    setSearchKeyword(keyword);
    const filtered = returns.filter(
      (returnEntry) =>
        returnEntry.customerName.toLowerCase().includes(keyword) ||
        returnEntry.returnNo.toLowerCase().includes(keyword)
    );
    setFilteredReturns(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  // Render Status Indicator
  const renderStatusIndicator = (returnEntry) => {
    const { isApproved } = returnEntry;
    let color = isApproved ? 'green' : 'red';

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

  // Skeleton Loaders
  const renderTableSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-2 py-2">Return No</th>
            <th className="px-2 py-2">Return Date</th>
            <th className="px-2 py-2">Billing No</th>
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

  return (
    <div>
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Return Listing and Management</p>
        </div>
        <i className="fa fa-recycle text-gray-500 text-2xl" />
      </div>

      {/* Print Loading Spinner */}
      {printLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="flex flex-col items-center">
            <i className="fa fa-spinner fa-spin text-white text-4xl mb-4"></i>
            <p className="text-white text-xs">Loading Return Invoice...</p>
          </div>
        </div>
      )} 

      {/* Error Message */}
      {error && <p className="text-red-500 text-center mb-4 text-xs">{error}</p>}

      <div className="container mx-auto">
        <div className="max-w-full mx-auto bg-white rounded-lg p-2">
          {/* Search Filter */}
          <div className="flex justify-end mb-4">
            <input
              type="text"
              placeholder="Search by Return No or Customer Name"
              value={searchKeyword}
              onChange={handleSearch}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>

          {loading ? (
            <>
              {/* Table Skeleton for Large Screens */}
              <div className="hidden md:block">{renderTableSkeleton()}</div>
              {/* Card Skeleton for Mobile Screens */}
              <div className="md:hidden">{renderCardSkeleton()}</div>
            </>
          ) : (
            <>
              {filteredReturns.length === 0 ? (
                <p className="text-gray-600 text-center">No returns found.</p>
              ) : (
                <>
                  {/* Table for Large Screens */}
                  <div className="hidden md:block">
                    <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                      <thead className="bg-red-600 text-xs text-white">
                        <tr>
                          <th className="px-2 py-2">Return No</th>
                          <th className="px-2 py-2">Return Date</th>
                          <th className="px-2 py-2">Billing No</th>
                          <th className="px-2 py-2">Customer Name</th>
                          <th className="px-2 py-2">Products</th>
                          <th className="px-2 py-2">Return Amount</th>
                          <th className="px-2 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginateReturns().map((returnEntry) => (
                          <tr
                            key={returnEntry._id}
                            className="hover:bg-gray-100 divide-y divide-x"
                          >
                            <td className="px-2 py-2">
                              <span
                                className={`flex text-xs font-bold text-red-600 cursor-pointer`}
                              >
                                {returnEntry.returnNo}
                                {returnEntry.isApproved && (
                                  <img
                                    className="h-4 w-4 ml-1 mt-1"
                                    src="/images/tick.svg"
                                    alt="Approved"
                                  />
                                )}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              {new Date(returnEntry.returnDate).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-2">{returnEntry.billingNo}</td>
                            <td className="px-2 py-2">{returnEntry.customerName}</td>
                            <td className="px-2 py-2">{returnEntry.products.length}</td>
                            <td className="px-2 py-2">{returnEntry.netReturnAmount}</td>
                            <td className="px-2 py-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => printReturnInvoice(returnEntry)}
                                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center"
                                >
                                  <i className="fa fa-print mr-1"></i> Print
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/return/edit/${returnEntry.returnNo}`)
                                  }
                                  className={`bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center ${
                                    !userInfo.isAdmin && returnEntry.isApproved
                                      ? 'bg-gray-300 cursor-not-allowed'
                                      : ''
                                  }`}
                                  disabled={!userInfo.isAdmin && returnEntry.isApproved}
                                >
                                  <i className="fa fa-edit mr-1"></i> Edit
                                </button>
                                <button
                                  onClick={() => handleView(returnEntry)}
                                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center"
                                >
                                  <i className="fa fa-eye mr-1"></i> View
                                </button>
                                <button
                                  onClick={() => handleRemove(returnEntry._id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center"
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

                  {/* Cards for Mobile Screens */}
                  <div className="md:hidden space-y-4">
                    {paginateReturns().map((returnEntry) => (
                      <div
                        key={returnEntry.returnNo}
                        className="bg-white rounded-lg shadow-md p-6 mb-4"
                      >
                        <div className="flex justify-between items-center">
                          <p className={`text-xs font-bold text-red-600`}>
                            Return No: {returnEntry.returnNo}
                            {returnEntry.isApproved && (
                              <img
                                className="h-4 w-4 ml-1 mt-1"
                                src="/images/tick.svg"
                                alt="Approved"
                              />
                            )}
                          </p>
                        </div>
                        <p className="text-gray-600 text-xs mt-2">
                          Return Date:{' '}
                          {new Date(returnEntry.returnDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                          Billing No: {returnEntry.billingNo}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                          Customer: {returnEntry.customerName}
                        </p>
                        <div className="mt-4">
                          <p className="text-xs font-bold">
                            Total Products: {returnEntry.products.length}
                          </p>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => printReturnInvoice(returnEntry)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center text-xs"
                          >
                            <i className="fa fa-print mr-1"></i> Print
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/return/edit/${returnEntry.returnNo}`)
                            }
                            className={`bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center text-xs ${
                              !userInfo.isAdmin && returnEntry.isApproved
                                ? 'bg-gray-300 cursor-not-allowed'
                                : ''
                            }`}
                            disabled={!userInfo.isAdmin && returnEntry.isApproved}
                          >
                            <i className="fa fa-edit mr-1"></i> Edit
                          </button>
                          <button
                            onClick={() => handleView(returnEntry)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center text-xs"
                          >
                            <i className="fa fa-eye mr-1"></i> View
                          </button>
                          <button
                            onClick={() => handleRemove(returnEntry._id)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center text-xs"
                          >
                            <i className="fa fa-trash mr-1"></i> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
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
                      onClick={() => setCurrentPage(currentPage + 1)}
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

    {/* Modal for Viewing Return Details */}
{selectedReturn && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-auto">
    <div className="bg-white top-1/2 rounded-lg p-5 w-full max-w-2xl relative">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        onClick={closeModal}
      >
        <i className="fa fa-times"></i>
      </button>
      <div className="mt-2 p-2">
        <p className="text-sm text-gray-600 font-bold mb-2 text-red-600">
          Details for Return No. {selectedReturn.returnNo}
        </p>

        <div className="flex justify-between">
          <p className="text-xs mb-1">
            Billing No:{' '}
            <span className="text-gray-700">{selectedReturn.billingNo}</span>
          </p>
          <p className="text-xs mb-1">
            Return Date:{' '}
            <span className="text-gray-700">
              {new Date(selectedReturn.returnDate).toLocaleDateString()}
            </span>
          </p>
        </div>

        <div className="flex justify-between">
          <p className="text-xs mb-1">
            Customer Name:{' '}
            <span className="text-gray-700">{selectedReturn.customerName}</span>
          </p>
          <p className="text-xs mb-1">
            Discount:{' '}
            <span className="text-gray-700">₹{parseFloat(selectedReturn.discount)}</span>
          </p>
        </div>

        <h3 className="text-sm font-bold text-red-600 mt-5">
          Products: {selectedReturn.products?.length}
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
                    Item ID
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Item Name
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Quantity
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Unit
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Return Price
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Discount
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedReturn?.products.map((product, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <th
                      scope="row"
                      className="px-4 py-4 text-xs font-medium text-gray-900 whitespace-nowrap"
                    >
                      {index + 1}
                    </th>
                    <td className="px-4 py-4 text-xs text-gray-600">{product.item_id || 'N/A'}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">{product.name || 'N/A'}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">{product.quantity || '0'}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">{product.unit || 'N/A'}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">₹{product.returnPrice}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">₹{(product.quantity * (selectedReturn.discount / selectedReturn.products.length))}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">₹{((product.quantity * product.returnPrice) - (product.quantity * (selectedReturn.discount / selectedReturn.products.length))).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-10 text-right mr-2">
              <p className="text-xs mb-1">
                Subtotal: <span className="text-gray-600">₹{parseFloat(selectedReturn.returnAmount).toFixed(2)}</span>
              </p>
              {selectedReturn.cgst > 0 && (
                <p className="text-xs mb-1">
                  CGST (9%): <span className="text-gray-600">₹{parseFloat(selectedReturn.cgst)}</span>
                </p>
              )}
              {selectedReturn.sgst > 0 && (
                <p className="text-xs mb-1">
                  SGST (9%): <span className="text-gray-600">₹{parseFloat(selectedReturn.sgst)}</span>
                </p>
              )}
              <p className="text-xs mb-1">
                Total Tax: <span className="text-gray-600">₹{parseFloat(selectedReturn.totalTax).toFixed(2)}</span>
              </p>
              <p className="text-sm font-bold mb-1">
                Grand Total: <span className="text-gray-600">₹{parseFloat(selectedReturn.netReturnAmount).toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )}
        </div>
      </div>
    </div>
  );
}




