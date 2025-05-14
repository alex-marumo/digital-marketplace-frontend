import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function EditArtwork() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const parsedId = parseInt(id, 10);

  // Fetch artwork and categories
  useEffect(() => {
    if (isNaN(parsedId)) {
      setError('Invalid artwork ID');
      setLoading(false);
      return <div style={{ color: '#d00000' }}>Error: Invalid artwork ID</div>;
    }
    console.log('🎨 Fetching artwork:', { id, token: token ? 'present' : 'missing' });
    const fetchData = async () => {
      try {
        // Fetch artwork
        const artworkRes = await axios.get(`${API_BASE_URL}/api/artworks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ Artwork fetched:', artworkRes.data);
        setFormData({
          title: artworkRes.data.title || '',
          description: artworkRes.data.description || '',
          price: artworkRes.data.price || '',
          category_id: artworkRes.data.category_id || '',
          image: null,
        });

        // Fetch categories
        const categoriesRes = await axios.get(`${API_BASE_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ Categories fetched:', categoriesRes.data);
        setCategories(categoriesRes.data);

        setLoading(false);
      } catch (err) {
        console.error('❌ Fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to load artwork or categories');
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('🚀 Updating artwork:', { id, formData });

    try {
      // Upload image if present
      let imageUrl = null;
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.image);
        const uploadRes = await axios.post(`${API_BASE_URL}/api/upload`, imageFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        imageUrl = uploadRes.data.image_url;
        console.log('✅ Image uploaded:', imageUrl);
      }

      // Prepare payload
      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
      };

      // Update artwork
      const response = await axios.put(
        `${API_BASE_URL}/api/artworks/${parsedId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } });
      console.log('✅ Update success:', response.data);

      // Update image if uploaded
      if (imageUrl) {
        await axios.post(
          `${API_BASE_URL}/api/artwork-images`,
          { artwork_id: id, image_path: imageUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Image path saved');
      }

      alert('Artwork updated! 🎉');
      navigate('/artworks');
    } catch (err) {
      console.error('❌ Update error:', {
        status: err.response?.status,
        message: err.response?.data?.error || err.message,
      });
      setError(err.response?.data?.error || 'Failed to update artwork');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: '#d00000' }}>Error: {error}</div>;

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1 style={{ color: '#ff6200', fontWeight: '800' }}>Edit Artwork</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Title"
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', minHeight: '100px' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Price (BWP)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Price"
            required
            step="0.01"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Category</label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Upload New Image (optional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading ? '#6b7280' : '#ff6200',
            color: '#f4f1de',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Updating...' : 'Update Artwork'}
        </button>
        {error && <p style={{ color: '#d00000', marginTop: '1rem' }}>{error}</p>}
      </form>
    </div>
  );
}

export default EditArtwork;