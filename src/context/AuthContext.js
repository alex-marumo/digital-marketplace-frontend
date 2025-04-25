import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      fetchUserData(storedAccessToken);
    } else {
      setAuthenticated(false);
      setUser(null);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await api.get(`/api/users/me`);
      setUser(response.data);
      setAuthenticated(response.data.is_verified);
    } catch (error) {
      console.error('Failed to fetch user data:', error.message);
      logout();
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

      console.log('Keycloak Response:', response.data);

      if (response.data && response.data.access_token) {
        const token = response.data.access_token;
        const refreshToken = response.data.refresh_token;

        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);

        setAccessToken(token);
        setRefreshToken(refreshToken);

        await fetchUserData(token);

        return { token, refreshToken };
      } else {
        console.error('No access_token in Keycloak response');
        throw new Error('No access token found in Keycloak response');
      }
    } catch (error) {
      console.error('Login error:', error.message);
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