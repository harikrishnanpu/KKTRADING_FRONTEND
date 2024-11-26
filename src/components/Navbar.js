import React, { useState, useRef, useEffect, useCallback } from 'react';
import SearchBox from './SearchBox';
import { signout } from '../actions/userActions';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownToggleRef = useRef(null);

  // Close dropdown if clicking outside of it
  const handleOutsideClick = useCallback((event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      !dropdownToggleRef.current.contains(event.target)
    ) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dropdownOpen, handleOutsideClick]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const signoutHandler = () => {
    dispatch(signout(userInfo._id));
    setDropdownOpen(false);
    localStorage.clear();
    navigate('/signin');
  };

  const navbarMenu = useRef(null);
  const burgerMenu = useRef(null);

  const sidebarOpen = () => {
    if (navbarMenu.current.classList.contains('is-active')) {
      sidebarClose();
    } else {
      navbarMenu.current.classList.add('is-active');
      burgerMenu.current.classList.add('is-active');
    }
  };

  const menuLink = useRef(null);

  const sidebarClose = () => {
    navbarMenu.current.classList.remove('is-active');
    burgerMenu.current.classList.remove('is-active');
  };

  return (
    <header className="header mb-8" id="header">
      <nav className="navbar mt-2">
        <a href="/" className="brand">KK TRADING</a>

        {/* Account Icon with Dropdown for Small Screens */}
        <div
          ref={dropdownToggleRef}
          className="absolute sm:hidden bg-gray-100 hover:bg-gray-200 transition py-1 px-4 rounded-lg right-16 top-4 cursor-pointer flex items-center"
          onClick={toggleDropdown}
        >
          <p className="mr-2 text-sm font-bold">
            Hi, <span>{userInfo?.name.slice(0, 5)}..</span>
          </p>
          <i className="fa fa-user-circle text-xl"></i>
        </div>

        {dropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-10 mt-16 p-2 w-48 bg-white rounded-lg shadow-lg z-50"
          >
            {userInfo ? (
              <div>
                <button
                  className="w-full text-sm transition font-bold text-left px-4 py-2 text-gray-500 hover:bg-gray-200"
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                >
                  My Profile
                </button>
                <hr />
                <button
                  className="w-full text-sm transition font-bold text-left px-4 py-2 text-red-400 hover:bg-gray-200"
                  onClick={() => {
                    signoutHandler();
                    setDropdownOpen(false);
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200"
                onClick={() => {
                  navigate('/signin');
                  setDropdownOpen(false);
                }}
              >
                Sign In
              </button>
            )}
          </div>
        )}

        <div className="search">
          <form className="flex items-center max-w-sm mx-auto search-form">
            <SearchBox />
          </form>
        </div>

        <div ref={navbarMenu} className="menu" id="menu">
          <ul className="menu-inner">
            {userInfo && (
              <li className="menu-item text-sm bg-gray-200 py-1 px-3 rounded-lg transition">
                <a href="/profile" onClick={sidebarClose} ref={menuLink} className="menu-link">
                  Hi, {userInfo?.name.slice(0,5)}..
          <i className="fa fa-user-circle text-xl ml-2"></i>

                </a>
              </li>
            )}
            {userInfo && userInfo.isAdmin && (
              <li className="menu-item">
                <a href="/dashboard" onClick={sidebarClose} ref={menuLink} className="menu-link">
                  Admin
                </a>
              </li>
            )}
            {userInfo && userInfo.isSeller && (
              <li className="menu-item">
                <a href="/productlist" onClick={sidebarClose} ref={menuLink} className="menu-link">
                  Products
                </a>
              </li>
            )}
            {userInfo ? (
              <>
                <li className="menu-item">
                  <button onClick={signoutHandler} ref={menuLink} className="menu-link">
                    SignOut
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="menu-item">
                  <a href="/signin" onClick={sidebarClose} ref={menuLink} className="menu-link">
                    <i className="fa fa-sign-in" aria-hidden="true"></i> Login
                  </a>
                </li>
                <li className="menu-item">
                  <a href="#help" onClick={sidebarClose} ref={menuLink} className="menu-link">
                    <i className="fa fa-info-circle text-sm" aria-hidden="true"></i> Help Center
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>

        <div ref={burgerMenu} onClick={sidebarOpen} className="burger" id="burger">
          <span className="burger-line"></span>
          <span className="burger-line"></span>
          <span className="burger-line"></span>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
