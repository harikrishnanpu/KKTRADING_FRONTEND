// src/screens/DailyTransactions.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import ErrorModal from '../components/ErrorModal'; // Ensure this component exists

const DailyTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [billings, setBillings] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]); // New state for purchase payments
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState('all');
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('in'); // 'in' or 'out'
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [transactionData, setTransactionData] = useState({
    date: selectedDate,
    amount: '',
    paymentFrom: '',
    paymentTo: '',
    category: '',
    method: '',
    remark: '',
    billId: '',
  });

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  const paymentMethods = ['Cash', 'Bank', 'UPI', 'Online'];

  // Fetch transactions, billings, purchase payments, and categories for the selected date
  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const [transRes, billingRes, purchaseRes, catRes] = await Promise.all([
        api.get(`/api/daily/transactions`, {
          params: { date: selectedDate },
        }),
        api.get(`/api/daily/billing`, {
          params: { date: selectedDate },
        }),
        api.get(`/api/purchases/purchases/payments`, { // New API call for purchase payments
          params: { date: selectedDate },
        }),
        api.get('/api/daily/transactions/categories'),
      ]);
      setTransactions(transRes.data);
      setBillings(billingRes.data);
      setPurchasePayments(purchaseRes.data); // Set purchase payments
      setCategories(catRes.data);
      calculateTotals(transRes.data, billingRes.data, purchaseRes.data);
    } catch (err) {
      setError('Failed to fetch transactions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (transactionsData, billingsData, purchasePaymentsData) => {
    let totalInAmount = 0;
    let totalOutAmount = 0;

    // Calculate total payments in from transactions
    transactionsData.forEach((trans) => {
      if (trans.type === 'in') {
        totalInAmount += parseFloat(trans.amount) || 0;
      } else {
        totalOutAmount += parseFloat(trans.amount) || 0;
      }
    });

    // Include billing payments received in totalInAmount
    billingsData.forEach((billing) => {
      if (billing.billingAmountReceived) {
        totalInAmount += parseFloat(billing.billingAmountReceived) || 0;
      }
      // Include other expenses in totalOutAmount
      if (billing.otherExpenses) {
        billing.otherExpenses.forEach((expense) => {
          totalOutAmount += parseFloat(expense.amount) || 0;
        });
      }
    });

    // Include purchase payments in totalOutAmount
    purchasePaymentsData.forEach((payment) => {
      totalOutAmount += parseFloat(payment.amount) || 0;
    });

    setTotalIn(totalInAmount);
    setTotalOut(totalOutAmount);
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const openModal = (type) => {
    setModalType(type);
    setTransactionData({
      date: selectedDate,
      amount: '',
      paymentFrom: '',
      paymentTo: '',
      category: '',
      method: '',
      remark: '',
      billId: '',
    });
    setIsAddingCategory(false);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCategory('');
    setIsAddingCategory(false);
    setError('');
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Validate amount
    if (isNaN(transactionData.amount) || parseFloat(transactionData.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    // Validate required fields based on modal type
    if (modalType === 'in' && !transactionData.paymentFrom.trim()) {
      setError('Please enter the payer\'s name.');
      return;
    }
    if (modalType === 'out' && !transactionData.paymentTo.trim()) {
      setError('Please enter the recipient\'s name.');
      return;
    }

    // Validate category
    if (!transactionData.category.trim()) {
      setError('Please select a category.');
      return;
    }

    // Validate payment method
    if (!transactionData.method.trim()) {
      setError('Please select a payment method.');
      return;
    }

    try {
      if (modalType === 'in') {
        // Add Payment In Transaction
        await api.post('/api/daily/transactions', {
          ...transactionData,
          type: modalType,
          userId: userInfo._id
        });
      } else {
        // Add Payment Out Payment (Purchase Payment)
        // Assuming the user selects a purchase to associate the payment
        if (!transactionData.purchaseId) {
          setError('Please select a Purchase ID to associate the payment.');
          return;
        }

        await api.post(`/api/purchase/${transactionData.purchaseId}/payments`, {
          amount: transactionData.amount,
          method: transactionData.method,
          remark: transactionData.remark,
          date: transactionData.date,
        });
      }

      closeModal();
      fetchTransactions();
    } catch (err) {
      setError('Failed to add transaction.');
      console.error(err);
    }
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() === '') {
      setError('Category name cannot be empty.');
      return;
    }
    setError('');
    try {
      const res = await api.post('/api/daily/transactions/categories', { name: newCategory, userId: userInfo._id });
      setCategories([...categories, res.data]); // Use response data for consistency
      setTransactionData({ ...transactionData, category: res.data.name }); // Automatically select the new category
      setNewCategory('');
      setIsAddingCategory(false);
    } catch (err) {
      setError('Failed to add category.');
      console.error(err);
    }
  };

  // Fetch all purchases for the selected date to allow associating payments
  const [purchases, setPurchases] = useState([]);

  const fetchPurchases = async () => {
    try {
      const purchasesRes = await api.get(`/api/purchases/purchases/payments`, {
        params: { date: selectedDate },
      }); 
      setPurchases(purchasesRes.data);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Memoize filtered transactions to optimize performance
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((trans) => {
      if (activeTab === 'in') return trans.type === 'in';
      if (activeTab === 'out') return trans.type === 'out';
      return true;
    });

    // Include billing payments based on activeTab
    if (activeTab === 'in' || activeTab === 'all') {
      billings.forEach((billing) => {
        if (billing.billingAmountReceived > 0) {
          filtered.push({
            _id: billing._id,
            date: billing.invoiceDate,
            amount: billing.billingAmountReceived,
            paymentFrom: billing.customerName,
            category: 'Billing Payment',
            method: 'Cash',
            remark: 'Payment received from billing',
            type: 'in',
          });
        }
      });
    }

    // Include other expenses from billings based on activeTab
    if (activeTab === 'out' || activeTab === 'all') {
      billings.forEach((billing) => {
        if (billing.otherExpenses) {
          billing.otherExpenses.forEach((expense) => {
            filtered.push({
              _id: expense._id,
              date: expense.date,
              amount: expense.amount,
              paymentTo: expense.paidTo || 'Expense',
              category: expense.category || 'Other Expense',
              method: expense.method || 'Cash',
              remark: expense.remark || 'Expense',
              type: 'out',
            });
          });
        }
      });
    }

    // Include purchase payments based on activeTab
    if (activeTab === 'out' || activeTab === 'all') {
      purchasePayments.forEach((payment) => {
        filtered.push({
          _id: payment._id,
          date: payment.date,
          amount: payment.amount,
          paymentTo: payment.paidTo || 'Vendor',
          category: payment.category || 'Purchase Payment',
          method: payment.method || 'Cash',
          remark: payment.remark || 'Payment towards purchase',
          type: 'out',
        });
      });
    }

    // Sort transactions by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }, [transactions, billings, purchasePayments, activeTab]);

  return (
    <>
      {/* Top Navigation */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4">
        <div
          onClick={() => navigate('/')}
          className="text-center cursor-pointer"
        >
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Daily Transactions
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="border border-gray-300 rounded p-1 text-xs"
        />
      </div>

      {/* Error Message */}
      {error && (
        <ErrorModal message={error} onClose={() => setError('')} />
      )}

      {/* Totals Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded text-xs">
          Total Payment In: Rs. {totalIn.toFixed(2)}
        </div>
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-xs">
          Total Payment Out: Rs. {totalOut.toFixed(2)}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => handleTabChange('all')}
            className={`relative px-4 py-2 text-xs font-semibold ${
              activeTab === 'all' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'
            }`}
          >
            All Payments
            {activeTab === 'all' && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600"></span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('in')}
            className={`relative px-4 py-2 text-xs font-semibold ${
              activeTab === 'in' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'
            }`}
          >
            Payment In
            {activeTab === 'in' && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600"></span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('out')}
            className={`relative px-4 py-2 text-xs font-semibold ${
              activeTab === 'out' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'
            }`}
          >
            Payment Out
            {activeTab === 'out' && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600"></span>
            )}
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="mb-20"> {/* Added margin bottom to prevent overlap with fixed buttons */}
        {loading ? (
          <Skeleton count={5} height={80} />
        ) : (
          <>
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500 text-xs">
                No transactions found for the selected criteria.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTransactions.map((trans) => (
                  <div
                    key={trans._id}
                    className={`p-4 rounded shadow-md flex flex-col space-y-1 relative ${
                      trans.type === 'in' ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {/* Status Indicator */}
                    <div className="absolute top-3 right-3 flex items-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full animate-ping ${
                          trans.type === 'in' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      ></span>
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          trans.type === 'in' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      ></span>
                    </div>

                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-700">
                        {trans.category}
                      </h3>
                      <span
                        className={`text-xs font-bold ${
                          trans.type === 'in'
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {trans.type === 'in' ? 'Payment In' : 'Payment Out'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Date: {new Date(trans.date).toLocaleDateString()}
                    </p>
                    {trans.type === 'in' ? (
                      <p className="text-xs text-gray-600">
                        Payment From: {trans.paymentFrom || 'N/A'}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600">
                        Payment To: {trans.paymentTo || 'N/A'}
                      </p>
                    )}
                    <p className="text-xs text-gray-600">
                      Amount: Rs. {parseFloat(trans.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Method: {trans.method}
                    </p>
                    <p className="text-xs text-gray-600">
                      Remark: {trans.remark || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Payment Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-around">
        <button
          onClick={() => openModal('in')}
          className="bg-green-500 text-white px-4 py-2 rounded text-xs hover:bg-green-600 transition-colors duration-200 w-40"
        >
          + Payment In
        </button>
        <button
          onClick={() => openModal('out')}
          className="bg-red-500 text-white px-4 py-2 rounded text-xs hover:bg-red-600 transition-colors duration-200 w-40"
        >
          + Payment Out
        </button>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg p-5 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold">
                Add {modalType === 'in' ? 'Payment In' : 'Payment Out'}
              </h2>
              <button onClick={closeModal}>
                <i className="fa fa-times text-gray-500"></i>
              </button>
            </div>
            <form onSubmit={handleTransactionSubmit}>
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">Date</label>
                <input
                  type="date"
                  value={transactionData.date}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-1 text-xs"
                  required
                />
              </div>
              <div className="mb-2">
                {modalType === 'in' ? (
                  <>
                    <label className="block text-xs font-bold mb-1">
                      Payment From
                    </label>
                    <input
                      type="text"
                      value={transactionData.paymentFrom}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          paymentFrom: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded p-1 text-xs"
                      required
                      placeholder="Enter payer's name"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-bold mb-1">
                      Payment To
                    </label>
                    <input
                      type="text"
                      value={transactionData.paymentTo}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          paymentTo: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded p-1 text-xs"
                      required
                      placeholder="Enter recipient's name"
                    />
                  </>
                )}
              </div>
              {modalType === 'out' && (
                <div className="mb-2">
                  <label className="block text-xs font-bold mb-1">Purchase ID</label>
                  <select
                    value={transactionData.purchaseId || ''}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        purchaseId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-1 text-xs"
                    required
                  >
                    <option value="">Select Purchase ID</option>
                    {purchases.map((purchase) => (
                      <option key={purchase._id} value={purchase._id}>
                        {purchase.invoiceNo} - {purchase.sellerName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">Category</label>
                <div className="flex">
                  <select
                    value={transactionData.category}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        category: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-1 text-xs"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 transition-colors duration-200"
                  >
                    + Add
                  </button>
                </div>
                {isAddingCategory && (
                  <div className="mt-2 flex">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded p-1 text-xs"
                      placeholder="New Category Name"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors duration-200"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">Amount</label>
                <input
                  type="number"
                  value={transactionData.amount}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      amount: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-1 text-xs"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount in Rs."
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">Payment Method</label>
                <select
                  value={transactionData.method}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      method: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-1 text-xs"
                  required
                >
                  <option value="">Select Method</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">Remark</label>
                <textarea
                  value={transactionData.remark}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      remark: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-1 text-xs"
                  rows="2"
                  placeholder="Optional remarks"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1">Bill ID (Optional)</label>
                <input
                  type="text"
                  value={transactionData.billId}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      billId: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-1 text-xs"
                  placeholder="Enter Bill ID if applicable"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-2 text-xs hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-500 text-white px-4 py-2 rounded text-xs hover:bg-red-600 transition-colors duration-200"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyTransactions;
