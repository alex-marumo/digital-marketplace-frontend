import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { UserCircle2, Brush, ShoppingCart, X, Pencil } from 'lucide-react';
import { debounce } from 'lodash';

// Configure axios retries for network errors
axiosRetry(axios, { retries: 3, retryDelay: (retryCount) => retryCount * 1000 });

function Profile() {
  const { user, token, refreshAccessToken, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '', picture: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async (currentToken) => {
      if (!currentToken) {
        console.warn('No token, cannot fetch profile');
        setMessage({ type: 'error', text: 'Please log in to view your profile.' });
        return;
      }
      try {
        console.log('Fetching user from /api/users/me, token:', currentToken.slice(0, 20) + '...');
        const response = await axios.get('http://localhost:3000/api/users/me', {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        console.log('Fetched user:', response.data);
        const pictureUrl = response.data.profile_photo && response.data.keycloak_id
          ? `http://localhost:3000/api/users/${response.data.keycloak_id}/photo`
          : null;
        console.log('Constructed pictureUrl:', pictureUrl);
        setProfile({
          name: response.data.name || '',
          email: response.data.email || '',
          picture: pictureUrl || '',
        });
        setPreview(pictureUrl);
        console.log('Set preview:', pictureUrl);
      } catch (err) {
        console.error('Fetch user error:', err.response?.status, err.response?.data || err.message);
        if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
          setMessage({ type: 'error', text: 'Server is down, try again later.' });
          return;
        }
        if (err.response?.status === 401 || err.response?.status === 403) {
          try {
            console.log('Retrying with refreshed token');
            const newToken = await refreshAccessToken();
            await fetchUser(newToken);
          } catch (refreshErr) {
            console.error('Refresh token failed:', refreshErr.message);
            setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
          }
        } else {
          setMessage({ type: 'error', text: 'Failed to load profile data.' });
        }
      }
    };

    if (user?.picture) {
      console.log('Using user.picture from AuthContext:', user.picture);
      setProfile({
        name: user.name || '',
        email: user.email || '',
        picture: user.picture,
      });
      setPreview(user.picture);
    } else if (token) {
      fetchUser(token);
    } else {
      console.warn('No token or user.picture, cannot fetch profile');
      setMessage({ type: 'error', text: 'Please log in to view your profile.' });
    }

    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [token, user, refreshAccessToken]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.put('http://localhost:3000/api/users/me', {
        name: profile.name,
        email: profile.email,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({
        ...profile,
        name: response.data.user.name,
        email: response.data.user.email,
        picture: response.data.user.pictureUrl || profile.picture,
      });
      setPreview(response.data.user.pictureUrl || profile.picture);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setUser({ ...user, name: response.data.user.name, email: response.data.user.email });
    } catch (err) {
      console.error('Update error:', err.response?.status, err.response?.data || err.message);
      if (err.response?.status === 409) {
        setMessage({ type: 'error', text: 'Yo, that email’s already taken! Pick another.' });
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setMessage({ type: 'error', text: 'Server’s ghosting us, try again later.' });
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        try {
          const newToken = await refreshAccessToken();
          const retryResponse = await axios.put('http://localhost:3000/api/users/me', {
            name: profile.name,
            email: profile.email,
          }, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
          setProfile({
            ...profile,
            name: retryResponse.data.user.name,
            email: retryResponse.data.user.email,
            picture: retryResponse.data.user.pictureUrl || profile.picture,
          });
          setPreview(retryResponse.data.user.pictureUrl || profile.picture);
          setMessage({ type: 'success', text: 'Profile updated successfully!' });
          setUser({ ...user, name: retryResponse.data.user.name, email: retryResponse.data.user.email });
        } catch (refreshErr) {
          console.error('Refresh token failed:', refreshErr.message);
          setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        }
      } else {
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
      }
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
    console.log('Selected file:', file);
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
    console.log('Upload triggered, picture:', profile.picture, 'type:', typeof profile.picture, 'token:', token ? token.slice(0, 20) + '...' : 'missing');
    if (!token) {
      setMessage({ type: 'error', text: 'Please log in to upload a photo.' });
      return;
    }
    if (!profile.picture || typeof profile.picture === 'string') {
      setMessage({ type: 'error', text: 'No new image selected.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('profilePhoto', profile.picture);
    try {
      const response = await axios.post('http://localhost:3000/api/users/me/photo', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response.data);
      const newPictureUrl = response.data.pictureUrl || (user?.keycloak_id
        ? `http://localhost:3000/api/users/${user.keycloak_id}/photo`
        : null);
      console.log('Set new pictureUrl:', newPictureUrl);
      if (!newPictureUrl) {
        throw new Error('No valid picture URL after upload');
      }
      setProfile({ ...profile, picture: newPictureUrl });
      setPreview(newPictureUrl);
      setShowPreview(false);
      setMessage({ type: 'success', text: 'Profile picture updated!' });
      setUser({ ...user, picture: newPictureUrl });
    } catch (err) {
      console.error('Upload error:', err.response?.status, err.response?.data || err.message);
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setMessage({ type: 'error', text: 'Server’s down, can’t upload right now.' });
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        try {
          console.log('Retrying upload with refreshed token');
          const newToken = await refreshAccessToken();
          const response = await axios.post('http://localhost:3000/api/users/me/photo', formData, {
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          const newPictureUrl = response.data.pictureUrl || (user?.keycloak_id
            ? `http://localhost:3000/api/users/${user.keycloak_id}/photo`
            : null);
          if (!newPictureUrl) {
            throw new Error('No valid picture URL after retry');
          }
          setProfile({ ...profile, picture: newPictureUrl });
          setPreview(newPictureUrl);
          setShowPreview(false);
          setMessage({ type: 'success', text: 'Profile picture updated!' });
          setUser({ ...user, picture: newPictureUrl });
        } catch (refreshErr) {
          console.error('Refresh token failed:', refreshErr.message);
          setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        }
      } else {
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to upload image.' });
      }
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

  const debouncedUpdate = debounce(handleUpdate, 300);

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>
      <div className="card profile-header text-center mb-6">
        <div className="profile-pic-wrapper" onClick={handleIconClick}>
          {preview ? (
            <>
              <img
                src={preview}
                alt="Profile"
                className="profile-pic mx-auto mb-2 cursor-pointer"
                onError={() => {
                  console.warn('Image load failed:', preview);
                  setPreview(null);
                }}
              />
            </>
          ) : (
            <UserCircle2 size={64} className="mx-auto mb-2 text-orange cursor-pointer" />
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png"
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
        <form onSubmit={debouncedUpdate}>
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
            <Link to="/artworks#search-section" className="button button-secondary">
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