import api from './api';

const masterDataService = {
  // ================= PRODUCTS =================
  getProducts: async (params) => {
    const response = await api.get('/products', { params });
    // Your backend returns { success: true, data: { products: [], count: n } }
    return response.data.data.products; 
  },

  createProduct: async (data) => {
    return api.post('/products', data);
  },

  updateProduct: async (id, data) => {
    return api.put(`/products/${id}`, data);
  },

  deleteProduct: async (id) => {
    return api.delete(`/products/${id}`);
  },

  // ================= ITEMS =================
  getItems: async (params) => {
    const response = await api.get('/items', { params });
    // Your backend returns { success: true, data: { items: [], count: n } }
    return response.data.data.items;
  },

  createItem: async (data) => {
    return api.post('/items', data);
  },

  updateItem: async (id, data) => {
    return api.put(`/items/${id}`, data);
  },

  deleteItem: async (id) => {
    return api.delete(`/items/${id}`);
  }
};

export default masterDataService;