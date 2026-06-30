/* ─────────────────────────────────────────────────────────────
   api.js  —  Centralised fetch wrapper for the backend API
   ───────────────────────────────────────────────────────────── */

// Point this at your backend. Change to http://localhost:5000 for local dev.
const API_BASE = window.API_BASE || 'http://localhost:5000';

/* ── Token helpers ── */
export const getToken   = ()       => localStorage.getItem('token');
export const setToken   = (token)  => localStorage.setItem('token', token);
export const removeToken= ()       => localStorage.removeItem('token');
export const getUser    = ()       => JSON.parse(localStorage.getItem('user') || 'null');
export const setUser    = (user)   => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = ()       => localStorage.removeItem('user');

export const isLoggedIn = () => !!getToken();

export function logout() {
  removeToken();
  removeUser();
  window.location.href = '/index.html';
}

/* ── Core fetch wrapper ── */
async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Auto-logout on 401 (expired/invalid token)
  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed: ${res.status}`);
  }

  return data;
}

/* ── Auth endpoints ── */
export const auth = {
  register: (username, password) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => apiFetch('/auth/me'),
};

/* ── Transaction endpoints ── */
export const transactions = {
  getAll:    ()           => apiFetch('/transactions'),
  getExpenses: ()         => apiFetch('/transactions/expense'),
  getIncomes:  ()         => apiFetch('/transactions/income'),

  add: (payload)          => apiFetch('/transactions/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  update: (id, payload)   => apiFetch(`/transactions/update-transaction/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  delete: (transaction_id) => apiFetch('/transactions/delete', {
    method: 'DELETE',
    body: JSON.stringify({ transaction_id }),
  }),
};

/* ── AI endpoint ── */
export const ai = {
  summary: (txData) => apiFetch('/ai/summary', {
    method: 'POST',
    body: JSON.stringify({ transactions: txData }),
  }),
};
