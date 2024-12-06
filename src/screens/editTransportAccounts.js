// src/components/TransportPaymentEdit.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from './api'; // Ensure this is correctly set up to handle API requests
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const TransportPaymentEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the transport payment ID from the URL
  const [transportName, setTransportName] = useState('');
  const [transportType, setTransportType] = useState('');
  const [billings, setBillings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Refs for managing focus
  const transportNameRef = useRef();
  const transportTypeRef = useRef();
  const billingRefs = useRef([]);
  const paymentRefs = useRef([]);

  // Fetch existing transport payment data
  const fetchTransportPayment = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/transport-payments/get/${id}`);
      const data = response.data;
      setTransportName(data.transportName);
      setTransportType(data.transportType);
      setBillings(data.billings);
      setPayments(data.payments);
    } catch (err) {
      setError('Failed to fetch transport payment data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handlers for billings
  const handleBillingChange = (index, field, value) => {
    const updatedBillings = [...billings];
    updatedBillings[index][field] = value;
    setBillings(updatedBillings);
  };

  const addBilling = () => {
    setBillings([...billings, { billId: '', invoiceNo: '', amount: '', date: '' }]);
  };

  const removeBilling = (index) => {
    const updatedBillings = billings.filter((_, i) => i !== index);
    setBillings(updatedBillings);
  };

  // Handlers for payments
  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...payments];
    updatedPayments[index][field] = value;
    setPayments(updatedPayments);
  };

  const addPayment = () => {
    setPayments([
      ...payments,
      { amount: '', method: '', submittedBy: '', date: '', remark: '' },
    ]);
  };

  const removePayment = (index) => {
    const updatedPayments = payments.filter((_, i) => i !== index);
    setPayments(updatedPayments);
  };

  // Function to handle Enter key navigation
  function changeRef(e, nextRef) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  }

  // Validation before submission
  const validateForm = () => {
    if (!transportName.trim()) {
      setError('Transport Name is required.');
      return false;
    }

    if (!transportType.trim()) {
      setError('Transport Type is required.');
      return false;
    }

    // Validate billings
    for (let i = 0; i < billings.length; i++) {
      const billing = billings[i];
      if (!billing.billId.trim()) {
        setError(`Bill ID is required for Billing ${i + 1}.`);
        return false;
      }
      if (!billing.invoiceNo.trim()) {
        setError(`Invoice Number is required for Billing ${i + 1}.`);
        return false;
      }
      if (billing.amount === '' || isNaN(billing.amount) || Number(billing.amount) < 0) {
        setError(`Valid Amount is required for Billing ${i + 1}.`);
        return false;
      }
      if (billing.date && isNaN(Date.parse(billing.date))) {
        setError(`Valid Date is required for Billing ${i + 1}.`);
        return false;
      }
    }

    // Check for duplicate bill IDs within billings
    const billIds = billings.map((billing) => billing.billId.trim());
    const uniqueBillIds = new Set(billIds);
    if (billIds.length !== uniqueBillIds.size) {
      setError('Duplicate Bill IDs within billings are not allowed.');
      return false;
    }

    // Validate payments
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      if (payment.amount === '' || isNaN(payment.amount) || Number(payment.amount) < 0) {
        setError(`Valid Payment Amount is required for Payment ${i + 1}.`);
        return false;
      }
      if (!payment.method.trim()) {
        setError(`Payment Method is required for Payment ${i + 1}.`);
        return false;
      }
      if (!payment.submittedBy.trim()) {
        setError(`Submitted By is required for Payment ${i + 1}.`);
        return false;
      }
      if (payment.date && isNaN(Date.parse(payment.date))) {
        setError(`Valid Payment Date is required for Payment ${i + 1}.`);
        return false;
      }
    }

    setError('');
    return true;
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormSubmitting(true);

    // Prepare payload
    const payload = {
      transportName: transportName.trim(),
      transportType: transportType.trim(),
      billings: billings.map((billing) => ({
        billId: billing.billId.trim(),
        invoiceNo: billing.invoiceNo.trim(),
        amount: parseFloat(billing.amount),
        date: billing.date ? new Date(billing.date) : new Date(),
      })),
      payments: payments.map((payment) => ({
        amount: parseFloat(payment.amount),
        method: payment.method.trim(),
        submittedBy: payment.submittedBy.trim() || userInfo._id,
        date: payment.date ? new Date(payment.date) : new Date(),
        remark: payment.remark.trim(),
      })),
      userId: userInfo?._id,
    };

    try {
      const response = await api.put(`/api/transportpayments/${id}/update`, payload);

      if (response.status === 200) {
        setSuccessMessage('Transport payment record updated successfully.');
        setError('');
        // Optionally, redirect to the transport payments list after a delay
        setTimeout(() => {
          setSuccessMessage('');
          navigate('/transport-payments'); // Adjust the path as needed
        }, 2000);
      } else {
        setError('Failed to update transport payment record. Please try again.');
        setSuccessMessage('');
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Failed to update transport payment record. Please try again.';
      setError(errorMsg);
      setSuccessMessage('');
      console.error(error);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Rendering Skeletons
  const renderSkeleton = () => {
    return (
      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-8">
        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Transport Name</label>
          <Skeleton height={40} />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Transport Type</label>
          <Skeleton height={40} />
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Billings</h3>
          {[...Array(2)].map((_, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Bill ID</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Invoice Number</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Amount (₹)</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Date</label>
                  <Skeleton height={30} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Payments</h3>
          {[...Array(2)].map((_, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Payment Amount (₹)</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Payment Method</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Submitted By</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Date</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Remark</label>
                  <Skeleton height={30} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg opacity-50 cursor-not-allowed"
          disabled
        >
          Update Record
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/transport-payments')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Edit Transport Payment</p>
        </div>
        <i className="fa fa-edit text-gray-500" />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-center mb-4 text-xs">{error}</p>
      )}

      {/* Success Message */}
      {successMessage && (
        <p className="text-red-500 text-center mb-4 text-xs">{successMessage}</p>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        renderSkeleton()
      ) : (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          {/* Transport Information */}
          <div className="mb-6">
            <label className="block text-xs text-gray-700 mb-2">
              Transport Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              ref={transportNameRef}
              value={transportName}
              onChange={(e) => setTransportName(e.target.value)}
              onKeyDown={(e) => changeRef(e, transportTypeRef)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              placeholder="Enter Transport Name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-700 mb-2">
              Transport Type <span className="text-red-500">*</span>
            </label>
            <select
              ref={transportTypeRef}
              value={transportType}
              onChange={(e) => setTransportType(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              required
            >
              <option value="">Select Transport Type</option>
              <option value="local">Local</option>
              <option value="logistic">Logistic</option>
              <option value="international">International</option>
              {/* Add more options as needed */}
            </select>
          </div>

          {/* Billings Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Billings</h3>
            {billings.map((billing, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-gray-600">Billing {index + 1}</h4>
                  {billings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBilling(index)}
                      className="text-red-500 text-sm"
                      aria-label={`Remove Billing ${index + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Bill ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billing.billId}
                      onChange={(e) => handleBillingChange(index, 'billId', e.target.value)}
                      ref={(el) => (billingRefs.current[index] = el)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextField = billingRefs.current[index + 1] || paymentRefs.current[0];
                          nextField?.focus();
                        }
                      }}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Bill ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billing.invoiceNo}
                      onChange={(e) => handleBillingChange(index, 'invoiceNo', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Invoice Number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={billing.amount}
                      onChange={(e) => handleBillingChange(index, 'amount', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={billing.date ? billing.date.slice(0, 10) : ''}
                      onChange={(e) => handleBillingChange(index, 'date', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addBilling}
              className="bg-red-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-red-600"
            >
              Add Another Billing
            </button>
          </div>

          {/* Payments Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Payments</h3>
            {payments.map((payment, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-gray-600">Payment {index + 1}</h4>
                  {payments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePayment(index)}
                      className="text-red-500 text-sm"
                      aria-label={`Remove Payment ${index + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Payment Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.amount}
                      onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                      ref={(el) => (paymentRefs.current[index] = el)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextField = paymentRefs.current[index + 1] || null;
                          nextField?.focus();
                        }
                      }}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Payment Amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Payment Method <span className="text-red-500">*</span></label>
                    <select
                      value={payment.method}
                      onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      required
                    >
                      <option value="">Select Method</option>
                      <option value="credit card">Credit Card</option>
                      <option value="cash">Cash</option>
                      <option value="bank transfer">Bank Transfer</option>
                      {/* Add more options as needed */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Submitted By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={payment.submittedBy}
                      onChange={(e) => handlePaymentChange(index, 'submittedBy', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Submitter Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={payment.date ? payment.date.slice(0, 10) : ''}
                      onChange={(e) => handlePaymentChange(index, 'date', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Remark</label>
                    <input
                      type="text"
                      value={payment.remark}
                      onChange={(e) => handlePaymentChange(index, 'remark', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Remark"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPayment}
              className="bg-red-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-red-600"
            >
              Add Another Payment
            </button>
          </div>

          {/* Submit Button */}
          <div className="text-right">
            <button
              type="submit"
              disabled={formSubmitting}
              className={`bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-red-600 ${
                formSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {formSubmitting ? 'Updating...' : 'Update Record'}
            </button>
            <p className="text-xs text-gray-400 mt-1">
              Fill all required fields before submission
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default TransportPaymentEdit;
