import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/orders?page=${page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
      setLoading(false);
    } catch (err) {
      console.error('Fetch orders error:', {
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

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  if (loading) return <div className="container mx-auto p-4">Loading your orders, hold tight...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">Oops: {error}</div>;
  if (orders.length === 0) return <div className="container mx-auto p-4">No orders yet, fam. Go get yourself some art! 🎨</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.order_id} className="p-4 border rounded shadow">
            <h3 className="text-lg font-semibold">{order.artwork_title}</h3>
            <p>Price: ${order.price.toFixed(2)}</p>
            <p>Status: {order.status}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Orders;