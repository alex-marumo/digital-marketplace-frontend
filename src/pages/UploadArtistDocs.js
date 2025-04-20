import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';

function UploadArtistDocs() {
  const [idDocument, setIdDocument] = useState(null);
  const [proofOfWork, setProofOfWork] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [error, setError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        setError('Face recognition setup failed—proceeding without it');
      }
    };
    loadModels();
  }, []);

  const verifyFaceMatch = async () => {
    if (!modelsLoaded || !idDocument || !selfie) return true;
    try {
      const idImg = await faceapi.fetchImage(URL.createObjectURL(idDocument));
      const selfieImg = await faceapi.fetchImage(URL.createObjectURL(selfie));

      const idDetection = await faceapi
        .detectSingleFace(idImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const selfieDetection = await faceapi
        .detectSingleFace(selfieImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!idDetection || !selfieDetection) {
        setError('Couldn’t detect face in ID or selfie');
        return false;
      }

      const distance = faceapi.euclideanDistance(
        idDetection.descriptor,
        selfieDetection.descriptor
      );
      return distance < 0.6;
    } catch (err) {
      setError('Face verification failed—check files and try again');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idDocument || !proofOfWork) {
      setError('ID document and portfolio are required');
      return;
    }

    if (selfie) {
      const faceMatch = await verifyFaceMatch();
      if (!faceMatch) return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('idDocument', idDocument);
      formData.append('proofOfWork', proofOfWork);
      if (selfie) formData.append('selfie', selfie);

      const res = await axios.post('http://localhost:3000/api/upload-artist-docs', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const userRes = await axios.get('http://localhost:3000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(userRes.data);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
    }
  };

  return (
    <div className="container">
      <h1>Become an Artist</h1>
      <p className="text-center">Submit your ID and portfolio for admin review.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID Document (PDF/JPG/PNG):</label>
          <input
            type="file"
            onChange={(e) => setIdDocument(e.target.files[0])}
            accept=".pdf,.jpg,.jpeg,.png"
            required
          />
        </div>
        <div className="form-group">
          <label>Portfolio (PDF/JPG/PNG):</label>
          <input
            type="file"
            onChange={(e) => setProofOfWork(e.target.files[0])}
            accept=".pdf,.jpg,.jpeg,.png"
            required
          />
        </div>
        <div className="form-group">
          <label>Selfie (Optional - JPG/PNG):</label>
          <input
            type="file"
            onChange={(e) => setSelfie(e.target.files[0])}
            accept=".jpg,.jpeg,.png"
          />
          <small>For face verification—optional for now.</small>
        </div>
        <button className="button" type="submit" disabled={!modelsLoaded && selfie}>
          Submit for Review
        </button>
      </form>
    </div>
  );
}

export default UploadArtistDocs;