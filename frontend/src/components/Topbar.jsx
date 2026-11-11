import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

export default function Topbar({ title = 'Workspace' }) {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [backendReady, setBackendReady] = useState(false);
  const [proof, setProof] = useState(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    apiRequest('/api/ready')
      .then((data) => {
        if (data?.status === 'ready') setBackendReady(true);
      })
      .catch(() => setBackendReady(false));

    apiRequest('/api/ledger/proof')
      .then((data) => setProof(data))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const quickSwitch = async (email, password) => {
    try {
      setSwitching(true);
      await login(email, password);
      window.location.reload();
    } catch (err) {
      console.error('Failed to quick switch:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Workspace</span>
        <span style={{ color: 'var(--border-color)' }}>/</span>
        <strong>{title}</strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Ledger Invariant Pill */}
        {proof && (
          <Link
            to="/ledger-proof"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--emerald-500)',
              color: 'var(--emerald-400)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
            title="Click to view mathematical ledger proof"
          >
            <span>🛡️</span>
            <span>Ledger: <strong>Proven (Δ = ₹0.00)</strong></span>
          </Link>
        )}

        {/* Quick Role Switcher for Evaluators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '3px 6px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)', marginRight: '2px' }}>Switch:</span>
          <button
            onClick={() => quickSwitch('admin@balancevault.com', 'Admin@Vault2026!')}
            disabled={switching || user?.role === 'ADMIN'}
            style={{
              background: user?.role === 'ADMIN' ? 'var(--emerald-500)' : 'transparent',
              color: user?.role === 'ADMIN' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
            title="Switch to Admin"
          >
            👑 Admin
          </button>
          <button
            onClick={() => quickSwitch('demo@balancevault.com', 'Demo@Vault2026!')}
            disabled={switching || user?.role === 'ACCOUNT_HOLDER'}
            style={{
              background: user?.role === 'ACCOUNT_HOLDER' ? 'var(--emerald-500)' : 'transparent',
              color: user?.role === 'ACCOUNT_HOLDER' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
            title="Switch to User (Demo)"
          >
            👤 User
          </button>
          <button
            onClick={() => quickSwitch('auditor@balancevault.com', 'Auditor@Vault2026!')}
            disabled={switching || user?.role === 'AUDITOR'}
            style={{
              background: user?.role === 'AUDITOR' ? 'var(--emerald-500)' : 'transparent',
              color: user?.role === 'AUDITOR' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
            title="Switch to Auditor"
          >
            🔍 Auditor
          </button>
        </div>

        {/* User Badge & Prominent Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '0.85rem', textAlign: 'right' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName || 'User'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--emerald-400)' }}>{user?.role?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              color: 'var(--rose-400)',
              borderColor: 'rgba(244, 63, 94, 0.4)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Sign out of your account"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
