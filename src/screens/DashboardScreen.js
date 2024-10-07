import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Chart from 'react-google-charts';
import { summaryOrder } from '../actions/orderActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import axios from 'axios';
import {useNavigate} from 'react-router-dom'

export default function DashboardScreen() {

  const navigate = useNavigate()

  const orderSummary = useSelector((state) => state.orderSummary);
  const { loading, summary, error } = orderSummary;
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(summaryOrder());
  }, [dispatch]);

  const [summary1,setSummary1] = useState(null);

  useEffect(()=>{
    const fetchSummary = async () =>{
      const { data } = await axios.get('/api/users/summary/all')
      setSummary1(data)
    }

    fetchSummary()
  },[]);

  console.log(summary)

  return (
    <div>
            <div className='flex justify-between'>
      <a href='/' className='font-bold left-4 text-blue-500'><i className='fa fa-angle-left' /> Back</a>
      <h2 className='text-2xl font-bold text-red-600 '>KK TRADING</h2>
      </div>

    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-700">Dashboard</h1>
      </div>

      <p onClick={()=> navigate('/userlist')} className='font-bold p-5 bg-red-500 w-1/2 text-center mx-auto rounded-lg text-white mb-10 cursor-pointer'>All Users</p>

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600">
                  <i className="fa fa-users mr-2 text-indigo-500" />
                  Users
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-4">
                {summary1 ? summary1.users : 0}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600">
                  <i className="fa fa-list mr-2 text-gray-500" />
                  Bills
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-4">
              {summary1 ? summary1.bills : 0}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600">
                  <i className="fa fa-ban mr-2 text-red-500" />
                  Damages
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-4">
              {summary1 ? summary1.damages : 0}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600">
                  <i className="fa fa-recycle mr-2 text-green-500" />
                  Returns
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-4">
              {summary1 ? summary1.damages : 0}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600">
                  <i className="fa fa-archive mr-2 text-yellow-500" />
                  Products
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-4">
              {summary1 ? summary1.products : 0}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600">
                  <i className="fa fa-shopping-cart mr-2 text-blue-500" />
                  Purchases
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-4">
              {summary1 ? summary1.purchases : 0}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-600">
                  <i className="fa fa-money mr-2 text-yellow-500" />
                  Sales
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-4">
              ₹ {summary1?.Billingsum ? summary1.Billingsum : 0}
              </div>
            </div>
          </div>

          {/* Sales Chart */}
          {/* <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sales</h2>
            {summary.dailyOrders.length === 0 ? (
              <MessageBox>No Sale</MessageBox>
            ) : (
              <Chart
                width="100%"
                height="400px"
                chartType="AreaChart"
                loader={<div>Loading Chart...</div>}
                data={[
                  ['Date', 'Sales'],
                  ...summary.dailyOrders.map((x) => [x._id, x.sales]),
                ]}
                options={{
                  hAxis: { title: 'Date', titleTextStyle: { color: '#333' } },
                  vAxis: { title: 'Sales', minValue: 0 },
                  chartArea: { width: '70%', height: '70%' },
                }}
              />
            )}
          </div> */}

          {/* Categories Pie Chart */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Categories</h2>
            {summary?.productCategories.length === 0 ? (
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
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
    </div>
  );
}
