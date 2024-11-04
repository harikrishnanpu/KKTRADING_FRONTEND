import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Chart from 'react-google-charts';
import { summaryOrder } from '../actions/orderActions';
import MessageBox from '../components/MessageBox';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const orderSummary = useSelector((state) => state.orderSummary);
  const { loading, summary, error } = orderSummary;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(summaryOrder());
  }, [dispatch]);

  const [summary1, setSummary1] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const fetchSummary = async () => {
      const { data } = await axios.get('/api/orders/summary/all');
      setSummary1(data);
    };
    fetchSummary();
    
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <a href="/" className="font-bold text-blue-500 transition hover:text-blue-700">
          <i className="fa fa-angle-left" /> Back
        </a>
        <h2 className="text-xl font-bold text-red-600">KK TRADING</h2>
        <span className="font-bold text-gray-700"><i className="fa fa-clock" /> {time.toLocaleTimeString()}</span>
      </div>

      {/* Admin Dashboard Title */}
      <div className="flex justify-start items-center mb-3">
        <h1 className="text-sm font-bold text-gray-400 mr-5">Admin Dashboard</h1>
      </div>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 lg:w-1/2 gap-6 mb-10">
        <p
          onClick={() => navigate('/userlist')}
          className="font-bold text-xs px-3 py-3 bg-red-600 w-full text-center rounded-lg text-white cursor-pointer shadow-md hover:bg-red-700 transition"
        >
          Manage Users
        </p>


        <p
          onClick={() => navigate('/productlist/seller')}
          className="font-bold text-xs px-3 py-3 bg-red-600 w-full text-center rounded-lg text-white cursor-pointer shadow-md hover:bg-red-700 transition"
        >
          Manage Products
        </p>

      </div>

      {/* Skeleton Loading */}
      {loading ? (
        <>
          {/* Skeleton for Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {Array(6).fill().map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>

          {/* Skeleton for Chart */}
          <div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-8"></div>
        </>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {/* Users */}
            <div className="bg-white shadow-lg rounded-lg p-6 transition ">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-600">
                  <i className="fa fa-users mr-2 text-red-600" />
                  Users
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-4">
                {summary1 ? summary1.users : 0}
              </div>
            </div>

            {/* Bills */}
            <div className="bg-white shadow-lg rounded-lg p-6 transition ">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-600">
                  <i className="fa fa-list mr-2 text-red-600" />
                  Bills
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-4">
                {summary1 ? summary1.bills : 0}
              </div>
            </div>

            {/* Damages */}
            <div className="bg-white shadow-lg rounded-lg p-6 transition ">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  <i className="fa fa-ban mr-2 text-red-600" />
                  Damages
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-4">
                {summary1 ? summary1.damages : 0}
              </div>
            </div>

            {/* Returns */}
            <div className="bg-white shadow-lg rounded-lg p-6 transition ">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  <i className="fa fa-recycle mr-2 text-red-600" />
                  Returns
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-4">
                {summary1 ? summary1.returns : 0}
              </div>
            </div>

            {/* Products */}
            <div className="bg-white shadow-lg rounded-lg p-6 transition ">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  <i className="fa fa-archive mr-2 text-red-600" />
                  Products
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-4">
                {summary1 ? summary1.products : 0}
              </div>
            </div>

            {/* Purchases */}
            <div className="bg-white shadow-lg rounded-lg p-6 transition ">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  <i className="fa fa-shopping-cart mr-2 text-red-600" />
                  Purchases
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-4">
                {summary1 ? summary1.purchases : 0}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 transition ">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  <i className="fa fa-exclamation mr-2 text-red-600" />
                  Out Of Stock
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-4">
                {summary1 ? summary1.outOfStockProducts : 0}
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-10 transition ">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                <i className="fa fa-money mr-2 text-red-600" />
                Total Sales
              </span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-4">
              ₹ {summary1?.Billingsum ? summary1.Billingsum : 0}
            </div>
          </div>

          {/* Categories Pie Chart */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8 transition ">
            <h2 className="text-md font-semibold text-gray-700 mb-4">Categories</h2>
            {summary?.productCategories?.length === 0 ? (
              <MessageBox>No Category</MessageBox>
            ) : (
              <Chart
                width="100%"
                height="400px"
                chartType="PieChart"
                loader={<div>Loading Chart...</div>}
                data={[
                  ['Category', 'Products'],
                  ...summary.productCategories.map((x) => [x._id, x.count]),
                ]}
                options={{
                  pieHole: 0.4,
                  is3D: false,
                  legend: { position: 'bottom' },
                  colors: ['#e3342f', '#f6993f', '#ffed4a', '#38c172', '#4dc0b5'],
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
