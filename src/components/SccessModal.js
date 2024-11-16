// SuccessModal.jsx
import React from 'react';

export default function SuccessModal({ message }) {
  return (
    <div className="fixed top-10 right-10 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      <p className="text-xs font-bold">{message}</p>
    </div>
  );
}
