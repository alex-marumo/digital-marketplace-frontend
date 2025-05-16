import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function ArtworkCard({ artwork, showDetails = true, userRole, onDelete }) { // Added onDelete prop
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Ensure artwork and artwork.status exist before trying to access them
  const isSold = artwork && artwork.status === 'sold';

  const startThread = debounce(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isSold) return; // Don't start thread if sold

    console.log('💬 startThread triggered:', {

      artwork_id: artwork.artwork_id,
      user_id: user?.keycloak_id,
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
      const threadToNavigate = res.data.redirect ? res.data.thread.id : res.data.id;
      navigate(`/messages/${threadToNavigate}`);
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
  }, 300); // Reduced debounce for quicker interaction

  const formatter = new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency: 'BWP',
  });

  // Defensive check for artwork and its properties
  if (!artwork || !artwork.artwork_id) {
    console.warn('❌ Invalid artwork object passed to ArtworkCard:', artwork);
    return null; // Or some placeholder/error UI
  }

  const imageSrc = artwork.image_url?.startsWith('http') || artwork.image_url?.startsWith('/assets/')
    ? artwork.image_url
    : artwork.image_url
    ? `${API_BASE_URL}${artwork.image_url}`
    : '/placeholder.jpg';

  const handleCardClick = (e) => {
    if (isSold) {
      e.preventDefault(); // Prevent navigation if sold
      return;
    }
    navigate(`/artworks/${artwork.artwork_id}`);
  };
  
  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/edit-artwork/${artwork.artwork_id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (onDelete) {
      onDelete(artwork.artwork_id);
    }
  };

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
        transition: 'transform 0.3s, box-shadow 0.3s',
        maxWidth: '300px', // Consistent width
        margin: '1rem auto', // Centering cards if grid doesn't fill
        position: 'relative', // For SOLD badge positioning
        opacity: isSold ? 0.7 : 1,
        cursor: isSold ? 'default' : 'pointer',
      }}
      onMouseOver={(e) => { if (!isSold) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,98,0,0.3)'; }}}
      onMouseOut={(e) => { if (!isSold) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}}
      onClick={handleCardClick} // Use the wrapper div for navigation click
    >
      <div style={{ position: 'relative' }}> {/* Container for image and SOLD badge */}
        <img
          src={imageSrc}
          alt={artwork.title || 'Artwork Image'}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            display: 'block', // Ensure image is block for proper layout
          }}
          onError={(e) => {
            if (e.target.src !== '/placeholder.jpg') {
              e.target.src = '/placeholder.jpg';
            }
          }}
        />
        {isSold && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0,0,0,0.75)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            fontSize: '1.5em',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 10 // Ensure it's above the image
          }}>
            SOLD
          </div>
        )}
      </div>
      {showDetails && (
        <div style={{ padding: '1rem', backgroundColor: '#f4f1de' }}>
          <h3
            style={{
              fontSize: '1.125rem', // 18px
              fontWeight: 'bold', // Tailwind 'font-bold'
              color: '#ff6200', // Tailwind 'text-orange' or similar
              marginBottom: '0.5rem', // Tailwind 'mb-2'
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={artwork.title}
          >
            {artwork.title}
          </h3>
          {artwork.price && (
            <p style={{ fontSize: '1rem', color: '#2b2d42', fontWeight: '600', marginBottom: '0.5rem' }}>
              {formatter.format(artwork.price)}
            </p>
          )}
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            By: {artwork.artist_name || 'Unknown Artist'}
          </p>
          {error && (
            <p style={{ fontSize: '0.875rem', color: '#d00000', marginBottom: '0.5rem' }}>
              Error: {error}
            </p>
          )}

          {/* Artist's view: Edit/Delete buttons */}
          {userRole === 'artist' && artwork.artist_keycloak_id === user?.keycloak_id && (
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={handleEdit}
                disabled={isLoading || isSold} // Disable if sold
                style={{ /* your existing styles, ensure disabled styles are clear */
                    padding: '0.5rem 1rem',
                    backgroundColor: (isLoading || isSold) ? '#cccccc' : '#4a7289',
                    color: '#f4f1de', border: 'none', borderRadius: '4px', 
                    cursor: (isLoading || isSold) ? 'not-allowed' : 'pointer',
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClick} // Use the new handler
                disabled={isLoading || isSold} // Disable if sold
                style={{ /* your existing styles, ensure disabled styles are clear */
                    padding: '0.5rem 1rem',
                    backgroundColor: (isLoading || isSold) ? '#cccccc' : '#d00000',
                    color: '#f4f1de', border: 'none', borderRadius: '4px',
                    cursor: (isLoading || isSold) ? 'not-allowed' : 'pointer',
                 }}
              >
                Delete
              </button>
            </div>
          )}

          {/* Buyer's view: Message Artist button */}
          {userRole === 'buyer' && !isSold && (
            <button
              onClick={startThread}
              disabled={isLoading}
              style={{
                display: 'block', width: '100%', padding: '0.75rem',
                backgroundColor: isLoading ? '#6b7280' : '#ff6200',
                color: '#f4f1de', fontSize: '1rem', fontWeight: '600',
                border: 'none', borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
              }}
            >
              {isLoading ? 'Processing...' : 'Message Artist'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ArtworkCard;