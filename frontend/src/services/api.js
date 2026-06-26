import axios from 'axios';

const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${apiBase}/api`,
});

// Admin endpoints sit behind X-Admin-Secret. Locally the secret can be left
// blank (the backend opens admin routes in non-production NODE_ENV).
const adminSecret = import.meta.env.VITE_ADMIN_SECRET || '';
if (adminSecret) {
  api.defaults.headers.common['X-Admin-Secret'] = adminSecret;
}

export const apiBaseUrl = apiBase;

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

export const expenseService = {
  uploadInvoice: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/expenses/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteFile: (key) => api.post('/expenses/delete-file', { key }),
};

export const bundlePdfUrl = (year, month) =>
  `${apiBase}/api/monthly-reports/${year}/${month}/bundle.pdf`;

export const galleryService = {
  list: () => api.get('/admin/galleries'),
  get: (id) => api.get(`/admin/galleries/${id}`),
  create: (data) => api.post('/admin/galleries', data),
  update: (id, data) => api.patch(`/admin/galleries/${id}`, data),
  remove: (id) => api.delete(`/admin/galleries/${id}`),
  // Upload a single file. Used by the parallel-upload pipeline in the UI so
  // network + server-side sharp overlap across files instead of being one big
  // serial request.
  uploadPhoto: (id, file, onProgress) => {
    const fd = new FormData();
    fd.append('files', file);
    return api.post(`/admin/galleries/${id}/photos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },
  deletePhoto: (id, photoId) => api.delete(`/admin/galleries/${id}/photos/${photoId}`),
  orders: (id) => api.get(`/admin/galleries/${id}/orders`),
};

export const printProductService = {
  list: () => api.get('/admin/print-products'),
  create: (data) => api.post('/admin/print-products', data),
  update: (id, data) => api.patch(`/admin/print-products/${id}`, data),
  remove: (id) => api.delete(`/admin/print-products/${id}`),
  seedDefaults: () => api.post('/admin/print-products/seed-defaults'),
};

export default api;
