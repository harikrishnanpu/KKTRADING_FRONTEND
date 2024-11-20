import React, { useState } from 'react';
import { LoadScript, GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

const DriverTracking = ({
  locationData,
  billingDetails,
  markers,
  polylines,
  mapContainerStyle,
  mapCenter,
}) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filteredDeliveryId, setFilteredDeliveryId] = useState(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Handle filtering deliveries
  const handleFilter = (deliveryId) => {
    setFilteredDeliveryId(deliveryId);
  };

  // Reset filter
  const handleResetFilter = () => {
    setFilteredDeliveryId(null);
  };

  // Google Maps loaded callback
  const handleGoogleLoad = () => {
    setIsGoogleLoaded(true);
  };

  // Function to calculate the center dynamically based on markers
  const calculateCenter = (markers) => {
    if (!markers || markers.length === 0) return mapCenter;
    const latitudes = markers.map((marker) => marker.position.lat);
    const longitudes = markers.map((marker) => marker.position.lng);
    const avgLat = latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
    const avgLng = longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length;
    return { lat: avgLat, lng: avgLng };
  };

  // Filter markers based on selected delivery
  const filteredMarkers = markers.filter(
    (marker) => !filteredDeliveryId || marker.deliveryId === filteredDeliveryId
  );

  // Calculate map center dynamically based on filtered markers
  const dynamicCenter = calculateCenter(filteredMarkers);

  return (
    <div className="mx-auto p-2">
      {/* Driver Tracking Information Section */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <h2 className="text-sm font-bold text-gray-500 text-left mb-4">Driver Tracking Information</h2>
        {locationData.map((location, idx) => (
          <div key={idx} className="mb-4 bg-gray-50 p-3 rounded-lg pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p className="text-xs font-bold text-gray-700">
                <strong>Driver Name:</strong> {location.driverName}
              </p>
              <p className="text-xs truncate text-gray-700">
                <strong>Delivery ID:</strong> {location.deliveryId}
              </p>
            </div>


            {/* Display billing details if available */}
            {billingDetails?.deliveries?.map((delivery) => {
              if (delivery.deliveryId === location.deliveryId) {
                return (
                  <div key={delivery.deliveryId} className="mt-2">
                    <div className='flex justify-between'>
                    <p className="text-xs font-medium text-gray-700">
                      <strong>Fuel Charge:</strong> ₹{delivery.fuelCharge || 0}
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      <strong>Starting Km: </strong> {delivery.startingKm || 0}
                    </p>
                    </div>
                    <div className='flex justify-between'>
                    <p className="text-xs font-medium text-gray-700">
                      <strong>Ending Km:</strong> {delivery.endKm || 0}
                    </p>
                    <p className="text-xs font-bold text-gray-700">
                      <strong>Total Distance Km:</strong> {delivery.kmTravelled || 0}
                    </p>
                    </div>
                    {delivery.otherExpenses?.length > 0 && (
                      <p className="text-xs font-medium text-gray-700 mt-2">
                        <strong>Other Expenses:</strong>{" "}
                        {delivery.otherExpenses.map((expense, index) => (
                          <span key={index}>
                            ₹{expense.amount} ({expense.remark})
                            {index < delivery.otherExpenses.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                    )}

                    <div>
                    {delivery.productsDelivered?.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-bold text-red-600 mb-2">Products Delivered:</h5>
            <table className="w-full text-xs text-left text-red-500">
              <thead className="text-xs text-gray-700 uppercase bg-red-100">
                <tr>
                  <th className="px-2 py-1">Product ID</th>
                  <th className="px-2 py-1">Delivered Qty</th>
                </tr>
              </thead>
              <tbody>
                {delivery.productsDelivered.map((prod, idx) => (
                  <tr key={idx} className="bg-white border-b hover:bg-red-50">
                    <td className="px-2 py-1">{prod.item_id}</td>
                    <td className="px-2 py-1">{prod.deliveredQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
                      </div>
                  </div>
                );
              }
              return null;
            })}

            {/* Filter Button */}
            <button
              onClick={() => handleFilter(location.deliveryId)}
              className="text-white foont-bold bg-red-500 px-3 py-1 rounded-lg cursor-pointer text-xs font-bold mt-2"
            >
              View This Tracking
            </button>
          </div>
        ))}

        {/* Button to Show All Trackings */}
        {filteredDeliveryId && (
          <button
            onClick={handleResetFilter}
            className="text-white foont-bold bg-red-500 px-3 py-1 rounded-lg cursor-pointer text-xs font-bold mt-5"
          >
            Show All Trackings
          </button>
        )}
      </div>

      {/* Google Map Section */}
      <LoadScript googleMapsApiKey="AIzaSyBs0WiuZkmk-m_BSwwa_Hzc0Tu_D4HZ6l8" onLoad={handleGoogleLoad}>
        {isGoogleLoaded && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={filteredDeliveryId ? 14 : 10}
            center={dynamicCenter}
          >
            {/* Render Markers */}
            {filteredMarkers.map((marker, index) => (
              <Marker
                key={`marker-${index}`}
                position={marker.position}
                icon={{
                  url: marker.type === "start" ? '/images/logo180.png' : '/images/logo180.png',
                  scaledSize: new window.google.maps.Size(32, 32),
                }}
                label={{
                  text: marker.label,
                  color: marker.type === "start" ? "green" : "red",
                  fontWeight: "bold",
                }}
                onClick={() => setSelectedMarker(marker)}
              />
            ))}

            {/* Render Polylines */}
            {polylines
              .filter((polyline) => !filteredDeliveryId || polyline.deliveryId === filteredDeliveryId)
              .map((polyline, index) => (
                <Polyline key={`polyline-${index}`} path={polyline.path} options={polyline.options} />
              ))}

            {/* InfoWindow for Selected Marker */}
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
        )}
      </LoadScript>
    </div>
  );
};

export default DriverTracking;
