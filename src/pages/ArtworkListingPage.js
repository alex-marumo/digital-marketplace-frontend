import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ArtworkCard from '../components/ArtworkCard';

function ArtworkListingPage() {
  const [artworks, setArtworks] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3000/api/artworks')
      .then(response => setArtworks(response.data))
      .catch(error => console.error('Error fetching artworks:', error));
  }, []);

  const handleSearch = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/search', { query: search });
      setArtworks(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search artworks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button onClick={handleSearch} className="button button-secondary" style={{ marginTop: '8px' }}>Search</button>
      </div>
      <div>
        {artworks.map(artwork => <ArtworkCard key={artwork.artwork_id} artwork={artwork} />)}
      </div>
    </div>
  );
}

export default ArtworkListingPage;