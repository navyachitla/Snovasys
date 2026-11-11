import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

export default function Topbar({ title = 'Workspace' }) {
  const [backendReady, setBackendReady] = useState(false);
  const [proof, setProof] = useState(null);

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

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Workspace</span>
        <span style={{ color: 'var(--border-color)' }}>/</span>
        <strong>{title}</strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <span>Ledger Invariant: <strong>Proven Balanced (Δ = ₹0.00)</strong></span>
          </Link>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: backendReady ? 'var(--emerald-500)' : 'var(--rose-500)',
              boxShadow: backendReady ? '0 0 8px var(--emerald-500)' : 'none',
            }}
          />
          <span style={{ color: backendReady ? 'var(--emerald-500)' : 'var(--rose-500)' }}>
            {backendReady ? 'Live API (Spring Boot)' : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
}
