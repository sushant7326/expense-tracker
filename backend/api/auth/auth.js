const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

const db              = require('../../postgres-config');
const authenticateToken = require('./authenticateToken');

require('dotenv').config();

const JWT_SECRET   = process.env.JWT_SECRET;
const JWT_EXPIRES  = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS  = parseInt(process.env.SALT_ROUNDS) || 10;

// ── POST /auth/register ───────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING user_id, username, created_at',
      [username.trim(), password_hash]
    );

    return res.status(201).json({ status: 'success', data: result.rows[0] });

  } catch (error) {
    if (error.code === '23505')
      return res.status(409).json({ error: 'Username already taken.' });

    console.error('Register error:', error.message);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

// ── POST /auth/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  try {
    const result = await db.pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.trim()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid username or password.' });

    const user = result.rows[0];
    const is_valid = await bcrypt.compare(password, user.password_hash);

    if (!is_valid)
      return res.status(401).json({ error: 'Invalid username or password.' });

    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.json({ token, user_id: user.user_id, username: user.username });

  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

// ── GET /auth/me ──────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT user_id, username, created_at FROM users WHERE user_id = $1',
      [req.user_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found.' });

    return res.json({ status: 'success', data: result.rows[0] });

  } catch (error) {
    console.error('GET /auth/me error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ── PUT /auth/change-password ─────────────────────────────────
router.put('/change-password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Both current and new passwords are required.' });

  if (new_password.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });

  try {
    const result = await db.pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [req.user_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found.' });

    const is_valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!is_valid)
      return res.status(401).json({ error: 'Current password is incorrect.' });

    const new_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await db.pool.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [new_hash, req.user_id]
    );

    return res.json({ status: 'success', message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Change-password error:', error.message);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

// ── DELETE /auth/delete-user ──────────────────────────────────
router.delete('/delete-user', authenticateToken, async (req, res) => {
  const { password } = req.body;
  const user_id = req.user_id;

  if (!password)
    return res.status(400).json({ error: 'Password is required to delete account.' });

  try {
    const result = await db.pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found.' });

    const is_valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!is_valid)
      return res.status(401).json({ error: 'Invalid password.' });

    await db.pool.query('DELETE FROM users WHERE user_id = $1', [user_id]);

    return res.json({ status: 'success', message: `User ${user_id} deleted.` });

  } catch (error) {
    console.error('Delete-user error:', error.message);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

module.exports = router;
