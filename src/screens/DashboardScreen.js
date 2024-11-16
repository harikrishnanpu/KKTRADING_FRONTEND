// AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-google-charts';
import LowStockPreview from '../components/lowStockPreview';
import api from './api'; // Adjust the import path as necessary
import PropTypes from 'prop-types';

const SummaryCard = ({ label, value, icon }) => (
  <div className="bg-white text-gray-800 rounded-lg shadow-md p-3 text-center">
    <i className={`fa ${icon} text-red-500 text-xl mb-1`} />
    <h3 className="text-lg font-bold">{value}</h3>
    <p className="text-gray-600 text-xs font-medium">{label}</p>
  </div>
);

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.string.isRequired,
};

const LoadingScreen = ({ showDelayedMessage }) => (
  <div className="fixed top-0 bg-white z-10 w-full overflow-hidden p-3">
    <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-6 mt-5">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
        <div key={index} className="bg-white p-3 rounded-lg shadow animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-3/4 text-center mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded mb-3 w-1/2 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded mb-3 w-1/2 mx-auto"></div>
        </div>
      ))}
    </div>
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
      {[1, 2].map((_, index) => (
        <div key={index} className="bg-white p-3 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-4 w-3/4 text-center mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded mb-3 w-1/2 "></div>
          <div className="h-4 bg-gray-300 rounded mb-3 w-1/2 mx-auto"></div>

        </div>
      ))}
    </div>
    {showDelayedMessage && (
      <p className="text-center fixed top-40 bottom-0 left-0 right-0 text-gray-400 animate-pulse pb-4 text-xs">
        <i className="fa fa-sync fa-spin mr-2 text-red-400" />
        It is taking longer than usual to load the site. <br /> Retrieving server data, please be patient.
      </p>
    )}

