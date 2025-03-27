import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function OrdersListPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3000/api/orders')
      .then(response => setOrders(response.data))
      .catch(error => console.error('Error fetching orders:', error));
  }, []);

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>My Orders</h2>
      <div>
        {orders.map(order => (
          <div key={order.order_id} className="card">
            <div>
              <p>Order #{order.order_id}</p>
              <p>Status: {order.status}</p>
              <Link to={`/order-tracking/${order.order_id}`} className="text-blue">View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrdersListPage;