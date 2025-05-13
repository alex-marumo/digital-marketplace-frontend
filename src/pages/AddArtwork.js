import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddArtwork() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category_id: '', image: null });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories with token:', token ? 'present' : 'missing');
        const response = await axios.get('http://localhost:3000/api/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Categories fetched:', response.data);
        setCategories(response.data);
      } catch (err) {
        console.error('Fetch categories error:', {
          status: err.response?.status,
          message: err.response?.data?.error,
          details: err.response?.data?.details,
          rawError: err.message
        });
        setError('Failed to load categories. Please try again.');
      }
    };
    if (token) fetchCategories();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!token) {
      setError('You must be logged in to add artwork.');
      setTimeout(() => navigate('/login-register'), 1000);
      return;
    }
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'category_id') {
        data.append(key, parseInt(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });
    try {
      const response = await axios.post('http://localhost:3000/api/artworks', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Artwork added successfully:', response.data);
      setSuccess('Artwork added successfully!');
      setTimeout(() => navigate('/dashboard'), 1000);
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
          background-color: #f4f1de;
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
          border-color: #ff6200;
          box-shadow: 0 0 5px rgba(255, 98, 0, 0.3);
        }
        .select {
          appearance: none;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="%23666" d="M2 4l4 4 4-4z"/></svg>') no-repeat right 10px center;
          background-color: #fff;
          cursor: pointer;
        }
        .select:hover {
          border-color: #ff6200;
        }
        .button {
          display: block;
          width: 100%;
          padding: 12px;
          background: #ff6200;
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
        h1 {
          color: #ff6200;
          text-align: center;
          margin-bottom: 20px;
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
            required
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
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            required
          />
        </div>
        <div className="form-group">
          <select
            className="select"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            required
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