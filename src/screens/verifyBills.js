// src/components/VerifyBill.jsx
import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import './VerifyBill.css'; // Minimal styles for animations
import api from './api';

const VerifyBill = () => {
  const [scanResult, setScanResult] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success' or 'error'
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Handler when QR code is scanned
  const handleScan = async (data) => {
    if (data) {
      setScanResult(data.text);
      setIsVerifying(true);

      try {
        const response = await api.post('/api/print/verify-qr-code', { qrcodeId: data.text });

        const result = response.data;

        if (response.status === 200 && result.verified) {
          setVerificationStatus('success');
          setPurchaseDetails(result.purchase);
        } else {
          setVerificationStatus('error');
          setErrorMessage(result.message || 'Verification failed.');
        }
      } catch (error) {
        console.error('Error verifying QR Code:', error);
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred during verification.');
      } finally {
        setIsVerifying(false);
        setShowModal(true);
      }
    }
  };

  // Handler for scan errors
  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    setVerificationStatus('error');
    setErrorMessage('Camera error. Please ensure camera permissions are granted.');
    setShowModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setVerificationStatus(null);
    setPurchaseDetails(null);
    setErrorMessage('');
    setScanResult('');
  };

  // QR Scanner delay (in ms)
  const delay = 300;

  // QR Scanner preview style
  const previewStyle = {
    height: 240,
    width: 320,
  };

  return (
    <div className="verify-bill-container flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2 className="title text-2xl font-bold text-red-600 mb-6">Verify Purchase Bill</h2>
      <div className="qr-scanner-wrapper mb-4 shadow-lg rounded overflow-hidden">
        <QrScanner
          delay={delay}
          style={previewStyle}
          onError={handleError}
          onScan={handleScan}
          facingMode="environment" // Use rear camera if available
        />
      </div>
      {isVerifying && <p className="verifying text-gray-700">Verifying QR Code...</p>}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`modal rounded-lg p-6 w-11/12 max-w-md bg-white shadow-xl transform transition-all animate-slideUp`}
          >
            {verificationStatus === 'success' ? (
              <div className="flex flex-col items-center">
                <i className="fa fa-check-circle text-green-500 text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-green-600 mb-2">QR Code Verified Successfully!</h3>
                <div className="purchase-details w-full text-left mb-4">
                  <p><strong>Invoice No:</strong> {purchaseDetails.invoiceNo}</p>
                  <p><strong>Purchase ID:</strong> {purchaseDetails.purchaseId}</p>
                  <p><strong>Supplier Name:</strong> {purchaseDetails.sellerName}</p>
                  <p><strong>Billing Date:</strong> {new Date(purchaseDetails.billingDate).toLocaleDateString()}</p>
                  <p><strong>Grand Total:</strong> ₹{purchaseDetails.totals.grandTotalPurchaseAmount.toFixed(2)}</p>
                  {/* Add more details as needed */}
                </div>
                <button
                  onClick={closeModal}
                  className="close-button mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <i className="fa fa-times-circle text-red-500 text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-red-600 mb-2">Verification Failed</h3>
                <p className="text-gray-700 mb-4">{errorMessage}</p>
                <button
                  onClick={closeModal}
                  className="close-button mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyBill;
