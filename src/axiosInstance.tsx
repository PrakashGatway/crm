import axios from 'axios';

const api = axios.create({
  baseURL: 'https://uat.gatewayabroadeducations.com/api/v1',
  // baseURL: 'https://m8j3lq9z-5000.inc1.devtunnels.ms/api/v1',
  // baseURL: 'http://localhost:5001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // localStorage.removeItem('accessToken');
        // localStorage.removeItem('refreshToken');
        // sessionStorage.removeItem('accessToken');
        // sessionStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export const ImageBaseUrl = "https://uat.gatewayabroadeducations.com/uploads"
export const audioBaseUrl = "https://uat.gatewayabroadeducations.com/"


export default api;