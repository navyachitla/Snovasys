import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import Topbar from '../components/Topbar';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = (p = 1) => {
    setLoading(true);
    apiRequest(`/api/audit?page=${p}&perPage=25`)
      .then((data) => {
        setLogs(data.logs || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAuditLogs(page);
  }, [page]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Audit Trail" />
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Security & Ledger Audit Trail</h1>
            <p className="page-subtitle">
              Immutable chronological log of all security events, permission checks, and financial balance movements.
            </p>
          </div>
          <span className="badge badge-active">TOTAL EVENTS: {totalElements}</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit events...</div>
        ) : logs.length === 0 ? (
          <div className="table-container" style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No audit events recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor Role</th>
                    <th>Entity Type</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-active" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ fontSize: '0.72rem' }}>
                          {log.actorRole || 'SYSTEM'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {log.entityType ? `${log.entityType} (${log.entityId ? log.entityId.slice(0, 8) + '...' : ''})` : '—'}
                      </td>
                      <td style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {log.details}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn btn-outline btn-sm"
                  disabled={page >= totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
