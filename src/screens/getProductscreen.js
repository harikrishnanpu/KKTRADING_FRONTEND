import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);  // Initialize as an array
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      try {
        const { data } = await axios.get(`/api/products/searchform/search?q=${query}`);
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleEditClick = (product) => {
    setEditingProductId(product._id);
    setEditableProduct(product);
  };

  const loadItem = async (itemId) => {
    try {
      const { data: product } = await axios.get(`/api/products/itemId/${itemId}`);
      if (product) {
        setProducts([product]);  // Ensure it's set as an array
      }
    } catch (error) {
      console.error('Error loading product', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(`/api/products/get-item/${editingProductId}`, editableProduct);
      const updatedProducts = products.map((product) =>
        product._id === editingProductId ? editableProduct : product
      );
      setProducts(updatedProducts);
      setEditingProductId(null);
    } catch (error) {
      console.error('Error updating product', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Product Management</h1>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by item ID or name..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border mt-2 rounded-lg shadow-md max-h-56 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion._id}
                className="p-3 hover:bg-blue-50 cursor-pointer"
                onClick={() => {
                  loadItem(suggestion.item_id); // Ensure to use item_id
                  setSearchQuery(suggestion.name);
                  setSuggestions([]);
                }}
              >
                {suggestion.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) =>
            editingProductId === product._id ? (
              <div key={product._id} className="bg-white border p-6 rounded-lg shadow-lg">
                <input
                  type="text"
                  name="name"
                  value={editableProduct.name}
                  onChange={handleInputChange}
                  className="w-full mb-4 p-2 border rounded-lg"
                  placeholder="Product Name"
                />
                <input
                  type="text"
                  name="brand"
                  value={editableProduct.brand}
                  onChange={handleInputChange}
                  className="w-full mb-4 p-2 border rounded-lg"
                  placeholder="Brand"
                />

                <input
                  type="text"
                  name="item_id"
                  value={editableProduct.item_id}
                  onChange={handleInputChange}
                  className="w-full mb-4 p-2 border rounded-lg"
                  placeholder="itemId"
                />

                <input
                  type="text"
                  name="category"
                  value={editableProduct.category}
                  onChange={handleInputChange}
                  className="w-full mb-4 p-2 border rounded-lg"
                  placeholder="Category"
                />
                <input
                  type="number"
                  name="price"
                  value={editableProduct.price}
                  onChange={handleInputChange}
                  className="w-full mb-4 p-2 border rounded-lg"
                  placeholder="Price"
                />
                <input
                  type="number"
                  name="countInStock"
                  value={editableProduct.countInStock}
                  onChange={handleInputChange}
                  className="w-full mb-4 p-2 border rounded-lg"
                  placeholder="Stock Quantity"
                />
                <button
                  onClick={handleSaveChanges}
                  className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <div key={product._id} className="bg-white border p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <img
                  src={product.image || '/images/placeholder.png'}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-semibold text-gray-800">{product.name}</h2>
                <p className="text-gray-500 mt-1">Brand: {product.brand}</p>
                <p className="text-gray-500 mt-1">Category: {product.category}</p>
                <p className="text-gray-600 mt-2 text-xl font-semibold">${product.price}</p>
                <p className="text-gray-500">Stock: {product.countInStock}</p>
                <button
                  onClick={() => handleEditClick(product)}
                  className="w-full mt-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Edit
                </button>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="text-center text-gray-600">No products found. Try searching for something else.</p>
      )}
    </div>
  );
};

export default ProductListPage;
