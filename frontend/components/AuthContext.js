'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Configure Axios defaults
axios.defaults.withCredentials = true;

// Simple in-memory GET response cache (10s TTL)
const responseCache = new Map();
const CACHE_TTL = 10_000;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (config.method !== 'get') return config;
  const key = config.url + ':' + JSON.stringify(config.params);
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.reject({ __fromCache: true, data: cached.data });
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config?.method === 'get') {
      const key = response.config.url + ':' + JSON.stringify(response.config.params);
      responseCache.set(key, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  (error) => {
    if (error.__fromCache) {
      return Promise.resolve({ data: error.data });
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/me');
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data && response.data.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      // Logout API failed — clear local state anyway
    }
    responseCache.clear();
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
