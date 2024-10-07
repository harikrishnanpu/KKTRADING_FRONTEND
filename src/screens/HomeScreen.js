import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LiveTracker from '../components/LocationTracker';
import LowStockPreview from '../components/lowStockPreview';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;


  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      if (localStorage.getItem('faceId')) {
        navigate('/');
      }

      if (!userInfo) {
        navigate('/signin');
      }

      try {
        const FoundFaceData = await axios.get(`/api/users/get-face-data/${userInfo?._id}`);
        if (FoundFaceData.data.faceDescriptor?.length !== 0) {
          if (!localStorage.getItem('faceId')) {
            navigate('/face-id?ref=login');
          } else {
            setLoading(false);
          }
        } else {
          navigate('/face-id?ref=new');
        }
      } catch (error) {
        navigate('/signin');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userInfo, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-4" >
      {loading ? (
        // Full page skeleton loader with card layout
        <div className=" fixed top-0 bg-white z-10 w-full overflow-hidden	 p-3 max-w-5xl">
          <p className='text-sm font-bold text-red-400 animate-pulse pb-2 text-center  mt-20 pt-10'>KK TRADING</p>
          <p className='text-center text-gray-400 animate-pulse pb-20 text-xs'>It takes more than 30 secs to load the site at the first time, <br/> getting server data</p>
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Render multiple skeleton card sections */}
            {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-6 bg-gray-300 rounded mb-3"></div>
                <div className="h-6 bg-gray-300 rounded mb-3"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full p-3 max-w-5xl">
          {/* {userInfo && !userInfo.isAdmin && <LiveTracker />} */}
          <p className="text-md font-semibold text-gray-800 text-center mb-3">Welcome, {userInfo?.name}</p>

          <LowStockPreview />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Billing Section */}
            <CardSection title="Billing">
              <ActionButton href="/create-bill" title="Create Bill" />
              <ActionButton href="/bills" title="All Bills" />
            </CardSection>

            {/* Purchases Section */}
            <CardSection title="Purchases">
              <ActionButton href="/purchase" title="Add Purchases" />
              <ActionButton href="/allpurchases" title="All Purchases" />
            </CardSection>

            {/* Returns Section */}
            <CardSection title="Returns">
              <ActionButton href="/create-return" title="Add Return" />
              <ActionButton href="/returns" title="All Returns" />
            </CardSection>

            {/* Product Management Section */}
            <CardSection title="Product Management">
              <ActionButton href="/productlist/seller" title="Add Products" />
              <ActionButton href="/get-product" title="Manage Product" />
            </CardSection>

            {/* Damages Section */}
            <CardSection title="Damages">
              <ActionButton href="/create-damage" title="Add Damage" />
              <ActionButton href="/damages" title="Damages" />
            </CardSection>

            <CardSection title="Drivers Section">
              <ActionButton href="/driver" title="See Invoices" />
              <ActionButton href="/driver-invoice" title="Delivery" />
            </CardSection>

            <CardSection title="Export Data">
              <ActionButton href="https://kktrading-backend.onrender.com/export" title="Export" />
              <ActionButton href="#" title="Export Products" />
            </CardSection>

            {/* Additional Options */}
            <CardSection title="Admin Panel">
              <ActionButton href={userInfo?.isAdmin ? '/support' : '/chat'} title="Inbox" />
              <ActionButton href="/dashboard" title="Dashboard" />
            </CardSection>
          </div>
        </div>
      )}
    </div>
  );
}

// CardSection component
function CardSection({ title, children }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-sm font-bold text-gray-500 mb-3">{title}</h2>
      <div className="flex flex-col space-y-3">{children}</div>
    </div>
  );
}

// ActionButton component
function ActionButton({ href, title }) {
  return (
    <a
      href={href}
      className="w-full px-3 py-2 bg-red-600 text-white font-bold text-xs md:text-sm rounded-md shadow-sm hover:bg-red-700 transition duration-150"
    >
      {title}
    </a>
  );
}
