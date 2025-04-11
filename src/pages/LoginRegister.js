import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // Load reCAPTCHA for registration
  useEffect(() => {
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
  }, [isLogin]);

  // Check user state after login
  const checkUserState = async (token) => {
    try {
      const response = await axios.get('http://localhost:3000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data;
      console.log('User state after login:', user);

      if (!user.is_verified) {
        navigate('/verify-email', { replace: true });
      } else if (user.status === 'pending_role_selection') {
        navigate('/role-selection', { replace: true });
      } else if (user.role === 'artist' && user.status === 'pending_verification') {
        navigate('/upload-artist-docs', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('User state check failed:', err);
      setError('Something went wrong—try logging in again');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLogin && !recaptchaToken) {
      setError('reCAPTCHA not ready—wait a sec or refresh');
      return;
    }

    try {
      if (isLogin) {
        console.log('Logging in:', { email });
        const result = await login(email, password);
        console.log('Login result:', result);
        await checkUserState(result.token); // Use token from login
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
      setError(err.message || 'Login/Register failed—check your details');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      console.log('Verifying:', { email, code: verificationCode });
      const response = await axios.post('http://localhost:3000/api/verify-email-code', {
        email,
        code: verificationCode.trim(),
      });
      setSuccess('Email verified! Logging you in...');

      const result = await login(email, password);
      console.log('Login token after verify:', result.token ? '****' : 'MISSING');

      setTimeout(() => {
        checkUserState(result.token);
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

  return (
    <div className="container">
      {isVerificationStep || location.pathname === '/verify-email' ? (
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
          <p className="text-center">
            <button type="button" onClick={() => navigate('/login')} className="link-button">
              Back to Login
            </button>
          </p>
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
