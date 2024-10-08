import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const DriverBillingPage = () => {
  const [invoiceNo, setInvoiceNo] = useState(""); // Invoice input
  const [billingDetails, setBillingDetails] = useState(null); // Billing details after fetching
  const [newDeliveryStatus, setNewDeliveryStatus] = useState(""); // Editable delivery status
  const [newPaymentStatus, setNewPaymentStatus] = useState(""); // Editable payment status
  const [currentLocation, setCurrentLocation] = useState(null); // Track location
  const [error, setError] = useState(""); // Error message handling
  const [showDetails, setShowDetails] = useState(false); // Toggle details section
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [suggestions, setSuggestions] = useState([]);
  const [driverName, setDriverName] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal state
  const navigate = useNavigate();

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Load billing from local storage if available
  useEffect(() => {
    const storedBilling = localStorage.getItem("billing");
    if (storedBilling) {
      const parsedBilling = JSON.parse(storedBilling);
      setBillingDetails(parsedBilling);
      setNewDeliveryStatus(parsedBilling.deliveryStatus);
      setNewPaymentStatus(parsedBilling.paymentStatus);
      setShowDetails(true);
    }
  }, []);

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

  // Fetching location using browser API
  const getCurrentLocation = (callback) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(location);
        if (callback) callback(location); // Call callback if needed
      },
      (error) => {
        console.error("Error fetching location:", error);
      }
    );
  };

  // Fetch billing details and start tracking
  const handleNextClick = async (id) => {
    if (!invoiceNo) {
      setError("Please enter an invoice number.");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/billing/${id}`);
      setBillingDetails(response.data);
      setNewDeliveryStatus(response.data.deliveryStatus);
      setNewPaymentStatus(response.data.paymentStatus);
      setError("");
      setShowDetails(true);
      // Save to local storage
      localStorage.setItem("billing", JSON.stringify(response.data));
      localStorage.setItem("billingProducts", JSON.stringify(response.data.products)); // Store products in local storage
      getCurrentLocation((startLocation) => {

        if (startLocation) {
          // Send the start location to the backend
          axios.post("/api/users/billing/start-delivery", {
            userId: userInfo._id,
            driverName: driverName,
            invoiceNo: response.data.invoiceNo,
            startLocation: [startLocation.longitude, startLocation.latitude],
          });
        }
      });
    } catch (error) {
      setError("Error fetching billing details. Please check the invoice number.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delivered Button
  const handleDelivered = async () => {
    try {
      getCurrentLocation((endLocation) => {
        // Send end location and update statuses to backend
        axios.post("/api/users/billing/end-delivery", {
          userId: userInfo._id,
          invoiceNo: billingDetails.invoiceNo,
          endLocation: [endLocation.longitude, endLocation.latitude],
          deliveryStatus: "Delivered",
          paymentStatus: newPaymentStatus,
        });

        // Clear local storage after delivery is completed
        localStorage.removeItem("billing");
        localStorage.removeItem("products");
        setShowSuccessModal(true); // Show success modal
      });
    } catch (error) {
      setError("Error updating delivery status.");
    }
  };

  // Cancel button to remove local storage and redirect to home page
  const handleCancel = () => {
    localStorage.removeItem("billing");
    localStorage.removeItem("products");
    navigate("/");
  };

  // Handle selecting a suggestion
  const handleSuggestionClick = (suggestion) => {
    setInvoiceNo(suggestion.invoiceNo);
    setSuggestions([]); // Clear suggestions after selecting one
    handleNextClick(suggestion._id);
  };

  return (
    <div>
    <div className='flex justify-end'>
    <a href='/' className='fixed top-5 font-bold left-4 text-blue-500'><i className='fa fa-angle-left' /> Back</a>
    <h2 className='text-2xl font-bold text-red-600 '>KK TRADING</h2>
    </div>
    <div className="flex min-h-screen flex-col justify-center items-center p-2">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-lg p-6">
        <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Driver Billing Page</h1>



                   {/* Indicator Dot */}
  {newDeliveryStatus === 'Delivered' && newPaymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
  )}

  {newDeliveryStatus === 'Delivered' && newPaymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

  {newDeliveryStatus !== 'Delivered' && newPaymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

{newDeliveryStatus !== 'Delivered' && newPaymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </div>
  )}


        </div>

        <p className="text-sm text-gray-500 mb-6">Please fill in the driver name and select an invoice number.</p>

      {!billingDetails &&  <div className="mb-4">
          <input
            type="text"
            placeholder="Enter Driver Name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="w-full uppercase p-3 border border-gray-300 rounded-md mb-4"
          />
          <input
            type="text"
            placeholder="Enter Invoice Number"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            readOnly={driverName.length === 0}
          />
        </div> }

        {!billingDetails && suggestions.length > 0 && (
          <ul className="bg-white shadow-lg rounded-md overflow-hidden mb-4">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion._id}
                className="p-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.invoiceNo}
              </li>
            ))}
          </ul>
        )} 

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        {/* Billing Details Section */}
        {showDetails && billingDetails && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Billing Details</h2>
            <p><strong>Invoice No:</strong> {billingDetails.invoiceNo}</p>
            <p><strong>Date:</strong> {new Date(billingDetails.invoiceDate).toLocaleDateString()}</p>
            <p><strong>Customer:</strong> {billingDetails.customerName}</p>
            <p><strong>Address:</strong> {billingDetails.customerAddress}</p>
            <p><strong>Exp. Delivery Date:</strong> {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}</p>
            <p><strong>Delivery Date:</strong> {new Date().toLocaleDateString()}</p>

            <h3 className="mt-4 text-sm font-bold mb-2">Products</h3>
            
            
           {localStorage.getItem("billingProducts") ?  JSON.parse(localStorage.getItem("billingProducts")).map((item, idx) => (
              <div key={idx} className="flex justify-between mt-2">
                <p className="font-bold">{item.item_id}</p>
                <p className="truncate">{item.name}</p>
                <p className="font-bold">{item.quantity}</p>
              </div>
            )) :

billingDetails.products.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <p>{item.name}</p>
                <p>{item.quantity}</p>
              </div>
            )) }

            <div className="mt-4">
              <label className="font-bold">Delivery Status</label>
              <select
                value={newDeliveryStatus}
                onChange={(e) => setNewDeliveryStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="mt-4 font-bold">
              <label>Payment Status</label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="flex justify-between mt-6">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md font-bold"
                onClick={handleDelivered}
              >
                Mark as Delivered
              </button>
              <button
                className="bg-red-500 font-bold text-white px-4 py-2 rounded-md"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-green-600 mb-4">Delivery Completed!</h2>
            
            <p className="mb-6 text-sm">The delivery has been successfully marked as delivered.</p>
            <button
              className="bg-green-500 font-bold text-white px-4 py-2 rounded-md"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default DriverBillingPage;
