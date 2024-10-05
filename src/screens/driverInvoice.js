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
  const [suggestions,setSuggestions] = useState([]);
  const [driverName,setDriverName]= useState('');
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
      getCurrentLocation((startLocation) => {
        // Save to local storage
        localStorage.setItem("billing", JSON.stringify(response.data));

        console.log(startLocation.longitude)

        if(startLocation){

        // Send the start location to the backend
        axios.post("/api/users/billing/start-delivery", {
          userId: userInfo._id, // You can replace this with actual userId
          driverName: driverName,
          invoiceNo: response.data.invoiceNo,
          startLocation: [startLocation.longitude, startLocation.latitude],

        });

      }
      });
    } catch (error) {
      setError("Error fetching billing details. Please check the invoice number. No Data Found");
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
          paymentStatus: newPaymentStatus, // Send payment status
        });

        // Clear local storage after delivery is completed
        localStorage.removeItem("billing");
        alert("Delivery marked as completed.");
        navigate('/')
      });
    } catch (error) {
      setError("Error updating delivery status.");
    }
  };

  // Cancel button to remove local storage and redirect to home page
  const handleCancel = () => {
    localStorage.removeItem("billing");
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
      <div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>
    
    <div className="min-h-screen p-6 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-2 text-gray-800">Driver Login</h1>
      <p className="text-xs mb-8 font-bold text-center text-gray-200">Please Fill The Driver Name Before Selecting The Invoice Number</p>

      {/* Invoice Input and Suggestions */}
      {!billingDetails && (
        <>
        <div className="relative mb-6 w-full max-w-md">
        <input
            type="text"
            placeholder="Enter Driver Name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="w-full uppercase p-3 border mb-5 border-gray-300 rounded-md shadow-sm"
            />
          <input
            type="text"
            placeholder="Enter Invoice Number"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            className="w-full uppercase p-3 border border-gray-300 rounded-md shadow-sm"
            readOnly={driverName.length === 0}
            />
        </div>

        {suggestions.length > 0 && (
          <ul className="mt-2 lg:w-1/2 w-full divide-y bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-10">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion._id}
                className="p-3 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.invoiceNo}
              </li>
            ))}
          </ul>
        )}

            </>
      )}

      <img class="w-1/2 h-auto max-w-xs sm:max-w-sm md:max-w-sm lg:max-w-sm xl:max-w-sm" src="/images/truck.png" />

      {/* Next Button */}
      {/* {!billingDetails && (
        <div className="flex justify-center mb-4">
          <button
            className="bg-red-500 text-white px-6 py-2 rounded-md shadow hover:bg-red-600 transition"
            onClick={handleNextClick}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Next"}
          </button>
        </div>
      )} */}

      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      {/* Billing Details Section */}
      {showDetails && billingDetails && (
        <div className="mt-8 p-6 bg-white shadow-md rounded-lg w-full max-w-lg mx-auto border border-gray-200">
          <h2 className="text-xl text-gray-500 font-bold mb-4">Billing Details</h2>
          <p>Invoice No: {billingDetails.invoiceNo}</p>
          <p>Customer: {billingDetails.customerName}</p>
          <p>Customer Address: {billingDetails.customerAddress}</p>
          <p>Expected Delivery Date: {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}</p>

          {/* Editable Delivery Status */}
          <div className="mt-4">
            <label>Delivery Status</label>
            <select
              value={newDeliveryStatus}
              onChange={(e) => setNewDeliveryStatus(e.target.value)}
              className="border py-3 ml-3 px-10 rounded-lg"
            >
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {/* Editable Payment Status */}
          <div className="mt-4">
            <label>Payment Status</label>
            <select
              value={newPaymentStatus}
              onChange={(e) => setNewPaymentStatus(e.target.value)}
              className="border py-3 ml-3 px-10 rounded-lg"
            >
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              className="bg-green-500 text-white px-6 py-2 rounded-md shadow hover:bg-green-600 transition"
              onClick={handleDelivered}
            >
              Delivered
            </button>
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded-md shadow hover:bg-gray-600 transition"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default DriverBillingPage;
