/* ─────────────────────────────────────────────────────────────
   reports.js  —  Monthly PDF report (client-side via html2pdf.js)
   ───────────────────────────────────────────────────────────── */

import { state, formatINR, formatDate } from './dashboard.js';
import { CATEGORIES } from './transactions.js';
import { getUser } from './api.js';

/* html2pdf is loaded lazily from CDN on first use */
let html2pdfLoaded = false;

async function loadHtml2pdf() {
  if (html2pdfLoaded) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload  = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  html2pdfLoaded = true;
}

export function initReports() {
  const monthInput  = document.getElementById('report-month');
  const downloadBtn = document.getElementById('download-pdf-btn');
  const preview     = document.getElementById('report-preview');

  if (!monthInput || !downloadBtn) return;

  // Default to current month
  const now = new Date();
  monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  downloadBtn.addEventListener('click', async () => {
    const monthVal = monthInput.value;
    if (!monthVal) return alert('Please select a month.');

    const [year, month] = monthVal.split('-').map(Number);
    const txs = filterByMonth(state.transactions, year, month);

    if (txs.length === 0) {
      alert(`No transactions found for ${monthLabel(year, month)}.`);
      return;
    }

    downloadBtn.disabled = true;
    downloadBtn.textContent = '⏳ Generating…';

    try {
      await loadHtml2pdf();
      const html = buildReportHTML(txs, year, month);
      await generatePDF(html, monthVal);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '⬇ Download PDF';
    }
  });
}

/* ── Filter transactions for a given month ── */
function filterByMonth(txs, year, month) {
  return txs.filter(t => {
    const d = new Date(t.transaction_time);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

/* ── Build the HTML that becomes the PDF ── */
function buildReportHTML(txs, year, month) {
  const user       = getUser();
  const username   = user?.username ?? 'User';
  const label      = monthLabel(year, month);
  const generatedAt = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  const totalIncome  = txs.filter(t => !t.expense).reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = txs.filter(t =>  t.expense).reduce((s, t) => s + Number(t.amount), 0);
  const netBalance   = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0.0';

  // Category breakdown (expenses only)
  const catTotals = {};
  txs.filter(t => t.expense).forEach(t => {
    const cat = t.category ?? 'Other';
    catTotals[cat] = (catTotals[cat] ?? 0) + Number(t.amount);
  });

  const catRows = Object.entries(catTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => {
      const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : '0.0';
      return `<tr>
        <td style="padding:8px 12px">${cat}</td>
        <td style="padding:8px 12px;text-align:right;font-weight:600">${formatINR(amt)}</td>
        <td style="padding:8px 12px;text-align:right;color:#666">${pct}%</td>
      </tr>`;
    }).join('');

  // Transaction list (sorted desc by date)
  const sorted = txs.slice().sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time));
  const txRows = sorted.map(t => `
    <tr>
      <td style="padding:7px 10px">${formatDate(t.transaction_time)}</td>
      <td style="padding:7px 10px;font-weight:500">${escapeHtml(t.title)}</td>
      <td style="padding:7px 10px;color:#666">${escapeHtml(t.category ?? 'Other')}</td>
      <td style="padding:7px 10px;text-align:right;font-weight:600;color:${t.expense ? '#e53e3e' : '#38a169'}">
        ${t.expense ? '−' : '+'}${formatINR(t.amount)}
      </td>
      <td style="padding:7px 10px;color:#666">${escapeHtml(t.payment_method ?? '—')}</td>
    </tr>
  `).join('');

  return `
    <div id="pdf-root" style="
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1a202c;
      background: #ffffff;
      padding: 40px;
      max-width: 780px;
      margin: 0 auto;
    ">

      <!-- Header -->
      <div style="border-bottom: 3px solid #6b46c1; padding-bottom: 20px; margin-bottom: 28px; display:flex; justify-content:space-between; align-items:flex-end">
        <div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#6b46c1">FinTrack</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#718096">Personal Finance Report</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:18px;font-weight:700">${label}</div>
          <div style="font-size:12px;color:#718096">Generated for <strong>${escapeHtml(username)}</strong> · ${generatedAt}</div>
        </div>
      </div>

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px">
        ${statBox('Total Income',  formatINR(totalIncome),  '#38a169', '#f0fff4')}
        ${statBox('Total Expenses', formatINR(totalExpense), '#e53e3e', '#fff5f5')}
        ${statBox('Net Balance',   formatINR(netBalance),   netBalance >= 0 ? '#3182ce' : '#e53e3e', '#ebf8ff')}
        ${statBox('Savings Rate',  savingsRate + '%',        '#805ad5', '#faf5ff')}
      </div>

      <!-- Category breakdown -->
      ${catRows ? `
      <div style="margin-bottom:28px">
        <h2 style="font-size:15px;font-weight:700;margin-bottom:12px;border-left:4px solid #6b46c1;padding-left:10px">
          Expenses by Category
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f7f7f8;border-bottom:2px solid #e2e8f0">
              <th style="padding:9px 12px;text-align:left;font-weight:600;color:#4a5568">Category</th>
              <th style="padding:9px 12px;text-align:right;font-weight:600;color:#4a5568">Amount</th>
              <th style="padding:9px 12px;text-align:right;font-weight:600;color:#4a5568">Share</th>
            </tr>
          </thead>
          <tbody>${catRows}</tbody>
        </table>
      </div>` : ''}

      <!-- Transaction list -->
      <div>
        <h2 style="font-size:15px;font-weight:700;margin-bottom:12px;border-left:4px solid #6b46c1;padding-left:10px">
          All Transactions (${txs.length})
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#f7f7f8;border-bottom:2px solid #e2e8f0">
              <th style="padding:8px 10px;text-align:left;font-weight:600;color:#4a5568">Date</th>
              <th style="padding:8px 10px;text-align:left;font-weight:600;color:#4a5568">Title</th>
              <th style="padding:8px 10px;text-align:left;font-weight:600;color:#4a5568">Category</th>
              <th style="padding:8px 10px;text-align:right;font-weight:600;color:#4a5568">Amount</th>
              <th style="padding:8px 10px;text-align:left;font-weight:600;color:#4a5568">Method</th>
            </tr>
          </thead>
          <tbody>${txRows}</tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#a0aec0">
        Generated by FinTrack · ${generatedAt}
      </div>

    </div>`;
}

function statBox(label, value, color, bg) {
  return `<div style="background:${bg};border:1px solid ${color}22;border-radius:10px;padding:16px;text-align:center">
    <div style="font-size:11px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">${label}</div>
    <div style="font-size:18px;font-weight:800;color:${color}">${value}</div>
  </div>`;
}

/* ── Generate + download PDF ── */
async function generatePDF(html, monthVal) {
  // Inject HTML into a hidden container
  let container = document.getElementById('pdf-hidden-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pdf-hidden-container';
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff';
    document.body.appendChild(container);
  }
  container.innerHTML = html;

  const element = container.querySelector('#pdf-root');

  await window.html2pdf()
    .set({
      margin:      [10, 10, 10, 10],
      filename:    `FinTrack_Report_${monthVal}.pdf`,
      image:       { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save();

  container.innerHTML = '';
}

function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
