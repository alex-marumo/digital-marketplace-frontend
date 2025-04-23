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
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Debug isLogin state
  useEffect(() => {
    console.log('isLogin state:', isLogin);
  }, [isLogin]);

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

  // Handle Escape key and disable background scroll
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && showForgotPasswordModal) {
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail('');
        setForgotPasswordMessage(null);
      }
    };

    if (showForgotPasswordModal) {
      document.body.style.overflow = 'hidden'; // Disable scroll
    } else {
      document.body.style.overflow = 'auto'; // Restore scroll
    }

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto'; // Cleanup
    };
  }, [showForgotPasswordModal]);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage(null);

    if (!forgotPasswordEmail) {
      setForgotPasswordMessage({ type: 'error', text: 'Please enter your email.' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/reset-password', { email: forgotPasswordEmail });
      setForgotPasswordMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' });
      setForgotPasswordEmail('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error('Forgot password error:', errorMessage);
      setForgotPasswordMessage({ type: 'error', text: errorMessage || 'Failed to send reset email.' });
    }
  };

  return (
    <div className="container">
      {isVerificationStep || location.pathname === '/verify-email' ? (
        <form onSubmit={handleVerify}>
          <h1 className="text-3xl font-bold mb-6 text-center text-orange">Verify Your Email</h1>
          {error && <p className="text-center bg-red-100 text-red-800 p-3 rounded-md mb-4">{error}</p>}
          {success && <p className="text-center bg-green-100 text-green-800 p-3 rounded-md mb-4">{success}</p>}
          <div className="form-group mb-4">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
              className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
            />
          </div>
          <button type="submit" className="button bg-orange text-white py-2 px-4 rounded-md hover:bg-orange-dark transition w-full">
            Verify
          </button>
          <p className="text-center mt-4">
            Didn’t get the code?{' '}
            <button type="button" onClick={handleResendCode} className="link-button text-orange hover:underline">
              Resend Code
            </button>
          </p>
          <p className="text-center">
            <button type="button" onClick={() => navigate('/login')} className="link-button text-orange hover:underline">
              Back to Login
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <h1 className="text-3xl font-bold mb-6 text-center text-orange">{isLogin ? 'Login' : 'Register'}</h1>
          {error && <p className="text-center bg-red-100 text-red-800 p-3 rounded-md mb-4">{error}</p>}
          {success && <p className="text-center bg-green-100 text-green-800 p-3 rounded-md mb-4">{success}</p>}
          {!isLogin && (
            <div className="form-group mb-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
              />
            </div>
          )}
          <div className="form-group mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
            />
          </div>
          <div className="form-group mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="form-input w-full p-2 border rounded-md focus:ring-orange focus:border-orange"
            />
          </div>
          {!isLogin && (
            <p className="text-center text-gray-600 mb-4">reCAPTCHA v3 running in background...</p>
          )}
          <button type="submit" className="button bg-orange text-white py-2 px-4 rounded-md hover:bg-orange-dark transition w-full">
            {isLogin ? 'Login' : 'Register'}
          </button>
          {isLogin && (
            <p className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="link-button text-orange hover:underline"
              >
                Forgot Password?
              </button>
            </p>
          )}
          <p className="text-center mt-4">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="link-button text-orange hover:underline">
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
  <>
    <div
      className="modal-overlay"
      onClick={() => {
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail('');
        setForgotPasswordMessage(null);
      }}
    />
    <div className="modal">
      <div className="modal-content">
        <button
          type="button"
          className="modal-close-btn"
          onClick={() => {
            setShowForgotPasswordModal(false);
            setForgotPasswordEmail('');
            setForgotPasswordMessage(null);
          }}
        >
          ×
        </button>
        <h3 className="modal-title">Reset Your Password</h3>
        {forgotPasswordMessage && (
          <div
            className={`message p-3 mb-4 rounded-md ${
              forgotPasswordMessage.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {forgotPasswordMessage.text}
          </div>
        )}
        <form onSubmit={handleForgotPassword}>
          <div className="form-group mb-4">
            <label htmlFor="forgotPasswordEmail" className="form-label block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              id="forgotPasswordEmail"
              type="email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              placeholder="Enter your email"
              className="modal-input"
              required
            />
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              className="modal-cancel-btn w-36"
              onClick={() => {
                setShowForgotPasswordModal(false);
                setForgotPasswordEmail('');
                setForgotPasswordMessage(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="modal-reset-btn w-36">
              Send Reset Link
            </button>
          </div>
        </form>
      </div>
    </div>
  </>
)}
    </div>
  );
}

export default LoginRegister;