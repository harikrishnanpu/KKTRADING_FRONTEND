import React, { useState } from "react";
import Axios from "axios";
import { useDispatch } from "react-redux";
import { createPurchase } from "../actions/productActions";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { useNavigate } from "react-router-dom";

export default function PurchasePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sellerName, setSellerName] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemBrand, setItemBrand] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    clearItemFields();
    setError("");
  };

  const clearItemFields = () => {
    setItemId("");
    setItemName("");
    setItemQuantity("");
    setItemBrand("");
    setItemCategory("");
    setItemPrice("");
  };

  const handleSearchItem = async () => {
    try {
      setLoading(true);
      const { data } = await Axios.get(`/api/products/itemId/${itemId}`);
      if (data) {
        setItemName(data.name);
        setItemBrand(data.brand);
        setItemCategory(data.category);
        setItemPrice(data.price);
      } else {
        setError("Item not found");
      }
      setLoading(false);
    } catch (err) {
      setError("Error fetching item");
      setLoading(false);
    }
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (!sellerName || !sellerId || !invoiceNo || items.length == 0) {
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
        window.confirm("Purchase Submitted Successfully");
        navigate("/allpurchases"); // Redirect to home on successful purchase
      } catch (error) {
        setError("Error submitting purchase");
      }
    }
  };

  return (
    <div>


      <div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>

    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
      {loading && <LoadingBox />}
      {error && <MessageBox variant="danger">{error}</MessageBox>}

      <h1 className="text-lg font-semibold">Purchase Bill Form</h1>

<div className="flex justify-between mb-5">

       <div className="text-left">
        <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`mt-2 w-full py-2 px-4  text-sm font-bold rounded-md ${currentStep == 2 ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 cursor-not-allowed text-gray-700'}`}
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

      <form onSubmit={submitHandler} className="space-y-8">
        {currentStep === 1 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Seller Information
            </h2>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600">
                  Seller Name
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600">Seller ID</label>
                <input
                  type="text"
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600">
                  Invoice No.
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
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
                <label className="mb-1 text-sm text-gray-600">Item ID</label>
                <div className="flex">
                  <input
                    type="text"
                    value={itemId}
                    onKeyDown={(e) => {
                      if (e.key == "Enter") handleSearchItem();
                    }}
                    onChange={(e) => setItemId(e.target.value)}
                    className="w-1/2 border px-3 py-2 rounded-md"
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

              <div className="flex flex-col"></div>

              <div className="flex">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-1/2 border mr-2 px-3 py-2 rounded-md"
                  required
                />

                <input
                  type="text"
                  placeholder="Item Brand"
                  value={itemBrand}
                  onChange={(e) => setItemBrand(e.target.value)}
                  className="w-1/2 border px-3 py-2 rounded-md"
                  required
                />
              </div>

              <div className="flex">
                <input
                  type="text"
                  value={itemCategory}
                  placeholder="Category"
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full mr-2 border px-3 py-2 rounded-md"
                  required
                />

                <input
                  type="text"
                  value={itemPrice}
                  placeholder="Price"
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="flex flex-col">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <button
                type="button"
                onClick={addItem}
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

              {/* Responsive: Cards for small screens, Table for large screens */}
              <div className="block md:hidden">
                {/* Cards for Small Screens */}
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
      </form>
    </div>
    </div>
  );
}
