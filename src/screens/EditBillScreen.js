import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';

export default function EditBillScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
  
    const [selectedBillingNo, setSelectedBillingNo] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [salesmanName, setSalesmanName] = useState('');
    const [billAmount, setBillAmount] = useState('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [products, setProducts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [billId, setBillId] = useState('');
    const [error, setError] = useState('');
    const [itemId, setItemId] = useState('');
    const [step, setStep] = useState(0);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [searchProduct, setSearchProduct] = useState(null);
    const [filterText, setFilterText] = useState('');
  
    // Fetch billing suggestions based on input
    const fetchBillingSuggestions = async (query) => {
      try {
        const { data } = await api.get(`/api/billing/billing/suggestions?search=${query}`);
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
        const { data } = await api.get(`/api/billing/${id}`);
        setInvoiceNo(data.invoiceNo);
        setInvoiceDate(new Date(data.invoiceDate).toISOString().split('T')[0]);
        setExpectedDeliveryDate(new Date(data.expectedDeliveryDate).toISOString().split('T')[0]);
        setCustomerName(data.customerName);
        setSalesmanName(data.salesmanName);
        setBillAmount(data.billingAmount);
        setCustomerAddress(data.customerAddress);
        setSelectedBillingNo(data.invoiceNo);
        setSuggestions([]);
        setBillId(data._id);
        setProducts(data.products);
        setStep(1);
      } catch (err) {
        setError('Error fetching billing details');
      }
    };
  
    useEffect(() => {
      if (id) {
        fetchBillingDetails(id);
      }
    }, [id]);
  
    const handleBillSubmit = async () => {
      if (!customerName || !customerAddress || !salesmanName || !invoiceDate || !invoiceNo || !expectedDeliveryDate) {
        alert('Please fill all required fields and add at least one product.');
        return;
      }
  
      const billingData = {
        invoiceNo,
        invoiceDate,
        expectedDeliveryDate,
        salesmanName,
        billingAmount: billAmount,
        customerName,
        customerAddress,
        products: products.map(({ item_id, name, price, quantity, category, brand }) => ({
          item_id,
          name,
          price,
          quantity,
          category,
          brand
        })),
      };
  
      try {
        await api.post(`/api/billing/edit/${billId}`, billingData);
        alert('Billing data submitted successfully!');
        navigate('/bills');
  
        // Reset all states
        setInvoiceNo('');
        setSelectedBillingNo('');
        setInvoiceDate('');
        setCustomerName('');
        setCustomerAddress('');
        setProducts([]);
        setStep(0);
      } catch (error) {
        alert(`There was an error submitting the billing data. Please try again. ${error.message}`);
      }
    };
  
    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    
    const deleteProduct = (indexToDelete) => {
        // Set quantity of the product at indexToDelete to 0
        const updatedProducts = products.map((p, index) =>
          index === indexToDelete ? { ...p, quantity: 0 } : p
        );
      
        setProducts(updatedProducts);
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
        addProductByItemId(suggestions[selectedSuggestionIndex]);
        setSelectedSuggestionIndex(-1);
      }
    };
  
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
  
    const handleAddProductWithQuantity = () => {
      if (products.some((product) => product.item_id === selectedProduct.item_id)) {
        alert('This product is already added. Adjust quantity instead.');
        return;
      }
  
      const productWithQuantity = { ...selectedProduct, quantity };
      setProducts((prevProducts) => [...prevProducts, productWithQuantity]);
  
      // Reset fields
      setSelectedProduct(null);
      setQuantity(1);
      setSearchProduct(null);
    };
  
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

  return (
    <div>
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Billing Updation And Submission</p>
  </div>
  <i className="fa fa-list text-gray-500" />
</div>

    <div className="container mx-auto py-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className='flex justify-between'>
        <h2 className="text-lg font-bold text-red-600 mb-4">Editing Bill : {selectedBillingNo}</h2>
        <div className='text-right'>

        <button
                  onClick={() => handleBillSubmit()}
                  className="bg-red-600 font-bold text-sm text-white py-2 px-4 rounded-md"
                  >
                  Submit
                </button>
                <p className='text-xs text-gray-300 italic mt-1'>Please Fill All The Fields Before Submission</p>
                    </div>

        </div>
        <div className="space-y-6">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Select Billing No</h3>
              <label className="block text-gray-700">Billing Invoice No.</label>
              <input
                type="text"
                value={selectedBillingNo}
                onChange={(e) => setSelectedBillingNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                placeholder="Enter or select Billing Invoice No"
              />
              <div className="mt-2 divide-y bg-white shadow-md rounded-md max-h-32 overflow-y-auto">
                {suggestions.map((billing) => (
                  <div
                    key={billing.invoiceNo}
                    onClick={() => {
                      setSelectedBillingNo(billing.invoiceNo);
                      fetchBillingDetails(billing._id);
                      setSuggestions([]);
                    }}
                    className="cursor-pointer flex justify-between p-2 hover:bg-gray-100"
                  >
                    <span>
                    {billing.invoiceNo}
                    </span>
                    <i className='fa text-gray-400 fa-arrow-right' />
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
              {/* <h3 className="text-lg font-semibold text-gray-800"></h3> */}
              <div className="grid mt-5 grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs mb-1 text-gray-700">Invoice No</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                    placeholder="Enter Billing No"
                  />
                </div>
            
                <div>
                  <label className="block font-bold text-xs mb-1 text-gray-700">Salesman Name</label>
                  <input
                    type="text"
                    value={salesmanName}
                    onChange={(e) => setSalesmanName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                    placeholder="Enter Salesman Name"
                  />
                </div>


                <div>
                  <label className="block font-bold text-xs mb-1 text-gray-700">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-red-500 text-xs font-bold text-white py-2 px-6 rounded-md"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>

              <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Bill Amount</label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                    placeholder="Enter Bill Amount"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs mb-1 text-gray-700">Exp. Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>

              <div>
                <label className="block font-bold text-xs mb-1 text-gray-700">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                  placeholder="Enter Customer Name"
                />
              </div>

              <div>
                <label className="block font-bold text-xs mb-1 text-gray-700">Customer Address</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-4 py-2 border-gray-300 border rounded-md focus:outline-none"
                  placeholder="Enter Customer Address"
                />
              </div>


              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-xs font-bold text-white py-2 px-6 rounded-md"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-red-500 text-xs font-bold text-white py-2 px-6 rounded-md"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Update Products</h3>
          
            {products.length === 0 ? (
              <p className="text-sm text-center italic text-gray-400 font-bold">No Products In This Billing</p>
            ) : (
              <div className="mt-4 overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full bg-white rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-xs border-b text-left text-gray-600 font-semibold">Product Name</th>
                      <th className="px-2 py-2 text-xs border-b text-left text-gray-600 font-semibold">Id</th>
                      <th className="px-2 py-2 text-xs border-b text-left text-gray-600 font-semibold">Price</th>
                      <th className="px-2 py-2 text-xs border-b text-left text-gray-600 font-semibold">Quantity</th>
                      <th className="px-2 py-2 text-xs border-b text-center text-gray-600 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={index} className="text-gray-700 divide-y divide-x">
                        <td className="px-2 py-2 text-xs font-bold border-b">{product.name}</td>
                        <td className="px-2 py-2 text-xs border-b">{product.item_id}</td>
                        <td className="px-2 py-2 text-xs border-b">{product.price || 'N/A'}</td>
                        <td className="px-2 py-2 text-xs border-b">
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => {
                              const newProducts = [...products];
                              newProducts[index].quantity = e.target.value;
                              setProducts(newProducts);
                            }}
                            
                            className="w-20 px-2 py-1 border rounded-md focus:outline-none"
                            min="0"
                          />
                        </td>
                        <td className="px-2 py-2 text-xs text-center border-b">
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${product.name} from the bill?`)) {
                                deleteProduct(index,product);
                              }
                            }}
                            className="text-red-500 font-bold hover:text-red-700"
                          >
                            <i className="fa fa-trash" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          
            {/* Add Product Section */}
            <div className="mb-6">
              <div>
                <label className="block text-gray-700 text-xs font-bold ml-1">Item ID</label>
                <input
                  type="text"
                  value={itemId}
                  onKeyDown={handleSuggestionKeyDown}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full px-4 py-2 mt-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                  placeholder="Enter Item Id or Name"
                />
                {error && <p className="text-red-500">{error}</p>}
          
                {/* Suggestions */}
                <div className="mt-2">
                  <p className="text-xs ml-2 italic text-gray-300 mb-2">Similar suggestions</p>
                  {suggestions.map((suggestion, index) => (
                    <div key={suggestion.item_id} className="bg-gray-50 p-2 rounded-md">
                      <div
                        onClick={() => addProductByItemId(suggestion)}
                        className={`p-2 text-xs rounded-md cursor-pointer hover:bg-gray-100 ${
                          index === selectedSuggestionIndex ? 'bg-gray-200' : ''
                        }`}
                      >
                        {suggestion.name} - {suggestion.item_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          
              {/* Selected Product and Quantity Input */}
              {selectedProduct && (
                <div className="p-4 border border-gray-200 rounded-lg shadow-md bg-white mt-4">
                  <div className="mb-2 relative text-gray-700 flex justify-between">
                    <p className="text-xs font-bold truncate">
                      {selectedProduct.name} - {selectedProduct.item_id}
                    </p>
                    <p
                      className={`text-xs font-bold px-2 py-1 rounded-xl ${
                        selectedProduct.countInStock > 10 ? 'bg-green-300 text-green-500' : 'bg-yellow-300 text-yellow-500'
                      }`}
                    >
                      {selectedProduct.countInStock > 10 ? 'In Stock' : 'Moving Out'}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-gray-500">In stock: {selectedProduct.countInStock}</p>
          
                  <div className="mb-4 mt-2 flex justify-between">
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct.countInStock}
                      value={quantity}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
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
                      <i className="fa fa-plus" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          
            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-500 text-xs font-bold text-white py-2 px-6 rounded-md"
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
