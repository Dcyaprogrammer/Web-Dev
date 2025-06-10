import axios from 'axios';

// 创建axios实例
const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 如果收到401错误，清除本地令牌并重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: (userData) => api.post('/register', userData),
  
  // 用户登录
  login: (credentials) => api.post('/login', credentials),
  
  // 获取用户信息
  getProfile: () => api.get('/profile'),
};

// 食物记录相关API
export const foodAPI = {
  // 创建食物记录
  createRecord: (recordData) => api.post('/food-records', recordData),
  
  // 获取食物记录
  getRecords: (params = {}) => api.get('/food-records', { params }),
  
  // 更新食物记录
  updateRecord: (id, recordData) => api.put(`/food-records/${id}`, recordData),
  
  // 删除食物记录
  deleteRecord: (id) => api.delete(`/food-records/${id}`),
};

// 其他工具函数
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api; 