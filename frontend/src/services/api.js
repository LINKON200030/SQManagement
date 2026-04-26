import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getAllOrders: (filters = {}) => api.get('/orders', { params: filters }),
  getTodayOrders: () => api.get('/orders/today'),
  getUpcomingOrders: () => api.get('/orders/upcoming'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrder: (id, data) => api.patch(`/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
};

export const customerService = {
  getAllCustomers: (params = {}) => api.get('/customers', { params }),
  getCustomerById: (id) => api.get(`/customers/${id}`),
};

export const partnerService = {
  getAll: () => api.get('/partners'),
  getById: (id) => api.get(`/partners/${id}`),
  create: (data) => api.post('/partners', data),
  update: (id, data) => api.patch(`/partners/${id}`, data),
  remove: (id) => api.delete(`/partners/${id}`),
};

export const monthlyReportService = {
  list: () => api.get('/monthly-reports'),
  get: (year, month) => api.get(`/monthly-reports/${year}/${month}`),
  save: (year, month, data) => api.put(`/monthly-reports/${year}/${month}`, data),
  remove: (year, month) => api.delete(`/monthly-reports/${year}/${month}`),
};

export const knowledgeService = {
  getAll: () => api.get('/knowledge'),
  create: (data) => api.post('/knowledge', data),
  update: (id, data) => api.patch(`/knowledge/${id}`, data),
  remove: (id) => api.delete(`/knowledge/${id}`),
};

export const announcementService = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.patch(`/announcements/${id}`, data),
  remove: (id) => api.delete(`/announcements/${id}`),
};

export default api;
