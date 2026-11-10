import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, formatINR } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Topbar from '../components/Topbar';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const { isAccountHolder } = useAuth();

  useEffect(() => {
    apiRequest('/api/accounts')
      .then((data) => setAccounts(data.accounts || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Accounts" />
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Accounts</h1>
            <p className="page-subtitle">Manage your verified financial accounts and ledger balances.</p>
          </div>
          {isAccountHolder && (
            <Link to="/account-requests" className="btn btn-primary">
              + Open New Account
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="table-container" style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No active accounts found.</p>
            {isAccountHolder && (
              <Link to="/account-requests" className="btn btn-primary">
                Submit Account Request
              </Link>
            )}
          </div>
        ) : (
          <div className="card-grid">
            {accounts.map((acc) => (
              <div key={acc.id} className="stat-card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className="badge" style={{ marginBottom: '8px' }}>{acc.type} ACCOUNT</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }}>
                      {acc.accountNumber}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(acc.accountNumber)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    {copiedId === acc.accountNumber ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div style={{ margin: '20px 0' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Balance</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {formatINR(acc.balancePaise)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <span className={`badge badge-${acc.status.toLowerCase()}`}>{acc.status}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/statements" className="btn btn-outline btn-sm">
                      View Ledger
                    </Link>
                    {isAccountHolder && (
                      <Link to="/transactions/transfer" className="btn btn-primary btn-sm">
                        Transfer
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
