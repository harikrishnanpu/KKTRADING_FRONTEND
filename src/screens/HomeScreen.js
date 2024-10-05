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
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

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
        navigate('/face-id?ref=error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userInfo, navigate]);

  // PWA Install Prompt Handling
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e); // Save the event so it can be triggered later
      setShowInstallModal(true); // Show modal when app install is available
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null); // Clear the prompt after use
      setShowInstallModal(false); // Hide the modal
    }
  };

  const handleCloseModal = () => {
    setShowInstallModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-4">
      {loading ? (
        // Full page skeleton loader with card layout
        <div className="w-full p-3 max-w-5xl">
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
            <CardSection title="Others">
              <ActionButton href={userInfo?.isAdmin ? '/support' : '/chat'} title="Inbox" />
              <ActionButton href="/attendence" title="Attendance" />
              {userInfo?.isAdmin && (
                <>
                  <ActionButton href="/userlist" title="All Users" />
                  <ActionButton href="/live-tracking" title="Track Users" />
                </>
              )}
            </CardSection>
          </div>
        </div>
      )}

      {/* Modal for PWA Install */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4">Install App</h2>
            <p className="text-gray-700 mb-6">Do you want to install this app for easy access?</p>
            <div className="flex justify-between">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Install
              </button>
            </div>
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
