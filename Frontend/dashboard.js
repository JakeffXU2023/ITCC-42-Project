async function renderDashboardPage() {
  const [summary, categoryReport, detailedStudents, receipts] = await Promise.all([
    fetchReportSummary().catch(() => null),
    fetchReportByCategory().catch(() => []),
    fetchDetailedStudentReport().catch(() => []),
    fetchReceipts().catch(() => []),
  ]);

  const total = Number(summary?.totalReceiptsAmount || 0);
  const totalStudents = Number(summary?.totalStudents || 0);
  const paidStudents = detailedStudents.filter((student) => {
    const statuses = String(student.payment_statuses || '').split('|').map((item) => item.split(':')[1]);
    return statuses.length > 0 && statuses.every((status) => status === 'paid' || status === 'exempt');
  }).length;
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
        const gradeStudents = detailedStudents.filter((student) => student.grade === grade);
        const gradePaid = gradeStudents.filter((student) => {
          const statuses = String(student.payment_statuses || '').split('|').map((item) => item.split(':')[1]);
          return statuses.length > 0 && statuses.every((status) => status === 'paid' || status === 'exempt');
        }).length;
        const totalInGrade = gradeStudents.length;
        const pct = totalInGrade ? Math.round((gradePaid / totalInGrade) * 100) : 0;
        return `<div class="bar-row"><div class="bar-label">${grade.replace('Grade ', 'Gr. ')}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-pct">${pct}%</div></div>`;
      })
      .join('');
  }

  const feeGrid = document.getElementById('fee-summary-grid');
  if (feeGrid) {
    feeGrid.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">` +
      DB.fees
        .map((fee) => {
          const category = categoryReport.find((item) => item.category?.toLowerCase() === fee.name.toLowerCase());
          const totalCollected = Number(category?.total_amount_collected || 0);
          const paidCount = Number(category?.paid || 0);
          return `<div style="padding:10px 12px;border:1px solid var(--border-light);border-radius:var(--radius-md);"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${fee.name}</div><div style="font-size:14px;font-weight:700;">${peso(totalCollected)}</div><div style="font-size:11px;color:var(--text-muted);">${paidCount} students paid</div></div>`;
        })
        .join('') +
      `</div>`;
  }

  const transactionsBody = document.getElementById('recent-transactions');
  if (transactionsBody) {
    const recent = receipts.slice(0, 5);
    if (!recent.length) {
      transactionsBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;">No transactions yet.</td></tr>`;
    } else {
      transactionsBody.innerHTML = recent
        .map((receipt) => `
          <tr>
            <td style="font-weight:600;color:var(--blue-600);">${receipt.receipt_number}</td>
            <td>${receipt.student}</td>
            <td>${receipt.first_name && receipt.last_name ? `${receipt.grade} / Sec ${receipt.section}` : `${receipt.grade} / Sec ${receipt.section}`}</td>
            <td style="font-weight:600;">${peso(receipt.amount)}</td>
            <td style="color:var(--text-muted);font-size:12px;">${new Date(receipt.payment_date).toLocaleString('en-PH', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
            <td>${badgeHTML('paid')}</td>
          </tr>`)
        .join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.split('/').pop() === 'dashboard.html') {
    renderDashboardPage().catch((err) => {
      console.error('Dashboard load failed:', err);
    });
  }
});
