import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function RequestArtist() {
  const { authenticated, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    idDocument: null,
    proofOfWork: null,
    selfie: null
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authenticated || user?.role !== 'artist' || user?.status !== 'pending_verification') {
      setError('You need to select the artist role first');
      return;
    }

    if (!formData.idDocument || !formData.proofOfWork) {
      setError('ID document and proof of work are required');
      return;
    }

    const data = new FormData();
    data.append('idDocument', formData.idDocument);
    data.append('proofOfWork', formData.proofOfWork);
    if (formData.selfie) data.append('selfie', formData.selfie);

    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/upload-artist-docs', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Apply to Become an Artist</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID Document (PDF, JPG, PNG)</label>
          <input
            type="file"
            name="idDocument"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
        </div>
        <div className="form-group">
          <label>Proof of Work (PDF, JPG, PNG)</label>
          <input
            type="file"
            name="proofOfWork"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
        </div>
        <div className="form-group">
          <label>Selfie (Optional, JPG, PNG)</label>
          <input
            type="file"
            name="selfie"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
        </div>
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Uploading...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}

export default RequestArtist;