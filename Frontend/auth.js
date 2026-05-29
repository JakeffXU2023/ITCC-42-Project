const AUTH_KEY = 'pta_cashier_auth';
const VALID_CREDENTIALS = { username: 'admin', password: '1234' };

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function setAuthenticated(value) {
  if (value) {
    localStorage.setItem(AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

function showLoginError(message) {
  const errorEl = document.getElementById('login-error');
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

function clearLoginError() {
  const errorEl = document.getElementById('login-error');
  if (!errorEl) return;
  errorEl.classList.remove('show');
}

function doLogin() {
  const username = (document.getElementById('login-user')?.value || '').trim();
  const password = (document.getElementById('login-pass')?.value || '').trim();

  if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
    setAuthenticated(true);
    window.location.href = 'dashboard.html';
    return;
  }

  showLoginError('Invalid username or password.');
}

function signOut() {
  setAuthenticated(false);
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

function enforceLogin() {
  const page = window.location.pathname.split('/').pop();

  if (page === 'login.html') {
    if (isAuthenticated()) {
      window.location.href = 'dashboard.html';
      return;
    }
    clearLoginError();
    document.getElementById('login-pass')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        doLogin();
      }
    });
    document.getElementById('login-user')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        doLogin();
      }
    });
    return;
  }

  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

function initAuth() {
  enforceLogin();
  highlightNav();
}

window.addEventListener('DOMContentLoaded', initAuth);
