function renderFundsPage() {
  const collected = DB.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const disbursed = DB.disbursements.reduce((sum, item) => sum + item.amount, 0);
  const balance = collected - disbursed;

  document.getElementById('fund-balance-display')?.textContent = peso(Math.max(0, balance));
  document.getElementById('fund-collected-display')?.textContent = peso(collected);
  document.getElementById('fund-disbursed-display')?.textContent = `− ${peso(disbursed)}`;

  const tbody = document.getElementById('disbursements-tbody');
  if (!tbody) return;
  if (!DB.disbursements.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">No disbursements recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = DB.disbursements
    .map(
      (item) => `
        <tr>
          <td>${item.purpose}</td>
          <td><span class="badge badge-info">${item.category}</span></td>
          <td style="color:var(--text-muted);font-size:12px;">${item.date}</td>
          <td style="font-weight:700;color:var(--red-600);">−${peso(item.amount)}</td>
          <td style="color:var(--text-muted);">${item.by}</td>
        </tr>`
    )
    .join('');
}

function addDisbursement() {
  const purpose = prompt('Disbursement purpose:');
  if (!purpose) return;
  const category = prompt('Category:', 'Financial Assistance');
  if (!category) return;
  const amountString = prompt('Amount:', '0');
  const amount = Number(amountString);
  if (!amount || amount <= 0) return;

  DB.disbursements.push({
    id: DB.nextId++,
    purpose: purpose.trim(),
    category: category.trim(),
    date: today(),
    amount,
    by: 'Admin',
  });
  renderFundsPage();
  toast('Disbursement recorded.');
}

function initSettingsPage() {
  if (window.location.pathname.split('/').pop() !== 'settings.html') return;
  document.getElementById('add-disbursement-btn')?.addEventListener('click', addDisbursement);
  renderFundsPage();
}

document.addEventListener('DOMContentLoaded', initSettingsPage);
