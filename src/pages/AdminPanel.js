import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const { authenticated, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticated || user?.role !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchRequests();
    }
  }, [authenticated, user, navigate]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/artist-requests/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setRequests(response.data);
    } catch (err) {
      setError('Failed to load requests');
      console.error('Fetch error:', err);
    }
  };

  const viewDocument = (requestId, docType) => {
    setSelectedRequest(requestId);
    setSelectedDocType(docType);
    setRejectionReason('');
  };

  const handleReview = async (requestId, status) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `http://localhost:3000/api/admin/artist-requests/${requestId}/review`,
        { status, rejection_reason: status === 'rejected' ? rejectionReason : null },
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      setSelectedRequest(null);
      setSelectedDocType(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Review failed');
      console.error('Review error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Artist Request Review</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
              <td>{req.name}</td>
              <td>{req.email}</td>
              <td>{new Date(req.requested_at).toLocaleDateString()}</td>
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
          <iframe
            src={`http://localhost:3000/api/admin/artist-requests/${selectedRequest}/file/${selectedDocType}`}
            title="Document Preview"
            style={{ width: '100%', height: '500px' }}
          />
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
            onClick={() => {
              setSelectedRequest(null);
              setSelectedDocType(null);
              setRejectionReason('');
            }}
            disabled={loading}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;