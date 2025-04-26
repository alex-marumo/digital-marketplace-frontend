import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AdminPanel.module.css';

function AdminPanel() {
  const { authenticated, user, token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [docError, setDocError] = useState(null);
  const [signedUrl, setSignedUrl] = useState(null);

  console.log('🔐 AdminPanel loaded:', {
    authenticated,
    user,
    token: token ? '✅ present' : '❌ missing',
    role: user?.role
  });

  const fetchRequests = useCallback(async () => {
    if (!token || !user || !authenticated || user?.role !== 'admin') {
      setError('Unauthorized: Admin access required.');
      console.warn('❌ Fetch blocked: Not admin or missing token.');
      return;
    }

    try {
      console.log('📡 Fetching artist requests...');
      const response = await axios.get('http://localhost:3000/api/admin/artist-requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
      setError(response.data.length === 0 ? 'No pending requests found.' : null);
      console.log('✅ Requests received:', response.data.length);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have permission to access this resource.');
      } else {
        setError('Failed to load requests.');
      }
      console.error('❌ Fetch error:', err.message);
    }
  }, [user, authenticated, token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const viewDocument = async (requestId, docType) => {
    setSelectedRequest(requestId);
    setSelectedDocType(docType);
    setRejectionReason('');
    setDocError(null);
    setSignedUrl(null);
    setLoading(true);

    try {
      const signedUrlResponse = await axios.get(
        `http://localhost:3000/api/admin/artist-requests/${requestId}/file/${docType}/signed-url`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSignedUrl(signedUrlResponse.data.signedUrl);
    } catch (err) {
      console.error('❌ Error fetching signed URL:', err.message);
      setDocError('Failed to load document.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, status) => {
  if (status === 'rejected' && !rejectionReason.trim()) {
    setError('Rejection reason is required.');
    return;
  }
  setLoading(true);
  try {
    const payload = { status, rejection_reason: status === 'rejected' ? rejectionReason : null };
    console.log('📤 Sending review:', { requestId, payload });
    const response = await axios.post(
      `http://localhost:3000/api/admin/artist-requests/${requestId}/review`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Review response:', response.data);
    closeModal();
    fetchRequests();
  } catch (err) {
    const errorMessage = err.response?.data?.details || err.response?.data?.error || 'Review failed. Check server logs.';
    setError(errorMessage);
    console.error('❌ Review error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      requestId,
      status,
    });
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

  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedRequest && selectedDocType) {
        viewDocument(selectedRequest, selectedDocType);
      }
    }, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(timer);
  }, [selectedRequest, selectedDocType]);

  return (
    <div className={styles.adminPanel}>
      <h1 className={styles.title}>Admin Artist Request Review</h1>
      <p className={styles.debugInfo}>
        User role: {user?.role || 'none'}, Authenticated: {authenticated.toString()}, Status: {user?.status || 'none'}
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.loading}>Loading...</p>}

      {requests.length === 0 && !error ? (
        <p className={styles.error}>No pending requests available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={styles.table}>
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
                      <button onClick={() => viewDocument(req.request_id, 'id_document')} className={styles.tableButton}>
                        View ID
                      </button>
                    )}
                    {req.proof_of_work_path && (
                      <button onClick={() => viewDocument(req.request_id, 'proof_of_work')} className={styles.tableButton}>
                        View Work
                      </button>
                    )}
                    {req.selfie_path && (
                      <button onClick={() => viewDocument(req.request_id, 'selfie')} className={styles.tableButton}>
                        View Selfie
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequest && selectedDocType && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              Review {selectedDocType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </h2>

            {loading && <p className={styles.loading}>Loading document...</p>}
            {docError ? (
              <p className={styles.error}>{docError}</p>
            ) : (
              signedUrl && (
                <>
                  <img
                    src={signedUrl}
                    alt={`${selectedDocType} Preview`}
                    className={styles.modalImage}
                    onError={() => setDocError('Unable to load image.')}
                  />
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer" className={styles.modalLink}>
                    Download {selectedDocType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </a>
                </>
              )
            )}

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (required if rejecting)"
              className={styles.modalTextarea}
            />
            <div className="flex gap-4">
              <button
                onClick={() => handleReview(selectedRequest, 'approved')}
                className={`${styles.modalButton} ${styles.modalButtonApprove}`}
                disabled={loading}
              >
                Approve
              </button>
              <button
                onClick={() => handleReview(selectedRequest, 'rejected')}
                className={`${styles.modalButton} ${styles.modalButtonReject}`}
                disabled={loading || !rejectionReason.trim()}
              >
                Reject
              </button>
              <button
                onClick={closeModal}
                className={`${styles.modalButton} ${styles.modalButtonClose}`}
                disabled={loading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
