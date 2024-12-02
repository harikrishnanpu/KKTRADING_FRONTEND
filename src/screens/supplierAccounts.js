// src/components/SupplierAccountList.js

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from './api'; // Adjust the path based on your project structure
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const SupplierAccountList = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Fetch all supplier accounts
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/seller/allaccounts');
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to fetch supplier accounts.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paginate accounts
  const paginateAccounts = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return accounts.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(accounts.length / itemsPerPage);

  // Generate PDF Statement
  const generatePDF = (account) => {
    setPdfLoading(true);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Supplier Account Statement', 14, 22);
    doc.setFontSize(12);
    doc.text(`Account ID: ${account.accountId}`, 14, 32);
    doc.text(`Supplier Name: ${account.sellerName}`, 14, 40);
    doc.text(`Supplier Contact Number: ${account.sellerAddress}`, 14, 48);
    doc.text(`Total Bill Amount: ₹${account.totalBillAmount.toFixed(2)}`, 14, 56);
    doc.text(`Paid Amount: ₹${account.paidAmount.toFixed(2)}`, 14, 64);
    doc.text(`Pending Amount: ₹${account.pendingAmount.toFixed(2)}`, 14, 72);
    doc.text(`Created At: ${new Date(account.createdAt).toLocaleDateString()}`, 14, 80);

    // Bills
    doc.setFontSize(14);
    doc.text('Bills', 14, 94);
    const billsData = account.bills.map((bill, index) => [
      index + 1,
      bill.invoiceNo,
      `₹${bill.billAmount.toFixed(2)}`,
      new Date(bill.invoiceDate).toLocaleDateString(),
    ]);

    doc.autoTable({
      startY: 98,
      head: [['#', 'Invoice No.', 'Bill Amount', 'Invoice Date']],
      body: billsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 0, 0] },
    });

    // Payments
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Payments', 14, finalY);
    const paymentsData = account.payments.map((payment, index) => [
      index + 1,
      `₹${payment.amount.toFixed(2)}`,
      payment.submittedBy,
      payment.remark || '-',
      new Date(payment.date).toLocaleDateString(),
    ]);

    doc.autoTable({
      startY: finalY + 5,
      head: [['#', 'Amount', 'Submitted By', 'Remark', 'Date']],
      body: paymentsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 0, 0] },
    });

    // Save PDF
    doc.save(`Supplier_Account_${account.accountId}.pdf`);
    setPdfLoading(false);
  };

  // Handle Removing an Account
  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier account?')) {
      try {
        await api.delete(`/api/seller/${id}/delete`);
        alert('Supplier account deleted successfully.');
        setAccounts(accounts.filter((account) => account._id !== id));
      } catch (error) {
        setError('Error occurred while deleting the account.');
        console.error(error);
      }
    }
  };

  // Handle Viewing Account Details
  const handleView = (account) => {
    setSelectedAccount(account);
  };

  const closeModal = () => {
    setSelectedAccount(null);
  };

  // Rendering Skeletons
  const renderSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr className="divide-y text-xs">
            <th className="px-4 py-2 text-left">Supplier ID</th>
            <th className="px-2 py-2">Supplier Name</th>
            <th className="px-2 py-2">Contact Number</th>
            <th className="px-2 py-2">Total Bill</th>
            <th className="px-2 py-2">Paid Amount</th>
            <th className="px-2 py-2">Pending Amount</th>
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
          <p className="text-gray-400 text-xs font-bold">
            All Supplier Accounts Information and Transactions
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
        renderSkeleton()
      ) : (
        <>
          {/* Accounts Table */}
          {accounts.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No supplier accounts available.
            </p>
          ) : (
            <>
              <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-red-600 text-xs text-white">
                  <tr className="divide-y">
                    <th className="px-4 py-2 text-left">Supplier ID</th>
                    <th className="px-2 py-2">Supplier Name</th>
                    <th className="px-2 py-2">Address</th>
                    <th className="px-2 py-2">Total Bill (₹)</th>
                    <th className="px-2 py-2">Paid Amount (₹)</th>
                    <th className="px-2 py-2">Pending Amount (₹)</th>
                    <th className="px-2 py-2">Created At</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginateAccounts().map((account) => (
                    <tr
                      key={account._id}
                      className="hover:bg-gray-100 divide-y divide-x"
                    >
                      <td className="px-4 py-2 text-xs font-bold text-red-600">
                        {account.sellerId}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {account.sellerName}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {account.sellerAddress}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        ₹{account.totalBillAmount.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        ₹{account.paidAmount.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        ₹{account.pendingAmount.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(account)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                          >
                            <i className="fa fa-eye mr-1"></i> View
                          </button>
                          <button
                            onClick={() => generatePDF(account)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                          >
                            <i className="fa fa-file-pdf-o mr-1"></i> Download
                          </button>
                          <button
                            onClick={() => handleRemove(account._id)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                          >
                            <i className="fa fa-trash mr-1"></i> Delete
                          </button>
                          <button
                            onClick={() => navigate(`/seller/edit/${account._id}`)}
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

      {/* Modal for Viewing Account Transactions */}
      {selectedAccount && (
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
                Transactions for Supplier ID: {selectedAccount.sellerId}
              </h2>

              {/* Bills Section */}
              <section className="mb-6">
                <h3 className="text-md font-semibold text-red-600 mb-2">Bills</h3>
                {selectedAccount.bills && selectedAccount.bills.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Invoice No.</th>
                          <th className="px-4 py-2">Bill Amount (₹)</th>
                          <th className="px-4 py-2">Invoice Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAccount.bills.map((bill, index) => (
                          <tr key={index} className="bg-white border-b hover:bg-gray-100">
                            <td className="px-4 py-2 text-xs">{index + 1}</td>
                            <td className="px-4 py-2 text-xs">{bill.invoiceNo}</td>
                            <td className="px-4 py-2 text-xs">₹{bill.billAmount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-xs">
                              {new Date(bill.invoiceDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No bills available.</p>
                )}
              </section>

              {/* Payments Section */}
              <section className="mb-6">
                <h3 className="text-md font-semibold text-red-600 mb-2">Payments</h3>
                {selectedAccount.payments && selectedAccount.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Amount (₹)</th>
                          <th className="px-4 py-2">Submitted By</th>
                          <th className="px-4 py-2">Remark</th>
                          <th className="px-4 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAccount.payments.map((payment, index) => (
                          <tr key={index} className="bg-white border-b hover:bg-gray-100">
                            <td className="px-4 py-2 text-xs">{index + 1}</td>
                            <td className="px-4 py-2 text-xs">₹{payment.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-xs">{payment.submittedBy}</td>
                            <td className="px-4 py-2 text-xs">{payment.remark || '-'}</td>
                            <td className="px-4 py-2 text-xs">
                              {new Date(payment.date).toLocaleDateString()}
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
                  Total Bill Amount: <span className="text-gray-600">₹{selectedAccount.totalBillAmount.toFixed(2)}</span>
                </p>
                <p className="text-sm font-semibold">
                  Paid Amount: <span className="text-gray-600">₹{selectedAccount.paidAmount.toFixed(2)}</span>
                </p>
                <p className="text-sm font-semibold">
                  Pending Amount: <span className="text-gray-600">₹{selectedAccount.pendingAmount.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierAccountList;
