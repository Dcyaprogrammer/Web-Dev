import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, getUser, setAuthToken, setUser, clearAuth } from '../services/api';

// 创建认证上下文
const AuthContext = createContext();

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 检查本地存储中的认证状态
  useEffect(() => {
    const token = getAuthToken();
    const userData = getUser();
    
    if (token && userData) {
      setUserState(userData);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  // 登录函数
  const login = (token, userData) => {
    setAuthToken(token);
    setUser(userData);
    setUserState(userData);
    setIsAuthenticated(true);
  };

  // 登出函数
  const logout = () => {
    clearAuth();
    setUserState(null);
    setIsAuthenticated(false);
  };

  // 更新用户信息
  const updateUser = (userData) => {
    setUser(userData);
    setUserState(userData);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 