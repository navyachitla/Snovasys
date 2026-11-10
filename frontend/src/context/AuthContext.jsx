import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('balancevault.user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('balancevault.token');
    if (token) {
      apiRequest('/api/users/me')
        .then((res) => {
          setUser(res.user);
          sessionStorage.setItem('balancevault.user', JSON.stringify(res.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthSuccess = (data) => {
    sessionStorage.setItem('balancevault.token', data.accessToken);
    sessionStorage.setItem('balancevault.user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    return handleAuthSuccess(data);
  };

  const register = async (name, email, password) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    return handleAuthSuccess(data);
  };

  const acceptInvitation = async (token, password) => {
    const data = await apiRequest('/api/auth/accept-invitation', {
      method: 'POST',
      body: { token, password },
    });
    return handleAuthSuccess(data);
  };

  const logout = () => {
    sessionStorage.removeItem('balancevault.token');
    sessionStorage.removeItem('balancevault.user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isAuditor: user?.role === 'AUDITOR',
        isAccountHolder: user?.role === 'ACCOUNT_HOLDER',
        login,
        register,
        acceptInvitation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
