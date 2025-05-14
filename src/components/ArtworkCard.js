import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Simple debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function ArtworkCard({ artwork, showDetails = true, userRole }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const startThread = debounce(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('💬 startThread triggered:', {
      artwork_id: artwork.artwork_id,
      user,
      token: token ? 'present' : 'missing',
    });
    if (!token || !user) {
      console.warn('❌ No token or user, redirecting to login');
      navigate('/login-register');
      return;
    }
    const artworkId = parseInt(artwork.artwork_id);
    if (isNaN(artworkId)) {
      console.error('❌ Invalid artwork_id:', artwork.artwork_id);
      setError('Invalid artwork ID.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/threads`,
        { artworkId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Thread response:', res.data);
      if (res.data.redirect) {
        console.log('➡️ Redirecting to existing/restored thread:', res.data.thread.id);
        navigate(`/messages/${res.data.thread.id}`);
      } else {
        console.log('➡️ Redirecting to new thread:', res.data.id);
        navigate(`/messages/${res.data.id}`);
      }
    } catch (err) {
      console.error('❌ Start thread error:', err.response?.data || err.message);
      if (err.response?.status === 409) {
        setError('A conversation for this artwork already exists. Check your messages!');
      } else if (err.response?.status === 429) {
        setError('Yo, slow down! Too many requests. Try again soon.');
      } else {
        setError(err.response?.data?.error || 'Failed to start conversation.');
      }
    } finally {
      setIsLoading(false);
    }
  }, 500);

  const formatter = new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency: 'BWP',
  });

  const imageSrc = artwork.image_url?.startsWith('/assets/')
    ? artwork.image_url
    : artwork.image_url
    ? `${API_BASE_URL}${artwork.image_url}`
    : '/placeholder.jpg';

  console.log('🎨 ArtworkCard props:', {
    id: artwork.artwork_id,
    title: artwork.title,
    image_url: artwork.image_url,
    artist_id: artwork.artist_id,
    computed_image_src: imageSrc,
    userRole,
  });

  if (!artwork.artwork_id) {
    console.warn('❌ Invalid artwork_id:', artwork);
    return null;
  }

  // Handler for Edit button
  const handleEdit = (e) => {
    e.stopPropagation();
    console.log('✏️ Edit clicked:', { id: artwork.artwork_id, token: token ? 'present' : 'missing' });
    navigate(`/edit-artwork/${artwork.artwork_id}`);
  };

  // Handler for Delete button
  const handleDelete = async (e) => {
  e.stopPropagation();
  const artworkId = parseInt(artwork.artwork_id, 10);
  console.log('🗑️ Delete clicked:', { id: artworkId, image_url: artwork.image_url, token: token ? 'present' : 'missing', user });
  if (!token) {
    console.error('❌ No token, redirecting to login');
    setError('Please log in to delete artwork.');
    navigate('/login-register');
    return;
  }
  if (isNaN(artworkId)) {
    console.error('❌ Invalid artwork_id:', artwork.artwork_id);
    setError('Invalid artwork ID.');
    return;
  }
  if (!user || !['artist', 'admin'].includes(user.role)) {
    console.error('❌ User lacks permission:', { user });
    setError('Only artists or admins can delete artworks.');
    return;
  }
  if (window.confirm('Are you sure you want to delete this artwork?')) {
    setIsLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE_URL}/api/artworks/${artworkId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Artwork deleted:', artworkId);
      alert('Artwork deleted! 🎉');
      navigate(0); // Reload page to refresh artwork list
    } catch (err) {
      console.error('❌ Delete error:', {
        status: err.response?.status,
        message: err.response?.data?.error || err.message,
        artworkId,
      });
      setError(err.response?.data?.error || 'Failed to delete artwork.');
    } finally {
      setIsLoading(false);
    }
  }
};

  return (
    <div
      style={{
        backgroundColor: '#f4f1de',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s, box-shadow 0.3s',
        maxWidth: '300px',
        margin: '1rem',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,98,0,0.3)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        to={`/artworks/${artwork.artwork_id}`}
        onClick={(e) => {
          e.stopPropagation();
          console.log('🔗 Image Link clicked:', `/artworks/${artwork.artwork_id}`);
        }}
      >
        <img
          src={imageSrc}
          alt={artwork.title || 'Featured Artwork'}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
          onError={(e) => {
            if (e.target.src !== '/placeholder.jpg') {
              e.target.src = '/placeholder.jpg';
              console.log('🖼️ Image load error:', {
                attempted_url: e.target.src,
                artwork_id: artwork.artwork_id,
              });
            }
          }}
        />
      </Link>
      {showDetails && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f4f1de',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#ff6200',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
            }}
          >
            {artwork.title}
          </h3>
          {artwork.price && (
            <p
              style={{
                fontSize: '16px',
                color: '#2b2d42',
                fontWeight: '600',
                marginBottom: '0.5rem',
              }}
            >
              {formatter.format(artwork.price)}
            </p>
          )}
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '1rem',
            }}
          >
            {artwork.artist || artwork.artist_name}
          </p>
          {error && (
            <p
              style={{
                fontSize: '14px',
                color: '#d00000',
                marginBottom: '0.5rem',
              }}
            >
              {error}
            </p>
          )}
          {(userRole === 'buyer' || userRole === 'artist') && (
            <Link
              to={`/artworks/${artwork.artwork_id}`}
              style={{
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4a7289',
                textDecoration: 'none',
                marginBottom: '0.5rem',
                transition: 'color 0.3s',
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔗 View Details clicked:', `/artworks/${artwork.artwork_id}`);
              }}
              onMouseOver={(e) => (e.target.style.color = '#ff6200')}
              onMouseOut={(e) => (e.target.style.color = '#4a7289')}
            >
              View Details
            </Link>
          )}
          {userRole === 'artist' && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                onClick={handleEdit}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isLoading ? '#6b7280' : '#4a7289',
                  color: '#f4f1de',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginRight: '0.5rem',
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isLoading ? '#6b7280' : '#d00000',
                  color: '#f4f1de',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          )}
          {userRole === 'buyer' && (
            <button
              onClick={startThread}
              disabled={isLoading}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem',
                backgroundColor: isLoading ? '#6b7280' : '#ff6200',
                color: '#f4f1de',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s, transform 0.2s',
              }}
              onMouseOver={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#e05500';
              }}
              onMouseOut={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#ff6200';
              }}
              onMouseDown={(e) => {
                if (!isLoading) e.target.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                if (!isLoading) e.target.style.transform = 'scale(1)';
              }}
            >
              {isLoading ? 'Starting...' : 'Message Artist'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ArtworkCard;