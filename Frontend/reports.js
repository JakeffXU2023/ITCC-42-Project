let feeCategories = [];

function renderFeeCategories() {
  const container = document.getElementById('fee-categories-list');
  if (!container) return;
  container.innerHTML = feeCategories
    .map(
      (fee) => `
        <div class="fee-item">
          <div class="fee-item-left">
            <div class="fee-icon"><svg viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div>
              <div class="fee-name">${fee.name}</div>
              <div class="fee-scope">${fee.scope === 'All' ? 'All grade levels' : fee.scope}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="fee-amount">${peso(fee.amount)}</div>
            <span class="badge badge-info">Standard</span>
            <button class="btn btn-xs" type="button" data-action="edit" data-id="${fee.id}">Edit</button>
            <button class="btn btn-xs btn-danger" type="button" data-action="delete" data-id="${fee.id}">Delete</button>
          </div>
        </div>`
    )
    .join('');

  container.querySelectorAll('button[data-action]').forEach((button) => {
    const id = Number(button.dataset.id);
    button.addEventListener('click', async () => {
      const action = button.dataset.action;
      if (action === 'edit') await editFee(id);
      if (action === 'delete') await deleteFee(id);
    });
  });
}

async function loadFeeCategories() {
  feeCategories = await fetchFees().catch(() => DB.fees);
  renderFeeCategories();
}

async function openFeePrompt() {
  const name = prompt('Fee name:', 'New Fee');
  if (!name) return;
  const amountString = prompt('Amount:', '0');
  const amount = Number(amountString);
  if (Number.isNaN(amount) || amount < 0) return;
  const scope = prompt('Scope (All, Grade 10 & 12, Grade 7-10, Grade 11-12):', 'All');

  try {
    await createFee({ name: name.trim(), amount, scope: scope || 'All' });
    await loadFeeCategories();
    toast('Fee category saved.');
  } catch (err) {
    console.error(err);
    alert('Unable to save fee category.');
  }
}

async function editFee(id) {
  const fee = feeCategories.find((item) => item.id === id);
  if (!fee) return;
  const name = prompt('Edit fee name:', fee.name);
  if (!name) return;
  const amountString = prompt('Amount:', String(fee.amount));
  const amount = Number(amountString);
  if (Number.isNaN(amount) || amount < 0) return;
  const scope = prompt('Scope (All, Grade 10 & 12, Grade 7-10, Grade 11-12):', fee.scope);

  try {
    await updateFee(id, { name: name.trim(), amount, scope: scope || 'All' });
    await loadFeeCategories();
    toast('Fee category updated.');
  } catch (err) {
    console.error(err);
    alert('Unable to update fee category.');
  }
}

async function deleteFee(id) {
  if (!confirm('Delete this fee category?')) return;
  try {
    await deleteFeeApi(id);
    await loadFeeCategories();
    toast('Fee deleted.');
  } catch (err) {
    console.error(err);
    alert('Unable to delete fee category.');
  }
}

function initReportsPage() {
  if (window.location.pathname.split('/').pop() !== 'reports.html') return;
  document.getElementById('add-fee-btn')?.addEventListener('click', openFeePrompt);
  loadFeeCategories();
}

document.addEventListener('DOMContentLoaded', initReportsPage);
