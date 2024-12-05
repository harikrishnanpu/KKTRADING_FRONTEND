// src/components/TransportPaymentList.js

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from './api'; // Ensure this is correctly set up to handle API requests
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const TransportPaymentList = () => {
  const navigate = useNavigate();
  const [transportPayments, setTransportPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Fetch all transport payments
  const fetchTransportPayments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/transportpayments/all');
      setTransportPayments(response.data);
    } catch (err) {
      setError('Failed to fetch transport payments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paginate transport payments
  const paginateTransportPayments = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return transportPayments.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(transportPayments.length / itemsPerPage);

  // Generate PDF Statement
  const generatePDF = (payment) => {
    setPdfLoading(true);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Transport Payment Statement', 14, 22);
    doc.setFontSize(12);
    doc.text(`Transport Name: ${payment.transportName}`, 14, 32);
    doc.text(`Transport Type: ${payment.transportType}`, 14, 40);
    doc.text(`Total Amount Billed: ₹${payment.totalAmountBilled.toFixed(2)}`, 14, 48);
    doc.text(`Total Amount Paid: ₹${payment.totalAmountPaid.toFixed(2)}`, 14, 56);
    doc.text(`Payment Remaining: ₹${payment.paymentRemaining.toFixed(2)}`, 14, 64);
    doc.text(`Created At: ${new Date(payment.createdAt).toLocaleDateString()}`, 14, 72);

    // Billings Section
    doc.setFontSize(14);
    doc.text('Billings', 14, 86);
    const billingsData = payment.billings.map((billing, index) => [
      index + 1,
      billing.billId,
      billing.invoiceNo,
      `₹${billing.amount.toFixed(2)}`,
      new Date(billing.date).toLocaleDateString(),
    ]);

    doc.autoTable({
      startY: 90,
      head: [['#', 'Bill ID', 'Invoice No.', 'Amount', 'Date']],
      body: billingsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 0, 0] },
    });

    // Payments Section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Payments', 14, finalY);
    const paymentsData = payment.payments.map((paymentItem, index) => [
      index + 1,
      `₹${paymentItem.amount.toFixed(2)}`,
      paymentItem.method,
      paymentItem.submittedBy,
      paymentItem.remark || '-',
      new Date(paymentItem.date).toLocaleDateString(),
    ]);

    doc.autoTable({
      startY: finalY + 5,
      head: [['#', 'Amount', 'Method', 'Submitted By', 'Remark', 'Date']],
      body: paymentsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 0, 0] },
    });

    // Save PDF
    doc.save(`Transport_Payment_${payment._id}.pdf`);
    setPdfLoading(false);
  };

  // Handle Removing a Transport Payment
  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to delete this transport payment record?')) {
      try {
        await api.delete(`/api/transport-payments/${id}/delete`);
        alert('Transport payment record deleted successfully.');
        setTransportPayments(transportPayments.filter((payment) => payment._id !== id));
      } catch (error) {
        setError('Error occurred while deleting the transport payment record.');
        console.error(error);
      }
    }
  };

  // Handle Viewing Payment Details
  const handleView = (payment) => {
    setSelectedPayment(payment);
  };

  const closeModal = () => {
    setSelectedPayment(null);
  };

  // Rendering Skeletons
  const renderSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr className="divide-y text-xs">
            <th className="px-4 py-2 text-left">Transport Name</th>
            <th className="px-2 py-2">Transport Type</th>
            <th className="px-2 py-2">Total Billed (₹)</th>
            <th className="px-2 py-2">Total Paid (₹)</th>
            <th className="px-2 py-2">Payment Remaining (₹)</th>
            <th className="px-2 py-2">Created At</th>
            <th className="px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((row) => (
            <tr key={row} className="hover:bg-gray-100 divide-y divide-x">
              <td className="px-4 py-2">
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
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Pagination Handler
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">All Transport Payments Information and Transactions</p>
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
        renderSkeleton()
      ) : (
        <>
          {/* Transport Payments Table */}
          {transportPayments.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No transport payment records available.
            </p>
          ) : (
            <>
              <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-red-600 text-xs text-white">
                  <tr className="divide-y">
                    <th className="px-4 py-2 text-left">Transport Name</th>
                    <th className="px-2 py-2">Transport Type</th>
                    <th className="px-2 py-2">Total Billed (₹)</th>
                    <th className="px-2 py-2">Total Paid (₹)</th>
                    <th className="px-2 py-2">Payment Remaining (₹)</th>
                    <th className="px-2 py-2">Created At</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginateTransportPayments().map((payment) => (
                    <tr
                      key={payment._id}
                      className="hover:bg-gray-100 divide-y divide-x"
                    >
                      <td className="px-4 py-2 text-xs font-bold text-red-600">
                        {payment.transportName}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {payment.transportType.charAt(0).toUpperCase() + payment.transportType.slice(1)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        ₹{payment.totalAmountBilled.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        ₹{payment.totalAmountPaid.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        ₹{payment.paymentRemaining.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(payment)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                          >
                            <i className="fa fa-eye mr-1"></i> View
                          </button>
                          <button
                            onClick={() => generatePDF(payment)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                          >
                            <i className="fa fa-file-pdf-o mr-1"></i> Download
                          </button>
                          <button
                            onClick={() => handleRemove(payment._id)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                          >
                            <i className="fa fa-trash mr-1"></i> Delete
                          </button>
                          <button
                            onClick={() => navigate(`/transport-payments/edit/${payment._id}`)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                          >
                            <i className="fa fa-edit mr-1"></i> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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

      {/* Modal for Viewing Payment Transactions */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 my-8 relative shadow-lg">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeModal}
              aria-label="Close Modal"
            >
              &times;
            </button>

            {/* Modal Content */}
            <div className="mt-4">
              <h2 className="text-lg font-bold text-red-600 mb-4">
                Transactions for Transport: {selectedPayment.transportName}
              </h2>

              {/* Billings Section */}
              <section className="mb-6">
                <h3 className="text-md font-semibold text-red-600 mb-2">Billings</h3>
                {selectedPayment.billings && selectedPayment.billings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Bill ID</th>
                          <th className="px-4 py-2">Invoice No.</th>
                          <th className="px-4 py-2">Amount (₹)</th>
                          <th className="px-4 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPayment.billings.map((billing, index) => (
                          <tr key={index} className="bg-white border-b hover:bg-gray-100">
                            <td className="px-4 py-2 text-xs">{index + 1}</td>
                            <td className="px-4 py-2 text-xs">{billing.billId}</td>
                            <td className="px-4 py-2 text-xs">{billing.invoiceNo}</td>
                            <td className="px-4 py-2 text-xs">₹{billing.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-xs">
                              {new Date(billing.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No billings available.</p>
                )}
              </section>

              {/* Payments Section */}
              <section className="mb-6">
                <h3 className="text-md font-semibold text-red-600 mb-2">Payments</h3>
                {selectedPayment.payments && selectedPayment.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Amount (₹)</th>
                          <th className="px-4 py-2">Method</th>
                          <th className="px-4 py-2">Submitted By</th>
                          <th className="px-4 py-2">Remark</th>
                          <th className="px-4 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPayment.payments.map((paymentItem, index) => (
                          <tr key={index} className="bg-white border-b hover:bg-gray-100">
                            <td className="px-4 py-2 text-xs">{index + 1}</td>
                            <td className="px-4 py-2 text-xs">₹{paymentItem.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-xs">{paymentItem.method}</td>
                            <td className="px-4 py-2 text-xs">{paymentItem.submittedBy}</td>
                            <td className="px-4 py-2 text-xs">{paymentItem.remark || '-'}</td>
                            <td className="px-4 py-2 text-xs">
                              {new Date(paymentItem.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No payments available.</p>
                )}
              </section>

              {/* Summary */}
              <div className="mt-4 text-right">
                <p className="text-sm font-semibold">
                  Total Amount Billed: <span className="text-gray-600">₹{selectedPayment.totalAmountBilled.toFixed(2)}</span>
                </p>
                <p className="text-sm font-semibold">
                  Total Amount Paid: <span className="text-gray-600">₹{selectedPayment.totalAmountPaid.toFixed(2)}</span>
                </p>
                <p className="text-sm font-semibold">
                  Payment Remaining: <span className="text-gray-600">₹{selectedPayment.paymentRemaining.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>);

};

export default TransportPaymentList;
