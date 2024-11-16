import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { createPurchase } from "../actions/productActions";
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function PurchasePage() {
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
  const [billingDate, setBillingDate] = useState(new Date().toISOString().substring(0, 10));
  const [invoiceDate, setInvoiceDate] = useState('');

  const [sUnit, setSUnit] = useState('');
  const [psRatio, setPsRatio] = useState('');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [size, setSize] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [message, error]);

  useEffect(() => {
    if (currentStep === 1) {
      purchaseIdRef.current?.focus();
    } else if (currentStep === 2) {
      sellerAddressRef.current?.focus();
    } else if (currentStep === 3) {
      itemIdRef.current?.focus();
    }
  }, [currentStep]);

  useEffect(() => {
    // Fetch categories from previous purchase bills
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/api/billing/purchases/categories');
        setCategories(data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleSellerNameChange = async (e) => {
    const value = e.target.value;
    setSellerName(value);
    try {
      const { data } = await api.get(`/api/billing/purchases/suggestions?q=${value}`);
      setSellerSuggestions(data.suggestions);
    } catch (err) {
      setError("Error fetching seller suggestions");
    }
  };

  const addItem = () => {
    if (!itemId || !itemBrand || !itemCategory || !itemPrice || !itemUnit) {
      setError("Please fill in all required fields");
      return;
    }

    const productLength = parseFloat(length || 0);
    const productBreadth = parseFloat(breadth || 0);
    const productSize = parseFloat(size || 0);
    const productPsRatio = parseFloat(psRatio || 0);
  
    let adjustedQuantity =  parseFloat(itemQuantity);
    const parsedQuantity = parseFloat(itemQuantity);
    let adjustedSellingPrice = parseFloat(itemPrice);
    let parsedSellingPrice = parseFloat(itemPrice);
  
    // Calculate Adjusted Quantity and Selling Price based on the Unit
    if (itemUnit === 'SQFT' && productLength && productBreadth) {
      const area = productLength * productBreadth;
      if (area > 0) {
        adjustedQuantity = parsedQuantity / area;
        adjustedSellingPrice = parsedSellingPrice * area;
      }
    } else if (itemUnit === 'BOX' && productSize && productPsRatio && productLength && productBreadth) {
      const areaPerBox = productLength * productBreadth;
      adjustedQuantity = parsedQuantity * productPsRatio;
      adjustedSellingPrice = parsedSellingPrice * areaPerBox;
    } else if (itemUnit === 'TNOS' && productLength && productBreadth) {
      const areaPerTnos = productLength * productBreadth;
      adjustedSellingPrice = parsedSellingPrice * areaPerTnos;
    } 



    const newItem = {
      itemId,
      name: itemName,
      quantity: adjustedQuantity,
      pUnit: itemUnit,
      brand: itemBrand,
      category: itemCategory,
      price: adjustedSellingPrice,
      sUnit,
      psRatio,
      length,
      breadth,
      size,
    };

    setItems([...items, newItem]);
    clearItemFields();
    setMessage("Item added successfully!");
    itemIdRef.current?.focus();
  };

  const clearItemFields = () => {
    setItemId("");
    setItemName("");
    setItemQuantity("");
    setItemUnit("");
    setItemBrand("");
    setItemCategory("");
    setItemPrice("");
    setSUnit("");
    setPsRatio("");
    setLength("");
    setBreadth("");
    setSize("");
  };

  const handleSearchItem = async () => {
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
        setError("Item not found");
        clearItemFields();
        setItemId(itemId);
      }
    } catch (err) {
      setError("Error fetching item");
      clearItemFields();
      setItemId(itemId);
    } finally {
      setItemLoading(false);
    }
  };

  const addCategory = () => {
    const newCategory = prompt("Enter new category:");
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setMessage("Item removed successfully!");
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (!sellerName || !invoiceNo || items.length === 0) {
      setError("All Fields Are Required");
    } else {
      const purchaseData = {
        sellerName,
        invoiceNo,
        items,
        purchaseId,
        sellerAddress,
        sellerGst,
        billingDate,
        invoiceDate,
      };
      setLoading(true);
      try {
        await dispatch(createPurchase(purchaseData));
        setMessage("Purchase Submitted Successfully");
        navigate("/"); // Redirect to home on successful purchase
      } catch (error) {
        setError("Error submitting purchase");
      } finally {
        setLoading(false);
      }
    }
  };

  const changeRef = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  return (
    <div>
      {(loading || itemLoading) && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-md shadow-md">
            <p>Loading...</p>
          </div>
        </div>
      )}

      {(error || message) && (
        <div className={`fixed top-0 left-0 w-full z-50 p-4 ${error ? "bg-red-500" : "bg-green-500"} text-white`}>
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
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => { navigate('/'); }} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Purchase Billing and Opening Stock</p>
        </div>
        <i className="fa fa-shopping-cart text-gray-500" />
      </div>

      <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
        <div className="flex justify-between mb-5">
          <div className="text-left">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="mt-2 w-full py-2 px-4 text-xs font-bold rounded-md bg-red-500 hover:bg-red-600 text-white"
              >
                Back
              </button>
            )}
          </div>
          <div className="text-right">
            <button
              onClick={submitHandler}
              className="py-2 font-bold px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Submit
            </button>
            <p className="text-xs mt-1 text-gray-400">
              Please click submit only after all fields are filled
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-sm font-bold text-gray-900">Supplier Information</h2>
              <div className="mt-4 space-y-4">

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">Purchase Id</label>

                  <input
                    type="text"
                    placeholder="Purchase ID"
                    value={purchaseId}
                    ref={purchaseIdRef}
                    onChange={(e) => setPurchaseId(e.target.value)}
                    onKeyDown={(e) => changeRef(e, sellerNameRef)}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />

                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xs text-gray-700">Supplier Name</label>
                  <input
                    type="text"
                    ref={sellerNameRef}
                    value={sellerName}
                    placeholder="Enter Supplier Name"
                    onChange={handleSellerNameChange}
                    onKeyDown={(e) => changeRef(e, invoiceNoRef)}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                  {sellerSuggestions.length > 0 && (
                    <ul className="border border-gray-300 mt-2 rounded-md shadow-md">
                      {sellerSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedSuggestionIndex === index ? "bg-gray-200" : ""}`}
                          onClick={() => {
                            setSellerName(suggestion);
                            setSellerSuggestions([]);
                          }}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xs text-gray-700">Invoice No.</label>
                  <input
                    type="text"
                    ref={invoiceNoRef}
                    value={invoiceNo}
                    placeholder="Enter invoice number"
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setCurrentStep(2)
                      }
                    }}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>

              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={currentStep === 1}
                  className="mt-6 text-xs py-2 px-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
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

          {currentStep === 2 && (

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs mb-1 text-gray-700">Supplier Address</label>
                <input
                  type="text"
                  ref={sellerAddressRef}
                  placeholder="Seller Address"
                  value={sellerAddress}
                  onKeyDown={(e) => changeRef(e, sellerGstRef)}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs mb-1 text-gray-700">Supplier GSTIN</label>

                <input
                  type="text"
                  placeholder="Seller GST"
                  ref={sellerGstRef}
                  value={sellerGst}
                  onKeyDown={(e) => changeRef(e, billingDateRef)}
                  onChange={(e) => setSellerGst(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
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
                  className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs mb-1 text-gray-700">Invoice Date</label>
                <input
                  type="date"
                  ref={invoiceDateRef}
                  value={invoiceDate}
                  onKeyDown={(e) => { if (e.key === "Enter") setCurrentStep(3); }}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                />
              </div>

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

          {currentStep === 3 && (
            <div>
              <h2 className="text-sm font-bold text-gray-900">Add Item</h2>
              <div className="mt-4 space-y-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-xs text-gray-700">Item ID</label>
                  <div className="flex">
                    <input
                      type="text"
                      ref={itemIdRef}
                      value={itemId}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchItem()
                        }
                      }}
                      onChange={(e) => setItemId(e.target.value)}
                      className="w-1/2 border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSearchItem}
                      className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <i className="fa fa-search" />
                    </button>
                  </div>
                </div>

                <div className="flex">
                  <input
                    type="text"
                    placeholder="Item Name"
                    ref={itemNameRef}
                    value={itemName}
                    onKeyDown={(e) => changeRef(e, itemBrandRef)}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-1/2 border mr-2 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    ref={itemBrandRef}
                    onKeyDown={(e) => changeRef(e, itemCategoryRef)}
                    placeholder="Item Brand"
                    value={itemBrand}
                    onChange={(e) => setItemBrand(e.target.value)}
                    className="w-1/2 border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex">
                  <select
                    ref={itemCategoryRef}
                    onKeyDown={(e) => changeRef(e, itemPriceRef)}
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full mr-2 border px-3 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
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
                  <button
                    type="button"
                    onClick={addCategory}
                    className="ml-2 font-bold px-2 py-1 text-xs  bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Add Category
                  </button>
                </div>

                <div className="flex">
                  <input
                    type="text"
                    ref={itemPriceRef}
                    onKeyDown={(e) => changeRef(e, itemQuantityRef)}
                    value={itemPrice}
                    placeholder="Price"
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid-cols-2 grid gap-2">

                  <div className="form-group">
                    <label className="text-xs text-gray-500">S Unit</label>
                    <input
                      type="text"
                      className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      value={sUnit}
                      onChange={(e) => setSUnit(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="text-xs text-gray-500">P S Ratio</label>
                    <input
                      type="text"
                      className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      value={psRatio}
                      onChange={(e) => setPsRatio(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="text-xs text-gray-500">Length</label>
                    <input
                      type="text"
                      className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="text-xs text-gray-500">Breadth</label>
                    <input
                      type="text"
                      className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      value={breadth}
                      onChange={(e) => setBreadth(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="text-xs text-gray-500">Size</label>
                    <input
                      type="text"
                      className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    />
                  </div>

                </div>

                <div className="flex items-center">
                  <input
                    type="number"
                    ref={itemQuantityRef}
                    placeholder="Quantity"
                    value={itemQuantity}
                    onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    min="1"
                    required
                  />
                  <select
                    ref={itemUnitRef}
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="ml-2 px-3 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="">Punit</option>
                    <option value="GSQFT">Granite SqFt</option>
                    <option value="SQFT">SQFT</option>
                    <option value="BOX">BOX</option>
                    <option value="NOS">NOS</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => addItem()}
                  className="mt-6 w-full py-2 px-4 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700"
                >
                  Add Item
                </button>
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-bold text-gray-500">Added Items</h2>
                <div className="overflow-x-auto hidden md:block">
                  <table className="min-w-full overflow-x-auto table-auto bg-white shadow-md rounded-md mt-4">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Item ID</th>
                        <th className="py-3 px-6 text-left">Name</th>
                        <th className="py-3 px-6 text-left">Quantity</th>
                        <th className="py-3 px-6 text-left">Price</th>
                        <th className="py-3 px-6 text-left">Category</th>
                        <th className="py-3 px-6 text-left">PsRatio</th>
                        <th className="py-3 px-6 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                      {items.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 hover:bg-gray-100"
                        >
                          <td className="py-3 px-6">{item.itemId}</td>
                          <td className="py-3 px-6">{item.name}</td>
                          <td className="py-3 px-6">{item.quantity} NOS</td>
                          <td className="py-3 px-6">{item.price}</td>
                          <td className="py-3 px-6">{item.category}</td>
                          <td className="py-3 px-6">{item.psRatio}</td>
                          <td className="py-3 px-6">
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="block md:hidden">
                  <div className="grid grid-cols-1 mt-2 gap-4 sm:grid-cols-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white mt-2 shadow-lg rounded-lg p-6 border"
                      >
                        <p className="text-sm font-bold mb-2">
                          Name: {item.name}
                        </p>
                        <p className="text-xs mb-2">Item Id: {item.itemId}</p>
                        <p className="text-xs mb-2">Quantity: {item.quantity} NOS</p>
                        <p className="text-xs mb-2">Price: {item.price} / Nos</p>
                        <p className="text-xs mb-2">Brand: {item.brand}</p>
                        <p className="text-xs mb-2">Category: {item.category}</p>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
