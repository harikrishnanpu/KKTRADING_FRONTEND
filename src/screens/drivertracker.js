import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import api from "./api";
import DriverTracking from "../components/Drivertracking";

const DriverTrackingPage = () => {
  const navigate = useNavigate();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [locationData, setLocationData] = useState([]);
  const [billingDetails, setBillingDetails] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("billing");
  const [showModal, setShowModal] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filteredDeliveryId, setFilteredDeliveryId] = useState(null);

    // Function to handle filtering of deliveries
    const handleFilter = (deliveryId) => {
      setFilteredDeliveryId(deliveryId);
    };

      // Function to reset the filter
  const handleResetFilter = () => {
    setFilteredDeliveryId(null);
  };


  const mapContainerStyle = {
    height: "500px",
    width: "100%",
  };

  const defaultCenter = {
    lat: 10.8505, // Default latitude (Kerala, India)
    lng: 76.2711, // Default longitude (Kerala, India)
  };

  useEffect(() => {
    if (invoiceNo) {
      fetchLocationData(invoiceNo);
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
      setError(null);
      setActiveSection("billing");
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

  // Prepare markers and polylines for the map
  const markers = [];
  const polylines = [];

  if (locationData && locationData.length > 0) {
    locationData.forEach((location) => {
      const { startLocations, endLocations, deliveryId } = location;

      const numDeliveries = Math.max(
        startLocations ? startLocations.length : 0,
        endLocations ? endLocations.length : 0
      );

      for (let i = 0; i < numDeliveries; i++) {
        const startLocation = startLocations && startLocations[i];
        const endLocation = endLocations && endLocations[i];

        if (startLocation) {
          markers.push({
            position: {
              lat: startLocation.coordinates[1],
              lng: startLocation.coordinates[0],
            },
            label: `Start ${i + 1}`,
            deliveryId,
            type: "start",
            index: i + 1,
          });
        }

        if (endLocation) {
          markers.push({
            position: {
              lat: endLocation.coordinates[1],
              lng: endLocation.coordinates[0],
            },
            label: `End ${i + 1}`,
            deliveryId,
            type: "end",
            index: i + 1,
          });
        }

        if (startLocation && endLocation) {
          polylines.push({
            path: [
              {
                lat: startLocation.coordinates[1],
                lng: startLocation.coordinates[0],
              },
              {
                lat: endLocation.coordinates[1],
                lng: endLocation.coordinates[0],
              },
            ],
            options: {
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            },
            deliveryId,
          });
        }
      }
    });
  }

  const mapCenter =
    markers.length > 0
      ? markers[0].position
      : defaultCenter;

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
            <div className="flex justify-between">
            <h5 className="mb-4 text-sm font-bold text-gray-600">Enter Invoice Number</h5>
            <p onClick={()=> navigate('/')} className="text-xs cursor-pointer">Close</p>
              </div>
            <p className="italic text-xs  text-gray-400">Click the suggestion to see that invoice details</p>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
            />
            {suggestions.length > 0 && (
              <ul className="bg-white mt-3 divide-y shadow-lg rounded-md overflow-hidden mb-4 border border-gray-300 max-h-48 overflow-y-auto">
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
      {billingDetails && (
        <div className="max-w-4xl mx-auto flex justify-center gap-4 mb-6">
          <button
            className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
              activeSection === "billing"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600"
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
              activeSection === "location"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600"
            }`}
            onClick={() => setActiveSection("location")}
          >
            Tracking Location
            {activeSection === "location" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
            )}
          </button>
        </div>
      )}

      {/* Billing Summary Section */}
      {activeSection === "billing" && billingDetails && (
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg mx-auto">
        <div className="flex justify-between">
       
         <a href="#">
             <h5 className="mb-3 text-xl font-bold tracking-tight text-gray-900 dark:text-white">{billingDetails.invoiceNo}</h5>
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
         <p className={`mt-1 text-xs font-bold ${billingDetails.deliveryStatus !== 'Delivered' ? 'text-red-400' : 'text-green-500'} `}>Delivery Sts: {billingDetails.deliveryStatus}</p>
         <p className={`mt-1 text-xs font-bold ${billingDetails.paymentStatus !== 'Paid' ? 'text-red-400' : 'text-green-500'} `}>Payment Sts: {billingDetails.paymentStatus}</p>
         </div>
         <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Products Qty: {billingDetails.products.length}</p>
         <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Customer Address: {billingDetails.customerAddress}, Kerala,India</p>
         <div className="flex justify-between">
         <p className="mt-1 text-sm font-bold text-gray-600 dark:text-gray-400">Delivery Assigned: {billingDetails.deliveries?.length}</p>
         <p className="mt-1 text-sm font-bold text-gray-600 dark:text-gray-400">Bill Amount: <span className="font-bold text-gray-500"> {(billingDetails.billingAmount - billingDetails.discount).toFixed(2)} </span></p>
         </div>

         <div className="flex justify-between">
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
                       <th scope="col" className="px-2 text-xs py-3">
                         Deliv. Qty
                       </th>
                       <th scope="col" className="px-2 text-xs py-3">
                       Sts
                       </th>
                   </tr>
               </thead>
               <tbody>
                 {billingDetails?.products.map((product,index)=>(
                   <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                       <th scope="row" className="px-2 py-4 text-xs font-medium text-gray-900 whitespace-nowrap dark:text-white">
                           {product.name.slice(0,14)}...
                      </th>
                       <td className="px-6 text-center text-xs py-4">
                           {product.item_id}
                       </td>
                       <td className="px-2 text-xs py-4">
                           {product.quantity}
                       </td>
                       <td className="px-2 text-xs py-4">
                           {product.deliveredQuantity}
                       </td>
                       <td className="px-2 text-xs py-4">
                                   <input
                                     type="checkbox"
                                     className="text-green-500 focus:ring-0 focus:outline-0 focus:border-0"
                                     checked={product.deliveryStatus === "Delivered"}
                                   />
                       </td>
                   </tr> 
                 ))
       }
       
               </tbody>
           </table>
       </div>
       
         </div>
       </div>
      )}

      {/* Location Tracking Section */}
      {activeSection === "location" && locationData && locationData.length > 0 && (
        <div className="max-w-lg mx-auto">
        <DriverTracking
  locationData={locationData}
  billingDetails={billingDetails}
  markers={markers}
  polylines={polylines}
  mapContainerStyle={{ width: '100%', height: '500px' }}
/>

          </div>
      )}

      {/* If no location data is available */}
      {activeSection === "location" && (!locationData || locationData.length === 0) && (
        <p className="text-center text-gray-500">No location data available for this invoice.</p>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
    </div>
  );
};

export default DriverTrackingPage;
