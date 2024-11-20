// src/screens/EditPurchaseScreen.js

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";
import ErrorModal from "../components/ErrorModal"; // Ensure this component exists
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function EditPurchaseScreen() {
  const dispatch = null; // Not using Redux actions
  const navigate = useNavigate();
  const { id } = useParams(); // Purchase ID from URL

  // State Variables
  const [currentStep, setCurrentStep] = useState(1);
  const [sellerName, setSellerName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemBrand, setItemBrand] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [sellerSuggestions, setSellerSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerGst, setSellerGst] = useState("");
  const [purchaseId, setPurchaseId] = useState("");
  const [billingDate, setBillingDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [invoiceDate, setInvoiceDate] = useState("");

  const [sUnit, setSUnit] = useState("");
  const [psRatio, setPsRatio] = useState("");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [size, setSize] = useState("");

  const [showErrorModal, setShowErrorModal] = useState(false);

  // Refs for input fields to enable Enter navigation
  const sellerNameRef = useRef();
  const purchaseIdRef = useRef();
  const billingDateRef = useRef();
  const invoiceDateRef = useRef();
  const sellerAddressRef = useRef();
  const sellerGstRef = useRef();
  const invoiceNoRef = useRef();
  const itemIdRef = useRef();
  const itemQuantityRef = useRef();
  const itemNameRef = useRef();
  const itemUnitRef = useRef();
  const itemBrandRef = useRef();
  const itemCategoryRef = useRef();
  const itemPriceRef = useRef();

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

  // Fetch categories and purchase details on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/api/billing/purchases/categories");
        setCategories(data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
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
        setSellerName(data.sellerName);
        setInvoiceNo(data.invoiceNo);
        setPurchaseId(data._id);
        setSellerAddress(data.sellerAddress);
        setSellerGst(data.sellerGst);
        setBillingDate(
          data.billingDate
            ? new Date(data.billingDate).toISOString().substring(0, 10)
            : new Date().toISOString().substring(0, 10)
        );
        setInvoiceDate(
          data.invoiceDate
            ? new Date(data.invoiceDate).toISOString().substring(0, 10)
            : ""
        );
        setItems(data.items || []);
      } catch (err) {
        setError("Error fetching purchase details.");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchPurchaseDetails();
  }, [id]);

  // Handle Seller Name change with suggestions
  const handleSellerNameChange = async (e) => {
    const value = e.target.value;
    setSellerName(value);
    if (value.trim() === "") {
      setSellerSuggestions([]);
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

  // Function to handle adding items with consistent calculations
  const addItem = () => {
    // Validate all required fields
    if (
      !itemId ||
      !itemName ||
      !itemBrand ||
      !itemCategory ||
      !itemPrice ||
      !itemUnit ||
      !itemQuantity ||
      !sUnit ||
      !psRatio ||
      !length ||
      !breadth ||
      !size
    ) {
      setError("Please fill in all required fields before adding an item.");
      setShowErrorModal(true);
      return;
    }

    // Parse numerical inputs
    const parsedQuantity = parseFloat(itemQuantity);
    const parsedPrice = parseFloat(itemPrice);
    const productLength = parseFloat(length);
    const productBreadth = parseFloat(breadth);
    const productSize = parseFloat(size);
    const productPsRatio = parseFloat(psRatio);

    // Validate numerical inputs
    if (
      isNaN(parsedQuantity) ||
      parsedQuantity <= 0 ||
      isNaN(parsedPrice) ||
      parsedPrice <= 0 ||
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
      quantity: parsedQuantity,
      unit: itemUnit,
      price: parsedPrice,
      sUnit,
      psRatio,
      length,
      breadth,
      size,
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
    setItemPrice("");
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
        setItemPrice(data.price);
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

  // Calculate Total Amount
  const calculateTotalAmount = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  };

  // GST Calculations (Assuming 18% GST split into CGST and SGST)
  const totalAmount = calculateTotalAmount();
  const amountWithoutGST = totalAmount / 1.18;
  const gstAmount = totalAmount - amountWithoutGST;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  // Handle Form Submission
  const submitHandler = async () => {
    setError("");

    if (!sellerName || !invoiceNo || items.length === 0) {
      setError("All fields are required before submission.");
      setShowErrorModal(true);
      return;
    }

    // Prepare purchase data
    const purchaseData = {
      sellerName,
      invoiceNo,
      items: items.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        brand: item.brand,
        category: item.category,
        quantity: item.quantity,
        pUnit: item.unit,
        price: item.price,
        sUnit: item.sUnit,
        psRatio: item.psRatio,
        length: item.length,
        breadth: item.breadth,
        size: item.size,
      })),
      sellerAddress,
      sellerGst,
      billingDate,
      invoiceDate,
      totalAmount,
    };

    try {
      setLoading(true);
      // Direct API call to update purchase
      const response = await api.put(`/api/orders/purchase/${id}`, purchaseData);
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

      {/* Notifications */}
      {(error || message) && (
        <div
          className={`fixed top-0 left-0 w-full z-50 p-4 ${
            error ? "bg-red-500" : "bg-green-500"
          } text-white`}
        >
          <div className="flex justify-between items-center">
            <span>{error || message}</span>
            <button
              className="text-xl font-bold"
              onClick={() => {
                setError("");
                setMessage("");
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div
        className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="text-center">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Purchase Updation And Submission
          </p>
        </div>
        <i className="fa fa-list text-gray-500" />
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
            <button
              onClick={submitHandler}
              className="py-2 font-bold px-4 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
            >
              Submit
            </button>
            <p className="text-xs mt-1 text-gray-400">
              Please click submit only after all fields are filled
            </p>
          </div>
        </div>

        {/* Total Amount Display */}
        {currentStep === 3 && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner mb-4">
            <div className="flex justify-between">
              <p className="text-xs">Subtotal (without GST):</p>
              <p className="text-xs">₹{amountWithoutGST.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">CGST (9%):</p>
              <p className="text-xs">₹{cgst.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">SGST (9%):</p>
              <p className="text-xs">₹{sgst.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Total Amount (with GST):</p>
              <p className="text-xs font-bold">₹{totalAmount.toFixed(2)}</p>
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
                            onClick={() => {
                              setSellerName(suggestion);
                              setSellerSuggestions([]);
                              invoiceNoRef.current?.focus();
                            }}
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
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

                {/* Step Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    disabled={currentStep === 1}
                    className={`mt-6 text-xs py-2 px-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 disabled:bg-gray-300 cursor-not-allowed`}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="mt-6 text-xs py-2 px-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
                  >
                    Next
                  </button>
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
                    placeholder="Seller Address"
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
                    placeholder="Seller GST"
                    ref={sellerGstRef}
                    value={sellerGst}
                    onKeyDown={(e) => changeRef(e, billingDateRef)}
                    onChange={(e) => setSellerGst(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">Billing Date</label>
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
                  <label className="text-xs mb-1 text-gray-700">Invoice Date</label>
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

                {/* Step Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="mt-6 text-xs py-2 px-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="mt-6 text-xs py-2 px-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Add/Edit Items */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900">Add/Edit Item</h2>
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
                            e.preventDefault();
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
                        onKeyDown={(e) => changeRef(e, itemPriceRef)}
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

                  {/* Item Price */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Price"
                      value={itemPrice}
                      ref={itemPriceRef}
                      onChange={(e) => setItemPrice(e.target.value)}
                      onKeyDown={(e) => changeRef(e, itemQuantityRef)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Item Unit, Quantity, and Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">Unit</label>
                      <select
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        ref={itemUnitRef}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        required
                      >
                        <option value="" disabled>
                          Select Unit
                        </option>
                        <option value="SQFT">SQFT</option>
                        <option value="BOX">BOX</option>
                        <option value="TNOS">TNOS</option>
                        <option value="NOS">NOS</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        placeholder="Enter Quantity"
                        value={itemQuantity}
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
                      <label className="text-xs text-gray-700 mb-1">S Unit</label>
                      <input
                        type="text"
                        placeholder="Enter S Unit"
                        value={sUnit}
                        onChange={(e) => setSUnit(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-700 mb-1">P/S Ratio</label>
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
                      <label className="text-xs text-gray-700 mb-1">Length (m)</label>
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
                      <label className="text-xs text-gray-700 mb-1">Breadth (m)</label>
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
                      <label className="text-xs text-gray-700 mb-1">Size (m)</label>
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

                {/* Add Item Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-4 bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 text-xs"
                  >
                    Add Item
                  </button>
                </div>

                {/* Added Items Section */}
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
                            <th className="px-4 py-2 text-left">Price (₹)</th>
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
                                              quantity: parseFloat(
                                                e.target.value
                                              ),
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
                                ₹{item.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-2">
                                ₹{(item.quantity * item.price).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  <i
                                    className="fa fa-trash"
                                    aria-hidden="true"
                                  ></i>
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
                                <i
                                  className="fa fa-trash"
                                  aria-hidden="true"
                                ></i>
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
                                            quantity: parseFloat(
                                              e.target.value
                                            ),
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
                              Price: ₹{item.price.toFixed(2)}
                            </p>
                            <p className="text-xs">
                              Total: ₹{(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    );
}
