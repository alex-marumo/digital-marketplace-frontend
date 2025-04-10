import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '' });

  useEffect(() => {
    setProfile({ name: user.name, email: user.email });
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    await axios.put('/api/profile', profile, { headers: { Authorization: `Bearer ${token}` } });
  };

  return (
    <div className="container">
      <h1>Your Profile</h1>
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Name"
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="Email"
          />
        </div>
        <button type="submit" className="button">Update Profile</button>
      </form>
      {user.role === 'buyer' && (
        <Link to="/request-artist" className="button m-bottom">Apply to Become an Artist</Link>
      )}
    </div>
  );
}

export default Profile;