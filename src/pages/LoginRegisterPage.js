import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function LoginRegisterPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', recaptchaToken: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } else {
      formData.recaptchaToken = 'mock-token';
      try {
        await axios.post('http://localhost:3000/api/pre-register', { recaptchaToken: formData.recaptchaToken });
        navigate('/dashboard');
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  };

  return (
    <div className="container">
      <div className="tabs">
        <button onClick={() => setIsLogin(true)} className={`tab ${isLogin ? 'active' : ''}`}>Login</button>
        <button onClick={() => setIsLogin(false)} className={`tab ${!isLogin ? 'active' : ''}`}>Register</button>
      </div>
      <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: '24px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>{isLogin ? 'Login' : 'Register'}</h2>
        {!isLogin && (
          <div className="form-group">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        )}
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        {!isLogin && <div className="form-group">reCAPTCHA Placeholder</div>}
        <button type="submit" className="button">{isLogin ? 'Login' : 'Register'}</button>
      </form>
    </div>
  );
}

export default LoginRegisterPage;