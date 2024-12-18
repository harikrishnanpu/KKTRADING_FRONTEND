import React from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client'; // Note the change here
import './index.css';
import './navbar.css'
import App from './App';
import * as serviceWorker from './serviceWorker';
import store from './store';
import reportWebVitals from "./reportWebVitals"; // Import reportWebVitals

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
    <App />
    </Provider>
  </React.StrictMode>
);

// Register the service worker
serviceWorker.register();

reportWebVitals();
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
