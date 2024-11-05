import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function ReturnBillingScreen() {
  const navigate = useNavigate();
  const [selectedBillingNo, setSelectedBillingNo] = useState('');
  const [returnNo, setReturnNo] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs for input fields to enable Enter navigation
  const billingNoRef = useRef();
  const returnNoRef = useRef();
  const returnDateRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();

  useEffect(() => {
    if (selectedBillingNo) {
      fetchBillingSuggestions(selectedBillingNo);
    }
  }, [selectedBillingNo]);

  useEffect(() => {
    if (step === 0) {
      billingNoRef.current?.focus();
    } else if (step === 1) {
      returnNoRef.current?.focus();
    } else if (step === 2) {
      customerNameRef.current?.focus();
    }
  }, [step]);

  const fetchBillingSuggestions = async (query) => {
    try {
      const { data } = await api.get(`/api/billing/billing/suggestions?search=${query}`);
      setSuggestions(data);
    } catch (err) {
      setError('Error fetching billing suggestions');
    }
  };

  const fetchBillingDetails = async (id) => {
    try {
      const { data } = await api.get(`/api/billing/${id}`);
      setCustomerName(data.customerName);
      setCustomerAddress(data.customerAddress);
      setProducts(data.products);
      setStep(1);
    } catch (err) {
      setError('Error fetching billing details');
    }
  };

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

  const changeRef = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  const handleReturnSubmit = async (e) => {

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
      await api.post('/api/returns/create', returnData);
      alert('Return data submitted successfully!');
      setReturnNo('');
      setSelectedBillingNo('');
      setReturnDate('');
      setCustomerName('');
      setCustomerAddress('');
      setProducts([]);
      setStep(0);
      alert("Purchase Submitted Successfully");
    } catch (error) {
      alert('There was an error submitting the return data. Please try again.');
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div>
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Return Billing and Updating</p>
  </div>
  <i className="fa fa-recycle text-gray-500" />
</div>

      <div className="container mx-auto py-4">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          <div className='flex justify-end mb-4'>
            <div className='text-right'>
          <button
                    onClick={()=> handleReturnSubmit()}
                    className="bg-red-600 font-bold text-xs text-white py-2 px-3 rounded-md"
                    >
                    Submit Return
                  </button>
                  <p className='italic text-xs text-gray-400 mt-1'>Please fill all required fields before submission</p>
                    </div>
          </div>
          <div className="space-y-6">
            {step === 0 && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-800">Select Billing No</label>
                <input
                  type="text"
                  ref={billingNoRef}
                  value={selectedBillingNo}
                  onChange={(e) => setSelectedBillingNo(e.target.value)}
                  onKeyDown={handleSuggestionKeyDown}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500"
                  placeholder="Enter or select Billing Invoice No"
                />
                <div className="mt-5 bg-white divide-y shadow-md rounded-md max-h-sm overflow-y-auto">
                  {suggestions.map((billing, index) => (
                    <div
                      key={billing.invoiceNo}
                      onClick={() => {
                        setSelectedBillingNo(billing.invoiceNo);
                        fetchBillingDetails(billing._id);
                        setSuggestions([]);
                      }}
                      className={`cursor-pointer flex justify-between  p-4 hover:bg-gray-100 ${index === selectedSuggestionIndex ? 'bg-gray-200' : ''}`}
                    >
                      <span className='text-xs font-bold text-gray-500'>
                      {billing.invoiceNo}
                      </span>
                      <i className='fa text-gray-300 px-2 fa-arrow-right' />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-red-500 font-bold text-xs mt-4 text-white py-2 px-4 rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Step 2: Enter Return Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700">Return No</label>
                    <input
                      type="text"
                      ref={returnNoRef}
                      value={returnNo}
                      onChange={(e) => setReturnNo(e.target.value)}
                      onKeyDown={(e) => changeRef(e, returnDateRef)}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500"
                      placeholder="Enter Return No"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700">Return Date</label>
                    <input
                      type="date"
                      ref={returnDateRef}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      onKeyDown={(e) => {
                        if(e.key === "Enter"){
                          nextStep(e)
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-500  font-bold text-xs text-white py-2 px-3 rounded-md"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-red-500  font-bold text-xs text-white py-2 px-4 rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Step 3: Customer Information</h3>
                <div>
                  <label className="block text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    ref={customerNameRef}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onKeyDown={(e) => changeRef(e, customerAddressRef)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500"
                    placeholder="Enter Customer Name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Customer Address</label>
                  <textarea
                    ref={customerAddressRef}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if(e.key === "Enter"){
                        nextStep(e)
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500"
                    placeholder="Enter Customer Address"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-500  font-bold text-xs text-white py-2 px-3 rounded-md"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-red-500  font-bold text-xs text-white py-2 px-4 rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Update Products</h3>
                {products.length > 0 && (
                                 <div className="mt-4 overflow-x-auto">
                                 <table className="min-w-full table-auto bg-white shadow-md rounded-md">
                                   <thead>
                                     <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                                       <th className="py-3 px-2 text-left">Item ID</th>
                                       <th className="py-3 px-2 text-left">Name</th>
                                       <th className="py-3 px-2 text-left">Price</th>
                                       <th className="py-3 px-2 text-left">Quantity</th>
                                     </tr>
                                   </thead>
                                   <tbody className="text-gray-600 text-sm font-light">
                                     {products.map((product, index) => (
                                       <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                                         <td className="py-3 text-xs px-2">{product.item_id}</td>
                                         <td className="py-3 text-xs px-2">{product.name}</td>
                                         <td className="py-3 text-xs px-2">{product.price}</td>
                                         <td className="py-3 text-xs px-2">
                                         <input
                                type="number"
                                max={product.quantity}
                                value={product.quantity}
                                onChange={(e) => {
                                  const newQuantity = Math.min(e.target.value, product.quantity);
                                  const newProducts = [...products];
                                  newProducts[index].quantity = newQuantity;
                                  setProducts(newProducts);
                                }}
                                className="w-20 px-2 py-1 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500"
                                min="0"
                              />
                                         </td>
                                       </tr>
                                     ))}
                                   </tbody>
                                 </table>
                               </div>
                )}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-500  font-bold text-xs text-white py-2 px-3 rounded-md"
                  >
                    Previous
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}