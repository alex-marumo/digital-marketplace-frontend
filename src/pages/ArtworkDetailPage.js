import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ArtworkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/artworks/${id}`)
      .then(response => setArtwork(response.data))
      .catch(error => console.error('Error fetching artwork:', error));
  }, [id]);

  const handleBuyNow = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/orders', {
        artwork_id: id,
        total_amount: artwork.price,
      });
      navigate(`/payment/${response.data.order_id}`);
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  if (!artwork) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <img src={artwork.images?.[0] || 'placeholder.jpg'} alt={artwork.title} style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '16px' }} />
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{artwork.title}</h2>
      <p style={{ color: '#666', marginBottom: '8px' }}>{artwork.description}</p>
      <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>${artwork.price}</p>
      <p style={{ fontSize: '14px', fontStyle: 'italic', marginBottom: '16px' }}>{artwork.artist_name}</p>
      <button onClick={handleBuyNow} className="button">Buy Now</button>
    </div>
  );
}

export default ArtworkDetailPage;