<p className="text-sm fixed top-40 bottom-0 left-0 right-0  font-bold text-red-400 animate-pulse pb-2 text-center mt-20 pt-10">KK TRADING</p>
    <p className="text-center fixed top-40 bottom-0 left-0 right-0  text-gray-400 animate-pulse pb-10 text-xs">
      {/* <i className="fa fa-spinner fa-spin" /> Loading... */}
    </p> 
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [summaryData, setSummaryData] = useState({});
  const [time, setTime] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [productCategories, setProductCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDelayedMessage, setShowDelayedMessage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const timer = setTimeout(() => setShowDelayedMessage(true), 5000);

      try {
        const [
          summaryRes,
          usersRes,
          deliveriesRes,
          lowStockRes,
          monthlySalesRes,
          productCategoriesRes,
        ] = await Promise.all([
          api.get('/api/orders/summary/all'),
          api.get('/api/users/allusers/all'),
          api.get('/api/users/all/deliveries'),
          api.get('/api/products/low-stock/all'),
          api.get('/api/billing/summary/monthly-sales'),
          api.get('/api/products/admin/categories'),
        ]);

        setSummaryData(summaryRes.data);
        setUsers(usersRes.data);
        setDeliveries(deliveriesRes.data);
        setMonthlySales(monthlySalesRes.data);
        setProductCategories(productCategoriesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false); 
        clearTimeout(timer);
      }
    };

    fetchData();

    const timeUpdater = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timeUpdater);
  }, []);

  const pendingApprovalUsers = users.filter((user) => !user.isSeller);
  const pendingDeliveries = deliveries.filter((delivery) => !delivery.isDelivered);

  const monthlySalesData = [
    ['Month', 'Sales'],
    ...monthlySales.map((item) => [getMonthName(item._id), item.totalSales]),
  ];

  function getMonthName(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
  }

  if (loading) {
    return <LoadingScreen showDelayedMessage={showDelayedMessage} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-gray-600 hidden md:block rounded-lg p-3 divide-y text-white md:w-64 w-full">
        <div className="p-4">
          <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>
        <nav>
          <ul>
            <li
              onClick={() => navigate('/')}
              className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-home mr-2" />
              <span className="text-sm">Home</span>
            </li>
            <li
              onClick={() => navigate('/userlist')}
              className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-users mr-2" />
              <span className="text-sm">Users</span>
            </li>
            <li
              onClick={() => navigate('/productlist')}
              className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-archive mr-2" />
              <span className="text-sm">Products</span>
            </li>
            <li
              onClick={() => navigate('/admin/alllogs')}
              className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-list mr-2" />
              <span className="text-sm">All Logs</span>
            </li>
          </ul>
        </nav>
      </aside>

      <aside className="bg-gray-600 z-30 fixed left-2 right-2 bottom-2 mx-2 md:hidden rounded-xl p-1 text-white w-full">
        <nav className='flex justify-between'>
          <ul className='flex w-full justify-between mx-auto text-xs'>
            <li
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-home" />
              <span className="ml-1">Home</span>
            </li>
            <li
              onClick={() => navigate('/userlist')}
              className="p-2 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-users" />
              <span className="ml-1">Users</span>
            </li>
            <li
              onClick={() => navigate('/productlist')}
              className="p-2 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-archive" />
              <span className="ml-1">Products</span>
            </li>
            <li
              onClick={() => navigate('/bills')}
              className="p-2 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-shopping-cart" />
              <span className="ml-1">Sales</span>
            </li>
            <li
              onClick={() => navigate('/admin/alllogs')}
              className="p-2 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
            >
              <i className="fa fa-list" />
              <span className="ml-1">All Logs</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-4 bg-gray-50 min-h-screen overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div>
            <h1 className="text-lg md:text-xl text-center font-bold">Dashboard</h1>
            <p className="text-gray-600 text-xs">Welcome back, ADMIN</p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <p className="text-xs text-gray-500">Current Time:</p>
            <p className="text-sm font-semibold">{time.toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Users', value: summaryData?.users || 0, icon: 'fa-users' },
            { label: 'Bills', value: summaryData?.bills || 0, icon: 'fa-file-invoice' },
            { label: 'Damages', value: summaryData?.damages || 0, icon: 'fa-exclamation-triangle' },
            { label: 'Returns', value: summaryData?.returns || 0, icon: 'fa-undo' },
            { label: 'Products', value: summaryData?.products || 0, icon: 'fa-archive' },
            {
              label: 'Purchases',
              value: summaryData?.purchases || 0,
              icon: 'fa-shopping-bag',
            },
            {
              label: 'Out of Stock',
              value: summaryData?.outOfStockProducts || 0,
              icon: 'fa-exclamation-circle',
            },
            { label: 'Pending Deliveries', value: pendingDeliveries.length, icon: 'fa-truck' },
          ].map((item, index) => (
            <SummaryCard key={index} label={item.label} value={item.value} icon={item.icon} />
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Monthly Sales Chart */}
          <div className="md:col-span-2 bg-white text-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-2">Monthly Sales Report</h2>
            {monthlySalesData.length > 1 ? (
              <Chart
                width="100%"
                height="300px"
                chartType="ColumnChart"
                loader={<div>Loading Chart...</div>}
                data={monthlySalesData}
                options={{
                  hAxis: {
                    title: 'Month',
                    textStyle: { fontSize: 10 },
                    titleTextStyle: { fontSize: 12 },
                  },
                  vAxis: {
                    title: 'Sales',
                    textStyle: { fontSize: 10 },
                    titleTextStyle: { fontSize: 12 },
                  },
                  legend: 'none',
                  backgroundColor: 'transparent',
                  chartArea: { width: '80%', height: '70%' },
                }}
              />
            ) : (
              <p className="text-xs">No sales data available.</p>
            )}
          </div>

          {/* Waiting for Approval */}
          <div className="bg-white text-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold text-red-600 mb-2">Waiting for Approval</h2>
            {pendingApprovalUsers.length === 0 ? (
              <p className="text-gray-600 italic text-xs">No users waiting for approval.</p>
            ) : (
              <ul className="space-y-2">
                {pendingApprovalUsers.map((user) => (
                  <li
                    key={user._id}
                    onClick={() => navigate(`/user/${user._id}/edit`)}
                    className="bg-red-100 p-2 rounded-md cursor-pointer hover:bg-red-200 transition"
                  >
                    <h3 className="font-semibold text-sm">{user.name}</h3>
                    <p className="text-xs">{user.email}</p>
                    <span className="text-xs text-red-600 font-semibold">
                      Status: Not Approved
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Low Stock Products */}
          <div className="bg-white text-gray-800 p-4 rounded-lg shadow-lg md:col-span-2">
            <LowStockPreview adminPage={true} />
          </div>

          {/* Categories Pie Chart */}
          <div className="bg-white text-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-2">Product Categories</h2>
            {productCategories.length === 0 ? (
              <p className="text-xs">No categories data available.</p>
            ) : (
              <Chart
                width="100%"
                height="300px"
                chartType="PieChart"
                loader={<div>Loading Chart...</div>}
                data={[
                  ['Category', 'Products'],
                  ...productCategories.map((category) => [category.name, category.count]),
                ]}
                options={{
                  pieHole: 0.4,
                  is3D: false,
                  legend: {
                    position: 'bottom',
                    textStyle: { color: '#333', fontSize: 10 },
                  },
                  backgroundColor: 'transparent',
                  chartArea: { width: '90%', height: '70%' },
                  tooltip: { trigger: 'focus', textStyle: { fontSize: 10 } },
                }}
              />
            )}
          </div>
        </div>
          <div className="bg-white text-gray-800 p-5 rounded-lg shadow-lg mb-20 mt-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Total Sales</h2>
              <span className="text-red-600 text-xl font-semibold">
                ₹ {summaryData?.Billingsum ? summaryData.Billingsum : 0}
              </span>
            </div>
          </div>
      </div>
    </div>
  );
}