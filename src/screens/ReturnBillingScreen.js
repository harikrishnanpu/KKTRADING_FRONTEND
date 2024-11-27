import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import BillingSuccess from '../components/billingsuccess';
import { useSelector } from 'react-redux';

export default function ReturnBillingScreen() {
  const navigate = useNavigate();
  
  // State Variables
  const [selectedBillingNo, setSelectedBillingNo] = useState('');
  const [returnNo, setReturnNo] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().substring(0, 10));
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [discount, setDiscount] = useState(0);
  const [perItemDiscount, setPerItemDiscount] = useState(0);
  const [returnAmount, setReturnAmount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [netReturnAmount, setNetReturnAmount] = useState(0);
  const [isGstEnabled, setIsGstEnabled] = useState(true); // GST Toggle
  const [success,setSuccess] = useState(false);
  const [returnInvoice,setReturnInvoice] = useState('');

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;


  // Refs for Input Navigation
  const billingNoRef = useRef();
  const returnNoRef = useRef();
  const returnDateRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();

  const [lastBillId, setLastBillId] = useState(null);

  // Fetch Last Return ID on Mount
  useEffect(() => {
    async function fetchLastReturn() {
      try {
        const { data } = await api.get('/api/returns/lastreturn/id');
        // Assuming data is like 'CN0001', increment the numerical part
        const numericalPart = parseInt(data.slice(2), 10) + 1;
        const nextReturnNo = `CN${numericalPart.toString().padStart(data.length - 2, '0')}`;
        setReturnNo(nextReturnNo);
        setLastBillId(data);
      } catch (error) {
        console.error('Error fetching last return ID:', error);
        setError('Failed to fetch the last return ID.');
      }
    }
    fetchLastReturn();
  }, []);

  // Fetch Billing Suggestions when Billing No Changes
  useEffect(() => {
    if (selectedBillingNo) {
      fetchBillingSuggestions(selectedBillingNo);
    } else {
      setSuggestions([]);
    }
  }, [selectedBillingNo]);

  // Focus Management Based on Step
  useEffect(() => {
    if (step === 0) {
      billingNoRef.current?.focus();
    } else if (step === 1) {
      returnNoRef.current?.focus();
    } else if (step === 2) {
      customerNameRef.current?.focus();
    } else if (step === 3) {
      customerAddressRef.current?.focus();
    }
  }, [step]);

  // Fetch Billing Suggestions Function
  const fetchBillingSuggestions = async (query) => {
    try {
      const { data } = await api.get(`/api/billing/billing/suggestions?search=${query}`);
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching billing suggestions:', err);
      setError('Error fetching billing suggestions.');
    }
  };

  // Fetch Billing Details Function
  const fetchBillingDetails = async (id) => {
    try {
      const { data } = await api.get(`/api/billing/${id}`);
      setCustomerName(data.customerName);
      setCustomerAddress(data.customerAddress);
      setDiscount(parseFloat(data.discount) || 0);

      // Calculate Total Quantity
      const totalQtyProducts = data.products.reduce(
        (acc, product) => acc + parseFloat(product.quantity || 0),
        0
      );

      // Calculate Per Item Discount
      const calculatedPerItemDiscount = totalQtyProducts > 0 ? (parseFloat(data.discount) || 0) / totalQtyProducts : 0;
      setPerItemDiscount(parseFloat(calculatedPerItemDiscount.toFixed(2)));

      // Initialize Products with Return Price
      const productsWithDetails = data.products.map((product) => ({
        ...product,
        initialQuantity: parseFloat(product.quantity) || 0,
        returnPrice: parseFloat((parseFloat(product.sellingPriceinQty) - calculatedPerItemDiscount).toFixed(2))
      }));

      setProducts(productsWithDetails);
      setStep(1);
    } catch (err) {
      console.error('Error fetching billing details:', err);
      setError('Error fetching billing details.');
    }
  };

  // Recalculate Return Amount and Taxes whenever Products or GST Toggle Change
  useEffect(() => {
    const amount = products.reduce((sum, product) => sum + (product.returnPrice * product.quantity), 0);
    setReturnAmount(amount);

    if (isGstEnabled) {
      // Calculate CGST and SGST as 9% each of the amount
      const calculatedCgst =  parseFloat((amount - (amount/1.18)) / 2);
      const calculatedSgst = parseFloat((amount - (amount/1.18)) / 2);
      setCgst(calculatedCgst);
      setSgst(calculatedSgst);
      setTotalTax(calculatedCgst + calculatedSgst);

      // Net Return Amount is amount + total tax
      setNetReturnAmount(parseFloat((amount - (calculatedCgst + calculatedSgst)).toFixed(2)));
    } else {
      // If GST is not enabled
      setCgst(0);
      setSgst(0);
      setTotalTax(0);
      setNetReturnAmount(parseFloat(amount.toFixed(2)));
    }
  }, [products, isGstEnabled]);

  // Handle Suggestion Navigation and Selection
  const handleSuggestionKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selectedBilling = suggestions[selectedSuggestionIndex];
      setSelectedBillingNo(selectedBilling.invoiceNo);
      fetchBillingDetails(selectedBilling._id);
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle Enter Key Navigation Between Fields
  const changeRef = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  // Handle Return Submission
  const handleReturnSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!customerName || !customerAddress || products.length === 0 || !returnNo || !selectedBillingNo) {
      alert('Please fill all required fields and add at least one product.');
      return;
    }

    const returnData = {
      returnNo,
      billingNo: selectedBillingNo,
      returnDate,
      customerName,
      customerAddress,
      discount,
      products: products.map(({ item_id, name, returnPrice, quantity }) => ({
        item_id,
        name,
        returnPrice,
        quantity,
      })),
      returnAmount,
      cgst,
      sgst,
      totalTax,
      netReturnAmount
    };

    try {
     const getData =  await api.post('/api/returns/create', returnData);

     setReturnInvoice(getData.data);
     // Reset Form After Submission
     setReturnNo('');
     setSelectedBillingNo('');
     setReturnDate(new Date().toISOString().substring(0, 10));
     setCustomerName('');
     setCustomerAddress('');
     setDiscount(0);
     setPerItemDiscount(0);
     setProducts([]);
     setStep(0);
     setIsGstEnabled(true);
     alert('Return data submitted successfully!');
     setSuccess(true);
    } catch (error) {
      console.error('Error submitting return data:', error);
      alert('There was an error submitting the return data. Please try again.');
    }
  };





  const handleGenerateAndPrint = async () => {
    // Validation
    if (!customerName || !customerAddress || products.length === 0 || !returnNo || !selectedBillingNo) {
      alert('Please fill all required fields and add at least one product.');
      return;
    }

    const returnData = {
      returnNo,
      billingNo: selectedBillingNo,
      returnDate,
      customerName,
      customerAddress,
      discount,
      products: products.map(({ item_id, name, returnPrice, quantity }) => ({
        item_id,
        name,
        returnPrice,
        quantity,
      })),
      returnAmount,
      cgst,
      sgst,
      totalTax,
      netReturnAmount
    };

    try {

      // Generate Return Invoice HTML
      const response = await api.post('/api/print/generate-return-invoice-html', returnData, {
        responseType: 'blob'
      });

      // Create a Blob from the response
      const blob = new Blob([response.data], { type: 'text/html' });

      // Create a URL for the Blob and open it in a new tab
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      alert('Return data submitted and invoice generated successfully!');
    } catch (error) {
      console.error('Error submitting return data or generating invoice:', error);
      alert('There was an error submitting the return data or generating the invoice. Please try again.');
    }
  };


  // Navigation Steps
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div>
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Return Billing and Updating</p>
        </div>
        <i className="fa fa-recycle text-gray-500 text-2xl" />
      </div>

      <div className="container mx-auto py-4">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          
          {/* Submit Button */}
          <div className='flex justify-end mb-4'>
            <div className='text-right space-x-2'>
            <button
                onClick={()=> handleGenerateAndPrint()}
                className="bg-red-600 font-bold text-xs text-white py-2 px-3 rounded-md"
              >
                <i className='fa fa-print' />
              </button>
              <button
                onClick={handleReturnSubmit}
                className="bg-red-600 font-bold text-xs text-white py-2 px-3 rounded-md"
              >
                Submit Return
              </button>
              <p className='italic text-xs text-gray-400 mt-1'>Please fill all required fields before submission</p>
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {success && <BillingSuccess isAdmin={userInfo.isAdmin}  estimationNo={returnInvoice} />}

          {/* Form Steps */}
          <div>
            <div className="space-y-6">
              
              {/* Step 0: Select Billing No */}
              {step === 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">Select Billing No</label>
                  <input
                    type="text"
                    ref={billingNoRef}
                    value={selectedBillingNo}
                    onChange={(e) => setSelectedBillingNo(e.target.value)}
                    onKeyDown={handleSuggestionKeyDown}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                    placeholder="Enter or select Billing Invoice No"
                    autoComplete="off"
                  />
                  {/* Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="mt-2 bg-white divide-y shadow-md rounded-md max-h-60 overflow-y-auto">
                      {suggestions.map((billing, index) => (
                        <div
                          key={billing.invoiceNo}
                          onClick={() => {
                            setSelectedBillingNo(billing.invoiceNo);
                            fetchBillingDetails(billing._id);
                            setSuggestions([]);
                            setSelectedSuggestionIndex(-1);
                          }}
                          className={`cursor-pointer flex justify-between p-4 hover:bg-gray-100 ${index === selectedSuggestionIndex ? 'bg-gray-200' : ''}`}
                        >
                          <span className='text-xs font-bold text-gray-500'>
                            {billing.invoiceNo}
                          </span>
                          <i className='fa text-gray-300 px-2 fa-arrow-right' />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Navigation Button */}
                </div>
              )}
              
              {/* Step 1: Return Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className='flex justify-between'>
                    <h3 className="text-sm font-bold text-gray-500">Return Information</h3>
                    <p className='italic text-xs text-gray-500'>Last Return No: {lastBillId ? lastBillId : 'No Returns'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-xs">Return No</label>
                      <input
                        type="text"
                        ref={returnNoRef}
                        value={returnNo}
                        onChange={(e) => setReturnNo(e.target.value)}
                        onKeyDown={(e) => changeRef(e, returnDateRef)}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                        placeholder="Enter Return No"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs">Return Date</label>
                      <input
                        type="date"
                        ref={returnDateRef}
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            nextStep();
                          }
                        }}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                        required
                      />
                    </div>
                  </div>
                  {/* Navigation Buttons */}
                </div>
              )}
              
              {/* Step 2: Customer Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>
                  <div>
                    <label className="block text-gray-700 text-xs">Customer Name</label>
                    <input
                      type="text"
                      ref={customerNameRef}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      onKeyDown={(e) => changeRef(e, customerAddressRef)}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                      placeholder="Enter Customer Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs">Customer Address</label>
                    <textarea
                      ref={customerAddressRef}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          nextStep();
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                      placeholder="Enter Customer Address"
                      required
                    />
                  </div>
                  {/* Navigation Buttons */}
                </div>
              )}
              
              {/* Step 3: Update Products */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800">Step 4: Update Products</h3>
                  
                  {/* GST Toggle */}
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="gstToggle"
                      checked={isGstEnabled}
                      onChange={(e) => setIsGstEnabled(e.target.checked)}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label htmlFor="gstToggle" className="ml-2 block text-xs text-gray-700">
                      Apply GST (CGST + SGST)
                    </label>
                  </div>

                  {/* Products Table */}
                  {products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto bg-white shadow-md rounded-md">
                        <thead>
                          <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                            <th className="py-3 px-2 text-left">Item ID</th>
                            <th className="py-3 px-2 text-left">Name</th>
                            <th className="py-3 px-2 text-left">Return Price</th>
                            <th className="py-3 px-2 text-left">Quantity</th>
                            <th className="py-3 px-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                          {products.map((product, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                              <td className="py-3 text-xs px-2">{product.item_id}</td>
                              <td className="py-3 text-xs px-2">{product.name}</td>
                              <td className="py-3 text-xs px-2">₹{product.returnPrice.toFixed(2)}</td>
                              <td className="py-3 text-xs px-2">
                                <input
                                  type="number"
                                  max={product.initialQuantity}
                                  value={product.quantity}
                                  onChange={(e) => {
                                    const newQuantity = e.target.value === '' ? '' : Math.min(Number(e.target.value), product.initialQuantity);
                                    const newProducts = [...products];
                                    newProducts[index].quantity = newQuantity;
                                    setProducts(newProducts);
                                  }}
                                  className="w-20 px-2 py-1 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                                  min="0"
                                  required
                                />
                              </td>
                              <td className="py-3 text-xs px-2">
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${product.name} from the return?`))
                                      setProducts(products.filter((_, i) => i !== index));
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No products available for return.</p>
                  )}
                  
                  {/* Return Summary */}
                  {products.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <h4 className="text-xs font-semibold text-gray-700">Return Summary</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div className="flex text-xs justify-between">
                          <span>Return Amount:</span>
                          <span>₹{returnAmount.toFixed(2)}</span>
                        </div>
                        {isGstEnabled && (
                          <>
                            <div className="flex text-xs justify-between">
                              <span>CGST (9%):</span>
                              <span>₹{cgst.toFixed(2)}</span>
                            </div>
                            <div className="flex text-xs justify-between">
                              <span>SGST (9%):</span>
                              <span>₹{sgst.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex text-sm justify-between font-bold">
                          <span>Net Return Amount:</span>
                          <span>₹{netReturnAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation Buttons */}
                </div>
              )}
              
            </div>
          </div>
          
          {/* Step Navigation */}
          <div className="flex justify-between mb-8 mt-10">
            <button
              disabled={step === 0}
              onClick={prevStep}
              className={`${
                step === 0
                  ? 'bg-gray-300 text-gray-500 text-xs font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                  : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
              }`}
            >
              Previous
            </button>
            <p className="font-bold text-center text-xs mt-2">
              Step {step + 1} of 4
            </p>
            <button
              disabled={
                (step === 0) ||
                (step === 1 && (!returnNo || !returnDate)) ||
                (step === 2 && (!customerName || !customerAddress)) ||
                (step === 3)
              }
              onClick={nextStep}
              className={`${
                (step === 0) ||
                (step === 1 && (!returnNo || !returnDate)) ||
                (step === 2 && (!customerName || !customerAddress)) ||
                (step === 3)
                  ? 'bg-gray-300 text-xs text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                  : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
