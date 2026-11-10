import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

export default function Topbar({ title = 'Workspace' }) {
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    apiRequest('/api/ready')
      .then((data) => {
        if (data?.status === 'ready') setBackendReady(true);
      })
      .catch(() => setBackendReady(false));
  }, []);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Workspace</span>
        <span style={{ color: 'var(--border-color)' }}>/</span>
        <strong>{title}</strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            {backendReady ? 'Backend Ready (Spring Boot & MySQL)' : 'Connecting to Server...'}
          </span>
        </div>
      </div>
    </header>
  );
}
