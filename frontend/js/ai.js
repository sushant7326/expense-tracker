/* ─────────────────────────────────────────────────────────────
   ai.js  —  AI Summary Panel
   ───────────────────────────────────────────────────────────── */

import { ai as aiApi } from './api.js';
import { state, showToast } from './dashboard.js';

export function initAI() {
  const btn          = document.getElementById('ai-summary-btn');
  const responseArea = document.getElementById('ai-response-area');

  if (!btn || !responseArea) return;

  btn.addEventListener('click', async () => {
    const txs = state.transactions;

    if (txs.length === 0) {
      showToast('Add some transactions first to get AI insights!', 'info');
      return;
    }

    // Loading state
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Thinking…';
    responseArea.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;padding:var(--sp-10);gap:var(--sp-4)">
        <div class="spinner" style="width:32px;height:32px;border-width:3px"></div>
        <p style="color:var(--clr-text-muted);font-size:var(--fs-sm)">Gemini is analysing your spending…</p>
      </div>`;

    try {
      const data = await aiApi.summary(txs);
      renderSummary(responseArea, data.summary);
      showToast('AI summary ready ✓', 'success');
    } catch (err) {
      responseArea.innerHTML = `
        <div class="ai-placeholder">
          <div class="ai-emoji">⚠️</div>
          <p style="color:var(--clr-expense)">${err.message || 'Failed to generate summary. Check your GEMINI_API_KEY.'}</p>
        </div>`;
      showToast(err.message || 'AI summary failed', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>✨</span> Refresh Summary';
    }
  });
}

function renderSummary(container, text) {
  // Split into paragraphs on double newline or sentence boundaries
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  const timestamp = new Date().toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });

  container.innerHTML = `
    <div style="
      background: linear-gradient(135deg, rgba(124,106,247,0.06), rgba(91,78,240,0.03));
      border: 1px solid rgba(124,106,247,0.15);
      border-radius: var(--r-lg);
      padding: var(--sp-6);
      animation: fadeIn 0.4s ease;
    ">
      <div style="
        display:flex;
        align-items:center;
        gap:var(--sp-2);
        margin-bottom:var(--sp-4);
        font-size:var(--fs-xs);
        color:var(--clr-text-muted);
        font-weight:600;
        text-transform:uppercase;
        letter-spacing:0.06em;
      ">
        <span>🤖</span> AI Insights · ${timestamp}
      </div>
      <div class="ai-response">
        ${paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')}
      </div>
    </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
