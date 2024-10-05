import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { deleteProduct } from '../actions/productActions';
import { useDispatch } from 'react-redux';

const ProductListPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});
  const [isProductSelected, setIsProductSelected] = useState(false);
  const dispatch = useDispatch();

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


  const deleteHandler = (product) => {
    if (window.confirm('Are you sure to delete?')) {
      dispatch(deleteProduct(product._id));
      navigate('/')
    }
  };

  const loadItem = async (itemId) => {
    try {
      const { data: product } = await axios.get(`/api/products/itemId/${itemId}`);
      if (product) {
        setProducts([product]); // Set selected product in the array
        setIsProductSelected(true); // Show the second section
      }
    } catch (error) {
      console.error('Error loading product', error);
    }
  };

  const handleEditClick = (product) => {
    navigate(`/product/${product._id}/edit`)
    setEditingProductId(product._id);
    setEditableProduct(product);
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
    <div>

<div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>

    
    <div className="container mx-auto p-8">
      <h1 className="text-xl font-bold mb-12 text-center text-red-600">Product Management</h1>

      {/* First Section: Search */}
      {!isProductSelected && (
        <div className="bg-white text-center p-6 rounded-lg shadow-lg border w-full lg:w-1/2 mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Search Products</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by item ID or name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border mt-2 rounded-lg shadow-md max-h-56 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion._id}
                    className="p-3 hover:bg-red-50 cursor-pointer"
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
        </div>
      )}

      {/* Second Section: Product Details */}
      {isProductSelected && products.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-12">
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
                  placeholder="Item ID"
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
                  className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <div key={product._id} className="bg-white border p-6 rounded-lg shadow-lg">
                <img
                  src={`https://kktrading-backend.onrender.com${product.image}` || '/images/placeholder.png'}
                  alt={product.image}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-lg font-semibold text-gray-800">ID: {product.item_id}</h2>
                <h2 className="text-2xl font-semibold text-gray-800">{product.name}</h2>
                <p className="text-gray-500 mt-1">Brand: {product.brand}</p>
                <p className="text-gray-500 mt-1">Category: {product.category}</p>
                <p className="text-gray-600 mt-2 text-xl font-semibold">${product.price}</p>
                <p className={`${product.countInStock == 0 ? 'text-red-500' : product.countInStock < 10 ? 'text-yellow-500' : 'text-gray-500'} font-bold `}>Stock: {product.countInStock}</p>
                <div className='flex justify-between'>
                <button
                  onClick={() => handleEditClick(product)}
                  className="w-2/3 mt-4 font-bold py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Edit
                </button>

                <button
                        type="button"
                        className="bg-red-500 text-white py-2 px-5 rounded-lg mx-1 hover:bg-red-600 transition-all duration-200 shadow"
                        onClick={() => deleteHandler(product)}
                      >
                        <i className='fa fa-trash'/>
                      </button>
                      </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
    </div>
  );
};

export default ProductListPage;
