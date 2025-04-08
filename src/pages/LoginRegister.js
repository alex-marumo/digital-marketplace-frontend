import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const navigate = useNavigate();

  // Load reCAPTCHA v3 script and get token
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!recaptchaToken && !isLogin) {
      setError('reCAPTCHA not ready—wait a sec or refresh');
      return;
    }
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        console.log('Registering with:', { email, name, password, recaptchaToken });
        const response = await register(email, name, password, recaptchaToken);
        console.log('Register response:', response);
        setIsVerificationStep(true);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error_description || err.response?.data?.error || err.message || 'An error occurred';
      console.error('Submit error:', err);
      setError(errorMessage);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post('http://localhost:3000/api/verify-email-code', { email, code: verificationCode });
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Verification failed');
    }
  };

  return (
    <div className="container">
      {isVerificationStep ? (
        <form onSubmit={handleVerify}>
          <h1>Verify Your Email</h1>
          {error && <p className="text-center" style={{ color: 'red' }}>{error}</p>}
          <div className="form-group">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
            />
          </div>
          <button type="submit" className="button">Verify</button>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <h1>{isLogin ? 'Login' : 'Register'}</h1>
          {error && <p className="text-center" style={{ color: 'red' }}>{error}</p>}
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
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

export default LoginRegister;