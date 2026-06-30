/* ─────────────────────────────────────────────────────────────
   ai.js  —  POST /ai/summary  (Gemini Flash)
   ───────────────────────────────────────────────────────────── */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();
const authenticateToken = require('../auth/authenticateToken');

require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── POST /ai/summary ────────────────────────────────────────────────────────
router.post('/summary', authenticateToken, async (req, res) => {
  const { transactions } = req.body;

  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'No transactions provided.' });
  }

  // ── Build structured prompt ──────────────────────────────────────────────
  const expenses = transactions.filter(t => t.expense);
  const incomes  = transactions.filter(t => !t.expense);

  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome  = incomes.reduce((s, t) => s + Number(t.amount), 0);
  const netBalance   = totalIncome - totalExpense;

  // Aggregate expenses by category
  const catTotals = {};
  expenses.forEach(t => {
    const cat = t.category ?? 'Other';
    catTotals[cat] = (catTotals[cat] ?? 0) + Number(t.amount);
  });

  const catBreakdown = Object.entries(catTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `  - ${cat}: ₹${amt.toLocaleString('en-IN')}`)
    .join('\n');

  // Recent transactions snippet (latest 15)
  const recentSnippet = transactions
    .slice()
    .sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time))
    .slice(0, 15)
    .map(t => `  [${t.expense ? 'EXP' : 'INC'}] ₹${t.amount} | ${t.category ?? 'Other'} | ${t.title}`)
    .join('\n');

  const prompt = `You are a friendly personal finance assistant helping an Indian user understand their spending habits.

Here is their financial data:

SUMMARY:
- Total Income:  ₹${totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${totalExpense.toLocaleString('en-IN')}
- Net Balance:   ₹${netBalance.toLocaleString('en-IN')}

EXPENSES BY CATEGORY:
${catBreakdown || '  (no expense data)'}

RECENT TRANSACTIONS (latest 15):
${recentSnippet}

Please provide a concise, personalised financial summary (3–5 sentences) that:
1. Highlights the biggest spending category and any notable patterns
2. Compares income vs expenses and the savings rate
3. Gives 2–3 actionable, specific tips relevant to the actual data
4. Uses a warm, encouraging tone — not preachy

Keep it under 200 words. Use plain text, no markdown headers or bullet points.`;

  // ── Call Gemini ──────────────────────────────────────────────────────────
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const result = await model.generateContent(prompt);
    const text   = result.response.text();

    return res.json({ status: 'success', summary: text });

  } catch (error) {
    console.error('Gemini API error:', error.message);

    // Friendly error if API key not set
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    return res.status(500).json({ error: 'Failed to generate AI summary. Please try again.' });
  }
});

module.exports = router;
