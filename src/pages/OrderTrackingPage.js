import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/orders/${orderId}`)
      .then(response => setOrder(response.data))
      .catch(error => console.error('Error fetching order:', error));
  }, [orderId]);

  const handleAction = async () => {
    try {
      if (user.role === 'artist') {
        await axios.put(`http://localhost:3000/api/orders/${orderId}/status`, { status: 'delivered' });
      } else {
        await axios.put(`http://localhost:3000/api/orders/${orderId}/status`, { status: 'completed' });
      }
      navigate('/orders');
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  if (!order) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>Order #{orderId}</h2>
      <p style={{ marginBottom: '8px' }}>Artwork: Artwork Title</p>
      <p style={{ marginBottom: '8px' }}>Total: $50</p>
      <p style={{ marginBottom: '16px' }}>Status: Payment Held</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <p>Payment Held</p>
        <p>Delivered</p>
        <p>Completed</p>
      </div>
      <button onClick={handleAction} className="button">
        {user.role === 'artist' ? 'Mark as Delivered' : 'Confirm Receipt'}
      </button>
    </div>
  );
}

export default OrderTrackingPage;