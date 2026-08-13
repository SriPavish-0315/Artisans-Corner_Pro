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
      return savedUser;
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
            setUser(savedUser);
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
    }, 15000);
  };

  const syncRegisteredUser = (userData, plainPassword) => {
    try {
      const registered = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
      const cleanEmail = userData.email.toLowerCase().trim();
      const existingIdx = registered.findIndex(u => u && u.email?.toLowerCase().trim() === cleanEmail);
      const userItem = {
        _id: userData._id || 'u_' + Date.now(),
        name: userData.name,
        email: cleanEmail,
        password: plainPassword,
        role: userData.role || 'buyer',
        token: userData.token || 'reg-token'
      };
      if (existingIdx !== -1) {
        registered[existingIdx] = { ...registered[existingIdx], ...userItem };
      } else {
        registered.push(userItem);
      }
      localStorage.setItem('artisans_registered_users', JSON.stringify(registered));
    } catch (e) {
      console.error('Local sync notice:', e);
    }
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

    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email: cleanEmail, password, adminPasscode });
      if (data.success && data.data) {
        setUser(data.data);
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        syncRegisteredUser(data.data, password);

        return { success: true, message: data.message };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    // Database Lookup for Registered Users (Local Fallback)
    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    const matchedUser = registeredUsers.find(
      u => u && u.email?.toLowerCase().trim() === cleanEmail && u.password === password
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

      return { success: true, message: `Welcome back, ${userPayload.name}! Signed in as ${userPayload.role.toUpperCase()}.` };
    }

    return { 
      success: false, 
      message: 'Invalid email or password. Please check your credentials or register an account.' 
    };
  };

  const register = async (name, email, password, role = 'buyer', passcode = '') => {
    const cleanEmail = email.toLowerCase().trim();

    if (role === 'admin' && passcode !== 'shop_@') {
      return { success: false, message: 'Invalid Admin Security Code! shop_@ is required.' };
    }
    if (role === 'delivery' && passcode !== 'delivery_@') {
      return { success: false, message: 'Invalid Admin Delivery Passcode! delivery_@ is required.' };
    }

    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, { name, email: cleanEmail, password, role });
      if (data.success && data.data) {
        setUser(data.data);
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        syncRegisteredUser(data.data, password);

        return {
          success: true,
          message: data.message,
          data: data.data
        };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    // Local Fallback Registration
    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    if (registeredUsers.some(u => u && u.email?.toLowerCase().trim() === cleanEmail)) {
      return { success: false, message: 'An account with this email address already exists. Please login instead.' };
    }

    const newUser = {
      _id: 'u_' + Date.now(),
      name,
      email: cleanEmail,
      password,
      role,
      token: 'reg-token-' + Date.now()
    };

    registeredUsers.push(newUser);
    localStorage.setItem('artisans_registered_users', JSON.stringify(registeredUsers));

    const sessionUser = { ...newUser };
    delete sessionUser.password;
    setUser(sessionUser);
    setToken(sessionUser.token);
    localStorage.setItem('token', sessionUser.token);
    localStorage.setItem('user', JSON.stringify(sessionUser));

    return { success: true, message: `Account created successfully! Signed in as ${role.toUpperCase()}.` };
  };

  const verifyEmailOTP = async (email, otp) => {
    return { success: true, message: 'OTP verification is disabled.' };
  };

  const resendEmailOTP = async (email) => {
    return { success: true, message: 'OTP verification is disabled.' };
  };

  const sendForgotPasswordOtp = async (email) => {
    const cleanEmail = email.toLowerCase().trim();

    try {
      const { data } = await axios.post(`${API_URL}/auth/forgot-password-otp`, { email: cleanEmail });
      if (data.success) {
        return { success: true, message: data.message };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    return { success: false, message: 'Failed to send password reset OTP.' };
  };

  const verifyResetOtp = async (email, otp) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    try {
      const { data } = await axios.post(`${API_URL}/auth/verify-reset-otp`, { email: cleanEmail, otp: cleanOtp });
      if (data.success) {
        return { success: true, message: data.message };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    return { success: false, message: 'Invalid reset OTP.' };
  };

  const resetPassword = async (email, otp, newPassword) => {
    const cleanEmail = email.toLowerCase().trim();

    try {
      const { data } = await axios.post(`${API_URL}/auth/reset-password`, { email: cleanEmail, newPassword: newPassword || otp });
      if (data.success) {
        return { success: true, message: data.message };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    const userIndex = registeredUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);

    if (userIndex !== -1) {
      registeredUsers[userIndex].password = newPassword || otp;
      localStorage.setItem('artisans_registered_users', JSON.stringify(registeredUsers));

      return { success: true, message: 'Password updated successfully! Please login with your new password.' };
    }

    return { success: false, message: 'No registered account found with this email address.' };
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
    <AuthContext.Provider value={{
      user,
      loading,
      token,
      login,
      register,
      verifyEmailOTP,
      resendEmailOTP,
      sendForgotPasswordOtp,
      verifyResetOtp,
      resetPassword,
      logout,
      updateRoleToSeller,
      emailNotification,
      triggerEmailNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
