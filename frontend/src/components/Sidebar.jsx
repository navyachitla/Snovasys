import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout, isAdmin, isAuditor, isAccountHolder } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">BV</div>
        <div>
          <div className="brand-title">BalanceVault</div>
          <div className="brand-tag">PROVEN LEDGER</div>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-section-label">General</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>📊</span> Overview
        </NavLink>
        <NavLink to="/accounts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>💳</span> Accounts
        </NavLink>
        <NavLink to="/statements" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>📜</span> Statements
        </NavLink>
        <NavLink to="/ledger-proof" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>⚖️</span> Ledger Proof
        </NavLink>

        {isAccountHolder && (
          <>
            <div className="nav-section-label">Money Movement</div>
            <NavLink to="/transactions/transfer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span>🔄</span> Transfer Funds
            </NavLink>
            <NavLink to="/transactions/deposit" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span>📥</span> Deposit Funds
            </NavLink>
            <NavLink to="/transactions/withdraw" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span>📤</span> Withdraw Funds
            </NavLink>
            <NavLink to="/account-requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span>➕</span> Request Account
            </NavLink>
          </>
        )}

        {(isAdmin || isAuditor) && (
          <>
            <div className="nav-section-label">Governance</div>
            {isAdmin && (
              <>
                <NavLink to="/admin/onboarding" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span>📋</span> Onboarding Queue
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span>👥</span> User Management
                </NavLink>
              </>
            )}
            <NavLink to="/audit" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span>🛡️</span> Audit Trail
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div className="user-info">
            <span className="user-name">{user?.fullName || 'User'}</span>
            <span className="user-role-badge">{user?.role?.replace('_', ' ')}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{
              width: '100%',
              color: 'var(--rose-400)',
              borderColor: 'rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px'
            }}
            title="Sign Out of BalanceVault"
          >
            <span>🚪</span> <strong>Sign Out</strong>
          </button>
        </div>
      </div>
    </aside>
  );
}
