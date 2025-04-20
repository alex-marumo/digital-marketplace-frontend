import React, { useState, useEffect, Suspense, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function AdminPanel() {
  const { authenticated, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [docError, setDocError] = useState(null);
  const [docType, setDocType] = useState('image');
  const [signedUrl, setSignedUrl] = useState(null);

  console.log('AdminPanel mounted:', { authenticated, role: user?.role, status: user?.status, user });

  const fetchRequests = useCallback(async () => {
    if (!user || !authenticated || user?.role !== 'admin') {
      setError('Unauthorized: Admin access required.');
      console.log('Not admin, skipping fetch:', { authenticated, role: user?.role });
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching requests with token:', token?.slice(0, 20) + '...');
      const response = await axios.get('http://localhost:3001/api/admin/artist-requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched requests:', response.data);
      setRequests(response.data);
      if (response.data.length === 0) {
        setError('No pending requests found. Check backend logs.');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Failed to load requests: ' + (err.response?.data?.error || err.message));
      console.error('Fetch error:', err);
    }
  }, [user, authenticated]);

  useEffect(() => {
    console.log('useEffect triggered:', { authenticated, role: user?.role });
    fetchRequests();
  }, [user, authenticated, fetchRequests]);

  const viewDocument = async (requestId, docType) => {
    setSelectedRequest(requestId);
    setSelectedDocType(docType);
    setRejectionReason('');
    setDocError(null);
    setSignedUrl(null);
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    
    try {
      if (!token) throw new Error('No access token found');
      
      // Fetch signed URL
      const signedUrlResponse = await axios.get(
        `http://localhost:3000/api/admin/artist-requests/${requestId}/file/${docType}/signed-url`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { signedUrl } = signedUrlResponse.data;
      setSignedUrl(signedUrl);
      
      // For simplicity, assume it's an image
      setDocType('image');
    } catch (err) {
      console.error('Error fetching signed URL:', err);
      setDocError('Failed to load document. Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, status) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `http://localhost:3001/api/admin/artist-requests/${requestId}/review`,
        { status, rejection_reason: status === 'rejected' ? rejectionReason : null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedRequest(null);
      setSelectedDocType(null);
      setRejectionReason('');
      setDocError(null);
      setSignedUrl(null);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Review failed');
      console.error('Review error:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setSelectedDocType(null);
    setRejectionReason('');
    setDocError(null);
    setSignedUrl(null);
  };

  console.log('Rendering AdminPanel:', { requests, error, authenticated, role: user?.role });

  return (
    <Suspense fallback={<div>Loading admin panel...</div>}>
      <div className="admin-panel" style={{ minHeight: '200px', backgroundColor: '#f0f0f0', border: '2px solid red' }}>
        <h1>Admin Artist Request Review</h1>
        <p>Debug: User role: {user?.role || 'none'}, Authenticated: {authenticated.toString()}, Status: {user?.status || 'none'}</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <p>Loading...</p>}
        {requests.length === 0 && !error && <p>No pending requests available. Check backend logs for artist_requests.</p>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.request_id}>
                <td>{req.name || 'N/A'}</td>
                <td>{req.email || 'N/A'}</td>
                <td>{req.requested_at ? new Date(req.requested_at).toLocaleDateString() : 'N/A'}</td>
                <td>
                  {req.id_document_path && (
                    <button onClick={() => viewDocument(req.request_id, 'id_document')}>
                      View ID
                    </button>
                  )}
                  {req.proof_of_work_path && (
                    <button onClick={() => viewDocument(req.request_id, 'proof_of_work')}>
                      View Work
                    </button>
                  )}
                  {req.selfie_path && (
                    <button onClick={() => viewDocument(req.request_id, 'selfie')}>
                      View Selfie
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedRequest && selectedDocType && (
          <div className="review-modal">
            <h2>Review {selectedDocType.replace('_', ' ')}</h2>
            {loading && <p>Loading document...</p>}
            {docError ? (
              <p style={{ color: 'red' }}>
                {docError}
              </p>
            ) : (
              <>
                {signedUrl && docType === 'image' && (
                  <img
                  src={signedUrl}
                  alt="Document Preview"
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  onError={(e) => {
                    console.error('Image load error:', e);
                    setDocError('Unable to load image.');
                    }}
                    />
                  )
                }
                {signedUrl && (
                  <p>
                    <a
                      href={signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download {selectedDocType.replace('_', ' ')}
                    </a>
                  </p>
                )}
              </>
            )}
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (required if rejecting)"
              style={{ width: '100%', height: '100px', margin: '10px 0' }}
            />
            <button
              onClick={() => handleReview(selectedRequest, 'approved')}
              disabled={loading}
            >
              Approve
            </button>
            <button
              onClick={() => handleReview(selectedRequest, 'rejected')}
              disabled={loading || !rejectionReason.trim()}
            >
              Reject
            </button>
            <button
              onClick={closeModal}
              disabled={loading}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Suspense>
  );
}

export default AdminPanel;