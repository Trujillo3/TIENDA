import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const auth = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  }
};

export const products = {
  
  getAll: async () => {
    const res = await api.get('/products');
    return res.data;
    
  },
  getOne: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/products', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    try {
      const res = await api.delete(`/products/${id}`);
      return res.data;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error.response?.data || { message: 'Error al eliminar el producto' };
    }
  },
};

export const automation = {
  run: async () => {
    const res = await api.post('/run-automation');
    return res.data;
  }
};
