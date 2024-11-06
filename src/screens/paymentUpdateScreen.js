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
  const [otherExpenses, setOtherExpenses] = useState("");
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
        response.data.billingAmount -
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
    if (!fuelCharge && !otherExpenses) {
      setError("Please enter either fuel charge or other expenses.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/billing/billing/${billingDetails._id}/addExpenses`, {
        fuelCharge,
        otherExpenses,
      });
      handleFetchBilling(billingDetails._id);
      setFuelCharge("");
      setOtherExpenses("");
      setError("");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding expenses:", error);
      setError("Error adding expenses.");
    } finally {
      setIsLoading(false);
    }
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
                  <div className="mt-4 flex justify-between">
                    <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                      {billingDetails.invoiceNo}
                    </h5>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        billingDetails.paymentStatus !== "Paid" ? "text-red-400" : "text-green-500"
                      }`}
                    >
                      Payment Status: {billingDetails.paymentStatus}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="mt-1 text-xs truncate font-bold text-gray-600">
                      Customer: {billingDetails.customerName}
                    </p>
                    <p className="mt-1 text-xs truncate font-normal text-gray-700">
                      Exp. Delivery Date: {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="mt-1 text-xs font-medium text-gray-600">
                      Bill Amount: <span className="font-bold text-gray-500">{billingDetails.billingAmount}</span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-600">
                      Remaining Amount: <span className="font-bold text-gray-500">{remainingAmount}</span>
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
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Other Expenses</label>
                      <input
                        type="number"
                        value={otherExpenses}
                        onChange={(e) => setOtherExpenses(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
                      />
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
    <ul className="divide-y divide-gray-200">
      {billingDetails.payments?.map((payment, index) => (
        <li key={index} className="py-2">
          <p className="text-sm text-gray-700 font-semibold">{payment.method}: ${payment.amount}</p>
          <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
        </li>
      ))}
      <li className="py-2">
        <p className="text-sm text-gray-700 font-semibold">Fuel Charge: ${billingDetails.fuelCharge}</p>
      </li>
      <li className="py-2">
        <p className="text-sm text-gray-700 font-semibold">Other Expenses: ${billingDetails.otherExpenses}</p>
      </li>
    </ul>
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
