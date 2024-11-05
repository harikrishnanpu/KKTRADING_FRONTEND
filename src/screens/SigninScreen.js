import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signin } from '../actions/userActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import api from './api';

export default function SigninScreen(props) {
  
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get('redirect');
  const redirect = redirectInUrl ? redirectInUrl : '/';

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo, loading, error } = userSignin;

  const dispatch = useDispatch();
  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(signin(email, password));
  };


  useEffect(() => {
    if (userInfo) {
      async function fetchUser () {
        const user = await api.get(`/api/users/user/${userInfo._id}`)
        if(user){
          navigate(redirect)
        }else{
          localStorage.clear();
          navigate('/signin')
        }
      }

      fetchUser();
    }
  }, [navigate, redirect, userInfo]);


  
  return (
    <div className='container'>
    <div className='lg:w-1/3 md:w-1/2 mx-auto mt-10'>
      <form className="form" onSubmit={submitHandler}>
        <div className='flex flex-col text-center w-full'>
        <h1 className="brand text-center mt-8 mb-8">
        <span className="firstWord">KK </span> <span className="secondWord">TRADING</span></h1>
          {/* <h1 className='sm:text-xl text-xl font-bold title-font mb-4 text-gray-900 mt-4'>Login</h1> */}
        </div>
        {loading && <LoadingBox></LoadingBox>}
        {error && <MessageBox variant="danger">Username Or Password Not Recognised</MessageBox>}
        
        
        <div className="p-2 w-full">
          <label htmlFor="email" className='mb-2'>Username</label>
          <input
            type="email"
            id="email"
            placeholder="kk@trading.com"
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" 
            ></input>
        </div>


        <div className="p-2 w-full">
          <label htmlFor="password" className='mb-2'>Password</label>
          <input
            type="password"
            id="password"
            placeholder="********"
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" 
            ></input>
        </div>
        
        <div className="p-2 w-full mx-auto">
          <button   className=" w-full text-center font-bold text-white bg-red-500 border-0 py-2 px-8 focus:outline-none hover:bg-red-600 rounded text-lg" type="submit">
            Log In
          </button>
        </div>


          <div className='p-2 w-full mx-auto flex'>
          <div>
            Don't have an Account?{' '}
            <Link to={`/register?redirect=${redirect}`}>
              <span className="text-blue-500">Create your account</span></Link>
          </div>
          </div>



        <div className="p-2 w-full pt-8 mt-8 border-t border-gray-200 text-center">
          <a href='/signin' className="text-indigo-500">kk@trading.com</a>
          <p className="leading-normal my-5">KK TRADING
            <br/>Kerala, India, 689109
          </p>
          <span className="inline-flex">
            <a href='/signin' className="text-gray-500">
              <svg fill="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
              </svg>
            </a>
            <a href='/signin' className="ml-4 text-gray-500">
              <svg fill="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
              </svg>
            </a>
            <a href='/signin' className="ml-4 text-gray-500">
              <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" className="w-5 h-5" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path>
              </svg>
            </a>
            <a href='/signin' className="ml-4 text-gray-500">
              <svg fill="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
              </svg>
            </a>
          </span>
        </div>

      </form>
    </div>
            </div>
  );
}
