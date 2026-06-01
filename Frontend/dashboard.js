function renderDashboardPage() {
  const total = DB.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const totalStudents = DB.students.length;
  const paidStudents = DB.students.filter((student) => getStudentStatus(student) === 'paid').length;
  const paidPct = totalStudents ? Math.round((paidStudents / totalStudents) * 100) : 0;
  const disbursed = DB.disbursements.reduce((sum, item) => sum + item.amount, 0);
  const balance = total - disbursed;

  document.getElementById('stat-total')?.textContent = peso(total);
  document.getElementById('stat-students')?.textContent = totalStudents;
  document.getElementById('stat-paid')?.textContent = paidPct + '%';
  document.getElementById('stat-sub-paid')?.textContent = paidStudents + ' students';
  document.getElementById('stat-balance')?.textContent = peso(Math.max(0, balance));

  const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const barsEl = document.getElementById('grade-bars');
  if (barsEl) {
    barsEl.innerHTML = grades
      .map((grade) => {
        const students = DB.students.filter((student) => student.grade === grade);
        const paidCount = students.filter((student) => getStudentStatus(student) === 'paid').length;
        const pct = students.length ? Math.round((paidCount / students.length) * 100) : 0;
        return `<div class="bar-row"><div class="bar-label">${grade.replace('Grade ', 'Gr. ')}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-pct">${pct}%</div></div>`;
      })
      .join('');
  }

  const feeGrid = document.getElementById('fee-summary-grid');
  if (feeGrid) {
    feeGrid.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">` +
      DB.fees
        .map((fee) => {
          const key = feeKey(fee.name);
          const paidCount = DB.students.filter((student) => student.payments[key] === 'paid').length;
          const totalCollected = paidCount * fee.amount;
          return `<div style="padding:10px 12px;border:1px solid var(--border-light);border-radius:var(--radius-md);"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${fee.name}</div><div style="font-size:14px;font-weight:700;">${peso(totalCollected)}</div><div style="font-size:11px;color:var(--text-muted);">${paidCount} students paid</div></div>`;
        })
        .join('') +
      `</div>`;
  }

  const transactionsBody = document.getElementById('recent-transactions');
  if (transactionsBody) {
    const recent = [...DB.receipts].reverse().slice(0, 5);
    if (!recent.length) {
      transactionsBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;">No transactions yet.</td></tr>`;
    } else {
      transactionsBody.innerHTML = recent
        .map((receipt) => `
          <tr>
            <td style="font-weight:600;color:var(--blue-600);">#${receipt.id}</td>
            <td>${receipt.student}</td>
            <td>${receipt.grade} / Sec ${receipt.section}</td>
            <td style="font-weight:600;">${peso(receipt.amount)}</td>
            <td style="color:var(--text-muted);font-size:12px;">${receipt.date}</td>
            <td>${badgeHTML(receipt.status || 'paid')}</td>
          </tr>
        `)
        .join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.location.pathname.split('/').pop() === 'dashboard.html') {
    try {
      if (typeof ensureDBReady === 'function') {
        await ensureDBReady();
      } else if (typeof initializeDB === 'function') {
        await initializeDB();
      }
      if (DB === null) {
        throw new Error('Backend not running');
      }
      renderDashboardPage();
    } catch (err) {
      console.error('Dashboard error:', err);
      const mainContent = document.querySelector('main') || document.body;
      mainContent.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red-600);font-weight:600;font-size:18px;">Error: Backend not running</div>';
    }
  }
});
