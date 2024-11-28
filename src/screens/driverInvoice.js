import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LowStockPreview from "../components/lowStockPreview";
import api from "./api";
import Loading from "../components/loading";
import DeliverySuccess from "../components/deliverySuccess";
import DeliveredProducts from "../components/deliveredProductscomponent";

const DriverBillingPage = () => {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [assignedBills, setAssignedBills] = useState([]);
  const [driverName, setDriverName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [searchInvoiceNo, setSearchInvoiceNo] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [deliveredModal,setShowDeliveredModal] = useState(false); 
  const [currentDelivered,setCurrentDelivered] = useState({invoiceNo: '', deliveryId: ''});
  const [psRatio,setPsRatio] = useState(0);
  const [qtyInBox,setQtyInBox] = useState('');
  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;


  

  // Load assigned bills and driverName from local storage on component mount
  useEffect(() => {
    const storedAssignedBills = localStorage.getItem("assignedBills");
    const storedDeliveryStarted = localStorage.getItem("deliveryStarted");
    const storedDriverName = localStorage.getItem("driverName");

    if (storedAssignedBills) {
      setAssignedBills(JSON.parse(storedAssignedBills));
    }

    if (storedDeliveryStarted === "true") {
      setDeliveryStarted(true);
    }

    if (storedDriverName) {
      setDriverName(storedDriverName);
    }
  }, []);

  useEffect(()=>{
    const fetchAccounts = async () => {
      setIsLoading(true); // Set loading state
      try {
        const response = await api.get('/api/accounts/allaccounts');
        const getPaymentMethod = response.data.map((acc) => acc.accountId);
    
        // Check if there are any accounts and set the first account as the default
        if (getPaymentMethod.length > 0) {
          const firstAccountId = getPaymentMethod[0];
          // setPaymentMethod(firstAccountId); // Set the first account as default
        } else {
          // setPaymentMethod(null); // Handle case where there are no accounts
        }
    
        setAccounts(response.data); // Set the accounts in state
      } catch (err) {
        setError('Failed to fetch payment accounts.'); // Set error message
        console.error(err);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchAccounts()
  },[])

  // Update local storage whenever assigned bills, deliveryStarted, or driverName change
  useEffect(() => {
    localStorage.setItem("assignedBills", JSON.stringify(assignedBills));
    localStorage.setItem("deliveryStarted", deliveryStarted.toString());
    localStorage.setItem("driverName", driverName);
  }, [assignedBills, deliveryStarted, driverName]);

  // Fetch suggestions based on invoiceNo input
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (invoiceNo) {
        try {
          const response = await api.get(
            `/api/billing/billing/driver/suggestions?search=${invoiceNo}`
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


  // Fetch deliveries for the driver
  useEffect(() => {
    const fetchMyDeliveries = async () => {
      if (!driverName) return; // Avoid API calls if driverName is not provided
  
      try {
        setIsLoading(true);
  
        // Construct the URL dynamically
        const params = new URLSearchParams();
        params.append("driverName", driverName);
        if (searchInvoiceNo) {
          params.append("invoiceNo", searchInvoiceNo);
        }
        if (userInfo?._id) {
          params.append("userId", userInfo._id);
        }
  
        const url = `/api/billing/deliveries/all?${params.toString()}`;
  
        const response = await api.get(url);
  
        // Update deliveries state
        setMyDeliveries(response.data);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
  
        // Optional: Show a user-friendly error message
        setError("Failed to fetch deliveries. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchMyDeliveries();
  }, [driverName, searchInvoiceNo, userInfo?._id]); // Include userInfo._id as a dependency if used
  

  const handleAssignBill = async (id) => {
    if (!invoiceNo) {
      setError("Please enter an invoice number.");
      return;
    }
    try {
      setIsLoading(true);

      const response = await api.get(`/api/billing/${id}`);
      const billingData = response.data;

      // Check if the bill is already assigned
      const isAlreadyAssigned = assignedBills.some(
        (bill) => bill.invoiceNo === billingData.invoiceNo
      );

      if (!isAlreadyAssigned) {
        // Initialize deliveredProducts with default values
        const deliveredProducts = billingData.products.map((product) => {
          const previousDeliveredQuantity = product.deliveredQuantity || 0;
          const pendingQuantity = product.quantity - previousDeliveredQuantity;
          return {
            item_id: product.item_id,
            deliveredQuantity: pendingQuantity,
            isDelivered: false,
            isPartiallyDelivered: false,
            pendingQuantity,
            name: product.name,
            quantity: product.quantity,
          };
        });

        const getPaymentMethod = accounts.map((acc) => acc.accountId);

        // Add the new bill to the assigned bills list
        setAssignedBills((prevBills) => [
          ...prevBills,
          {
            ...billingData,
            newPaymentStatus: billingData.paymentStatus,
            remainingAmount:
             (billingData.grandTotal) -
              (billingData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0),
            receivedAmount:
              billingData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
            deliveredProducts,
            paymentAmount: null,
            paymentMethod: getPaymentMethod[0],
            kmTravelled: "",
            startingKm: "",
            endKm: "",
            fuelCharge: "",
            otherExpenses: [{ amount: 0, remark: "" }],
            totalOtherExpenses: 0,
            showDetails: true,
            activeSection: "Billing Details",
            deliveryId: "",
            showModal: false,
            modalStep: 1,
          },
        ]);
        setError("");
      } else {
        setError("This invoice is already assigned.");
      }

      setInvoiceNo("");
    } catch (error) {
      setError("Error fetching billing details. Please check the invoice number.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = (callback) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        if (callback) callback(location);
      },
      (error) => {
        console.error("Error fetching location:", error);
      }
    );
  };

  const handleStartDelivery = async () => {
    if (assignedBills.length === 0) {
      setError("No bills assigned to start delivery.");
      return;
    }

    setError("");
    setDeliveryStarted(true);

    // Get the current location
    getCurrentLocation(async (startLocation) => {
      if (startLocation) {
        for (let i = 0; i < assignedBills.length; i++) {
          const bill = assignedBills[i];
          try {
            // Generate and set deliveryId
            const deliveryId = `${userInfo._id}-${bill.invoiceNo}-${Date.now()}`;

            // Send the request to start delivery
            await api.post("/api/users/billing/start-delivery", {
              userId: userInfo._id,
              driverName,
              invoiceNo: bill.invoiceNo,
              startLocation: [startLocation.longitude, startLocation.latitude],
              deliveryId,
            });

            setAssignedBills((prevBills) => {
              const updatedBills = [...prevBills];
              updatedBills[i].deliveryId = deliveryId;
              return updatedBills;
            });
          } catch (error) {
            console.error(`Error starting delivery for invoice ${bill.invoiceNo}:`, error);
            alert(`Error starting delivery for invoice ${bill.invoiceNo}.`);
          }
        }
      }
    });
  };

  const handleSuggestionClick = (suggestion) => {
    setSuggestions([]);
    handleAssignBill(suggestion._id);
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

  const handleDeliveredQuantityChange = (billIndex, productId, totalDelivered) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      const bill = updatedBills[billIndex];
      const productIndex = bill.deliveredProducts.findIndex(
        (p) => p.item_id === productId
      );
      if (productIndex >= 0) {
        const deliveredProduct = bill.deliveredProducts[productIndex];
        const newDeliveredQuantity = Math.min(totalDelivered, deliveredProduct.quantity);
        deliveredProduct.deliveredQuantity = newDeliveredQuantity;

        // Update delivery status
        if (newDeliveredQuantity === deliveredProduct.quantity) {
          deliveredProduct.isDelivered = true;
          deliveredProduct.isPartiallyDelivered = false;
        } else if (newDeliveredQuantity > 0) {
          deliveredProduct.isDelivered = false;
          deliveredProduct.isPartiallyDelivered = true;
        } else {
          deliveredProduct.isDelivered = false;
          deliveredProduct.isPartiallyDelivered = false;
        }
      }
      return updatedBills;
    });
  };

  const handlePaymentSubmit = async (billIndex) => {
    const bill = assignedBills[billIndex];
    if (bill.paymentAmount <= 0 || !bill.paymentMethod) {
      setError("Please enter a valid payment amount and method.");
      return;
    }

    try {
      await api.post("/api/users/billing/update-payment", {
        invoiceNo: bill.invoiceNo,
        paymentAmount: bill.paymentAmount,
        paymentMethod: bill.paymentMethod,
        userId: userInfo._id,
      });

      // Update the bill details after payment
      const response = await api.get(`/api/billing/${bill._id}`);
      const updatedBillData = response.data;


      const getPaymentMethod = accounts.map((acc) => acc.accountId);

      setAssignedBills((prevBills) => {
        const updatedBills = [...prevBills];
        updatedBills[billIndex] = {
          ...updatedBills[billIndex],
          ...updatedBillData,
          newPaymentStatus: updatedBillData.paymentStatus,
          remainingAmount:
            updatedBillData.grandTotal -
            (updatedBillData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0),
          receivedAmount:
            updatedBillData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
          paymentAmount: 0,
          paymentMethod: getPaymentMethod[0],
        };
        return updatedBills;
      });

      setError("");
      setShowSuccessModal(true);
    } catch (error) {
      setError("Error updating payment status.");
    }
  };

  const handleDelivered = (billIndex) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      updatedBills[billIndex].showModal = true;
      updatedBills[billIndex].modalStep = 1;
      return updatedBills;
    });
  };

  const handleNext = (billIndex) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      updatedBills[billIndex].modalStep = 2;
      return updatedBills;
    });
  };

  const handleSubmit = async (billIndex) => {
    setIsLoading(true);
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      updatedBills[billIndex].showModal = false;
      return updatedBills;
    });

    const bill = assignedBills[billIndex];

    try {
      await getCurrentLocation(async (endLocation) => {
        if (endLocation) {
          const deliveredProducts = bill.deliveredProducts.map((dp) => ({
            item_id: dp.item_id,
            deliveredQuantity: dp.deliveredQuantity,
          }));

          // Calculate overall delivery status
          const allDelivered = bill.deliveredProducts.every((dp) => dp.isDelivered);
          const anyDelivered = bill.deliveredProducts.some(
            (dp) => dp.isDelivered || dp.isPartiallyDelivered
          );

          let deliveryStatus = "Pending";
          if (allDelivered) {
            deliveryStatus = "Delivered";
          } else if (anyDelivered) {
            deliveryStatus = "Partially Delivered";
          }

          await api.post("/api/users/billing/end-delivery", {
            userId: userInfo._id,
            invoiceNo: bill.invoiceNo,
            driverName,
            endLocation: [endLocation.longitude, endLocation.latitude],
            deliveredProducts,
            kmTravelled: bill.kmTravelled,
            startingKm: bill.startingKm,
            endKm: bill.endKm,
            deliveryId: bill.deliveryId,
            fuelCharge: parseFloat(bill.fuelCharge) || 0,
            otherExpenses: bill.otherExpenses.map((expense) => ({
              amount: parseFloat(expense.amount) || 0,
              remark: expense.remark,
            })),
          });

          setCurrentDelivered({invoiceNo: bill.invoiceNo, deliveryId: bill.deliveryId})

          // Remove the bill from assignedBills after successful submission
          setAssignedBills((prevBills) => {
            const updatedBills = [...prevBills];
            updatedBills.splice(billIndex, 1);
            return updatedBills;
          });

          // If all bills are delivered or canceled, reset deliveryStarted
          if (assignedBills.length === 1) {
            setDeliveryStarted(false);
          }

          setShowDeliveredModal(true);
          setTimeout(() => setShowSuccessModal(false), 3000);
        }
      });
    } catch (error) {
      setError("Error updating delivery status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtherExpensesChange = (billIndex, index, field, value) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      const updatedExpenses = [...updatedBills[billIndex].otherExpenses];
      updatedExpenses[index][field] = field === "amount" ? parseFloat(value) || 0 : value;
      updatedBills[billIndex].otherExpenses = updatedExpenses;
      return updatedBills;
    });
  };

  const handleAddExpense = (billIndex) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      updatedBills[billIndex].otherExpenses.push({ amount: 0, remark: "" });
      return updatedBills;
    });
  };

  const handleCancel = (billIndex) => {
    try {
      // Get the invoice number of the bill to be canceled
      const invoiceNo = assignedBills[billIndex].invoiceNo;
  
      // Send the invoice number to the backend API
      api.post('/api/billing/bill/cancel', { invoiceNo })
                // Remove the bill from assignedBills
                setAssignedBills((prevBills) => {
                  const updatedBills = [...prevBills];
                  updatedBills.splice(billIndex, 1); // Remove the bill at billIndex
                  return updatedBills;
                });
        
                // Check if all bills are delivered or canceled
                if (assignedBills.length === 1) {
                  setDeliveryStarted(false);
                }
              
    } catch (error) {
      console.error('Unexpected error:', error);
      alert("An unexpected error occurred");
    }
  };
  

  const handleUpdateDelivery = async () => {
    try {
      // Identify the new expense (assuming the last one in the array is new)
      const newExpense = selectedDelivery.otherExpenses[selectedDelivery.otherExpenses.length - 1];
  
      // Prepare the request payload
      const payload = {
        deliveryId: selectedDelivery.deliveryId,
        startingKm: selectedDelivery.startingKm,
        endKm: selectedDelivery.endKm,
        kmTravelled: selectedDelivery.kmTravelled,
        fuelCharge: selectedDelivery.fuelCharge,
        newOtherExpense: {
          amount: newExpense.amount,
          remark: newExpense.remark,
        },
        // Include other fields if necessary
      };
  
      // Make the PUT request to the backend
      const response = await api.put('/api/billing/update-delivery/update', payload);
  
      if (response.status === 200) {
        // Handle successful update (e.g., refresh data, close modal)
        // Refresh the billing data or update the state accordingly
        setShowDeliveryModal(false);
        setSelectedDelivery(null);
        alert("successfully updated")
        // Optionally, trigger a data refresh here
      } else {
        // Handle errors returned from the backend
        alert('Update failed:', response.data.message);
        // Optionally, display an error message to the user
      }
    } catch (error) {
      alert('Error updating delivery:', error);
      // Optionally, display an error message to the user
    }
  };
  

  return (
    <div>
      {isLoading && <Loading />}

      {/* Header */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate("/")} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Delivery & Payment Updation</p>
        </div>
        <i className="fa fa-truck text-gray-500" />
      </div>

     {!deliveryStarted && <div className="flex justify-center gap-8">
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "home" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("home")}
        >
          Home
          {activeSection === "home" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "my" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("my")}
        >
          My Deliveries
          {activeSection === "my" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "assign" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("assign")}
        >
          Start Delivery
          {activeSection === "assign" && ( 
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
      </div> }

      <div className="flex flex-col justify-center items-center p-2">
       <div className="bg-white shadow-xl rounded-lg w-full max-w-4xl p-6">


          {activeSection == "home" && !deliveryStarted && <div className="my-deliveries-section mt-8">
            <p className="text-xs font-bold text-gray-600 mb-4">My Deliveries</p>
            <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 mt-4 rounded w-full"
                onClick={()=> setActiveSection("my")}
              >
                My Deliveries
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 mt-4 rounded w-full"
                onClick={()=> setActiveSection("assign")}
              >
                Start Delivery
              </button>
          </div> }

          {/* Assignment Section - Visible Only When Delivery Not Started */}
          {activeSection == "assign" &&  !deliveryStarted && (
            <>
              <div className="mb-6">
                <label className="font-bold text-xs text-gray-500">Driver Name</label>
                <input
                  type="text"
                  placeholder="Enter Driver Name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                />
                <div className="relative w-full mt-2">
                  <label className="font-bold text-xs text-gray-500">Invoice No.</label>
                  <input
                    type="text"
                    placeholder="Enter Invoice Number"
                    value={invoiceNo}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                    readOnly={driverName.length === 0}
                  />
                  <i
                    onClick={() => setInvoiceNo(" ")}
                    className="fa fa-angle-down absolute right-3 bottom-0 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                  ></i>
                </div>
              </div>

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
                      <span className="font-bold text-xs text-gray-500">
                        {suggestion.invoiceNo}
                      </span>
                      <i className="fa fa-arrow-right text-gray-300" />
                    </li>
                  ))}
                </ul>
              )}

              {error && <p className="text-red-500 text-center mt-4">{error}</p>}

              {/* Assigned Bills Preview */}
              {assignedBills.length > 0 && (
                <div className="assigned-bills-preview mb-6">
                  <h3 className="font-bold text-gray-600 mb-4">Assigned Bills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedBills.map((bill, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg shadow">
                        <h4 className="font-bold text-gray-800 mb-2">
                          Invoice No: {bill.invoiceNo}
                        </h4>
                        <p className="text-xs text-gray-600">Customer: {bill.customerName}</p>
                        <p className="text-xs text-gray-600">Address: {bill.customerAddress}</p>
                        <p className="text-xs font-bold text-gray-600">
                          Net Amount: ₹ {bill.grandTotal}
                        </p>
                        <p className="text-xs text-gray-600">
                          Delivered Products:  {bill.deliveredProducts?.length}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Delivery Button */}
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 mt-4 rounded w-full"
                onClick={handleStartDelivery}
                disabled={assignedBills.length === 0}
              >
                Start Delivery
              </button>
            </>
          )}

          {/* After Starting Delivery */}
          {deliveryStarted &&
            assignedBills.length > 0 && (
              <div>
                <p className="font-bold text-sm mb-10 ">Assigned Invoices</p>
                {
            assignedBills.map((bill, billIndex) => (
              <div key={bill.invoiceNo} className="mb-8 border-t-2 border-red-300">
                 <h5 className="mt-8 text-md font-bold tracking-tight text-gray-600">
                            Invoice No: {bill.invoiceNo}
                          </h5>
                {/* Integrated Navigation with Bottom Border Animation */}
                <div className="flex justify-center gap-8 mt-4">
                  <button
                    className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                      bill.activeSection === "Billing Details"
                        ? "text-red-600 border-b-2 border-red-600"
                        : "text-gray-600"
                    }`}
                    onClick={() =>
                      setAssignedBills((prevBills) => {
                        const updatedBills = [...prevBills];
                        updatedBills[billIndex].activeSection = "Billing Details";
                        return updatedBills;
                      })
                    }
                  >
                    Billing Details
                    {bill.activeSection === "Billing Details" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
                    )}
                  </button>

                  <button
                    className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                      bill.activeSection === "Payment Section"
                        ? "text-red-600 border-b-2 border-red-600"
                        : "text-gray-600"
                    }`}
                    onClick={() =>
                      setAssignedBills((prevBills) => {
                        const updatedBills = [...prevBills];
                        updatedBills[billIndex].activeSection = "Payment Section";
                        return updatedBills;
                      })
                    }
                  >
                    Payment Section
                    {bill.activeSection === "Payment Section" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
                    )}
                  </button>
                </div>

                {/* Billing Details or Payment Section */}
                {bill.showDetails && (
                  <div>
                    {bill.activeSection === "Billing Details" && (
                      <div>
                        {/* Billing Details Content */}
                        <div className="mt-4">
                          <div className="flex justify-between">
                            <p className="mt-1 text-xs font-bold text-gray-600">
                              Customer: {bill.customerName}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              Address: {bill.customerAddress}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="mt-1 text-xs text-gray-600">
                              Salesman: {bill.salesmanName}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              Invoice Date: {new Date(bill.invoiceDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="mt-1 text-xs text-gray-600">
                              Expected Delivery Date:{" "}
                              {new Date(bill.expectedDeliveryDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="mt-1 font-bold text-sm text-gray-600">
                              Bill Amount: ₹ {bill.grandTotal}
                            </p>
                            </div>
                          <div className="flex justify-between">
                            <p className="mt-1 text-xs text-gray-600">
                              Discount: ₹ {bill.discount}
                            </p>
                            <p className="mt-1 text-xs font-bold text-green-600">
                              Received Amount: ₹ {bill.receivedAmount}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="mt-1 text-xs font-bold text-red-600">
                              Remaining Amount: ₹ {bill.remainingAmount}
                            </p>
                            <p className="mt-1 font-bold text-xs text-gray-600">
                              Payment Status: {bill.paymentStatus}
                            </p>
                          </div>

                          <div className="flex justify-between">
                            <p className="mt-1 font-bold text-xs text-gray-600">
                              Delivery Status: Transit-In
                            </p>
                            <p className="mt-1 font-bold text-xs text-gray-600">
                              Delivered Products:
                            </p>
                          </div>
                        </div>

                        {/* Product List with Delivered Quantity */}
                        <div className="mt-6">
                          {/* For larger screens, keep the table layout */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-xs text-left text-gray-700">
                              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3">
                                    Product
                                  </th>
                                  <th scope="col" className="px-4 py-3">
                                    ID
                                  </th>
                                  <th scope="col" className="px-4 py-3">
                                    Qty. Ordered
                                  </th>
                                  <th scope="col" className="px-4 py-3">
                                    Qty. Pending
                                  </th>
                                  <th scope="col" className="px-4 py-3">
                                    Qty. Delivered
                                  </th>
                                  <th scope="col" className="px-4 py-3">
                                    Delivered
                                  </th>
                                  <th scope="col" className="px-4 py-3">
                                    Partially Delivered
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {bill.deliveredProducts.map((dp, index) => {
                                  const shortName =
                                    dp.name.length > 20 ? dp.name.slice(0, 15) + "..." : dp.name;
                                  return (
                                    <tr key={index} className="bg-white border-b">
                                      <th
                                        scope="row"
                                        className="px-4 py-4 font-bold text-sm text-gray-600 whitespace-nowrap"
                                      >
                                        {shortName}
                                      </th>
                                      <td className="px-4 py-4">{dp.item_id}</td>
                                      <td className="px-4 py-4">{dp.quantity}</td>
                                      <td className="px-4 py-4">{dp.pendingQuantity}</td>
                                      <td className="px-4 py-4">
                                        <input
                                          type="number"
                                          min="0"
                                          max={dp.pendingQuantity}
                                          value={dp.deliveredQuantity}
                                          onChange={(e) =>
                                            handleDeliveredQuantityChange(
                                              billIndex,
                                              dp.item_id,
                                              e.target.value
                                            )
                                          }
                                          className="w-16 p-1 border border-gray-300 rounded"
                                        />
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                        <i
                                          className={`fa ${
                                            dp.isDelivered
                                              ? "fa-check text-red-500"
                                              : "fa-times text-red-500"
                                          }`}
                                        ></i>
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                        <i
                                          className={`fa ${
                                            dp.isPartiallyDelivered
                                              ? "fa-check text-yellow-500"
                                              : "fa-times text-red-500"
                                          }`}
                                        ></i>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* For smaller screens, use a card-based layout */}
                          <div className="md:hidden space-y-4">
        {assignedBills.map((bill, billIndex) => (
          <div key={bill.invoiceNo}>
            {bill.deliveredProducts.map((dp, dpIndex) => (
              <DeliveredProducts
                key={dp.item_id}
                dp={dp}
                billIndex={billIndex}
                handleDeliveredQuantityChange={handleDeliveredQuantityChange}
              />
            ))}
          </div>
        ))}
      </div>

                    </div>

                        {/* Continue and Cancel Buttons */}
                        <div className="flex justify-between mt-6">
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-1 rounded-lg w-full mr-2"
                            onClick={() => handleDelivered(billIndex)}
                          >
                            Continue
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-1 rounded-lg w-full ml-2"
                            onClick={() => handleCancel(billIndex)}
                          >
                            Cancel Delivery
                          </button>
                        </div>

                        {/* Modal for Delivery Summary and Additional Details */}
                        {bill.showModal && (
                          <div className="fixed inset-0 z-50 flex justify-center bg-black bg-opacity-50 overflow-auto">
                            <div className="bg-white animate-slide-up top-1/4 rounded-lg w-full max-w-xl shadow-lg p-6 relative">
                              {/* Close Button */}
                              <button
                                className="absolute font-bold top-4 right-4 text-gray-600 hover:text-gray-600"
                                onClick={() =>
                                  setAssignedBills((prevBills) => {
                                    const updatedBills = [...prevBills];
                                    updatedBills[billIndex].showModal = false;
                                    return updatedBills;
                                  })
                                }
                              >
                                &times;
                              </button>

                              {bill.modalStep === 1 && (
                                <>
                                  {/* Delivery Summary Section */}
                                  <h5 className="mb-4 text-sm font-bold text-gray-600">
                                    Delivery Summary
                                  </h5>
                                  <div className="text-xs text-gray-600 space-y-2">
                                    <p>
                                      <span className="font-bold">Invoice Number:</span>{" "}
                                      {bill.invoiceNo}
                                    </p>
                                    <p>
                                      <span className="font-bold">Customer:</span>{" "}
                                      {bill.customerName}
                                    </p>
                                    <p>
                                      <span className="font-bold">Address:</span>{" "}
                                      {bill.customerAddress}
                                    </p>
                                    <p>
                                      <span className="font-bold">Expected Delivery Date:</span>{" "}
                                      {new Date(bill.expectedDeliveryDate).toLocaleDateString()}
                                    </p>
                                    <p>
                                      <span className="font-bold">Bill Amount:</span> ₹{" "}
                                      {bill.grandTotal}
                                    </p>
                                    <p>
                                      <span className="font-bold">Received Amount:</span> ₹{" "}
                                      {bill.receivedAmount}
                                    </p>
                                    <p>
                                      <span className="font-bold">Remaining Balance:</span> ₹{" "}
                                      {bill.remainingAmount}
                                    </p>
                                  </div>

                                  <div className="mt-4">
                                    <h6 className="font-bold text-sm text-gray-700">
                                      Delivered Products: {bill.deliveredProducts?.length}
                                    </h6>
                                    <ul className="list-disc list-inside text-xs text-gray-700 mt-2">
                                      {bill.deliveredProducts.map((dp) => {
                                        const productName =
                                          dp.name.length > 30
                                            ? dp.name.slice(0, 30) + ".."
                                            : dp.name;
                                        if (dp.deliveredQuantity > 0) {
                                          return (
                                            <li className="bg-gray-100 p-2 space-y-1 rounded-lg" key={dp.item_id}>
                                              <div className="flex justify-between">
                                              <p className="font-bold">{dp.item_id}</p>
                                              <p className="font-bold">{productName}</p>
                                              </div>
                                              <p className="font-bold">Delivered Quantity: {dp.deliveredQuantity}</p>
                                            </li>
                                          );
                                        }
                                        return null;
                                      })}
                                    </ul>
                                  </div>

                                  {/* Next Button */}
                                  <div className="flex justify-center mt-6">
                                    <button
                                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-6 py-2 rounded-lg"
                                      onClick={() => handleNext(billIndex)}
                                    >
                                      Next
                                    </button>
                                  </div>
                                </>
                              )}

                              {bill.modalStep === 2 && (
                                <>
                                  {/* Additional Inputs Section */}
                                  <h5 className="mb-4 text-sm font-bold text-red-500">
                                    Additional Details
                                  </h5>
                                  <div className="flex flex-col gap-4">
                                    {/* Starting KM */}
                                    <div>
                                      <label className="block text-xs text-gray-400">
                                        Starting KM
                                      </label>
                                      <input
                                        type="number"
                                        value={bill.startingKm}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            updatedBills[billIndex].startingKm = e.target.value;
                                            updatedBills[billIndex].kmTravelled =
                                              updatedBills[billIndex].endKm - e.target.value;
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                      />
                                    </div>
                                    {/* Ending KM */}
                                    <div>
                                      <label className="block text-xs text-gray-400">
                                        Ending KM
                                      </label>
                                      <input
                                        type="number"
                                        value={bill.endKm}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            updatedBills[billIndex].endKm = e.target.value;
                                            updatedBills[billIndex].kmTravelled =
                                              e.target.value - updatedBills[billIndex].startingKm;

                                              updatedBills[billIndex].fuelCharge = ((parseFloat(updatedBills[billIndex].kmTravelled) / 10 ) * 96).toFixed(2)
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                      />
                                    </div>
                                    {/* Distance Travelled */}
                                    <div>
                                      <label className="block text-xs font-bold text-gray-400">
                                        Distance Travelled (km)
                                      </label>
                                      <input
                                        type="number"
                                        value={bill.kmTravelled}
                                        readOnly
                                        className="w-full border bg-gray-100 border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                      />
                                    </div>
                                    {/* Fuel Charge */}
                                    <div>
                                      <label className="block text-xs font-bold text-gray-400">
                                        Fuel Charge
                                      </label>
                                      <input
                                        type="number"
                                        value={bill.fuelCharge}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            updatedBills[billIndex].fuelCharge = e.target.value;
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                      />
                                    </div>
                                    {/* Other Expenses */}
                                    <div className="mt-4">
                                      <h6 className="text-xs font-bold text-gray-500 mb-1">
                                        Add Other Expenses
                                      </h6>
                                      {bill.otherExpenses.map((expense, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                          <input
                                            type="number"
                                            value={expense.amount}
                                            onChange={(e) =>
                                              handleOtherExpensesChange(
                                                billIndex,
                                                index,
                                                "amount",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Amount"
                                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                          />
                                          <input
                                            type="text"
                                            value={expense.remark}
                                            onChange={(e) =>
                                              handleOtherExpensesChange(
                                                billIndex,
                                                index,
                                                "remark",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Remark"
                                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                          />
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => handleAddExpense(billIndex)}
                                        className="text-xs font-bold text-blue-500 hover:text-blue-700 mt-2"
                                      >
                                        + Add Expense
                                      </button>
                                    </div>
                                  </div>

                                  {/* Submit and Back Buttons */}
                                  <div className="flex justify-right mt-6 gap-4">
                                    <button
                                      className="bg-gray-400 hover:bg-gray-500 text-white font-bold text-xs px-4 py-2 rounded-lg w-1/2"
                                      onClick={() =>
                                        setAssignedBills((prevBills) => {
                                          const updatedBills = [...prevBills];
                                          updatedBills[billIndex].modalStep = 1;
                                          return updatedBills;
                                        })
                                      }
                                    >
                                      Back
                                    </button>
                                    <button
                                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg w-full"
                                      onClick={() => handleSubmit(billIndex)}
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
                    )}

                    {bill.activeSection === "Payment Section" && (
                      <div className="mt-6 pt-4">
                        {/* Payment Section Content */}
                        <div className="flex justify-between mb-6 border-b pb-5">
                          <p
                            className={`${
                              bill.newPaymentStatus === "Paid"
                                ? "bg-red-200"
                                : bill.newPaymentStatus === "Partial"
                                ? "bg-yellow-200"
                                : "bg-red-200"
                            } text-center flex-col mt-auto py-4 font-bold text-xs rounded-lg px-10`}
                          >
                            <span
                              className={`${
                                bill.newPaymentStatus === "Paid"
                                  ? "text-red-500"
                                  : bill.newPaymentStatus === "Partial"
                                  ? "text-yellow-500"
                                  : "text-red-800"
                              } animate-pulse font-bold text-sm`}
                            >
                              {bill.newPaymentStatus}
                            </span>
                          </p>
                          <div className="text-right">
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-3 rounded-lg"
                              onClick={() => handlePaymentSubmit(billIndex)}
                            >
                              Submit Payment
                            </button>
                            <p className="italic text-gray-400 text-xs mt-1">
                              Ensure all fields are filled before submission
                            </p>
                          </div>
                        </div>
                        <h3 className="text-md font-bold text-gray-600 mb-2">Add Payment</h3>
                        <div className="flex flex-col gap-4">
                          {/* Payment Amount */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">
                              Payment Amount
                            </label>
                            <input
                              type="number"
                              value={bill.paymentAmount}
                              onChange={(e) =>
                                setAssignedBills((prevBills) => {
                                  const updatedBills = [...prevBills];
                                  updatedBills[billIndex].paymentAmount = Math.min(
                                    Number(e.target.value),
                                    bill.remainingAmount
                                  );
                                  return updatedBills;
                                })
                              }
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            />
                          </div>
                          {/* Payment Method */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">
                              Payment Method
                            </label>
                            <select
                              value={bill.paymentMethod}
                              onChange={(e) =>
                                setAssignedBills((prevBills) => {
                                  const updatedBills = [...prevBills];
                                  updatedBills[billIndex].paymentMethod = e.target.value;
                                  return updatedBills;
                                })
                              }
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            >

      {accounts.map((acc) => (
        <option key={acc.accountId} value={acc.accountId}>
          {acc.accountName}
        </option>
      ))}
            </select>
                          </div>
                          {/* Remaining Amount */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">
                              Remaining Amount
                            </label>
                            <p className="font-bold text-gray-600">₹ {bill.remainingAmount}</p>
                          </div>
                          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}</div>)}

          {showSuccessModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white text-center p-6 rounded-lg shadow-lg">
                <h3 className="text-md font-bold text-gray-500">Operation Successful</h3>
                <p className="text-xs italic text-gray-400 mt-1 mb-5">
                  Successfully updated the billing information.
                </p>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  onClick={() => setShowSuccessModal(false)}
                >
                  <i className="fa fa-check" />
                </button>
              </div>
            </div>
          )}

          {deliveredModal && <DeliverySuccess invoiceNo={currentDelivered?.invoiceNo} deliveryNo={currentDelivered?.deliveryId}  setDeliveryModal={setShowDeliveredModal} />}



          {/* If no bills are assigned and delivery hasn't started, show LowStockPreview */}
          {activeSection == "home" && !deliveryStarted && 
            <LowStockPreview driverPage={true} />
          } 

          {/* My Deliveries Section */}
        {activeSection == "my" &&  <div className="my-deliveries-section mt-8">
            <h2 className="text-xl font-bold text-gray-600 mb-4">My Deliveries</h2>

            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by Invoice Number"
                value={searchInvoiceNo}
                onChange={(e) => setSearchInvoiceNo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
              />
            </div>

            {/* Deliveries List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDeliveries.map((delivery, index) => (
                <div
                  key={index}
                  className="bg-white shadow-md rounded-lg p-4 cursor-pointer"
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    setShowDeliveryModal(true);
                  }}
                >
                  <h3 className="text-md font-bold text-gray-600">
                    Invoice No: {delivery.invoiceNo}
                  </h3>
                  <p className="text-xs text-gray-500">Customer: {delivery.customerName}</p>
                  <p className="text-xs text-gray-500">
                    Billing Amount: ₹ {delivery.grandTotal}
                  </p>
                  <p className="text-xs text-gray-500">Payment Status: {delivery.paymentStatus}</p>
                  <p className="text-xs text-gray-500">
                    Delivery Status: {delivery.deliveryStatus}
                  </p>
                </div>
              ))}
            </div>
          </div> }

          {/* Delivery Modal */}
          {showDeliveryModal && selectedDelivery && (
  <div className="fixed overflow-auto inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg w-full max-w-lg shadow-lg p-6 relative">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-600"
        onClick={() => {
          setShowDeliveryModal(false);
          setSelectedDelivery(null);
        }}
      >
        &times;
      </button>

      {/* Delivery Details and Editing Form */}
      <h5 className="mb-4 text-sm font-bold text-gray-600">
        Edit Delivery Details - Invoice No: {selectedDelivery.invoiceNo}
      </h5>
      {/* Delivery Details */}
      <div className="text-xs text-gray-600 space-y-2">
        <p>
          <span className="font-bold">Customer:</span> {selectedDelivery.customerName}
        </p>
        <p>
          <span className="font-bold">Address:</span> {selectedDelivery.customerAddress}
        </p>
        <p>
          <span className="font-bold">Billing Amount:</span> ₹ {selectedDelivery.grandTotal}
        </p>
        <p>
          <span className="font-bold">Payment Status:</span> {selectedDelivery.paymentStatus}
        </p>
        <p>
          <span className="font-bold">Delivery Status:</span> {selectedDelivery.deliveryStatus}
        </p>
      </div>

      {/* Editable Fields */}
      <div className="flex flex-col gap-4 mt-4">
        {/* Starting KM */}
        <div>
          <label className="block text-xs font-bold text-gray-400">Starting KM</label>
          <input
            type="number"
            value={selectedDelivery.startingKm}
            onChange={(e) =>
              setSelectedDelivery((prev) => ({
                ...prev,
                startingKm: +e.target.value,
                kmTravelled: prev.endKm - +e.target.value,
              }))
            }
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
          />
        </div>
        {/* Ending KM */}
        <div>
          <label className="block text-xs font-bold text-gray-400">Ending KM</label>
          <input
            type="number"
            value={selectedDelivery.endKm}
            onChange={(e) =>
              setSelectedDelivery((prev) => ({
                ...prev,
                endKm: +e.target.value,
                kmTravelled: +e.target.value - prev.startingKm,
              }))
            }
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
          />
        </div>
        {/* Distance Travelled */}
        <div>
          <label className="block text-xs font-bold text-gray-400">
            Distance Travelled (km)
          </label>
          <input
            type="number"
            value={selectedDelivery.kmTravelled}
            readOnly
            className="w-full border-gray-300 px-3 py-2 mt-1 rounded-md bg-gray-100"
          />
        </div>
        {/* Fuel Charge */}
        <div>
          <label className="block text-xs font-bold text-gray-400">Fuel Charge</label>
          <input
            type="number"
            value={selectedDelivery.fuelCharge}
            onChange={(e) =>
              setSelectedDelivery((prev) => ({
                ...prev,
                fuelCharge: +e.target.value,
              }))
            }
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
          />
        </div>
        {/* Other Expenses */}
        <div className="mt-4">
          <h6 className="text-xs font-bold text-gray-500 mb-1">Other Expenses</h6>
          {selectedDelivery.otherExpenses.map((expense, index) => (
  <div key={index} className="flex gap-2 mb-2">
    <input
      type="number"
      value={expense.amount}
      onChange={(e) => {
        const updatedExpenses = [...selectedDelivery.otherExpenses];
        updatedExpenses[index].amount = parseFloat(e.target.value) || 0; // Parse as a number
        setSelectedDelivery((prev) => ({
          ...prev,
          otherExpenses: updatedExpenses,
        }));
      }}
      placeholder="Amount"
      className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
    />
    <input
      type="text"
      value={expense.remark}
      onChange={(e) => {
        const updatedExpenses = [...selectedDelivery.otherExpenses];
        updatedExpenses[index].remark = e.target.value;
        setSelectedDelivery((prev) => ({
          ...prev,
          otherExpenses: updatedExpenses,
        }));
      }}
      placeholder="Remark"
      className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
    />
  </div>
))}
          <button
            onClick={() => {
              setSelectedDelivery((prev) => ({
                ...prev,
                otherExpenses: [...prev.otherExpenses, { amount: 0, remark: "" }],
              }));
            }}
            className="text-xs font-bold text-blue-500 hover:text-blue-700 mt-2"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Delivered Products */}
      <div className="mt-6">
        <h6 className="font-bold text-gray-700">Delivered Products:</h6>
        <ul className="list-disc list-inside text-xs text-gray-700 mt-2">
          {selectedDelivery.productsDelivered.map((dp) => (
            <li key={dp.item_id}>
              Item ID: {dp.item_id}, Delivered Quantity: {dp.deliveredQuantity}
            </li>
          ))}
        </ul>
      </div>

      {/* Save and Close Buttons */}
      <div className="flex justify-end mt-6 gap-4">
        <button
          className="bg-gray-400 hover:bg-gray-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
          onClick={() => {
            setShowDeliveryModal(false);
            setSelectedDelivery(null);
          }}
        >
          Close
        </button>
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
          onClick={handleUpdateDelivery}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default DriverBillingPage;
