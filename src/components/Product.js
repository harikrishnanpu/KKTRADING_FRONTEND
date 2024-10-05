import React, { useState } from 'react';

export default function Product({ product }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white shadow-md rounded-lg p-3 flex flex-col items-center space-y-2 transition-transform hover:scale-105 hover:shadow-lg w-full sm:w-48">
      {/* Product Image */}
      <a href={`/product/${product._id}`} className="w-full">
        <img
          onError={() => setImageError(true)}
          className={`object-cover rounded-md w-full h-32 ${imageError ? 'hidden' : ''}`}
          src={`https://kktrading-backend.onrender.com${product.image}`}
          alt={product.image}
        />
        {imageError && (
          <div className="flex justify-center items-center w-full h-20 bg-gray-200 rounded-md">
            <p className="text-gray-500 text-sm">No image</p>
          </div>
        )}
      </a>

      {/* Product Details */}
      <div className="w-full text-center">
        <a href={`/product/${product._id}`}>
          <h2 className="text-sm font-medium text-gray-800 truncate w-full">{product.name}</h2>
        </a>

        <div className="text-xs text-gray-500 mt-1 truncate">{product.brand}</div>

        {/* <div className="text-md font-semibold text-indigo-600 mt-1">${product.price}</div> */}
      </div>
    </div>
  );
}
