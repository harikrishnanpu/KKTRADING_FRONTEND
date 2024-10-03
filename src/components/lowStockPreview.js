import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const LowStockPreview = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billings,setbillings] = useState([]);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const { data } = await axios.get('/api/products/items/low-stock-limited');
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching products');
        setLoading(false);
      }
    };

    const fetchExpectedDeliveryBillings = async () => {
        try {
          const { data } = await axios.get('/api/billing/deliveries/expected-delivery');
          setbillings(data);
          setLoading(false);
        } catch (err) {
          setError('Error fetching products');
          setLoading(false);
        }
      };

    fetchLowStockProducts();
    fetchExpectedDeliveryBillings();
  }, []);

    // Function to check if the date is today
    const isToday = (dateString) => {
        const today = new Date();
        const targetDate = new Date(dateString);
    
        // Compare only the year, month, and date (ignoring time)
        return (
          today.getFullYear() === targetDate.getFullYear() &&
          today.getMonth() === targetDate.getMonth() &&
          today.getDate() === targetDate.getDate()
        );
      };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 shadow-lg h-62 rounded-lg bg-white max-w-lg mb-10 mx-auto">
      <p className="text-xs font-bold mb-4 text-gray-400 text-center">Important Updates</p>
      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.item_id} className="flex justify-between items-center p-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {/* <img
                src={product.image || 'https://via.placeholder.com/50'}
                alt={product.name}
                className="w-12 h-12 rounded"
              /> */}
              <div>
                <p className="text-xs font-semibold">{product.name}</p>
                <p className="text-red-500 text-xs">In Stock: {product.countInStock}</p>
                <p className="text-xs text-gray-500">Item Id: {product.item_id}</p>
              </div>
            </div>
          </div>
        ))}

{billings.map((bill) => (
          <div key={bill.item_id} className="flex justify-between items-center p-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {/* <img
                src={product.image || 'https://via.placeholder.com/50'}
                alt={product.name}
                className="w-12 h-12 rounded"
              /> */}
              <div>
                {/* <p className="text-xs font-semibold">Invoice No.{bill.invoiceNo}</p> */}
                <p className="text-sm font-semibold">Invoice No. {bill.invoiceNo}</p>
                <p className={`text-xs ${isToday(bill.expectedDeliveryDate) ? 'text-red-600' : 'text-yellow-600'}`} >
                  {isToday(bill.expectedDeliveryDate)
                    ? 'Expected Delivery: Today'
                    : `Expected Delivery: ${new Date(bill.expectedDeliveryDate).toLocaleDateString()}` }
    </p>
                <p className="text-xs text-gray-500">Invoice No: {bill.invoiceNo}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/low-stock"
        className="block mt-4 text-center text-blue-500 font-bold hover:underline"
      >
        View All
      </Link>
    </div>
  );
};

export default LowStockPreview;
