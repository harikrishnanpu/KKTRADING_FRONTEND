
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessModal from '../components/successModal';
import api from './api';

export default function BillingScreen() {
  const navigate = useNavigate();

  // Billing Information
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [salesmanName, setSalesmanName] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [searchProduct, setSearchProduct] = useState(null);
  const [billingAmount, setBillingAmount] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  // Product Information
  const [itemId, setItemId] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // To store the product being added
  const [quantity, setQuantity] = useState(1); // State for quantity after selecting a product
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1); // Track selected suggestion index

  // Image state
  const [loadingImage, setLoadingImage] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Stepper Control
  const [step, setStep] = useState(1);

  // Fetch suggestions for Item ID
  const fetchSuggestions = async (query) => {
    try {
      const { data } = await api.get(`/api/products/search/itemId?query=${query}`);
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
      const { data } = await api.get(`/api/products/itemId/${product.item_id}`);

      if (data.countInStock <= 0) {
        setError(`Item ${data.name} is out of stock.`);
        return;
      }

      setSelectedProduct(data);
      setQuantity(1);
      setItemId('');
      setSuggestions([]);
    } catch (err) {
      setError('Product not found or server error.');
    }
  };

  // Handle adding product with quantity
  const handleAddProductWithQuantity = () => {
    // Check for duplicates
    if (products.some(product => product._id === selectedProduct._id)) {
      alert('This product is already added. Adjust quantity instead.');
      return;
    }

    // Add product if not duplicate
    const productWithQuantity = { ...selectedProduct, quantity };
    setProducts([...products, productWithQuantity]);

    // Show success modal
     // Automatically close the modal after 3 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 3000);

    // Reset fields
    setSelectedProduct(null);
    setQuantity(1);
    setSearchProduct(null)
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };


    // Auto-focus the quantity input when a product is selected
    useEffect(() => {
      if (selectedProduct) {
        itemQuantityRef.current.focus();
      }
    }, [selectedProduct]);

    useEffect(() => {
      if (products) {
        itemIdRef.current?.focus();
      }
    }, [products]);

  const handleSuggestionKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      addProductByItemId(suggestions[selectedSuggestionIndex]);
      setSelectedSuggestionIndex(-1); // Reset index after selecting
    }
  };

  // Refs for input fields to enable Enter navigation
  const invoiceNoRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();
  const salesmanNameRef = useRef();
  const billingAmountRef = useRef();
  const invoiceDateRef = useRef();
  const expectedDeliveryDateRef = useRef();
  const deliveryStatusRef = useRef();
  const paymentStatusRef = useRef();
  const itemIdRef = useRef();
  const itemQuantityRef = useRef();

  function changeRef(e, nextRef) {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (nextRef === invoiceDateRef) {
        invoiceDateRef.current?.focus();
      } else if (nextRef === paymentStatusRef) {
        paymentStatusRef.current?.focus();
      } else if (nextRef === itemIdRef) {
        itemIdRef.current?.focus();
        setStep((prevStep) => prevStep + 1);
      } else if (nextRef === salesmanNameRef || nextRef === expectedDeliveryDateRef) {
        setStep((prevStep) => prevStep + 1);
      } else {
        nextRef?.current?.focus();
      }
    }
  }

  useEffect(() => {
    if (step === 2) {
      salesmanNameRef.current?.focus();
    } else if (step === 3) {
      expectedDeliveryDateRef.current?.focus();
    } else if (step === 4) {
      itemIdRef.current?.focus();
    }
  }, [step]);

  // Delete a product from the list
  const deleteProduct = (indexToDelete) => {
    setProducts(products.filter((_, index) => index !== indexToDelete));
  };

  // Handle billing submission
  const handleBillingSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || !customerAddress || !billingAmount || !invoiceNo || !expectedDeliveryDate || !salesmanName || products.length === 0) {
      alert('Please fill all required fields and add at least one product.');
      return;
    }

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
        quantity: product.quantity,
      })),
    };

    try {
      const response = await api.post('/api/billing/create', billingData);
      alert('Billing data submitted successfully!');
      console.log('Billing Response:', response.data);

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
      setSearchProduct(suggestions[0]);
    }
  }, [suggestions]);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const stepStyle = "bg-red-500 text-sm  text-white font-bold py-2 px-4 rounded-lg focus:outline-none";
  const inactiveStepStyle = "bg-gray-300 text-sm text-gray-500 font-bold py-2 px-4 bg-white shadow-md rounded-lg";

  const handleImageLoad = () => {
    setLoadingImage(false);
  };

  const handleImageError = () => {
    setLoadingImage(false);
    setImageError(true);
  };



  const [filterText, setFilterText] = useState('');

  // Filtered products based on filterText input
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
   
