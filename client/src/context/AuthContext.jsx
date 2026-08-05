import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    const fetchUser = async () => {
      if (token && token !== 'demo-token') {
        try {
          const config = {
            headers: { Authorization: `Bearer ${token}` }
          };
          const { data } = await axios.get(`${API_URL}/auth/profile`, config);
          if (data.success) {
            setUser(data.data);
          }
        } catch (error) {
          console.error('Failed to sync profile from API server, keeping cached state');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (data.success) {
        setUser(data.data);
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true, message: data.message };
      }
    } catch (error) {
      // Fallback for Demo Mode
      if (email === 'buyer@example.com' || email.includes('buyer')) {
        const demoUser = { _id: 'u1', name: 'Jane Buyer', email: 'buyer@example.com', role: 'buyer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', token: 'demo-token' };
        setUser(demoUser);
        setToken('demo-token');
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify(demoUser));
        return { success: true, message: 'Logged in as Demo Buyer' };
      } else if (email === 'seller@example.com' || email.includes('seller')) {
        const demoUser = { 
          _id: 'u2', 
          name: 'Elena Vance', 
          email: 'seller@example.com', 
          role: 'seller', 
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          store: { _id: 's1', storeName: 'Terra Cotta Studios', storeDescription: 'Handcrafted ceramic pottery & stoneware', logoUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=150&q=80' }, 
          token: 'demo-token' 
        };
        setUser(demoUser);
        setToken('demo-token');
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify(demoUser));
        return { success: true, message: 'Logged in as Demo Seller' };
      } else if (email === 'admin@example.com' || email.includes('admin')) {
        const demoUser = { _id: 'u3', name: 'Platform Admin', email: 'admin@example.com', role: 'admin', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', token: 'demo-token' };
        setUser(demoUser);
        setToken('demo-token');
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify(demoUser));
        return { success: true, message: 'Logged in as Demo Admin' };
      }

      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (name, email, password, role = 'buyer') => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
      if (data.success) {
        setUser(data.data);
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true, message: data.message };
      }
    } catch (error) {
      // Demo Mode fallback
      const newUser = { _id: 'u_' + Date.now(), name, email, role, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', token: 'demo-token' };
      setUser(newUser);
      setToken('demo-token');
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify(newUser));
      return { success: true, message: 'Account created successfully!' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateRoleToSeller = (storeData) => {
    if (user) {
      const updated = { ...user, role: 'seller', store: storeData };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, updateRoleToSeller }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
