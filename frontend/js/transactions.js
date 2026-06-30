/* ─────────────────────────────────────────────────────────────
   transactions.js  —  CRUD + modal logic
   ───────────────────────────────────────────────────────────── */

import { transactions as txApi } from './api.js';
import { state, loadTransactions, formatINR, formatDate, showToast } from './dashboard.js';

/* ── Fixed Category List ── */
export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Housing & Utilities',
  'Education',
  'Travel',
  'Personal Care',
  'Investments',
  'Salary',
  'Freelance',
  'Other',
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Wallet'];

/* ── DOM Elements ── */
const tableBody      = document.getElementById('tx-table-body');
const emptyState     = document.getElementById('tx-empty-state');
const modalOverlay   = document.getElementById('modal-overlay');
const modalTitle     = document.getElementById('modal-title');
const txForm         = document.getElementById('tx-form');
const modalCloseBtn  = document.getElementById('modal-close');
const addTxBtn       = document.getElementById('add-tx-btn');
const filterBtns     = document.querySelectorAll('.filter-pill');
const searchInput    = document.getElementById('tx-search');

let editingId = null; // null = adding new, string = editing existing

/* ── Populate category dropdowns ── */
function populateCategorySelect() {
  const sel = document.getElementById('form-category');
  CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function populatePaymentSelect() {
  const sel = document.getElementById('form-payment');
  PAYMENT_METHODS.forEach(pm => {
    const opt = document.createElement('option');
    opt.value = pm;
    opt.textContent = pm;
    sel.appendChild(opt);
  });
}

populateCategorySelect();
populatePaymentSelect();

/* ── Render Transaction Table ── */
export function renderTransactions() {
  let txs = [...state.transactions];

  // Filter by type
  if (state.filter === 'income')  txs = txs.filter(t => !t.expense);
  if (state.filter === 'expense') txs = txs.filter(t =>  t.expense);

  // Filter by search
  if (state.search) {
    const q = state.search.toLowerCase();
    txs = txs.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.category?.toLowerCase() ?? '').includes(q) ||
      (t.description?.toLowerCase() ?? '').includes(q)
    );
  }

  // Sort by transaction_time desc
  txs.sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time));

  if (txs.length === 0) {
    tableBody.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  tableBody.innerHTML = txs.map(t => `
    <tr>
      <td>
        <div class="tx-title">${escapeHtml(t.title)}</div>
        ${t.description ? `<div class="tx-desc">${escapeHtml(t.description)}</div>` : ''}
      </td>
      <td>
        <span class="badge ${t.expense ? 'badge-expense' : 'badge-income'}">
          ${escapeHtml(t.category ?? 'Other')}
        </span>
      </td>
      <td>
        <span class="tx-amount ${t.expense ? 'expense' : 'income'}">
          ${t.expense ? '−' : '+'}${formatINR(t.amount)}
        </span>
      </td>
      <td style="color:var(--clr-text-muted);font-size:var(--fs-xs)">
        ${formatDate(t.transaction_time)}
      </td>
      <td>${escapeHtml(t.payment_method ?? '—')}</td>
      <td>
        <div class="tx-actions">
          <button class="tx-action-btn" onclick="window.editTx('${t.transaction_id}')" title="Edit" aria-label="Edit transaction">✏️</button>
          <button class="tx-action-btn delete" onclick="window.deleteTx('${t.transaction_id}')" title="Delete" aria-label="Delete transaction">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── Filter Pills ── */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    renderTransactions();
  });
});

/* ── Search ── */
searchInput?.addEventListener('input', (e) => {
  state.search = e.target.value.trim();
  renderTransactions();
});

/* ── Modal: Open (add) ── */
addTxBtn.addEventListener('click', () => openModal());

function openModal(tx = null) {
  editingId = tx?.transaction_id ?? null;
  modalTitle.textContent = tx ? 'Edit Transaction' : 'Add Transaction';
  txForm.reset();

  if (tx) {
    document.getElementById('form-title').value          = tx.title ?? '';
    document.getElementById('form-amount').value         = tx.amount ?? '';
    document.getElementById('form-category').value       = tx.category ?? '';
    document.getElementById('form-description').value    = tx.description ?? '';
    document.getElementById('form-payment').value        = tx.payment_method ?? '';
    document.getElementById('form-location').value       = tx.location ?? '';
    document.getElementById('form-date').value           = tx.transaction_time
      ? new Date(tx.transaction_time).toISOString().slice(0, 16)
      : '';
    setTypeToggle(!tx.expense); // true = income
  } else {
    setTypeToggle(false); // default: expense
    document.getElementById('form-date').value =
      new Date().toISOString().slice(0, 16);
  }

  modalOverlay.classList.remove('hidden');
  document.getElementById('form-title').focus();
}

/* ── Modal: Close ── */
function closeModal() {
  modalOverlay.classList.add('hidden');
  editingId = null;
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ── Type Toggle ── */
let isIncome = false;

const incomeBtn  = document.getElementById('type-income');
const expenseBtn = document.getElementById('type-expense');

function setTypeToggle(income) {
  isIncome = income;
  if (income) {
    incomeBtn.classList.add('active-income');
    expenseBtn.classList.remove('active-expense');
  } else {
    expenseBtn.classList.add('active-expense');
    incomeBtn.classList.remove('active-income');
  }
}

incomeBtn.addEventListener('click',  () => setTypeToggle(true));
expenseBtn.addEventListener('click', () => setTypeToggle(false));

/* ── Form Submit ── */
txForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    title:          document.getElementById('form-title').value.trim(),
    amount:         parseInt(document.getElementById('form-amount').value, 10),
    expense:        !isIncome,
    category:       document.getElementById('form-category').value,
    description:    document.getElementById('form-description').value.trim(),
    payment_method: document.getElementById('form-payment').value,
    location:       document.getElementById('form-location').value.trim(),
  };

  const dateVal = document.getElementById('form-date').value;
  if (dateVal) payload.transaction_time = new Date(dateVal).toISOString();

  const submitBtn = document.getElementById('modal-submit-btn');
  submitBtn.disabled = true;

  try {
    if (editingId) {
      await txApi.update(editingId, payload);
      showToast('Transaction updated ✓', 'success');
    } else {
      await txApi.add(payload);
      showToast('Transaction added ✓', 'success');
    }
    closeModal();
    await loadTransactions();
  } catch (err) {
    showToast(err.message || 'Something went wrong', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

/* ── Global edit / delete (called from table rows) ── */
window.editTx = (id) => {
  const tx = state.transactions.find(t => t.transaction_id === id);
  if (tx) openModal(tx);
};

window.deleteTx = async (id) => {
  if (!confirm('Delete this transaction?')) return;
  try {
    await txApi.delete(id);
    showToast('Transaction deleted', 'info');
    await loadTransactions();
  } catch (err) {
    showToast(err.message || 'Delete failed', 'error');
  }
};

/* ── Helpers ── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
