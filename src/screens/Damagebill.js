import React, { useState, useEffect } from 'react';
import Axios from 'axios';

export default function DamageBillPage() {
  const [userName, setUserName] = useState('');
  const [itemId, setItemId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [damagedItems, setDamagedItems] = useState([]);
  const [error, setError] = useState('');

  const fetchSuggestions = async (query) => {
    try {
      const { data } = await Axios.get(`/api/products/search/itemId?query=${query}`);
      setSuggestions(data);
    } catch (err) {
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

  const addProductByItemId = async (product) => {
    try {
      const { data } = await Axios.get(`/api/products/itemId/${product.item_id}`);
      setSelectedProduct(data);
      setQuantity(1);
      setItemId('');
      setSuggestions([]);
    } catch (err) {
      setError('Product not found or server error.');
    }
  };

  const handleAddDamagedItem = () => {
    if (!selectedProduct) return;

    const damagedItem = { ...selectedProduct, quantity };
    setDamagedItems([...damagedItems, damagedItem]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveDamagedItem = (index) => {
    const newDamagedItems = damagedItems.filter((_, i) => i !== index);
    setDamagedItems(newDamagedItems);
  };

  const handleSubmitDamageBill = async (e) => {
    e.preventDefault();

    if (!userName || damagedItems.length === 0) {
      alert('Please fill all required fields and add at least one damaged item.');
      return;
    }

    const damageData = {
      userName,
      damagedItems: damagedItems.map(({ item_id, name, price, quantity }) => ({
        item_id,
        name,
        price,
        quantity,
      })),
    };

    try {
      await Axios.post('/api/returns/damage/create', damageData);
      alert('Damage bill submitted successfully!');
      // Reset states
      setUserName('');
      setDamagedItems([]);
    } catch (error) {
      alert('There was an error submitting the damage bill. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className='flex justify-between mb-8'>
        <h2 className="text-lg font-bold truncate"><i className='fa fa-list' /> Damage Bill</h2>
        <div className='text-right'>
        <button
            onClick={(e)=>{ e.preventDefault();  handleSubmitDamageBill(e) }}
            className="bg-red-500 font-bold text-white py-2 px-4 rounded-md"
          >
            Submit
          </button>
          <p className='text-xs truncate mt-1 text-gray-400'>Please check all fields are filled before submit</p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700">Biller Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none"
              placeholder="Enter User Name"
            />
          </div>
          <div>
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
            <div className="mb-4 text-right">
              <div className='bg-gray-100 p-4 rounded-lg mb-2 mt-2'>
              <p className="text-sm text-left font-bold">ID: {selectedProduct.item_id}</p>
              <p className="text-sm text-left truncate mt-1">Selected Product: {selectedProduct.name}</p>
              </div>
              <label className="block text-left text-gray-700">Quantity</label>
              <input
                type="number"
                value={quantity}
                onKeyDown={(e)=>{ e.preventDefault(); if(e.key == 'Enter')  handleAddDamagedItem() }}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                min="1"
              />
              <button
                type="button"
                onClick={handleAddDamagedItem}
                className="mt-2 bg-red-500 text-white py-2 px-4 rounded-md"
              >
               <i className='fa fa-plus' />
              </button>
            </div>
          )}
          {damagedItems.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md mt-10 font-bold mb-2">Added Damaged Items</h3>
              <ul className="list-disc">
                {damagedItems.map((item, index) => (
                  <li key={index} className="mt-5 bg-gray-100 p-4 rounded-lg">
                   <p className='text-sm font-bold'>ID: {item.item_id}</p>
                   <p className='text-sm'>{item.name}</p>
                   <div className='flex justify-between'>
                   <p className='text-sm'>Quantity: {item.quantity}</p>
                    <button
                      onClick={() => handleRemoveDamagedItem(index)}
                      className="text-red-500 hover:text-red-700"
                      >
                      <i className='fa fa-trash' />
                    </button>
                      </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
