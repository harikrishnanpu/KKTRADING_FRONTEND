// src/screens/EditPurchasePaymentPage.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import ErrorModal from "../components/ErrorModal"; // Ensure this component exists
import "react-loading-skeleton/dist/skeleton.css";

const EditPurchasePaymentPage = () => {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billingDetails, setBillingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const invoiceNoRef = useRef();
  const paymentAmountRef = useRef();
  const paymentMethodRef = useRef();
  const paymentDateRef = useRef();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (invoiceNo) {
        try {
          const response = await api.get(
            `/api/purchases/payments/suggesstion?suggestions=true&search=${invoiceNo}`
          );
          setSuggestions(response.data);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchSuggestions();
    }, 300); // Debounce to reduce API calls

    return () => clearTimeout(debounceFetch);
  }, [invoiceNo]);

  const handleFetchBilling = async (id) => {
    if (!invoiceNo) {
      setError("Please enter an invoice number.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get(`/api/purchases/get/${id}`);
      setBillingDetails(response.data);

      const totalPayments = response.data.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      const remaining = response.data.totalAmount - totalPayments;
      setRemainingAmount(remaining >= 0 ? remaining : 0);
      setError("");
    } catch (error) {
      console.error("Error fetching billing data:", error);
      setError("Error fetching billing data. Please check the invoice number.");
      setBillingDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!billingDetails) return;
    if (!paymentAmount || !paymentMethod || !paymentDate) {
      setError("Please enter a valid payment amount, method, and date.");
      return;
    }

    if (Number(paymentAmount) <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (Number(paymentAmount) > remainingAmount) {
      setError("Payment amount cannot exceed the remaining amount.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/purchases/${billingDetails._id}/payments`, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        remark: "", // Optionally add a remark field in the form
        date: paymentDate,
      });
      await handleFetchBilling(billingDetails._id);
      setPaymentAmount("");
      setPaymentMethod("Cash");
      setPaymentDate("");
      setError("");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding payment:", error);
      setError("Error adding payment. Please try again.");
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
      <div
        className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="text-center">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Edit Purchase Payments
          </p>
        </div>
        <i className="fa fa-money-check-alt text-gray-500" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center gap-8 mb-6">
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            "Payment Section" === "Payment Section"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600"
          }`}
          onClick={() => {}}
        >
          Payment Section
          {/* Underline */}
          {true && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></span>
          )}
        </button>
      </div>

      <div className="flex flex-col justify-center items-center p-2">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-lg p-6">
          {/* Invoice Number Input */}
          {!billingDetails && (
            <div className="mb-4">
              <div className="relative w-full">
                <label className="font-bold text-xs text-gray-500">
                  Invoice No.
                </label>
                <input
                  type="text"
                  placeholder="Enter Invoice Number"
                  value={invoiceNo}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  ref={invoiceNoRef}
                  className="w-full p-2 pr-8 focus:outline-none focus:border-red-300 focus:ring-red-300 border-gray-300 rounded-md text-xs"
                />
                <i
                  onClick={() => setInvoiceNo("")}
                  className="fa fa-times absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                ></i>
              </div>
            </div>
          )}

          {/* Suggestions Dropdown */}
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
                  <span className="font-bold text-xs text-gray-500">
                    {suggestion.invoiceNo}
                  </span>
                  <i className="fa fa-arrow-right text-gray-300" />
                </li>
              ))}
            </ul>
          )}

          {/* Error Message */}
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}

          {/* Billing Details */}
          {billingDetails && (
            <div className="mt-4">
              {/* Summary at the Top */}
              <div className="border-b pb-4 flex justify-between items-center relative">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                  {billingDetails.invoiceNo}
                </h5>

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

              {/* Paid Amount, Remaining Amount, Total Bill Amount */}
              <div className="flex justify-between mt-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-600">
                    Total Bill Amount:
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    ₹{billingDetails.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-600">
                    Paid Amount:
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    ₹
                    {billingDetails.payments
                      .reduce((sum, payment) => sum + payment.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-600">
                    Remaining Amount:
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    ₹{remainingAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Detailed Billing Information */}
              <div className="flex justify-between pt-3">
                <p className="mt-1 text-xs truncate font-bold text-gray-600">
                  Seller: {billingDetails.sellerName}
                </p>
                <p className="mt-1 text-xs truncate font-normal text-gray-700">
                  Invoice Date:{" "}
                  {billingDetails.invoiceDate
                    ? new Date(billingDetails.invoiceDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className="flex justify-between">
                <p className="mt-1 text-xs font-medium text-gray-600">
                  Seller Address:{" "}
                  <span className="font-bold text-gray-500">
                    {billingDetails.sellerAddress}
                  </span>
                </p>
                <p className="mt-1 text-xs font-medium text-gray-600">
                  Seller GSTIN:{" "}
                  <span className="font-bold text-gray-500">
                    {billingDetails.sellerGst}
                  </span>
                </p>
              </div>

              {/* Payments Section */}
              <div className="mt-6">
                <h3 className="text-md font-bold text-gray-600 mb-2">
                  Previous Payments
                </h3>
                {billingDetails.payments.length === 0 ? (
                  <p className="text-xs text-gray-500">No payments made yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 mb-4">
                    {billingDetails.payments.map((payment, index) => (
                      <li key={index} className="py-2 flex justify-between">
                        <div>
                          <p className="text-sm text-gray-700 font-semibold">
                            {payment.method}: ₹{payment.amount.toFixed(2)}
                          </p>
                          {payment.remark && (
                            <p className="text-xs text-gray-500">
                              Remark: {payment.remark}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Payment Section */}
          {billingDetails && (
            <div className="mt-6 pt-4">
              <h3 className="text-md font-bold text-gray-600 mb-2">Add Payment</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(
                        e.target.value > remainingAmount
                          ? remainingAmount
                          : e.target.value
                      )
                    }
                    max={remainingAmount}
                    ref={paymentAmountRef}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                    placeholder={`Max: ₹${remainingAmount.toFixed(2)}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    ref={paymentMethodRef}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    ref={paymentDateRef}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                  />
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

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white text-center p-6 rounded-lg shadow-lg">
                <h3 className="text-md font-bold text-gray-500">Payment Successful</h3>
                <p className="text-xs italic text-gray-400 mt-1 mb-5">
                  Successfully updated the payment information.
                </p>
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

export default EditPurchasePaymentPage;
