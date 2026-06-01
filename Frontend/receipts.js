function formatReceiptFees(receipt) {
  const parts = [];
  if (receipt.lines && receipt.lines.length) {
    parts.push(...receipt.lines.map((line) => line.name + ' ' + peso(line.amount)));
  }
  if (receipt.exemptLines && receipt.exemptLines.length) {
    parts.push(...receipt.exemptLines.map((line) => line.name + ' (Exempt)'));
  }
  if (receipt.unpaidLines && receipt.unpaidLines.length) {
    parts.push(...receipt.unpaidLines.map((line) => line.name + ' (Unpaid)'));
  }
  if (parts.length) return parts.join(', ');
  return (receipt.fees || []).join(', ');
}

function renderReceiptsTable() {
  const searchText = (document.getElementById('receipts-search')?.value || '').trim().toLowerCase();
  const tbody = document.getElementById('receipts-tbody');
  if (!tbody) return;
  const records = DB.receipts.filter((receipt) => {
    if (!searchText) return true;
    return (
      receipt.student.toLowerCase().includes(searchText) ||
      receipt.grade.toLowerCase().includes(searchText) ||
      receipt.section.toLowerCase().includes(searchText) ||
      receipt.fees.join(', ').toLowerCase().includes(searchText) ||
      receipt.date.toLowerCase().includes(searchText)
    );
  });

  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px;">No receipts yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = records
    .map(
      (receipt) => `
        <tr>
          <td>#${receipt.id}</td>
          <td>${receipt.student}</td>
          <td>${receipt.grade} / ${typeof getSectionDisplayName === 'function' ? getSectionDisplayName(receipt.grade, receipt.section) : 'Sec ' + receipt.section}</td>
          <td>${formatReceiptFees(receipt)}</td>
          <td style="font-weight:700;">${peso(receipt.amount)}</td>
          <td style="color:var(--text-muted);font-size:12px;">${receipt.date}</td>
          <td style="display:flex;gap:6px;"><button class="btn btn-xs" type="button" data-id="${receipt.id}" data-action="view">View</button><button class="btn btn-xs btn-danger" type="button" data-id="${receipt.id}" data-action="delete">Delete</button></td>
        </tr>`
    )
    .join('');

  tbody.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);
      const action = button.dataset.action;
      if (action === 'delete') {
        deleteReceipt(id);
      }
      if (action === 'view') {
        alert(`Receipt #${id} details are in the table.`);
      }
    });
  });
}

async function deleteReceipt(id) {
  if (!confirm('Remove this receipt?')) return;
  const index = DB.receipts.findIndex((receipt) => receipt.id === id);
  if (index === -1) return;
  
  const receipt = DB.receipts[index];
  DB.receipts.splice(index, 1);
  
  try {
    await deleteReceiptApi(receipt.id || id);
    await saveDB();
    renderReceiptsTable();
    toast('Receipt deleted.');
  } catch (err) {
    console.error('Failed to delete receipt via API:', err);
    // Re-add if deletion fails
    DB.receipts.splice(index, 0, receipt);
    toast('Failed to delete receipt. Please try again.');
  }
}

async function initReceiptsPage() {
  if (window.location.pathname.split('/').pop() !== 'reciepts.html') return;
  try {
    if (typeof ensureDBReady === 'function') {
      await ensureDBReady();
    } else if (typeof initializeDB === 'function') {
      await initializeDB();
    }
    if (DB === null) {
      throw new Error('Backend not running');
    }
    document.getElementById('receipts-search')?.addEventListener('input', renderReceiptsTable);
    renderReceiptsTable();
  } catch (err) {
    console.error('Receipts page error:', err);
    const tbody = document.getElementById('receipts-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--red-600);font-weight:600;">Error: Backend not running</td></tr>';
    }
    document.getElementById('new-receipt-btn')?.setAttribute('disabled', 'disabled');
  }
}

window.renderReceiptsTable = renderReceiptsTable;

document.addEventListener('DOMContentLoaded', () => initReceiptsPage());
