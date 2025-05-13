import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';

function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [phoneNumber, setPhoneNumber] = useState('');

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      console.log('[ORDERS FETCH DEBUG] Sending request:', { url: `${API_BASE_URL}/api/orders?page=${page}&limit=${pagination.limit}` });
      const res = await axios.get(`${API_BASE_URL}/api/orders?page=${page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[ORDERS FETCH DEBUG] Response:', res.data);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);

      // Fetch payments for each order
      const paymentPromises = res.data.orders.map(order =>
        axios.get(`${API_BASE_URL}/api/payments/${order.order_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => ({ data: [] })) // Handle errors gracefully
      );
      const paymentResponses = await Promise.all(paymentPromises);
      const paymentData = {};
      res.data.orders.forEach((order, index) => {
        const payment = paymentResponses[index].data[0] || {};
        paymentData[order.order_id] = payment;
        console.log('[ORDERS PAYMENT DEBUG]', {
          order_id: order.order_id,
          payment_status: payment.status,
          payment_method: payment.payment_method,
          payment_url: payment.payment_url
        });
      });
      setPayments(paymentData);
      setLoading(false);
    } catch (err) {
      console.error('[ORDERS FETCH ERROR]:', {
        status: err.response?.status,
        message: err.response?.data?.error,
        details: err.response?.data?.details,
      });
      if (err.response?.status === 401) {
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.error || 'Failed to load orders. Try again later.');
      }
      setLoading(false);
    }
  };

  const handlePayNow = async (orderId, amount) => {
  if ((paymentMethod === 'orange_money' || paymentMethod === 'myzaka') && !phoneNumber) {
    alert('Please enter a phone number for mobile money payments.');
    return;
  }
  try {
    console.log('[ORDERS PAY NOW DEBUG] Initiating payment:', { orderId, amount, paymentMethod, phoneNumber });
    const res = await axios.post(
      `${API_BASE_URL}/api/payments`,
      { order_id: orderId, amount, payment_method: paymentMethod, phone_number: phoneNumber },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('[ORDERS PAY NOW SUCCESS] Response:', res.data);
    if (res.data.paymentUrl) {
      if (paymentMethod === 'paypal') {
        window.location.href = res.data.paymentUrl;
      } else {
        alert(res.data.paymentUrl); // Show USSD instructions
        window.location.href = res.data.paymentUrl; // Redirect to mock payment page
      }
    }
  } catch (err) {
    console.error('[ORDERS PAY NOW ERROR]:', err.response?.data || err.message);
    const errorMessage = err.response?.data?.details?.includes('column')
      ? 'Payment system error. Try Orange Money or MyZaka, or contact support.'
      : err.response?.data?.error || 'Failed to initiate payment. Try again.';
    alert(errorMessage);
  }
};

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setError('Please log in to view orders');
      setLoading(false);
    }
  }, [token]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  const formatter = new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP' });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        background: 'linear-gradient(135deg, #f4f1de, #e0e0e0)', fontSize: '1.5rem', 
        color: '#ff6200', fontWeight: '700', textTransform: 'uppercase' 
      }}>
        Loading your orders, hold tight...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        background: 'linear-gradient(135deg, #f4f1de, #e0e0e0)', fontSize: '1.5rem', 
        color: '#d00000', fontWeight: '700' 
      }}>
        Oops: {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        background: 'linear-gradient(135deg, #f4f1de, #e0e0e0)', fontSize: '1.5rem', 
        color: '#2b2d42', fontWeight: '600', textAlign: 'center' 
      }}>
        No orders yet, fam. Go get yourself some art! 🎨
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', 
      background: 'linear-gradient(135deg, #f4f1de, #ffffff)', minHeight: '100vh',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px' 
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', fontWeight: '800', color: '#ff6200', marginBottom: '2rem', 
        textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', 
        textShadow: '1px 1px 2px rgba(0,0,0,0.2)' 
      }}>
        Your Orders 🔥
      </h1>
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
        gap: '1.5rem', padding: '0 1rem' 
      }}>
        {orders.map((order) => {
          const payment = payments[order.order_id] || {};
          return (
            <div
              key={order.order_id}
              style={{
                backgroundColor: '#f4f1de', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden', padding: '1rem', transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,98,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to={`/artworks/${order.artwork_id}`}>
                  <img
                    src={order.image_url ? `${API_BASE_URL}${order.image_url}` : '/placeholder.jpg'}
                    alt={order.artwork_title}
                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                  />
                </Link>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ff6200', marginBottom: '0.5rem' }}>
                    {order.artwork_title}
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#2b2d42', marginBottom: '0.3rem' }}>
                    Order ID: {order.order_id}
                  </p>
                  <p style={{ fontSize: '1rem', color: '#2b2d42', marginBottom: '0.3rem' }}>
                    Date: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: '1rem', color: '#2b2d42', marginBottom: '0.3rem' }}>
                    Price: {formatter.format(order.price)}
                  </p>
                  <p style={{ fontSize: '1rem', color: '#2b2d42', marginBottom: '0.3rem' }}>
                    Status: {order.status}
                  </p>
                  <p style={{ 
                    fontSize: '1rem', 
                    color: payment.status === 'completed' ? '#2b2d42' : '#d00000', 
                    marginBottom: '0.5rem' 
                  }}>
                    Payment: {payment.status === 'completed' ? 
                      `Paid via ${payment.payment_method?.replace('_', ' ').toUpperCase()}` : 
                      `Pending${payment.payment_method ? ` via ${payment.payment_method.replace('_', ' ').toUpperCase()}` : ''}`}
                  </p>
                  {payment.status !== 'completed' && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <select 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ padding: '0.5rem', marginRight: '0.5rem', borderRadius: '4px' }}
                      >
                        <option value="paypal">PayPal</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="myzaka">MyZaka</option>
                      </select>
                      {(paymentMethod === 'orange_money' || paymentMethod === 'myzaka') && (
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}
                        />
                      )}
                      <button
                        onClick={() => handlePayNow(order.order_id, order.price)}
                        style={{
                          padding: '0.5rem 1rem', backgroundColor: '#ff6200', color: '#f4f1de',
                          fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer',
                          transition: 'background-color 0.3s, transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          marginTop: '0.5rem'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#e05500'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#ff6200'}
                        onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        Pay Now
                      </button>
                    </div>
                  )}
                  <Link
                    to={`/orders/${order.order_id}`}
                    style={{
                      fontSize: '0.9rem', color: '#4a7289', textDecoration: 'none', fontWeight: '600',
                      display: 'block', marginTop: '0.5rem', transition: 'color 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.color = '#ff6200'}
                    onMouseOut={(e) => e.target.style.color = '#4a7289'}
                  >
                    View Order Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ 
        marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', 
        gap: '1rem', fontSize: '1.1rem', color: '#2b2d42' 
      }}>
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          style={{ 
            padding: '0.5rem 1.5rem', backgroundColor: pagination.page === 1 ? '#e0e0e0' : '#ff6200',
            color: pagination.page === 1 ? '#6b7280' : '#f4f1de', fontWeight: '600', border: 'none',
            borderRadius: '4px', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s, transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => pagination.page !== 1 && (e.target.style.backgroundColor = '#e05500')}
          onMouseOut={(e) => pagination.page !== 1 && (e.target.style.backgroundColor = '#ff6200')}
          onMouseDown={(e) => pagination.page !== 1 && (e.target.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => pagination.page !== 1 && (e.target.style.transform = 'scale(1)')}
        >
          Previous
        </button>
        <span style={{ fontWeight: '600' }}>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          style={{ 
            padding: '0.5rem 1.5rem', backgroundColor: pagination.page === pagination.totalPages ? '#e0e0e0' : '#ff6200',
            color: pagination.page === pagination.totalPages ? '#6b7280' : '#f4f1de', fontWeight: '600', border: 'none',
            borderRadius: '4px', cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s, transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => pagination.page !== pagination.totalPages && (e.target.style.backgroundColor = '#e05500')}
          onMouseOut={(e) => pagination.page !== pagination.totalPages && (e.target.style.backgroundColor = '#ff6200')}
          onMouseDown={(e) => pagination.page !== pagination.totalPages && (e.target.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => pagination.page !== pagination.totalPages && (e.target.style.transform = 'scale(1)')}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Orders;