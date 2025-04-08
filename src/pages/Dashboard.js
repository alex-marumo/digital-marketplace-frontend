import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ArtworkCard from '../components/ArtworkCard';
import RolePromptModal from '../components/RolePromptModal';

function Dashboard() {
  const { authenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState([]);
  const [showRolePrompt, setShowRolePrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!authenticated) {
        navigate('/login-register');
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          logout();
          navigate('/login-register');
          return;
        }

        if (!user) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for AuthContext to settle
        }

        // Only show prompt if role is missing (shouldn’t happen with index.js)
        if (!user?.role) {
          setShowRolePrompt(true);
        } else if (user.role === 'buyer') {
          const response = await axios.get('/api/artworks', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setArtworks(response.data);
        } else if (user.role === 'artist') {
          const response = await axios.get('/api/artworks', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const artistArtworks = response.data.filter(
            (artwork) => artwork.artist_id === user.keycloak_id
          );
          setArtworks(artistArtworks);
        }
      } catch (error) {
        console.error('Dashboard error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          logout();
          navigate('/login-register');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authenticated, user, navigate, logout]);

  const handleRoleSelection = async (role) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (role === 'artist') {
        navigate('/request-artist');
      } else if (role === 'buyer') {
        setShowRolePrompt(false);
        const response = await axios.get('/api/artworks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setArtworks(response.data);
      }
    } catch (error) {
      console.error('Role selection error:', error.response?.data || error.message);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      {showRolePrompt && (
        <RolePromptModal
          isOpen={true}
          onClose={() => setShowRolePrompt(false)}
          onSelectRole={handleRoleSelection}
        />
      )}

      {user?.role === 'buyer' && !showRolePrompt && (
        <>
          <h1>Browse Artworks</h1>
          <p className="text-center">Explore unique artworks from your community</p>
          <div className="artwork-list">
            {artworks.length > 0 ? (
              artworks.map((artwork) => (
                <ArtworkCard key={artwork.artwork_id} artwork={artwork} />
              ))
            ) : (
              <p>No artworks available yet.</p>
            )}
          </div>
          <Link to="/search" className="button m-bottom">Search Artworks</Link>
        </>
      )}

      {user?.role === 'artist' && !showRolePrompt && (
        <>
          <h1>Your Artworks</h1>
          <p className="text-center">Manage your artwork collection</p>
          <Link to="/add-artwork" className="button m-bottom">Add New Artwork</Link>
          <div className="artwork-list">
            {artworks.length > 0 ? (
              artworks.map((artwork) => (
                <ArtworkCard key={artwork.artwork_id} artwork={artwork} />
              ))
            ) : (
              <p>You haven’t added any artworks yet.</p>
            )}
          </div>
        </>
      )}

      {(!user?.role && !showRolePrompt) && (
        <p>Whoops, something’s off—please log out and back in.</p>
      )}
    </div>
  );
}

export default Dashboard;