import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/styles.css';

function Header() {
  const { authenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginClicked, setLoginClicked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isLandingPage = location.pathname === '/';

  const handleLoginClick = () => {
    setLoginClicked(true);
    navigate('/login-register');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="header">
      <div className="menu-icon">
        <button onClick={toggleMenu} className="menu-button">
          <span className="hamburger-icon">☰</span>
        </button>
      </div>
      <Link to="/" className="header-title">ARTISTIC</Link>
      <div className="auth-buttons">
        {authenticated && user?.role === 'buyer' && (
          <>
            <Link to="/dashboard" className="header-link">Dashboard</Link>
            <Link to="/profile" className="header-link">Profile</Link>
            <button onClick={() => { logout(); navigate('/'); }} className="header-link">
              Logout
            </button>
          </>
        )}
        {authenticated && user?.role === 'artist' && (
          <>
            <Link to="/dashboard" className="header-link">Dashboard</Link>
            <Link to="/profile" className="header-link">Profile</Link>
            <button onClick={() => { logout(); navigate('/'); }} className="header-link">
              Logout
            </button>
          </>
        )}
        {!authenticated || !user?.is_verified ? (
          (isLandingPage && !loginClicked) && (
            <Link to="/login-register" className="header-link" onClick={handleLoginClick}>
              Login/Register
            </Link>
          )
        ) : null}
      </div>

      {menuOpen && (
        <div className="menu-dropdown">
          <ul className="menu-list">
            <li>
              <Link to="/" onClick={toggleMenu}>Home</Link>
            </li>
            {authenticated && user?.is_verified && user?.role === 'buyer' && (
              <>
                <li>
                  <Link to="/dashboard" onClick={toggleMenu}>Dashboard</Link>
                </li>
                <li>
                  <Link to="/profile" onClick={toggleMenu}>Profile</Link>
                </li>
                <li>
                  <Link to="/orders" onClick={toggleMenu}>Orders</Link>
                </li>
                <li>
                  <Link to="/search" onClick={toggleMenu}>Search Artworks</Link>
                </li>
                <li>
                  <button
                    onClick={() => { logout(); navigate('/'); toggleMenu(); }}
                    className="menu-logout"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
            {authenticated && user?.is_verified && user?.role === 'artist' && (
              <>
                <li>
                  <Link to="/dashboard" onClick={toggleMenu}>Dashboard</Link>
                </li>
                <li>
                  <Link to="/profile" onClick={toggleMenu}>Profile</Link>
                </li>
                <li>
                  <Link to="/artworks" onClick={toggleMenu}>My Artworks</Link>
                </li>
                <li>
                  <Link to="/messages" onClick={toggleMenu}>Messages</Link>
                </li>
                <li>
                  <Link to="/add-artwork" onClick={toggleMenu}>Add Artwork</Link>
                </li>
                <li>
                  <button
                    onClick={() => { logout(); navigate('/'); toggleMenu(); }}
                    className="menu-logout"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
            {(!authenticated || !user?.is_verified) && (
              <li>
                <Link to="/login-register" onClick={toggleMenu}>Login/Register</Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;