import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Chart from 'react-google-charts';
import { summaryOrder } from '../actions/orderActions';
import MessageBox from '../components/MessageBox';
import { useNavigate } from 'react-router-dom';
import LowStockPreview from '../components/lowStockPreview';
import api from './api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const orderSummary = useSelector((state) => state.orderSummary);
  const { loading, summary, error } = orderSummary;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(summaryOrder());
  }, [dispatch]);

  const [summaryData, setSummaryData] = useState(null);
  const [time, setTime] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.get('/api/orders/summary/all');
        setSummaryData(data);
      } catch (error) {
        console.error('Error fetching order summary:', error);
      }
    };
    fetchSummary();

    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/api/users/allusers/all');
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();

    const fetchDeliveries = async () => {
      try {
        const { data } = await api.get('/api/deliveries/all');
        setDeliveries(data);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      }
    };
    fetchDeliveries();

    const fetchLowStockProducts = async () => {
      try {
        const { data } = await api.get('/api/products/lowstock');
        setLowStockProducts(data);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      }
    };
    fetchLowStockProducts();

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pendingApprovalUsers = users ? users.filter((user) => !user.isSeller) : [];
  const pendingDeliveries = deliveries ? deliveries.filter((delivery) => !delivery.isDelivered) : [];

  return (
    <div className="p-2">

<div className="flex mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Admin Panel</p>
  </div>
  <i className="fa fa-user text-gray-500" />
</div>


      {/* Header */}
      <header className="flex justify-between items-center mx-auto mb-5">
        <div className="flex justify-center text-center space-x-4">
          <h1 className="text-sm text-gray-500 text-center font-bold">Admin Dashboard</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Current Time:</p>
          <p className="text-xs font-semibold">{time.toLocaleTimeString()}</p>
        </div>
      </header>

<div className='max-w-lg mx-auto mb-5 shadow-md p-4 rounded-lg'>
  <p className='text-xs absolute text-gray-400 font-bold'>Quick Panel</p>

  <div className='flex justify-between mt-6 p-2'>

<p onClick={()=> navigate('/admin/alllogs')} className='bg-red-400 py-2 text-xs px-6 cursor-pointer rounded-lg text-center font-bold text-white'>All Logs</p>

<p onClick={()=> navigate('/userlist')} className='bg-red-400 py-2 text-xs px-6 cursor-pointer rounded-lg text-center font-bold text-white'>All Users</p>

<p onClick={()=> navigate('/productlist')} className='bg-red-400 py-2 text-xs px-6 cursor-pointer rounded-lg text-center font-bold text-white'>All Products</p>
  </div>

</div>
      {/* Main Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mx-auto">
        {/* Left Section */}
        <section className="md:col-span-4 space-y-6">
          {/* Waiting for Approval */}
          <div className="white text-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold text-red-600 mb-4">Waiting for Approval</h2>
            {pendingApprovalUsers.length === 0 ? (
              <p className="text-gray-600 italic">No users waiting for approval.</p>
            ) : (
              <ul className="space-y-3">
                {pendingApprovalUsers.map((user) => (
                  <li
                    key={user._id}
                    onClick={() => navigate(`/user/${user._id}/edit`)}
                    className="bg-red-100 p-3 rounded-md cursor-pointer hover:bg-red-200 transition"
                  >
                    <h3 className="font-semibold text-sm">{user.name}</h3>
                    <p className="text-xs">{user.email}</p>
                    <span className="text-xs text-red-600 font-semibold">Status: Not Approved</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Low Stock Products */}
          <div className="white text-gray-800 p-4 rounded-lg shadow-lg">
            <LowStockPreview adminPage={true} />
          </div>
        </section>

        {/* Right Section */}
        <section className="md:col-span-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Users', value: summaryData?.users || 0, icon: 'fa-users' },
              { label: 'Bills', value: summaryData?.bills || 0, icon: 'fa-list' },
              { label: 'Damages', value: summaryData?.damages || 0, icon: 'fa-ban' },
              { label: 'Returns', value: summaryData?.returns || 0, icon: 'fa-recycle' },
              { label: 'Products', value: summaryData?.products || 0, icon: 'fa-archive' },
              { label: 'Purchases', value: summaryData?.purchases || 0, icon: 'fa-shopping-cart' },
              { label: 'Out of Stock', value: summaryData?.outOfStockProducts || 0, icon: 'fa-exclamation' },
              { label: 'Deliveries', value: pendingDeliveries.length, icon: 'fa-truck' },
            ].map((item, index) => (
              <div key={index} className="white text-gray-800 rounded-lg shadow-md p-4 text-center">
                <i className={`fa ${item.icon} text-red-500 text-lg mb-2`} />
                <h3 className="text-lg font-bold">{item.value}</h3>
                <p className="text-gray-600 text-xs font-medium">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Total Sales Section */}
          <div className="white text-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Total Sales</h2>
              <span className="text-red-600 text-lg font-semibold">
                ₹ {summaryData?.Billingsum ? summaryData.Billingsum : 0}
              </span>
            </div>
          </div>

          {/* Categories Pie Chart Section */}
          <div className="white text-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Product Categories</h2>
            {summary?.productCategories?.length === 0 ? (
              <MessageBox>No Category</MessageBox>
            ) : (
              <Chart
                width="100%"
                height="300px"
                chartType="PieChart"
                loader={<div>Loading Chart...</div>}
                data={
                  summary && summary.productCategories
                    ? [
                        ['Category', 'Products'],
                        ...summary.productCategories.map((x) => [x._id, x.count]),
                      ]
                    : [['Category', 'Products']]
                }
                options={{
                  pieHole: 0.4,
                  is3D: false,
                  legend: { position: 'bottom', textStyle: { color: '#333' } },
                  backgroundColor: 'transparent',
                  chartArea: { width: '90%', height: '70%' },
                  tooltip: { trigger: 'focus' },
                }}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}