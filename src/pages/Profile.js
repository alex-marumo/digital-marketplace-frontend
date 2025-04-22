import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { UserCircle2, Brush, ShoppingCart } from 'lucide-react';

function Profile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setProfile({ name: user?.name || '', email: user?.email || '' });
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await axios.put('/api/profile', profile, { headers: { Authorization: `Bearer ${token}` } });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>

      {/* Header Card */}
      <div className="card profile-header text-center mb-6">
        <UserCircle2 size={64} className="mx-auto mb-2 text-orange" />
        <h2 className="text-xl font-semibold">{profile.name || 'User'}</h2>
        <span className={`role-badge ${user?.role === 'artist' ? 'artist' : 'buyer'}`}>
          {user?.role === 'artist' ? (
            <>
              <Brush size={16} className="inline mr-1" /> Artist
            </>
          ) : (
            <>
              <ShoppingCart size={16} className="inline mr-1" /> Buyer
            </>
          )}
        </span>
      </div>

      {/* Form Card */}
      <div className="card mb-6">
        <h3 className="card-title">Update Your Info</h3>
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              id="name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Enter your name"
              className="form-input"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="Enter your email"
              className="form-input"
              disabled={loading}
            />
          </div>
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Actions Card */}
      <div className="card">
        <h3 className="card-title">Your Actions</h3>
        <div className="action-buttons">
          {user?.role === 'artist' && (
            <Link to={`/artist/${user?.keycloak_id}`} className="button button-secondary">
              View Your Portfolio
            </Link>
          )}
          {user?.role === 'buyer' && (
            <>
              <Link to="/orders" className="button button-secondary">
                View Your Purchases
              </Link>
              <Link to="/request-artist" className="button m-top">
                Apply to Become an Artist
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;