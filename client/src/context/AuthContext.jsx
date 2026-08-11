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
    }, 15000);
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

  // OTP Signup Methods
  const sendSignupOtp = async (name, email, password, role = 'buyer', passcode = '') => {
    const cleanEmail = email.toLowerCase().trim();

    if (role === 'admin' && passcode !== 'shop_@') {
      return { success: false, message: 'Invalid Admin Security Code! shop_@ is required.' };
    }
    if (role === 'delivery' && passcode !== 'delivery_@') {
      return { success: false, message: 'Invalid Admin Delivery Passcode! delivery_@ is required.' };
    }

    try {
      const { data } = await axios.post(`${API_URL}/auth/send-signup-otp`, { name, email: cleanEmail, password, role });
      if (data.success) {
        if (data.otp) {
          triggerEmailNotification(
            cleanEmail,
            '🔑 Signup Verification OTP Code',
            `Hello ${name}! Your 6-digit email verification OTP for Artisan's Corner is ${data.otp}. Valid for 10 minutes.`,
            'info'
          );
        }
        return { success: true, message: data.message, otp: data.otp };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    // Local Fallback OTP Generation
    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    if (registeredUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email address already exists. Please login instead.' };
    }

    const localOtp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem(`otp_signup_${cleanEmail}`, JSON.stringify({
      name, email: cleanEmail, password, role, otp: localOtp, expires: Date.now() + 10 * 60 * 1000
    }));

    triggerEmailNotification(
      cleanEmail,
      '🔑 Signup Verification OTP Code',
      `Hello ${name}! Your 6-digit email verification OTP for Artisan's Corner is ${localOtp}. Valid for 10 minutes.`,
      'info'
    );

    return { success: true, message: `Verification OTP sent to ${cleanEmail}! Please enter the code.`, otp: localOtp };
  };

  const verifySignupOtp = async (email, otp) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    try {
      const { data } = await axios.post(`${API_URL}/auth/verify-signup-otp`, { email: cleanEmail, otp: cleanOtp });
      if (data.success) {
        setUser(data.data);
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        triggerEmailNotification(
          data.data.email,
          '🎉 Welcome to Artisan\'s Corner! Registration Successful',
          `Congratulations ${data.data.name}! Your ${data.data.role.toUpperCase()} account was created successfully.`,
          'signup'
        );

        return { success: true, message: data.message, data: data.data };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    // Local Fallback Verification
    const raw = localStorage.getItem(`otp_signup_${cleanEmail}`);
    if (!raw) return { success: false, message: 'No pending OTP found or code has expired. Please click Resend OTP.' };

    const record = JSON.parse(raw);
    if (record.expires < Date.now()) {
      localStorage.removeItem(`otp_signup_${cleanEmail}`);
      return { success: false, message: 'OTP has expired! Please click Resend OTP to get a new code.' };
    }

    if (record.otp !== cleanOtp) {
      return { success: false, message: 'Wrong OTP code! Please enter the correct 6-digit code or click Resend OTP.' };
    }

    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    const newUser = {
      _id: 'u_' + Date.now(),
      name: record.name,
      email: cleanEmail,
      password: record.password,
      role: record.role,
      token: 'token_' + Date.now()
    };
    registeredUsers.push(newUser);
    localStorage.setItem('artisans_registered_users', JSON.stringify(registeredUsers));
    localStorage.removeItem(`otp_signup_${cleanEmail}`);

    const sessionUser = { ...newUser };
    delete sessionUser.password;
    setUser(sessionUser);
    setToken(sessionUser.token);
    localStorage.setItem('token', sessionUser.token);
    localStorage.setItem('user', JSON.stringify(sessionUser));

    triggerEmailNotification(sessionUser.email, '🎉 Welcome to Artisan\'s Corner', `Congratulations ${sessionUser.name}! Registration successful.`, 'signup');
    return { success: true, message: `Account registered successfully as ${record.role.toUpperCase()}!` };
  };

  // OTP Forgot Password Methods
  const sendForgotPasswordOtp = async (email) => {
    const cleanEmail = email.toLowerCase().trim();

    try {
      const { data } = await axios.post(`${API_URL}/auth/forgot-password-otp`, { email: cleanEmail });
      if (data.success) {
        if (data.otp) {
          triggerEmailNotification(
            cleanEmail,
            '🔐 Password Reset OTP Code',
            `Your 6-digit password reset OTP is ${data.otp}. Valid for 10 minutes.`,
            'info'
          );
        }
        return { success: true, message: data.message, otp: data.otp };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    // Local Fallback Forgot Password OTP
    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    const userMatch = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!userMatch) {
      return { success: false, message: 'No registered account found with this email address. Please check your email or sign up.' };
    }

    const localOtp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem(`otp_reset_${cleanEmail}`, JSON.stringify({
      email: cleanEmail, otp: localOtp, expires: Date.now() + 10 * 60 * 1000
    }));

    triggerEmailNotification(
      cleanEmail,
      '🔐 Password Reset OTP Code',
      `Hello ${userMatch.name}! Your 6-digit password reset OTP is ${localOtp}. Valid for 10 minutes.`,
      'info'
    );

    return { success: true, message: `Password reset OTP sent to ${cleanEmail}! Please check your email.`, otp: localOtp };
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

    const raw = localStorage.getItem(`otp_reset_${cleanEmail}`);
    if (!raw) return { success: false, message: 'No pending reset OTP found or code has expired. Please click Resend OTP.' };

    const record = JSON.parse(raw);
    if (record.expires < Date.now()) {
      localStorage.removeItem(`otp_reset_${cleanEmail}`);
      return { success: false, message: 'OTP has expired! Please click Resend OTP to get a new code.' };
    }

    if (record.otp !== cleanOtp) {
      return { success: false, message: 'Wrong OTP code! Please enter the correct 6-digit code or click Resend OTP.' };
    }

    return { success: true, message: 'OTP verified successfully! You can now enter your new password.' };
  };

  const resetPassword = async (email, otp, newPassword) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    try {
      const { data } = await axios.post(`${API_URL}/auth/reset-password`, { email: cleanEmail, otp: cleanOtp, newPassword });
      if (data.success) {
        triggerEmailNotification(
          cleanEmail,
          '🔒 Security Alert: Password Updated',
          `Your Artisan's Corner account password was updated successfully. You can now login with your new password.`,
          'info'
        );
        return { success: true, message: data.message };
      }
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      if (apiMsg) return { success: false, message: apiMsg };
    }

    const registeredUsers = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    const userIndex = registeredUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);

    if (userIndex !== -1) {
      registeredUsers[userIndex].password = newPassword;
      localStorage.setItem('artisans_registered_users', JSON.stringify(registeredUsers));
      localStorage.removeItem(`otp_reset_${cleanEmail}`);

      triggerEmailNotification(cleanEmail, '🔒 Security Alert: Password Updated', `Your password was reset successfully!`, 'info');
      return { success: true, message: 'Password updated successfully! Please login with your new password.' };
    }

    return { success: false, message: 'Failed to reset password. User not found.' };
  };

  const register = async (name, email, password, role = 'buyer', passcode = '') => {
    return sendSignupOtp(name, email, password, role, passcode);
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
      sendSignupOtp,
      verifySignupOtp,
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
