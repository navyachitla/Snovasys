import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import Topbar from '../components/Topbar';

export default function AdminOnboardingPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountNumbers, setAccountNumbers] = useState({});
  const [rejectNotes, setRejectNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchQueue = () => {
    apiRequest('/api/account-requests/admin/queue')
      .then((data) => setQueue(data.requests || []))
      .catch((err) => setError(err.message || 'Failed to fetch queue'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (request) => {
    const accNum = accountNumbers[request.id]?.trim();
    if (!accNum) {
      setError(`Please enter an account number for ${request.userFullName}`);
      return;
    }

    setError('');
    setSuccess('');
    setProcessingId(request.id);

    try {
      await apiRequest(`/api/account-requests/admin/${request.id}/approve`, {
        method: 'POST',
        body: { accountNumber: accNum },
      });
      setSuccess(`Account approved successfully! Assigned ${accNum} to ${request.userFullName}.`);
      fetchQueue();
    } catch (err) {
      setError(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    setError('');
    setSuccess('');
    setProcessingId(request.id);

    try {
      await apiRequest(`/api/account-requests/admin/${request.id}/reject`, {
        method: 'POST',
        body: { note: rejectNotes[request.id] || 'Declined during administrative review' },
      });
      setSuccess(`Account request for ${request.userFullName} rejected.`);
      fetchQueue();
    } catch (err) {
      setError(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Onboarding Queue" />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Onboarding Review Queue</h1>
          <p className="page-subtitle">Review new account requests, perform compliance verification, and assign official account numbers.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading onboarding queue...</div>
        ) : queue.length === 0 ? (
          <div className="table-container" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
            <p style={{ color: 'var(--text-secondary)' }}>All account requests have been reviewed. The onboarding queue is empty.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Requested Type</th>
                  <th>Submitted At</th>
                  <th>Assign Account Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.userFullName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{req.userEmail}</td>
                    <td><span className="badge">{req.requestedType}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.85rem', width: '180px' }}
                        placeholder="e.g. BV-2026-001"
                        value={accountNumbers[req.id] || ''}
                        onChange={(e) => setAccountNumbers({ ...accountNumbers, [req.id]: e.target.value })}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApprove(req)}
                          className="btn btn-primary btn-sm"
                          disabled={processingId === req.id}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="btn btn-danger btn-sm"
                          disabled={processingId === req.id}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
