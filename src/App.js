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
import PWAInstallPrompt from './components/pwaInstall';
import EditBillScreen from './screens/EditBillScreen';
import EditPurchaseScreen from './screens/EditPurchaseScreen';
import AdminLogsPage from './screens/AlllogsScreen';
import ReturnEditScreen from './screens/EditreturnScreen';
import PaymentUpdatePage from './screens/paymentUpdateScreen';
import SalesReport from './screens/salesReport';
import DailyTransactions from './screens/dailyTransactionsScreen';
import EditPurchasePaymentPage from './screens/updatePurchasePyaments';
import PaymentAccountForm from './screens/createAccount';
import PaymentAccountsList from './screens/AccountsListScreen';
import EditTransportPaymentPage from './screens/EditTransportpaymentsPage';
import VerifyBill from './screens/verifyBills';
import PurchaseInfo from './screens/purchaseInfo';
import SiteReportPage from './screens/siteReportingScreen';
import SiteReportListPage from './screens/siteReportListScreen';
import SiteReportEditPage from './screens/editSiteReportPage';
import CustomerAccountForm from './screens/createCustomerAccount';
import CustomerAccountList from './screens/customerAccounts';
import CustomerAccountEdit from './screens/customerAccountEditScreen';
import SupplierAccountForm from './screens/createSupplierAcccont';
import SupplierAccountEdit from './screens/SupplierAccountEditScreen';
import SupplierAccountList from './screens/supplierAccounts';
import PurchaseReport from './screens/purchaseReportPage';
import TransportPaymentEdit from './screens/editTransportAccounts';
import TransportPaymentForm from './screens/createTransportAccounts';
import TransportPaymentList from './screens/transportPaymentsList';
import StockRegistry from './screens/stockRegistryScreen';
import StockUpdatePage from './screens/stockUpdateScreen';
import LeaveApplicationForm from './screens/leaveApplicationForm';
import AllLeavesPage from './screens/allLeaveListScreen';


