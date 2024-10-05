import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import PrivateRoute from './components/PrivateRoute';
import CartScreen from './screens/CartScreen';
import HomeScreen from './screens/HomeScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import OrderScreen from './screens/OrderScreen';
import PaymentMethodScreen from './screens/PaymentMethodScreen';
import PlaceOrderScreen from './screens/PlaceOrderScreen';
import ProductListScreen from './screens/ProductListScreen';
import ProductScreen from './screens/ProductScreen';
import ProfileScreen from './screens/ProfileScreen';
import RegisterScreen from './screens/RegisterScreen';
import ShippingAddressScreen from './screens/ShippingAddressScreen';
import SigninScreen from './screens/SigninScreen';
import ProductEditScreen from './screens/ProductEditScreen';
import OrderListScreen from './screens/OrderListScreen';
import UserListScreen from './screens/UserListScreen';
import UserEditScreen from './screens/UserEditScreen';
import SellerRoute from './components/SellerRoute';
import SellerScreen from './screens/SellerScreen';
import SearchScreen from './screens/SearchScreen';
import { listProductCategories } from './actions/productActions';
import MapScreen from './screens/MapScreen';
import DashboardScreen from './screens/DashboardScreen';
import SupportScreen from './screens/SupportScreen';
import ChatBox from './components/ChatBox';
import axios from 'axios';
import AttendenceScreen from './screens/AttendenceScreen';
import Facerecognition from './screens/Facerecognition';
import Navbar from './components/Navbar';
import Chatscreen from './screens/Chatscreen';
import MapComponent from './screens/liveTracking';
import BillingScreen from './screens/BillingScreen';
import BillingList from './screens/BillingDetails';
import ReturnBillingScreen from './screens/ReturnBillingScreen';
import ReturnsPage from './screens/ReturnListPage';
import PurchasePage from './screens/PurchaseScreen';
import AllPurchases from './screens/Purchaselistscreen';
import DamageBillPage from './screens/Damagebill';
import DamagedDataScreen from './screens/listDamagebill';
import DriverPage from './screens/driverScreen';
import ProductListPage from './screens/getProductscreen';
import LowStockAndBillingPage from './screens/LowStockAndBillingPage';
import DriverBillingPage from './screens/driverInvoice';
import Drivertracker from './screens/drivertracker';

axios.defaults.baseURL = 'https://kktrading-backend.onrender.com/'; // https://kktrading-backend.onrender.com/

