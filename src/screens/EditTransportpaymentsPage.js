// src/screens/EditTransportPaymentPage.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api"; // Adjust the import path as necessary
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useSelector } from "react-redux";

const EditTransportPaymentPage = () => {
  const [transportName, setTransportName] = useState("");
  const [transportDetails, setTransportDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [remark, setRemark] = useState("");
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(""); // For error modal
  const [successMessage, setSuccessMessage] = useState(""); // For success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  const transportNameRef = useRef();

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/api/accounts/allaccounts");
        const getPaymentMethod = response.data.map((acc) => acc.accountId);

        if (getPaymentMethod.length > 0) {
          const firstAccountId = getPaymentMethod[0];
          setPaymentMethod(firstAccountId);
        } else {
          setPaymentMethod(null);
        }

        setAccounts(response.data);
      } catch (err) {
        setErrorMessage("Failed to fetch payment accounts.");
        setShowErrorModal(true);
        setTimeout(() => setShowErrorModal(false), 3000);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (transportName) {
        try {
          const response = await api.get(
            `/api/transportpayments/suggestions?search=${transportName}`
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
  }, [transportName]);

  const handleFetchTransportDetails = async (id) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/transportpayments/get-transport/${id}`);
      setTransportDetails(response.data);
      const remaining = response.data.paymentRemaining;
      setRemainingAmount(remaining >= 0 ? remaining : 0);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching transport data:", error);
      setErrorMessage("Error fetching transport data. Please check the company name.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
      setTransportDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!transportDetails) return;
    if (!paymentAmount || !paymentMethod || !paymentDate) {
      setErrorMessage("Please enter a valid payment amount, method, and date.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
      return;
    }

    if (Number(paymentAmount) <= 0) {
      setErrorMessage("Payment amount must be greater than zero.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
      return;
    }

    if (Number(paymentAmount) > remainingAmount) {
      setErrorMessage("Payment amount cannot exceed the remaining amount.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
      return;
    }

    setIsLoading(true);
    try {
      await api.post(
        `/api/transportpayments/add-payments/${transportDetails._id}`,
        {
          amount: Number(paymentAmount),
          method: paymentMethod,
          remark: remark,
          date: paymentDate,
          userId: userInfo._id,
          transportId: transportDetails.transportId,
          transportName: transportDetails.transportName,
        }
      );
      await handleFetchTransportDetails(transportDetails._id);
      setPaymentAmount("");
      setPaymentMethod(""); // Reset to default
      setPaymentDate("");
      setRemark("");
      setErrorMessage("");
      setSuccessMessage("Payment added successfully!");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      setAddPaymentModal(false); // Close the add payment modal
    } catch (error) {
      console.error("Error adding payment:", error);
      setErrorMessage("Error adding payment. Please try again.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setTransportName(suggestion.transportName);
    setSuggestions([]);
    handleFetchTransportDetails(suggestion._id);
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
            Edit Transport Payments
          </p>
        </div>
        <i className="fa fa-money-check-alt text-gray-500" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center gap-8 mb-6">
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "home"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveSection("home")}
        >
          Home
          {activeSection === "home" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "prevPayments"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveSection("prevPayments")}
        >
          Previous payments
          {activeSection === "prevPayments" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
      </div>

      <div className="flex flex-col justify-center items-center p-2">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-lg p-6">
          {/* Transport Name Input */}
          {!transportDetails && (
            <div className="mb-4">
              <div className="relative w-full">
                <label className="font-bold text-xs text-gray-500">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Company Name"
                  value={transportName}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setTransportName(e.target.value)}
                  ref={transportNameRef}
                  className="w-full p-2 pr-8 focus:outline-none focus:border-red-300 focus:ring-red-300 border-gray-300 rounded-md text-xs"
                />
                <i
                  onClick={() => setTransportName(" ")}
                  className="fa fa-angle-down absolute right-3 bottom-0 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                ></i>
              </div>
            </div>
          )}

          {/* Suggestions Dropdown */}
          {!transportDetails && suggestions.length > 0 && (
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
                    {suggestion.transportName}
                  </span>
                  <i className="fa fa-arrow-right text-gray-300" />
                </li>
              ))}
            </ul>
          )}

          {/* Error and Success Modals */}
          {showErrorModal && (
            <div className="fixed top-4 right-4 bg-red-500 text-white p-3 rounded-md shadow-md animate-slideIn">
              <p className="text-xs">{errorMessage}</p>
            </div>
          )}

          {showSuccessModal && (
            <div className="fixed top-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-md animate-slideIn">
              <p className="text-xs">{successMessage}</p>
            </div>
          )}

          {/* Transport Details */}
          {isLoading ? (
            <div>
              <Skeleton height={30} count={1} />
              <Skeleton height={20} count={3} style={{ marginTop: "10px" }} />
            </div>
          ) : (
            transportDetails && (
              <>
                {activeSection === "home" && (
                  <div className="mt-4">
                    {/* Summary at the Top */}
                    <div className="border-b pb-4 flex justify-between items-center relative">
                      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                        {transportDetails.transportName}
                      </h5>

                      {/* Payment Status Badge */}
                      {(() => {
                        let paymentStatus = "";
                        let paymentStatusClass = "";

                        if (transportDetails.paymentRemaining === 0) {
                          paymentStatus = "Paid";
                          paymentStatusClass =
                            "text-green-600 bg-green-200 hover:bg-green-300 hover:scale-105";
                        } else if (
                          transportDetails.totalAmountPaid === 0 &&
                          transportDetails.paymentRemaining > 0
                        ) {
                          paymentStatus = "Unpaid";
                          paymentStatusClass =
                            "text-red-600 bg-red-200 hover:bg-red-300 hover:scale-105";
                        } else if (
                          transportDetails.paymentRemaining > 0 &&
                          transportDetails.totalAmountPaid > 0
                        ) {
                          paymentStatus = "Partial";
                          paymentStatusClass =
                            "text-yellow-600 bg-yellow-200 hover:bg-yellow-300 hover:scale-105";
                        }

                        return (
                          <p
                            className={`mt-auto mr-2 mb-auto py-2 w-40 text-center ml-auto rounded-full text-xs font-bold z-20 shadow-md transition-all duration-300 ease-in-out transform ${paymentStatusClass}`}
                          >
                            Payment: {paymentStatus}
                          </p>
                        );
                      })()}
                    </div>

                    {/* Paid Amount, Remaining Amount, Total Billed Amount */}
                    <div className="flex justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Total Billed Amount:
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          ₹{transportDetails.totalAmountBilled.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Paid Amount:
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          ₹{transportDetails.totalAmountPaid.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Remaining Amount:
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          ₹{transportDetails.paymentRemaining.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Add Payment Button */}
                    <div className="mt-6">
                      <button
                        className="bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
                        onClick={() => setAddPaymentModal(true)}
                      >
                        Add Payment
                      </button>
                    </div>

                    {/* Billings Section */}
                    <div className="mt-6">
                      <h3 className="text-md font-bold text-gray-600 mb-2">
                        Billings
                      </h3>
                      {transportDetails.billings.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          No billings found.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {transportDetails.billings.map((billing, index) => (
                            <div
                              key={index}
                              className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm text-gray-700 font-semibold">
                                  Invoice No: {billing.invoiceNo}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Amount: ₹{billing.amount.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  {new Date(billing.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "prevPayments" && (
                  <div className="mt-6">
                    <h3 className="text-md font-bold text-gray-600 mb-2">
                      Payments
                    </h3>
                    {transportDetails.payments.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No payments made yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {transportDetails.payments.map((payment, index) => (
                          <div
                            key={index}
                            className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center"
                          >
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          )}

          {/* Add Payment Modal */}
          {addPaymentModal && (
            <div className="fixed inset-0 flex items-end justify-center bg-black bg-opacity-50">
              <div className="bg-white animate-slide-up w-full rounded-t-lg p-4 animate-slideUp">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold text-gray-600">Add Payment</h3>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setAddPaymentModal(false)}
                  >
                    <i className="fa fa-times"></i>
                  </button>
                </div>
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                      placeholder={`Max: ₹${remainingAmount.toFixed(2)}`}
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
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Remark
                    </label>
                    <input
                      type="text"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                      placeholder="Enter remark (optional)"
                    />
                  </div>
                  <button
                    className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-lg mt-4"
                    onClick={handleAddPayment}
                    disabled={isLoading}
                  >
                    Submit Payment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditTransportPaymentPage;
