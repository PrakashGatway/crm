import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://qr6mhl7d-5001.usw3.devtunnels.ms/api/v1',
  baseURL: 'https://server.gatewayabroadeducations.com/api/v1',
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

export const ImageBaseUrl = "https://server.gatewayabroadeducations.com/uploads"
export const audioBaseUrl = "https://server.gatewayabroadeducations.com/"

export const automationAPI = {
  getAll: (filters) => api.get("/automations", { params: filters }),
  getById: (id) => api.get(`/automations/${id}`),
  create: (data) => api.post("/automations", data),
  update: (id, data) => api.put(`/automations/${id}`, data),
  delete: (id) => api.delete(`/automations/${id}`),
  duplicate: (id) => api.post(`/automations/${id}/duplicate`),
  toggleStatus: (id) => api.patch(`/automations/${id}/toggle-status`),
  validate: (data) => api.post("/automations/validate", data),
};


export default api;