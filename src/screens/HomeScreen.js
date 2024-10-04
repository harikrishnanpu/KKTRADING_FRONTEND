import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LiveTracker from '../components/LocationTracker';
import LowStockPreview from '../components/lowStockPreview';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
        navigate('/face-id?ref=error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userInfo, navigate]);


  const [deferredPrompt, setDeferredPrompt] = useState(null);

useEffect(() => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // Prevent Chrome 67 and earlier from automatically showing the prompt
    setDeferredPrompt(e); // Stash the event so it can be triggered later
  });

  return () => {
    window.removeEventListener("beforeinstallprompt", () => {});
  };
}, []);

const handleInstallClick = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt(); // Show the prompt
    const { outcome } = await deferredPrompt.userChoice; // Wait for the user to respond
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null); // Clear the prompt
  }
};

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-4">
      {loading ? (
        <div className="flex flex-col items-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading...</p>
        </div>
      ) : (
        <div className="w-full p-3 max-w-5xl">
          {userInfo && !userInfo.isAdmin && <LiveTracker />}
          <p className="text-md font-semibold text-gray-800 text-center mb-3">Welcome, {userInfo?.name}</p>

          <LowStockPreview />

          {deferredPrompt && (
        <button onClick={handleInstallClick}>
          Install App
        </button>
      )}

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
