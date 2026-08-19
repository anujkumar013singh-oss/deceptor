import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('deceptor_token');
    const savedUser = localStorage.getItem('deceptor_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('deceptor_token');
        localStorage.removeItem('deceptor_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('deceptor_token', authToken);
    localStorage.setItem('deceptor_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('deceptor_token');
    localStorage.removeItem('deceptor_user');
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem('deceptor_user', JSON.stringify(merged));
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/user/me');
      if (res.data.success) {
        const u = res.data.user;
        setUser(u);
        localStorage.setItem('deceptor_user', JSON.stringify(u));
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateUser, refreshUser, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
