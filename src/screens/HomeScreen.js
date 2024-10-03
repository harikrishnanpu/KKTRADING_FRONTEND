import React, { useEffect, useState } from 'react';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
// import { Carousel } from 'react-responsive-carousel';
// import Product from '../components/Product';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LiveTracker from '../components/LocationTracker';

export default function HomeScreen() {
  const navigate = useNavigate()
  const [loading,setLoading] = useState(false)
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  useEffect(()=>{
    async function fetchData () {
    setLoading(true)
    if(localStorage.getItem('faceId')){
      navigate('/')
    }

    if(!userInfo){
      navigate('/signin')
    }

    try {
      const FoundFaceData = await axios.get(`/api/users/get-face-data/${userInfo?._id}`);
      console.log(FoundFaceData)
      if(FoundFaceData.data.faceDescriptor?.length !==0){
        if(!localStorage.getItem('faceId')){
          navigate('/face-id?ref=login')
        }else{
          setLoading(false)
          console.log('HI WELCOME')
        }
      }else{
        navigate('/face-id?ref=new')
      }
    
      }catch(error){
         navigate('/face-id?ref=error')
      }

    }

    fetchData()

  },[userInfo,navigate])
  
  return (
    <>
   {loading === true ? <p className='text-center font-bold items-center mt-10'><i className='fa fa-spinner animate-spin mr-2' /> Loading</p>  : ( <div style={{display:'grid',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
      {userInfo && !userInfo.isAdmin && <LiveTracker />}
      <h2 className='mx-auto text-center font-bold text-2xl text-red-600 mt-5'>Members Panel</h2>
      <h1 className='sm:mx-auto text-lg font-bold mb-10 mt-2'>Hi, {userInfo?.name}</h1>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{textAlign:'center'}}>
          <a href='/productlist/seller' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>Add Products</a>
          <a href='/create-bill' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>Create Bill</a>
          <a href='/bills' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>All Bills</a>
          <a href='/create-return' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>Add Return</a>
          <a href='/returns' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>All Returns</a>
          <a href='/purchase' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>Add Purchases</a>
          <a href='/allpurchases' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>All Purchases</a>
          <a href='/create-damage' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>Add Damage</a>
          <a href='/damages' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>Damages</a>
          <a href={userInfo && userInfo?.isAdmin ? '/support' : '/chat'} style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'><i className='fa fa-comment'></i>  Inbox</a>
          <a href='/attendence' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>Attendence</a>
          <a href='/workers' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>Workers</a>
          {userInfo && userInfo?.isAdmin && <a href='/userlist' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'>All Users</a>}
          {userInfo && userInfo.isAdmin && <a href='/live-tracking' style={{padding:'12px',backgroundColor:'hsl(349, 100%, 60%)',fontWeight:'bold',margin:'10px',color:'white'}} className='btn'><i className='fa fa-map-marker' /> Track Users</a>}
            </div>
          </div>
    </div> )}
    </>
  );
}
