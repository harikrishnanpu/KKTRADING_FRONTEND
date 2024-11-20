// src/components/ErrorModal.jsx
import React from "react";

export default function ErrorModal({ message, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-red-600 font-bold text-sm">Error</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            &times;
          </button>
        </div>
        <p className="mt-4 text-gray-700 text-sm">{message}</p>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
