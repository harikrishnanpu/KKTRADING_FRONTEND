import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LowStockPreview from "../components/lowStockPreview";
import api from "./api";

const DriverBillingPage = () => {
  const [invoiceNo, setInvoiceNo] = useState(""); // Invoice input
  const [billingDetails, setBillingDetails] = useState(null); // Billing details after fetching
  const [newPaymentStatus, setNewPaymentStatus] = useState(""); // Editable payment status
  const [currentLocation, setCurrentLocation] = useState(null); // Track location
  const [error, setError] = useState(""); // Error message handling
  const [showDetails, setShowDetails] = useState(false); // Toggle details section
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [suggestions, setSuggestions] = useState([]);
  const [driverName, setDriverName] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal state
  const [selectedProducts, setSelectedProducts] = useState([]); // Track selected products for delivery
  const [paymentAmount, setPaymentAmount] = useState(null); // Track payment amount
  const [paymentMethod, setPaymentMethod] = useState("Cash"); // Track payment method
  const [remainingAmount, setRemainingAmount] = useState(0); // Track remaining amount
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const navigate = useNavigate();

  const [deliveryStep, setDeliveryStep] = useState(1); // Step 1: Initial, Step 2: Summary, Step 3: Additional Inputs
  const [kmTravelled, setKmTravelled] = useState("");
  const [fuelCharge, setFuelCharge] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");

  const [activeSection, setActiveSection] = useState("Billing Details");


  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  useEffect(() => {
    const storedBilling = localStorage.getItem("billing");
    if (storedBilling) {
      const parsedBilling = JSON.parse(storedBilling);
      setBillingDetails(parsedBilling);
      setNewPaymentStatus(parsedBilling.paymentStatus);
      setRemainingAmount(
        parsedBilling.billingAmount -
        (parsedBilling.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0)
      );
      setShowDetails(true);
      setSelectedProducts(
        parsedBilling.products
          .filter((product) => product.deliveryStatus === "Delivered")
          .map((product) => product.item_id)
      );
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (invoiceNo) {
        try {
          const response = await api.get(
            `/api/billing/billing/suggestions?search=${invoiceNo}`
          );
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

  const getCurrentLocation = (callback) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(location);
        if (callback) callback(location);
      },
      (error) => {
        console.error("Error fetching location:", error);
      }
    );
  };

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // Step 1: Summary, Step 2: Additional Inputs


  const handleDelivered = () => {
    setShowModal(true);
    setModalStep(1);
  };

  const handleNext = () => {
    setModalStep(2);
  };

  const handleNextClick = async (id) => {
    if (!invoiceNo) {
      setError("Please enter an invoice number.");
      return;
    }
    try {
      setIsLoading(true);
      await getCurrentLocation((startLocation) => {
        if (startLocation) {
          api.post("/api/users/billing/start-delivery", {
            userId: userInfo._id,
            driverName: driverName,
            invoiceNo,
            startLocation: [startLocation.longitude, startLocation.latitude],
          });
        }
      });

      const response = await api.get(`/api/billing/${id}`);
      setBillingDetails(response.data);
      setNewPaymentStatus(response.data.paymentStatus);
      setRemainingAmount(
        response.data.billingAmount -
        (response.data.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0)
      );
      setError("");
      setShowDetails(true);
      setSelectedProducts(
        response.data.products
          .filter((product) => product.deliveryStatus === "Delivered")
          .map((product) => product.item_id)
      );

      localStorage.setItem("billing", JSON.stringify(response.data));
      localStorage.setItem("billingProducts", JSON.stringify(response.data.products));
    } catch (error) {
      setError("Error fetching billing details. Please check the invoice number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setShowModal(false);
    setIsLoading(true);
    try {
      await getCurrentLocation((endLocation) => {
        if (endLocation) {
          const deliveredProducts = selectedProducts;
          api.post("/api/users/billing/end-delivery", {
            userId: userInfo._id,
            invoiceNo: billingDetails.invoiceNo,
            endLocation: [endLocation.longitude, endLocation.latitude],
            deliveryStatus:
              deliveredProducts.length === billingDetails.products.length
                ? "Delivered"
                : "Pending",
            deliveredProducts,
            paymentStatus: newPaymentStatus,
            kmTravelled,
            fuelCharge,
            otherExpenses
          });

          localStorage.removeItem("billing");
          localStorage.removeItem("products");
          localStorage.removeItem("billingProducts");
          setShowSuccessModal(true);
          setTimeout(()=>{
            navigate(0);
          }, 3000)
        }
      });
    } catch (error) {
      setError("Error updating delivery status.");
    }
  };

  const handleCancel = () => {
    try {
      getCurrentLocation((endLocation) => {
        if (endLocation) {
          api.post("/api/users/billing/end-delivery", {
            userId: userInfo._id,
            invoiceNo: billingDetails.invoiceNo,
            endLocation: [endLocation.longitude, endLocation.latitude],
            deliveryStatus: "Pending",
            paymentStatus: newPaymentStatus,
          });

          localStorage.removeItem("billing");
          localStorage.removeItem("products");
          localStorage.removeItem("billingProducts");
          navigate(0);
        }
      });
    } catch (err) {
      console.error("Error canceling delivery:", err);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInvoiceNo(suggestion.invoiceNo);
    setSuggestions([]);
    handleNextClick(suggestion._id);
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

  const handleProductCheckboxChange = (productId) => {
    setSelectedProducts((prevSelectedProducts) => {
      if (prevSelectedProducts.includes(productId)) {
        return prevSelectedProducts.filter((id) => id !== productId);
      } else {
        return [...prevSelectedProducts, productId];
      }
    });
  };

  const handlePaymentSubmit = async () => {
    if (paymentAmount <= 0 || !paymentMethod) {
      setError("Please enter a valid payment amount and method.");
      return;
    }

    try {
      const updatedPaymentStatus =
        paymentAmount >= billingDetails.billingAmount
          ? "Paid"
          : paymentAmount > 0
          ? "Partial"
          : "Pending";

      await api.post("/api/users/billing/update-payment", {
        invoiceNo: billingDetails.invoiceNo,
        paymentAmount,
        paymentMethod,
        paymentStatus: updatedPaymentStatus,
      });

      const response = await api.get(`/api/billing/${billingDetails._id}`);
      setBillingDetails(response.data);
      setNewPaymentStatus(response.data.paymentStatus);
      setRemainingAmount(
        response.data.billingAmount -
        (response.data.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0)
      );
      setError("");
      setShowDetails(true);
      setSelectedProducts(
        response.data.products
          .filter((product) => product.deliveryStatus === "Delivered")
          .map((product) => product.item_id)
      );

      localStorage.setItem("billing", JSON.stringify(response.data));
      localStorage.setItem("billingProducts", JSON.stringify(response.data.products));

      setNewPaymentStatus(updatedPaymentStatus);
      setRemainingAmount(
        billingDetails.billingAmount -
        (billingDetails.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0) -
        paymentAmount
      );
      setError("");
      setPaymentAmount(0);
      setPaymentMethod("Cash");
      setShowSuccessModal(true);
    } catch (error) {
      setError("Error updating payment status.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Delivery & Payment Updation</p>
        </div>
        <i className="fa fa-truck text-gray-500" />
      </div>

      {/* Integrated Navigation with Bottom Border Animation */}
      <div className="flex justify-center gap-8">
        <button
          className={`font-bold  text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "Billing Details" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("Billing Details")}
        >
          Billing Details
          {/* Active Border Indicator */}
          {activeSection === "Billing Details" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        
        <button
          className={`font-bold  text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "Payment Section" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("Payment Section")}
        >
          Payment Section
          {/* Active Border Indicator */}
          {activeSection === "Payment Section" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
      </div>


      <div className="flex flex-col justify-center items-center p-2">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-lg p-6">
          {!billingDetails && <LowStockPreview driverPage={true} />}
          {!billingDetails && (
            <div className="mb-4">
              <label className="font-bold text-xs text-gray-500">Driver name</label>
              <input
                type="text"
                placeholder="Enter Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full py-2 focus:outline-none focus:border-red-300 focus:ring-red-300 border-gray-300 rounded-md mb-4"
              />
              <div className="relative w-full">
                <label className="font-bold text-xs text-gray-500">Invoice No.</label>
                <input
                  type="text"
                  placeholder="Enter Invoice Number"
                  value={invoiceNo}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full p-2 pr-8 focus:outline-none focus:border-red-300 focus:ring-red-300 border-gray-300 rounded-md"
                  readOnly={driverName.length === 0}
                />
                <i onClick={() => setInvoiceNo('')} className="fa fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
          )}

          {!billingDetails && suggestions.length > 0 && (
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

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}




          {showDetails && billingDetails && (
            <div>


              {activeSection === "Billing Details" && (
                <div>
              <div className="mt-4 flex justify-between">
                <a href="#">
                  <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {billingDetails.invoiceNo}
                  </h5>
                </a>

                <div>
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
              </div>

              <div className="flex justify-between">
                <p className="mt-1 text-xs truncate font-bold text-gray-600 dark:text-gray-400">
                  Customer: {billingDetails.customerName}
                </p>
                <p className="mt-1 text-xs truncate font-normal text-gray-700 dark:text-gray-400">
                  Exp. Delivery Date: {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-between">
                <p
                  className={`mt-1 text-xs font-medium ${
                    billingDetails.deliveryStatus !== 'Delivered' ? 'text-red-400' : 'text-green-500'
                  }`}
                >
                  Delivery Status: {billingDetails.deliveryStatus}
                </p>
                <p
                  className={`mt-1 text-xs font-medium ${
                    billingDetails.paymentStatus !== 'Paid' ? 'text-red-400' : 'text-green-500'
                  }`}
                >
                  Payment Status: {billingDetails.paymentStatus}
                </p>
              </div>

              <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Customer Address: {billingDetails.customerAddress}, Kerala, India
              </p>
              <div className="flex justify-between">
                <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Products Qty: {billingDetails.products.length}
                </p>
                <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Bill Amount: <span className="font-bold text-gray-500">{billingDetails.billingAmount}</span>
                </p>
              </div>
              <div className="flex justify-between">
                <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Remaining Amount: <span className="font-bold text-gray-500">{remainingAmount}</span>
                </p>
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
                          Delivered
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingDetails.products.map((product, index) => (
                        <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                          <th scope="row" className="px-2 py-4 text-xs font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {product.name.slice(0,18)}....
                          </th>
                          <td className="px-6 text-center font-bold text-xs py-4">
                            {product.item_id}
                          </td>
                          <td className="px-6 text-xs py-4">
                            {product.quantity}
                          </td>
                          <td className="px-6 text-xs py-4">
                            <input
                              type="checkbox"
                              className="text-green-500"
                              checked={selectedProducts.includes(product.item_id)}
                              onChange={() => handleProductCheckboxChange(product.item_id)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  className="bg-red-500 text-white font-bold text-xs px-4 py-1 rounded-lg"
                  onClick={handleDelivered}
                >
                  Continue
                </button>
                <button
                  className="bg-red-500 font-bold text-white px-4 py-2 rounded-lg text-xs"
                  onClick={handleCancel}
                >
                  Cancel Delivery
                </button>
              </div>  

              </div> )}

              {activeSection === "Payment Section" && (
        <div className="mt-6 pt-4">
          <div className="flex justify-between mb-6 border-b pb-5">
            <p className={`${billingDetails.paymentStatus === "Delivered" ? 'bg-green-200' : billingDetails.paymentStatus === "Partial" ? 'bg-yellow-200' : 'bg-red-200'} text-center flex-col mt-auto py-4 font-bold text-xs rounded-lg px-6`}>
              <span className="truncate text-gray-500">Payment Status: </span> <br/>
              <span className={`${billingDetails.paymentStatus === "Delivered" ? 'text-green-500' : billingDetails.paymentStatus === "Partial" ? 'text-yellow-500' : 'text-red-500'}`}>{billingDetails.paymentStatus}</span>
              </p>
            <div className="text-right">
                      <button
              className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-lg"
              onClick={handlePaymentSubmit}
            >
              Submit Payment
            </button>
            <p className="italic text-gray-400 text-xs mt-1">Ensure all fields are filled before submission</p>
            </div>

            </div>
          <h3 className="text-md font-bold text-gray-600 mb-2">Add Payment</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Payment Amount</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Math.min(Number(e.target.value), remainingAmount))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Remaining Amount</label>
              <p className="font-bold text-gray-600">{remainingAmount}</p>
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div> 
        </div> )}
            </div>
          )}

          {showSuccessModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white text-center p-6 rounded-lg shadow-lg">
                <h3 className="text-md font-bold text-gray-500">Delivery Updated Successfully</h3>
                <p className="text-xs italic text-gray-400 mt-1 mb-5">Successfully Updated the Billing</p>
                <button
                  className="bg-green-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  onClick={() => setShowSuccessModal(false)}
                >
                  <i className="fa fa-check" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


            {/* Modal */}
            {showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg w-full max-w-lg shadow-lg p-4 m-5 relative">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        onClick={() => setShowModal(false)}
      >
        &times;
      </button>

      {modalStep === 1 && (
        <>
          {/* Delivery Summary Section */}
          <h5 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">Delivery Summary</h5>
          <p className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
            Invoice Number: {billingDetails.invoiceNo}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            Customer: {billingDetails.customerName}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            Customer Address: {billingDetails.customerAddress}, Kerala, India
          </p>
          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            Expected Delivery Date: {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            Bill Amount: <span className="font-bold text-gray-500">{billingDetails.billingAmount}</span>
          </p>
          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            Remaining Balance: <span className="font-bold text-gray-500">{remainingAmount}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
            Delivered Products: {selectedProducts.length}/{billingDetails.products.length}
          </p>

          <div className="mx-auto my-4">
                <div className="relative overflow-x-scroll">
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
                          Delivered
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingDetails.products.map((product, index) => (
                        <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                          <th scope="row" className="px-2 py-4 text-xs font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {product.name.slice(0,18)}...
                          </th>
                          <td className="px-6 text-center text-xs py-4">
                            {product.item_id}
                          </td>
                          <td className="px-6 text-xs py-4">
                            {product.quantity}
                          </td>
                          <td className="px-6 text-xs py-4">
                            <input
                              type="checkbox"
                              className="text-green-500"
                              checked={selectedProducts.includes(product.item_id)}
                              onChange={() => handleProductCheckboxChange(product.item_id)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

          <div className="flex justify-center mt-6 gap-4">
            <button
              className="bg-red-500 text-white font-bold text-xs px-8 py-2 rounded-lg"
              onClick={handleNext}
            >
              Next
            </button>
          </div>
        </>
      )}

      {modalStep === 2 && (
        <>
          {/* Additional Inputs Section */}
          <h5 className="mb-4 text-sm font-bold text-red-500 dark:text-white">Additional Details</h5>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-400">Distance Travelled (km)</label>
              <input
                type="number"
                value={kmTravelled}
                onChange={(e) => setKmTravelled(e.target.value)}
                className="w-full border-gray-300 focus:outlone-none focus:ring-red-300 focus:border-red-300  px-3 py-2 mt-1  rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-400">Fuel Charge</label>
              <input
                type="number"
                value={fuelCharge}
                onChange={(e) => setFuelCharge(e.target.value)}
                className="w-full border-gray-300 focus:outlone-none focus:ring-red-300 focus:border-red-300 px-3 py-2 mt-1 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-400">Other Expenses</label>
              <input
                type="number"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(e.target.value)}
                className="w-full border-gray-300 focus:outlone-none focus:ring-red-300 focus:border-red-300 px-3 py-2 mt-1 border rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-between mt-6 gap-4">
            <button
              className="bg-gray-400 text-white font-bold text-xs px-4 py-2 rounded-lg"
              onClick={() => setModalStep(1)}
            >
              Back
            </button>
            <button
              className="bg-green-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}


    </div>
  );
};

export default DriverBillingPage;
