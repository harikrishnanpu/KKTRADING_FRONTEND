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
  const [searchTerm, setSearchTerm] = useState(""); // Search term for filtering
  const [filteredBillings, setFilteredBillings] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // Suggestions for search
  const limit = 6; // Limit for billings per page
  const [oneItem,setOneItem]= useState(false);

  useEffect(() => {
    const fetchBillings = async () => {
      try {
        const response = await axios.get(`/api/billing/driver/?page=${currentPage || 0}&limit=${limit || 3}`);
        setBillings(response.data.billings);
        setTotalPages(response.data.totalPages);
        setCount(response.data.totalbilling);
      } catch (error) {
        console.error("Error fetching billings:", error);
        setError("Error fetching billings");
      }
    };

    fetchBillings();
  }, [currentPage]);

  // Search for suggestions based on input
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm) {
        try {
          const response = await axios.get(`/api/billing/billing/suggestions?search=${searchTerm}`);
          setSuggestions(response.data);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]); // Clear suggestions if no search term
      }
    };

    fetchSuggestions();
  }, [searchTerm]);

  // Filter billings based on search term
  // useEffect(() => {

    async function getBillInfo (id) {
      try{
          const {data} = await axios.get(`/api/billing/${id}`);
          console.log(data)
          setBillings(data);
          setSuggestions([]); // Clear suggestions after selection
      }catch(error){
        console.log("error occured")
        setSuggestions([]); // Clear suggestions after selection
      }
    }

  // }, [searchTerm, billings]);

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
    <div>
              <div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>
    <div className="min-h-screen p-3">
      <h1 className="text-lg font-bold mb-6 text-center text-gray-800">All Deliveries</h1>
      <p className="font-bold text-left mb-4">Total Bills: {count}</p>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {/* Search Bar */}
      <div className="relative flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search by Invoice No..."
          className="p-2 border rounded-md w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md mt-20 z-10">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion._id}
                className="p-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSearchTerm('')
                  setOneItem(true)
                  getBillInfo(suggestion._id)
                }}
              >
                {suggestion.invoiceNo}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {oneItem === true ? (
          <div key={billings._id} className="bg-white rounded-lg shadow-xl p-4 hover:shadow-2xl transition duration-200 text-right">
          <h3 className="text-sm text-left font-semibold text-red-800 mb-2">Invoice No: {billings.invoiceNo}</h3>
          <p className="text-gray-600 text-left text-xs font-bold mt-1">Customer: {billings.customerName}</p>
          <p className="text-gray-600 text-left text-xs mt-1">Expected Delivery: {new Date(billings.expectedDeliveryDate).toLocaleDateString()}</p>
          <p className={`font-semibold text-left text-xs mt-1 ${billings.deliveryStatus === "Delivered" ? 'text-red-500' : 'text-red-500'}`}>
            Status: {billings.deliveryStatus}
          </p>
          <button 
            className="mt-4 text-xs font-bold bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 transition"
            onClick={() => handleDetailClick(billings)}>
            View Details
          </button>
        </div>
        ) :( billings.length > 0 ? billings.map((billing) => (
          <div key={billing._id} className="bg-white rounded-lg shadow-xl p-4 hover:shadow-2xl transition duration-200 text-right">
            <h3 className="text-sm text-left font-semibold text-red-800 mb-2">Invoice No: {billing.invoiceNo}</h3>
            <p className="text-gray-600 text-left text-xs font-bold mt-1">Customer: {billing.customerName}</p>
            <p className="text-gray-600 text-left text-xs mt-1">Expected Delivery: {new Date(billing.expectedDeliveryDate).toLocaleDateString()}</p>
            <p className={`font-semibold text-left text-xs mt-1 ${billing.deliveryStatus === "Delivered" ? 'text-red-500' : 'text-red-500'}`}>
              Status: {billing.deliveryStatus}
            </p>
            <button 
              className="mt-4 text-xs font-bold bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 transition"
              onClick={() => handleDetailClick(billing)}>
              View Details
            </button>
          </div>
        )) : (
          <p className="text-center text-gray-500">No billings found for this invoice number.</p>
        ))}
      </div>

      {/* Modal for Billing Details */}
      {selectedBilling && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-11/12 md:w-1/2">
            <h2 className="text-xl text-gray-600 font-bold mb-4">Billing Details</h2>
            <p className="text-sm font-bold">Invoice No: {selectedBilling.invoiceNo}</p>
            <p className="text-sm mt-1">Invoice Date: {new Date(selectedBilling.invoiceDate).toLocaleDateString()}</p>
            <p className="text-sm mt-1">Salesman: {selectedBilling.salesmanName}</p>
            <p className={`text-sm mt-1 ${selectedBilling.paymentStatus == 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>Current Payment Status: {selectedBilling.paymentStatus}</p>
            <p className={`text-sm mt-1 ${selectedBilling.deliveryStatus == 'Delivered' ? 'text-green-600' : 'text-yellow-600'}`}>Current Delivery Status: {selectedBilling.deliveryStatus}</p>
            <p className="text-sm mt-1">Expected Delivery Date: {new Date(selectedBilling.expectedDeliveryDate).toLocaleDateString()}</p>
            {selectedBilling.products.map((item)=>(
              <div className="ml-2 mb-2 mt-5 bg-gray-100 rounded-lg p-5">
                <p className="text-sm font-bold">Id:{item.item_id}</p>
                <p className="text-sm text-red-400">{item.name}</p>
                <p className="text-sm">Quantity: {item.quantity}</p>
              </div>
            ))}
            <div className="mt-4">
              <label className="block text-gray-700 mb-1">Delivery Status:</label>
              <select
                value={newDeliveryStatus}
                onChange={(e) => setNewDeliveryStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 mb-2 w-full"
              >
                <option value={selectedBilling.deliveryStatus}>Select Status</option>
                <option value="Delivered">Delivered</option>
                <option value="Undelivered">Undelivered</option>
              </select>
              <label className="block text-gray-700 mb-1">Payment Status:</label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 mb-2 w-full"
              >
                <option value={selectedBilling.paymentStatus}>Select Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <button 
              className="mt-4 bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 transition"
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

      {/* Pagination */}
     {oneItem === false && (<div className="mt-6 flex justify-center">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={`mx-1 px-4 py-2 rounded-lg transition ${currentPage === index + 1 ? 'bg-red-500 text-white' : 'bg-red-300 text-gray-700 hover:bg-red-300'}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>)}
    </div>
    </div>
  );
};

export default DriverPage;
