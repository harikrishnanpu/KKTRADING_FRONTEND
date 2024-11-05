import axios from 'axios';

// Initialize axios instance
const api = axios.create({
  baseURL: 'https://kktrading-backend.vercel.app/', // replace with your API URL
});

const userData = JSON.parse(localStorage.getItem('userInfo'));

api.interceptors.request.use(
  (config) => {
    // Attach user information to the request if userData exists
    if (userData) {
      config.headers['user'] = JSON.stringify({
        userId: userData._id,
        username: userData.name,
      });
    }
    // Set Authorization header for all requests if userData exists
    if (userData && userData.token) {
      config.headers.Authorization = `Bearer ${userData.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
