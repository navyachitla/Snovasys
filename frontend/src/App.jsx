import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import AccountRequestsPage from './pages/AccountRequestsPage';
import FinancialOpsPage from './pages/FinancialOpsPage';
import StatementsPage from './pages/StatementsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminOnboardingPage from './pages/AdminOnboardingPage';
import AuditPage from './pages/AuditPage';
import LedgerProofPage from './pages/LedgerProofPage';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--emerald-500)', fontSize: '1.2rem', fontWeight: 600 }}>Loading BalanceVault...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/statements" element={<StatementsPage />} />
          <Route path="/account-requests" element={<AccountRequestsPage />} />
          <Route path="/transactions/:type" element={<FinancialOpsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/onboarding" element={<AdminOnboardingPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/ledger-proof" element={<LedgerProofPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
