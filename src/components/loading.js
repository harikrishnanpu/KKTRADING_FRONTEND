import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="text-center">
        <svg
          className="animate-spin h-8 w-8 text-white mx-auto mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <p className="text-xs text-white">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
