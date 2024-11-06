import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import LowStockPreview from "../components/lowStockPreview";

const DriverTrackingPage = () => {
  const { invoiceNo: paramInvoiceNo } = useParams();
  const navigate = useNavigate();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [billingDetails, setBillingDetails] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(paramInvoiceNo ? "location" : "billing");
  const [showModal, setShowModal] = useState(!paramInvoiceNo);

  const mapContainerStyle = {
    height: "400px",
    width: "100%",
  };

  const center = {
    lat: 0,
    lng: 0,
  };

  useEffect(() => {
    if (paramInvoiceNo) {
      fetchLocationData(paramInvoiceNo);
    }
  }, [invoiceNo]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (invoiceNo) {
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

  const fetchLocationData = async (invoiceNo) => {
    try {
      const response = await api.get(`/api/users/locations/invoice/${invoiceNo}`);
      setLocationData(response.data);
      const billingResponse = await api.get(`/api/billing/getinvoice/${invoiceNo}`);
      setBillingDetails(billingResponse.data);
    } catch (err) {
      setError("Error fetching location data.");
      console.error(err);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInvoiceNo(suggestion.invoiceNo);
    fetchLocationData(suggestion.invoiceNo);
    setSuggestions([]);
    setShowModal(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedSuggestionIndex((prevIndex) => (prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setSelectedSuggestionIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      handleSuggestionClick(suggestions[selectedSuggestionIndex]);
    }
  };

  if (error) {
    return <p className="text-red-500 text-center mt-4">{error}</p>;
  }

  const path = locationData
    ? [
        { lat: locationData.startLocation[1], lng: locationData.startLocation[0] },
        { lat: locationData.endLocation[1], lng: locationData.endLocation[0] },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate("/")} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Driver Tracking Information</p>
        </div>
        <i className="fa fa-truck text-gray-500" />
      </div>

      {/* Modal for Invoice Input */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-lg p-4 m-5 relative">
            {/* <button className="absolute top-4 right-4 text-gray-600 hover:text-gray-900" onClick={() => setShowModal(false)}>
              &times;
            </button> */}
            <h5 className="mb-4 text-sm font-bold text-gray-900">Enter Invoice Number</h5>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
            />
            {suggestions.length > 0 && (
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
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="max-w-4xl mx-auto flex justify-center gap-4 mb-6">
      <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "billing" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("billing")}
        >
         Billing Information
          {activeSection === "billing" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "location" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("location")}
        >
          Tracking Location
          {activeSection === "location" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
      </div>

      {/* Billing Summary Section */}
      {activeSection === "billing" && billingDetails && (
        <div className="md:w-3/6 mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
 <div className="flex justify-between">

  <a href="#">
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{billingDetails.invoiceNo}</h5>
  </a>

          {/* Indicator Dot */}
          {billingDetails.deliveryStatus === 'Delivered' && billingDetails.paymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
  )}

  {billingDetails.deliveryStatus === 'Delivered' && billingDetails.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

  {billingDetails.deliveryStatus !== 'Delivered' && billingDetails.paymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

{billingDetails.deliveryStatus !== 'Delivered' && billingDetails.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </div>
  )}

 </div>
  <div className="flex justify-between">
  <p className="mt-1 text-xs truncate font-bold text-gray-600 dark:text-gray-400">Customer: {billingDetails.customerName}</p>
  <p className="mt-1 text-xs truncate font-normal text-gray-700 dark:text-gray-400">Exp. DeliveryDate: {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}</p>
  </div>
  <div className="flex justify-between">
  <p className={`mt-1 text-xs font-medium ${billingDetails.deliveryStatus !== 'Delivered' ? 'text-red-400' : 'text-green-500'} `}>Delivery Sts: {billingDetails.deliveryStatus}</p>
  <p className={`mt-1 text-xs font-medium ${billingDetails.paymentStatus !== 'Paid' ? 'text-red-400' : 'text-green-500'} `}>Payment Sts: {billingDetails.paymentStatus}</p>
  </div>

  <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Customer Addrs: {billingDetails.customerAddress} , Kerala,India</p>
  <div className="flex justify-between">
  <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Products Qty: {billingDetails.products.length}</p>
  <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Bill Amount: <span className="font-bold text-gray-500"> {billingDetails.billingAmount} </span></p>
  </div>

  <div className="mx-auto my-8">


<div className="relative overflow-hidden">
    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-4 text-xs py-3">
                    Product
                </th>
                <th scope="col" className="px-2 text-center text-xs py-3">
                  ID
                </th>
                <th scope="col" className="px-2 text-xs py-3">
                  Qty.
                </th>
            </tr>
        </thead>
        <tbody>
          {billingDetails.products.map((product,index)=>(
            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" className="px-2 py-4 text-xs font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {product.name}
               </th>
                <td className="px-6 text-center text-xs py-4">
                    {product.item_id}
                </td>
                <td className="px-6 text-xs py-4">
                    {product.quantity}
                </td>
            </tr> 
          ))
}

        </tbody>
    </table>
</div>

  </div>

<div className="flex justify-between">

  <p onClick={()=> ""} className="inline-flex font-bold mt-5 items-center cursor-pointer px-3 py-2 text-sm text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800">
      Edit Details
      <svg className="rtl:rotate-180 w-3.5 h-3.5 mt-1 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
      </svg>
  </p>

</div>

</div>
      )}

      {/* Location Tracking Section */}
      {activeSection === "location" && locationData && (
        <div className="max-w-lg mx-auto p-2">
          
          <div className="bg-white rounded-lg p-8 shadow-lg mb-10">
          <h2 className="text-sm font-semibold text-left mb-4">Driver Tracking Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p className="mt-1 italic text-xs font-medium text-gray-600 dark:text-gray-400">User: {locationData.userId}</p>
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400"><strong>Driver Name:</strong> {locationData.driverName}</p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400"><strong>Invoice Number:</strong> {locationData.invoiceNo}</p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400"><strong>Fuel Charge: </strong> {billingDetails.fuelCharge}</p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400"><strong>Other Expenses: </strong> {billingDetails.otherExpenses}</p>

            </div>
          </div>

          <LoadScript googleMapsApiKey="AIzaSyBs0WiuZkmk-m_BSwwa_Hzc0Tu_D4HZ6l8">
            <GoogleMap mapContainerStyle={mapContainerStyle} zoom={13} center={path.length > 0 ? path[0] : center}>
              <Marker position={{ lat: locationData.startLocation[1], lng: locationData.startLocation[0] }} label="Start Location" />
              {locationData.endLocation && (
                <Marker position={{ lat: locationData.endLocation[1], lng: locationData.endLocation[0] }} label="End Location" />
              )}
              {path.length > 1 && (
                <Polyline path={path} options={{ strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 2 }} />
              )}
            </GoogleMap>
          </LoadScript>
        </div>
      )}
    </div>
  );
};

export default DriverTrackingPage;
