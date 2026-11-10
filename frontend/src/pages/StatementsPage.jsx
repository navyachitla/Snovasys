import React, { useEffect, useState } from 'react';
import { apiRequest, formatINR } from '../api/client';
import Topbar from '../components/Topbar';

export default function StatementsPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
            <div style={{ minWidth: '260px' }}>
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
                      <tr key={entry.id}>
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
      </div>
    </div>
  );
}
