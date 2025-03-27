import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function ProfilePage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>My Profile</h2>
      <div>
        <p style={{ marginBottom: '8px' }}>Name: {user?.name}</p>
        <p style={{ marginBottom: '8px' }}>Email: {user?.email}</p>
        <p style={{ marginBottom: '16px' }}>Role: {user?.role}</p>
        <button className="button">Edit Profile</button>
      </div>
    </div>
  );
}

export default ProfilePage;