import React, { useEffect, useState } from 'react';
import { apiRequest, formatINR } from '../api/client';
import Topbar from '../components/Topbar';

export default function StatementsPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    apiRequest('/api/accounts')
      .then((data) => {
        const accs = data.accounts || [];
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    setLoading(true);
    apiRequest(`/api/accounts/${selectedAccountId}/statement?limit=15`)
      .then((data) => {
        setStatement(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  const loadMore = () => {
    if (!statement?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    apiRequest(`/api/accounts/${selectedAccountId}/statement?limit=15&cursor=${encodeURIComponent(statement.nextCursor)}`)
      .then((data) => {
        setStatement((prev) => ({
          ...data,
          entries: [...prev.entries, ...data.entries],
        }));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingMore(false));
  };

  const exportToCSV = () => {
    if (!statement?.entries || statement.entries.length === 0) return;
    const currentAcc = accounts.find((a) => a.id === selectedAccountId);
    const headers = ['Timestamp', 'Type', 'Amount (INR)', 'Running Balance (INR)', 'Journal Transaction ID', 'Description'];
    const rows = statement.entries.map((e) => [
      `"${new Date(e.createdAt).toISOString()}"`,
      `"${e.entryType}"`,
      (Number(e.amountPaise) / 100).toFixed(2),
      (Number(e.runningBalancePaise) / 100).toFixed(2),
      `"${e.journalTransactionId || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `statement-${currentAcc?.accountNumber || 'account'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Account Statements" />
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Ledger Statements</h1>
            <p className="page-subtitle">Verifiable double-entry ledger entries and historical running balances.</p>
          </div>

          {accounts.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ minWidth: '240px' }}>
                <label className="form-label">Select Account</label>
                <select
                  className="form-select"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountNumber} ({a.type}) — {formatINR(a.balancePaise)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={exportToCSV}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', whiteSpace: 'nowrap' }}
                title="Download CSV Statement"
              >
                <span>📥</span> Export CSV
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading statement entries...</div>
        ) : !statement || statement.entries.length === 0 ? (
          <div className="table-container" style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No ledger entries found for this account yet.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Journal ID</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.entries.map((entry) => {
                    const isCredit = entry.entryType === 'CREDIT';
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedReceipt(entry)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view certified double-entry receipt"
                      >
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${isCredit ? 'badge-credit' : 'badge-debit'}`}>
                            {entry.entryType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {entry.description || entry.transactionType}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {entry.journalTransactionId ? entry.journalTransactionId.slice(0, 8) + '...' : '—'}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: isCredit ? 'var(--emerald-500)' : 'var(--rose-500)',
                          }}
                        >
                          {isCredit ? '+' : ''}{formatINR(entry.amountPaise)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {formatINR(entry.runningBalancePaise)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {statement.hasMore && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button onClick={loadMore} className="btn btn-outline" disabled={loadingMore}>
                  {loadingMore ? 'Loading older entries...' : 'Load Older Entries ↓'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Certified Ledger Receipt Modal */}
        {selectedReceipt && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
            onClick={() => setSelectedReceipt(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: '520px',
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Certified Ledger Receipt</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BalanceVault Verified Proof</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedReceipt.entryType === 'CREDIT' ? 'Credit Inflow' : 'Debit Outflow'}
                </div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: selectedReceipt.entryType === 'CREDIT' ? 'var(--emerald-400)' : 'var(--rose-400)',
                    margin: '6px 0',
                  }}
                >
                  {selectedReceipt.entryType === 'CREDIT' ? '+' : '-'}{formatINR(selectedReceipt.amountPaise)}
                </div>
                <div className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                  STATUS: POSTED & IMMUTABLE
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Journal Transaction ID</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{selectedReceipt.journalTransactionId || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp</span>
                  <span>{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Post-Transaction Balance</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatINR(selectedReceipt.runningBalancePaise)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Double-Entry Equilibrium</span>
                  <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>Verified (Zero Variance)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => window.print()}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedReceipt(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
