import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddArtwork() {
  const { token } = useAuth();
  const navigate = useNavigate(); // Renamed for clarity
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category_id: '', image: null });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    axios.get('/api/categories').then(res => setCategories(res.data)).catch(err => {
      console.error('Fetch categories error:', err.message);
      setError('Failed to load categories');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'category_id') {
        data.append(key, parseInt(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });
    try {
      const response = await axios.post('/api/artworks', data, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Artwork added successfully:', response.data);
      setSuccess('Artwork added successfully!');
      setTimeout(() => navigate('/dashboard'), 1000); // Delay for user to see success
    } catch (err) {
      console.error('Submit artwork error:', {
        status: err.response?.status,
        message: err.response?.data?.error,
        details: err.response?.data?.details,
        rawError: err.message,
        stack: err.stack,
      });
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to add artwork');
    }
  };

  return (
    <div className="container">
      <style>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
          box-sizing: border-box;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #f28c38;
          box-shadow: 0 0 5px rgba(242, 140, 56, 0.3);
        }
        .select {
          appearance: none;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="%23666" d="M2 4l4 4 4-4z"/></svg>') no-repeat right 10px center;
          background-color: #fff;
          cursor: pointer;
        }
        .select:hover {
          border-color: #f28c38;
        }
        .button {
          display: block;
          width: 100%;
          padding: 12px;
          background: #f28c38;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          text-align: center;
        }
        .button:hover {
          background: #e07b30;
        }
        .error {
          color: red;
          margin-bottom: 15px;
          font-size: 14px;
        }
        .success {
          color: green;
          margin-bottom: 15px;
          font-size: 14px;
        }
      `}</style>
      <h1>Add New Artwork</h1>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Title"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Price"
          />
        </div>
        <div className="form-group">
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
          />
        </div>
        <div className="form-group">
          <select
            className="select"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="button">Add Artwork</button>
      </form>
    </div>
  );
}

export default AddArtwork;