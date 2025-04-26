import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { UserCircle2, Brush, ShoppingCart, X, Pencil } from 'lucide-react';

function Profile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '', picture: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      picture: user?.picture || '' // Assume picture is a full URL from AuthContext
    });
    setPreview(user?.picture || null);
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview); // Clean up blob URLs
      }
    };
  }, [user, preview]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.put('/api/profile', {
        name: profile.name,
        email: profile.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile({
        ...profile,
        name: response.data.user.name,
        email: response.data.user.email,
        picture: response.data.user.pictureUrl || profile.picture
      });
      setPreview(response.data.user.pictureUrl || profile.picture);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleIconClick = () => {
    setShowPreview(true);
  };

  const handlePencilClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be under 2MB.' });
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setMessage({ type: 'error', text: 'Only JPG or PNG allowed.' });
        return;
      }
      setProfile({ ...profile, picture: file });
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!profile.picture || typeof profile.picture === 'string') {
      setMessage({ type: 'error', text: 'No new image selected.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('profilePhoto', profile.picture); // Match backend field name
    try {
      const response = await axios.post('/api/users/me/photo', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setProfile({ ...profile, picture: response.data.pictureUrl });
      setPreview(response.data.pictureUrl);
      setShowPreview(false);
      setMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to upload image.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(profile.picture || null);
    setProfile({ ...profile, picture: profile.picture || '' });
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>
      <div className="card profile-header text-center mb-6">
        <div className="profile-pic-wrapper" onClick={handleIconClick}>
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="profile-pic mx-auto mb-2 cursor-pointer"
              onError={() => setPreview(null)}
            />
          ) : (
            <UserCircle2 size={64} className="mx-auto mb-2 text-orange cursor-pointer" />
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png" // Match backend
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          disabled={loading}
        />
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
      {showPreview && (
        <div className="preview-modal">
          <div className="preview-modal-content">
            <button className="preview-close" onClick={handleCancel}>
              <X size={24} />
            </button>
            <div className="preview-pic-wrapper">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="preview-pic"
                />
              ) : (
                <UserCircle2 size={200} className="text-orange" />
              )}
              <button className="pencil-icon" onClick={handlePencilClick}>
                <Pencil size={24} />
              </button>
            </div>
            <div className="flex gap-4 justify-center mt-4">
              <button
                className="button"
                onClick={handleImageUpload}
                disabled={loading || typeof profile.picture === 'string'}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                className="button button-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
      <div className="card">
        <h3 className="card-title">Your Actions</h3>
        <div className="action-buttons">
          {user?.role === 'artist' && (
            <Link to={`/artworks/${user?.keycloak_id}`} className="button button-secondary">
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