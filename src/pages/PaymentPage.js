import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('paypal');

  const handlePayment = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/payments', {
        order_id: orderId,
        amount: 50,
        payment_method: paymentMethod,
      });
      if (paymentMethod === 'paypal') {
        window.location.href = response.data.paymentUrl;
      } else {
        navigate(`/order-confirmation/${orderId}`);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>Order Summary</h2>
      <p style={{ marginBottom: '8px' }}>Artwork: Artwork Title</p>
      <p style={{ marginBottom: '16px' }}>Total: $50</p>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Select Payment Method</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <label>
          <input type="radio" value="paypal" checked={paymentMethod === 'paypal'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '8px' }} />
          PayPal
        </label>
        <label>
          <input type="radio" value="orange_money" checked={paymentMethod === 'orange_money'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '8px' }} />
          Orange Money
        </label>
        <label>
          <input type="radio" value="myzaka" checked={paymentMethod === 'myzaka'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '8px' }} />
          MyZaka
        </label>
      </div>
      <button onClick={handlePayment} className="button">Proceed to Payment</button>
    </div>
  );
}

export default PaymentPage;