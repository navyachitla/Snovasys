import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest, formatINR } from '../api/client';
import Topbar from '../components/Topbar';

export default function FinancialOpsPage() {
  const { type = 'transfer' } = useParams(); // 'transfer', 'deposit', 'withdraw'

  const [accounts, setAccounts] = useState([]);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');

  // Two-step flow: 'input' -> 'review' -> 'posted'
  const [step, setStep] = useState('input');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    apiRequest('/api/accounts')
      .then((data) => {
        const accs = data.accounts || [];
        setAccounts(accs);
        if (accs.length > 0) {
          setSourceAccountId(accs[0].id);
          if (accs.length > 1) {
            setDestinationAccountId(accs[1].id);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Reset state on type change
  useEffect(() => {
    setStep('input');
    setError('');
    setResult(null);
  }, [type]);

  const handleReview = (e) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(amountRupees);
    if (!val || val <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (type === 'transfer' && sourceAccountId === destinationAccountId) {
      setError('Source and destination accounts must be different.');
      return;
    }

    // Generate UUID Idempotency Key
    const key = crypto.randomUUID();
    setIdempotencyKey(key);
    setStep('review');
  };

  const handleExecute = async () => {
    setError('');
    setSubmitting(true);

    const amountPaise = Math.round(parseFloat(amountRupees) * 100);

    try {
      let endpoint = '/api/transfers';
      let payload = {
        sourceAccountId,
        destinationAccountId,
        amountPaise,
        description: description || 'Account Transfer',
      };

      if (type === 'deposit') {
        endpoint = '/api/deposits';
        payload = {
          accountId: sourceAccountId,
          amountPaise,
          description: description || 'Deposit',
        };
      } else if (type === 'withdraw') {
        endpoint = '/api/withdrawals';
        payload = {
          accountId: sourceAccountId,
          amountPaise,
          description: description || 'Withdrawal',
        };
      }

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: payload,
        idempotencyKey,
      });

      setResult(res);
      setStep('posted');
    } catch (err) {
      setError(err.message || 'Transaction could not be posted');
      setStep('input');
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    if (type === 'deposit') return 'Deposit Funds';
    if (type === 'withdraw') return 'Withdraw Funds';
    return 'Transfer Funds';
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title={getTitle()} />
      <div className="page-container">
        <div className="page-header" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 32px auto' }}>
          <h1 className="page-title">{getTitle()}</h1>
          <p className="page-subtitle">
            All balance movements are validated with double-entry ledger entries and protected by strict idempotency keys.
          </p>
        </div>

        <div className="form-panel">
          {error && <div className="alert alert-error">{error}</div>}

          {step === 'input' && (
            <form onSubmit={handleReview}>
              <div className="form-group">
                <label className="form-label">{type === 'deposit' ? 'Deposit To Account' : 'From Account'}</label>
                <select
                  className="form-select"
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountNumber} ({a.type}) — Available: {formatINR(a.balancePaise)}
                    </option>
                  ))}
                </select>
              </div>

              {type === 'transfer' && (
                <div className="form-group">
                  <label className="form-label">To Account ID or Destination Account</label>
                  <select
                    className="form-select"
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    required
                  >
                    <option value="">Select Destination Account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.id === sourceAccountId}>
                        {a.accountNumber} ({a.type}) {a.id === sourceAccountId ? '(Selected as Source)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="form-help">Destination account will receive credit in real-time.</div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Amount (INR ₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="e.g. 500.00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Memo / Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Invoice payment, monthly savings"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Review & Confirm Transaction →
              </button>
            </form>
          )}

          {step === 'review' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span className="badge badge-pending">CONFIRMATION REQUIRED</span>
                <h3 style={{ fontSize: '1.4rem', marginTop: '12px' }}>Review Money Movement</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Please verify transaction details before posting to the immutable ledger.
                </p>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Operation:</span>
                  <strong>{type.toUpperCase()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--emerald-500)' }}>
                    ₹{parseFloat(amountRupees).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Description:</span>
                  <span>{description || 'Standard operation'}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Assigned Idempotency Key (Guarantees Exactly-Once Processing):
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--indigo-500)', wordBreak: 'break-all' }}>
                    {idempotencyKey}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setStep('input')}
                  disabled={submitting}
                >
                  ← Back to Edit
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleExecute}
                  disabled={submitting}
                >
                  {submitting ? 'Posting to Ledger...' : 'Post Transaction'}
                </button>
              </div>
            </div>
          )}

          {step === 'posted' && result && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--emerald-500)' }}>
                Transaction Posted
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
                Double-entry journal transaction posted and balance updated.
              </p>

              <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', margin: '24px 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Journal Transaction ID:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{result.journalTransactionId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span className="badge badge-active">{result.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Posted:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald-500)' }}>
                    {formatINR(result.amountPaise)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setAmountRupees('');
                    setDescription('');
                    setStep('input');
                  }}
                >
                  New Operation
                </button>
                <Link to="/statements" className="btn btn-primary" style={{ flex: 1 }}>
                  View Statements →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
