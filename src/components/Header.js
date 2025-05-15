import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu, LogOut, UserCircle2, ImagePlus, Palette, MessageSquare, ShoppingBag, Home, Grid,
  Search, Users, Settings
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import '../styles/styles.css';

function Header() {
  const { authenticated, user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginClicked, setLoginClicked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState({ messages: 0, orders: 0 });

  const isLandingOrLoginPage = location.pathname === '/' || location.pathname === '/login-register';

  // Fetch notification counts for messages and orders
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!authenticated || !user?.is_verified || !token || user.role === 'admin') {
        setNotifications({ messages: 0, orders: 0 });
        return;
      }

      try {
        // Fetch unread message count
        const messagesRes = await axios.get(`${API_BASE_URL}/api/notifications/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const messageCount = messagesRes.data.count || 0;

        // Fetch order count based on role
        const ordersRes = await axios.get(`${API_BASE_URL}/api/notifications/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const orderCount = ordersRes.data.count || 0;

        setNotifications({ messages: messageCount, orders: orderCount });
      } catch (err) {
        console.error('[NOTIFICATIONS ERROR]', err.response?.data || err.message);
        setNotifications({ messages: 0, orders: 0 }); // Fallback to 0 on error
      }
    };

    fetchNotifications();
    // Refetch when auth state or role changes
  }, [authenticated, user?.is_verified, user?.role, token]);

  useEffect(() => {
    console.log('Redirect check:', { authenticated, isVerified: user?.is_verified, path: location.pathname, user });
    if (authenticated && user?.is_verified && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [authenticated, user, location.pathname, navigate]);

  const handleLoginClick = () => {
    setLoginClicked(true);
    navigate('/login-register');
  };

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
    console.log('Menu open:', !menuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const commonLinks = [
    { to: '/dashboard', icon: <Grid size={16} />, label: 'Dashboard' },
    { to: '/profile', icon: <UserCircle2 size={16} />, label: 'Profile' },
  ];

  const renderMenuItems = () => {
    if (isLandingOrLoginPage) {
      return (
        <>
          <li>
            <Link to="/" onClick={toggleMenu}>
              <Home size={16} /> Home
            </Link>
          </li>
          {!authenticated && (
            <li>
              <Link to="/login-register" onClick={toggleMenu}>
                <LogOut size={16} /> Login/Register
              </Link>
            </li>
          )}
        </>
      );
    }

    if (authenticated && user?.is_verified) {
      let roleLinks = [];

      if (user.role === 'buyer') {
        roleLinks = [
          ...commonLinks,
          {
            to: '/orders',
            icon: <ShoppingBag size={16} />,
            label: 'Orders',
            badge: notifications.orders > 0 ? notifications.orders : null,
          },
          {
            to: '/messages',
            icon: <MessageSquare size={16} />,
            label: 'Messages',
            badge: notifications.messages > 0 ? notifications.messages : null,
          },
          { to: '/artworks', icon: <Search size={16} />, label: 'Search Artworks' },
          { to: '/settings', icon: <Settings size={16} />, label: 'Settings' },
        ];
      } else if (user.role === 'artist') {
        roleLinks = [
          ...commonLinks,
          { to: '/artworks', icon: <Palette size={16} />, label: 'My Artworks' },
          {
            to: '/messages',
            icon: <MessageSquare size={16} />,
            label: 'Messages',
            badge: notifications.messages > 0 ? notifications.messages : null,
          },
          { to: '/add-artwork', icon: <ImagePlus size={16} />, label: 'Add Artwork' },
          {
            to: '/orders',
            icon: <ShoppingBag size={16} />,
            label: 'Orders',
            badge: notifications.orders > 0 ? notifications.orders : null,
          },
          { to: '/settings', icon: <Settings size={16} />, label: 'Settings' },
        ];
      } else if (user.role === 'admin') {
        roleLinks = [
          { to: '/admin-panel', icon: <Users size={16} />, label: 'Admin Panel' },
          { to: '/settings', icon: <Settings size={16} />, label: 'Settings' },
        ];
      }

      return (
        <>
          {roleLinks.map(({ to, icon, label, badge }) => (
            <li key={to}>
              <Link to={to} onClick={toggleMenu}>
                {icon} {label}
                {badge && (
                  <span className="notification-badge">{badge}</span>
                )}
              </Link>
            </li>
          ))}
          <li>
            <button onClick={() => { handleLogout(); toggleMenu(); }} className="menu-logout">
              <LogOut size={16} /> Logout
            </button>
          </li>
        </>
      );
    }

    return (
      <li>
        <Link to="/login-register" onClick={toggleMenu}>
          <LogOut size={16} /> Login/Register
        </Link>
      </li>
    );
  };

  return (
    <header className="header">
      <div className="menu-icon">
        <button onClick={toggleMenu} className="menu-button">
          <Menu className="hamburger-icon" />
        </button>
      </div>

      <Link to="/" className="header-title" onClick={(e) => console.log('ARTISTIC title clicked:', { path: location.pathname, target: e.target })}>
        <img src="/assets/logo.png" alt="ARTISTIC" className="header-logo" />
        <span className="header-text">artistic</span>
      </Link>

      <div className="auth-buttons">
        {authenticated && user?.is_verified ? (
          <>
            {(user.role === 'buyer' || user.role === 'artist') && commonLinks.map(({ to, icon, label }) => (
              <Link key={to} to={to} className="header-link">
                {icon} {label}
              </Link>
            ))}
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
            <button onClick={handleLogout} className="header-link">
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          isLandingOrLoginPage && !loginClicked && (
            <Link to="/login-register" className="header-link" onClick={handleLoginClick}>
              <LogOut size={16} /> Login/Register
            </Link>
          )
        )}
      </div>

      {menuOpen && (
        <div className="menu-dropdown">
          <ul className="menu-list">
            {console.log('Menu items rendering:', { authenticated, user, isLandingOrLoginPage })}
            {renderMenuItems()}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;