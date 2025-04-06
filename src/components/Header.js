import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth instead
import '../styles/styles.css';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginClicked, setLoginClicked] = useState(false);

  const isLandingPage = location.pathname === '/';

  const handleLoginClick = () => {
    setLoginClicked(true);
    navigate('/login-register');
  };

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
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="header-link"
            >
              Logout
            </button>
          </>
        ) : (
          (isLandingPage && !loginClicked) && (
            <Link
              to="/login-register"
              className="header-link"
              onClick={handleLoginClick}
            >
              Login/Register
            </Link>
          )
        )}
      </div>
    </header>
  );
}

export default Header;