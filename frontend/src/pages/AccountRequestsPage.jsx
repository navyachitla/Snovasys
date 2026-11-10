import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import Topbar from '../components/Topbar';

export default function AccountRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [requestedType, setRequestedType] = useState('PERSONAL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequests = () => {
    apiRequest('/api/account-requests')
      .then((data) => setRequests(data.requests || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiRequest('/api/account-requests', {
        method: 'POST',
        body: { requestedType },
      });
      setSuccess('Account opening request submitted! An administrator will review and assign your account number.');
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Account Onboarding" />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Account Onboarding Requests</h1>
          <p className="page-subtitle">Request a new verified Personal or Business account. Administrator review required.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Submission Form */}
          <div className="form-panel" style={{ margin: 0, maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Request New Account</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select
                  className="form-select"
                  value={requestedType}
                  onChange={(e) => setRequestedType(e.target.value)}
                >
                  <option value="PERSONAL">Personal Account (INR)</option>
                  <option value="BUSINESS">Business Account (INR)</option>
                </select>
                <div className="form-help">
                  Personal accounts are for everyday transfers. Business accounts support higher volume operations.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Request for Approval'}
              </button>
            </form>
          </div>

          {/* Existing Requests Table */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Your Request History</h2>
            {loading ? (
              <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading history...</div>
            ) : requests.length === 0 ? (
              <div className="table-container" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No onboarding requests submitted yet.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Requested Type</th>
                      <th>Status</th>
                      <th>Reviewer Notes</th>
                      <th>Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td><span className="badge">{r.requestedType}</span></td>
                        <td>
                          <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                        </td>
                        <td style={{ color: r.adminNote ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {r.adminNote || 'Awaiting administrator review'}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
