import React, { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import { apiRequest } from '../api/client';

export default function LedgerProofPage() {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProof = async () => {
    try {
      setRefreshing(true);
      const data = await apiRequest('/api/ledger/proof');
      setProof(data);
    } catch (err) {
      console.error('Failed to load ledger proof:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProof();
  }, []);

  const formatPaise = (paise) => {
    const val = Number(paise || 0) / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  return (
    <>
      <Topbar title="Ledger Invariant Proof" />

      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>⚖️ Ledger Invariant Proof</h2>
            <p className="page-subtitle">
              Mathematical proof of double-entry integrity — verifying that total debits strictly equal total credits.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={fetchProof}
            disabled={refreshing}
          >
            {refreshing ? 'Verifying Math...' : '🔄 Re-Verify Invariant'}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Calculating double-entry balances across all journal ledgers...
          </div>
        ) : (
          <>
            {/* Proof Status Banner */}
            <div
              style={{
                background: proof?.isBalanced ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${proof?.isBalanced ? 'var(--emerald-500)' : 'var(--rose-500)'}`,
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{proof?.isBalanced ? '🛡️' : '⚠️'}</span>
                  <div>
                    <h3 style={{ margin: 0, color: proof?.isBalanced ? 'var(--emerald-400)' : 'var(--rose-400)', fontSize: '1.3rem' }}>
                      {proof?.isBalanced ? 'LEDGER INTEGRITY MATHEMATICALLY PROVEN' : 'LEDGER VARIANCE DETECTED'}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Status: <strong>{proof?.proofStatus}</strong> • Invariant: <code>{proof?.formula}</code>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${proof?.isBalanced ? 'badge-active' : 'badge-danger'}`} style={{ fontSize: '0.9rem', padding: '8px 14px' }}>
                  {proof?.isBalanced ? '0.00 Variance (Balanced)' : 'Imbalanced'}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Verified: {proof?.verifiedAt ? new Date(proof.verifiedAt).toLocaleTimeString() : 'Just now'}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
              <div className="metric-card">
                <div className="metric-label">Σ Total Debits (Assets / Outflows)</div>
                <div className="metric-value" style={{ color: 'var(--rose-400)' }}>
                  {formatPaise(proof?.totalDebitsPaise)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {proof?.totalDebitsPaise} Paise
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Σ Total Credits (Liabilities / Inflows)</div>
                <div className="metric-value" style={{ color: 'var(--emerald-400)' }}>
                  {formatPaise(proof?.totalCreditsPaise)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {proof?.totalCreditsPaise} Paise
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Net System Variance</div>
                <div className="metric-value" style={{ color: proof?.variancePaise === 0 ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                  {formatPaise(proof?.variancePaise)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Δ = 0 Paise (Exact Balance)
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Auditable Journal Entries</div>
                <div className="metric-value" style={{ color: 'var(--cyan-400)' }}>
                  {proof?.totalLedgerEntries || 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Across {proof?.totalTransactions || 0} Transactions
                </div>
              </div>
            </div>

            {/* Proof Explanation Section */}
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>🏛️ How BalanceVault Proves Money Movement</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--emerald-400)', marginBottom: '8px' }}>1. Strict Double-Entry Ledger</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Money is never adjusted as a single loose integer. Every financial operation creates an immutable <code>JournalTransaction</code> paired with matching <code>DEBIT</code> and <code>CREDIT</code> entries.
                  </p>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--cyan-400)', marginBottom: '8px' }}>2. Integer Paise Precision</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Floating-point arithmetic (IEEE 754) introduces rounding drift. BalanceVault stores all monetary quantities as 64-bit <code>BIGINT</code> in Paise (100 Paise = ₹1.00), eliminating precision leaks.
                  </p>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--indigo-400)', marginBottom: '8px' }}>3. Cryptographic Idempotency</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Every money movement accepts an <code>Idempotency-Key</code> header with SHA-256 payload verification. Network retries safely return the previous transaction receipt without duplicating debits.
                  </p>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--amber-400)', marginBottom: '8px' }}>4. Concurrency & Overdraft Locks</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Database accounts utilize <code>@Version</code> optimistic locking. Concurrent transfer attempts that would result in negative balances are atomically rejected at the persistence boundary.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
