let receiptRecords = [];

function getReceiptFeeAmount(receipt, feeName) {
  if (!receipt.fees || !Array.isArray(receipt.fees)) return '';
  if (!receipt.fees.includes(feeName)) return '';
  const fee = DB.fees.find((f) => f.name === feeName);
  return fee ? peso(fee.amount) : '';
}

function getReceiptStatus(receipt) {
  if (!receipt.fees || !receipt.fees.length) return 'Pending';
  return 'Paid';
}

function renderReceiptsTable() {
  const searchText = (document.getElementById('receipts-search')?.value || '').trim().toLowerCase();
  const tbody = document.getElementById('receipts-tbody');
  if (!tbody) return;
  const records = receiptRecords.filter((receipt) => {
    if (!searchText) return true;
    return (
      (receipt.student || '').toLowerCase().includes(searchText) ||
      (receipt.fees || []).join(', ').toLowerCase().includes(searchText) ||
      (receipt.payment_date || '').toLowerCase().includes(searchText)
    );
  });

  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px;">No receipts yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = records
    .map((receipt) => `
        <tr>
          <td>${receipt.student}</td>
          <td>${getReceiptFeeAmount(receipt, 'SPTA Membership')}</td>
          <td>${getReceiptFeeAmount(receipt, 'School Paper')}</td>
          <td>${getReceiptFeeAmount(receipt, 'School Organization')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Sports')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Insurance')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Graduation Fee')}</td>
          <td style="font-weight:700;">${peso(receipt.amount)}</td>
          <td>${getReceiptStatus(receipt)}</td>
        </tr>`)
    .join('');

  // No per-row actions in the updated receipt log table.

}

async function loadReceipts() {
  receiptRecords = await fetchReceipts().catch(() => []);
  renderReceiptsTable();
}

async function handleReceiptDelete(id) {
  if (!confirm('Remove this receipt?')) return;
  try {
    await deleteReceipt(id);
    receiptRecords = receiptRecords.filter((receipt) => receipt.id !== id);
    renderReceiptsTable();
    toast('Receipt deleted.');
  } catch (err) {
    console.error(err);
    alert('Failed to delete receipt.');
  }
}

function printReceiptRecord(receipt) {
  if (!receipt) return;

  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Receipt ${receipt.receipt_number}</title>
    <style>
      body{font-family:sans-serif;color:#111;margin:0;padding:20px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #bbb;padding:8px;text-align:left;font-size:12px;}
      th{background:#f4f4f4;}
      .title{text-align:center;font-size:18px;margin-bottom:12px;}
    </style>
  </head>
  <body>
    <div class="title">PTA Cashiering System — Receipt ${receipt.receipt_number}</div>
    <table>
      <thead>
        <tr>
          <th>Student name</th>
          <th>SPTA</th>
          <th>School paper</th>
          <th>School org</th>
          <th>Sports</th>
          <th>Insurance</th>
          <th>Graduation</th>
          <th>Total paid</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${receipt.student}</td>
          <td>${getReceiptFeeAmount(receipt, 'SPTA Membership')}</td>
          <td>${getReceiptFeeAmount(receipt, 'School Paper')}</td>
          <td>${getReceiptFeeAmount(receipt, 'School Organization')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Sports')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Insurance')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Graduation Fee')}</td>
          <td>${peso(receipt.amount)}</td>
          <td>${getReceiptStatus(receipt)}</td>
        </tr>
      </tbody>
    </table>
  </body>
  </html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Please allow popups to print receipts.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => win.print();
}

function printAllReceipts() {
  if (!receiptRecords.length) {
    alert('No receipts are available to print.');
    return;
  }

  const rows = receiptRecords.map((receipt) => `
        <tr>
          <td>${receipt.student}</td>
          <td>${getReceiptFeeAmount(receipt, 'SPTA Membership')}</td>
          <td>${getReceiptFeeAmount(receipt, 'School Paper')}</td>
          <td>${getReceiptFeeAmount(receipt, 'School Organization')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Sports')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Insurance')}</td>
          <td>${getReceiptFeeAmount(receipt, 'Graduation Fee')}</td>
          <td>${peso(receipt.amount)}</td>
          <td>${getReceiptStatus(receipt)}</td>
        </tr>`).join('');

  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Receipt Log</title>
    <style>
      body{font-family:sans-serif;color:#111;margin:0;padding:20px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #bbb;padding:8px;text-align:left;font-size:11px;}
      th{background:#f4f4f4;}
      tbody tr:nth-child(odd){background:#fafafa;}
      .title{text-align:center;font-size:16px;margin-bottom:12px;}
      @media print { body{margin:0;padding:10px;} table{page-break-inside:auto;} tr{page-break-inside:avoid;page-break-after:auto;} }
    </style>
  </head>
  <body>
    <div class="title">PTA Cashiering System — Receipts Log</div>
    <table>
      <thead>
        <tr>
          <th>Student name</th>
          <th>SPTA</th>
          <th>School paper</th>
          <th>School org</th>
          <th>Sports</th>
          <th>Insurance</th>
          <th>Graduation</th>
          <th>Total paid</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
  </html>`;

  const win = window.open('', '_blank', 'width=1200,height=900');
  if (!win) {
    alert('Please allow popups to print receipts.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => win.print();
}

function initReceiptsPage() {
  if (window.location.pathname.split('/').pop() !== 'reciepts.html') return;
  document.getElementById('receipts-search')?.addEventListener('input', renderReceiptsTable);
  document.getElementById('print-all-receipts')?.addEventListener('click', printAllReceipts);
  window.addEventListener('storage', (event) => {
    if (event.key === 'receipt-log-updated') {
      loadReceipts();
    }
  });
  if (window.BroadcastChannel) {
    const channel = new BroadcastChannel('receipt-log');
    channel.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'receipt-updated') {
        loadReceipts();
      }
    });
  }
  window.addEventListener('focus', () => {
    loadReceipts();
  });
  loadReceipts();
}

document.addEventListener('DOMContentLoaded', initReceiptsPage);
