import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

console.log('Env vars at startup:', {
  KEYCLOAK_URL: process.env.REACT_APP_KEYCLOAK_URL,
  KEYCLOAK_REALM: process.env.REACT_APP_KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET: process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET ? '****' : 'MISSING',
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL
});

console.log('Dummy test:', process.env.REACT_APP_TEST_DUMMY);

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

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;

      fetchUserData(storedAccessToken)
        .then((userData) => {
          setUser(userData);
          if (userData.status !== 'verified') setAuthenticated(false); // Not fully authenticated until verified
        })
        .catch((error) => {
          console.error("useEffect fetch failed:", error.message);
          logout();
        });
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

  const fetchUserData = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fetch failed: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log("User data from /api/users/me:", data);
      return { ...data, status: data.status || (data.is_verified ? 'verified' : 'pending_email_verification') };
    } catch (error) {
      console.error("Failed to fetch user data:", error.message);
      throw error;
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
          password: password,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
  
      setAccessToken(response.data.access_token);
      setRefreshToken(response.data.refresh_token);
      localStorage.setItem('accessToken', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
  
      const userData = await fetchUserData(response.data.access_token);
      setUser(userData);
      console.log("Raw user data:", userData);
      console.log("User status on login:", userData.status);
  
      if (userData.status === 'verified') {
        setAuthenticated(true);
        return { token: response.data.access_token, redirect: '/dashboard' };
      } else if (userData.status === 'pending_role_selection') {
        setAuthenticated(true);
        return { token: response.data.access_token, redirect: '/role-selection' };
      } else {
        setAuthenticated(false);
        return { token: response.data.access_token, redirect: '/verify-email' }; // Unverified should hit here
      }
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw new Error('Login failed—check your credentials or verify your email');
    }
  };
  
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
        throw new Error(errorData.error || "Registration failed");
      }
      const data = await response.json();
      return { message: data.message, nextStep: 'verify-email' }; // Signal next step
    } catch (error) {
      console.error("Registration failed:", error.message);
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
    <AuthContext.Provider value={{ authenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}