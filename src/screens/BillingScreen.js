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
  const [searchProduct,setSearchProduct] = useState(null);
  const [billingAmount,setBillingAmount] = useState('');

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
    setSearchProduct(null);
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
      billingAmount,
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


  useEffect(() => {
    if (suggestions.length > 0) {
      // Set the search product to the first suggestion (or any specific logic)
      setSearchProduct(suggestions[0]);
    }
  }, [suggestions]); // This effect runs only when the suggestions array changes
  
  
  

  // Step Navigation
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Styles for the current step and button
  const stepStyle = "bg-red-500 text-sm  text-white font-bold py-2 px-4 rounded-lg focus:outline-none";
  const inactiveStepStyle = "bg-gray-300 text-sm text-gray-500 font-bold py-2 px-4 bg-white shadow-md rounded-lg";

  return (
    <div className="container mx-auto p-6">
      <div className='flex justify-end'>
      <a href='/' className='fixed top-5 font-bold left-4 text-blue-500'><i className='fa fa-angle-left' /> Back</a>
      <h2 className='text-2xl font-bold text-red-600 '>KK TRADING</h2>
      </div>
      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-8">
      <div className='flex justify-between mb-4'>
        <p className='text-sm font-bold mb-5 text-gray-500'> <i className='fa fa-list'/> Billing</p>
      <div className='text-right'>
      <button
          onClick={handleBillingSubmit}
          className="mb-2 bg-red-500 text-sm text-white font-bold py-2 px-4 rounded-lg"
          >
          Submit Billing
        </button>
        <p className='text-xs text-gray-400'>Fill all fields before submission</p>
        </div>
          </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4">Customer Information</h2>
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
            <h2 className="text-lg font-bold mb-4">Salesman Information</h2>
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
              <label className="block text-gray-700">Bill Amount</label>
              <input
                type="text"
                value={billingAmount}
                onChange={(e) => setBillingAmount(e.target.value)}
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
            <h2 className="text-lg font-bold mb-4">Payment & Delivery Information</h2>
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
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Add Products */}
        {step === 4 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Add Products</h2>
            <div>
              <div className="mb-4">
                <label className="block text-gray-700">Item ID</label>
                <input
                  type="text"
                  value={itemId}
                  onKeyDown={(e)=> {if(e.key == 'Enter'){ if(searchProduct) { addProductByItemId(searchProduct) } } }}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none"
                  placeholder="Enter Item ID"
                />
                {error && <p className="text-red-500">{error}</p>}
                <div className="mt-2">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.item_id}
                      onClick={() =>{ addProductByItemId(suggestion) }}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                    >
                      {suggestion.name} - {suggestion.item_id}
                    </div>
                    
                  ))}
                </div>
              </div>
              {selectedProduct && (
                <div className="mb-4 text-right">
                  <div className='bg-gray-100 p-4 rounded-lg mb-2 text-left'>
                  <p className='font-bold text-xs'>ID: {selectedProduct.item_id}</p>
                  <p className="text-sm font-bold truncate">Selected Product: {selectedProduct.name}</p>
                  <label className="block text-gray-700">Quantity (Max: {selectedProduct.countInStock})</label>
                  </div>
                  <input
                    type="number"
                    value={quantity}
                    onKeyDown={(e) =>{ if(e.key == 'Enter')  handleAddProductWithQuantity(); }}
                    onChange={(e) => setQuantity(Math.min(e.target.value, selectedProduct.countInStock))}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none"
                    min="1"
                    max={selectedProduct.countInStock}
                  />
                  <button
                    type="button"
                    onClick={handleAddProductWithQuantity}
                    className="mt-2  bg-red-500 text-white font-semibold py-2 px-4 rounded-md"
                  >
                    Add <i className='fa fa-plus' />
                  </button>
                </div>
              )}
            </div>

            {/* Display added products */}
            {products.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold mb-2">Added Products</h3>
                <ul className="container">
                  {products.map((product, index) => (
                    <li className='bg-gray-100 p-4 mt-2 rounded-lg text-right' key={index}>
                      <p className='text-xs font-bold text-left'><i className='fa fa-dot-circle-o' /> ID: {product.item_id}</p>
                      <p className='text-sm truncate text-left'>Item: {product.name}</p>
                      <p className='text-sm text-left'>Quantity: {product.quantity}</p>
                      <button
                        onClick={() => deleteProduct(index)}
                        className="text-white rounded-lg py-2 px-4 font-bold bg-red-500"
                      >
                        <i className='fa fa-trash' />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

                {/* Step Navigation */}
                <div className="flex justify-between mb-8">
          <button
            disabled={step === 1}
            onClick={prevStep}
            className={`${step === 1 ? inactiveStepStyle : stepStyle}`}
          >
            Previous
          </button>
          <p className="font-bold text-center text-sm mt-2">
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
      </div>
    </div>
  );
}
