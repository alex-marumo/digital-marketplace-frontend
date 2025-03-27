import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/orders/${orderId}`)
      .then(response => setOrder(response.data))
      .catch(error => console.error('Error fetching order:', error));
  }, [orderId]);

  const handleConfirmPayment = async () => {
    try {
      await axios.post('http://localhost:3000/api/payments/confirm', {
        order_id: orderId,
        transaction_ref: `mock-${orderId}`,
      });
      navigate(`/order-tracking/${orderId}`);
    } catch (error) {
      console.error('Payment confirmation failed:', error);
    }
  };

  if (!order) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>Order Confirmed</h2>
      <p style={{ marginBottom: '8px' }}>Order ID: {orderId}</p>
      <p style={{ marginBottom: '8px' }}>Artwork: Artwork Title</p>
      <p style={{ marginBottom: '8px' }}>Total: $50</p>
      <p style={{ marginBottom: '16px' }}>Payment Status: Pending</p>
      <button onClick={handleConfirmPayment} className="button">Confirm Payment</button>
    </div>
  );
}

export default OrderConfirmationPage;