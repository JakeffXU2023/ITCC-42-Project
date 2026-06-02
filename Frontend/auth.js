const AUTH_API_BASE = 'http://localhost:3001/api/auth';
const AUTH_SESSION_KEY = 'pta_cashier_session_user';

async function authFetch(endpoint, options = {}) {
  const response = await fetch(`${AUTH_API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API ${response.status} ${response.statusText}: ${error}`);
  }
  return response.json();
}

function getCurrentUser() {
  return sessionStorage.getItem(AUTH_SESSION_KEY) || '';
}

function isAuthenticated() {
  return Boolean(getCurrentUser());
}

function setAuthenticated(username) {
  if (username) {
    sessionStorage.setItem(AUTH_SESSION_KEY, username);
  } else {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  }
}

function showAuthError(message) {
  const errorEl = document.getElementById('login-error');
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

function clearAuthError() {
  const errorEl = document.getElementById('login-error');
  if (!errorEl) return;
  errorEl.classList.remove('show');
}

function updateUserBadge() {
  const username = getCurrentUser();
  const nameEl = document.querySelector('.user-name');
  const roleEl = document.querySelector('.user-role');
  const avatarEl = document.querySelector('.user-avatar');

  if (nameEl && username) {
    nameEl.textContent = username;
  }
  if (roleEl && username) {
    roleEl.textContent = 'Registered User';
  }
  if (avatarEl && username) {
    avatarEl.textContent = username.slice(0, 2).toUpperCase();
  }
}

async function loadAuthState() {
  try {
    return await authFetch('/status');
  } catch {
    return { hasAccount: false, username: '' };
  }
}

function setLoginMode(mode) {
  const isRegisterMode = mode === 'register';
  const modeLabel = document.getElementById('auth-mode-label');
  const modeNote = document.getElementById('auth-mode-note');
  const submitButton = document.getElementById('auth-submit-btn');
  const confirmGroup = document.getElementById('confirm-password-group');
  const helpText = document.getElementById('auth-help-text');

  if (modeLabel) modeLabel.textContent = isRegisterMode ? 'Create your account' : 'Sign in to continue';
  if (modeNote) {
    modeNote.textContent = isRegisterMode
      ? 'This is a one-time setup. After creating the account, use it to sign in.'
      : 'Enter the username and password you registered with.';
  }
  if (submitButton) submitButton.textContent = isRegisterMode ? 'Create Account' : 'Sign In';
  if (confirmGroup) confirmGroup.classList.toggle('hidden', !isRegisterMode);
  if (helpText) {
    helpText.textContent = isRegisterMode
      ? 'No account has been created yet.'
      : 'An account already exists on this system.';
  }
}

async function submitAuth() {
  clearAuthError();
  const mode = document.body?.dataset?.authMode || 'login';
  const username = (document.getElementById('login-user')?.value || '').trim();
  const password = (document.getElementById('login-pass')?.value || '').trim();
  const confirmPassword = (document.getElementById('login-pass-confirm')?.value || '').trim();

  if (!username || !password) {
    showAuthError('Username and password are required.');
    return;
  }

  try {
    if (mode === 'register') {
      await authFetch('/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, confirmPassword }),
      });
      document.body.dataset.authMode = 'login';
      setLoginMode('login');
      showAuthError('Account created. Please sign in.');
      document.getElementById('login-pass')?.focus();
      return;
    }

    const result = await authFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthenticated(result.username || username);
    window.location.href = 'dashboard.html';
  } catch (err) {
    const message = String(err?.message || '');
    if (message.includes('401')) {
      showAuthError('Invalid username or password.');
      return;
    }
    if (message.includes('Passwords do not match')) {
      showAuthError('Passwords do not match.');
      return;
    }
    if (message.includes('Username and password are required')) {
      showAuthError('Username and password are required.');
      return;
    }
    if (message.includes('409')) {
      showAuthError('An account already exists. Please sign in.');
      document.body.dataset.authMode = 'login';
      setLoginMode('login');
      return;
    }
    showAuthError('Authentication failed. Please try again.');
  }
}

function signOut() {
  setAuthenticated('');
  window.location.href = 'login.html';
}

function highlightNav() {
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach((nav) => {
    if (nav.getAttribute('href') === current) {
      nav.classList.add('active');
    } else {
      nav.classList.remove('active');
    }
  });
}

async function enforceLogin() {
  const page = window.location.pathname.split('/').pop();

  if (page === 'login.html') {
    const status = await loadAuthState();
    const mode = status.hasAccount ? 'login' : 'register';
    document.body.dataset.authMode = mode;
    setLoginMode(mode);
    clearAuthError();

    document.getElementById('login-pass')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitAuth();
    });
    document.getElementById('login-pass-confirm')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitAuth();
    });
    document.getElementById('login-user')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitAuth();
    });
    return;
  }

  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  updateUserBadge();
}

function initAuth() {
  enforceLogin();
  highlightNav();
}

window.submitAuth = submitAuth;
window.doLogin = submitAuth;
window.signOut = signOut;
window.addEventListener('DOMContentLoaded', initAuth);
