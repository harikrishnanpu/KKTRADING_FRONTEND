// src/screens/EditPurchaseScreen.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";
import ErrorModal from "../components/ErrorModal";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function EditPurchaseScreen() {
  const { id } = useParams(); // Purchase ID from URL
  const navigate = useNavigate();

  // State Variables

  // Seller Information
  const [sellerId, setSellerId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerGst, setSellerGst] = useState("");
  const [sellerSuggestions, setSellerSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Purchase Information
  const [purchaseId, setPurchaseId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  // Item Information
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemBrand, setItemBrand] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itembillPartPrice, setItembillPartPrice] = useState("");
  const [itemcashPartPrice, setItemcashPartPrice] = useState("");
  const [categories, setCategories] = useState([]);

  // Item Additional Information
  const [sUnit, setSUnit] = useState("");
  const [psRatio, setPsRatio] = useState("");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [size, setSize] = useState("");

  // Transportation Information
  const [logisticCompany, setLogisticCompany] = useState("");
  const [logisticAmount, setLogisticAmount] = useState("");
  const [logisticRemark, setLogisticRemark] = useState("");
  const [localCompany, setLocalCompany] = useState("");
  const [localAmount, setLocalAmount] = useState("");
  const [localRemark, setLocalRemark] = useState("");
  const [transportCompanies, setTransportCompanies] = useState([]);
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [localGst, setLocalGst] = useState("");
  const [logisticGst, setLogisticGst] = useState("");
  const [localBillId, setLocalBillId] = useState("");
  const [logisticBillId, setLogisticBillId] = useState("");

  // Other States
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Refs for input fields to enable Enter navigation
  const sellerIdRef = useRef();
  const sellerNameRef = useRef();
  const sellerAddressRef = useRef();
  const sellerGstRef = useRef();
  const purchaseIdRef = useRef();
  const invoiceNoRef = useRef();
  const billingDateRef = useRef();
  const invoiceDateRef = useRef();
  const itemIdRef = useRef();
  const itemNameRef = useRef();
  const itemBrandRef = useRef();
  const itemCategoryRef = useRef();
  const itembillPartPriceRef = useRef();
  const itemcashPartPriceRef = useRef();
  const itemUnitRef = useRef();
  const itemQuantityRef = useRef();
  const logisticCompanyRef = useRef();
  const logisticAmountRef = useRef();
  const localCompanyRef = useRef();
  const localAmountRef = useRef();

  // Effect to auto-hide messages after 3 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Effect to focus on the first input of each step
  useEffect(() => {
    if (currentStep === 1) {
      purchaseIdRef.current?.focus();
    } else if (currentStep === 2) {
      sellerAddressRef.current?.focus();
    } else if (currentStep === 3) {
      itemIdRef.current?.focus();
    } else if (currentStep === 4) {
      logisticCompanyRef.current?.focus();
    }
  }, [currentStep]);

  // Fetch categories, transport companies, and purchase details on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/api/billing/purchases/categories");
        setCategories(data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    const fetchTransportCompanies = async () => {
      try {
        const { data } = await api.get("/api/purchases/get-all/transportCompany");
        setTransportCompanies(data);
      } catch (error) {
        console.error("Error fetching transport companies:", error);
      }
    };
    const fetchPurchaseDetails = async () => {
      if (!id) {
        setError("No purchase ID provided.");
        setShowErrorModal(true);
        return;
      }
      try {
        setLoading(true);
        const { data } = await api.get(`/api/orders/purchase/${id}`);
        // Populate state with fetched data
        setSellerId(data.sellerId);
        setSellerName(data.sellerName);
        setSellerAddress(data.sellerAddress);
        setSellerGst(data.sellerGst);
        setInvoiceNo(data.invoiceNo);
        setPurchaseId(data.purchaseId);
        setBillingDate(data.billingDate ? data.billingDate.substring(0, 10) : "");
        setInvoiceDate(data.invoiceDate ? data.invoiceDate.substring(0, 10) : "");
        setItems(data.items || []);
        if (data.purchaseId) {
          try {
            const response = await api.get(`/api/orders/transport/${data.purchaseId}`);
            const transportData = response.data; // Assuming response.data is the array provided

            // Initialize variables for logistic and local transport
            let logisticCompany = "";
            let logisticAmount = 0;
            let logisticRemark = "";
            let localCompany = "";
            let localAmount = 0;
            let localRemark = "";
            let localGst = "";
            let logisticGst = "";
            let localBillId = "";
            let logisticBillId = "";

            // Process the transport data
            transportData.forEach((item) => {
              if (item.transportType === "logistic") {
                logisticCompany = item.transportCompanyName || "";
                logisticAmount = item.transportationCharges || 0;
                logisticRemark = item.remarks || "";
                logisticBillId = item.billId || "";
                logisticGst = item.companyGst || "";
              } else if (item.transportType === "local") {
                localCompany = item.transportCompanyName || "";
                localAmount = item.transportationCharges || 0;
                localRemark = item.remarks || "";
                localBillId = item.billId || "";
                localGst = item.companyGst || "";
              }
            });

            console.log(transportData) ;

            // Set the state with the parsed data
            setLogisticCompany(logisticCompany);
            setLogisticAmount(logisticAmount);
            setLocalCompany(localCompany);
            setLocalAmount(localAmount);
            setLogisticRemark(logisticRemark);
            setLocalRemark(localRemark);
            setLocalBillId(localBillId);
            setLogisticBillId(logisticBillId);
            setLocalGst(localGst);
            setLogisticGst(logisticGst);
          } catch (err) {
            console.error("Error fetching transport details:", err);
          }
        }
      } catch (err) {
        setError("Error fetching purchase details.");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchTransportCompanies();
    fetchPurchaseDetails();
  }, [id]);

  // Handle Seller Name change with suggestions
  const handleSellerNameChange = async (e) => {
    const value = e.target.value;
    setSellerName(value);
    if (value.trim() === "") {
      setSellerSuggestions([]);
      setSellerId("");
      return;
    }
    try {
      const { data } = await api.get(
        `/api/billing/purchases/suggestions?q=${value}`
      );
      setSellerSuggestions(data.suggestions);
    } catch (err) {
      setError("Error fetching seller suggestions");
      setShowErrorModal(true);
    }
  };

  // Function to handle selecting a seller from suggestions
  const handleSelectSeller = (seller) => {
    setSellerName(seller.name);
    setSellerId(seller.id);
    setSellerAddress(seller.address || "");
    setSellerGst(seller.gstin || "");
    setSellerSuggestions([]);
    invoiceNoRef.current?.focus();
  };

  // Function to generate a new seller ID
  const generateSellerId = async () => {
    try {
      const lastId = 'KKSELLER' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setSellerId(lastId);
    } catch (err) {
      setError("Error generating seller ID");
      setShowErrorModal(true);
    }
  };

  // Function to handle adding items with consistent calculations
  const addItem = () => {
    // Validate all required fields
    if (
      !itemId ||
      !itemName ||
      !itemBrand ||
      !itemCategory ||
      itembillPartPrice === "" ||
      itemcashPartPrice === "" ||
      !itemUnit ||
      itemQuantity === "" ||
      sUnit === "" ||
      psRatio === "" ||
      length === "" ||
      breadth === "" ||
      size === ""
    ) {
      setError("Please fill in all required fields before adding an item.");
      setShowErrorModal(true);
      return;
    }

    // Parse numerical inputs
    const parsedQuantity = parseFloat(itemQuantity);
    const parsedbillPartPrice = parseFloat(itembillPartPrice);
    const parsedcashPartPrice = parseFloat(itemcashPartPrice);
    const productLength = parseFloat(length);
    const productBreadth = parseFloat(breadth);
    const productSize = parseFloat(size);
    const productPsRatio = parseFloat(psRatio);

    // Validate numerical inputs
    if (
      isNaN(parsedQuantity) ||
      parsedQuantity <= 0 ||
      isNaN(parsedbillPartPrice) ||
      parsedbillPartPrice < 0 ||
      isNaN(parsedcashPartPrice) ||
      parsedcashPartPrice < 0 ||
      isNaN(productLength) ||
      productLength <= 0 ||
      isNaN(productBreadth) ||
      productBreadth <= 0 ||
      isNaN(productSize) ||
      productSize <= 0 ||
      isNaN(productPsRatio) ||
      productPsRatio <= 0
    ) {
      setError(
        "Please enter valid numerical values for quantity, price, and dimensions."
      );
      setShowErrorModal(true);
      return;
    }

    // Prevent duplicate items
    if (items.some((item) => item.itemId === itemId)) {
      setError("This item is already added. Please adjust the quantity instead.");
      setShowErrorModal(true);
      return;
    }

    const newItem = {
      itemId,
      name: itemName,
      brand: itemBrand,
      category: itemCategory,
      quantity: parsedQuantity,
      pUnit: itemUnit,
      billPartPrice: parsedbillPartPrice,
      cashPartPrice: parsedcashPartPrice,
      sUnit,
      psRatio: productPsRatio,
      length: productLength,
      breadth: productBreadth,
      size: productSize,
    };

    setItems([newItem, ...items]);
    clearItemFields();
    setMessage("Item added successfully!");
  };

  // Function to clear item input fields after adding
  const clearItemFields = () => {
    setItemId("");
    setItemName("");
    setItemBrand("");
    setItemCategory("");
    setItembillPartPrice("");
    setItemcashPartPrice("");
    setItemUnit("");
    setItemQuantity("");
    setSUnit("");
    setPsRatio("");
    setLength("");
    setBreadth("");
    setSize("");
  };

  // Function to handle searching for an item by ID
  const handleSearchItem = async () => {
    if (itemId.trim() === "") {
      setError("Please enter an Item ID to search.");
      setShowErrorModal(true);
      return;
    }
    try {
      setItemLoading(true);
      const { data } = await api.get(`/api/products/itemId/${itemId}`);
      if (data) {
        setItemId(data.item_id);
        setItemName(data.name);
        setItemBrand(data.brand);
        setItemCategory(data.category);
        setItembillPartPrice(data.billPartPrice);
        setItemcashPartPrice(data.cashPartPrice);
        setBreadth(data.breadth);
        setLength(data.length);
        setPsRatio(data.psRatio);
        setSize(data.size);
        setSUnit(data.sUnit);
        setItemUnit(data.pUnit);
        itemNameRef.current?.focus();
      } else {
        setError("Item not found.");
        setShowErrorModal(true);
        clearItemFields();
      }
    } catch (err) {
      setError("Error fetching item details.");
      setShowErrorModal(true);
      clearItemFields();
    } finally {
      setItemLoading(false);
    }
  };

  // Function to add a new category
  const addCategory = () => {
    const newCategory = prompt("Enter new category:");
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setMessage(`Category "${newCategory}" added successfully!`);
    }
  };

  // Function to remove an item from the list
  const removeItem = (index) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setMessage("Item removed successfully!");
    }
  };

  // Calculate Total Amounts
  const calculateTotals = () => {
    let billPartTotal = 0;
    let cashPartTotal = 0;

    items.forEach((item) => {
      billPartTotal += item.quantity * item.billPartPrice;
      cashPartTotal += item.quantity * item.cashPartPrice;
    });

    // GST rate for items is 18%
    const gstRateItems = 0.18;

    const amountWithoutGSTItems = billPartTotal / (1 + gstRateItems);
    const gstAmountItems = billPartTotal - amountWithoutGSTItems;
    const cgstItems = gstAmountItems / 2;
    const sgstItems = gstAmountItems / 2;

    // Transportation charges
    const logisticAmountValue = parseFloat(logisticAmount || 0);
    const localAmountValue = parseFloat(localAmount || 0);
    const totalTransportationCharges = logisticAmountValue + localAmountValue;

    // GST rate for transportation is 5%
    const gstRateTransport = 0.05;

    const amountWithoutGSTTransport =
      totalTransportationCharges / (1 + gstRateTransport);
    const gstAmountTransport =
      totalTransportationCharges - amountWithoutGSTTransport;
    const cgstTransport = gstAmountTransport / 2;
    const sgstTransport = gstAmountTransport / 2;

    const totalPurchaseAmount =
      billPartTotal +
      cashPartTotal;

    return {
      billPartTotal,
      cashPartTotal,
      amountWithoutGSTItems,
      gstAmountItems,
      cgstItems,
      sgstItems,
      totalTransportationCharges,
      amountWithoutGSTTransport,
      gstAmountTransport,
      cgstTransport,
      sgstTransport,
      totalPurchaseAmount,
    };
  };

  const {
    billPartTotal,
    cashPartTotal,
    amountWithoutGSTItems,
    gstAmountItems,
    cgstItems,
    sgstItems,
    totalTransportationCharges,
    amountWithoutGSTTransport,
    gstAmountTransport,
    cgstTransport,
    sgstTransport,
    totalPurchaseAmount,
  } = calculateTotals();

  // Handle Form Submission
  const submitHandler = async () => {
    setError("");

    if (!sellerName || !invoiceNo || items.length === 0 || !localBillId || !logisticBillId) {
      setError("All fields are required before submission.");
      setShowErrorModal(true);
      return;
    }
 
    // Prepare purchase data
    const purchaseData = {
      sellerId,
      sellerName,
      sellerAddress,
      sellerGst,
      invoiceNo,
      purchaseId,
      billingDate,
      invoiceDate,
      items: items.map((item) => ({
        itemId: item.itemId || itemId,
        name: item.name,
        brand: item.brand,
        category: item.category,
        quantity: item.quantity,
        pUnit: item.pUnit,
        sUnit: item.sUnit,
        psRatio: item.psRatio,
        length: item.length,
        breadth: item.breadth,
        size: item.size,
        billPartPrice: item.billPartPrice,
        cashPartPrice: item.cashPartPrice,
      })),
      totals: {
        billPartTotal,
        cashPartTotal,
        amountWithoutGSTItems,
        gstAmountItems,
        cgstItems,
        sgstItems,
        amountWithoutGSTTransport,
        gstAmountTransport,
        cgstTransport,
        sgstTransport,
        totalPurchaseAmount,
        transportationCharges: totalTransportationCharges,
      },
      transportationDetails: {
        logistic: {
          purchaseId: purchaseId,
          invoiceNo: invoiceNo,
          billId: logisticBillId,
          companyGst: logisticGst,
          transportCompanyName: logisticCompany,
          transportationCharges: logisticAmount,
          remark: logisticRemark,
        },
        local: {
          purchaseId: purchaseId,
          invoiceNo: invoiceNo,
          billId: localBillId,
          companyGst: localGst,
          transportCompanyName: localCompany,
          transportationCharges: localAmount,
          remark: localRemark,
        },
      },
    };

    try {
      setLoading(true);
      // Direct API call to update purchase
      const response = await api.put(`/api/products/purchase/${id}`, purchaseData);
      if (response.status === 200) {
        alert("Purchase updated successfully!");
        navigate("/allpurchases"); // Navigate to purchase listing page
      } else {
        setError("Error updating purchase. Please try again.");
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Error updating purchase. Please try again.");
      setShowErrorModal(true);
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key navigation between fields
  const changeRef = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  return (
    <div>
      {/* Loading Indicator */}
      {(loading || itemLoading) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-md shadow-md">
            <p className="text-sm font-bold">Loading...</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}

      {/* Top Banner */}
      <div
        className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="text-center">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Edit Purchase
          </p>
        </div>
        <i className="fa fa-edit text-gray-500 text-xl"></i>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
        {/* Step Indicator */}
        <div className="flex justify-between mb-5">
          <div className="text-left">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="mt-2 py-2 px-4 text-xs font-bold rounded-md bg-red-500 hover:bg-red-600 text-white"
              >
                Back
              </button>
            )}
          </div>
          <div className="text-right">
            {currentStep === 4 ? (
              <button
                onClick={submitHandler}
                className="py-2 font-bold px-4 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
              >
                Update
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="mt-6 text-xs py-2 px-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
              >
                Next
              </button>
            )}
            <p className="text-xs mt-1 text-gray-400">
              Please fill all fields before proceeding
            </p>
          </div>
        </div>

        {/* Total Amount Display */}
        {currentStep === 3 && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner mb-4">
            <div className="flex justify-between">
              <p className="text-xs font-bold">Bill Part Total:</p>
              <p className="text-xs">₹{billPartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">Amount without GST:</p>
              <p className="text-xs">₹{amountWithoutGSTItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">CGST (9%):</p>
              <p className="text-xs">₹{cgstItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">SGST (9%):</p>
              <p className="text-xs">₹{sgstItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Cash Part Total:</p>
              <p className="text-xs">₹{cashPartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Total Purchase Amount:</p>
              <p className="text-xs font-bold">
                ₹{totalPurchaseAmount.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div>
          <div className="space-y-8">
            {/* Step 1: Supplier Information */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Supplier Information
                </h2>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Purchase ID
                    </label>
                    <input
                      type="text"
                      placeholder="Purchase ID"
                      value={purchaseId}
                      ref={purchaseIdRef}
                      onChange={(e) => setPurchaseId(e.target.value)}
                      onKeyDown={(e) => changeRef(e, sellerNameRef)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      required
                      disabled // Purchase ID should typically be non-editable
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      ref={sellerNameRef}
                      value={sellerName}
                      placeholder="Enter Supplier Name"
                      onChange={handleSellerNameChange}
                      onKeyDown={(e) => changeRef(e, invoiceNoRef)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      required
                    />
                    {/* Suggestions Dropdown */}
                    {sellerSuggestions.length > 0 && (
                      <ul className="border border-gray-300 mt-1 rounded-md shadow-md max-h-40 overflow-y-auto">
                        {sellerSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${
                              selectedSuggestionIndex === index
                                ? "bg-gray-200"
                                : ""
                            }`}
                            onClick={() => handleSelectSeller(suggestion)}
                          >
                            {suggestion.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Seller ID */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Supplier ID
                    </label>
                    <input
                      type="text"
                      ref={sellerIdRef}
                      value={sellerId}
                      placeholder="Supplier ID"
                      onChange={(e) => setSellerId(e.target.value)}
                      onKeyDown={(e) => changeRef(e, invoiceNoRef)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md bg-gray-100 focus:outline-none text-xs"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Invoice No.
                    </label>
                    <input
                      type="text"
                      ref={invoiceNoRef}
                      value={invoiceNo}
                      placeholder="Enter invoice number"
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setCurrentStep(2);
                        }
                      }}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Supplier Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Supplier Address
                  </label>
                  <input
                    type="text"
                    ref={sellerAddressRef}
                    placeholder="Supplier Address"
                    value={sellerAddress}
                    onKeyDown={(e) => changeRef(e, sellerGstRef)}
                    onChange={(e) => setSellerAddress(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Supplier GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="Supplier GST"
                    ref={sellerGstRef}
                    value={sellerGst}
                    onKeyDown={(e) => changeRef(e, billingDateRef)}
                    onChange={(e) => setSellerGst(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Billing Date
                  </label>
                  <input
                    type="date"
                    value={billingDate}
                    ref={billingDateRef}
                    onKeyDown={(e) => changeRef(e, invoiceDateRef)}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    ref={invoiceDateRef}
                    value={invoiceDate}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setCurrentStep(3);
                    }}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Add/Edit Items */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900">Add/Edit Items</h2>
                {/* Table of Added Items */}
                {items.length > 0 && (
                  <div className="mt-6">
                    {/* Responsive Table for Desktop */}
                    <div className="overflow-x-auto hidden md:block">
                      <table className="min-w-full table-auto bg-white shadow-md rounded-md">
                        <thead>
                          <tr className="bg-red-500 text-white text-xs">
                            <th className="px-4 py-2 text-left">Item ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Brand</th>
                            <th className="px-4 py-2 text-left">Category</th>
                            <th className="px-4 py-2 text-left">Quantity</th>
                            <th className="px-4 py-2 text-left">Unit</th>
                            <th className="px-4 py-2 text-left">
                              Bill Price (₹)
                            </th>
                            <th className="px-4 py-2 text-left">
                              Cash Price (₹)
                            </th>
                            <th className="px-4 py-2 text-left">Total (₹)</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-600 text-xs">
                          {items.map((item, index) => (
                            <tr
                              key={index}
                              className={`border-b hover:bg-gray-100 ${
                                index % 2 === 0 ? "bg-gray-50" : "bg-white"
                              }`}
                            >
                              <td className="px-4 py-2">{item.itemId}</td>
                              <td className="px-4 py-2">{item.name}</td>
                              <td className="px-4 py-2">{item.brand}</td>
                              <td className="px-4 py-2">{item.category}</td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  min="1"
                                  onChange={(e) =>
                                    setItems((prevItems) =>
                                      prevItems.map((itm, idx) =>
                                        idx === index
                                          ? {
                                              ...itm,
                                              quantity: parseFloat(e.target.value),
                                            }
                                          : itm
                                      )
                                    )
                                  }
                                  className="border px-2 py-1 rounded w-16 text-xs"
                                />
                              </td>
                              <td className="px-4 py-2">{item.pUnit}</td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={item.billPartPrice}
                                  min="0"
                                  onChange={(e) =>
                                    setItems((prevItems) =>
                                      prevItems.map((itm, idx) =>
                                        idx === index
                                          ? {
                                              ...itm,
                                              billPartPrice: parseFloat(e.target.value),
                                            }
                                          : itm
                                      )
                                    )
                                  }
                                  className="border px-2 py-1 rounded w-16 text-xs"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={item.cashPartPrice}
                                  min="0"
                                  onChange={(e) =>
                                    setItems((prevItems) =>
                                      prevItems.map((itm, idx) =>
                                        idx === index
                                          ? {
                                              ...itm,
                                              cashPartPrice: parseFloat(e.target.value),
                                            }
                                          : itm
                                      )
                                    )
                                  }
                                  className="border px-2 py-1 rounded w-16 text-xs"
                                />
                              </td>
                              <td className="px-4 py-2">
                                {(
                                  item.quantity *
                                  (item.billPartPrice + item.cashPartPrice)
                                ).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Responsive Cards for Mobile */}
                    <div className="block md:hidden mt-4">
                      <div className="space-y-4">
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="bg-white shadow-lg rounded-lg p-4 border"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs font-bold">
                                {item.name} - {item.itemId}
                              </p>
                              <button
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                <i className="fa fa-trash" aria-hidden="true"></i>
                              </button>
                            </div>
                            <p className="text-xs">Brand: {item.brand}</p>
                            <p className="text-xs">Category: {item.category}</p>
                            <p className="text-xs">
                              Quantity:{" "}
                              <input
                                type="number"
                                value={item.quantity}
                                min="1"
                                onChange={(e) =>
                                  setItems((prevItems) =>
                                    prevItems.map((itm, idx) =>
                                      idx === index
                                        ? {
                                            ...itm,
                                            quantity: parseFloat(e.target.value),
                                          }
                                        : itm
                                    )
                                  )
                                }
                                className="border px-1 py-0.5 rounded w-12 text-xs"
                              />{" "}
                              {item.pUnit}
                            </p>
                            <p className="text-xs">
                              Bill Price: ₹
                              <input
                                type="number"
                                value={item.billPartPrice}
                                min="0"
                                onChange={(e) =>
                                  setItems((prevItems) =>
                                    prevItems.map((itm, idx) =>
                                      idx === index
                                        ? {
                                            ...itm,
                                            billPartPrice: parseFloat(e.target.value),
                                          }
                                        : itm
                                    )
                                  )
                                }
                                className="border px-1 py-0.5 rounded w-16 text-xs"
                              />
                            </p>
                            <p className="text-xs">
                              Cash Price: ₹
                              <input
                                type="number"
                                value={item.cashPartPrice}
                                min="0"
                                onChange={(e) =>
                                  setItems((prevItems) =>
                                    prevItems.map((itm, idx) =>
                                      idx === index
                                        ? {
                                            ...itm,
                                            cashPartPrice: parseFloat(e.target.value),
                                          }
                                        : itm
                                    )
                                  )
                                }
                                className="border px-1 py-0.5 rounded w-16 text-xs"
                              />
                            </p>
                            <p className="text-xs">
                              Total: ₹
                              {(
                                item.quantity *
                                (item.billPartPrice + item.cashPartPrice)
                              ).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Item Adding Form */}
                <div className="mt-4 space-y-4">
                  {/* Item ID and Search */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">Item ID</label>
                    <div className="flex">
                      <input
                        type="text"
                        ref={itemIdRef}
                        value={itemId}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearchItem();
                          }
                        }}
                        onChange={(e) => setItemId(e.target.value)}
                        className="w-1/2 border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSearchItem}
                        className="ml-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                      >
                        <i className="fa fa-search" />
                      </button>
                    </div>
                  </div>

                  {/* Item Name and Brand */}
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs text-gray-700 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Item Name"
                        ref={itemNameRef}
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        onKeyDown={(e) => changeRef(e, itemBrandRef)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        required
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-xs text-gray-700 mb-1">
                        Item Brand
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Item Brand"
                        ref={itemBrandRef}
                        value={itemBrand}
                        onChange={(e) => setItemBrand(e.target.value)}
                        onKeyDown={(e) => changeRef(e, itemCategoryRef)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Item Category and Add Category */}
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs text-gray-700 mb-1">
                        Item Category
                      </label>
                      <select
                        value={itemCategory}
                        ref={itemCategoryRef}
                        onChange={(e) => setItemCategory(e.target.value)}
                        onKeyDown={(e) => changeRef(e, itembillPartPriceRef)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        required
                      >
                        <option value="" disabled>
                          Select Category
                        </option>
                        {categories.map((category, index) => (
                          <option key={index} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addCategory}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-xs"
                      >
                        Add Category
                      </button>
                    </div>
                  </div>

                  {/* Item Prices */}
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs text-gray-700 mb-1">
                        Bill Part Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter Bill Part Price"
                        value={itembillPartPrice}
                        ref={itembillPartPriceRef}
                        onChange={(e) => setItembillPartPrice(e.target.value)}
                        onKeyDown={(e) => changeRef(e, itemcashPartPriceRef)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-xs text-gray-700 mb-1">
                        Cash Part Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter Cash Part Price"
                        value={itemcashPartPrice}
                        ref={itemcashPartPriceRef}
                        onChange={(e) => setItemcashPartPrice(e.target.value)}
                        onKeyDown={(e) => changeRef(e, itemUnitRef)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {/* Item Unit, Quantity, and Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">Unit</label>
                      <select
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        ref={itemUnitRef}
                        onKeyDown={(e) => changeRef(e, itemQuantityRef)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        required
                      >
                        <option value="" disabled>
                          Select Unit
                        </option>
                        <option value="SQFT">SQFT</option>
                        <option value="BOX">BOX</option>
                        <option value="NOS">NOS</option>
                        <option value="GSQFT">GSQFT</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        placeholder="Enter Quantity"
                        value={itemQuantity}
                        ref={itemQuantityRef}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addItem();
                          }
                        }}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>

                    {/* Dimensions and Ratios */}
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">
                        S Unit
                      </label>
                      <input
                        type="text"
                        placeholder="Enter S Unit"
                        value={sUnit}
                        onChange={(e) => setSUnit(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">
                        P/S Ratio
                      </label>
                      <input
                        type="number"
                        placeholder="Enter P/S Ratio"
                        value={psRatio}
                        onChange={(e) => setPsRatio(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">
                        Length (m)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter Length"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">
                        Breadth (m)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter Breadth"
                        value={breadth}
                        onChange={(e) => setBreadth(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">
                        Size (m)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter Size"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-4 bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 text-xs"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Transportation Details */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Transportation Details
                </h2>
                <div className="mt-4 space-y-6">
                  {/* Logistic Transportation */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 mb-2">
                      Logistic Transportation (National)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Company
                        </label>
                        <select
                          value={isCustomCompany ? "custom" : logisticCompany}
                          ref={logisticCompanyRef}
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            if (selectedValue === "custom") {
                              setIsCustomCompany(true);
                              setLogisticCompany("");
                            } else {
                              setIsCustomCompany(false);
                              setLogisticCompany(selectedValue);
                            }
                          }}
                          onKeyDown={(e) => changeRef(e, logisticAmountRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        >
                          <option value="" disabled>
                            Select Company
                          </option>
                          {transportCompanies.map((company, index) => (
                            <option key={index} value={company}>
                              {company}
                            </option>
                          ))}
                          <option value="custom">Add Custom Company</option>
                        </select>

                        {/* Conditional Custom Company Input */}
                        {isCustomCompany && (
                          <input
                            type="text"
                            placeholder="Enter custom company name"
                            value={logisticCompany}
                            onChange={(e) => setLogisticCompany(e.target.value)}
                            className="mt-2 w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          />
                        )}
                      </div>

                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Amount (with GST)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter Amount"
                          value={logisticAmount}
                          ref={logisticAmountRef}
                          onChange={(e) => setLogisticAmount(e.target.value)}
                          onKeyDown={(e) => changeRef(e, localCompanyRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 space-x-2">
                      <div className="w-full">
                      <label className="text-xs text-gray-700 mb-1">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Remark"
                        value={logisticGst}
                        onChange={(e) => setLogisticGst(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                      </div>

                      <div className="w-full">
                      <label className="text-xs text-gray-700 mb-1">
                        Bill Id
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Remark"
                        value={logisticBillId}
                        onChange={(e) => setLogisticBillId(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                      </div>


                      <div className="w-full">
                      <label className="text-xs text-gray-700 mb-1">
                        Remark
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Remark"
                        value={logisticRemark}
                        onChange={(e) => setLogisticRemark(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                      </div>
                    </div>
                  </div>

                  {/* Local Transportation */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 mb-2">
                      Local Transportation (In-State)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Company
                        </label>
                        <select
                          value={localCompany}
                          ref={localCompanyRef}
                          onChange={(e) => setLocalCompany(e.target.value)}
                          onKeyDown={(e) => changeRef(e, localAmountRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        >
                          <option value="" disabled>
                            Select Company
                          </option>
                          {transportCompanies.map((company, index) => (
                            <option key={index} value={company}>
                              {company}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Amount (with GST)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter Amount"
                          value={localAmount}
                          ref={localAmountRef}
                          onChange={(e) => setLocalAmount(e.target.value)}
                          onKeyDown={(e) => {}}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 space-x-2">
                      <div className="w-full">
                      <label className="text-xs text-gray-700 mb-1">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Remark"
                        value={localGst}
                        onChange={(e) => setLocalGst(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                      </div>

                      <div className="w-full">
                      <label className="text-xs text-gray-700 mb-1">
                        Bill Id
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Remark"
                        value={localBillId}
                        onChange={(e) => setLocalBillId(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                      </div>


                      <div className="w-full">
                      <label className="text-xs text-gray-700 mb-1">
                        Remark
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Remark"
                        value={localRemark}
                        onChange={(e) => setLocalRemark(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Details */}
                <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-inner">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">
                    Overall Details
                  </h3>
                  <div className="flex justify-between">
                    <p className="text-xs font-bold">Bill Part Total:</p>
                    <p className="text-xs">₹{billPartTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs">Subtotal (without GST):</p>
                    <p className="text-xs">₹{amountWithoutGSTItems.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs">CGST (9%):</p>
                    <p className="text-xs">₹{cgstItems.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs">SGST (9%):</p>
                    <p className="text-xs">₹{sgstItems.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm font-bold">Cash Part Total:</p>
                    <p className="text-xs">₹{cashPartTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm font-bold">
                      Transportation Charges:
                    </p>
                    <p className="text-xs">
                      ₹
                      {totalTransportationCharges.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm font-bold">Total Purchase Amount:</p>
                    <p className="text-xs font-bold">
                      ₹
                      {totalPurchaseAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
