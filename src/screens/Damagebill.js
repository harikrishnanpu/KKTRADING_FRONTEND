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
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Damage Bill</h2>
        <form onSubmit={handleSubmitDamageBill} className="space-y-6">
          <div>
            <label className="block text-gray-700">User Name</label>
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
            <div className="mb-4">
              <h3 className="text-lg font-bold">Selected Product: {selectedProduct.name}</h3>
              <label className="block text-gray-700">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none"
                min="1"
              />
              <button
                type="button"
                onClick={handleAddDamagedItem}
                className="mt-2 bg-blue-500 text-white py-2 px-4 rounded-md"
              >
                Add Damaged Item
              </button>
            </div>
          )}
          {damagedItems.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-2">Added Damaged Items</h3>
              <ul className="list-disc ml-5">
                {damagedItems.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    {item.name} - Quantity: {item.quantity}
                    <button
                      onClick={() => handleRemoveDamagedItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="submit"
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md"
          >
            Submit Damage Bill
          </button>
        </form>
      </div>
    </div>
  );
}
