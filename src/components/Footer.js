import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <Link to="/about" style={{ margin: '0 8px' }}>About</Link>
      <Link to="/contact" style={{ margin: '0 8px' }}>Contact</Link>
    </footer>
  );
}

export default Footer;