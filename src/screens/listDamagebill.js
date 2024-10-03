import React, { useState, useEffect } from 'react';
import Axios from 'axios';

export default function DamagedDataScreen() {
  const [damagedData, setDamagedData] = useState([]);

  useEffect(() => {
    const fetchDamagedData = async () => {
      try {
        const { data } = await Axios.get('/api/returns/damage/getDamagedData');
        setDamagedData(data);
      } catch (err) {
        console.error('Error fetching damaged data', err);
      }
    };

    fetchDamagedData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
        Damaged Items Overview
      </h2>

      {/* Table layout for larger screens */}
      <div className="hidden md:block">
        <table className="w-full border-collapse border border-gray-200 rounded-lg shadow-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-4 text-left border-b-2">Item ID</th>
              <th className="p-4 text-left border-b-2">Item Name</th>
              <th className="p-4 text-left border-b-2">Quantity</th>
              <th className="p-4 text-left border-b-2">Price</th>
              <th className="p-4 text-left border-b-2">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {damagedData.map((damage, index) => (
              <tr key={index} className="hover:bg-gray-100 transition duration-150">
                <td className="p-4 border-b">{damage.item_id}</td>
                <td className="p-4 border-b">{damage.name}</td>
                <td className="p-4 border-b">{damage.quantity}</td>
                <td className="p-4 border-b">{damage.price ? `$${damage.price.toFixed(2)}` : 'N/A'}</td>
                <td className="p-4 border-b">{new Date(damage.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card layout for mobile screens */}
      <div className="md:hidden grid gap-4">
        {damagedData.map((damage, index) => (
          <div key={index} className="p-4 border rounded-lg shadow-lg bg-white">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{damage.name}</h3>
            <p className="text-gray-600">
              <strong>Item ID:</strong> {damage.item_id}
            </p>
            <p className="text-gray-600">
              <strong>Quantity:</strong> {damage.quantity}
            </p>
            <p className="text-gray-600">
              <strong>Price:</strong> {damage.price ? `$${damage.price.toFixed(2)}` : 'N/A'}
            </p>
            <p className="text-gray-600">
              <strong>Date:</strong> {new Date(damage.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
