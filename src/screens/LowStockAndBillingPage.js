import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LowStockAndBillingPage = () => {
  const [products, setProducts] = useState([]);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const stockres = await axios.get('/api/products/low-stock/all');
        const deliveryres = await axios.get('/api/billing/alldelivery/all');
        setProducts(stockres.data);
        setBillings(deliveryres.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching products');
        setLoading(false);
      }
    };

    fetchLowStockProducts();
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

      const isYesterday = (dateString) => {
        const today = new Date();
        const targetDate = new Date(dateString);
      
        // Get the date for yesterday
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
      
        // Compare only the year, month, and date (ignoring time)
        return (
          yesterday.getFullYear() === targetDate.getFullYear() &&
          yesterday.getMonth() === targetDate.getMonth() &&
          yesterday.getDate() === targetDate.getDate()
        );
      };


  if (loading) return(
     <div className="text-center mt-40">
      <p className='text-sm animate-pulse font-bold'><i className='fa fa-spinner fa-spin'/> Loading....</p>
    </div>
  )
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-2">
      <div className='flex justify-end mb-10'>
      <a href='/' className='fixed text-sm top-5 font-bold left-4 text-blue-500'><i className='fa fa-angle-left' /> Back</a>
      <h2 className='text-xl font-bold text-red-600 '>KK TRADING</h2>
      </div>
      <h1 className="text-sm font-bold text-gray-600 text-center mb-6">Out of Stock Products & Upcoming Deliveries</h1>
      
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Out of Stock Products */}
        <div className="bg-white p-2 rounded-lg shadow-md">
          <h2 className="text-sm text-center font-semibold text-gray-700 mb-4">Low Stock Products</h2>
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.item_id} className="border-b border-gray-200 p-3">
                <p className="text-xs lg:text-sm font-semibold truncate">{product.name}</p>
                <p className="text-xs text-red-500">In Stock: {product.countInStock}</p>
                <p className="text-xs text-gray-500">Item Id: {product.item_id}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">All products are in stock.</p>
          )}
        </div>

        {/* Upcoming Deliveries */}
        <div className="bg-white p-2 rounded-lg shadow-md">
          <h2 className="text-sm font-semibold text-center text-gray-700 mb-4">Upcoming Deliveries</h2>
          {billings.length > 0 ? (
            billings.map((bill,index) => (
              <div key={bill.invoiceNo} className="border-b border-gray-200 p-3">
                <p className="text-sm font-semibold truncate">Invoice No. {bill.invoiceNo}</p>
                <p className="text-xs">Customer Name: {bill.customerName}</p>
                <p className="text-xs text-gray-400 mt-1">Salesman Name: {bill.salesmanName}</p>
                <p className={`text-xs ${isToday(bill.expectedDeliveryDate) ? 'text-red-600' : isYesterday(bill.expectedDeliveryDate) ? 'text-gray-400' : 'text-yellow-600'}`} >
                  {isToday(bill.expectedDeliveryDate)
                    ? 'Expected Delivery: Today'
                    : `Expected Delivery: ${new Date(bill.expectedDeliveryDate).toLocaleDateString()}` }
    </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No upcoming deliveries.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStockAndBillingPage;
