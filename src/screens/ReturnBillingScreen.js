import React, { useState, useEffect } from 'react';
import Axios from 'axios';

export default function ReturnBillingScreen() {
  const [billingNos, setBillingNos] = useState([]);
  const [selectedBillingNo, setSelectedBillingNo] = useState('');
  const [returnNo, setReturnNo] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [products, setProducts] = useState([]);
  const [itemId, setItemId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0); // Step state to manage the current step

  useEffect(() => {
    const fetchBillingNos = async () => {
      try {
        const { data } = await Axios.get('/api/billing/numbers/getBillings');
        setBillingNos(data);
      } catch (err) {
        setError('Error fetching billing numbers');
      }
    };

    fetchBillingNos();
  }, []);

  const fetchSuggestions = async (query) => {
    try {
      const { data } = await Axios.get(`/api/products/search/itemId?query=${query}`);
      setSuggestions(data);
    } catch (err) {
      setError('Error fetching suggestions');
    }
  };

  useEffect(() => {
    if (itemId.length >= 2) {
      fetchSuggestions(itemId);
    } else {
      setSuggestions([]);
    }
  }, [itemId]);

  const addProductByItemId = async (product) => {
    try {
      const { data } = await Axios.get(`/api/products/itemId/${product.item_id}`);
      setSelectedProduct(data);
      setQuantity(1);
      setItemId('');
      setSuggestions([]);
    } catch (err) {
      setError('Product not found or server error.');
    }
  };

  const handleAddProductWithQuantity = () => {
    if (!selectedProduct) return;

    const productWithQuantity = { ...selectedProduct, quantity };
    setProducts([...products, productWithQuantity]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || !customerAddress || products.length === 0) {
      alert('Please fill all required fields and add at least one product.');
      return;
    }

    const returnData = {
      returnNo,
      selectedBillingNo,
      returnDate,
      customerName,
      customerAddress,
      products: products.map(({ item_id, name, price, quantity }) => ({
        item_id,
        name,
        price,
        quantity,
      })),
    };

    try {
      await Axios.post('/api/returns/create', returnData);
      alert('Return data submitted successfully!');
      // Reset all states
      setReturnNo('');
      setSelectedBillingNo('');
      setReturnDate('');
      setCustomerName('');
      setCustomerAddress('');
      setProducts([]);
      setStep(0); // Go back to first step
    } catch (error) {
      alert('There was an error submitting the return data. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Product Return</h2>
        <form onSubmit={handleReturnSubmit} className="space-y-6">
          {step === 0 && (
            <div>
              <h3 className="text-lg font-bold">Step 1: Select Billing No</h3>
              <label className="block text-gray-700">Select Billing No</label>
              <select
                value={selectedBillingNo}
                onChange={(e) => setSelectedBillingNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
              >
                <option value="">-- Select Billing No --</option>
                {billingNos.map((billing) => (
                  <option key={billing._id} value={billing.invoiceNo}>
                    {billing.invoiceNo}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md"
              >
                Next
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 className="text-lg font-bold">Step 2: Enter Return Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700">Return No</label>
                  <input
                    type="text"
                    value={returnNo}
                    onChange={(e) => setReturnNo(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none"
                    placeholder="Enter Return No"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-bold">Step 3: Customer Information</h3>
              <div>
                <label className="block text-gray-700">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none"
                  placeholder="Enter Customer Name"
                />
              </div>
              <div>
                <label className="block text-gray-700">Customer Address</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none"
                  placeholder="Enter Customer Address"
                />
              </div>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md"
              >
                Next
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-bold">Step 4: Add Products for Return</h3>
              <div>
                <label className="block text-gray-700">Item ID</label>
                <input
                  type="text"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none"
                  placeholder="Enter Item ID"
                />
                {error && <p className="text-red-500">{error}</p>}
                <div className="mt-2">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.item_id}
                      onClick={() => addProductByItemId(suggestion)}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                    >
                      {suggestion.name} - {suggestion.item_id}
                    </div>
                  ))}
                </div>
              </div>
              {selectedProduct && (
                <div className="mb-4">
                  <h3 className="text-lg font-bold">Selected Product: {selectedProduct.name}</h3>
                  <label className="block text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none"
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={handleAddProductWithQuantity}
                    className="mt-2 bg-blue-500 text-white py-2 px-4 rounded-md"
                  >
                    Add Product with Quantity
                  </button>
                </div>
              )}
              {products.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2">Added Products</h3>
                  <ul className="list-disc ml-5">
                    {products.map((product, index) => (
                      <li key={index} className="flex justify-between items-center">
                        {product.name} - Quantity: {product.quantity}
                        <button
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={handleReturnSubmit}
                className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md"
              >
                Submit Return
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
