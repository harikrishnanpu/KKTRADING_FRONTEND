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
    // dispatch update profile
    if (password !== confirmPassword) {
      alert('Password and Confirm Password Are Not Matched');
    } else {
      dispatch(
        updateUserProfile({
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
    <div>

<div className='flex justify-between'>
      <a href='/' className='font-bold left-4 text-blue-500'><i className='fa fa-angle-left' /> Back</a>
      <h2 className='text-2xl font-bold text-red-600 '>KK TRADING</h2>
      </div>

    <div className="flex justify-center items-center mt-10">
      <form
        className="w-full max-w-lg bg-white shadow-md rounded-lg p-6"
        onSubmit={submitHandler}
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-700">User Profile</h1>
        </div>

        {loading ? (
          <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <>
            {loadingUpdate && <LoadingBox />}
            {errorUpdate && (
              <MessageBox variant="danger">{errorUpdate}</MessageBox>
            )}
            {successUpdate && (
              <MessageBox variant="success">
                Profile Updated Successfully
              </MessageBox>
            )}
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-600">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter name"
                className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-gray-600">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Enter confirm password"
                className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* {user.isSeller && (
              <>
                <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-4">
                  Seller Information
                </h2>
                <div className="mb-4">
                  <label
                    htmlFor="sellerName"
                    className="block text-gray-600"
                  >
                    Seller Name
                  </label>
                  <input
                    id="sellerName"
                    type="text"
                    placeholder="Enter Seller Name"
                    className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="sellerLogo"
                    className="block text-gray-600"
                  >
                    Seller Logo
                  </label>
                  <input
                    id="sellerLogo"
                    type="text"
                    placeholder="Enter Seller Logo"
                    className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={sellerLogo}
                    onChange={(e) => setSellerLogo(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="sellerDescription"
                    className="block text-gray-600"
                  >
                    Seller Description
                  </label>
                  <input
                    id="sellerDescription"
                    type="text"
                    placeholder="Enter Seller Description"
                    className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={sellerDescription}
                    onChange={(e) => setSellerDescription(e.target.value)}
                  />
                </div>
              </>
            )} */}

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
              >
                Update Profile
              </button>
            </div>
          </>
        )}
      </form>
    </div>
    </div>
  );
}
