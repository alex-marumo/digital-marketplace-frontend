import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import axios from 'axios';

function LoginRegister() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); // Track current path
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  // Load reCAPTCHA v3 script and get token
  useEffect(() => {
      if (location.pathname === '/verify-email') {
        setShowVerificationPrompt(true);
        setIsLogin(true); // Ensure login mode
      }
    if (!isLogin) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.REACT_APP_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(process.env.REACT_APP_RECAPTCHA_SITE_KEY, { action: 'register' })
            .then((token) => {
              console.log('v3 token:', token);
              setRecaptchaToken(token);
            })
            .catch((err) => {
              console.error('reCAPTCHA v3 error:', err);
              setError('reCAPTCHA failed—refresh and try again');
            });
        });
      };

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [location.pathname, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setShowVerificationPrompt(false);
    if (!recaptchaToken && !isLogin) {
      setError('reCAPTCHA not ready—wait a sec or refresh');
      return;
    }
    try {
      if (isLogin) {
        console.log('Logging in:', { email });
        const result = await login(email, password);
        console.log('Login done, redirecting to:', result.redirect);
        navigate(result.redirect, { replace: true });
      } else {
        console.log('Registering:', { email, name });
        const response = await register(email, name, password, recaptchaToken);
        if (response.nextStep === 'verify-email') {
          setIsVerificationStep(true);
          setSuccess('Registered! Check your email for a code.');
        }
      }
    } catch (err) {
      console.error('Submit error:', err.message);
      navigate('/verify-email', { replace: true });
    }
  };
  
  // Reuse handleVerify and handleResendCode from previous fix
  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      console.log('Verifying:', { email, code: verificationCode });
      const response = await axios.post('http://localhost:3000/api/verify-email-code', { 
        email, 
        code: verificationCode.trim()
      });
      setSuccess('Email verified! Logging you in...');
      
      const token = await login(email, password);
      console.log('Login token after verify:', token ? '****' : 'MISSING');
      
      // Show success for a sec, then redirect
      setTimeout(() => {
        navigate('/role-selection', { replace: true });
      }, 1000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error('Verify error:', errorMessage);
      setError(errorMessage || 'Verification failed—check the code or try again.');
    }
  };
  
  const handleResendCode = async () => {
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.post('http://localhost:3000/api/resend-verification-code', { email });
      setSuccess('New code sent—check your email!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage || 'Failed to resend code—try again.');
    }
  };
  
  // Updated UI
  return (
    <div className="container">
      {isVerificationStep || showVerificationPrompt ? (
        <form onSubmit={handleVerify}>
          <h1>Verify Your Email</h1>
          {error && <p className="text-center" style={{ color: 'red' }}>{error}</p>}
          {success && <p className="text-center" style={{ color: 'green' }}>{success}</p>}
          <div className="form-group">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
            />
          </div>
          <button type="submit" className="button">Verify</button>
          <p className="text-center">
            Didn’t get the code?{' '}
            <button type="button" onClick={handleResendCode} className="link-button">
              Resend Code
            </button>
          </p>
          {showVerificationPrompt && (
            <p className="text-center">
              <button type="button" onClick={() => setShowVerificationPrompt(false)} className="link-button">
                Back to Login
              </button>
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <h1>{isLogin ? 'Login' : 'Register'}</h1>
          {error && <p className="text-center" style={{ color: 'red' }}>{error}</p>}
          {success && <p className="text-center" style={{ color: 'green' }}>{success}</p>}
          {!isLogin && (
            <div className="form-group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
          )}
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          {!isLogin && (
            <p style={{ color: '#666' }}>reCAPTCHA v3 running in background...</p>
          )}
          <button type="submit" className="button">{isLogin ? 'Login' : 'Register'}</button>
          <p className="text-center">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="link-button">
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      )}
    </div>
    );
  }

  export default LoginRegister;