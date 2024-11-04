import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array(10).fill().map((_, index) => (
        <div
          key={index}
          className="animate-pulse flex flex-col items-center border border-gray-200 rounded-lg p-4 shadow-lg"
        >
          <div className="bg-gray-300 w-full h-40 rounded-md mb-4"></div>
          <div className="bg-gray-300 w-3/4 h-5 rounded-md mb-2"></div>
          <div className="bg-gray-300 w-1/2 h-5 rounded-md"></div>
        </div>
      ))}
    </div>
  );
}
