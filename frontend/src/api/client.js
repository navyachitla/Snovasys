const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, idempotencyKey } = {}) {
  const token = sessionStorage.getItem('balancevault.token');

  const reqHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    reqHeaders['Idempotency-Key'] = idempotencyKey;
  }

  const config = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    sessionStorage.removeItem('balancevault.token');
    sessionStorage.removeItem('balancevault.user');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function formatINR(paise) {
  if (paise === null || paise === undefined) return '₹0.00';
  const isNeg = BigInt(paise) < 0n;
  const abs = isNeg ? -BigInt(paise) : BigInt(paise);
  const rupees = abs / 100n;
  const rem = String(abs % 100n).padStart(2, '0');
  const formattedRupees = new Intl.NumberFormat('en-IN').format(rupees);
  return `${isNeg ? '-' : ''}₹${formattedRupees}.${rem}`;
}