function App() {
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const dispatch = useDispatch();
  
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
      <PWAInstallPrompt />
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
            <Route path="/bills/edit/:id" element={<EditBillScreen/>}></Route>
            <Route path="/bills/edit" element={<EditBillScreen/>}></Route>
            <Route path="/bills/payment" element={<PaymentUpdatePage/>}></Route>
            <Route path="/purchase" element={<PurchasePage />}></Route>
            <Route path="/purchase/edit/:id" element={<EditPurchaseScreen />}></Route>
            <Route path="/purchase/edit" element={<EditPurchaseScreen />}></Route>
            <Route path="/allpurchases" element={<AllPurchases />}></Route>
            <Route path="/purchase-report" element={<PurchaseReport />}></Route>
            <Route path="/returns" element={<ReturnsPage />}></Route>
            <Route path="/return/edit/:id" element={<ReturnEditScreen />}></Route>
            <Route path="/return/edit" element={<ReturnEditScreen />}></Route>
            <Route path="/create-damage" element={<DamageBillPage />}></Route>
            <Route path="/damages" element={<DamagedDataScreen />}></Route>
            <Route path="/create-return" element={<ReturnBillingScreen />}></Route>
            <Route path="/driver" element={<DriverPage />}></Route>
            <Route path="/driver/:id" element={<DriverPage />}></Route>
            <Route path="/driver-invoice" element={<DriverBillingPage />}></Route>
            <Route path="/low-stock" element={<LowStockAndBillingPage />}></Route>
            <Route path="/get-product" element={<ProductListPage />}></Route>
            <Route path="/get-product/:id" element={<ProductListPage />}></Route>
            <Route path="/payment" element={<PaymentMethodScreen />}></Route>
            <Route path="/placeorder" element={<PlaceOrderScreen />}></Route>
            <Route path="/order/:id" element={<OrderScreen />}></Route>
            <Route path="/admin/alllogs" element={<AdminLogsPage />}></Route>
            <Route path="/driver-tracker/:invoiceNo" element={<Drivertracker />}></Route>
            <Route path="/driver-tracker" element={<Drivertracker />}></Route>
            <Route path="/sales-report" element={<SalesReport />}></Route>
            <Route path="/daily-transactions" element={<DailyTransactions />}></Route>
            <Route path="/purchase-payments" element={<EditPurchasePaymentPage />}></Route>
            <Route path="/create-account" element={<PaymentAccountForm />}></Route>
            <Route path="/payment-accounts" element={<PaymentAccountsList />}></Route>
            <Route path="/create-customer-account" element={<CustomerAccountForm />}></Route>
            <Route path="/customer-accounts" element={<CustomerAccountList />}></Route>
            <Route path="/create-seller-account" element={<SupplierAccountForm />}></Route>
            <Route path="/seller/edit/:id" element={<SupplierAccountEdit />}></Route>
            <Route path="/seller-accounts" element={<SupplierAccountList />}></Route>
            <Route path="/customer/edit/:id" element={<CustomerAccountEdit />}></Route>
            <Route path="/transport-payments" element={<EditTransportPaymentPage />}></Route>
            <Route path="/purchases" element={<PurchaseInfo />}></Route>
            <Route path="/purchases/:id" element={<PurchaseInfo />}></Route>
            <Route path="/verify" element={<VerifyBill />}></Route>
            <Route path="/report-site" element={<SiteReportPage />}></Route>
            <Route path="/report/edit/:id" element={<SiteReportEditPage />}></Route>
            <Route path="/all-sites" element={<SiteReportListPage />}></Route>
            <Route path="/all-transport-payments" element={<TransportPaymentList />}></Route>
            <Route path="/create-transport-payments" element={<TransportPaymentForm />}></Route>
            <Route path="/transport-payments/edit/:id" element={<TransportPaymentEdit />}></Route>
            <Route path="/stock-logs" element={<StockRegistry />}></Route>
            <Route path="/update-stock" element={<StockUpdatePage />}></Route>
            <Route path="/leave" element={<LeaveApplicationForm />}></Route>
            <Route path="/all-leaves" element={<AllLeavesPage />}></Route>
            <Route
              path="/orderhistory"
              element={<OrderHistoryScreen />}
            ></Route>

 {/* Basic Search */}
 <Route path="/search/name" element={<SearchScreen />} exact />
        <Route path="/search/name/:name" element={<SearchScreen />} exact />

        {/* Category-Based Search */}
        <Route path="/search/category/:category" element={<SearchScreen />} exact />
        <Route path="/search/category/:category/name/:name" element={<SearchScreen />} exact />

        {/* Brand-Based Search */}
        <Route path="/search/category/:category/brand/:brand" element={<SearchScreen />} exact />
        <Route path="/search/category/:category/brand/:brand/name/:name" element={<SearchScreen />} exact />

        {/* Size-Based Search */}
        <Route path="/search/category/:category/brand/:brand/size/:size" element={<SearchScreen />} exact />
        <Route path="/search/category/:category/brand/:brand/size/:size/name/:name" element={<SearchScreen />} exact />

        {/* Price, Rating, and Sorting */}
        <Route
          path="/search/category/:category/brand/:brand/size/:size/name/:name/min/:min/max/:max"
          element={<SearchScreen />}
        />
        <Route
          path="/search/category/:category/brand/:brand/size/:size/name/:name/min/:min/max/:max/rating/:rating"
          element={<SearchScreen />}
        />
        <Route
          path="/search/category/:category/brand/:brand/size/:size/name/:name/min/:min/max/:max/rating/:rating/order/:order"
          element={<SearchScreen />}
        />

        {/* Full Combination with Pagination */}
        <Route
          path="/search/category/:category/brand/:brand/size/:size/name/:name/min/:min/max/:max/rating/:rating/order/:order/pageNumber/:pageNumber"
          element={<SearchScreen />}
        />


<Route
          path="/search/category/:category/brand/:brand/size/:size/name/:name/min/:min/max/:max/rating/:rating/order/:order/inStock/:inStock/countInStockMin/:countInStockMin/pageNumber/:pageNumber"
          element={<SearchScreen />}
        />

            <Route
              path="/profile"
              element={
                  <ProfileScreen />
              }
            />

            <Route
              path="/map"
              element={
                  <MapScreen />
              }
            />

            <Route
              path="/productlist"
              element={
                  <ProductListScreen />
              }
            />

            <Route
              path="/productlist/pageNumber/:pageNumber"
              element={
                  <ProductListScreen />
              }
            />
            <Route
              path="/orderlist"
              element={
                  <OrderListScreen />
              }
            />
            <Route
              path="/userlist"
              element={
                  <UserListScreen />
              }
            />
            <Route
              path="/user/:id/edit"
              element={
                  <UserEditScreen />
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
                  <SupportScreen />
              }
            />
            <Route
              path="/productlist/seller"
              element={
                  <ProductListScreen />
              }
            />
            <Route
              path="/orderlist/seller"
              element={
                  <OrderListScreen />
              }
            />

            <Route
              path="/attendence"
              element={
                  <AttendenceScreen />
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
