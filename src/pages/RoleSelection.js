import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function RoleSelection() {
  const [role, setRole] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Sending role selection with token:', token ? '****' : 'MISSING');
      const response = await axios.post('http://localhost:3000/api/select-role', { role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Role selection response:', response.data);
      if (role === 'artist') {
        navigate('/upload-artist-docs');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Role selection error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Role selection failed—try again.');
    }
  };

  return (
    <div className="container">
      <h1>Pick Your Role</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          <input type="radio" value="buyer" checked={role === 'buyer'} onChange={(e) => setRole(e.target.value)} />
          Buyer
        </label>
        <label>
          <input type="radio" value="artist" checked={role === 'artist'} onChange={(e) => setRole(e.target.value)} />
          Artist
        </label>
        <button type="submit" disabled={!role}>Next</button>
      </form>
    </div>
  );
}

export default RoleSelection;