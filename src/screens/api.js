import axios from 'axios';

// Initialize axios instance
const api = axios.create({
  baseURL: 'https://kktrading-backend.vercel.app/', // https://kktrading-backend.vercel.app/
});

const userData = JSON.parse(localStorage.getItem('userInfo'));

api.interceptors.request.use(
  (config) => {
    // Exclude Cloudinary upload URL from adding headers
    if (config.url === 'https://api.cloudinary.com/v1_1/dqniuczkg/image/upload') {
      return config;
    }

   else if (config.url === 'https://script.google.com/macros/s/AKfycbzroBYkyoKev_IxlEum8cRIt4UTNkE2A9hyLCtzlcRjLNpxI57oHogqa0FB-gcD8ra43A/exec') {
      return config;
    }

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
