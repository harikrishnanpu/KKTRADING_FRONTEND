import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';

const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg p-4 shadow-lg relative w-11/12 max-w-sm">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
        ×
      </button>
      <p className="text-sm text-gray-700">{message}</p>
    </div>
  </div>
);

const DailyTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [billings, setBillings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [transportPayments, setTransportPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState('all');
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('in');
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
    purchaseId: '',
    transportId: '',
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const [transRes, billingRes, purchaseRes, transportRes, catRes, accRes] = await Promise.all([
        api.get(`/api/daily/transactions`, { params: { date: selectedDate } }),
        api.get(`/api/daily/allbill/payments`, { params: { date: selectedDate } }),
        api.get(`/api/sellerPayments/daily/payments`, { params: { date: selectedDate } }),
        api.get(`/api/transportpayments/daily/payments`, { params: { date: selectedDate } }),
        api.get('/api/daily/transactions/categories'),
        api.get('/api/accounts/allaccounts'),
      ]);

      const { billingsRes: billingData, payments: paymentData, otherExpenses: expenseData } = billingRes.data;


      setTransactions(transRes.data);
      setBillings(billingRes); 
      setPayments(paymentData);
      setOtherExpenses(expenseData);
      setPurchasePayments(purchaseRes.data.flatMap((seller) => seller.payments || []));
      setTransportPayments(transportRes.data.flatMap((transport) => transport.payments || []));
      setCategories(catRes.data);
      setAccounts(accRes.data);



      console.log(billingRes.data)

      calculateTotals(
        transRes.data,
        paymentData,
        expenseData,
        purchaseRes.data.flatMap((seller) => seller.payments || []),
        transportRes.data.flatMap((transport) => transport.payments || [])
      );
    } catch (err) {
      setError('Failed to fetch transactions.');
      console.error(err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (transactionsData, paymentData, expenseData, purchasePaymentsData, transportPaymentsData) => {
    let totalInAmount = 0;
    let totalOutAmount = 0;
  
    // Transactions (direct in/out)
    transactionsData.forEach((trans) => {
      const amount = parseFloat(trans.amount) || 0;
      if (trans.type === 'in') {
        totalInAmount += amount;
      } else if (trans.type === 'out') {
        totalOutAmount += amount;
      }
    });
  
    // Billings (billing received counts as "in", expenses as "out")
    // Payments (type "in")
    paymentData.forEach((payment) => {
      totalInAmount += parseFloat(payment.amount) || 0;
    });

    // Other Expenses (type "out")
    expenseData.forEach((expense) => {
      totalOutAmount += parseFloat(expense.amount) || 0;
    });
  
    // Purchase Payments (all "out")
    purchasePaymentsData.forEach((payment) => {
      totalOutAmount += parseFloat(payment.amount) || 0;
    });
  
    // Transport Payments (all "out")
    transportPaymentsData.forEach((payment) => {
      totalOutAmount += parseFloat(payment.amount) || 0;
    });
  
    // Set totals with two decimal places
    setTotalIn(Number(totalInAmount.toFixed(2)));
    setTotalOut(Number(totalOutAmount.toFixed(2)));
  };
  

  useEffect(() => {
    fetchTransactions();
  }, [selectedDate]);

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  const handleTabChange = (tab) => setActiveTab(tab);

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
      purchaseId: '',
      transportId: '',
    });
    setNewCategoryName('');
    setShowAddCategory(false);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Input validation
    if (isNaN(transactionData.amount) || parseFloat(transactionData.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (modalType === 'in' && !transactionData.paymentFrom.trim()) {
      setError('Please enter a payment source.');
      return;
    }

    if (modalType === 'out' && !transactionData.paymentTo.trim()) {
      setError('Please enter a payment destination.');
      return;
    }

    if (modalType === 'transfer') {
      if (!transactionData.paymentFrom.trim() || !transactionData.paymentTo.trim()) {
        setError('Please select both payment source and destination.');
        return;
      }
      if (transactionData.paymentFrom.trim() === transactionData.paymentTo.trim()) {
        setError('Payment source and destination cannot be the same.');
        return;
      }
    }

    if (!transactionData.category.trim() && !newCategoryName.trim()) {
      setError('Please select or enter a category.');
      return;
    }

    if (!transactionData.method.trim()) {
      setError('Please select a payment method.');
      return;
    }

    try {
      // Handle adding new category
      if (showAddCategory) {
        if (!newCategoryName.trim()) {
          setError('Please enter a new category name.');
          return;
        }
        // Add the new category to the database
        const categoryRes = await api.post('/api/daily/transactions/categories', {
          name: newCategoryName.trim(),
        });
        // Update the categories list
        setCategories([...categories, categoryRes.data]);
        // Set the transactionData.category to the new category
        transactionData.category = newCategoryName.trim();
      }

      const payload = {
        ...transactionData,
        type: modalType,
        userId: userInfo._id,
      };

      if (modalType === 'transfer') {
        await api.post('/api/daily/trans/transfer', payload);
      } else if (transactionData.category === 'Purchase Payment') {
        await api.post('/api/purchases/purchases/payments', payload);
      } else if (transactionData.category === 'Transport Payment') {
        await api.post('/api/transport/payments', payload);
      } else {
        await api.post('/api/daily/transactions', payload);
      }

      closeModal();
      fetchTransactions();
    } catch (err) {
      setError('Failed to add transaction.');
      console.error(err);
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((trans) => {
      if (activeTab === 'in') return trans.type === 'in';
      if (activeTab === 'out') return trans.type === 'out';
      return true;
    });
  
    // Include billing payments (type "in")
 // Include payments (type "in")
 if (activeTab === 'in' || activeTab === 'all') {
  payments.forEach((payment) => {
    filtered.push({
      _id: `payment-${payment.billingId}-${Date.now()}`,
      date: payment.date,
      amount: payment.amount,
      paymentFrom: payment.paymentFrom || 'Unknown Customer',
      category: 'Billing Payment',
      method: payment.method || 'Cash',
      remark: payment.remark || 'Payment received',
      type: 'in',
    });
  });
}

// Include other expenses (type "out")
if (activeTab === 'out' || activeTab === 'all') {
  otherExpenses.forEach((expense) => {
    filtered.push({
      _id: `expense-${expense.billingId}-${Date.now()}`,
      date: expense.date,
      amount: expense.amount,
      paymentTo: 'Other Expense',
      category: 'Other Expense',
      method: expense.method || 'Cash',
      remark: expense.remark || 'Additional expense',
      type: 'out',
    });
  });

}

  

  if (activeTab === 'out' || activeTab === 'all') {
  
      // Include purchase payments (type "out")
      purchasePayments.forEach((payment) => {
        filtered.push({
          _id: `purchase-${payment._id}`,
          date: payment.date,
          amount: payment.amount,
          paymentTo: payment.paidTo || 'Vendor',
          category: payment.category || 'Purchase Payment',
          method: payment.method || 'Cash',
          remark: payment.remark || 'Payment towards purchase',
          type: 'out',
        });
      });
  
      // Include transport payments (type "out")
      transportPayments.forEach((payment) => {
        filtered.push({
          _id: `transport-${payment._id}`,
          date: payment.date,
          amount: payment.amount,
          paymentTo: payment.paidTo || 'Transporter',
          category: payment.category || 'Transport Payment',
          method: payment.method || 'Cash',
          remark: payment.remark || 'Payment towards transport',
          type: 'out',
        });
      });
    }
  
    // Sort by date in descending order
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
    return filtered;
  }, [transactions, billings, purchasePayments, transportPayments, activeTab]);
  


  const handleAddNewCategory = async () => {
    const newCategoryName = prompt("Enter new category name:");
    if (newCategoryName) {
      try {
        // Post the new category to the backend
        const response = await api.post("/api/daily/transactions/categories", {
          name: newCategoryName,
        });
        const newCategory = response.data;

        // Update categories list and set new category as selected
        setCategories([...categories, newCategory]);
        setTransactionData({ ...transactionData, category: newCategory.name });

        alert("Category added successfully!");
      } catch (error) {
        console.error("Error adding category:", error);
        alert(
          error.response?.data?.message || "Failed to add category. Try again."
        );
      }
    }
  };



  return (
    <>
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div
          onClick={() => navigate('/')}
          className="text-center cursor-pointer"
        >
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Daily Transactions and Accounts
          </p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

      {/* Top Navigation */}
      <div className="flex items-center justify-between bg-white p-4 shadow-md">
        <h2 className="text-sm font-bold text-gray-800">Daily Transactions</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <ErrorModal message={error} onClose={() => setError('')} />
      )}

      {/* Totals Section */}
      <div className="flex space-x-4 p-4">
        <div className="flex-1 bg-green-100 text-green-700 p-3 rounded-lg">
          <p className="text-xs">Total Payment In</p>
          <p className="text-sm font-bold">₹ {totalIn.toFixed(2)}</p>
        </div>
        <div className="flex-1 bg-red-100 text-red-700 p-3 rounded-lg">
          <p className="text-xs">Total Payment Out</p>
          <p className="text-sm font-bold">₹ {totalOut.toFixed(2)}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center p-2">
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-1 text-xs rounded-full ${
              activeTab === 'all' ? 'bg-white text-red-600 shadow-md' : 'text-gray-600'
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => handleTabChange('in')}
            className={`px-4 py-1 text-xs rounded-full ${
              activeTab === 'in' ? 'bg-white text-red-600 shadow-md' : 'text-gray-600'
            }`}
          >
            Payment In
          </button>
          <button
            onClick={() => handleTabChange('out')}
            className={`px-4 py-1 text-xs rounded-full ${
              activeTab === 'out' ? 'bg-white text-red-600 shadow-md' : 'text-gray-600'
            }`}
          >
            Payment Out
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="p-4 mb-20">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <>
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500 text-xs">
                No transactions found for the selected criteria.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((trans) => (
                  <div
                    key={trans._id}
                    className="flex justify-between items-center p-2 bg-white shadow-sm rounded-lg"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-700">{trans.category}</p>
                      <p className="text-xs text-gray-500">
                        {trans.type === 'in' ? 'From' : 'To'}: {trans.type === 'in' ? trans.paymentFrom : trans.paymentTo}
                      </p>
                      <p className="text-xs text-gray-500">{trans.remark}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${trans.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {trans.type === 'in' ? '+' : '-'}₹{parseFloat(trans.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(trans.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Payment Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-2 flex justify-around border-t">
        <button
          onClick={() => openModal('in')}
          className="flex font-bold items-center justify-center bg-green-500 text-white w-12 h-12 rounded-full shadow-lg"
        >
          +
        </button>

        <button
          onClick={() => openModal('transfer')}
          className="flex font-bold items-center justify-center bg-blue-500 text-white w-12 h-12 rounded-full shadow-lg"
        >
          <i className='fa fa-money' />
        </button>

        <button
          onClick={() => openModal('out')}
          className="flex font-bold items-center justify-center bg-red-500 text-white w-12 h-12 rounded-full shadow-lg"
        >
          -
        </button>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50">
          <div className="bg-white w-full rounded-t-lg p-4 relative shadow-lg animate-slide-up">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold">
                {modalType === 'in'
                  ? 'Add Payment In'
                  : modalType === 'out'
                  ? 'Add Payment Out'
                  : 'Transfer Between Accounts'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <form onSubmit={handleTransactionSubmit}>
              {error && (
                <p className="text-xs text-red-500 mb-2">{error}</p>
              )}
              <div className="mb-2">
                <label className="block text-xs font-bold mb-1">Date</label>
                <input
                  type="date"
                  value={transactionData.date}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              {modalType === 'in' && (
                <div className="mb-2">
                  <label className="block text-xs font-bold mb-1">Payment From</label>
                  <input
                    type="text"
                    value={transactionData.paymentFrom}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        paymentFrom: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              )}
              {modalType === 'out' && (
                <div className="mb-2">
                  <label className="block text-xs font-bold mb-1">Payment To</label>
                  <input
                    type="text"
                    value={transactionData.paymentTo}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        paymentTo: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              )}
              {modalType === 'transfer' && (
                <>
                  <label className="block text-xs font-bold mb-1">
                    Payment From
                  </label>
                  <select
                    value={transactionData.paymentFrom}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        paymentFrom: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account._id} value={account.accountId}>
                        {account.accountName}
                      </option>
                    ))}
                  </select>

                  <label className="block text-xs font-bold mb-1 mt-2">
                    Payment To
                  </label>
                  <select
                    value={transactionData.paymentTo}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        paymentTo: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account._id} value={account.accountId}>
                        {account.accountName}
                      </option>
                    ))}
                  </select>
                </>
              )}
       <div className="mb-2">
      <label className="block text-xs font-bold mb-1">Category</label>
      <select
        value={transactionData.category}
        onChange={(e) => {
          if (e.target.value === "add_new_category") {
            handleAddNewCategory();
          } else {
            setTransactionData({
              ...transactionData,
              category: e.target.value,
            });
          }
        }}
        className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
        required
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat.name}>
            {cat.name}
          </option>
        ))}
        <option value="add_new_category">Add New Category</option>
      </select>
    </div>

              {modalType === 'out' && transactionData.category === 'Purchase Payment' && (
                <div className="mb-2">
                  <label className="block text-xs font-bold mb-1">Purchase</label>
                  <select
                    value={transactionData.purchaseId || ''}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        purchaseId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select Purchase</option>
                    {purchasePayments.map((purchase) => (
                      <option key={purchase._id} value={purchase._id}>
                        {purchase.invoiceNo} - {purchase.sellerName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {modalType === 'out' && transactionData.category === 'Transport Payment' && (
                <div className="mb-2">
                  <label className="block text-xs font-bold mb-1">Transport</label>
                  <select
                    value={transactionData.transportId || ''}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        transportId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select Transport</option>
                    {transportPayments.map((transport) => (
                      <option key={transport._id} value={transport._id}>
                        {transport.transportName} - {transport.transportDate}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                  className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
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
                  className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Select Method</option>
                  {accounts.map((account) => (
                    <option key={account._id} value={account.accountId}>
                      {account.accountName}
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
                  className="w-full border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500"
                  rows="2"
                  placeholder="Optional remarks"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md mr-2 text-xs hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors duration-200"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS for modal animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0%);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default DailyTransactions;
