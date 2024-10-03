import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AllPurchases() {
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    // Fetch all purchases from the server
    axios.get('/api/products/purchases/all')
      .then(response => setPurchases(response.data))
      .catch(error => console.error('Error fetching purchase data:', error));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">All Purchase Bills</h1>
      
      {/* Responsive: Cards for small screens, Table for large screens */}
      <div className="block lg:hidden">
        {/* Cards for Small Screens */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {purchases.map(purchase => (
            <div key={purchase._id} className="bg-white shadow-lg rounded-lg p-6 border">
              <h2 className="text-lg font-semibold mb-2">Seller: {purchase.sellerName}</h2>
              <p><strong>Invoice No:</strong> {purchase.invoiceNo}</p>
              <p><strong>Purchase Date:</strong> {new Date(purchase.createdAt).toLocaleDateString()}</p>
              
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Items:</h3>
                {purchase.items.map((item, index) => (
                  <div key={index} className="bg-gray-100 p-2 mb-2 rounded-md">
                    <p><strong>Name:</strong> {item.name}</p>
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block">
        {/* Table for Large Screens */}
        <table className="min-w-full bg-white shadow-lg rounded-lg border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Seller Name</th>
              <th className="py-2 px-4 border-b">Invoice No</th>
              <th className="py-2 px-4 border-b">Date</th>
              <th className="py-2 px-4 border-b">Items</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(purchase => (
              <tr key={purchase._id}>
                <td className="py-2 px-4 border-b">{purchase.sellerName}</td>
                <td className="py-2 px-4 border-b">{purchase.invoiceNo}</td>
                <td className="py-2 px-4 border-b">{new Date(purchase.createdAt).toLocaleDateString()}</td>
                <td className="py-2 px-4 border-b">
                  <ul className="list-disc ml-5">
                    {purchase.items.map((item, index) => (
                      <li key={index}>
                        {item.name} - {item.quantity}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
