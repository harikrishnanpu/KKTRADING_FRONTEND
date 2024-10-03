import React, { useEffect, useState } from "react";
import axios from "axios";

const DriverPage = () => {
  const [billings, setBillings] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [newDeliveryStatus, setNewDeliveryStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState('');
  const limit = 6; // Limit for billings per page

  useEffect(() => {
    const fetchBillings = async () => {
      try {
        const response = await axios.get(`/api/billing/driver/?page=${currentPage || 0}&limit=${limit || 3}`);
        setBillings(response.data.billings);
        setTotalPages(response.data.totalPages);
        setCount(response.data.totalbilling)
      } catch (error) {
        console.error("Error fetching billings:", error);
        setError("Error fetching billings");
      }
    };

    fetchBillings();
  }, [currentPage]);

  const handleDetailClick = (billing) => {
    setSelectedBilling(billing);
    setNewDeliveryStatus(billing.deliveryStatus);
    setNewPaymentStatus(billing.paymentStatus);
    setError(""); // Reset error when viewing details
  };

  const handleClose = () => {
    setSelectedBilling(null);
  };

  const handleUpdateStatus = async () => {
    if (!newDeliveryStatus || !newPaymentStatus) {
      setError("Please select both statuses.");
      return;
    }

    try {
      await axios.put(`/api/billing/driver/billings/${selectedBilling._id}`, {
        deliveryStatus: newDeliveryStatus,
        paymentStatus: newPaymentStatus,
      });
      // Update the local state after successful update
      setBillings((prevBillings) =>
        prevBillings.map((bill) =>
          bill._id === selectedBilling._id
            ? { ...bill, deliveryStatus: newDeliveryStatus, paymentStatus: newPaymentStatus }
            : bill
        )
      );
      setSelectedBilling(null); // Close the modal after update
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Error updating status");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Driver Deliveries</h1>
      <p className="font-bold text-center mb-10">Total Bills: {count}</p>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {billings.map((billing) => (
          <div key={billing._id} className="bg-white rounded-lg shadow-lg p-4 transition-transform transform hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-800">Invoice No: {billing.invoiceNo}</h3>
            <p className="text-gray-600">Customer: {billing.customerName}</p>
            <p className="text-gray-600">Expected Delivery: {new Date(billing.expectedDeliveryDate).toLocaleDateString()}</p>
            <p className={`font-semibold ${billing.deliveryStatus === "Delivered" ? 'text-green-500' : 'text-red-500'}`}>
              Status: {billing.deliveryStatus}
            </p>
            <button 
              className="mt-4 bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 transition"
              onClick={() => handleDetailClick(billing)}>
              View Details
            </button>
          </div>
        ))}
      </div>

      {selectedBilling && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-11/12 md:w-1/2">
            <h2 className="text-2xl font-bold mb-4">Billing Details</h2>
            <p>Invoice No: {selectedBilling.invoiceNo}</p>
            <p>Invoice Date: {new Date(selectedBilling.invoiceDate).toLocaleDateString()}</p>
            <p>Salesman: {selectedBilling.salesmanName}</p>
            <p>Expected Delivery Date: {new Date(selectedBilling.expectedDeliveryDate).toLocaleDateString()}</p>
            <div className="mt-4">
              <label className="block text-gray-700 mb-1">Delivery Status:</label>
              <select
                value={newDeliveryStatus}
                onChange={(e) => setNewDeliveryStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 mb-2 w-full"
              >
                <option value="">Select Status</option>
                <option value="Delivered">Delivered</option>
                <option value="Undelivered">Undelivered</option>
                {/* Add more statuses if needed */}
              </select>
              <label className="block text-gray-700 mb-1">Payment Status:</label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 mb-2 w-full"
              >
                <option value="">Select Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                {/* Add more statuses if needed */}
              </select>
            </div>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <button 
              className="mt-4 bg-green-500 text-white rounded-lg py-2 px-4 hover:bg-green-600 transition"
              onClick={handleUpdateStatus}>
              Update Status
            </button>
            <button 
              className="mt-4 ml-2 bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 transition"
              onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={`mx-1 px-4 py-2 rounded-lg transition ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-blue-300'}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DriverPage;
