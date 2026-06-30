/* ─────────────────────────────────────────────────────────────
   auth.js  —  Login / Register page logic
   ───────────────────────────────────────────────────────────── */

import { auth, setToken, setUser, isLoggedIn } from './api.js';

/* Redirect if already logged in */
if (isLoggedIn()) {
  window.location.href = 'dashboard.html';
}


/* ── DOM References ── */
const tabLogin    = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

const loginForm    = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const loginError    = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

/* ── Tab switching ── */
function setActiveTab(tab) {
  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.hidden    = false;
    registerForm.hidden = true;
    clearErrors();
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.hidden = false;
    loginForm.hidden    = true;
    clearErrors();
  }
}

tabLogin.addEventListener('click',    () => setActiveTab('login'));
tabRegister.addEventListener('click', () => setActiveTab('register'));

/* ── Helpers ── */
function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('visible');
}

function clearErrors() {
  [loginError, registerError].forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  const span = btn.querySelector('.btn-label');
  const spin = btn.querySelector('.spinner');
  if (loading) {
    span.style.opacity = '0.4';
    spin.style.display = 'inline-block';
  } else {
    span.style.opacity = '1';
    spin.style.display = 'none';
  }
}

/* ── Password visibility toggle ── */
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.querySelector('.eye-icon').textContent = isHidden ? '🙈' : '👁️';
  });
});

/* ── Login ── */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');

  if (!username || !password) {
    return showError(loginError, 'Please fill in all fields.');
  }

  setLoading(btn, true);

  try {
    const data = await auth.login(username, password);
    setToken(data.token);
    setUser({ user_id: data.user_id, username: data.username });
    window.location.href = 'dashboard.html';
  } catch (err) {
    showError(loginError, err.message || 'Login failed. Please try again.');
  } finally {
    setLoading(btn, false);
  }
});

/* ── Register ── */
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const username  = document.getElementById('reg-username').value.trim();
  const password  = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  const btn       = document.getElementById('register-btn');

  if (!username || !password || !password2) {
    return showError(registerError, 'Please fill in all fields.');
  }
  if (password.length < 6) {
    return showError(registerError, 'Password must be at least 6 characters.');
  }
  if (password !== password2) {
    return showError(registerError, 'Passwords do not match.');
  }

  setLoading(btn, true);

  try {
    await auth.register(username, password);
    // Auto-login after registration
    const loginData = await auth.login(username, password);
    setToken(loginData.token);
    setUser({ user_id: loginData.user_id, username: loginData.username });
    window.location.href = 'dashboard.html';

  } catch (err) {
    showError(registerError, err.message || 'Registration failed. Please try again.');
  } finally {
    setLoading(btn, false);
  }
});
