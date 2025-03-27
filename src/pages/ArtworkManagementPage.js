import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function ArtworkManagementPage() {
  const { user } = useContext(AuthContext);
  const [artworks, setArtworks] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3000/api/artworks')
      .then(response => setArtworks(response.data.filter(artwork => artwork.artist_id === user?.keycloak_id)))
      .catch(error => console.error('Error fetching artworks:', error));
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/artworks/${id}`);
      setArtworks(artworks.filter(artwork => artwork.artwork_id !== id));
    } catch (error) {
      console.error('Error deleting artwork:', error);
    }
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>My Artworks</h2>
      <div>
        {artworks.map(artwork => (
          <div key={artwork.artwork_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{artwork.title}</h3>
              <p>${artwork.price}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to={`/edit-artwork/${artwork.artwork_id}`} className="button button-secondary" style={{ padding: '8px 16px' }}>Edit</Link>
              <button onClick={() => handleDelete(artwork.artwork_id)} className="button button-danger" style={{ padding: '8px 16px' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArtworkManagementPage;