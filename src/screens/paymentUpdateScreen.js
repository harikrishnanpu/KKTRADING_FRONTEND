import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const EmployeePaymentExpensePage = () => {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billingDetails, setBillingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [fuelCharge, setFuelCharge] = useState("");
  const [otherExpenses, setOtherExpenses] = useState([{ amount: 0, remark: "" }]); // Allow multiple expenses
  const [activeSection, setActiveSection] = useState("Billing Details");
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (invoiceNo) {
        console.log(invoiceNo)
        try {
          const response = await api.get(`/api/billing/billing/suggestions?search=${invoiceNo}`);
          setSuggestions(response.data);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [invoiceNo]);

  const handleFetchBilling = async (id) => {
    if (!invoiceNo) {
      setError("Please enter an invoice number.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get(`/api/billing/${id}`);
      setBillingDetails(response.data);
      setRemainingAmount(
        (response.data.billingAmount - response.data.discount) -
        (response.data.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0)
      );
      setError("");
    } catch (error) {
      console.error("Error fetching billing data:", error);
      setError("Error fetching billing data. Please check the invoice number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!billingDetails) return;
    if (!paymentAmount || !paymentMethod) {
      setError("Please enter a valid payment amount and method.");
      return;
    }

    setIsLoading(true);
    try {
        const updatedPaymentStatus =
        paymentAmount >= billingDetails.billingAmount
          ? "Paid"
          : paymentAmount > 0
          ? "Partial"
          : "Pending";

      await api.post("/api/users/billing/update-payment", {
        invoiceNo: billingDetails.invoiceNo,
        paymentAmount,
        paymentMethod,
        paymentStatus: updatedPaymentStatus,
      });
      handleFetchBilling(billingDetails._id);
      setPaymentAmount("");
      setPaymentMethod("Cash");
      setError("");
      setShowSuccessModal(true);
      setActiveSection("Billing Details");
    } catch (error) {
      console.error("Error adding payment:", error);
      setError("Error adding payment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpenses = async () => {
    if (!billingDetails) return;
  
    // Check if fuelCharge or otherExpenses are provided
    if (!fuelCharge && (!otherExpenses || otherExpenses.length === 0)) {
      setError("Please enter either fuel charge or other expenses.");
      return;
    }
  
    // Validate and filter otherExpenses to only include items with a valid amount
    const validOtherExpenses = Array.isArray(otherExpenses)
      ? otherExpenses.filter(expense => expense.amount > 0 && expense.remark)
      : [];
  
    if (!fuelCharge && validOtherExpenses.length === 0) {
      setError("Please enter a valid fuel charge or at least one other expense with an amount and remark.");
      return;
    }
  
    setIsLoading(true);
    try {
      await api.post(`/api/billing/billing/${billingDetails._id}/addExpenses`, {
        fuelCharge: fuelCharge || 0, // default to 0 if not provided
        otherExpenses: validOtherExpenses,
      });
      
      // Refetch updated billing details after adding expenses
      await handleFetchBilling(billingDetails._id);
  
      // Reset input fields
      setFuelCharge("");
      setOtherExpenses([{ amount: 0, remark: "" }]); // Reset otherExpenses to an empty array of objects
      setError("");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding expenses:", error);
      setError("Error adding expenses.");
    } finally {
      setIsLoading(false);
    }
  };
  


  const handleOtherExpensesChange = (index, field, value) => {
    const updatedExpenses = [...otherExpenses];
    updatedExpenses[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setOtherExpenses(updatedExpenses);
  };

  const handleAddExpense = () => {
    setOtherExpenses([...otherExpenses, { amount: 0, remark: "" }]);
  };


  const handleSuggestionClick = (suggestion) => {
    setInvoiceNo(suggestion.invoiceNo);
    setSuggestions([]);
    handleFetchBilling(suggestion._id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      handleSuggestionClick(suggestions[selectedSuggestionIndex]);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Employee Payment & Expense Updation</p>
        </div>
        <i className="fa fa-money-check-alt text-gray-500" />
      </div>

      {/* Integrated Navigation with Bottom Border Animation */}
      <div className="flex justify-center gap-8">
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "Billing Details" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("Billing Details")}
        >
          Billing Details
          {activeSection === "Billing Details" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "Payment Section" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("Payment Section")}
        >
          Payment Section
          {activeSection === "Payment Section" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "Expense Section" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("Expense Section")}
        >
          Expense Section
          {activeSection === "Expense Section" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>

        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "Previous Payments" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("Previous Payments")}
        >
          Previous Payments
          {activeSection === "Previous Payments" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
      </div>

      <div className="flex flex-col justify-center items-center p-2">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-lg p-6">
          {!billingDetails && (
            <div className="mb-4">
              <div className="relative w-full">
                <label className="font-bold text-xs text-gray-500">Invoice No.</label>
                <input
                  type="text"
                  placeholder="Enter Invoice Number"
                  value={invoiceNo}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full p-2 pr-8 focus:outline-none focus:border-red-300 focus:ring-red-300 border-gray-300 rounded-md"
                />
                <i onClick={() => setInvoiceNo('')} className="fa fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
          )}

          {!billingDetails && suggestions.length > 0 && (
            <ul className="bg-white divide-y shadow-lg rounded-md overflow-hidden mb-4 border border-gray-300">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion._id}
                  className={`p-4 cursor-pointer hover:bg-gray-100 flex justify-between ${
                    index === selectedSuggestionIndex ? "bg-gray-200" : ""
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="font-bold text-xs text-gray-500">{suggestion.invoiceNo}</span>
                  <i className="fa fa-arrow-right text-gray-300" />
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}

          {billingDetails && (
            <div>
            {activeSection === "Billing Details" && (
  <div>
    {/* Billing Details Section */}
    <div className="mt-4 border-b pb-4 flex justify-between items-center relative">
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
        {billingDetails.invoiceNo}
      </h5>

      {/* Background-only Ping Effect */}
      <span className={`absolute inset-y-0 right-0  opacity-75 rounded-3xl animate-ping-small w-44 py-5 h-8  z-0 ${     billingDetails.paymentStatus === "Paid"
            ? "text-green-600 bg-green-200 hover:bg-green-300 hover:scale-100"
            : billingDetails.paymentStatus === "Partial"
            ? "text-yellow-600 bg-yellow-200 hover:bg-yellow-300 hover:scale-105"
            : "text-red-600 bg-red-200 hover:bg-red-300 hover:scale-105"
        } `}></span>
      
      {/* Payment Status Badge */}
      <p
        className={`mt-auto mr-2 mb-auto py-2 w-40 text-center ml-auto rounded-full text-xs font-bold z-20 shadow-md transition-all duration-300 ease-in-out transform ${
          billingDetails.paymentStatus === "Paid"
            ? "text-green-600 bg-green-200 hover:bg-green-300 hover:scale-105"
            : billingDetails.paymentStatus === "Partial"
            ? "text-yellow-600 bg-yellow-200 hover:bg-yellow-300 hover:scale-105"
            : "text-red-600 bg-red-200 hover:bg-red-300 hover:scale-105"
        }`}
      >
        Payment: {billingDetails.paymentStatus}
      </p>
    </div>

    <div className="flex justify-between pt-3">
      <p className="mt-1 text-xs truncate font-bold text-gray-600">
        Customer: {billingDetails.customerName}
      </p>
      <p className="mt-1 text-xs truncate font-normal text-gray-700">
        Exp. Delivery Date: {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}
      </p>
    </div>

    <div className="flex justify-between">
      <p className="mt-1 text-xs font-medium text-gray-600">
       Customer Address: <span className="font-bold text-gray-500">{billingDetails.customerAddress}</span>
      </p>
      <p className="mt-1 text-xs font-medium text-gray-600">
        Received Amount: <span className="font-bold text-green-500">{billingDetails.billingAmountReceived}</span>
      </p>
    </div>

    <div className="flex justify-between">
      <p className="mt-1 text-sm font-bold text-gray-600">
        Bill Amount: <span className="font-bold text-gray-600">{billingDetails.billingAmount.toFixed(2)}</span>
      </p>
      <p className="mt-1 text-xs font-medium text-gray-600">
        Remaining Amount: <span className="font-bold text-red-500">{remainingAmount.toFixed(2)}</span>
      </p>
    </div>

    {/* Expense Summary Section */}
    <div className="mt-4 border-t border-gray-200 pt-4">
      <p className="text-xs text-gray-500 font-semibold">
        Total Fuel Expenses: ${billingDetails.fuelCharge.toFixed(2)}
      </p>
      <p className="text-xs mt-1 text-gray-500 font-semibold">
        Total Other Expenses: ${billingDetails.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
      </p>
      <p className="text-xs mt-1 text-gray-500 font-semibold">
        Grand Total (Fuel + Other Expenses): $
        {(
          billingDetails.fuelCharge +
          (billingDetails.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0)
        ).toFixed(2)}
      </p>
    </div>

    {/* Payment Summary Section */}
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h4 className="text-md font-bold text-gray-700">Payment Summary</h4>

      {/* Total Payments In */}
      <p className="text-xs mt-2 text-gray-500 font-semibold">
        Total Payments In: $
        {billingDetails.payments?.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
      </p>

      {/* Net Balance (Total In - Total Out) */}
      <p className="text-xs mt-1 text-gray-500 font-semibold">
        Net Balance (In - Expenses): $
        {(
          billingDetails.payments?.reduce((sum, payment) => sum + payment.amount, 0) -
          (billingDetails.fuelCharge +
            (billingDetails.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0))
        ).toFixed(2)}
      </p>
    </div>
  </div>
)}


              {/* Payment Section */}
              {activeSection === "Payment Section" && (
                <div className="mt-6 pt-4">
                  <h3 className="text-md font-bold text-gray-600 mb-2">Add Payment</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Payment Amount</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Math.min(Number(e.target.value), remainingAmount))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <button
                      className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-lg mt-4"
                      onClick={handleAddPayment}
                      disabled={isLoading}
                    >
                      Submit Payment
                    </button>
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                  </div>
                </div>
              )}

              {/* Expense Section */}
              {activeSection === "Expense Section" && (
                <div className="mt-6 pt-4">
                  <h3 className="text-md font-bold text-gray-600 mb-2">Add Expenses</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Fuel Charge</label>
                      <input
                        type="number"
                        value={fuelCharge}
                        onChange={(e) => setFuelCharge(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
                      />
                    </div>
                    <div className="mt-4">
                <h3 className="text-xs font-bold text-gray-500 mb-1">Add Other Expenses</h3>
                {otherExpenses?.map((expense, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => handleOtherExpensesChange(index, "amount", e.target.value)}
                      placeholder="Amount"
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
                    />
                    <input
                      type="text"
                      value={expense.remark}
                      onChange={(e) => handleOtherExpensesChange(index, "remark", e.target.value)}
                      placeholder="Remark"
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
                    />
                  </div>
                ))}
                <button
                  onClick={handleAddExpense}
                  className="text-xs font-bold text-blue-500 hover:text-blue-700 mt-2"
                >
                  + Add Expense
                </button>
              </div>
                    <button
                      className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-lg mt-4"
                      onClick={handleAddExpenses}
                      disabled={isLoading}
                    >
                      Submit Expenses
                    </button>
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                  </div>
                </div>
              )}



{activeSection === "Previous Payments" && (
  <div className="mt-6">
    <h3 className="text-md font-bold text-gray-600 mb-2">Previous Payments</h3>
    
    {/* List of payments */}
    <ul className="divide-y divide-gray-200 mb-4">
      {billingDetails.payments?.map((payment, index) => (
        <li key={index} className="py-2">
          <p className="text-sm text-gray-700 font-semibold">
            {payment.method}: ${payment.amount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(payment.date).toLocaleDateString()}
          </p>
        </li>
      ))}
    </ul>

    {/* Fuel Charge */}
    <div className="py-2 border-t border-gray-200">
      <p className="text-sm text-gray-700 font-semibold">
        Fuel Charge: ${billingDetails.fuelCharge.toFixed(2)}
      </p>
    </div>

    {/* Other Expenses */}
    <div className="mt-4">
      <h4 className="text-sm font-bold text-gray-600 mb-2">Other Expenses</h4>
      <ul className="divide-y divide-gray-200">
        {billingDetails.otherExpenses?.map((expense, index) => (
          <li key={index} className="py-2">
            <p className="text-sm text-gray-700 font-semibold">
              ${expense.amount.toFixed(2)} - {expense.remark}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(expense.date).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>

    {/* Total for Fuel and Other Expenses */}
    <div className="mt-4 border-t border-gray-200 pt-4">
      <p className="text-sm text-gray-800 font-semibold">
        Total Other Expenses: $
        {billingDetails.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
      </p>
      <p className="text-sm text-gray-800 font-semibold">
        Grand Total (Fuel + Other Expenses): $
        {(
          billingDetails.fuelCharge +
          (billingDetails.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0)
        ).toFixed(2)}
      </p>
    </div>
  </div>
)}



            </div>
          )}

          {showSuccessModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white text-center p-6 rounded-lg shadow-lg">
                <h3 className="text-md font-bold text-gray-500">Update Successful</h3>
                <p className="text-xs italic text-gray-400 mt-1 mb-5">Successfully updated the billing information.</p>
                <button
                  className="bg-green-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  onClick={() => setShowSuccessModal(false)}
                >
                  <i className="fa fa-check" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePaymentExpensePage;
