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
      fetchBillingSuggestions(selectedBillingNo);
  }, [selectedBillingNo]);

  // Fetch full billing details once the invoice number is selected or typed
  const fetchBillingDetails = async (id) => {
    try {
      const { data } = await Axios.get(`/api/billing/${id}`);
      setCustomerName(data.customerName);
      setCustomerAddress(data.customerAddress);
      setProducts(data.products.map(product => ({ ...product, quantity: 1 }))); // Set initial quantity to 1
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

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Product Return</h2>
        <form onSubmit={handleReturnSubmit} className="space-y-6">
          {step === 0 && (
            <div>
              <h3 className="text-lg font-bold">Step 1: Select Billing No</h3>
              <label className="block text-gray-700">Billing Invoice No</label>
              <input
                type="text"
                value={selectedBillingNo}
                onChange={(e) => setSelectedBillingNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                placeholder="Enter or select Billing Invoice No"
              />
              <div className="mt-2 bg-white shadow-md">
                {suggestions.map((billing) => (
                  <div
                    key={billing.invoiceNo}
                    onClick={() => {
                      setSelectedBillingNo(billing.invoiceNo);
                      fetchBillingDetails(billing._id)
                      setSuggestions([]);
                    }}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                  >
                    {billing.invoiceNo}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={fetchBillingDetails}
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
              <h3 className="text-lg font-bold mt-4">Step 3: Customer Information</h3>
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
              <h3 className="text-lg font-bold mt-4">Step 4: Products</h3>
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
                            value={product.quantity}
                            onChange={(e) => {
                              const newProducts = [...products];
                              newProducts[index].quantity = e.target.value;
                              setProducts(newProducts);
                            }}
                            className="w-20 px-2 py-1 border rounded-md focus:outline-none"
                            min="1"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="submit"
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
