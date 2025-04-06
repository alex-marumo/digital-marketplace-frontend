import React from 'react';
import { Link } from 'react-router-dom';

function ArtworkCard({ artwork, showDetails = true }) {
  return (
    <div className="card">
      <img src={artwork.image_url || '/placeholder.jpg'} alt={artwork.title || 'Featured Artwork'} />
      {showDetails && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{artwork.title}</h3>
          {artwork.price && <p style={{ color: '#666' }}>${artwork.price}</p>}
          <p style={{ fontSize: '14px', color: '#888' }}>{artwork.artist || artwork.artist_name}</p>
          <Link to={`/artworks/${artwork.artwork_id}`} className="text-blue">View Details</Link>
        </div>
      )}
    </div>
  );
}

export default ArtworkCard;