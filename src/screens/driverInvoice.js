import React, { useState, useEffect } from "react";
import axios from "axios";

const DriverBillingPage = () => {
  const [invoiceNo, setInvoiceNo] = useState(""); // Invoice input
  const [billingDetails, setBillingDetails] = useState(null); // Billing details after fetching
  const [newDeliveryStatus, setNewDeliveryStatus] = useState(""); // Editable delivery status
  const [newPaymentStatus, setNewPaymentStatus] = useState(""); // Editable payment status
 
  const [error, setError] = useState(""); // Error message handling
  const [showDetails, setShowDetails] = useState(false); // To toggle the details section
  const [suggestions, setSuggestions] = useState([]); // Invoice number suggestions
  const [isLoading, setIsLoading] = useState(false); // To manage loading state
  const [billingId, setbillingId] = useState('');

  // Handle suggestions based on the invoice input
  // Search for suggestions based on input
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (invoiceNo) {
        try {
          const response = await axios.get(`/api/billing/billing/suggestions?search=${invoiceNo}`);
          setSuggestions(response.data);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]); // Clear suggestions if no search term
      }
    };

    fetchSuggestions();
  }, [invoiceNo]);

  // Fetch billing details and show them after clicking "Next"
  const handleNextClick = async (id) => {
    if (!invoiceNo) {
      setError("Please enter an invoice number.");
      return;
    }
    try {
      setInvoiceNo('')
      setIsLoading(true); // Show loading indicator
      if(id){
      const response = await axios.get(`/api/billing/${id}`);
      setBillingDetails(response.data);
      setNewDeliveryStatus(response.data.deliveryStatus);
      setNewPaymentStatus(response.data.paymentStatus);
      setError("");
      setShowDetails(true); // Show details section
      console.log(response.data);
      }
    } catch (error) {
      setError("Error fetching billing details. Please check the invoice number.");
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  // Handle updating delivery and payment statuses
  const handleUpdateStatus = async () => {
    if (!newDeliveryStatus || !newPaymentStatus) {
      setError("Please select both statuses.");
      return;
    }
    try {
      await axios.put(`/api/billing/driver/billings/${billingDetails._id}`, {
        deliveryStatus: newDeliveryStatus,
        paymentStatus: newPaymentStatus,
      });
      setError(""); // Clear error after successful update
      alert("Billing status updated successfully.");
    } catch (error) {
      setError("Error updating status.");
    }
  };

  // Handle selecting a suggestion
  const handleSuggestionClick = (suggestion) => {
    setInvoiceNo(suggestion.invoiceNo);
    setSuggestions([]); // Clear suggestions after selecting one
    handleNextClick(suggestion._id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Driver Billing Management</h1>

      {/* Invoice Input and Suggestions */}
      <div className="relative mb-6 w-full max-w-md">
        <input
          type="text"
          placeholder="Enter Invoice Number"
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-10">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion._id}
                className="p-2 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.invoiceNo}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Next Button */}
      <div className="flex justify-center mb-4">
        <button
          className={`bg-blue-500 text-white px-6 py-2 rounded-md shadow hover:bg-blue-600 transition ${isLoading && "opacity-50 cursor-not-allowed"}`}
          onClick={()=> handleNextClick()}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Next"}
        </button>
      </div>

      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      {/* Billing Details Section - Hidden until Next is clicked */}
      {showDetails && billingDetails && (
        <div className="mt-8 p-6 bg-white shadow-md rounded-lg w-full max-w-lg mx-auto border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Billing Details</h2>
          <p className="text-lg">Invoice No: <span className="font-semibold">{billingDetails.invoiceNo}</span></p>
          <p className="text-lg">Customer: <span className="font-semibold">{billingDetails.customerName}</span></p>
          <p className="text-lg">
            Expected Delivery Date: <span className="font-semibold">{new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}</span>
          </p>

          {/* Delivery Status */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium">Delivery Status</label>
            <select
              value={newDeliveryStatus}
              onChange={(e) => setNewDeliveryStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Status</option>
              <option value="Delivered">Delivered</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium">Payment Status</label>
            <select
              value={newPaymentStatus}
              onChange={(e) => setNewPaymentStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </div>

          {/* Update Button */}
          <div className="mt-6 flex justify-center">
            <button
              className="bg-green-500 text-white px-6 py-2 rounded-md shadow hover:bg-green-600 transition"
              onClick={handleUpdateStatus}
            >
              Update Status
            </button>
          </div>

          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default DriverBillingPage;
