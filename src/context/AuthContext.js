import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
  const KEYCLOAK_URL = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080';
  const KEYCLOAK_REALM = process.env.REACT_APP_KEYCLOAK_REALM || 'art-marketplace-realm';
  const KEYCLOAK_CLIENT_ID = process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'digital-marketplace-frontend';
  const KEYCLOAK_CLIENT_SECRET = process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET || '';

  const api = axios.create({
    baseURL: API_BASE_URL,
  });

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) throw new Error('No refresh token available');
      console.log('Refreshing token...');
      const response = await axios.post(
        `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: KEYCLOAK_CLIENT_ID,
          client_secret: KEYCLOAK_CLIENT_SECRET,
          refresh_token: storedRefreshToken,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      await parseTokenAndFetchUser(access_token);
      console.log('Token refreshed:', access_token.slice(0, 20) + '...');
      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      logout();
      throw error;
    }
  };

const parseTokenAndFetchUser = async (token) => {
  try {
    const decoded = jwtDecode(token);
    console.log('Decoded Keycloak token:', decoded);
    const keycloakId = decoded.sub;
    if (!keycloakId) throw new Error('No sub (keycloak_id) in token');
    const roles = decoded.realm_access?.roles || [];
    const role = roles.includes('admin') ? 'admin' : roles.includes('artist') ? 'artist' : roles.includes('buyer') ? 'buyer' : null;
    if (!role) {
      console.warn('No valid role found, defaulting to buyer');
      setUser({ keycloak_id: keycloakId, role: 'buyer' });
      setAuthenticated(true);
      return;
    }

    try {
      const response = await api.get('/api/users/me');
      const userData = response.data;
      console.log('Fetched user data:', userData);
      const pictureUrl = userData.profile_photo && keycloakId
        ? `http://localhost:3000/api/users/${keycloakId}/photo`
        : null;
      setUser({ ...userData, keycloak_id: keycloakId, role, picture: pictureUrl });
      setAuthenticated(true);
    } catch (fetchError) {
      console.error('Failed to fetch user data:', fetchError.message);
      if (fetchError.code === 'ERR_NETWORK' || fetchError.message.includes('Network Error')) {
        setUser({ keycloak_id: keycloakId, role, error: 'Backend unreachable' });
        setAuthenticated(false);
        return; // Don't throw, let app continue
      }
      throw fetchError; // Rethrow other errors
    }
  } catch (error) {
    console.error('Failed to parse token or fetch user data:', error.message);
    setUser(null);
    setAuthenticated(false);
    throw error;
  }
};

useEffect(() => {
  const initializeAuth = async () => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedAccessToken && storedRefreshToken) {
      try {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        await parseTokenAndFetchUser(storedAccessToken);
      } catch (error) {
        console.error('Auth initialization failed:', error.message);
        try {
          await refreshAccessToken(); // Try refreshing token
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError.message);
          logout();
        }
      }
    } else {
      setAuthenticated(false);
      setUser(null);
    }
  };

  initializeAuth();
}, []);

  const register = async (email, name, password, recaptchaToken) => {
    try {
      console.log('Registering:', { email, name, recaptchaToken });
      const response = await fetch(`${API_BASE_URL}/api/pre-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, recaptchaToken }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error response:', errorData);
        throw new Error(errorData.error || 'Registration failed');
      }
      const data = await response.json();
      return { message: data.message, nextStep: 'verify-email' }; // Signal next step
    } catch (error) {
      console.error("Registration failed:", error.message);
      throw error;
    }
  };
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: KEYCLOAK_CLIENT_ID,
          client_secret: KEYCLOAK_CLIENT_SECRET,
          username: email,
          password,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data && response.data.access_token) {
        const token = response.data.access_token;
        const refreshToken = response.data.refresh_token;

        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);

        setAccessToken(token);
        setRefreshToken(refreshToken);

        await parseTokenAndFetchUser(token);

        return { token, refreshToken };
      } else {
        throw new Error('No access token found in Keycloak response');
      }
    } catch (error) {
      throw new Error('Login failed—check your credentials or verify your email');
    }
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setAuthenticated(false);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ authenticated, register, user, setUser, login, logout, token: accessToken, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}