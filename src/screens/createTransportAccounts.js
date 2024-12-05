// src/components/TransportPaymentForm.js

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api'; // Adjust the path based on your project structure
import { useSelector } from 'react-redux';

export default function TransportPaymentForm() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);


  useEffect(()=>{
    const fetchAccounts = async () => {
        try {
          const response = await api.get('/api/accounts/allaccounts');
          setAccounts(response.data); // Set the accounts in state
        } catch (err) {
          console.log('Failed to fetch payment accounts.'); // Set error message
          console.log(err);
        }
      };

      fetchAccounts();
  },[])

  const [transportName, setTransportName] = useState('');
  const [transportType, setTransportType] = useState('');
  const [billings, setBillings] = useState([
    { billId: '', invoiceNo: '', amount: '', date: '' },
  ]);
  const [payments, setPayments] = useState([
    { amount: '', method: '', submittedBy: '', date: '', remark: '' },
  ]);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Refs for managing focus
  const transportNameRef = useRef();
  const transportTypeRef = useRef();
  const billingRefs = useRef([]);
  const paymentRefs = useRef([]);

  // Handler to update billings
  const handleBillingChange = (index, field, value) => {
    const updatedBillings = [...billings];
    updatedBillings[index][field] = value;
    setBillings(updatedBillings);
  };

  // Handler to add a new billing
  const addBilling = () => {
    setBillings([...billings, { billId: '', invoiceNo: '', amount: '', date: '' }]);
  };

  // Handler to remove a billing
  const removeBilling = (index) => {
    const updatedBillings = billings.filter((_, i) => i !== index);
    setBillings(updatedBillings);
  };

  // Handler to update payments
  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...payments];
    updatedPayments[index][field] = value;
    setPayments(updatedPayments);
  };

  // Handler to add a new payment
  const addPayment = () => {
    setPayments([
      ...payments,
      { amount: '', method: '', submittedBy: '', date: '', remark: '' },
    ]);
  };

  // Handler to remove a payment
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
      setShowErrorMessage('Transport Name is required.');
      return false;
    }

    if (!transportType.trim()) {
      setShowErrorMessage('Transport Type is required.');
      return false;
    }

    // Validate billings
    for (let i = 0; i < billings.length; i++) {
      const billing = billings[i];
      if (!billing.billId.trim()) {
        setShowErrorMessage(`Bill ID is required for Billing ${i + 1}.`);
        return false;
      }
      if (!billing.invoiceNo.trim()) {
        setShowErrorMessage(`Invoice Number is required for Billing ${i + 1}.`);
        return false;
      }
      if (billing.amount === '' || isNaN(billing.amount) || Number(billing.amount) < 0) {
        setShowErrorMessage(`Valid Amount is required for Billing ${i + 1}.`);
        return false;
      }
      if (billing.date && isNaN(Date.parse(billing.date))) {
        setShowErrorMessage(`Valid Date is required for Billing ${i + 1}.`);
        return false;
      }
    }

    // Check for duplicate bill IDs within billings
    const billIds = billings.map((billing) => billing.billId.trim());
    const uniqueBillIds = new Set(billIds);
    if (billIds.length !== uniqueBillIds.size) {
      setShowErrorMessage('Duplicate Bill IDs within billings are not allowed.');
      return false;
    }

    // Validate payments
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      if (payment.amount === '' || isNaN(payment.amount) || Number(payment.amount) < 0) {
        setShowErrorMessage(`Valid Payment Amount is required for Payment ${i + 1}.`);
        return false;
      }
      if (!payment.method.trim()) {
        setShowErrorMessage(`Payment Method is required for Payment ${i + 1}.`);
        return false;
      }
      if (!payment.submittedBy.trim()) {
        setShowErrorMessage(`Submitted By is required for Payment ${i + 1}.`);
        return false;
      }
      if (payment.date && isNaN(Date.parse(payment.date))) {
        setShowErrorMessage(`Valid Payment Date is required for Payment ${i + 1}.`);
        return false;
      }
    }

    setShowErrorMessage('');
    return true;
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Prepare data for API
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
      const response = await api.post('/api/transport-payments/create', payload);

      if (response.status === 201) {
        setShowSuccessMessage('Transport payment record created successfully.');
        setShowErrorMessage('');
        // Reset form
        setTransportName('');
        setTransportType('');
        setBillings([{ billId: '', invoiceNo: '', amount: '', date: '' }]);
        setPayments([{ amount: '', method: '', submittedBy: '', date: '', remark: '' }]);
        // Optionally, navigate to another page after a delay
        setTimeout(() => {
          setShowSuccessMessage('');
          navigate('/transport-payments'); // Adjust the path as needed
        }, 2000);
      } else {
        setShowErrorMessage('Failed to create transport payment record. Please try again.');
        setShowSuccessMessage('');
      }
    } catch (error) {
      // Extract error message from response if available
      const errorMsg =
        error.response?.data?.message ||
        'Failed to create transport payment record. Please try again.';
      setShowErrorMessage(errorMsg);
      setShowSuccessMessage('');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Top Banner */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/transport-payments')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Create Transport Payment</p>
        </div>
        <i className="fa fa-plus text-gray-500" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="flex justify-between mb-4">
          <p className="text-sm font-bold mb-5 text-gray-500">
            <i className="fa fa-truck" /> Create Transport Payment
          </p>
          <div className="text-right">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`mb-2 bg-red-500 text-sm text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Payment'}
            </button>
            <p className="text-xs text-gray-400">Fill all required fields before submission</p>
          </div>
        </div>

        {/* Error Message */}
        {showErrorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {showErrorMessage}
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {showSuccessMessage}
          </div>
        )}

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
            className="bg-green-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-green-600"
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

<label className="block text-xs">Payment Method</label>
<select
  value={paymentMethod}
  onChange={(e) => setPaymentMethod(e.target.value)}
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
>
{accounts.map((acc) => (
<option key={acc.accountId} value={acc.accountId}>
{acc.accountName}
</option>
))}
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
            className="bg-green-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-green-600"
          >
            Add Another Payment
          </button>
        </div>

        {/* Submit Button */}
        <div className="text-right">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-red-600 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Payment'}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            Fill all required fields before submission
          </p>
        </div>
      </form>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-md">
          {showSuccessMessage}
        </div>
      )}

      {/* Error Message */}
      {showErrorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md">
          {showErrorMessage}
        </div>
      )}
    </div>
  );
}
