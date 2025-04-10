import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function RequestArtist() {
  const { token } = useAuth();
  const history = useNavigate();
  const [formData, setFormData] = useState({ bio: '', document: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('bio', formData.bio);
    data.append('document', formData.document);
    await axios.post('/api/request-artist', data, { headers: { Authorization: `Bearer ${token}` } });
    history.push('/dashboard');
  };

  return (
    <div className="container">
      <h1>Apply to Become an Artist</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself"
          />
        </div>
        <div className="form-group">
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, document: e.target.files[0] })}
          />
        </div>
        <button type="submit" className="button">Submit Application</button>
      </form>
    </div>
  );
}

export default RequestArtist;