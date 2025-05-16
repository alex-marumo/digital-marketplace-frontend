import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function ArtworkDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [artwork, setArtwork] = useState(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [phoneNumber, setPhoneNumber] = useState('');

  const fetchArtworkDetails = async (retryCount = 0) => {
    if (isNaN(id)) {
      setError('Invalid artwork ID');
      setLoading(false);
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log('[ARTWORK DETAIL FETCH DEBUG] Fetching artwork:', { artworkId: id, locationKey: location.key });
      const res = await axios.get(`${API_BASE_URL}/api/artworks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const artworkData = res.data;
      if (!artworkData.image_url) {
        artworkData.image_url = '/placeholder.jpg';
      }
      setArtwork({ ...artworkData, status: artworkData.status || 'available' });
      setLoading(false);

      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      if (!viewed.some(item => item.artwork_id === id)) {
        viewed.push({ artwork_id: id, title: artworkData.title, image_url: artworkData.image_url });
        localStorage.setItem('recentlyViewed', JSON.stringify(viewed.slice(-5)));
      }
      console.log('[ARTWORK DETAIL FETCH SUCCESS] Artwork loaded:', artworkData);
    } catch (err) {
      console.error('[ARTWORK DETAIL FETCH ERROR]:', {
        status: err.response?.status,
        message: err.response?.data?.error,
        details: err.response?.data?.details,
      });
      if (retryCount < 2 && err.response?.status === 503) {
        setTimeout(() => fetchArtworkDetails(retryCount + 1), 1000);
        return;
      }
      setError(
        err.response?.status === 401 ? 'Authentication error. Please log in again.' :
        err.response?.status === 404 ? 'Artwork not found.' : 'Failed to load artwork details.'
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworkDetails();
  }, [id, token, navigate, location.key]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id || isNaN(id)) return;
      try {
        console.log('[REVIEWS FETCH DEBUG] Fetching reviews for artwork:', id);
        const response = await axios.get(`${API_BASE_URL}/api/reviews/${id}`);
        setReviews(response.data || []);
        if (response.data && response.data.length > 0) {
          const total = response.data.reduce((sum, r) => sum + r.rating, 0);
          setAverageRating((total / response.data.length).toFixed(1));
        } else {
          setAverageRating(null);
        }
        console.log('[REVIEWS FETCH SUCCESS] Reviews loaded:', response.data?.length || 0);
      } catch (err) {
        console.error('[REVIEWS FETCH ERROR]:', err.response?.data || err.message);
      }
    };
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        console.log('[REVIEWS FETCH DEBUG] Fetching reviews for artwork:', id);
        const response = await axios.get(`${API_BASE_URL}/api/reviews/${id}`);
        setReviews(response.data.slice(0, 3));
        if (response.data.length) {
          const total = response.data.reduce((sum, r) => sum + r.rating, 0);
          setAverageRating((total / response.data.length).toFixed(1));
        }
        console.log('[REVIEWS FETCH SUCCESS] Reviews loaded:', response.data.length);
      } catch (err) {
        console.error('[REVIEWS FETCH ERROR]:', err.response?.data || err.message);
      }
    };
    fetchReviews();
  }, [id]);

  const handlePurchase = async () => {
    if (!artwork || artwork.status === 'sold') {
      alert('This artwork is not available for purchase.');
      return;
    }
    if ((paymentMethod === 'orange_money' || paymentMethod === 'myzaka') && !phoneNumber.trim()) {
      alert('Please enter a phone number for mobile money payments.');
      return;
    }
    if ((paymentMethod === 'orange_money' || paymentMethod === 'myzaka') && !/^\+267\d{8}$/.test(phoneNumber)) {
      alert('Please enter a valid Botswana phone number (e.g., +26712345678).');
      return;
    }

    try {
      setLoading(true);
      console.log('[ARTWORK PURCHASE DEBUG] Creating order:', { artworkId: id, paymentMethod, phoneNumber });
      const orderRes = await axios.post(
        `${API_BASE_URL}/api/orders`,
        { artworkId: parseInt(id), paymentMethod, phoneNumber: phoneNumber || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[ARTWORK PURCHASE SUCCESS] Order created:', orderRes.data);
      navigate('/orders');
    } catch (err) {
      console.error('[ARTWORK PURCHASE ERROR]:', err.response?.data || err.message);
      alert(`Failed to create order: ${err.response?.data?.error || 'An unexpected error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim() || !rating) {
      alert('Please provide both a rating and a comment for your review.');
      return;
    }
    try {
      console.log('[REVIEW SUBMIT DEBUG] Submitting review:', { artworkId: id, rating, comment: review });
      await axios.post(
        `${API_BASE_URL}/api/reviews`,
        { artwork_id: parseInt(id), rating: Number(rating), comment: review, user_id: user?.keycloak_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReview('');
      setRating(5);
      alert('Review submitted successfully!');
      const response = await axios.get(`${API_BASE_URL}/api/reviews/${id}`);
      setReviews(response.data || []);
      if (response.data && response.data.length > 0) {
        const total = response.data.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating((total / response.data.length).toFixed(1));
      } else {
        setAverageRating(null);
      }
    } catch (err) {
      alert(`Failed to submit review: ${err.response?.data?.error || 'Please try again.'}`);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>Loading artwork details...</div>;
  if (error) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red', fontSize: '1.5rem' }}>Error: {error}</div>;
  if (!artwork) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>Artwork not found.</div>;

  const isSold = artwork.status === 'sold';
  const imageFullUrl = artwork.image_url?.startsWith('http') || artwork.image_url?.startsWith('/assets/')
    ? artwork.image_url
    : artwork.image_url
    ? `${API_BASE_URL}${artwork.image_url}`
    : '/placeholder.jpg';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', backgroundColor: '#f4f1de', minHeight: '100vh', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#ff6200', marginBottom: '1.5rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
        {artwork.title} {isSold && <span style={{color: 'red', fontSize: '0.8em', fontWeight: 'bold'}}>(SOLD)</span>}
      </h1>
      <img
        src={imageFullUrl}
        alt={artwork.title || 'Artwork Image'}
        style={{ width: '100%', maxWidth: '600px', display: 'block', margin: '0 auto 1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', objectFit: 'contain', maxHeight: '500px', border: '2px solid #2b2d42' }}
        onError={(e) => { e.target.src = '/placeholder.jpg'; }}
      />
      <p style={{ color: '#2b2d42', fontSize: '1.125rem', lineHeight: '1.6', marginBottom: '1rem', textAlign: 'center', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
        {artwork.description || 'No description available.'}
      </p>
      {averageRating && (
        <p style={{ textAlign: 'center', color: '#ff6200', fontWeight: '600', fontSize: '1.2rem' }}>
          ⭐ Average Rating: {averageRating} / 5
        </p>
      )}
      <p style={{ color: '#2b2d42', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', textAlign: 'center' }}>
        {new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP' }).format(artwork.price)}
      </p>
      <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '2rem', textAlign: 'center', fontStyle: 'italic' }}>
        Artist: {artwork.artist_name || 'Unknown Artist'}
      </p>
      
      {isSold && (
        <p style={{fontSize: '1.5em', color: 'red', fontWeight: 'bold', textAlign: 'center', padding: '1em', border: '2px dashed red', borderRadius: '5px', backgroundColor: 'rgba(255,0,0,0.05)'}}>
          This artwork has been sold.
        </p>
      )}

      {user?.role === 'buyer' && !isSold && (
        <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '1.5rem', border: '1px solid #ff6200', borderRadius: '8px', backgroundColor: '#fff9f0' }}>
          <h2 style={{textAlign: 'center', color: '#ff6200', marginBottom: '1rem'}}>Purchase This Artwork</h2>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2b2d42', fontWeight: '600' }}>
            Payment Method:
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem', border: '1px solid #ff6200', borderRadius: '4px', backgroundColor: '#f4f1de', color: '#2b2d42' }}
            >
              <option value="paypal">PayPal</option>
              <option value="orange_money">Orange Money</option>
              <option value="myzaka">MyZaka</option>
            </select>
          </label>
          {(paymentMethod === 'orange_money' || paymentMethod === 'myzaka') && (
            <label style={{ display: 'block', margin: '1rem 0', color: '#2b2d42', fontWeight: '600' }}>
              Phone Number (e.g., +26771234567):
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+26771234567"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem', border: '1px solid #ff6200', borderRadius: '4px', backgroundColor: '#f4f1de', color: '#2b2d42' }}
              />
            </label>
          )}
          <button
            onClick={handlePurchase}
            disabled={loading}
            style={{ display: 'block', width: '100%', margin: '1rem auto 0', padding: '0.75rem 2rem', backgroundColor: loading ? '#cccccc' : '#ff6200', color: '#f4f1de', fontSize: '1rem', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s' }}
          >
            {loading ? 'Processing...' : 'Order Now'}
          </button>
        </div>
      )}

      <div style={{ marginTop: '2rem', maxWidth: '700px', margin: '2rem auto' }}>
        <h3 style={{ textAlign: 'center', color: '#2b2d42', fontSize: '1.5rem', marginBottom: '1rem' }}>Recent Reviews</h3>
        {reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r.review_id || r.id} style={{ background: '#fff', padding: '1rem', borderRadius: '4px', margin: '0.5rem 0', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <p style={{ fontWeight: '600' }}>Rating: {'⭐'.repeat(r.rating)}</p>
              <p style={{fontStyle:'italic', color: '#555'}}>By: {r.user_name || 'Anonymous'}</p>
              <p style={{marginTop: '0.5rem'}}>{r.comment}</p>
              <p style={{fontSize: '0.8em', color: '#777', textAlign: 'right'}}>{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>No reviews yet for this artwork.</p>
        )}
      </div>
      
      {user?.role === 'buyer' && (
        <form
          onSubmit={handleReviewSubmit}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '500px', margin: '2rem auto' }}
        >
          <h3 style={{color: '#ff6200', fontSize: '1.2rem'}}>Leave a Review</h3>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your thoughts on this artwork..."
            rows="4"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '1px solid #ff6200', borderRadius: '4px', outline: 'none', backgroundColor: '#fff9f0', color: '#2b2d42' }}
          />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '1px solid #ff6200', borderRadius: '4px', backgroundColor: '#fff9f0', color: '#2b2d42' }}
          >
            <option value="">Select Rating</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={r}>{r} Star{r > 1 && 's'}</option>
            ))}
          </select>
          <button
            type="submit"
            style={{ padding: '0.75rem 2rem', backgroundColor: '#ff6200', color: '#f4f1de', fontSize: '1rem', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.3s' }}
          >
            Submit Review
          </button>
        </form>
      )}

      <button
        onClick={() => navigate(-1)}
        style={{ display: 'block', margin: '2rem auto', fontSize: '1rem', color: '#4a7289', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}

      >
        Back
      </button>
    </div>
  );
}

export default ArtworkDetail;