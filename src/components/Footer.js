import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <Link to="/about" className="footer-link">About</Link>
      <Link to="/contact" className="footer-link">Contact</Link>
    </footer>
  );
}

export default Footer;