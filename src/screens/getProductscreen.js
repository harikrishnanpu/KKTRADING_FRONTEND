import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteProduct } from '../actions/productActions';
import { useDispatch } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import api from './api';

const ProductListPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [soldOut,setSoldOut] = useState(null);

  const dispatch = useDispatch();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      loadItem(id);
      setSuggestions([]);
    }
  }, []);

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      try {
        const { data } = await api.get(`/api/products/searchform/search?q=${query}`);
        setSuggestions(data.length > 0 ? data : []);
        setError(data.length === 0 ? 'No products found' : null);
      } catch (error) {
        setError('Error fetching suggestions');
      }
    } else {
      setSuggestions([]);
      setError(null);
    }
  };

  const deleteHandler = (product) => {
    if (window.confirm('Are you sure to delete?')) {
      dispatch(deleteProduct(product._id));
      navigate('/');
    }
  };

  const loadItem = async (itemId) => {
    setLoading(true);
    try {
      const { data: product } = await api.get(`/api/products/itemId/${itemId}`);
      const { data } = await api.get(`api/billing/product/get-sold-out/${itemId}`);
      setProducts([product]);
      setSoldOut(data.totalQuantity);
      setIsProductSelected(true);
    } catch (error) {
      setError('Error loading product');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    navigate(`/product/${product._id}/edit`);
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
      await api.put(`/api/products/get-item/${editingProductId}`, editableProduct);
      const updatedProducts = products.map((product) =>
        product._id === editingProductId ? editableProduct : product
      );
      setProducts(updatedProducts);
      setEditingProductId(null);
    } catch (error) {
      setError('Error updating product');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Product Informations</p>
  </div>
  <i className="fa fa-box text-gray-500" />
</div>

      <div className="container mx-auto px-8 py-4">
        <div className="flex justify-between">
          <p onClick={() => navigate('/productlist/seller')} className="text-sm font-bold mb-6 text-gray-600 cursor-pointer">
            <i className="fa fa-angle-left" /> All Products
          </p>
          {products.length !== 0 && <p className="text-sm font-bold mb-6 text-gray-400">Showing Product Id: {products[0]?.item_id}</p>}
        </div>

        {!isProductSelected && (
          <div className="bg-white text-center p-6 rounded-lg shadow-lg border w-full lg:w-1/2 mx-auto">
            <h2 className="text-md font-semibold mb-4 text-red-600">Search or Edit Product</h2>
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
                      className="p-4 hover:bg-red-50 border-t-2 cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        loadItem(suggestion.item_id);
                        setSearchQuery(suggestion.name);
                        setSuggestions([]);
                      }}
                    >
                      <span className='text-sm truncate'><span className="text-xs font-bold text-gray-400">{suggestion.item_id} - </span> {suggestion.name}</span>
                      <i className='fa fa-arrow-right text-gray-500 ml-2' />
                    </li>
                  ))}
                </ul>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </div>
        )}

        {isProductSelected && products.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-1">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <i className='fa fa-spinner fa-spin' />
              </div>
            ) : (
              products.map((product) => (

                <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
    <div className="relative">
        {/* Badge for In Stock */}
        <span className={`absolute z-20 top-2 right-2 text-white text-xs font-semibold px-3 py-2 rounded-full animate-pulse shadow-lg ${product.countInStock > 10 ? 'bg-green-600' : product.countInStock === 0 ?  'bg-red-600' : ' bg-yellow-600'}`}>
            {product.countInStock > 10 ? 'In Stock' : product.countInStock === 0 ? 'Out Of Stock' : 'Moving Out' }
        </span>

        <a href={`${product.image}`}>
            <div className="relative w-full h-56 bg-gray-200 rounded-t-lg flex items-center justify-center overflow-hidden">
                {!isImageLoaded && !isError && (
                    <div className="w-full h-full bg-gray-300 animate-pulse" />
                )}
                {isError ? (
                    <span className="text-gray-500 dark:text-gray-400">No image found</span>
                ) : (
                    <img
                        className={`rounded-t-lg object-cover w-full h-full transition-transform duration-300 ease-in-out transform ${isImageLoaded ? 'scale-100' : 'scale-105'}`}
                        src={`${product.image}`}
                        alt={product.image}
                        onLoad={() => setIsImageLoaded(true)}
                        onError={() => {
                            setIsImageLoaded(false);
                            setIsError(true);
                        }}
                    />
                )}
            </div>
        </a>
    </div>

    <div className="p-6 space-y-2">
        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
            Product ID: <span className="text-gray-700 dark:text-white">{product.item_id}</span>
        </p>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white tracking-tight">
            {product.name}
        </h2>
        <div className="flex justify-between text-xs">
            <p className="text-gray-600 text-xs truncate dark:text-gray-300 font-medium">
                Brand: <span className="font-semibold text-gray-800 dark:text-white">{product.brand}</span>
            </p>
            <p className="text-gray-600 text-xs truncate dark:text-gray-300 font-medium">
                Category: <span className="font-semibold text-gray-800 dark:text-white">{product.category}</span>
            </p>
        </div>

        <div className="flex justify-between items-center border-t pt-2">
            <div className="text-xs">
                <p className="text-gray-400 uppercase font-medium mb-2">Stock Details</p>
                <p className={`font-bold dark:text-white ${product.countInStock > 10 ? 'text-gray-600' : product.countInStock === 0 ? 'text-red-600' : 'text-yellow-700'}`}>
                    In Stock: {product.countInStock}
                </p>
            </div>
            <p className="text-xs mt-5 font-semibold text-gray-500 dark:text-gray-400">
                Stock Cleared: {soldOut ? soldOut : 0}
            </p>
        </div>
        <div className='flex justify-between'>
        <p
        onClick={()=> navigate(`/product/${product._id}/edit`)}
            className="inline-flex cursor-pointer items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-900 transition-all"
        >
            Edit Product
            <i className="fa fa-arrow-right ml-2" />
        </p>

        <p
        onClick={()=> deleteHandler(product)}
            className="inline-flex cursor-pointer items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-900 transition-all">
            <i className="fa fa-trash" />
        </p>


        </div>
    </div>
</div>



                )
              )
            )}
            <a href={'/get-product'} className='text-center cursor-pointer text-xs font-bold text-gray-400'>Search Another Product ? <span className='text-blue-500'>Click Here</span></a>
          </div> 
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
