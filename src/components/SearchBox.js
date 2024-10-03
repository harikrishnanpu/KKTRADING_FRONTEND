import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SearchBox() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const submitHandler = (e) => {
    navigate(`/search/name/${name}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      navigate(`/search/name/${name}`);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (name.length > 0) {
        try {
          const { data } = await axios.get(`/api/products/searchform/search?q=${name}`);
          setSuggestions(data);
          console.log(data)
        } catch (error) {
          console.error('Error fetching suggestions', error);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [name]);

  const handleSuggestionClick = (suggestion) => {
    setName(suggestion.name);
    setSuggestions([]);
    const cleanName = suggestion.name.replace(/\s*\(.*?\)\s*/g, '').trim(); 
    navigate(`/search/name/${cleanName}`);
  };

  return (
    <div className="relative w-full flex">
      {/* Search Input */} 
        <input onKeyDown={(e)=> handleKeyPress(e)} onChange={(e)=> setName(e.target.value)} value={name} type="text" id="simple-search" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-300" placeholder="Search Products" required />
    <button onClick={submitHandler} class="px-2.5 mx-2 ms-2 text-sm font-medium text-white bg-red-600 rounded-lg border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
        </svg>
        <span class="sr-only">Search</span>
    </button>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <ul className="absolute divide-y divide-red-200 p-5 mt-20 w-full rounded-lg bg-white border border-red-300 max-h-50 overflow-auto">
          {suggestions.map((suggestion) => (
            <div className='flex hover:bg-gray-100 cursor-pointer px-2'  onClick={() => handleSuggestionClick(suggestion)}>
            <li
              key={suggestion._id}
              className="p-3 font-semibold text-gray-600 text-sm"
              >
              {suggestion.name} - {suggestion.item_id}
            </li>
          <p className='ml-auto mt-auto mb-auto text-xs text-gray-400'>{suggestion.brand}</p>
              </div>
          ))}
        </ul>
      )}
    </div>
  );
}
