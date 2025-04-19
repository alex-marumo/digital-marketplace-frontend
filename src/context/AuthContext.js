import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

console.log('Env vars at startup:', {
  KEYCLOAK_URL: process.env.REACT_APP_KEYCLOAK_URL,
  KEYCLOAK_REALM: process.env.REACT_APP_KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET: process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET ? '****' : 'MISSING',
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL
});

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
  const KEYCLOAK_URL = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080';
  const KEYCLOAK_REALM = process.env.REACT_APP_KEYCLOAK_REALM || 'art-marketplace-realm';
  const KEYCLOAK_CLIENT_ID = process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'digital-marketplace-frontend';
  const KEYCLOAK_CLIENT_SECRET = process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET || '';

  if (!process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET) {
    console.error('FATAL: REACT_APP_KEYCLOAK_CLIENT_SECRET missing from .env');
  }

  const fetchUserData = async (token) => {
    try {
      console.log('Fetching user data with token:', token?.slice(0, 20) + '...');
      const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = response.data;
      console.log('User data from /api/users/me:', { role: data.role, is_verified: data.is_verified, status: data.status, ...data });
      return data;
    } catch (error) {
      console.error('Failed to fetch user data:', error.response?.data || error.message);
      throw error;
    }
  };

  useEffect(() => {
    console.log('AuthContext useEffect running');
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    console.log('Stored tokens:', {
      accessToken: storedAccessToken ? 'present' : 'missing',
      refreshToken: storedRefreshToken ? 'present' : 'missing'
    });

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
      fetchUserData(storedAccessToken)
        .then((userData) => {
          setUser(userData);
          setAuthenticated(userData.is_verified);
          console.log('Initial user state:', { role: userData.role, is_verified: userData.is_verified, status: userData.status });
        })
        .catch((error) => {
          console.error('Initial fetch failed, clearing state:', error.message);
          setUser(null);
          setAuthenticated(false);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          delete axios.defaults.headers.common['Authorization'];
        });
    } else {
      console.log('No tokens found, staying unauthenticated');
      setAuthenticated(false);
      setUser(null);
    }
  }, []);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return {};
    }
  };

  const axiosKeycloak = axios.create({
    baseURL: KEYCLOAK_URL
  });

  const login = async (email, password) => {
    try {
      const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'password',
          client_id: KEYCLOAK_CLIENT_ID,
          client_secret: KEYCLOAK_CLIENT_SECRET,
          username: email,
          password,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const token = response.data.access_token;
      setAccessToken(token);
      setRefreshToken(response.data.refresh_token);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const userData = await fetchUserData(token);
      setUser(userData);
      setAuthenticated(userData.is_verified);
      console.log('Login user data:', { role: userData.role, is_verified: userData.is_verified, status: userData.status });
      console.log('Login complete, no redirect enforced:', { role: userData.role, is_verified: userData.is_verified, status: userData.status });
      return { token };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw new Error('Login failed—check your credentials or verify your email');
    }
  };

  const register = async (email, name, password, recaptchaToken) => {
    try {
      console.log('Registering:', { email, name, recaptchaToken });
      const response = await axios.post(`${API_BASE_URL}/api/pre-register`, {
        email,
        name,
        password,
        recaptchaToken,
      });
      return { message: response.data.message, nextStep: 'verify-email' };
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setAuthenticated(false);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ authenticated, user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}