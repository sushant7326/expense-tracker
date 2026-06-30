/* ─────────────────────────────────────────────────────────────
   dashboard.js  —  App bootstrap + state
   ───────────────────────────────────────────────────────────── */

import { isLoggedIn, getUser, logout, transactions as txApi } from './api.js';
import { renderTransactions } from './transactions.js';
import { renderCharts } from './charts.js';
import { initAI } from './ai.js';
import { initReports } from './reports.js';

/* ── Auth guard ── */
if (!isLoggedIn()) window.location.href = '/index.html';

/* ── App State (single source of truth) ── */
export const state = {
  transactions: [],
  filter: 'all',       // 'all' | 'income' | 'expense'
  search: '',
  chartRange: '1m',    // '1m' | '3m' | '1y'
};

/* ── DOM Bootstrap ── */
const user = getUser();

// Populate user info in sidebar
document.getElementById('sidebar-username').textContent = user?.username ?? 'User';
document.getElementById('sidebar-avatar').textContent   = (user?.username?.[0] ?? 'U').toUpperCase();

// Logout
document.getElementById('logout-btn').addEventListener('click', logout);

// Mobile hamburger
const hamburger = document.getElementById('hamburger-btn');
const sidebar   = document.getElementById('sidebar');
hamburger?.addEventListener('click', () => sidebar.classList.toggle('open'));

// Navigation
const navItems = document.querySelectorAll('.nav-item[data-section]');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const section = item.dataset.section;
    document.querySelectorAll('.content-section').forEach(s => {
      s.hidden = s.id !== `section-${section}`;
    });
  });
});

/* ── Load Transactions ── */
export async function loadTransactions() {
  try {
    const data = await txApi.getAll();
    state.transactions = data.message ?? [];
    updateStats();
    renderTransactions();
    renderCharts();
  } catch (err) {
    console.error('Failed to load transactions:', err.message);
    showToast('Failed to load transactions', 'error');
  }
}

/* ── Stats ── */
function updateStats() {
  const txs = state.transactions;
  const income  = txs.filter(t => !t.expense).reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter(t =>  t.expense).reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  document.getElementById('stat-income').textContent  = formatINR(income);
  document.getElementById('stat-expense').textContent = formatINR(expense);
  document.getElementById('stat-balance').textContent = formatINR(balance);

  const balanceEl = document.getElementById('stat-balance');
  balanceEl.style.color = balance >= 0
    ? 'var(--clr-income)'
    : 'var(--clr-expense)';
}

/* ── Utilities ── */
export function formatINR(amount) {
  return '₹' + Math.abs(amount).toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ── Init ── */
initAI();
initReports();
loadTransactions();
