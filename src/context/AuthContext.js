import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
    }
  }, []);

  const login = async (email, password) => {
    try {
      // Request a token from Keycloak using the Direct Access Grant
      const response = await axios.post(
        `${process.env.REACT_APP_KEYCLOAK_URL}/realms/${process.env.REACT_APP_KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
          client_secret: process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET || '', // Omit if public client
          username: email,
          password: password,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      setAuthenticated(true);
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (error) {
      console.error('Keycloak login failed:', error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (email, name, password) => {
    try {
      await axios.post('/api/pre-register', { email, name, password, recaptchaToken: 'dummy-token' }); // Replace with actual reCAPTCHA token
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ authenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}