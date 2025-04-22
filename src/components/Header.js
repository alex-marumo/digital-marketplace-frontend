import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu, LogOut, UserCircle2, ImagePlus, Palette, MessageSquare, ShoppingBag, Home, Grid,
  Search, Users, FileText, Settings, ShoppingCart, FilePlus
} from 'lucide-react';
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
          <Menu className="hamburger-icon" />
        </button>
      </div>
      <Link to="/" className="header-title">ARTISTIC</Link>
      <div className="auth-buttons">
        {authenticated && user?.is_verified && (
          <>
            {(user.role === 'buyer' || user.role === 'artist') && (
              <>
                <Link to="/dashboard" className="header-link">
                  <Grid size={16} /> Dashboard
                </Link>
                <Link to="/profile" className="header-link">
                  <UserCircle2 size={16} /> Profile
                </Link>
                <Link to="/settings" className="header-link">
                  <Settings size={16} /> Settings
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <Link to="/admin-panel" className="header-link">
                  <Users size={16} /> Admin Panel
                </Link>
                <Link to="/settings" className="header-link">
                  <Settings size={16} /> Settings
                </Link>
              </>
            )}
            <button onClick={() => { logout(); navigate('/'); }} className="header-link">
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
        {!authenticated || !user?.is_verified ? (
          isLandingPage && !loginClicked && (
            <Link to="/login-register" className="header-link" onClick={handleLoginClick}>
              <LogOut size={16} /> Login/Register
            </Link>
          )
        ) : null}
      </div>

      {menuOpen && (
        <div className="menu-dropdown">
          <ul className="menu-list">
            <li>
              <Link to="/" onClick={toggleMenu}>
                <Home size={16} /> Home
              </Link>
            </li>
            {authenticated && user?.is_verified && user?.role === 'buyer' && (
              <>
                <li>
                  <Link to="/dashboard" onClick={toggleMenu}>
                    <Grid size={16} /> Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/profile" onClick={toggleMenu}>
                    <UserCircle2 size={16} /> Profile
                  </Link>
                </li>
                <li>
                  <Link to="/orders" onClick={toggleMenu}>
                    <ShoppingBag size={16} /> Orders
                  </Link>
                </li>
                <li>
                  <Link to="/artworks" onClick={toggleMenu}>
                    <Search size={16} /> Search Artworks
                  </Link>
                </li>
                <li>
                  <Link to="/settings" onClick={toggleMenu}>
                    <Settings size={16} /> Settings
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => { logout(); navigate('/'); toggleMenu(); }}
                    className="menu-logout"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </li>
              </>
            )}
            {authenticated && user?.is_verified && user?.role === 'artist' && (
              <>
                <li>
                  <Link to="/dashboard" onClick={toggleMenu}>
                    <Grid size={16} /> Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/profile" onClick={toggleMenu}>
                    <UserCircle2 size={16} /> Profile
                  </Link>
                </li>
                <li>
                  <Link to="/artworks" onClick={toggleMenu}>
                    <Palette size={16} /> My Artworks
                  </Link>
                </li>
                <li>
                  <Link to="/messages" onClick={toggleMenu}>
                    <MessageSquare size={16} /> Messages
                  </Link>
                </li>
                <li>
                  <Link to="/add-artwork" onClick={toggleMenu}>
                    <ImagePlus size={16} /> Add Artwork
                  </Link>
                </li>
                <li>
                  <Link to="/settings" onClick={toggleMenu}>
                    <Settings size={16} /> Settings
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => { logout(); navigate('/'); toggleMenu(); }}
                    className="menu-logout"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </li>
              </>
            )}
            {authenticated && user?.is_verified && user?.role === 'admin' && (
              <>
                <li>
                  <Link to="/admin-panel" onClick={toggleMenu}>
                    <Users size={16} /> Admin Panel
                  </Link>
                </li>
                <li>
                  <Link to="/settings" onClick={toggleMenu}>
                    <Settings size={16} /> Settings
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => { logout(); navigate('/'); toggleMenu(); }}
                    className="menu-logout"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </li>
              </>
            )}
            {(!authenticated || !user?.is_verified) && (
              <li>
                <Link to="/login-register" onClick={toggleMenu}>
                  <LogOut size={16} /> Login/Register
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;