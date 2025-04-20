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
      const response = await axios.post(
        'http://localhost:3000/api/select-role',
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(role === 'artist' ? '/upload-artist-docs' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Role selection failed—try again.';
      setError(msg);
    }
  };

  return (
    <div className="container">
      <h1>Pick Your Role</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="category-button">
            <input
              type="radio"
              name="role"
              value="buyer"
              checked={role === 'buyer'}
              onChange={(e) => setRole(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            Buyer
          </label>
        </div>
        <div className="form-group">
          <label className="category-button">
            <input
              type="radio"
              name="role"
              value="artist"
              checked={role === 'artist'}
              onChange={(e) => setRole(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            Artist
          </label>
        </div>
        <button className="button" type="submit" disabled={!role}>
          Next
        </button>
      </form>
    </div>
  );
}

export default RoleSelection;