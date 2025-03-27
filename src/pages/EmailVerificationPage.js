import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function EmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = new URLSearchParams(location.search).get('token');
      try {
        await axios.get(`http://localhost:3000/api/verify-email?token=${token}`);
      } catch (error) {
        console.error('Email verification failed:', error);
      }
    };
    verifyEmail();
  }, [location]);

  return (
    <div className="container text-center">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Your email has been verified successfully.</h2>
      <button onClick={() => navigate('/dashboard')} className="button">Go to Dashboard</button>
    </div>
  );
}

export default EmailVerificationPage;