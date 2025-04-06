import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function EditArtwork() {
  const { id } = useParams();
  const { token } = useAuth();
  const history = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category: '', image: null });

  useEffect(() => {
    axios.get(`/api/artwork/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setFormData(res.data));
  }, [id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    await axios.put(`/api/artwork/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
    history.push('/dashboard');
  };

  return (
    <div className="container">
      <h1>Edit Artwork</h1>
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
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Category"
          />
        </div>
        <div className="form-group">
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
          />
        </div>
        <button type="submit" className="button">Update Artwork</button>
      </form>
    </div>
  );
}

export default EditArtwork;