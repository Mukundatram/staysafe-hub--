import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('staysafe-token'));
  const [loading, setLoading] = useState(true);

  // Set auth header on token change
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('staysafe-token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('staysafe-token');
    }
  }, [token]);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.id,
            role: payload.role,
          });
        } catch (error) {
          console.error('Invalid token:', error);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: authToken, user: userData } = response.data;

      setToken(authToken);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}!`);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Step 1: register — sends OTP, returns pendingUserId
  const register = useCallback(async (name, email, password, role = 'student') => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      toast.success(response.data.message || 'Verification code sent!');
      return { success: true, pendingUserId: response.data.pendingUserId };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Step 2: verify OTP — creates user, returns token
  const verifyOtp = useCallback(async (pendingUserId, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { pendingUserId, otp });
      const { token: authToken, user: userData } = response.data;

      setToken(authToken);
      setUser(userData);
      toast.success('Email verified! Welcome to StaySafe Hub!');

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Resend OTP
  const resendOtp = useCallback(async (pendingUserId) => {
    try {
      const response = await api.post('/auth/resend-otp', { pendingUserId });
      toast.success(response.data.message || 'New code sent!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend code';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
