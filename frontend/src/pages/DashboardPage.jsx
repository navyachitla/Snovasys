import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatINR } from '../api/client';
import Topbar from '../components/Topbar';

export default function DashboardPage() {
  const { user, isAccountHolder, isAdmin, isAuditor } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiRequest('/api/accounts'),
      isAccountHolder ? apiRequest('/api/account-requests') : Promise.resolve({ requests: [] }),
    ]).then(([accRes, reqRes]) => {
      if (accRes.status === 'fulfilled' && accRes.value?.accounts) {
        setAccounts(accRes.value.accounts);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value?.requests) {
        setRequests(reqRes.value.requests);
      }
      setLoading(false);
    });
  }, [isAccountHolder]);

  const totalPaise = accounts.reduce((sum, a) => sum + (BigInt(a.balancePaise) || 0n), 0n);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Overview" />
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--emerald-500)', fontWeight: 600, letterSpacing: '0.05em' }}>
              ✦ FINANCIAL OVERVIEW
            </div>
            <h1 className="page-title">Welcome back, {user?.fullName}</h1>
            <p className="page-subtitle">Your ledger is protected and provable. Here is your current financial status.</p>
          </div>
          {isAccountHolder && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/transactions/transfer" className="btn btn-primary">
                Transfer Money
              </Link>
              <Link to="/account-requests" className="btn btn-outline">
                + Request Account
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="card-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Balance</span>
              <span style={{ color: 'var(--emerald-500)' }}>₹</span>
            </div>
            <div className="stat-value">{formatINR(totalPaise)}</div>
            <div className="stat-subtext">Across {accounts.length} connected account(s)</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Active Accounts</span>
              <span>💳</span>
            </div>
            <div className="stat-value">{accounts.filter(a => a.status === 'ACTIVE').length}</div>
            <div className="stat-subtext">Verified & open for transactions</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Onboarding Requests</span>
              <span>📋</span>
            </div>
            <div className="stat-value">
              {isAccountHolder ? requests.length : 'Admin View'}
            </div>
            <div className="stat-subtext">
              {isAccountHolder ? `${requests.filter(r => r.status === 'PENDING').length} pending review` : 'Review incoming requests in Queue'}
            </div>
          </div>
        </div>

        {/* Accounts Overview */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Connected Accounts</h2>
          <Link to="/accounts" style={{ fontSize: '0.88rem', color: 'var(--emerald-500)' }}>
            View all accounts →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="table-container" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {isAccountHolder
                ? "You don't have any active accounts yet. Submit an onboarding request to open an account."
                : "No accounts currently exist in the database."}
            </p>
            {isAccountHolder && (
              <Link to="/account-requests" className="btn btn-primary btn-sm">
                Request Your First Account
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Account Number</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Current Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.slice(0, 5).map((acc) => (
                  <tr key={acc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{acc.accountNumber}</td>
                    <td><span className="badge">{acc.type}</span></td>
                    <td>
                      <span className={`badge badge-${acc.status.toLowerCase()}`}>{acc.status}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {formatINR(acc.balancePaise)}
                    </td>
                    <td>
                      <Link to="/statements" className="btn btn-outline btn-sm">
                        Statement
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
