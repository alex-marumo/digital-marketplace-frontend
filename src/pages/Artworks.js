import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ArtworkCard from '../components/ArtworkCard';
import CategoryButtons from '../components/CategoryButtons';

function Artworks() {
  const { token } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [categories] = useState(['Painting', 'Sculpture', 'Photography', 'Digital']);

  useEffect(() => {
    axios.get('/api/artworks', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setArtworks(res.data));
  }, [token]);

  const handleCategorySelect = (category) => {
    axios.get(`/api/artworks?category=${category}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setArtworks(res.data));
  };

  return (
    <div className="container">
      <h1>Browse All Artworks</h1>
      <CategoryButtons categories={categories} onCategorySelect={handleCategorySelect} />
      <div className="artwork-list">
        {artworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </div>
  );
}

export default Artworks;