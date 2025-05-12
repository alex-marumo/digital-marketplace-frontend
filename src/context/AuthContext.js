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
          logout();
        }
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    };

    initializeAuth();
  }, []);

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
          setUser({ keycloak_id: keycloakId, role: 'buyer' }); // Fallback
          setAuthenticated(true);
          return;
       }

      const response = await api.get('/api/users/me');
      const userData = response.data;
      console.log('Fetched user data:', userData);
      setUser({ ...userData, keycloak_id: keycloakId, role });
      setAuthenticated(userData.is_verified || true);
    } catch (error) {
      console.error('Failed to parse token or fetch user data:', error.message);
      setUser(null);
      setAuthenticated(false);
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
    <AuthContext.Provider value={{ authenticated, user, setUser, login, logout, token: accessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}