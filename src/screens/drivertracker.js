import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";
import axios from "axios";
import { useParams } from "react-router-dom";

const DriverTrackingPage = () => {
  const { invoiceNo } = useParams(); // Getting the invoice number from URL parameters
  const [locationData, setLocationData] = useState(null); // State to store location data
  const [error, setError] = useState(null); // State to store any errors

  const mapContainerStyle = {
    height: "500px",
    width: "100%",
  };

  const center = {
    lat: 0, // Default center latitude
    lng: 0, // Default center longitude
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await axios.get(`/api/users/locations/invoice/${invoiceNo}`); // Fetching location data from the backend
        setLocationData(response.data);
        console.log(response.data);
      } catch (err) {
        setError("Error fetching location data.");
        console.error(err);
      }
    };

    fetchLocationData();
  }, [invoiceNo]);

  if (error) {
    return <p className="text-red-500">{error}</p>; // Display error message if any
  }

  if (!locationData) {
    return <p>Loading...</p>; // Display loading state
  }

  const { userId, driverName, invoiceNo: invNo, startLocation, endLocation } = locationData;

  // Check if startLocation and endLocation are defined and have coordinates
  if (!startLocation || !endLocation || !startLocation || (endLocation && endLocation.length < 2)) {
    console.error("Location data is not structured as expected", locationData);
    return <p>Error: Invalid location data.</p>; // Display an error message for invalid data
  }

  const path = [
    { lat: startLocation[1], lng: startLocation[0] }, // Latitude from index 1
    { lat: endLocation[1], lng: endLocation[0] },     // Latitude from index 1
  ];

  return (
    <div>
        <div className="flex justify-between mt-5 mb-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>
    <div className="p-4">
      <h2 className="text-lg font-semibold text-center">Driver Tracking Information</h2>
      
      <div className="bg-gray-100 mt-10 mb-10 rounded-lg p-8">
      <p><strong>User ID:</strong> {userId}</p>
      <p><strong>Driver Name:</strong> {driverName}</p>
      <p><strong>Invoice Number:</strong> {invNo}</p>
      </div>

      <LoadScript googleMapsApiKey="AIzaSyBs0WiuZkmk-m_BSwwa_Hzc0Tu_D4HZ6l8">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          center={path.length > 0 ? path[0] : center}
        >
          <Marker
            position={{
              lat: startLocation[1],
              lng: startLocation[0],
            }}
            label="Start Location"
          />
          {endLocation && endLocation && (
            <Marker
              position={{
                lat: endLocation[1],
                lng: endLocation[0],
              }}
              label="End Location"
            />
          )}
          {path.length > 1 && (
            <Polyline
              path={path}
              options={{
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
    </div>
  );
};

export default DriverTrackingPage;
