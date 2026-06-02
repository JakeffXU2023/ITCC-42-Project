const SETTINGS_API_BASE = 'http://localhost:3001/api';
const GRADE_LIST = [7, 8, 9, 10, 11, 12];

let currentDisbursements = [];
let currentSectionCounts = {};

function normalizeSchoolYear(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{4})$/);
  if (!match) return '';

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) return '';

  return `${startYear}-${endYear}`;
}

function setBrandYearText(schoolYear) {
  document.querySelectorAll('.brand-year').forEach((element) => {
    element.textContent = `SY ${schoolYear}`;
  });
}

async function apiGet(pathname) {
  const response = await fetch(`${SETTINGS_API_BASE}${pathname}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}

async function apiSend(pathname, method, body) {
  const response = await fetch(`${SETTINGS_API_BASE}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}

async function loadSchoolYear() {
  const data = await apiGet('/settings/school-year');
  return normalizeSchoolYear(data.schoolYear) || '2024-2025';
}

async function saveSchoolYear() {
  const input = document.getElementById('school-year-input');
  const schoolYear = normalizeSchoolYear(input?.value);
  if (!schoolYear) {
    toast('Enter a valid school year like 2025-2026.');
    return;
  }

  await apiSend('/settings/school-year', 'PUT', { schoolYear });
  setBrandYearText(schoolYear);
  toast(`School year switched to SY ${schoolYear}.`);
}

async function loadSectionSettings() {
  try {
    const data = await apiGet('/settings/sections');
    currentSectionCounts = data.sections || {};
    if (typeof setGradeSections === 'function') {
      setGradeSections(currentSectionCounts);
    }
  } catch (err) {
    console.warn(err);
  }
  renderSectionSettings();
}

async function changeSectionCount(grade, delta) {
  await apiSend(`/settings/sections/${grade}`, 'PUT', { delta });
  await loadSectionSettings();
  toast(`Grade ${grade} section count updated.`);
}

function renderSectionSettings() {
  const grid = document.getElementById('section-settings-grid');
  if (!grid) return;

  grid.innerHTML = GRADE_LIST.map((grade) => {
    const count = Number(currentSectionCounts[grade] || 0);
    const canRemove = count > 1;
    const canAdd = count < 13;
    return `
      <div class="section-setting-row" style="display:grid;grid-template-columns:120px 1fr auto;gap:10px;align-items:center;padding:12px 14px;border:1px solid var(--border-light);border-radius:var(--radius-md);">
        <div>
          <div style="font-weight:700;color:var(--text-primary);">Grade ${grade}</div>
          <div style="font-size:12px;color:var(--text-muted);">Current sections</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button type="button" class="btn btn-sm section-count-btn" data-grade="${grade}" data-delta="-1" ${canRemove ? '' : 'disabled'}>−</button>
          <div style="min-width:54px;text-align:center;font-size:18px;font-weight:700;color:var(--blue-800);">${count}</div>
          <button type="button" class="btn btn-sm section-count-btn" data-grade="${grade}" data-delta="1" ${canAdd ? '' : 'disabled'}>+</button>
        </div>
        <div style="font-size:12px;color:var(--text-muted);text-align:right;">Min 1, max 13</div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.section-count-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const grade = Number(button.dataset.grade);
      const delta = Number(button.dataset.delta);
      try {
        await changeSectionCount(grade, delta);
      } catch (err) {
        console.error(err);
        toast(err.message || 'Unable to update section count.');
      }
    });
  });
}

function renderDefaultSectionSettings() {
  if (!Object.keys(currentSectionCounts).length) {
    currentSectionCounts = { 7: 12, 8: 13, 9: 10, 10: 11, 11: 13, 12: 13 };
  }
  renderSectionSettings();
}

async function loadFundData() {
  const [summary, disbursements] = await Promise.all([
    apiGet('/reports/summary'),
    apiGet('/disbursements'),
  ]);

  currentDisbursements = Array.isArray(disbursements) ? disbursements : [];

  const balance = Number(summary.totalReceiptsAmount || 0) - Number(summary.totalDisbursementsAmount || 0);
  const balanceDisplay = document.getElementById('fund-balance-display');
  const collectedDisplay = document.getElementById('fund-collected-display');
  const disbursedDisplay = document.getElementById('fund-disbursed-display');

  if (balanceDisplay) balanceDisplay.textContent = peso(Math.max(0, balance));
  if (collectedDisplay) collectedDisplay.textContent = peso(Number(summary.totalReceiptsAmount || 0));
  if (disbursedDisplay) disbursedDisplay.textContent = `− ${peso(Number(summary.totalDisbursementsAmount || 0))} disbursed`;
}

function renderFundsPage() {
  const tbody = document.getElementById('disbursements-tbody');
  if (!tbody) return;

  if (!currentDisbursements.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">No disbursements recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentDisbursements
    .map(
      (item) => `
        <tr>
          <td>${item.purpose}</td>
          <td><span class="badge badge-info">${item.category}</span></td>
          <td style="color:var(--text-muted);font-size:12px;">${new Date(item.disbursement_date || item.created_at || Date.now()).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
          <td style="font-weight:700;color:var(--red-600);">−${peso(item.amount)}</td>
          <td style="color:var(--text-muted);">${item.created_by || 'Admin'}</td>
        </tr>`
    )
    .join('');
}

async function addDisbursement() {
  const purpose = prompt('Disbursement purpose:');
  if (!purpose) return;
  const category = prompt('Category:', 'Financial Assistance');
  if (!category) return;
  const amountString = prompt('Amount:', '0');
  const amount = Number(amountString);
  if (!amount || amount <= 0) return;

  await apiSend('/disbursements', 'POST', {
    purpose: purpose.trim(),
    category: category.trim(),
    amount,
    created_by: 'Admin',
  });

  await refreshFunds();
  toast('Disbursement recorded.');
}

async function refreshFunds() {
  await loadFundData();
  renderFundsPage();
}

async function initSettingsPage() {
  if (window.location.pathname.split('/').pop() !== 'settings.html') return;

  document.getElementById('add-disbursement-btn')?.addEventListener('click', async () => {
    try {
      await addDisbursement();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Unable to record disbursement.');
    }
  });

  document.getElementById('save-school-year-btn')?.addEventListener('click', async () => {
    try {
      await saveSchoolYear();
      await refreshFunds();
      await loadSectionSettings();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Unable to update school year.');
    }
  });

  try {
    const schoolYear = await loadSchoolYear();
    const input = document.getElementById('school-year-input');
    if (input) input.value = schoolYear;
    setBrandYearText(schoolYear);
  } catch (err) {
    console.warn(err);
  }

  try {
    renderDefaultSectionSettings();
    await loadSectionSettings();
  } catch (err) {
    console.warn(err);
  }

  try {
    await refreshFunds();
  } catch (err) {
    console.warn(err);
  }
}

document.addEventListener('DOMContentLoaded', initSettingsPage);
