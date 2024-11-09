import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../screens/api';
import Product from './Product';

export default function SearchBox() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Load recent searches from localStorage on component mount
    const storedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(storedSearches);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (name.length > 0) {
        try {
          const { data } = await api.get(`/api/products/searchform/search?q=${name}`);
          setSuggestions(data);
        } catch (error) {
          console.error('Error fetching suggestions', error);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [name]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (name.trim() === '') {
      return;
    }
    handleSearch(name);
  };

  const handleSearch = async (searchTerm) => {
    try {
      // Fetch product details to store in recent searches only if selecting a suggestion
      if (suggestions.length > 0) {
        const selectedProduct = suggestions.find((product) => product.name === searchTerm);
        if (selectedProduct) {
          const updatedSearches = [
            {
              _id: selectedProduct._id,
              name: selectedProduct.name,
              image: selectedProduct.image,
              brand: selectedProduct.brand,
              category: selectedProduct.category,
            },
            ...recentSearches.filter((item) => item._id !== selectedProduct._id),
          ].slice(0, 6);
          setRecentSearches(updatedSearches);
          localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        }
      }
    } catch (error) {
      console.error('Error fetching product details for recent searches', error);
    }

    setName(searchTerm);
    setSuggestions([]);
    setShowSuggestions(false);
    const cleanName = searchTerm.replace(/\s*\(.*?\)\s*/g, '').trim();
    navigate(`/search/name/${cleanName}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(name);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion.name);
  };

  const handleRecentSearchClick = (recent) => {
    handleSearch(recent.name);
  };

  return (
    <div className="relative w-full flex">
      {/* Search Input */}
      <input
        onKeyDown={handleKeyPress}
        onChange={(e) => setName(e.target.value)}
        value={name}
        type="text"
        id="simple-search" autoComplete="off"
        className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-red-500 focus:border-red-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-300"
        placeholder="Search Products"
        required
        onFocus={() => setShowSuggestions(true)}
      />
      <button
        onClick={()=> navigate('/search/name/')}
        className="px-2.5 mx-2 ms-2 text-xs font-medium text-white bg-red-600 rounded-lg border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
      >
        <svg
          className="w-4 h-4"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
        <span className="sr-only">Search</span>
      </button>

      {/* Suggestions Overlay */}
      {showSuggestions && (
  <div className={`fixed inset-0 bg-white z-30 overflow-auto ${showSuggestions ? 'animate-slide-up' : 'animate-slide-down'}`}>
          {/* Mini Navbar */}
          <div className='flex py-2 px-4 justify-between'>
            <h1 className="text-lg font-bold text-red-600">KK TRADING</h1>
            <button
              className="text-gray-500 text-sm hover:text-gray-700 ml-4 transition-transform transform hover:scale-105"
              onClick={() => setShowSuggestions(false)}
            >
              Close
            </button>
            </div>
          <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-200 bg-white shadow-md">
            <input
              onKeyDown={handleKeyPress}
              onChange={(e) => setName(e.target.value)}
              value={name}
              type="text"
              id="expanded-search" autoComplete="off"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-red-500 focus:border-red-500 block w-full max-w-md ps-10 p-2.5"
              placeholder="Search Products"
              required
            />
          </div>
          
          {/* Suggestions and Recent Searches */}
          <div className="mt-4 px-4">
          {recentSearches.length === 0 && suggestions.length === 0 && <p className='text-xs text-center mt-40 text-gray-400 italic mb-10'>No Recent Searches..</p>}
            {recentSearches.length > 0 && suggestions.length === 0 && <p className='text-xs text-gray-400 italic mb-10'>Recent Searches</p>}
            { suggestions.length > 0 && <p className='text-xs text-gray-400 italic mb-10'>Similar Suggestions</p>}
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion._id}
                    className="flex flex-col items-center  px-2  transition-transform transform cursor-pointer text-xs bg-white animate-fade-in"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Product product={suggestion} />
                  </div>
                ))
              ) : (
                recentSearches.map((recent) => (
                  <div
                    key={recent._id}
                    className="flex flex-col items-center  px-2  transition-transform transform cursor-pointer text-xs bg-white animate-fade-in"
                    onClick={() => handleRecentSearchClick(recent)}
                  >
                    <Product product={recent} />
                  </div>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}