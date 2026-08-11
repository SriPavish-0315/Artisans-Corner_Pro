import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedStr = localStorage.getItem('user');
      if (!savedStr) return null;
      const savedUser = JSON.parse(savedStr);
      const registered = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
      const match = registered.find(u => u.email?.toLowerCase().trim() === savedUser?.email?.toLowerCase().trim());
      if (match) {
        const clean = { ...match };
        delete clean.password;
        return clean;
      }
      // If not in registered database, clear storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('artisans_cart');
      return null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    const fetchUser = async () => {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
          
          const matchedUser = registeredUsers.find(
            u => u.email?.toLowerCase().trim() === savedUser?.email?.toLowerCase().trim()
          );

          if (matchedUser) {
            const cleanUser = { ...matchedUser };
            delete cleanUser.password;
            setUser(cleanUser);
            localStorage.setItem('user', JSON.stringify(cleanUser));
          } else if (token && token !== 'demo-token' && token !== 'reg-token') {
            try {
              const config = { headers: { Authorization: `Bearer ${token}` } };
              const { data } = await axios.get(`${API_URL}/auth/profile`, config);
              if (data.success && data.data && data.data.email) {
                setUser(data.data);
                localStorage.setItem('user', JSON.stringify(data.data));
              } else {
                setUser(null);
                setToken('');
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('artisans_cart');
              }
            } catch (err) {
              setUser(null);
              setToken('');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              localStorage.removeItem('artisans_cart');
            }
          } else {
            setUser(null);
            setToken('');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('artisans_cart');
          }
        } catch (e) {
          setUser(null);
          setToken('');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('artisans_cart');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const [emailNotification, setEmailNotification] = useState(null);

  const triggerEmailNotification = (toEmail, subject, body, type = 'info') => {
    if (!toEmail) return;

    const notifObj = {
      id: Date.now(),
      to: toEmail.toLowerCase().trim(),
      subject,
      body,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setEmailNotification(notifObj);
    setTimeout(() => {
      setEmailNotification(null);
    }, 12000);
  };

  const login = async (email, password, adminPasscode = '') => {
    const cleanEmail = email.toLowerCase().trim();
    const isAdminTarget = cleanEmail === 'admin@example.com' || cleanEmail.includes('admin');

    if (isAdminTarget && adminPasscode !== 'shop_@') {
      return { 
        success: false, 
        message: 'Invalid Admin Security Code! Default admin code shop_@ is required.' 
      };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const dateStr = now.toLocaleDateString();

    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email: cleanEmail, password, adminPasscode });
      if (data.success) {
        setUser(data.data);
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        triggerEmailNotification(
          data.data.email,
          '🔐 Account Login Security Notification',
          `Hello ${data.data.name}! You successfully logged in to your Artisan's Corner ${data.data.role.toUpperCase()} account on ${dateStr} at ${timeStr}.`,
          'login'
        );

        return { success: true, message: data.message };
      }
    } catch (error) {
      console.log('API auth offline/failed, performing database lookup from local storage');
    }

    // Database Lookup for Registered Users
    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    const matchedUser = registeredUsers.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (matchedUser) {
      if (matchedUser.role === 'admin' && adminPasscode !== 'shop_@') {
        return { 
          success: false, 
          message: 'Invalid Admin Security Code! Default admin code shop_@ is required to access Admin account.' 
        };
      }

      const userPayload = { ...matchedUser };
      delete userPayload.password;
      setUser(userPayload);
      setToken(userPayload.token || 'reg-token');
      localStorage.setItem('token', userPayload.token || 'reg-token');
      localStorage.setItem('user', JSON.stringify(userPayload));

      triggerEmailNotification(
        userPayload.email,
        '🔐 Account Login Security Notification',
        `Hello ${userPayload.name}! You successfully logged in to your Artisan's Corner ${userPayload.role.toUpperCase()} account on ${dateStr} at ${timeStr}.`,
        'login'
      );

      return { success: true, message: `Welcome back, ${userPayload.name}! Signed in as ${userPayload.role.toUpperCase()}.` };
    }

    return { 
      success: false, 
      message: 'Invalid email or password. Please check your credentials or register an account.' 
    };
  };

  const register = async (name, email, password, role = 'buyer', passcode = '') => {
    if (role === 'admin' && passcode !== 'shop_@') {
      return { 
        success: false, 
        message: 'Invalid Admin Security Code! The admin code shop_@ is required.' 
      };
    }

    if (role === 'delivery' && passcode !== 'delivery_@') {
      return {
        success: false,
        message: 'Invalid Admin Delivery Passcode! You must enter the Admin Delivery Passcode (delivery_@) assigned by Admin to create a Door Delivery Partner account.'
      };
    }

    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password, role, adminPasscode });
      if (data.success) {
        setUser(data.data);
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
      }
    } catch (error) {
      console.log('API registration offline/failed, registering user in local database');
    }

    // Permanent Save into Local Database
    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    const userExists = registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (userExists) {
      return { success: false, message: 'An account with this email address already exists. Please login instead.' };
    }

    const newUser = {
      _id: 'u_' + Date.now(),
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'buyer',
      avatar: role === 'delivery'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        : role === 'admin'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
        : role === 'seller'
        ? 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=150&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      token: 'token_' + Date.now()
    };

    registeredUsers.push(newUser);
    localStorage.setItem('artisans_registered_users', JSON.stringify(registeredUsers));

    const sessionUser = { ...newUser };
    delete sessionUser.password;
    setUser(sessionUser);
    setToken(sessionUser.token);
    localStorage.setItem('token', sessionUser.token);
    localStorage.setItem('user', JSON.stringify(sessionUser));

    triggerEmailNotification(sessionUser.email, '🎉 Welcome Email Notification', `Congratulations ${sessionUser.name}! Your Artisan's Corner ${role.toUpperCase()} account was registered successfully in the database.`, 'signup');

    return { success: true, message: `Account registered successfully as ${role.toUpperCase()}!` };
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('artisans_cart');
  };

  const updateRoleToSeller = (storeData) => {
    if (user) {
      const updated = { ...user, role: 'seller', store: storeData };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, updateRoleToSeller, emailNotification, triggerEmailNotification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
