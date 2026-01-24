import api from './api';

const tariffService = {
  getAll: async (productId = null) => {
    const params = productId ? { product_id: productId } : {};
    const response = await api.get('/tariffs', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/tariffs/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/tariffs', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/tariffs/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tariffs/${id}`);
    return response.data;
  },
};

export default tariffService;