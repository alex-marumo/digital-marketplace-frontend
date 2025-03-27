// src/components/Header.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles.css';

function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="menu-icon">
        <Link to="/menu" className="menu-link">
          <span className="hamburger-icon">☰</span>
        </Link>
      </div>
      <Link to="/" className="header-title">ARTISTIC</Link>
      <div className="auth-buttons">
        {user ? (
          <>
            <Link to="/dashboard" className="header-link">Dashboard</Link>
            <Link to="/profile" className="header-link">Profile</Link>
            <button onClick={() => { logout(); navigate('/'); }} className="header-link">Logout</button>
          </>
        ) : (
          <Link to="/login-register" className="header-link">Login/Register</Link>
        )}
      </div>
    </header>
  );
}

export default Header;