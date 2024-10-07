import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { register } from '../actions/userActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';

export default function RegisterScreen(props) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get('redirect');
  const redirect = redirectInUrl ? redirectInUrl : '/';

  const userRegister = useSelector((state) => state.userRegister);
  const { userInfo, loading, error } = userRegister;

  const dispatch = useDispatch();
  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Password and confirm password are not match');
    } else {
      dispatch(register(name, email, password));
    }
  };


  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);


  return (
    <div className='lg:w-1/3 md:w-1/2 mx-auto mt-10'>
      <form className="form" onSubmit={submitHandler}>
      <div className='flex flex-col text-center w-full'>
        <h1 className="brand text-center mt-8">
        <span className="firstWord">KK </span> <span className="secondWord">TRADING</span></h1>
          <h4 className='sm:text-sm text-sm font-bold title-font mb-4 text-gray-900 mt-4'>Register Your Profile</h4>
        </div>
        {loading && <LoadingBox></LoadingBox>}
        {error && <MessageBox variant="danger">Error Creating Account</MessageBox>}
        
        
        <div className="p-2 w-full">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter name"
            required
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" 
         ></input>
        </div>


        <div className="p-2 w-full">
          <label htmlFor="email">User_Name</label>
          <input
            type="email"
            id="email"
            placeholder="Enter email"
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" 
          ></input>
        </div>


        <div className="p-2 w-full">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter password"
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" 
          ></input>
        </div>


        <div className="p-2 w-full">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            placeholder="Enter confirm password"
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" 
          ></input>
        </div>


        <div className="p-2 w-full mx-auto">
          <button className=" w-full text-center font-bold text-white bg-red-500 border-0 py-2 px-8 focus:outline-none hover:bg-red-600 rounded text-lg" type="submit">
            Register
          </button>
        </div>


        <div className='p-2 w-full mx-auto flex'>
          <div>
            Already have an account?{' '}
            <Link to={`/signin?redirect=${redirect}`}>
            <span className="text-blue-500">Sign-In</span></Link>
          </div>
        </div>


      </form>
    </div>
  );
}
