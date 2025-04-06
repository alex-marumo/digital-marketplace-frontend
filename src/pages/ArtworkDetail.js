import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function ArtworkDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [artwork, setArtwork] = useState(null);
  const [review, setReview] = useState('');

  useEffect(() => {
    axios.get(`/api/artwork/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setArtwork(res.data));
  }, [id, token]);

  const handlePurchase = async () => {
    await axios.post(`/api/orders`, { artworkId: id }, { headers: { Authorization: `Bearer ${token}` } });
    // Redirect to payment flow
  };

  const handleReview = async (e) => {
    e.preventDefault();
    await axios.post(
      `/api/artwork/${id}/review`,
      { review },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setReview('');
  };

  if (!artwork) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>{artwork.title}</h1>
      <img src={artwork.image} alt={artwork.title} style={{ width: '100%', borderRadius: '18px' }} />
      <p>{artwork.description}</p>
      <p className="card-price">${artwork.price}</p>
      <p className="card-artist">by {artwork.artist}</p>
      {user.role === 'buyer' && <button className="button" onClick={handlePurchase}>Buy Now</button>}
      {user.role === 'buyer' && (
        <form onSubmit={handleReview}>
          <div className="form-group">
            <input
              type="text"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Leave a review"
            />
          </div>
          <button type="submit" className="button">Submit Review</button>
        </form>
      )}
    </div>
  );
}

export default ArtworkDetail;