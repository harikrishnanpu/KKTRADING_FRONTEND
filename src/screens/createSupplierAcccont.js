// src/components/SupplierAccountForm.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api'; // Adjust the path based on your project structure
import { useSelector } from 'react-redux';

export default function SupplierAccountForm() {
  const navigate = useNavigate();

  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [bills, setBills] = useState([
    { invoiceNo: '', billAmount: '', invoiceDate: '' },
  ]);
  const [payments, setPayments] = useState([
    { amount: '', date: '', submittedBy: '', remark: '' },
  ]);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Refs for managing focus
  const supplierIdRef = useRef();
  const supplierNameRef = useRef();
  const supplierContactRef = useRef();
  const billRefs = useRef([]);
  const paymentRefs = useRef([]);

  // Handler to update bills
  const handleBillChange = (index, field, value) => {
    const updatedBills = [...bills];
    updatedBills[index][field] = value;
    setBills(updatedBills);
  };

  // Handler to add a new bill
  const addBill = () => {
    setBills([...bills, { invoiceNo: '', billAmount: '', invoiceDate: '' }]);
  };

  // Handler to remove a bill
  const removeBill = (index) => {
    const updatedBills = bills.filter((_, i) => i !== index);
    setBills(updatedBills);
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
      { amount: '', date: '', submittedBy: '', remark: '' },
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
    if (!supplierId.trim()) {
      setShowErrorMessage('Supplier ID is required.');
      return false;
    }

    if (!supplierName.trim()) {
      setShowErrorMessage('Supplier Name is required.');
      return false;
    }

    if (!supplierAddress.trim()) {
      setShowErrorMessage('Supplier Contact Number is required.');
      return false;
    }

    // Validate Supplier Contact Number (10-digit number)
    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(supplierAddress.trim())) {
      setShowErrorMessage('Supplier Contact Number must be a 10-digit number.');
      return false;
    }

    // Validate bills
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      if (!bill.invoiceNo.trim()) {
        setShowErrorMessage(`Invoice Number is required for Bill ${i + 1}.`);
        return false;
      }
      if (bill.billAmount === '' || isNaN(bill.billAmount) || Number(bill.billAmount) < 0) {
        setShowErrorMessage(`Valid Bill Amount is required for Bill ${i + 1}.`);
        return false;
      }
      if (bill.invoiceDate && isNaN(Date.parse(bill.invoiceDate))) {
        setShowErrorMessage(`Valid Invoice Date is required for Bill ${i + 1}.`);
        return false;
      }
    }

    // Check for duplicate invoice numbers within bills
    const invoiceNos = bills.map((bill) => bill.invoiceNo.trim());
    const uniqueInvoiceNos = new Set(invoiceNos);
    if (invoiceNos.length !== uniqueInvoiceNos.size) {
      setShowErrorMessage('Duplicate invoice numbers within bills are not allowed.');
      return false;
    }

    // Validate payments
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      if (payment.amount === '' || isNaN(payment.amount) || Number(payment.amount) < 0) {
        setShowErrorMessage(`Valid Payment Amount is required for Payment ${i + 1}.`);
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
      supplierId: supplierId.trim(),
      supplierName: supplierName.trim(),
      supplierAddress: supplierAddress.trim(),
      bills: bills.map((bill) => ({
        invoiceNo: bill.invoiceNo.trim(),
        billAmount: parseFloat(bill.billAmount),
        invoiceDate: bill.invoiceDate ? new Date(bill.invoiceDate) : new Date(),
      })),
      payments: payments.map((payment) => ({
        amount: parseFloat(payment.amount),
        date: payment.date ? new Date(payment.date) : new Date(),
        submittedBy: payment.submittedBy.trim(),
        remark: payment.remark.trim(),
      })),
      userId: userInfo?._id,
    };

    try {
      const response = await api.post('/api/seller/create', payload);

      if (response.status === 201) {
        setShowSuccessMessage('Supplier account created successfully.');
        setShowErrorMessage('');
        // Reset form
        setSupplierId('');
        setSupplierName('');
        setSupplierAddress('');
        setBills([{ invoiceNo: '', billAmount: '', invoiceDate: '' }]);
        setPayments([{ amount: '', date: '', submittedBy: '', remark: '' }]);
        // Optionally, navigate to another page after a delay
        setTimeout(() => {
          setShowSuccessMessage('');
          navigate('/'); // Adjust the path as needed
        }, 2000);
      } else {
        setShowErrorMessage('Failed to create supplier account. Please try again.');
        setShowSuccessMessage('');
      }
    } catch (error) {
      // Extract error message from response if available
      const errorMsg =
        error.response?.data?.message ||
        'Failed to create supplier account. Please try again.';
      setShowErrorMessage(errorMsg);
      setShowSuccessMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Top Banner */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Supplier Account Creation And Opening Balance</p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-8">
        <div className='flex justify-between mb-4'>
          <p className='text-sm font-bold mb-5 text-gray-500'> <i className='fa fa-truck'/> Create Supplier Account</p>
          <div className='text-right'>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`mb-2 bg-red-500 text-sm text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
            <p className='text-xs text-gray-400'>Fill all required fields before submission</p>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Supplier ID <span className="text-red-500">*</span></label>
          <input
            type="text"
            ref={supplierIdRef}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            onKeyDown={(e) => changeRef(e, supplierNameRef)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Enter Supplier ID"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Supplier Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            ref={supplierNameRef}
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            onKeyDown={(e) => changeRef(e, supplierContactRef)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Enter Supplier Name"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Supplier Address <span className="text-red-500">*</span></label>
          <input
            type="text"
            ref={supplierContactRef}
            value={supplierAddress}
            onChange={(e) => setSupplierAddress(e.target.value)}
            onKeyDown={(e) => changeRef(e, billRefs.current[0])}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Enter Supplier Address"
            required
          />
        </div>

        {/* Bills Section */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Bills</h3>
          {bills.map((bill, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-semibold text-gray-600">Bill {index + 1}</h4>
                {bills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBill(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Invoice Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={bill.invoiceNo}
                    onChange={(e) => handleBillChange(index, 'invoiceNo', e.target.value)}
                    ref={(el) => (billRefs.current[index] = el)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextField = billRefs.current[index + 1] || paymentRefs.current[0];
                        nextField?.focus();
                      }
                    }}
                    className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                    placeholder="Enter Invoice Number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Bill Amount <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bill.billAmount}
                    onChange={(e) => handleBillChange(index, 'billAmount', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                    placeholder="Enter Bill Amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={bill.invoiceDate ? bill.invoiceDate.slice(0, 10) : ''}
                    onChange={(e) => handleBillChange(index, 'invoiceDate', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addBill}
            className="bg-green-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-green-600"
          >
            Add Another Bill
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
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Payment Amount <span className="text-red-500">*</span></label>
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
                  <label className="block text-xs text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payment.date ? payment.date.slice(0, 10) : ''}
                    onChange={(e) => handlePaymentChange(index, 'date', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Submitted By <span className="text-red-500">*</span></label>
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
