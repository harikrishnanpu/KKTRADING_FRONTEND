import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function DamageBillPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [remark, setRemark] = useState('');
  const [itemId, setItemId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [damagedItems, setDamagedItems] = useState([]);
  const [error, setError] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const [step, setStep] = useState(1);

  // Refs for input fields to enable Enter navigation
  const userNameRef = useRef();
  const itemIdRef = useRef();
  const remarkRef = useRef();
  const itemQuantityRef = useRef();

  useEffect(() => {
    if (itemId.length >= 2) {
      fetchSuggestions(itemId);
    } else {
      setSuggestions([]);
    }
  }, [itemId]);

  const fetchSuggestions = async (query) => {
    try {
      const { data } = await api.get(`/api/products/search/itemId?query=${query}`);
      setSuggestions(data);
    } catch (err) {
      setSuggestions([]);
      setError('Error fetching suggestions');
      setShowErrorMessage('Error fetching suggestions');
      setTimeout(() => setShowErrorMessage(''), 3000);
    }
  };

  const addProductByItemId = async (product) => {
    try {
      setError('');
      const { data } = await api.get(`/api/products/itemId/${product.item_id}`);
      setSelectedProduct(data);
      setQuantity(1);
      setItemId('');
      setSuggestions([]);
    } catch (err) {
      setError('Product not found or server error.');
      setShowErrorMessage('Product not found or server error.');
      setTimeout(() => setShowErrorMessage(''), 3000);
    }
  };

  const handleAddDamagedItem = () => {
    if (damagedItems.some((item) => item.item_id === selectedProduct.item_id)) {
      alert('This product is already added. Adjust quantity instead.');
      return;
    }
    const damagedItem = { ...selectedProduct, quantity };
    setDamagedItems([...damagedItems, damagedItem]);
    setShowSuccessMessage('Product added successfully!');
    setTimeout(() => setShowSuccessMessage(''), 3000);
    setSelectedProduct(null);
    setQuantity(1);
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

  function changeRef(e, nextRef) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  }

  const handleRemoveDamagedItem = (index) => {
    const newDamagedItems = damagedItems.filter((_, i) => i !== index);
    setDamagedItems(newDamagedItems);
  };

  const handleSubmitDamageBill = async (e) => {
    e.preventDefault();
    if (!userName || damagedItems.length === 0) {
      setError('Please fill all required fields and add at least one damaged item.');
      setShowErrorMessage('Please fill all required fields and add at least one damaged item.');
      setTimeout(() => setShowErrorMessage(''), 3000);
      return;
    }
    const damageData = {
      userName,
      remark,
      damagedItems: damagedItems.map(({ item_id, name, price, quantity }) => ({
        item_id,
        name,
        price,
        quantity,
      })),
    };
    try {
      await api.post('/api/returns/damage/create', damageData);
      setShowSuccessMessage('Damage bill submitted successfully!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
      setUserName('');
      setRemark('');
      setDamagedItems([]);
    } catch (error) {
      setError('There was an error submitting the damage bill. Please try again.');
      setShowErrorMessage('There was an error submitting the damage bill. Please try again.');
      setTimeout(() => setShowErrorMessage(''), 3000);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Top Banner */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Damage Billing</p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-8">
        <div className='flex justify-between mb-4'>
          <p className='text-sm font-bold mb-5 text-gray-500'> <i className='fa fa-list'/> Damage Bill</p>
          <div className='text-right'>
            <button
              onClick={handleSubmitDamageBill}
              className="mb-2 bg-red-500 text-sm text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600"
            >
              Submit Damage Bill
            </button>
            <p className='text-xs text-gray-400'>Fill all fields before submission</p>
          </div>
        </div>

        {/* User Information */}
        <div className="mb-6">
          <label className="block text-xs text-gray-700">Biller Name</label>
          <input
            type="text"
            ref={userNameRef}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => changeRef(e, remarkRef)}
            className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
            placeholder="Enter Biller Name"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-700">Damage Remark</label>
          <input
            type="text"
            ref={remarkRef}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            onKeyDown={(e) => changeRef(e, itemIdRef)}
            className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
            placeholder="Enter Damage Remarks"
          />
        </div>

        {/* Add Products */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-700">Item ID</label>
          <input
            type="text"
            ref={itemIdRef}
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            onKeyDown={handleSuggestionKeyDown}
            className="w-full px-4 py-2 mt-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
            placeholder="Enter Item Id or Name"
          />
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <div className="mt-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.item_id}
                onClick={() => addProductByItemId(suggestion)}
                className={`p-2 text-xs rounded-md cursor-pointer hover:bg-gray-100 ${index === selectedSuggestionIndex ? 'bg-gray-200' : ''}`}
              >
                {suggestion.name} - {suggestion.item_id}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Product */}
        {selectedProduct && (
          <div className="p-4 border border-gray-200 rounded-lg shadow-md bg-white">
            <div className='flex justify-between'>
              <p className="text-xs font-bold truncate">{selectedProduct.name} - {selectedProduct.item_id}</p>
              <p className={`text-xs font-bold px-2 py-1 rounded-xl ${selectedProduct.countInStock > 10 ? 'bg-green-300 text-green-500' : 'bg-yellow-300 text-yellow-500'}`}>{selectedProduct.countInStock > 10 ? 'In Stock' : 'Moving Out'}</p>
            </div>
            <label className="block text-xs mb-2 text-gray-700">Quantity</label>
            <div className='flex justify-between'>
            <input
  type="number"
  ref={itemQuantityRef}
  min={1}
  value={quantity}
  onChange={(e) => {
    const value = Math.min(selectedProduct.countInStock, Number(e.target.value));
    setQuantity(value);
  }}
  onKeyDown={(e) => e.key === 'Enter' && handleAddDamagedItem()}
  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-500 focus:ring-red-500"
/>

              <button
                className="bg-red-500 text-xs ml-2 text-white font-bold py-2 px-4 rounded focus:outline-none hover:bg-red-600"
                onClick={handleAddDamagedItem}
              >
                <i className='fa fa-plus' />
              </button>
            </div>
          </div>
        )}

        {/* Added Damaged Items */}
        {damagedItems.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-2">Added Damaged Items</h2>
            <div className="overflow-x-auto rounded-md">
              <table className="table-auto w-full border-collapse rounded-xl shadow-md">
                <thead>
                  <tr className="bg-red-400 text-white text-xs">
                    <th className="px-2 py-2 text-left">
                      <i className="fa fa-cube" aria-hidden="true"></i> Name
                    </th>
                    <th className="px-2 py-3 text-left">Qty</th>
                    <th className="px-4 py-2 text-center">
                      <i className="fa fa-trash " aria-hidden="true"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {damagedItems.map((item, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'} border-b hover:bg-red-50 transition duration-150`}>
                      <td className="px-4 py-4 text-xs font-medium">{item.name} - {item.item_id}</td>
                      <td className="px-2 py-2 text-xs text-center">{item.quantity}</td>
                      <td className="px-2 py-2 text-xs text-center">
                        <button
                          onClick={() => handleRemoveDamagedItem(index)}
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
          </div>
        )}
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 bg-green-500 text-white px-4 py-2 rounded shadow-md">
          {showSuccessMessage}
        </div>
      )}

      {/* Error Message */}
      {showErrorMessage && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 bg-red-500 text-white px-4 py-2 rounded shadow-md">
          {showErrorMessage}
        </div>
      )}
    </div>
  );
}
