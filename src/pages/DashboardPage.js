import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function DashboardPage() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>
        Welcome, {user?.name}!
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {user?.role === 'buyer' ? (
          <>
            <Link to="/artworks" className="button button-secondary">Browse Artworks</Link>
            <Link to="/orders" className="button button-secondary">View My Orders</Link>
          </>
        ) : (
          <>
            <Link to="/add-artwork" className="button button-secondary">Add Artwork</Link>
            <Link to="/artwork-management" className="button button-secondary">Manage Artworks</Link>
            <Link to="/orders" className="button button-secondary">View My Sales</Link>
          </>
        )}
      </div>
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Your Stats</h3>
        <p>{user?.role === 'buyer' ? `Active Orders: 2` : `Artworks Sold: 5`}</p>
      </div>
    </div>
  );
}

export default DashboardPage;