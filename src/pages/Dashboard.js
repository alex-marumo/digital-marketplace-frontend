import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ArtworkCard from '../components/ArtworkCard';
import RolePromptModal from '../components/RolePromptModal';
import { Sparkles, UserCircle2, Brush, ShoppingCart, Clock } from 'lucide-react';

function Dashboard() {
  const { authenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showRolePrompt, setShowRolePrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Dashboard mounted:', { authenticated, role: user?.role, status: user?.status });
    const fetchDashboardData = async () => {
      if (!authenticated) return navigate('/login-register');
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('Missing token');

        if (!user) await new Promise((res) => setTimeout(res, 100));
        if (!user?.role) return setShowRolePrompt(true);
        if (user.role === 'admin') return navigate('/admin');

        const { data } = await axios.get('http://localhost:3001/api/artworks', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (user.role === 'artist') {
          const artistArtworks = data.filter(a => a.artist_id === user.keycloak_id);
          setArtworks(artistArtworks);
        } else {
          setArtworks(data);
          // Fetch recently viewed
          const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
          const viewedArtworks = data.filter(a => viewedIds.includes(a.artwork_id.toString()));
          setRecentlyViewed(viewedArtworks);
        }
      } catch (error) {
        console.error('Fetch artworks error:', error.response?.data, error.message);
        logout();
        navigate('/login-register');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [authenticated, user, navigate, logout]);

  const handleRoleSelection = async (role) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (role === 'artist') return navigate('/request-artist');
      setShowRolePrompt(false);
      const { data } = await axios.get('http://localhost:3001/api/artworks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArtworks(data);
    } catch (err) {
      console.error('Role selection error:', err);
    }
  };

  if (loading) return <div className="container text-center">Loading...</div>;

  return (
    <div className="container">
      {showRolePrompt && (
        <RolePromptModal
          isOpen={true}
          onClose={() => setShowRolePrompt(false)}
          onSelectRole={handleRoleSelection}
        />
      )}

      {!showRolePrompt && (
        <>
          <div className="card text-center m-bottom">
            <h1 className="text-2xl font-bold mb-1">Welcome, {user?.name || 'User'} 👋</h1>
            <p className="text-muted text-sm">
              {user?.role === 'artist'
                ? 'Create, showcase, and sell your art'
                : 'Browse and buy community-crafted masterpieces'}
            </p>
          </div>

          {user?.role === 'artist' && (
            <>
              <div className="card m-bottom">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Brush size={20} /> Your Art Collection
                </h2>
                <Link to="/add-artwork" className="button m-bottom">
                  Add New Artwork
                </Link>
                {artworks.length > 0 ? (
                  <div className="artwork-list">
                    {artworks.map((a) => (
                      <ArtworkCard key={a.artwork_id} artwork={a} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted">You haven’t added any artworks yet.</p>
                )}
              </div>
            </>
          )}

          {user?.role === 'buyer' && (
            <>
              <div className="card m-bottom">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <ShoppingCart size={20} /> Featured Artworks
                </h2>
                <p className="text-sm text-muted mb-2">Hand-picked for your taste.</p>
                {artworks.length > 0 ? (
                  <div className="artwork-list">
                    {artworks.map((a) => (
                      <ArtworkCard key={a.artwork_id} artwork={a} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted">No artworks available yet.</p>
                )}
              </div>

              <div className="text-center m-bottom">
                <Link to="/search" className="button">
                  Search More Art
                </Link>
              </div>

              <div className="card m-bottom">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Clock size={20} /> Recently Viewed
                </h2>
                {recentlyViewed.length > 0 ? (
                  <div className="artwork-list">
                    {recentlyViewed.map((a) => (
                      <ArtworkCard key={a.artwork_id} artwork={a} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted text-center">
                    No recently viewed artworks.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;