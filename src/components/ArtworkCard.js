import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function ArtworkCard({ artwork, showDetails = true, userRole }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const startThread = async () => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/threads`,
        { artworkId: artwork.artwork_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/messages');
    } catch (err) {
      console.error('Start thread error:', err.response?.data || err.message);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const formatter = new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency: 'BWP',
  });

  console.log('ArtworkCard props:', {
    id: artwork.artwork_id,
    title: artwork.title,
    image_url: artwork.image_url,
    artist_id: artwork.artist_id
  });

  return (
    <div className="card">
      <Link to={`/artworks/${artwork.artwork_id}`}>
        <img
          src={artwork.image_url ? `${API_BASE_URL}${artwork.image_url}` : '/placeholder.jpg'}
          alt={artwork.title || 'Featured Artwork'}
          className="artwork-image"
          onError={(e) => {
            e.target.src = '/placeholder.jpg';
            console.log('Image load error:', artwork.image_url);
          }}
        />
      </Link>
      {showDetails && (
        <div className="artwork-details">
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{artwork.title}</h3>
          {artwork.price && (
            <p style={{ color: '#666' }}>{formatter.format(artwork.price)}</p>
          )}
          <p style={{ fontSize: '14px', color: '#888' }}>{artwork.artist || artwork.artist_name}</p>
          <Link to={`/artworks/${artwork.artwork_id}`} className="text-blue">
            View Details
          </Link>
          {userRole === 'buyer' && (
            <button className="button message-artist" onClick={startThread}>
              Message Artist
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ArtworkCard;