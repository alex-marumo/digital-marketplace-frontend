import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Orders() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  // The separate `payments` state from your version is kept.
  // However, for button logic, we'll primarily rely on order.payment_status, 
  // order.order_status, and order.artwork_current_status.
  const [payments, setPayments] = useState({}); 
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for payment inputs specific to each order card
  const [paymentMethodStates, setPaymentMethodStates] = useState({});
  const [phoneNumberStates, setPhoneNumberStates] = useState({});
  
  const [showCancelled, setShowCancelled] = useState(false);

  const fetchOrders = useCallback(async (currentPage = 1) => {
    if (!token) {
      setLoading(false);
      setError('Please log in to view orders.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/orders?page=${currentPage}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedOrdersRaw = res.data.orders || [];
      console.log("[Orders.js] Fetched orders from backend:", fetchedOrdersRaw); 

      // Ensure all necessary status fields are present, defaulting if necessary
      // This assumes your backend sends:
      // order.status AS order_status
      // order.payment_status AS payment_status
      // artwork.status AS artwork_current_status
      const processedOrders = fetchedOrdersRaw.map(order => ({
        ...order,
        order_status: order.order_status || order.status || 'pending', // Use order_status, fallback to status
        payment_status: order.payment_status || 'pending', 
        artwork_current_status: order.artwork_current_status || 'available' // CRITICAL from backend
      }));
      
      const ordersToDisplay = showCancelled
        ? processedOrders
        : processedOrders.filter(order => order.order_status !== 'cancelled');
      
      setOrders(ordersToDisplay);
      setPagination(res.data.pagination || { page: currentPage, limit: pagination.limit, total: 0, totalPages: 1 });
      
      // Initialize payment inputs for relevant orders
      const initialPaymentMethods = { ...paymentMethodStates }; // Preserve existing selections
      const initialPhoneNumbers = { ...phoneNumberStates };
      ordersToDisplay.forEach(order => {
        const canPayNow = order.payment_status !== 'completed' &&
                          order.order_status !== 'cancelled' &&
                          order.artwork_current_status !== 'sold';
        if (canPayNow) { // Only initialize for orders that might need payment
            if (!initialPaymentMethods[order.order_id]) { // Only if not already set
                initialPaymentMethods[order.order_id] = order.payment_method || 'paypal'; // Default to order's current method or paypal
            }
            if (!initialPhoneNumbers[order.order_id]) { // Only if not already set
                initialPhoneNumbers[order.order_id] = '';
            }
        }
      });
      setPaymentMethodStates(initialPaymentMethods);
      setPhoneNumberStates(initialPhoneNumbers);

      // Fetch detailed payments info (from your original code)
      // This might be simplified if order.payment_status and order.payment_method from /api/orders is sufficient
      const paymentPromises = ordersToDisplay.map(order =>
        axios.get(`${API_BASE_URL}/api/payments/${order.order_id}`, { // This fetches detailed payment records
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })) 
      );
      const paymentResponses = await Promise.all(paymentPromises);
      const paymentData = {};
      ordersToDisplay.forEach((order, index) => {
        const paymentInfo = paymentResponses[index].data[0] || {}; 
        paymentData[order.order_id] = paymentInfo;
      });
      setPayments(paymentData); // This state holds more detailed payment info if needed

    } catch (err) {
      console.error("Fetch Orders Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        navigate('/login-register');
      } else {
        setError(err.response?.data?.error || 'Failed to load orders. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, pagination.limit, showCancelled, navigate]); // pagination.page removed from deps, passed as arg

  useEffect(() => {
    fetchOrders(pagination.page);
  }, [fetchOrders, pagination.page, location.key]); // location.key for re-fetch on navigation


  const handlePaymentMethodChange = (orderId, value) => {
    setPaymentMethodStates(prev => ({ ...prev, [orderId]: value }));
  };

  const handlePhoneNumberChange = (orderId, value) => {
    setPhoneNumberStates(prev => ({ ...prev, [orderId]: value }));
  };

  const handlePayNow = async (orderId, amount, artworkCurrentStatus) => {
    if (artworkCurrentStatus === 'sold') {
      alert('This artwork has already been sold and cannot be paid for.');
      fetchOrders(pagination.page); 
      return;
    }
    
    const currentPaymentMethodForOrder = paymentMethodStates[orderId] || 'paypal';
    const currentPhoneNumberForOrder = phoneNumberStates[orderId] || '';

    if ((currentPaymentMethodForOrder === 'orange_money' || currentPaymentMethodForOrder === 'myzaka') && !currentPhoneNumberForOrder.trim()) {
      alert('Please enter a phone number for mobile money payments.');
      return;
    }
    if ((currentPaymentMethodForOrder === 'orange_money' || currentPaymentMethodForOrder === 'myzaka') && !/^\+267\d{8}$/.test(currentPhoneNumberForOrder)) {
      alert('Please enter a valid Botswana phone number (e.g., +267712345678).');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/payments`,
        { 
          order_id: orderId, 
          amount: parseFloat(amount), 
          payment_method: currentPaymentMethodForOrder, 
          phone_number: (currentPaymentMethodForOrder === 'orange_money' || currentPaymentMethodForOrder === 'myzaka') ? currentPhoneNumberForOrder : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.paymentUrl) {
        if (currentPaymentMethodForOrder === 'paypal') {
          window.location.href = res.data.paymentUrl;
        } else {
          // For mock payments, backend serves a mock page. Ensure API_BASE_URL is part of this if needed.
          window.location.href = res.data.paymentUrl.startsWith('http') ? res.data.paymentUrl : `${API_BASE_URL}${res.data.paymentUrl}`;
        }
      } else {
        alert('Payment initiated, but an issue occurred with redirect. Check orders or contact support.');
        fetchOrders(pagination.page); // Refresh to show any status updates
      }
    } catch (err) {
      console.error('Pay Now Error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || 'Failed to initiate payment. The artwork might no longer be available.';
      alert(errorMessage);
      fetchOrders(pagination.page); // Refresh in case status changed
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this order? This cannot be undone.');
    if (!confirmCancel) return;
    setLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Order cancelled successfully.');
      fetchOrders(pagination.page); 
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
      setPagination(prev => ({ ...prev, page: newPage }));
      // fetchOrders will be called by its useEffect due to pagination.page change
    }
  };
  
  const toggleShowCancelled = () => {
    setPagination(prev => ({ ...prev, page: 1 })); 
    setShowCancelled(prevShowCancelled => !prevShowCancelled);
    // fetchOrders will be triggered by useEffect due to showCancelled change in fetchOrders' deps
  };

  const formatter = new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP' });

  if (loading && orders.length === 0) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', fontSize: '1.5rem', color: '#ff6200' }}>
      Loading your orders...
    </div>
  );

  if (error && !loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', fontSize: '1.5rem', color: '#d00000', textAlign: 'center' }}>
      Error: {error}
    </div>
  );
  
  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem 1rem', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ff6200', marginBottom: '1.5rem', textAlign: 'center' }}>
        Your Orders
      </h1>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={toggleShowCancelled}
          style={{ padding: '0.6rem 1.2rem', backgroundColor: showCancelled ? '#6c757d' : '#ff6200', color: 'white', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.3s' }}
        >
          {showCancelled ? 'Hide Cancelled Orders' : 'Show Cancelled Orders'}
        </button>
      </div>

      {orders.length === 0 && !loading && (
         <div style={{textAlign: 'center', padding: '2rem', color: '#555'}}>
            <p style={{fontSize: '1.2rem'}}>
                {showCancelled ? "No orders to display (including potentially cancelled ones)." : "You have no active orders at the moment."}
            </p>
            <Link to="/artworks" style={{color: '#ff6200', textDecoration: 'underline', fontWeight: 'bold'}}>Browse Artworks</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {orders.map(order => {
          // Destructure all statuses from the processed order object
          const { 
            order_id, 
            artwork_id, 
            artwork_title, 
            price,
            created_at,
            image_url,
            order_status,           // This is from order.order_status (or order.status)
            payment_status,         // This is from order.payment_status
            artwork_current_status, // This is from order.artwork_current_status
            payment_method          // This is from order.payment_method
          } = order;

          // Use payment details from the separate 'payments' state if it provides more detail than order object
          // For button logic, we primarily use the statuses directly from the 'order' object.
          const detailedPaymentInfo = payments[order_id] || {}; 

          const canPay = payment_status !== 'completed' && 
                         order_status !== 'cancelled' && 
                         artwork_current_status !== 'sold';

          const canCancel = order_status !== 'cancelled' && 
                            order_status !== 'completed'; 

          const isVisuallyInactive = order_status === 'cancelled' || (artwork_current_status === 'sold' && payment_status !== 'completed');
          const cardOpacity = isVisuallyInactive ? 0.65 : 1;
          
          let borderColor = 'orange'; // Default for pending
          if (payment_status === 'completed' && order_status === 'completed') {
            borderColor = 'green'; // Successfully completed and paid
          } else if (order_status === 'cancelled') {
            borderColor = 'red'; // Order explicitly cancelled
          } else if (artwork_current_status === 'sold' && payment_status !== 'completed') {
            borderColor = 'purple'; // Artwork sold, but this order's payment isn't complete (e.g. pending/failed)
          }


          return (
            <div key={order_id} style={{
              backgroundColor: '#f9f9f9', borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)', padding: '1.5rem',
              opacity: cardOpacity,
              borderLeft: `5px solid ${borderColor}`
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <Link to={`/artworks/${artwork_id}`}>
                  <img
                    src={image_url && !image_url.endsWith('placeholder.jpg') ? `${API_BASE_URL}${image_url}` : '/placeholder.jpg'}
                    alt={artwork_title || 'Artwork'}
                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    onError={e => { e.target.src = '/placeholder.jpg'; }}
                  />
                </Link>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6200', marginBottom: '0.5rem' }}>
                    {artwork_title || 'Artwork Title Unavailable'}
                  </h3>
                  <p>Order ID: {order_id}</p>
                  <p>Date: {new Date(created_at).toLocaleDateString()}</p>
                  <p>Price: {formatter.format(price)}</p>
                  <p>Order Status: <span style={{fontWeight: 'bold', textTransform: 'capitalize', color: order_status === 'cancelled' ? 'red' : (order_status === 'completed' ? 'green' : 'inherit')}}>{order_status}</span></p>
                  <p>Payment: <span style={{fontWeight: 'bold', textTransform: 'capitalize', color: payment_status === 'completed' ? 'green' : (order_status === 'cancelled' && payment_status !== 'completed' ? 'red' : 'orange')}}>{payment_status}{payment_method ? ` via ${payment_method.replace('_', ' ').toUpperCase()}` : ''}</span></p>
                  
                  {artwork_current_status === 'sold' && payment_status !== 'completed' && order_status !== 'cancelled' && (
                    <p style={{color: 'purple', fontWeight: 'bold', marginTop: '0.5rem'}}>Note: This artwork is sold (payment for this order is {payment_status}).</p>
                  )}
                   {artwork_current_status === 'sold' && payment_status === 'completed' && order_status === 'completed' && (
                    <p style={{color: 'green', fontWeight: 'bold', marginTop: '0.5rem'}}>Artwork successfully purchased & paid.</p>
                  )}

                  {canPay && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                      <h4 style={{marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem', fontWeight: '600'}}>Complete Your Payment:</h4>
                      <select
                        value={paymentMethodStates[order_id] || 'paypal'}
                        onChange={e => handlePaymentMethodChange(order_id, e.target.value)}
                        style={{ padding: '0.5rem', marginRight: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '0.5rem' }}
                      >
                        <option value="paypal">PayPal</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="myzaka">MyZaka</option>
                      </select>
                      {((paymentMethodStates[order_id] || 'paypal') === 'orange_money' || (paymentMethodStates[order_id] || 'paypal') === 'myzaka') && (
                        <input
                          type="tel"
                          placeholder="Phone Number (+267...)"
                          value={phoneNumberStates[order_id] || ''}
                          onChange={e => handlePhoneNumberChange(order_id, e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '0.5rem' }}
                        />
                      )}
                      <button
                        onClick={() => handlePayNow(order_id, price, artwork_current_status)} // Pass artwork_current_status
                        disabled={loading}
                        style={{ padding: '0.6rem 1.2rem', backgroundColor: loading ? '#ccc' : '#ff6200', color: 'white', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}
                      >
                        {loading ? 'Processing...' : 'Pay Now'}
                      </button>
                    </div>
                  )}
                  
                  {canCancel && (
                     <button
                        onClick={() => handleCancelOrder(order_id)}
                        disabled={loading}
                        style={{ padding: '0.6rem 1.2rem', backgroundColor: loading ? '#ccc' : '#d00000', color: 'white', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', width: '100%' }}
                      >
                        {loading ? 'Processing...' : 'Cancel Order'}
                      </button>
                  )}
                  
                  <Link
                    to={`/artworks/${artwork_id}`}
                    style={{ fontSize: '0.9rem', color: '#4a7289', textDecoration: 'underline', fontWeight: '600', display: 'inline-block', marginTop: '1rem' }}
                  >
                    View Artwork Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            style={{ padding: '0.5rem 1.5rem', backgroundColor: (pagination.page === 1 || loading) ? '#e0e0e0' : '#ff6200', color: (pagination.page === 1 || loading) ? '#6b7280' : 'white', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: (pagination.page === 1 || loading) ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span style={{ fontWeight: 'bold'}}>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            style={{ padding: '0.5rem 1.5rem', backgroundColor: (pagination.page === pagination.totalPages || loading) ? '#e0e0e0' : '#ff6200', color: (pagination.page === pagination.totalPages || loading) ? '#6b7280' : 'white', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: (pagination.page === pagination.totalPages || loading) ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Orders;