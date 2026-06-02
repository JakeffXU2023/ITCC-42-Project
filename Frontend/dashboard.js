async function renderDashboardPage() {
  if (typeof syncGradeSections === 'function') {
    await syncGradeSections();
  }

  const [summary, categoryReport, detailedStudents, receipts, fees] = await Promise.all([
    fetchReportSummary().catch(() => null),
    fetchReportByCategory().catch(() => []),
    fetchDetailedStudentReport().catch(() => []),
    fetchReceipts().catch(() => []),
    fetchFees().catch(() => DB.fees),
  ]);

  const total = Number(summary?.totalReceiptsAmount || 0);
  const totalStudents = Number(summary?.totalStudents || 0);
  const disbursed = Number(summary?.totalDisbursementsAmount || 0);
  const balance = Number(summary?.netAmount ?? (total - disbursed));

  const paidStudents = detailedStudents.filter((student) => {
    const statuses = String(student.payment_statuses || '').split('|').map((item) => item.split(':')[1]);
    const paymentStatus = determinePaymentStatus(statuses);
    return paymentStatus === 'paid' || paymentStatus === 'overpaid';
  }).length;
  const paidPct = totalStudents ? Math.round((paidStudents / totalStudents) * 100) : 0;
  const totalSections = Object.values(GRADE_SECTIONS || {}).reduce((sum, count) => sum + Number(count || 0), 0);

  const statTotal = document.getElementById('stat-total');
  const statStudents = document.getElementById('stat-students');
  const statPaid = document.getElementById('stat-paid');
  const statSubTotal = document.getElementById('stat-sub-total');
  const statSubPaid = document.getElementById('stat-sub-paid');
  const statBalance = document.getElementById('stat-balance');
  const statSubBalance = document.getElementById('stat-sub-balance');

  if (statTotal) statTotal.textContent = peso(total);
  if (statSubTotal) statSubTotal.textContent = disbursed ? `Disbursed ${peso(disbursed)}` : 'No disbursements yet';
  if (statStudents) statStudents.textContent = totalStudents;
  if (statPaid) statPaid.textContent = paidPct + '%';
  if (statSubPaid) statSubPaid.textContent = `${paidStudents} students`;
  if (statBalance) statBalance.textContent = peso(Math.max(0, balance));
  if (statSubBalance) statSubBalance.textContent = disbursed ? 'After disbursements' : 'No disbursements';

  const statSections = document.getElementById('stat-sections');
  if (statSections) statSections.textContent = `Across ${totalSections} sections`;

  const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const barsEl = document.getElementById('grade-bars');
  if (barsEl) {
    barsEl.innerHTML = grades
      .map((grade) => {
        const gradeStudents = detailedStudents.filter((student) => String(student.grade) === grade);
        const gradePaid = gradeStudents.filter((student) => {
          const statuses = String(student.payment_statuses || '').split('|').map((item) => item.split(':')[1]);
          const overallStatus = determinePaymentStatus(statuses);
          return overallStatus === 'paid' || overallStatus === 'overpaid';
        }).length;
        const totalInGrade = gradeStudents.length;
        const pct = totalInGrade ? Math.round((gradePaid / totalInGrade) * 100) : 0;
        return `<div class="bar-row"><div class="bar-label">${grade.replace('Grade ', 'Gr. ')}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-pct">${pct}%</div></div>`;
      })
      .join('');
  }

  const feeGrid = document.getElementById('fee-summary-grid');
  if (feeGrid) {
    const categoryMap = categoryReport.reduce((map, item) => {
      if (item?.category) {
        map[item.category.toLowerCase()] = item;
      }
      return map;
    }, {});

    const cards = fees.map((fee) => {
      const category = categoryMap[fee.name?.toLowerCase()];
      const totalCollected = Number(category?.total_amount_collected || 0);
      const paidCount = Number(category?.paid || 0);
      return `<div style="padding:10px 12px;border:1px solid var(--border-light);border-radius:var(--radius-md);"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${fee.name}</div><div style="font-size:14px;font-weight:700;">${peso(totalCollected)}</div><div style="font-size:11px;color:var(--text-muted);">${paidCount} students paid</div></div>`;
    });

    const extraCategories = categoryReport.filter((item) => {
      return item?.category && !fees.some((fee) => fee.name?.toLowerCase() === item.category.toLowerCase());
    }).map((item) => {
      return `<div style="padding:10px 12px;border:1px solid var(--border-light);border-radius:var(--radius-md);"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${item.category}</div><div style="font-size:14px;font-weight:700;">${peso(Number(item.total_amount_collected || 0))}</div><div style="font-size:11px;color:var(--text-muted);">${Number(item.paid || 0)} students paid</div></div>`;
    });

    const content = cards.concat(extraCategories).join('');
    feeGrid.innerHTML = content ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${content}</div>` : `<div style="color:var(--text-muted);padding:24px;text-align:center;">No fee collection data available.</div>`;
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
            <td>${receipt.student || `${receipt.last_name || ''}, ${receipt.first_name || ''}`.trim()}</td>
            <td>${receipt.grade || 'N/A'} / Sec ${receipt.section || 'N/A'}</td>
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
