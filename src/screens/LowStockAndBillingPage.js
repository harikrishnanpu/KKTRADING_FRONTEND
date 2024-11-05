import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api';

const LowStockAndBillingPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllBillings, setShowAllBillings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stockres = await api.get('/api/products/low-stock/all');
        const deliveryres = await api.get('/api/billing/alldelivery/all');
        setProducts(stockres.data);
        setBillings(deliveryres.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const SkeletonLoader = () => (
    <div className="max-w-4xl mx-auto md:p-8 animate-pulse p-5">
      {/* <p className='text-center font-bold text-sm text-gray-400'>  <i className='fa fa-spinner fa-spin' /></p> */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-10">
        <div className="p-4 bg-white rounded-lg shadow-lg">
          <div className="space-y-3">
            {[...Array(1)].map((_, index) => (
              <div key={index} className="bg-gray-50 p-9 rounded-md">
                <div className="h-3 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-3/6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-lg">
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-md">
                <div className="h-3 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-2/4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const isToday = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    return today.toDateString() === targetDate.toDateString();
  };

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  const displayedProducts = showAllProducts ? products : products.slice(0, 5);
  const displayedBillings = showAllBillings ? billings : billings.slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Low Stocks and Upcoming. Deliveries</p>
  </div>
  <i className="fa fa-truck text-gray-500" />
</div>

      {/* <h1 className="text-sm font-bold text-center text-gray-700 mb-6">Out Of Stock Products & Deliveries</h1> */}

      {!showAllProducts && !showAllBillings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Upcoming Deliveries */}
          <div className="p-4 bg-white rounded-lg shadow-lg transition hover:shadow-xl transform hover:-translate-y-1">
            <h2 className="text-xs font-semibold text-gray-800 mb-4">
              <i className="fa fa-truck text-green-500 mr-2" /> Upcoming Deliveries
            </h2>
            {displayedBillings.length > 0 ? (
              <ul className="space-y-3">
                {displayedBillings.map((bill) => (
                  <li onClick={()=> navigate(`/driver/${bill._id}`)} key={bill.invoiceNo} className="flex cursor-pointer flex-col bg-gray-50 p-4 rounded-md hover:bg-gray-100 transition">
                    <p className="text-xs font-semibold text-gray-700">Invoice No. {bill.invoiceNo}</p>
                    <p className="text-xs text-gray-600">Customer: {bill.customerName}</p>
                    <p className="text-xs text-gray-400">Salesman: {bill.salesmanName}</p>
                    <p className={`text-xs mt-2 ${isToday(bill.expectedDeliveryDate) ? 'text-red-500 font-semibold' : 'text-yellow-500'}`}>
                      {isToday(bill.expectedDeliveryDate)
                        ? 'Expected Delivery: Today'
                        : `Expected Delivery: ${new Date(bill.expectedDeliveryDate).toLocaleDateString()}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (

              <p className="text-gray-500 text-sm">No upcoming deliveries.</p>

            )}

            <button
              onClick={() => setShowAllBillings(true)}
              className="text-xs font-semibold text-blue-500 hover:underline mt-3"
            >
              Show More
            </button>

          </div>

          {/* Low Stock Products */}
          <div className="p-4 bg-white rounded-lg shadow-lg transition hover:shadow-xl transform hover:-translate-y-1">
            <h2 className="text-xs font-semibold text-gray-800 mb-4">
              <i className="fa fa-exclamation-circle text-yellow-500 mr-2" /> Low Stock Products
            </h2>
            {displayedProducts.length > 0 ? (
              <ul className="space-y-3">
                {displayedProducts.map((product) => (
                  <li onClick={()=> navigate(`/get-product/${product.item_id}`)} key={product._id} className="flex justify-between items-center bg-gray-50 p-4 rounded-md hover:bg-gray-100 transition cursor-pointer">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{product.name}</p>
                      <p className="text-xs text-red-600">In Stock: {product.countInStock}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-500">ID: {product.item_id}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-xs">All products are in stock.</p>
            )}
            <button
              onClick={() => setShowAllProducts(true)}
              className="text-xs font-semibold text-blue-500 hover:underline mt-3"
            >
              Show More
            </button>
          </div>


        </div>
      )}

      {/* All Deliveries Table */}
      {showAllBillings && (
        <div>
          <div className='flex justify-between mb-4 mt-8'>

<p
  onClick={() => setShowAllBillings(false)}
  className="text-right text-blue-500 text-xs cursor-pointer font-semibold  rounded  transition mb-4"
>
  <i className="fa fa-angle-left mr-2" /> Back to Page
</p>
<h3 className="text-xs text-center font-semibold text-gray-300">All Upcomming Deliveries</h3>
</div>
          <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="text-xs font-semibold text-gray-600 uppercase bg-gray-50">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Exp.Delivery</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-700">
              {billings.map((bill) => (
                <tr key={bill.invoiceNo} className="bg-gray-50 border-b border-gray-200 p-6">
                  
                  <td className='text-center p-6'>

   {/* Indicator Dot */}
   {bill.deliveryStatus === 'Delivered' && bill.paymentStatus === 'Paid' && (
    <div className="text-center">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
  )}

  {bill.deliveryStatus === 'Delivered' && bill.paymentStatus !== 'Paid' && (
    <div className="">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

  {bill.deliveryStatus !== 'Delivered' && bill.paymentStatus === 'Paid' && (
    <div className="">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

{bill.deliveryStatus !== 'Delivered' && bill.paymentStatus !== 'Paid' && (
    <div className="text-center mx-auto">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </div>
  )}
                  </td>

                  <td className="px-4 py-2 text-center font-bold">{bill.invoiceNo}</td>
                  <td className="px-4 py-2">{bill.customerName}</td>
                  <td className={`py-2 px-2 text-center ${isToday(bill.expectedDeliveryDate) ? 'text-red-500 font-semibold' : 'text-yellow-500'}`}>
                    {isToday(bill.expectedDeliveryDate) ? 'Today' : new Date(bill.expectedDeliveryDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Products Table */}
      {showAllProducts && (
        <div>
          <div className='flex justify-between mb-4 mt-8'>

          <p
            onClick={() => setShowAllProducts(false)}
            className="text-right text-blue-500 text-xs cursor-pointer font-semibold  rounded  transition mb-4"
          >
            <i className="fa fa-angle-left mr-2" /> Back to Products
          </p>
          <h3 className="text-xs text-center font-semibold text-gray-300">All Low Stock Products</h3>
          </div>
          <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="text-xs font-semibold text-gray-600 uppercase bg-gray-50">
                <th className="px-4 py-3">P.ID</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">In Stock</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-700">
              {products.map((product) => (
                <tr  key={product.item_id} className="bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-2 text-center font-bold">{product.item_id}</td>
                  <td className="px-4 py-2">{product.name}</td>
                  <td className={`px-4 py-2 text-center ${product.countInStock > 5 ? 'text-yellow-500' : 'text-red-500'}`}>{product.countInStock}</td>
                  <td className="px-4 py-2"><p onClick={()=> navigate(`/get-product/${product.item_id}`)} className='bg-red-500 text-xs text-white font-bold cursor-pointer text-center px-2 py-1 rounded-lg'>Edit</p></td> 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LowStockAndBillingPage;
