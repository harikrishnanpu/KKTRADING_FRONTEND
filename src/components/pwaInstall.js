import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is installed (iOS or Android)
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isInStandaloneMode()) {
      setIsInstalled(true);
    }

    // Listen for the 'beforeinstallprompt' event as early as possible
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent the mini-infobar from appearing
      setDeferredPrompt(e); // Store the event for triggering later
      setShowInstallModal(true); // Immediately show the install modal
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle the install button click
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the install prompt to the user
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null); // Clear the prompt after use
      setShowInstallModal(false); // Hide the modal after interaction
    }
  };

  // Handle closing the install modal
  const handleCloseModal = () => {
    setShowInstallModal(false);
  };

  return (
    <div>
      {/* Show the install button or the view button based on installation status */}
      {isInstalled ? (
        <button onClick={() => window.open(window.location.href, '_self')}>View App</button>
      ) : (

      showInstallModal && (
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
      )
      )}
    </div>
  );
};

export default PWAInstallPrompt;