function App() {
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const dispatch = useDispatch();

  // const productCategoryList = useSelector((state) => state.productCategoryList);
  // const {
  //   loading: loadingCategories,
  //   error: errorCategories,
  //   categories,
  // } = productCategoryList;
  
  useEffect(() => {
    dispatch(listProductCategories());
  }, [dispatch]);

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

useEffect(() => {

  setCurrentPath(window.location.pathname)

  // Override history.pushState and history.replaceState
  const updatePath = () => {
    setCurrentPath(window.location.pathname);
  };

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (...args) {
    originalPushState.apply(window.history, args);
    updatePath();
  };

  window.history.replaceState = function (...args) {
    originalReplaceState.apply(window.history, args);
    updatePath();
  };

  // Listen for popstate event (triggered by browser navigation)
  window.addEventListener('popstate', updatePath);

  // Cleanup on component unmount
  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener('popstate', updatePath);
  };
}, []);

  return (
    <BrowserRouter>
      <div>

      { currentPath === '/' && <Navbar />}
        <main>
                            <Routes>
            <Route path="/seller/:id" element={<SellerScreen />}></Route>
            <Route path="/cart" element={<CartScreen />}></Route>
            <Route path="/cart/:id" element={<CartScreen />}></Route>
            <Route
              path="/product/:id"
              element={<ProductScreen />}
              exact
            ></Route>
            <Route
              path="/product/:id/edit"
              element={<ProductEditScreen />}
              exact
            ></Route>
            <Route path="/signin" element={<SigninScreen />}></Route>
            <Route path="/face-id" element={<Facerecognition />}></Route>
            <Route path="/register" element={<RegisterScreen />}></Route>
            <Route path="/shipping" element={<ShippingAddressScreen />}></Route>
            <Route path="/create-bill" element={<BillingScreen/>}></Route>
            <Route path="/bills" element={<BillingList/>}></Route>
            <Route path="/purchase" element={<PurchasePage />}></Route>
            <Route path="/allpurchases" element={<AllPurchases />}></Route>
            <Route path="/returns" element={<ReturnsPage />}></Route>
            <Route path="/create-damage" element={<DamageBillPage />}></Route>
            <Route path="/damages" element={<DamagedDataScreen />}></Route>
            <Route path="/create-return" element={<ReturnBillingScreen />}></Route>
            <Route path="/driver" element={<DriverPage />}></Route>
            <Route path="/driver-invoice" element={<DriverBillingPage />}></Route>
            <Route path="/low-stock" element={<LowStockAndBillingPage />}></Route>
            <Route path="/get-product" element={<ProductListPage />}></Route>
            <Route path="/payment" element={<PaymentMethodScreen />}></Route>
            <Route path="/placeorder" element={<PlaceOrderScreen />}></Route>
            <Route path="/order/:id" element={<OrderScreen />}></Route>
            <Route path="/driver-tracker/:invoiceNo" element={<Drivertracker />}></Route>
            <Route
              path="/orderhistory"
              element={<OrderHistoryScreen />}
            ></Route>
            <Route path="/search/name" element={<SearchScreen />} exact></Route>
            <Route
              path="/search/name/:name"
              element={<SearchScreen />}
              exact
            ></Route>
            <Route
              path="/search/category/:category"
              element={<SearchScreen />}
              exact
            ></Route>

            <Route
              path="/search/category/:category/name/:name"
              element={<SearchScreen />}
              exact
            ></Route>
            <Route
              path="/search/category/:category/name/:name/min/:min/max/:max/rating/:rating/order/:order/pageNumber/:pageNumber"
              element={<SearchScreen />}
              exact
            ></Route>

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfileScreen />
                </PrivateRoute>
              }
            />

            <Route
              path="/map"
              element={
                <PrivateRoute>
                  <MapScreen />
                </PrivateRoute>
              }
            />

            <Route
              path="/productlist"
              element={
                <AdminRoute>
                  <ProductListScreen />
                </AdminRoute>
              }
            />

            <Route
              path="/productlist/pageNumber/:pageNumber"
              element={
                <AdminRoute>
                  <ProductListScreen />
                </AdminRoute>
              }
            />
            <Route
              path="/orderlist"
              element={
                <AdminRoute>
                  <OrderListScreen />
                </AdminRoute>
              }
            />
            <Route
              path="/userlist"
              element={
                <AdminRoute>
                  <UserListScreen />
                </AdminRoute>
              }
            />
            <Route
              path="/user/:id/edit"
              element={
                <AdminRoute>
                  <UserEditScreen />
                </AdminRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <DashboardScreen />
                </AdminRoute>
              }
            />
            <Route
              path="/support"
              element={
                <AdminRoute>
                  <SupportScreen />
                </AdminRoute>
              }
            />
            <Route
              path="/productlist/seller"
              element={
                <SellerRoute>
                  <ProductListScreen />
                </SellerRoute>
              }
            />
            <Route
              path="/orderlist/seller"
              element={
                <SellerRoute>
                  <OrderListScreen />
                </SellerRoute>
              }
            />

            <Route
              path="/attendence"
              element={
                <SellerRoute>
                  <AttendenceScreen />
                </SellerRoute>
              }
            />
            

            <Route path="/chat" element={<Chatscreen />}></Route>
            <Route path="/live-tracking" element={<MapComponent />}></Route>
            <Route path="/" element={<HomeScreen />} exact></Route>

          </Routes>
          {userInfo && !userInfo.isAdmin && currentPath !== '/chat' && <ChatBox userInfo={userInfo} />}
        </main>
        {/* <footer className="row center">
          {userInfo && !userInfo.isAdmin && <ChatBox userInfo={userInfo} />}
          <div>All right reserved</div>{' '}
        </footer> */}
      </div>
    </BrowserRouter>
  );
}

export default App;