<div className="container mx-auto p-6">
      
      {/* Top Banner */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Billing and Customer Creation</p>
  </div>
  <i className="fa fa-list text-gray-500" />
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
            <h2 className="text-lg text-gray-600 font-bold mb-4">Customer Information</h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice No</label>
              <input
                type="text"
                ref={invoiceNoRef}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                onKeyDown={(e)=> changeRef(e, customerNameRef)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Invoice No"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Name</label>
              <input
                type="text"
                ref={customerNameRef}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e)=> changeRef(e, customerAddressRef)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Customer Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Address</label>
              <textarea
                value={customerAddress}
                ref={customerAddressRef}
                onChange={(e) => setCustomerAddress(e.target.value)}
                onKeyDown={(e)=> changeRef(e,salesmanNameRef)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Customer Address"
              />
            </div>
          </div>
        )}

        {/* Step 2: Salesman Information */}
        {step === 2 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4">Salesman Information and Bill</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Salesman Name</label>
              <input
                type="text"
                value={salesmanName}
                ref={salesmanNameRef}
                onChange={(e) => setSalesmanName(e.target.value)}
                onKeyDown={(e)=> changeRef(e,billingAmountRef)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Salesman Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Bill Amount</label>
              <input
                type="number"
                value={billingAmount}
                ref={billingAmountRef}
                onChange={(e) => setBillingAmount(e.target.value)}
                onKeyDown={(e)=> changeRef(e,invoiceDateRef)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Salesman Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Invoice Date</label>
              <input
                type="date"
                ref={invoiceDateRef}
                value={invoiceDate}
                onKeyDown={(e)=> changeRef(e, expectedDeliveryDateRef)}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
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
                ref={expectedDeliveryDateRef}
                value={expectedDeliveryDate}
                onKeyDown={(e)=> changeRef(e,deliveryStatusRef)}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Delivery Status</label>
              <select
                value={deliveryStatus}
                ref={deliveryStatusRef}
                onKeyDown={(e)=> changeRef(e,paymentStatusRef)}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
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
                ref={paymentStatusRef}
                onChange={(e) => setPaymentStatus(e.target.value)}
                onKeyDown={(e)=> changeRef(e,itemIdRef)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
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
          {/* <h2 className="text-md font-bold mb-4">Add Products</h2> */}
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-bold ml-1">Item ID</label>
              <input
                type="text"
                ref={itemIdRef}
                value={itemId}
                onKeyDown={handleSuggestionKeyDown}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full px-4 py-2 mt-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Item Id or Name"
              />
              {error && <p className="text-red-500">{error}</p>}

              <div className="mt-2">
                <p className='text-xs ml-2 italic text-gray-300 mb-2'>Similar suggestions</p>
                {suggestions.map((suggestion, index) => (
                  <div className='bg-gray-50 p-2 rounded-md'>
                  <div
                    key={suggestion.item_id}
                    onClick={() => addProductByItemId(suggestion)}
                    className={`p-2 text-xs rounded-md cursor-pointer hover:bg-gray-100 ${index === selectedSuggestionIndex ? 'bg-gray-200' : ''}`}
                  >
                    {suggestion.name} - {suggestion.item_id}
                  </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Display the selected product and quantity input */}
            {selectedProduct && (
              <div className="p-4 border border-gray-200 rounded-lg shadow-md bg-white">
                {/* Product Info */}
                <div className="mb-2 relative text-gray-700">
                  <div className='flex justify-between'>
                  <p className="text-xs font-bold truncate">{selectedProduct.name} - {selectedProduct.item_id}</p>
                  <span className='absolute bg-gray-500 px-5 right-1 w-20'></span>
                  <p className={`text-xs font-bold px-2 py-1 rounded-xl ${selectedProduct.countInStock > 10 ? 'bg-green-300 text-green-500' : 'bg-yellow-300 text-yellow-500'}`}>{selectedProduct.countInStock > 10 ? 'In Stock' : selectedProduct.countInStock < 10 ? 'Moving Out' : 'error' }</p>
                  </div>
                  <p className="text-xs font-bold text-gray-500">In stock: {selectedProduct.countInStock}</p>
                </div>

                {/* Quantity Input */}
                <div className="mb-4">
                  <label className="block text-xs mb-2 text-gray-700">Quantity</label>
                  <div className='flex justify-between'>
                  <input
                    type="number"
                    ref={itemQuantityRef}
                    min={1}
                    max={selectedProduct?.countInStock}
                    value={quantity}
                    onKeyDown={(e)=> {
                      if(e.key === 'Enter'){
                        handleAddProductWithQuantity();
                      }
                    }}
                    onChange={(e) => setQuantity(Math.min(e.target.value, selectedProduct.countInStock))}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-500 focus:ring-red-500"
                  />
                <button
                  className="bg-red-500 text-xs ml-2 text-white font-bold py-2 px-4 rounded focus:outline-none hover:bg-red-600"
                  onClick={handleAddProductWithQuantity}
                >
                 <i className='fa fa-plus' />
                </button>
                </div>
                </div>
              </div>
            )}

            {/* Display the added products table */}
            {products.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold mb-2">Added Products</h2>

                {/* Filter Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Filter by product name"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-1/2 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                {/* Product Table */}
                <div className="overflow-x-auto rounded-md">
                  <table className="table-auto w-full border-collapse rounded-xl shadow-md">
                    <thead>
                      <tr className="bg-red-400 text-white text-xs">
                        <th className="px-2 py-2 text-left">
                          <i className="fa fa-cube" aria-hidden="true"></i> Name
                        </th>
                        <th className="px-2 py-3 text-left">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-center">
                          <i className="fa fa-trash " aria-hidden="true"></i> 
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter((product) => product.name.toLowerCase().includes(filterText.toLowerCase()) || product.item_id.toLowerCase().includes(filterText.toLowerCase())).length > 0 ? (
                        products
                          .filter((product) => product.name.toLowerCase().includes(filterText.toLowerCase()) || product.item_id.toLowerCase().includes(filterText.toLowerCase()))
                          .map((product, index) => (
                            <tr
                              key={index}
                              className={`${
                                index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                              } border-b hover:bg-red-50 transition duration-150`}
                            >
                              <td className="px-4 py-4 text-xs font-medium">{product.name} - {product.item_id}</td>
                              <td className="px-2 py-2 text-xs text-center">{product.quantity}</td>
                              <td className="px-2 py-2 text-xs text-center">
                                <button
                                  onClick={() => {
                                    window.confirm(`Are You Sure Want To Delete ${product.name} from Bill`)
                                     deleteProduct(index) 
                                    }}
                                  className="text-red-500 font-bold hover:text-red-700"
                                >
                                  <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="text-center py-4 text-gray-500 text-sm italic"
                          >
                            No products match your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
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

            {/* Success Modal */}
            {showSuccessModal && (
        <SuccessModal 
          showModal={showSuccessModal} 
          closeModal={closeSuccessModal}
          message="Product added successfully!"
        />
      )}

    </div>
  );
}


