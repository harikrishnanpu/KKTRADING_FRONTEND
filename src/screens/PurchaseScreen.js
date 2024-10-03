import React, { useState } from 'react';
import Axios from 'axios';
import { useDispatch } from 'react-redux';
import { createPurchase } from '../actions/productActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';

export default function PurchasePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sellerName, setSellerName] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [items, setItems] = useState([{ itemId: '', name: '', quantity: '', isExisting: false }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [itemFound, setItemFound] = useState(true); // Track if item is found

  const dispatch = useDispatch();

  const addItem = () => {
    setItems([...items, { itemId: '', name: '', quantity: '', isExisting: false }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSearchItem = async (index) => {
    const itemId = items[index].itemId;
    if (!itemId) return;

    try {
      setLoading(true);
      const { data } = await Axios.get(`/api/products/itemId/${itemId}`);
      const newItems = [...items];
      if (data) {
        newItems[index] = {
          itemId: data.item_id,
          name: data.name,
          brand: data.brand,
          category: data.category,
          quantity: newItems[index].quantity || 1,
          isExisting: true,
        };
        setItemFound(true);
      } else {
        newItems[index].isExisting = false;
        setItemFound(false);
        setError('Item not found');
      }

      setItems(newItems);
      setLoading(false);
    } catch (err) {
      setError('Error fetching item');
      setLoading(false);
    }
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const purchaseData = {
      sellerName,
      sellerId,
      invoiceNo,
      items,
    };
    dispatch(createPurchase(purchaseData));
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
      {loading && <LoadingBox />}
      {error && <MessageBox variant="danger">{error}</MessageBox>}
      <form onSubmit={submitHandler} className="space-y-8">
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900">Seller Information</h2>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600">Seller Name</label>
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
                <label className="mb-1 text-sm text-gray-600">Invoice No.</label>
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
              onClick={nextStep}
              className="mt-6 w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
            >
              Next
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900">Item Details</h2>
            <div className="mt-4 space-y-6">
              {items.map((item, index) => (
                <div key={index} className="flex items-center flex-wrap space-x-4">
                  <div className="w-full md:w-1/4">
                    <label className="mb-1 text-sm text-gray-600">Item ID</label>
                    <input
                      type="text"
                      value={item.itemId}
                      onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                      className="w-full border px-3 py-2 rounded-md"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSearchItem(index)}
                    className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Search
                  </button>

                  {item.isExisting ? (
                    <>
                      <div className="w-full md:w-1/4">
                        <label className="mb-1 text-sm text-gray-600">Item Name</label>
                        <input type="text" value={item.name} disabled className="w-full border px-3 py-2 rounded-md" />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="mb-1 text-sm text-gray-600">Brand</label>
                        <input type="text" value={item.brand} disabled className="w-full border px-3 py-2 rounded-md" />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="mb-1 text-sm text-gray-600">Category</label>
                        <input type="text" value={item.category} disabled className="w-full border px-3 py-2 rounded-md" />
                      </div>
                      <button
                        type="button"
                        onClick={() => addItem()}
                        className="mt-2 px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add Item
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-full md:w-1/4">
                        <label className="mb-1 text-sm text-gray-600">Item Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="w-full border px-3 py-2 rounded-md"
                          required
                        />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="mb-1 text-sm text-gray-600">Brand</label>
                        <input
                          type="text"
                          value={item.brand}
                          onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                          className="w-full border px-3 py-2 rounded-md"
                          required
                        />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="mb-1 text-sm text-gray-600">Category</label>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          className="w-full border px-3 py-2 rounded-md"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="w-full md:w-1/4">
                    <label className="mb-1 text-sm text-gray-600">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full border px-3 py-2 rounded-md"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className={`mt-6 w-full py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 ${itemFound ? '' : 'hidden'}`}
              >
                Add Another Item
              </button>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-full inline-flex justify-center py-2 px-4 mr-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Displaying the added items below */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Added Items</h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 bg-gray-100 rounded-md flex justify-between items-center">
              <div>
                <p><strong>Item ID:</strong> {item.itemId}</p>
                <p><strong>Name:</strong> {item.name}</p>
                <p><strong>Brand:</strong> {item.brand}</p>
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Quantity:</strong> {item.quantity}</p>
              </div>
              <button
                onClick={() => removeItem(index)}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
