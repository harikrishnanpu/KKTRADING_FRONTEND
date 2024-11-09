import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import api from "./api";

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
            <h5 className="mb-4 text-sm font-bold text-gray-900">Enter Invoice Number</h5>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
            />
            {suggestions.length > 0 && (
              <ul className="bg-white divide-y shadow-lg rounded-md overflow-hidden mb-4 border border-gray-300 max-h-48 overflow-y-auto">
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
        <div className="max-w-4xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow mb-6">
          <div className="flex justify-between">
            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">
              Invoice No: {billingDetails.invoiceNo}
            </h5>

            {/* Indicator Dot */}
            {billingDetails.deliveryStatus === "Delivered" &&
            billingDetails.paymentStatus === "Paid" ? (
              <div className="top-2 right-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
            ) : (
              <div className="top-2 right-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="text-sm font-medium text-gray-700">
              <strong>Customer:</strong> {billingDetails.customerName}
            </p>
            <p className="text-sm font-medium text-gray-700">
              <strong>Expected Delivery Date:</strong>{" "}
              {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}
            </p>
            <p
              className={`text-sm font-medium ${
                billingDetails.deliveryStatus !== "Delivered"
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              <strong>Delivery Status:</strong> {billingDetails.deliveryStatus}
            </p>
            <p
              className={`text-sm font-medium ${
                billingDetails.paymentStatus !== "Paid"
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              <strong>Payment Status:</strong> {billingDetails.paymentStatus}
            </p>
            <p className="text-sm font-medium text-gray-700">
              <strong>Customer Address:</strong> {billingDetails.customerAddress}, Kerala, India
            </p>
            <p className="text-sm font-medium text-gray-700">
              <strong>Bill Amount:</strong> ₹{billingDetails.billingAmount}
            </p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3">
                    ID
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Qty.
                  </th>
                </tr>
              </thead>
              <tbody>
                {billingDetails.products.map((product, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.item_id}</td>
                    <td className="px-4 py-2">{product.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Location Tracking Section */}
      {activeSection === "location" && locationData && locationData.length > 0 && (
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-left mb-4">Driver Tracking Information</h2>
            {locationData.map((location, idx) => (
              <div key={idx} className="mb-4 border-b pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <p className="text-sm font-medium text-gray-700">
                    <strong>Driver Name:</strong> {location.driverName}
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    <strong>Delivery ID:</strong> {location.deliveryId}
                  </p>
                </div>
                {/* Display Fuel Charge and Other Expenses if available */}
                {billingDetails && billingDetails.deliveries && billingDetails.deliveries.length > 0 && (
                  billingDetails.deliveries.map((delivery) => {
                    if (delivery.deliveryId === location.deliveryId) {
                      return (
                        <div key={delivery.deliveryId} className="mt-2">
                          <p className="text-sm font-medium text-gray-700">
                            <strong>Fuel Charge:</strong> ₹{delivery.fuelCharge || 0}
                          </p>
                          {delivery.otherExpenses && delivery.otherExpenses.length > 0 && (
                            <p className="text-sm font-medium text-gray-700">
                              <strong>Other Expenses:</strong>{" "}
                              {delivery.otherExpenses.map((expense, index) => (
                                <span key={index}>
                                  ₹{expense.amount} ({expense.remark})
                                  {index < delivery.otherExpenses.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            ))}
          </div>

          <LoadScript googleMapsApiKey="AIzaSyBs0WiuZkmk-m_BSwwa_Hzc0Tu_D4HZ6l8">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={10}
              center={mapCenter}
            >
              {markers.map((marker, index) => (
                <Marker
                  key={`marker-${index}`}
                  position={marker.position}
                  label={{
                    text: marker.label,
                    color: marker.type === "start" ? "green" : "red",
                    fontWeight: "bold",
                  }}
                  onClick={() => setSelectedMarker(marker)}
                />
              ))}
              {polylines.map((polyline, index) => (
                <Polyline
                  key={`polyline-${index}`}
                  path={polyline.path}
                  options={polyline.options}
                />
              ))}
              {selectedMarker && (
                <InfoWindow
                  position={selectedMarker.position}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div>
                    <p className="text-sm font-bold">{selectedMarker.label}</p>
                    <p className="text-xs">Delivery ID: {selectedMarker.deliveryId}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
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
