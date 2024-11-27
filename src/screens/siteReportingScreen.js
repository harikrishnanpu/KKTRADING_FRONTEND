// src/screens/SiteReportPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function SiteReportPage() {
  const navigate = useNavigate();

  const [siteName, setSiteName] = useState('');
  const [address, setAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContactNumber, setCustomerContactNumber] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorContactNumber, setContractorContactNumber] = useState('');
  const [siteDetails, setSiteDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [image, setImage] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [errorUpload, setErrorUpload] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setError('Unable to retrieve your location');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!currentLocation) {
      setError('Location data is required.');
      return;
    }

    const reportData = {
      siteName,
      address,
      customerName,
      customerContactNumber,
      contractorName,
      contractorContactNumber,
      siteDetails,
      remarks,
      submittedBy,
      location: currentLocation,
      image,
    };

    try {
      await api.post('/api/site-report/', reportData);
      setSuccess(true);
      // Reset form fields
      setSiteName('');
      setAddress('');
      setCustomerName('');
      setCustomerContactNumber('');
      setContractorName('');
      setContractorContactNumber('');
      setSiteDetails('');
      setRemarks('');
      setSubmittedBy('');
      setImage('');
      alert("successfully submitted")
      navigate('/'); // Redirect to site reports list or desired page
    } catch (err) {
      setError('Failed to submit the site report.');
    }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    // Replace with your Cloudinary upload preset
    formData.append('upload_preset', 'ml_default');

    setLoadingUpload(true);
    try {
      const { data } = await axios.post(
        'https://api.cloudinary.com/v1_1/dqniuczkg/image/upload',
        formData
      );
      setImage(data.secure_url);
      setLoadingUpload(false);
    } catch (error) {
      setErrorUpload(error.message);
      setLoadingUpload(false);
    }
  };

  return (
    <div className="mx-auto">
      {/* Top Banner */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Site Reporting</p>
        </div>
        <i className="fa fa-map-marker text-gray-500" />
      </div>

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-xs animate-pulse font-bold">{error}</p>
        </div>
      )}

      {success && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-xs animate-pulse font-bold">Report submitted successfully!</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-4">
        <form onSubmit={submitHandler}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Upload */}
            <div className="relative mb-4 md:col-span-2">
              <div className="mx-auto h-44 bg-gray-100 rounded-lg flex items-center justify-center relative">
                {loadingUpload ? (
                  <p>Loading...</p>
                ) : image ? (
                  <div>
                    <img
                      src={image}
                      onError={() => setImageError(true)}
                      alt="site"
                      className={`object-cover rounded-lg w-full h-32 ${imageError ? 'hidden' : ''}`}
                    />
                    {imageError && (
                      <div className="flex justify-center">
                        <p className="text-gray-400 animate-pulse text-sm">No image</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <p className="text-gray-400 animate-pulse text-sm">No image</p>
                  </div>
                )}
                <label
                  htmlFor="imageFile"
                  className="absolute bottom-2 font-bold right-2 text-xs bg-red-500 text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                  <i className="fa fa-edit" />
                </label>
                <input
                  type="file"
                  id="imageFile"
                  className="hidden"
                  onChange={uploadFileHandler}
                />
                {errorUpload && <p className="text-red-500 text-xs">{errorUpload}</p>}
              </div>
            </div>

            {/* Site Name */}
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Site Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Address</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Customer Name */}
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Customer Contact Number */}
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Contact Number</label>
              <input
                type="tel"
                required
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={customerContactNumber}
                onChange={(e) => setCustomerContactNumber(e.target.value)}
              />
            </div>

            {/* Contractor Name */}
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Contractor Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
              />
            </div>

            {/* Contractor Contact Number */}
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Contractor Contact Number</label>
              <input
                type="tel"
                required
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={contractorContactNumber}
                onChange={(e) => setContractorContactNumber(e.target.value)}
              />
            </div>

            {/* Site Details */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-xs text-gray-700">Site Details</label>
              <textarea
                required
                className="w-full h-24 border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={siteDetails}
                onChange={(e) => setSiteDetails(e.target.value)}
              />
            </div>

            {/* Remarks */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-xs text-gray-700">Remarks</label>
              <textarea
                className="w-full h-20 border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {/* Submitted By */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-xs text-gray-700">Submitted By</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-500 focus:ring-red-200 focus:outline-none text-xs"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
              />
            </div>
          </div>

          <div className="text-right mt-6">
            <button
              type="submit"
              className="bg-red-500 text-xs hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
