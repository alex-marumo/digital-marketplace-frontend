import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddArtworkPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category_id: '', image: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    try {
      await axios.post('http://localhost:3000/api/artworks', data);
      navigate('/artwork-management');
    } catch (error) {
      console.error('Error adding artwork:', error);
    }
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>Add Artwork</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div className="form-group">
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div className="form-group">
          <input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Category ID" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} />
        </div>
        <div className="form-group">
          <input type="file" onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })} />
        </div>
        <button type="submit" className="button">Add Artwork</button>
      </form>
    </div>
  );
}

export default AddArtworkPage;