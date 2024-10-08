import React, { useState, useEffect } from 'react';
import Axios from 'axios';

export default function ReturnBillingScreen() {
  // const [billingNos, setBillingNos] = useState([]);
  const [selectedBillingNo, setSelectedBillingNo] = useState('');
  const [returnNo, setReturnNo] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0); // Step state to manage the current step

  // Fetch billing suggestions based on the input
  const fetchBillingSuggestions = async (query) => {
    try {
      const { data } = await Axios.get(`/api/billing/billing/suggestions?search=${query}`);
      setSuggestions(data);
    } catch (err) {
      setError('Error fetching billing suggestions');
    }
  };

  useEffect(() => {
    if (selectedBillingNo) {
      fetchBillingSuggestions(selectedBillingNo);
    }
  }, [selectedBillingNo]);

  // Fetch full billing details once the invoice number is selected or typed
  const fetchBillingDetails = async (id) => {
    try {
      const { data } = await Axios.get(`/api/billing/${id}`);
      setCustomerName(data.customerName);
      setCustomerAddress(data.customerAddress);
      setProducts(data.products); // Set initial quantity to 1
      setStep(1); // Move to next step after successful fetch
    } catch (err) {
      setError('Error fetching billing details');
    }
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

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div>
        <div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>

    <div className="container mx-auto py-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-lg font-bold text-red-600 mb-4">Product Return</h2>
        <form onSubmit={handleReturnSubmit} className="space-y-6">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Step 1: Select Billing No</h3>
              <label className="block text-gray-700">Billing Invoice No.</label>
              <input
                type="text"
                value={selectedBillingNo}
                onChange={(e) => setSelectedBillingNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                placeholder="Enter or select Billing Invoice No"
              />
              <div className="mt-2 bg-white shadow-md rounded-md max-h-32 overflow-y-auto">
                {suggestions.map((billing) => (
                  <div
                    key={billing.invoiceNo}
                    onClick={() => {
                      setSelectedBillingNo(billing.invoiceNo);
                      fetchBillingDetails(billing._id);
                      setSuggestions([]);
                    }}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                  >
                    {billing.invoiceNo}
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-red-500 text-white py-2 px-4 rounded-md"
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
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-red-500 text-white py-2 px-4 rounded-md"
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
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-red-500 text-white py-2 px-4 rounded-md"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Step 4: Update Products</h3>
              {products.length > 0 && (
                <div className="mt-4">
                  <ul className="list-disc ml-5">
                    {products.map((product, index) => (
                      <li key={index} className="flex justify-between items-center mb-2">
                        <div>
                          {product.name} - {product.item_id} - ${product.price}
                        </div>
                        <div>
                          <input
                            type="number"
                            max={product.quantity}
                            value={product.quantity}
                            onChange={(e) => {
                              const newProducts = [...products];
                              newProducts[index].quantity = e.target.value;
                              setProducts(newProducts);
                            }}
                            className="w-20 px-2 py-1 border rounded-md focus:outline-none"
                            min="0"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white py-2 px-4 rounded-md"
                >
                  Submit Return
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
    </div>
  );
}
