import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Sales() {
  const { token } = useAuth();
  const [sales, setSales] = useState([]);

  useEffect(() => {
    axios.get('/api/sales', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setSales(res.data));
  }, [token]);

  return (
    <div className="container">
      <h1>Your Sales</h1>
      {sales.map((sale) => (
        <div key={sale.id} className="card">
          <div className="card-content">
            <h3>{sale.artworkTitle}</h3>
            <p>Price: ${sale.price}</p>
            <p>Buyer: {sale.buyer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Sales;