import React, { useRef } from 'react'
import SearchBox from './SearchBox'
import { signout } from '../actions/userActions';
import { useDispatch, useSelector } from 'react-redux';

function Navbar() {

    const dispatch = useDispatch();
    const userSignin = useSelector((state) => state.userSignin);
    const { userInfo } = userSignin;

    const signoutHandler = () => {
        dispatch(signout(userInfo._id));
      };

    const navbarMenu = useRef(null);
    const burgerMenu = useRef(null);
  
  const sidebarOpen = ()=>{
    if(navbarMenu.current.classList.contains('is-active')){
      sidebarClose()
    }else{
    navbarMenu.current.classList.add('is-active');
    burgerMenu.current.classList.add('is-active');
    }
  }
  
  const menuLink = useRef(null);
  
  const sidebarClose = ()=>{
    navbarMenu.current.classList.remove('is-active');
    burgerMenu.current.classList.remove('is-active');
  }


  return (
  
  <header className="header mb-8" id="header">
    <nav className="navbar">
       <a href="/" className="brand">KK TRADING</a>
       <div className="search">
       <form class="flex items-center max-w-sm mx-auto search-form">  
             <SearchBox />
             {/* <button type="submit" className="search-submit" disabled><i className="bx bx-search"></i></button> */}
          </form>
       </div>
       <div ref={navbarMenu} className="menu" id="menu">
         <ul className="menu-inner">
           {userInfo && 
             <li className="menu-item"><a href="/profile" onClick={sidebarClose} ref={menuLink} className="menu-link">Profile</a></li>
           }
       {userInfo && userInfo.isAdmin && (
         <li className="menu-item"><a href="/dashboard" onClick={sidebarClose} ref={menuLink} className="menu-link">Admin</a></li>
        )}
       {userInfo && userInfo.isSeller && (
 
          <li className="menu-item"><a href="/productlist" onClick={sidebarClose} ref={menuLink} className="menu-link">Products</a></li>
 
         ) }
          { userInfo ? (
 <>           
            {/* <li className="menu-item"><a href="/orderhistory" onClick={sidebarClose}  ref={menuLink} className="menu-link">Order History</a></li> */}
             {/* <li className="menu-item"><a href="/cart" onClick={sidebarClose}  ref={menuLink} className="menu-link">Pending               {cartItems.length > 0 && (
               <span className="badge">{cartItems.length}</span>
             )} </a></li> */}
             <li className="menu-item"><button onClick={signoutHandler} ref={menuLink} className="menu-link">SignOut</button></li>
             </>
   ) : (
     <>
          <li className="menu-item"><a href="/signin" onClick={sidebarClose}  ref={menuLink} className="menu-link"><i className="fa fa-sign-in" aria-hidden="true"></i> Login</a></li>
         <li className="menu-item"><a href="#help" onClick={sidebarClose}  ref={menuLink} className="menu-link"><i className="fa fa-info-circle text-sm" aria-hidden="true"></i> Help Center</a></li>
     </>
 
          )
         }
         </ul>
       </div>
       <div ref={burgerMenu} onClick={sidebarOpen} className="burger" id="burger">
          <span className="burger-line"></span>
          <span className="burger-line"></span>
          <span className="burger-line"></span>
       </div>
    </nav>
 </header>
  )
}

export default Navbar