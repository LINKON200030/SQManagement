import { create } from 'zustand';
import { orderService } from '../services/api';

const useOrderStore = create((set) => ({
  orders: [],
  todayOrders: [],
  upcomingOrders: [],
  loading: false,
  error: null,

  fetchAllSections: async () => {
    set({ loading: true, error: null });
    try {
      const [todayRes, upcomingRes] = await Promise.all([
        orderService.getTodayOrders(),
        orderService.getUpcomingOrders(),
      ]);
      set({ todayOrders: todayRes.data, upcomingOrders: upcomingRes.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchOrders: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const clean = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v && v !== 'all')
      );
      const response = await orderService.getAllOrders(clean);
      set({ orders: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await orderService.createOrder(data);
      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create order';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  addNote: async (id, text, author) => {
    try {
      const response = await orderService.addNote(id, { text, author });
      const updated = response.data;
      const patch = (arr) => arr.map((o) => (o._id === id ? updated : o));
      set((state) => ({
        orders: patch(state.orders),
        todayOrders: patch(state.todayOrders),
        upcomingOrders: patch(state.upcomingOrders),
      }));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateOrderStatus: async (id, updates) => {
    try {
      const response = await orderService.updateOrder(id, updates);
      const updated = response.data;
      const patch = (arr) => arr.map((o) => (o._id === id ? updated : o));
      set((state) => ({
        orders: patch(state.orders),
        todayOrders: patch(state.todayOrders),
        upcomingOrders: patch(state.upcomingOrders),
      }));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  deleteOrder: async (id) => {
    try {
      await orderService.deleteOrder(id);
      const remove = (arr) => arr.filter((o) => o._id !== id);
      set((state) => ({
        orders: remove(state.orders),
        todayOrders: remove(state.todayOrders),
        upcomingOrders: remove(state.upcomingOrders),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));

export default useOrderStore;
