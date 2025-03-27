import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function EditArtworkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category_id: '' });

  useEffect(() => {
    axios.get(`http://localhost:3000/api/artworks/${id}`)
      .then(response => setFormData(response.data))
      .catch(error => console.error('Error fetching artwork:', error));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/artworks/${id}`, formData);
      navigate('/artwork-management');
    } catch (error) {
      console.error('Error updating artwork:', error);
    }
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>Edit Artwork</h2>
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
        <button type="submit" className="button">Update Artwork</button>
      </form>
    </div>
  );
}

export default EditArtworkPage;