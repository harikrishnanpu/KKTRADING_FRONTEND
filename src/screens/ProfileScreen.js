import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { detailsUser, updateUserProfile } from '../actions/userActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { USER_UPDATE_PROFILE_RESET } from '../constants/userConstants';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerLogo, setSellerLogo] = useState('');
  const [sellerDescription, setSellerDescription] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const userDetails = useSelector((state) => state.userDetails);
  const { loading, error, user } = userDetails;
  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const {
    success: successUpdate,
    error: errorUpdate,
    loading: loadingUpdate,
  } = userUpdateProfile;
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) {
      dispatch({ type: USER_UPDATE_PROFILE_RESET });
      dispatch(detailsUser(userInfo._id));
    } else {
      setName(user.name);
      setEmail(user.email);
      if (user.seller) {
        setSellerName(user.seller.name);
        setSellerLogo(user.seller.logo);
        setSellerDescription(user.seller.description);
      }
    }
  }, [dispatch, userInfo._id, user]);

  const submitHandler = (e) => {
    e.preventDefault();
    // Validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Password and Confirm Password Are Not Matched');
    } else {
      dispatch(
        updateUserProfile({
          _id: user._id,
          userId: user._id,
          name,
          email,
          password,
          sellerName,
          sellerLogo,
          sellerDescription,
        })
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className='flex justify-between w-full px-6 max-w-lg'>
        <a href='/' className='font-bold text-blue-500'><i className='fa fa-angle-left' /> Back</a>
        <h2 className='text-2xl font-bold text-red-600 '>KK TRADING</h2>
      </div>

      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 mt-6">
        {loading ? (
          <div className="animate-pulse">
            {/* Skeletal loading animation */}
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
          </div>
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <>
            {loadingUpdate && <LoadingBox />}
            {errorUpdate && <MessageBox variant="danger">{errorUpdate}</MessageBox>}
            {successUpdate && <MessageBox variant="success">Profile Updated Successfully</MessageBox>}
            
            <form onSubmit={submitHandler} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-gray-600">Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter name"
                  className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-600">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-gray-600">Password</label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i
                  className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} absolute right-4 top-11 cursor-pointer text-gray-500`}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <div className="relative">
                <label htmlFor="confirmPassword" className="block text-gray-600">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
