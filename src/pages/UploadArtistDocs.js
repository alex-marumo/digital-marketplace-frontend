import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';

function UploadArtistDocs() {
  const [idDocument, setIdDocument] = useState(null);
  const [proofOfWork, setProofOfWork] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [error, setError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading Face-API.js models...');
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        console.log('Models loaded successfully');
        setModelsLoaded(true);
      } catch (err) {
        console.error('Model loading failed:', err);
        setError('Face recognition setup failed—proceed without it');
      }
    };
    loadModels();
  }, []);

  const verifyFaceMatch = async () => {
    if (!modelsLoaded) {
      console.warn('Models not loaded—skipping face match');
      return true;
    }
    if (!idDocument || !selfie) return true;

    try {
      const idImg = await faceapi.fetchImage(URL.createObjectURL(idDocument));
      const selfieImg = await faceapi.fetchImage(URL.createObjectURL(selfie));
      
      const idDetection = await faceapi.detectSingleFace(idImg).withFaceLandmarks().withFaceDescriptor();
      const selfieDetection = await faceapi.detectSingleFace(selfieImg).withFaceLandmarks().withFaceDescriptor();
      
      if (!idDetection || !selfieDetection) {
        setError('Couldn’t detect face in ID or selfie');
        return false;
      }
      
      const distance = faceapi.euclideanDistance(idDetection.descriptor, selfieDetection.descriptor);
      console.log('Face match distance:', distance);
      return distance < 0.6;
    } catch (err) {
      console.error('Face match error:', err);
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
      if (!faceMatch) {
        setError('Face verification failed—ID and selfie don’t match');
        return;
      }
    }

    const formData = new FormData();
    formData.append('idDocument', idDocument);
    formData.append('proofOfWork', proofOfWork);
    if (selfie) formData.append('selfie', selfie);

    try {
      const response = await axios.post('http://localhost:3000/api/upload-artist-docs', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response.data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Upload error:', err.response?.data);
      setError(err.response?.data?.error || 'Upload failed—try again');
    }
  };

  return (
    <div className="container">
      <h1>Become an Artist</h1>
      <p>Submit your ID and portfolio for admin review.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>ID Document (PDF/JPG/PNG):</label>
          <input
            type="file"
            onChange={(e) => setIdDocument(e.target.files[0])}
            accept=".pdf,.jpg,.jpeg,.png"
            required
          />
        </div>
        <div>
          <label>Portfolio (PDF/JPG/PNG):</label>
          <input
            type="file"
            onChange={(e) => setProofOfWork(e.target.files[0])}
            accept=".pdf,.jpg,.jpeg,.png"
            required
          />
        </div>
        <div>
          <label>Selfie (Optional - JPG/PNG):</label>
          <input
            type="file"
            onChange={(e) => setSelfie(e.target.files[0])}
            accept=".jpg,.jpeg,.png"
          />
          <small>For face verification—optional for now.</small>
        </div>
        <button type="submit" disabled={!modelsLoaded && selfie}>
          Submit for Review
        </button>
      </form>
    </div>
  );
}

export default UploadArtistDocs;