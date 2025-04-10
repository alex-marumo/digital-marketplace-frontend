import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data));
  }, [token]);

  return (
    <div className="container">
      <h1>Your Orders</h1>
      {orders.map((order) => (
        <div key={order.id} className="card">
          <div className="card-content">
            <h3>{order.artworkTitle}</h3>
            <p>Price: ${order.price}</p>
            <p>Status: {order.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Orders;