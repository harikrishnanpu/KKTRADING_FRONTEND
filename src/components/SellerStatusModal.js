import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signout } from '../actions/userActions';

function SellerStatusModal({ isVisible }) {
    const dispatch = useDispatch();
    const userSignin = useSelector((state) => state.userSignin);
    const { userInfo } = userSignin;

    const signoutHandler = () => {
        dispatch(signout(userInfo._id));
      };

  if (!isVisible) return null; // Do not render the modal if it's not visible

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h2 className="text-lg font-bold mb-4 text-red-600">Hi, {userInfo.name}</h2>
        <p className="text-sm text-gray-500 mb-4">Something Went Wrong while fetching your details, Signout And Signin Again With this Account Credentials to fetch your Data. <i className='fa fa-spinner fa-spin' /></p>
        <p onClick={()=> signoutHandler()} className='text-sm bg-red-600 text-white font-bold py-2 rounded-lg cursor-pointer mb-4'>Signout</p>
        {/* <div className="animate-spin mx-auto rounded-full h-8 w-8 border-t-2 border-red-500"></div> */}
      </div>
    </div>
  );
}

export default SellerStatusModal;
