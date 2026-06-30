/* ─────────────────────────────────────────────────────────────
   charts.js  —  Chart.js spending visualisations
   ───────────────────────────────────────────────────────────── */

import { state } from './dashboard.js';

/* ── Chart instances (kept so we can destroy + recreate on update) ── */
let categoryChart = null;
let monthlyChart  = null;

/* ── Category colours (one per fixed category) ── */
const CAT_COLORS = {
  'Food & Dining':       '#f87171',
  'Transportation':      '#fb923c',
  'Shopping':            '#facc15',
  'Entertainment':       '#a78bfa',
  'Healthcare':          '#34d399',
  'Housing & Utilities': '#60a5fa',
  'Education':           '#f472b6',
  'Travel':              '#2dd4bf',
  'Personal Care':       '#e879f9',
  'Investments':         '#4ade80',
  'Salary':              '#34d399',
  'Freelance':           '#818cf8',
  'Other':               '#94a3b8',
};

/* ── Shared Chart.js defaults ── */
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#8a8fa8',
        font: { family: 'Inter, sans-serif', size: 12 },
        boxWidth: 12,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#1a1e35',
      borderColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      titleColor: '#e8eaf0',
      bodyColor: '#8a8fa8',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: ctx => ` ₹${Number(ctx.raw).toLocaleString('en-IN')}`,
      },
    },
  },
};

/* ── Date range helpers ── */
function cutoff(range) {
  const now = new Date();
  if (range === '1m') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === '3m') return new Date(now.getFullYear(), now.getMonth() - 3, 1);
  if (range === '6m') return new Date(now.getFullYear(), now.getMonth() - 6, 1);
  if (range === '1y') return new Date(now.getFullYear() - 1, now.getMonth(), 1);
  return new Date(0);
}

function filterByRange(txs, range) {
  const from = cutoff(range);
  return txs.filter(t => new Date(t.transaction_time) >= from);
}

/* ═══════════════════════════════════════════════════════════
   1. Doughnut — Expenses by Category
   ═══════════════════════════════════════════════════════════ */
function buildCategoryChart(range = '1m') {
  const canvas = document.getElementById('chart-category');
  if (!canvas) return;

  const expenses = filterByRange(state.transactions, range)
    .filter(t => t.expense);

  // Aggregate by category
  const totals = {};
  expenses.forEach(t => {
    const cat = t.category ?? 'Other';
    totals[cat] = (totals[cat] ?? 0) + Number(t.amount);
  });

  const labels = Object.keys(totals);
  const data   = Object.values(totals);
  const colors = labels.map(l => CAT_COLORS[l] ?? '#94a3b8');

  if (categoryChart) categoryChart.destroy();

  if (labels.length === 0) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    categoryChart = null;
    return;
  }

  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor:     colors,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      cutout: '65%',
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: {
          ...CHART_DEFAULTS.plugins.legend,
          position: 'right',
        },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.raw / total) * 100).toFixed(1);
              return ` ₹${Number(ctx.raw).toLocaleString('en-IN')}  (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════
   2. Grouped Bar — Income vs Expense by Month
   ═══════════════════════════════════════════════════════════ */
function buildMonthlyChart(range = '3m') {
  const canvas = document.getElementById('chart-monthly');
  if (!canvas) return;

  const txs = filterByRange(state.transactions, range);

  // Build month buckets
  const buckets = {};
  txs.forEach(t => {
    const d     = new Date(t.transaction_time);
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    if (!buckets[key]) buckets[key] = { label, income: 0, expense: 0 };
    if (t.expense) buckets[key].expense += Number(t.amount);
    else           buckets[key].income  += Number(t.amount);
  });

  const sorted = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
  const labels  = sorted.map(([, v]) => v.label);
  const incomes = sorted.map(([, v]) => v.income);
  const expenses= sorted.map(([, v]) => v.expense);

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          backgroundColor: 'rgba(52,211,153,0.7)',
          borderColor:     '#34d399',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Expenses',
          data: expenses,
          backgroundColor: 'rgba(248,113,113,0.7)',
          borderColor:     '#f87171',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: {
          grid:  { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8a8fa8', font: { family: 'Inter, sans-serif', size: 11 } },
        },
        y: {
          grid:  { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#8a8fa8',
            font: { family: 'Inter, sans-serif', size: 11 },
            callback: v => '₹' + Number(v).toLocaleString('en-IN'),
          },
          beginAtZero: true,
        },
      },
    },
  });
}

/* ── Public API ── */
export function renderCharts() {
  const catRange = document.querySelector('.time-btn.active[data-chart="cat"]')?.dataset.range ?? '1m';
  const barRange = document.querySelector('.time-btn.active[data-chart="bar"]')?.dataset.range ?? '3m';
  buildCategoryChart(catRange);
  buildMonthlyChart(barRange);
}

/* ── Wire up time-range buttons ── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.time-btn[data-chart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const chartGroup = btn.dataset.chart;
      document.querySelectorAll(`.time-btn[data-chart="${chartGroup}"]`).forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      if (chartGroup === 'cat') buildCategoryChart(btn.dataset.range);
      if (chartGroup === 'bar') buildMonthlyChart(btn.dataset.range);
    });
  });
});
