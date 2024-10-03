import React, { useState, useEffect } from 'react';
import Axios from 'axios';

export default function BillingScreen() {
  // Billing Information
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [salesmanName, setSalesmanName] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Product Information
  const [itemId, setItemId] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // To store the product being added
  const [quantity, setQuantity] = useState(1); // State for quantity after selecting a product

  // Stepper Control
  const [step, setStep] = useState(1);

  // Fetch suggestions for Item ID
  const fetchSuggestions = async (query) => {
    try {
      const { data } = await Axios.get(`/api/products/search/itemId?query=${query}`);
      setSuggestions(data);
    } catch (err) {
      setSuggestions([]);
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

  // Add selected product by Item ID
  const addProductByItemId = async (product) => {
    try {
      setError('');
      const { data } = await Axios.get(`/api/products/itemId/${product.item_id}`);

      // Check if the product is in stock
      if (data.countInStock <= 0) {
        setError(`Item ${data.name} is out of stock.`);
        return;
      }

      // Set the selected product and reset quantity
      setSelectedProduct(data);
      setQuantity(1); // Reset quantity
      setItemId(''); // Clear item ID input
      setSuggestions([]); // Clear suggestions
    } catch (err) {
      setError('Product not found or server error.');
    }
  };

  // Handle adding product with quantity
  const handleAddProductWithQuantity = () => {
    if (!selectedProduct) return;

    const productWithQuantity = { ...selectedProduct, quantity }; // Add selected quantity
    setProducts([...products, productWithQuantity]);
    setSelectedProduct(null); // Reset selected product
    setQuantity(1); // Reset quantity
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (suggestions.length === 0) {
      setError('Please select a valid product');
    } else {
      addProductByItemId(suggestions[0]);
    }
  };

  // Delete a product from the list
  const deleteProduct = (indexToDelete) => {
    setProducts(products.filter((_, index) => index !== indexToDelete));
  };


  // Handle billing submission
  // Handle billing submission
const handleBillingSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!customerName || !customerAddress || !salesmanName || products.length === 0) {
      alert('Please fill all required fields and add at least one product.');
      return;
    }
  
    // Prepare billing data
    const billingData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      paymentStatus,
      customerName,
      customerAddress,
      products: products.map((product) => ({
        item_id: product.item_id,
        name: product.name,
        price: product.price,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity, // Ensure quantity is included
      })),
    };
  
    try {
      // Send data to the backend for further processing
      const response = await Axios.post('/api/billing/create', billingData);
      alert('Billing data submitted successfully!');
      console.log('Billing Response:', response.data);
      
      // Clear the form after successful submission
      setInvoiceNo('');
      setInvoiceDate('');
      setSalesmanName('');
      setExpectedDeliveryDate('');
      setDeliveryStatus('');
      setPaymentStatus('');
      setCustomerName('');
      setCustomerAddress('');
      setProducts([]);
      
    } catch (error) {
      console.error('Error submitting billing data:', error);
      alert('There was an error submitting the billing data. Please try again.');
    }
  };
  
  

  // Step Navigation
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Styles for the current step and button
  const stepStyle = "bg-blue-500 text-white font-semibold py-2 px-4 rounded-full focus:outline-none";
  const inactiveStepStyle = "bg-gray-300 text-gray-500 font-semibold py-2 px-4 w-lg mx-auto bg-white shadow-md rounded-lg p-6";

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        {/* Step Navigation */}
        <div className="flex justify-between mb-8">
          <button
            disabled={step === 1}
            onClick={prevStep}
            className={`${step === 1 ? inactiveStepStyle : stepStyle}`}
          >
            Previous
          </button>
          <p className="text-xl font-bold">
            Step {step} of 4
          </p>
          <button
            disabled={step === 4}
            onClick={nextStep}
            className={`${step === 4 ? inactiveStepStyle : stepStyle}`}
          >
            Next
          </button>
        </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Customer Information</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Invoice No</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                placeholder="Enter Invoice No"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                placeholder="Enter Customer Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Customer Address</label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                placeholder="Enter Customer Address"
              />
            </div>
          </div>
        )}

        {/* Step 2: Salesman Information */}
        {step === 2 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Salesman Information</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Salesman Name</label>
              <input
                type="text"
                value={salesmanName}
                onChange={(e) => setSalesmanName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                placeholder="Enter Salesman Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Payment and Delivery Information */}
        {step === 3 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Payment & Delivery Information</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Delivery Status</label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
              >
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
              >
                <option value="">Select Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Add Products */}
        {step === 4 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Add Products</h2>
            <form onSubmit={handleSubmitProduct}>
              <div className="mb-4">
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
                  <label className="block text-gray-700">Quantity (Max: {selectedProduct.countInStock})</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(e.target.value, selectedProduct.countInStock))}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none"
                    min="1"
                    max={selectedProduct.countInStock}
                  />
                  <button
                    type="button"
                    onClick={handleAddProductWithQuantity}
                    className="mt-2 bg-blue-500 text-white font-semibold py-2 px-4 rounded-md"
                  >
                    Add Product with Quantity
                  </button>
                </div>
              )}
            </form>

            {/* Display added products */}
            {products.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-2">Added Products</h3>
                <ul className="list-disc ml-5">
                  {products.map((product, index) => (
                    <li key={index}>
                      {product.name} - Quantity: {product.quantity}
                      <button
                        onClick={() => deleteProduct(index)}
                        className="text-red-500 ml-2"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Submit Billing Information */}
        <button
          onClick={handleBillingSubmit}
          className="mt-4 bg-green-500 text-white font-semibold py-2 px-4 rounded-md"
        >
          Submit Billing
        </button>
      </div>
    </div>
  );
}
