import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ArtworkCard from '../components/ArtworkCard';
import RolePromptModal from '../components/RolePromptModal';

function Dashboard() {
  const { user, token } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [showRolePrompt, setShowRolePrompt] = useState(user?.role === 'pending');

  useEffect(() => {
    if (user?.role === 'buyer') {
      axios.get('/api/artworks', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setArtworks(res.data));
    } else if (user?.role === 'artist') {
      axios.get('/api/artist/artworks', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setArtworks(res.data));
    }
  }, [user, token]);

  return (
    <div className="container">
      <h1>{user?.role === 'buyer' ? 'Browse Artworks' : 'Your Artworks'}</h1>
      {user?.role === 'buyer' && (
        <div className="artwork-list">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
      {user?.role === 'artist' && (
        <div>
          <Link to="/add-artwork" className="button">Add New Artwork</Link>
          <div className="artwork-list">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        </div>
      )}
      {showRolePrompt && <RolePromptModal isOpen={true} onClose={() => setShowRolePrompt(false)} />}
    </div>
  );
}

export default Dashboard;