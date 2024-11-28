import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from './api';
import BillingSuccess from '../components/billingsuccess';
import { useSelector } from 'react-redux';

export default function ReturnEditScreen() {
  const navigate = useNavigate();
  const { id: paramReturnNo } = useParams(); // Extract returnNo from URL parameters
 // State Variables
 const [returnNo, setReturnNo] = useState(paramReturnNo || '');
 const [billingNo, setBillingNo] = useState(''); // Associated Billing No
 const [returnDate, setReturnDate] = useState(new Date().toISOString().substring(0, 10));
 const [customerName, setCustomerName] = useState('');
 const [customerAddress, setCustomerAddress] = useState('');
 const [products, setProducts] = useState([]);
 const [error, setError] = useState('');
 const [step, setStep] = useState(1); // Start from Step 1 if editing
 const [returnAmount, setReturnAmount] = useState(0);
 const [cgst, setCgst] = useState(0);
 const [sgst, setSgst] = useState(0);
 const [totalTax, setTotalTax] = useState(0);
 const [netReturnAmount, setNetReturnAmount] = useState(0);
 const [isGstEnabled, setIsGstEnabled] = useState(true); // GST Toggle
 const [success, setSuccess] = useState(false);
 const [returnInvoice, setReturnInvoice] = useState('');

 // Redux State
 const userSignin = useSelector((state) => state.userSignin);
 const { userInfo } = userSignin;

 // Refs for Input Navigation
 const returnDateRef = useRef();
 const customerNameRef = useRef();
 const customerAddressRef = useRef();

  // Fetch Return Details on Mount
  useEffect(() => {
    if (paramReturnNo) {
      fetchReturnDetails(paramReturnNo);
    } else {
      setError('No Return Number provided.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramReturnNo]);
  
  // Function to fetch return details
  const fetchReturnDetails = async (returnNo) => {
    try {
      const { data } = await api.get(`/api/returns/api/returns/details/${returnNo}`); // Adjust the endpoint as per your backend
  
      setReturnNo(data.returnNo);
      setBillingNo(data.billingNo);
      setReturnDate(data.returnDate ? data.returnDate.split('T')[0] : new Date().toISOString().substring(0, 10));
      setCustomerName(data.customerName);
      setCustomerAddress(data.customerAddress);
      setIsGstEnabled(data.isGstEnabled !== undefined ? data.isGstEnabled : true);
  
      // After fetching return data, fetch billing data
      fetchBillingDetails(data.billingNo, data.products);
    } catch (err) {
      console.error('Error fetching return details:', err);
      setError('Error fetching return details.');
    }
  };
  
  // Function to fetch billing details and calculate returnPrice
  const fetchBillingDetails = async (billingNo, returnProducts) => {
    try {
      const { data } = await api.get(`/api/billing/getinvoice/${billingNo}`); // Adjust the endpoint as per your backend
  

      // Map billing products to return products to calculate returnPrice
      const updatedProducts = returnProducts.map((returnProduct) => {
        const billingProduct = data.products.find((prod) => prod.item_id === returnProduct.item_id);
              // Calculate Total Quantity
      const totalQtyProducts = returnProducts.reduce(
        (acc, product) => acc + parseFloat(product.quantity || 0),
        0
      );

      // Calculate Per Item Discount
      const calculatedPerItemDiscount = totalQtyProducts > 0 ? (parseFloat(data.discount) || 0) / totalQtyProducts : 0;
        if (billingProduct) {
          return {
            ...returnProduct,
            initialQuantity: parseFloat(billingProduct.quantity) || 0,
            returnPrice: parseFloat((parseFloat(billingProduct.sellingPriceinQty) - calculatedPerItemDiscount).toFixed(2))
          };
        } else {
          return {
            ...returnProduct,
            initialQuantity: 0,
            returnPrice: 0,
          };
        }
      });
  
      setProducts(updatedProducts);
    } catch (err) {
      console.error('Error fetching billing details:', err);
      setError('Error fetching billing details.');
    }
  };
  

  // Recalculate Return Amount and Taxes whenever Products or GST Toggle Change
  useEffect(() => {
    const amount = products.reduce((sum, product) => sum + (parseFloat(product.returnPrice) * parseFloat(product.quantity || 0)), 0);
    setReturnAmount(amount);
  
    if (isGstEnabled) {
      // Calculate CGST and SGST as 9% each of the amount
      const calculatedCgst = parseFloat((amount * 0.09).toFixed(2));
      const calculatedSgst = parseFloat((amount * 0.09).toFixed(2));
      setCgst(calculatedCgst);
      setSgst(calculatedSgst);
      setTotalTax(calculatedCgst + calculatedSgst);
  
      // Net Return Amount is amount + total tax
      setNetReturnAmount(parseFloat((amount + calculatedCgst + calculatedSgst).toFixed(2)));
    } else {
      // If GST is not enabled
      setCgst(0);
      setSgst(0);
      setTotalTax(0);
      setNetReturnAmount(parseFloat(amount.toFixed(2)));
    }
  }, [products, isGstEnabled]);
  

  // Handle Quantity Change
// Handle Quantity Change
const handleQuantityChange = (index, value) => {
  const newQuantity = value === '' ? '' : Math.min(Number(value), products[index].initialQuantity);
  const updatedProducts = [...products];
  updatedProducts[index].quantity = newQuantity;
  setProducts(updatedProducts);
};

// Handle Remove Product
const handleRemoveProduct = (index) => {
  if (window.confirm(`Are you sure you want to delete ${products[index].name} from the return?`)) {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  }
};


  // Handle Return Submission (Update)
// Handle Return Submission (Update)
const handleReturnSubmit = async (e) => {
  e.preventDefault();

  // Validation
  if (!customerName || !customerAddress || products.length === 0 || !returnNo || !billingNo) {
    alert('Please fill all required fields and ensure at least one product is returned.');
    return;
  }

  const returnData = {
    returnNo,
    billingNo,
    returnDate,
    customerName,
    customerAddress,
    isGstEnabled,
    products: products.map(({ item_id, name, returnPrice, quantity }) => ({
      item_id,
      name,
      returnPrice,
      quantity,
    })),
    returnAmount,
    totalTax,
    netReturnAmount,
  };

  try {
    await api.put(`/api/returns/api/returns/update/${returnNo}`, returnData); // Adjust the endpoint as per your backend
    alert('Return data updated successfully!');
    setReturnInvoice(returnNo);
    setSuccess(true);
    navigate('/'); // Navigate to home or appropriate page after success
  } catch (error) {
    console.error('Error updating return data:', error);
    alert('There was an error updating the return data. Please try again.');
  }
};

// Handle Generate and Print Invoice
const handleGenerateAndPrint = async () => {
  // Validation
  if (!customerName || !customerAddress || products.length === 0 || !returnNo || !billingNo) {
    alert('Please fill all required fields and ensure at least one product is returned.');
    return;
  }

  const returnData = {
    returnNo,
    billingNo,
    returnDate,
    customerName,
    customerAddress,
    isGstEnabled,
    products: products.map(({ item_id, name, returnPrice, quantity }) => ({
      item_id,
      name,
      returnPrice,
      quantity,
    })),
    returnAmount,
    totalTax,
    netReturnAmount,
  };

  try {
    // Generate Return Invoice HTML
    const response = await api.post('/api/print/generate-return-invoice-html', returnData, {
      responseType: 'blob',
    });

    // Create a Blob from the response
    const blob = new Blob([response.data], { type: 'text/html' });

    // Create a URL for the Blob and open it in a new tab
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    alert('Return data updated and invoice generated successfully!');
  } catch (error) {
    console.error('Error updating return data or generating invoice:', error);
    alert('There was an error updating the return data or generating the invoice. Please try again.');
  }
};



return (
  <div>
    {/* Top Banner */}
    <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
      <div onClick={() => navigate('/')} className="text-center cursor-pointer">
        <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
        <p className="text-gray-400 text-xs font-bold">Return Edit and Updating</p>
      </div>
      <i className="fa fa-edit text-gray-500" />
    </div>

    <div className="container mx-auto py-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">

        {/* Update and Print Buttons */}
        <div className='flex justify-end mb-4 space-x-2'>
          <button
            onClick={handleGenerateAndPrint}
            className="bg-red-600 font-bold text-xs text-white py-2 px-3 rounded-md flex items-center"
          >
            <i className='fa fa-print mr-1' /> Print Invoice
          </button>
          <button
            onClick={handleReturnSubmit}
            className="bg-red-600 font-bold text-xs text-white py-2 px-3 rounded-md"
          >
            Update Return
          </button>
          <p className='italic text-xs text-gray-400 mt-1'>Please fill all required fields before submission</p>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Success Message */}
        {success && <BillingSuccess isAdmin={userInfo?.isAdmin} estimationNo={returnInvoice} />}

        {/* Form */}
        <form onSubmit={handleReturnSubmit}>
          <div className="space-y-6">

            {/* Step 1: Return Information */}
            <div className="space-y-4">
              <div className='flex justify-between'>
                <h3 className="text-sm font-bold text-gray-500">Return Information</h3>
                <p className='italic text-xs text-gray-500'>Return No: {returnNo}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs">Return No</label>
                  <input
                    type="text"
                    value={returnNo}
                    disabled
                    className="w-full px-4 py-2 border rounded-md bg-gray-100 text-xs"
                    placeholder="Return No"
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
                        e.preventDefault();
                        // Move focus to next field if needed
                        customerNameRef.current?.focus();
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>
              <div>
                <label className="block text-gray-700 text-xs">Customer Name</label>
                <input
                  type="text"
                  ref={customerNameRef}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      customerAddressRef.current?.focus();
                    }
                  }}
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
                      e.preventDefault();
                      // Optionally, handle form submission or move to next step
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                  placeholder="Enter Customer Address"
                  required
                />
              </div>
            </div>

            {/* Step 3: Update Products */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Update Products</h3>

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
                          <td className="py-3 text-xs px-2">₹{parseFloat(product.returnPrice).toFixed(2)}</td>
                          <td className="py-3 text-xs px-2">
                            <input
                              type="number"
                              max={product.initialQuantity}
                              value={product.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-20 px-2 py-1 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                              min="0"
                              required
                            />
                          </td>
                          <td className="py-3 text-xs px-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(index)}
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
            </div>

            {/* Step Navigation Indicators */}
            <div className="flex justify-between mb-8 mt-10">
              <button
                disabled={step === 1}
                onClick={() => setStep((prev) => prev - 1)}
                className={`${
                  step === 1
                    ? 'bg-gray-300 text-gray-500 text-xs font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                    : 'bg-gray-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600'
                }`}
              >
                Previous
              </button>
              <p className="font-bold text-center text-xs mt-2">
                Step {step} of 3
              </p>
              <button
                disabled={step === 3}
                onClick={() => setStep((prev) => prev + 1)}
                className={`${
                  step === 3
                    ? 'bg-gray-300 text-gray-500 text-xs font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                    : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
                }`}
              >
                Next
              </button>
            </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
