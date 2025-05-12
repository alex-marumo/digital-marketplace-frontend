import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function ArtworkDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtwork = async (retryCount = 0) => {
      if (isNaN(id)) {
        setError('Invalid artwork ID');
        setLoading(false);
        return;
      }
      if (!token) {
        setError('Please log in to view artwork');
        setLoading(false);
        navigate('/login');
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/artworks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data.image_url) {
          res.data.image_url = '/placeholder.jpg';
        }
        setArtwork(res.data);
        setLoading(false);

        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (!viewed.includes(id)) {
          viewed.push(id);
          localStorage.setItem('recentlyViewed', JSON.stringify(viewed.slice(-5)));
        }
      } catch (err) {
        if (retryCount < 2 && err.response?.status === 503) {
          setTimeout(() => fetchArtwork(retryCount + 1), 1000);
          return;
        }
        setError(
          err.response?.status === 401 ? 'Please log in to view artwork' :
          err.response?.status === 404 ? 'Artwork not found' : 'Failed to load artwork'
        );
        setLoading(false);
        if (err.response?.status === 401) navigate('/login');
      }
    };
    fetchArtwork();
  }, [id, token, navigate]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/reviews/${id}`);
        console.log('Fetched reviews:', response.data);
        setReviews(response.data.slice(0, 3));
        if (response.data.length) {
          const total = response.data.reduce((sum, r) => sum + r.rating, 0);
          setAverageRating((total / response.data.length).toFixed(1));
      }
      } catch (err) {
        console.error('Failed to load reviews:', err.response?.data || err.message);
      }
    };
    fetchReviews();
  }, [id]);

  const handlePurchase = async () => {
    if (!artwork) return;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/orders`,
        { artwork_id: id, total_amount: artwork.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/payment');
    } catch (err) {
      alert('Failed to process purchase. Please try again.');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!review.trim()) {
      alert('Review cannot be empty');
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/reviews`,
        { artwork_id: id, rating, comment: review, user_id: user?.keycloak_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReview('');
      setRating(5);
      alert('Review submitted!');
    } catch (err) {
      alert('Failed to submit review. Please try again.');
    }
  };

  if (loading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f1de', fontSize: '1.5rem', color: '#2b2d42', fontWeight: '600' }}>
        Loading...
      </div>
    );
  if (error)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f1de', fontSize: '1.5rem', color: '#d00000', fontWeight: '600' }}>
        {error}
      </div>
    );
  if (!artwork)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f1de', fontSize: '1.5rem', color: '#2b2d42', fontWeight: '600' }}>
        Artwork not found
      </div>
    );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', backgroundColor: '#f4f1de', minHeight: '100vh', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#ff6200', marginBottom: '1.5rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
        {artwork.title}
      </h1>
      <img
        src={artwork.image_url.startsWith('http') ? artwork.image_url : `${API_BASE_URL}${artwork.image_url}`}
        alt={artwork.title || 'Artwork'}
        style={{ width: '100%', maxWidth: '600px', display: 'block', margin: '0 auto 1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', objectFit: 'cover', maxHeight: '400px', border: '2px solid #2b2d42' }}
        onError={(e) => { e.target.src = '/placeholder.jpg'; }}
      />
      <p style={{ color: '#2b2d42', fontSize: '1.125rem', lineHeight: '1.6', marginBottom: '1rem', textAlign: 'center', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
        {artwork.description || 'No description available'}
      </p>
      {averageRating && (
        <p style={{ textAlign: 'center', color: '#ff6200', fontWeight: '600', fontSize: '1.2rem' }}>
          ⭐ {averageRating} out of 5
        </p>
      )}
      {reviews.length > 0 ? (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ textAlign: 'center', color: '#2b2d42' }}>Recent Reviews</h3>
          {reviews.map((r, i) => (
            <div key={i} style={{ background: '#fff', padding: '1rem', borderRadius: '4px', margin: '0.5rem auto', maxWidth: '600px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <p style={{ fontWeight: '600' }}>Rating: {r.rating} ⭐</p>
              <p>{r.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>No reviews yet.</p>
      )}
      <p style={{ color: '#2b2d42', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', textAlign: 'center' }}>
        {new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP' }).format(artwork.price)}
      </p>
      <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '2rem', textAlign: 'center', fontStyle: 'italic' }}>
        By {artwork.artist_name || 'Unknown Artist'}
      </p>
      {user?.role === 'buyer' && (
        <form
          onSubmit={handleReview}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '500px', margin: '0 auto 2rem' }}
        >
          <input
            type="text"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Drop a fire review 🔥"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #ff6200', borderRadius: '4px', outline: 'none', backgroundColor: '#f4f1de', color: '#2b2d42', transition: 'border-color 0.3s' }}
            onFocus={(e) => (e.target.style.borderColor = '#e05500')}
            onBlur={(e) => (e.target.style.borderColor = '#ff6200')}
          />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #ff6200', borderRadius: '4px', backgroundColor: '#f4f1de', color: '#2b2d42' }}
          >
            {[1, 2, 3, 4, 5].map(r => (
              <option key={r} value={r}>{r} Star{r > 1 && 's'}</option>
            ))}
          </select>
          <button
            type="submit"
            style={{ padding: '0.75rem 2rem', backgroundColor: '#ff6200', color: '#f4f1de', fontSize: '1rem', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.3s, transform 0.2s' }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#e05500')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#ff6200')}
            onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Submit Review
          </button>
        </form>
      )}
      <button
        onClick={() => navigate('/artworks')}
        style={{ display: 'block', margin: '0 auto', fontSize: '1rem', color: '#4a7289', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.3s' }}
        onMouseOver={(e) => (e.target.style.color = '#355b71')}
        onMouseOut={(e) => (e.target.style.color = '#4a7289')}
      >
        Back to Artworks
      </button>
    </div>
  );
}

export default ArtworkDetail;
