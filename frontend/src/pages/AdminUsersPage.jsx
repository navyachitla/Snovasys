import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import Topbar from '../components/Topbar';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);

  // Invite Form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ACCOUNT_HOLDER');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = () => {
    const params = new URLSearchParams({ page: '1', perPage: '50' });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);

    Promise.all([
      apiRequest(`/api/admin/users?${params.toString()}`),
      apiRequest('/api/admin/invitations'),
    ])
      .then(([usersRes, invitesRes]) => {
        setUsers(usersRes.users || []);
        setInvitations(invitesRes.invitations || []);
      })
      .catch((err) => setError(err.message || 'Failed to fetch data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter]);

  const handleToggleStatus = async (user) => {
    try {
      await apiRequest(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: { isActive: !user.isActive },
      });
      loadData();
    } catch (err) {
      setError(err.message || 'Could not change user status');
    }
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviting(true);

    try {
      const res = await apiRequest('/api/admin/invitations', {
        method: 'POST',
        body: {
          fullName: inviteName,
          email: inviteEmail,
          role: inviteRole,
        },
      });
      setSuccess(`Invitation created for ${res.invitation.email}! Copy the registration link below.`);
      setInviteName('');
      setInviteEmail('');
      loadData();
    } catch (err) {
      setError(err.message || 'Could not create invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (inv) => {
    try {
      await apiRequest(`/api/admin/invitations/${inv.id}/revoke`, { method: 'POST' });
      loadData();
    } catch (err) {
      setError(err.message || 'Could not revoke invitation');
    }
  };

  const handleCopyInviteLink = (token) => {
    const link = `${window.location.origin}/register?token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="User Management" />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">User Management & Permissions</h1>
          <p className="page-subtitle">Configure role-based access, invite administrators/auditors, and manage user statuses.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Invite Form */}
        <div className="form-panel" style={{ maxWidth: '100%', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px' }}>Invite New Member</h2>
          <form onSubmit={handleCreateInvitation} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 160px', gap: '16px', alignItems: 'end' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Assigned Role</label>
              <select
                className="form-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="ACCOUNT_HOLDER">Account Holder</option>
                <option value="AUDITOR">Auditor (Read-Only)</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={inviting}>
              {inviting ? 'Sending...' : 'Generate Invite'}
            </button>
          </form>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '12px' }}>Active Invitations</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invitee</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registration Link</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600 }}>{inv.fullName}</td>
                      <td>{inv.email}</td>
                      <td><span className="badge">{inv.role}</span></td>
                      <td>
                        {inv.isUsed ? (
                          <span className="badge badge-active">Accepted</span>
                        ) : inv.isRevoked ? (
                          <span className="badge badge-rejected">Revoked</span>
                        ) : (
                          <span className="badge badge-pending">Pending</span>
                        )}
                      </td>
                      <td>
                        {!inv.isUsed && !inv.isRevoked && (
                          <button
                            onClick={() => handleCopyInviteLink(inv.token)}
                            className="btn btn-outline btn-sm"
                          >
                            {copiedToken === inv.token ? 'Copied Link!' : 'Copy Link'}
                          </button>
                        )}
                      </td>
                      <td>
                        {!inv.isUsed && !inv.isRevoked && (
                          <button
                            onClick={() => handleRevokeInvitation(inv)}
                            className="btn btn-danger btn-sm"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Directory */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Registered Users</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '220px' }}
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '160px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="ACCOUNT_HOLDER">Account Holder</option>
                <option value="AUDITOR">Auditor</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading users...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Toggle Access</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><span className="badge">{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-active' : 'badge-rejected'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`btn ${u.isActive ? 'btn-danger' : 'btn-outline'} btn-sm`}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
