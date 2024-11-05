import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { createPurchase } from "../actions/productActions";
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function PurchasePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sellerName, setSellerName] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemBrand, setItemBrand] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Refs for input fields to enable Enter navigation
  const sellerNameRef = useRef();
  const sellerIdRef = useRef();
  const invoiceNoRef = useRef();
  const itemIdRef = useRef();
  const itemQuantityRef = useRef();

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
      sellerNameRef.current?.focus();
    } else if (currentStep === 2) {
      itemIdRef.current?.focus();
    }
  }, [currentStep]);

  const addItem = () => {
    if (!itemId || !itemQuantity || !itemBrand || !itemCategory || !itemPrice) {
      setError("Please fill in all fields");
      return;
    }

    const newItem = {
      itemId,
      name: itemName,
      quantity: itemQuantity,
      brand: itemBrand,
      category: itemCategory,
      price: itemPrice,
    };

    setItems([...items, newItem]);
    setItemQuantity(0);
    clearItemFields();
    setError("");
    itemIdRef.current?.focus();
    setMessage("Item added successfully!");
  };

  const clearItemFields = () => {
    setItemId("");
    setItemName("");
    setItemQuantity(0);
    setItemBrand("");
    setItemCategory("");
    setItemPrice("");
  };

  const handleSearchItem = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/products/itemId/${itemId}`);
      if (data) {
        setItemName(data.name);
        setItemBrand(data.brand);
        setItemCategory(data.category);
        setItemPrice(data.price);
        itemQuantityRef.current.focus();
        setLoading(false);
      } else {
        setError("Item not found");
        setItemQuantity(0);
        clearItemFields();
        setItemId(itemId);
        setLoading(false);
      }
    } catch (err) {
      setError("Error fetching item");
      setItemQuantity(0);
      clearItemFields();
      setItemId(itemId);
      setLoading(false);
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

    if (!sellerName || !sellerId || !invoiceNo || items.length === 0) {
      setError("All Fields Are Required");
    } else {
      const purchaseData = {
        sellerName,
        sellerId,
        invoiceNo,
        items,
      };
      try {
        dispatch(createPurchase(purchaseData));
        setMessage("Purchase Submitted Successfully");
        alert("Purchase Submitted Successfully");
        navigate("/"); // Redirect to home on successful purchase
      } catch (error) {
        setError("Error submitting purchase");
      }
    }
  };

  const handleSuggestionKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selectedItem = items[selectedSuggestionIndex];
      setItemId(selectedItem.itemId);
      handleSearchItem();
      setSelectedSuggestionIndex(-1); // Reset index after selecting
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
      {loading && (
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
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Purchase Billing and Opening Stock</p>
  </div>
  <i className="fa fa-truck text-gray-500" />
</div>

      <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">

        <div className="flex justify-between mb-5">
          <div className="text-left">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`mt-2 w-full py-2 px-4 text-sm font-bold rounded-md ${currentStep === 2 ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 cursor-not-allowed text-gray-700'}`}
            >
              Back
            </button>
          </div>

          <div className="text-right">
            <button
              onClick={submitHandler}
              className="py-2 font-bold px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Submit
            </button>
            <p className="text-xs mt-1 text-gray-400">
              Please click submit only all fields are filled
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-sm font-bold text-gray-900">Seller Information</h2>
              <div className="mt-4 space-y-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-xs text-gray-700">Seller Name</label>
                  <input
                    type="text"
                    ref={sellerNameRef}
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    onKeyDown={(e) => changeRef(e, sellerIdRef)}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xs text-gray-700">Seller ID</label>
                  <input
                    type="text"
                    ref={sellerIdRef}
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                    onKeyDown={(e) => changeRef(e, invoiceNoRef)}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xs text-gray-700">Invoice No.</label>
                  <input
                    type="text"
                    ref={invoiceNoRef}
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    onKeyDown={(e) => { 
                      if(e.key === 'Enter') {
                         setCurrentStep(2) }
                         }}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="mt-6 w-1/3 py-2 px-4 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700"
              >
                Next
              </button>
            </div>
          )}

          {currentStep === 2 && (
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
                      onKeyDown={(e) =>{
                        if(e.key === 'Enter'){
                         handleSearchItem(e)
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
                      Search
                    </button>
                  </div>
                </div>

                <div className="flex">
                  <input
                    type="text"
                    placeholder="Item Name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-1/2 border mr-2 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Item Brand"
                    value={itemBrand}
                    onChange={(e) => setItemBrand(e.target.value)}
                    className="w-1/2 border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex">
                  <input
                    type="text"
                    value={itemCategory}
                    placeholder="Category"
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full mr-2 border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={itemPrice}
                    placeholder="Price"
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full border px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col">
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
                  <table className="min-w-full table-auto bg-white shadow-md rounded-md mt-4">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Item ID</th>
                        <th className="py-3 px-6 text-left">Name</th>
                        <th className="py-3 px-6 text-left">Quantity</th>
                        <th className="py-3 px-6 text-left">Price</th>
                        <th className="py-3 px-6 text-left">Brand</th>
                        <th className="py-3 px-6 text-left">Category</th>
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
                          <td className="py-3 px-6">{item.quantity}</td>
                          <td className="py-3 px-6">{item.price}</td>
                          <td className="py-3 px-6">{item.brand}</td>
                          <td className="py-3 px-6">{item.category}</td>
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
                        key={item._id}
                        className="bg-white mt-2 shadow-lg rounded-lg p-6 border"
                      >
                        <p className="text-sm font-bold mb-2">
                          Name: {item.name}
                        </p>
                        <p className="text-xs mb-2">Item Id: {item.itemId}</p>
                        <p className="text-xs mb-2">Quantity: {item.quantity}</p>
                        <p className="text-xs mb-2">Price: {item.price}</p>
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