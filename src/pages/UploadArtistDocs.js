import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function UploadArtistDocs() {
  const [proofOfWork, setProofOfWork] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofOfWork) {
      setError('Upload a portfolio file');
      return;
    }
    const formData = new FormData();
    formData.append('proofOfWork', proofOfWork);
    try {
      await axios.post('http://localhost:3000/api/upload-artist-docs', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    }
  };

  return (
    <div className="container">
      <h1>Upload Portfolio</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setProofOfWork(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default UploadArtistDocs;