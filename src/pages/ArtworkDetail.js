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
        console.log('Fetched artwork:', res.data);
        if (!res.data.image_url) {
          console.warn('No image_url provided, using placeholder');
          res.data.image_url = '/placeholder.jpg';
        }
        setArtwork(res.data);
        setLoading(false);

        // Track recently viewed
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (!viewed.includes(id)) {
          viewed.push(id);
          localStorage.setItem('recentlyViewed', JSON.stringify(viewed.slice(-5)));
        }
      } catch (err) {
        console.error('Fetch artwork error:', err.response?.data || err.message);
        if (retryCount < 2 && err.response?.status === 503) {
          setTimeout(() => fetchArtwork(retryCount + 1), 1000);
          return;
        }
        setError(
          err.response?.status === 401
            ? 'Please log in to view artwork'
            : err.response?.status === 404
            ? 'Artwork not found'
            : 'Failed to load artwork'
        );
        setLoading(false);
        if (err.response?.status === 401) navigate('/login');
      }
    };
    fetchArtwork();
  }, [id, token, navigate]);

  const handlePurchase = async () => {
    if (!artwork) return;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/orders`,
        { artwork_id: id, total_amount: artwork.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Order created:', res.data);
      navigate('/payment');
    } catch (err) {
      console.error('Purchase error:', err.response?.data || err.message);
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
        { artwork_id: id, rating: 5, comment: review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReview('');
      alert('Review submitted!');
    } catch (err) {
      console.error('Review error:', err.response?.data || err.message);
      alert('Failed to submit review. Please try again.');
    }
  };

  if (loading) return <div className="container text-center">Loading...</div>;
  if (error) return <div className="container text-center text-red-500">{error}</div>;
  if (!artwork) return <div className="container text-center">Artwork not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-teal-600 mb-4">{artwork.title}</h1>
      <img
        src={artwork.image_url.startsWith('http') ? artwork.image_url : `${API_BASE_URL}${artwork.image_url}`}
        alt={artwork.title || 'Artwork'}
        className="artwork-image w-full max-w-md mx-auto mb-4 rounded"
        onError={(e) => {
          e.target.src = '/placeholder.jpg';
          console.log('Image load error:', artwork.image_url);
        }}
      />
      <p className="text-gray-600 mb-2">{artwork.description || 'No description available'}</p>
      <p className="text-gray-800 font-semibold mb-2">
        {new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP' }).format(artwork.price)}
      </p>
      <p className="text-gray-500 mb-4">By {artwork.artist_name || 'Unknown Artist'}</p>
      {user?.role === 'buyer' && (
        <button
          className="button bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 mb-4"
          onClick={handlePurchase}
        >
          Buy Now
        </button>
      )}
      {user?.role === 'buyer' && (
        <form onSubmit={handleReview} className="form-group">
          <input
            type="text"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Leave a review"
            className="form-input border border-gray-300 rounded px-4 py-2 w-full max-w-md mb-2"
          />
          <button
            type="submit"
            className="button bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
          >
            Submit Review
          </button>
        </form>
      )}
      <button
        onClick={() => navigate('/artworks')}
        className="mt-4 text-blue-600 underline hover:text-blue-800"
      >
        Back to Artworks
      </button>
    </div>
  );
}

export default ArtworkDetail;