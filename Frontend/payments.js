let selectedStudent = null;
let paymentStudents = [];
let siblingLastNames = [];
let siblingDiscountEnabled = false;
let selectedSiblingLastName = '';

function getGradeValue() {
  return document.getElementById('pay-grade')?.value || '';
}

function getSectionValue() {
  return document.getElementById('pay-section')?.value || '';
}

function getSelectedSiblingLastName() {
  return document.getElementById('pay-sibling-lastname')?.value || '';
}

function isSiblingDiscountApplicable() {
  if (!siblingDiscountEnabled || !selectedStudent) return false;
  const selectedLastName = String(selectedSiblingLastName || '').trim().toLowerCase();
  const studentLastName = String(selectedStudent.last || '').trim().toLowerCase();
  return Boolean(selectedLastName) && selectedLastName === studentLastName;
}

function getFeeDueAmount(fee) {
  const baseAmount = Number(fee.amount || 0);
  if (!selectedStudent) {
    return baseAmount;
  }

  const studentKeyValue = Number(selectedStudent[feeKey(fee.name)]);
  if (Number.isFinite(studentKeyValue) && studentKeyValue > 0) {
    return studentKeyValue;
  }

  return baseAmount;
}

function getPaymentOutcome(totalPaid, totalDue) {
  if (totalDue <= 0) return 'Fully Paid';
  if (totalPaid <= 0) return 'Not paid';
  if (totalPaid < totalDue) return 'Partially Paid';
  if (totalPaid === totalDue) return 'Fully Paid';
  return 'Overpaid';
}

function getPaymentStatusValue(amountPaid, dueAmount) {
  if (dueAmount <= 0) return amountPaid <= 0 ? 'exempt' : 'overpaid';
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid < dueAmount) return 'partial';
  if (amountPaid === dueAmount) return 'paid';
  return 'overpaid';
}

function updatePaymentStatusIndicator(totalPaid = null, totalDue = null) {
  const indicator = document.getElementById('pay-total-status');
  if (!indicator) return;

  if (totalPaid == null || totalDue == null) {
    indicator.textContent = 'Not paid';
    return;
  }

  indicator.textContent = getPaymentOutcome(totalPaid, totalDue);
}

function setSiblingDiscountControlsVisibility() {
  const controls = document.getElementById('pay-sibling-controls');
  if (!controls) return;
  controls.style.display = siblingDiscountEnabled ? 'block' : 'none';
}

function populateSiblingLastNames() {
  const select = document.getElementById('pay-sibling-lastname');
  if (!select) return;

  const options = siblingLastNames.length
    ? siblingLastNames
        .map((lastName) => `<option value="${lastName}">${lastName}</option>`)
        .join('')
    : '<option value="">No sibling names found</option>';

  const currentValue = select.value;
  select.innerHTML = `<option value="">Select sibling last name</option>${options}`;
  if (currentValue && siblingLastNames.includes(currentValue)) {
    select.value = currentValue;
  }
}

async function loadSiblingLastNames() {
  const records = await fetchSiblingStudents().catch(() => []);
  const names = new Set(
    records
      .map((student) => String(student.last_name || student.last || '').trim())
      .filter(Boolean)
  );
  siblingLastNames = Array.from(names).sort((left, right) => left.localeCompare(right));
  populateSiblingLastNames();
}

function updatePaySections() {
  const grade = getGradeValue();
  const sectionSelect = document.getElementById('pay-section');
  if (!sectionSelect || !grade) return;
  sectionSelect.innerHTML = '';
  const count = GRADE_SECTIONS[Number(grade)] || 0;
  for (let i = 1; i <= count; i += 1) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `Section ${i}`;
    sectionSelect.appendChild(option);
  }
  if (sectionSelect.options.length) {
    sectionSelect.selectedIndex = 0;
  }
}

async function loadPaymentStudentsForSection(grade, section) {
  const list = document.getElementById('pay-student-list');
  if (!list) return;
  if (!grade || !section) {
    paymentStudents = [];
    list.innerHTML = '<div style="padding:10px;color:var(--text-muted);">Choose a grade and section to load students.</div>';
    return;
  }

  selectedStudent = null;
  const studentInput = document.getElementById('pay-student');
  if (studentInput) studentInput.value = '';

  let students = await fetchStudentsByGradeSection(grade, section).catch(() => []);
  if (!students.length) {
    const allStudents = await fetchStudents().catch(() => []);
    const normalizedGrade = normalizeGradeValue(grade);
    students = allStudents.filter((student) => {
      return (
        normalizeGradeValue(student.grade) === normalizedGrade &&
        String(student.section) === String(section)
      );
    });
  }

  paymentStudents = students.map(normalizeStudent);
  renderPayStudentList();
}

function renderPayStudentList() {
  const list = document.getElementById('pay-student-list');
  if (!list) return;
  if (!getGradeValue() || !getSectionValue()) {
    list.innerHTML = '<div style="padding:10px;color:var(--text-muted);">Choose a grade and section to load students.</div>';
    return;
  }

  if (!paymentStudents.length) {
    list.innerHTML = '<div style="padding:10px;color:var(--text-muted);">No students found for this grade and section.</div>';
    return;
  }

  list.innerHTML = paymentStudents
    .map((student) => `
      <button class="btn btn-sm pay-student-item ${selectedStudent?.id === student.id ? 'active' : ''}" type="button" data-id="${student.id}">
        ${student.last}, ${student.first}
      </button>
    `)
    .join('');

  list.querySelectorAll('.pay-student-item').forEach((button) => {
    button.addEventListener('click', async () => {
      const studentId = Number(button.dataset.id);
      await selectPaymentStudent(studentId);
    });
  });
}

async function selectPaymentStudent(studentId) {
  const student = paymentStudents.find((item) => item.id === studentId);
  if (!student) return;
  const details = await fetchStudentDetails(studentId).catch(() => student);
  selectedStudent = normalizeStudent(details);
  const studentInput = document.getElementById('pay-student');
  const gradeSelect = document.getElementById('pay-grade');
  const sectionSelect = document.getElementById('pay-section');
  if (studentInput) studentInput.value = `${selectedStudent.last}, ${selectedStudent.first}`;
  if (gradeSelect) gradeSelect.value = selectedStudent.grade;
  if (sectionSelect) {
    updatePaySections();
    sectionSelect.value = selectedStudent.section;
  }
  renderPayStudentList();
  renderPayFeeList();
  calculatePayTotal();
}

function renderPayFeeList() {
  const feeList = document.getElementById('pay-fee-list');
  const grade = getGradeValue();
  if (!feeList) return;
  if (!grade) {
    feeList.innerHTML = '<div style="color:var(--text-muted);">Select a grade to load fees.</div>';
    updatePaymentStatusIndicator();
    return;
  }

  const fees = feesForGrade(grade);
  const siblingDiscountActive = isSiblingDiscountApplicable();
  feeList.innerHTML = fees
    .map((fee) => {
      const key = feeKey(fee.name);
      const dueAmount = getFeeDueAmount(fee);
      const currentStatus = selectedStudent?.payments?.[key] || 'unpaid';
      const isSiblingDiscountedFee = siblingDiscountActive && (key === 'spta' || key === 'school_paper');
      const settled = currentStatus === 'paid' || currentStatus === 'overpaid';
      const isInsuranceCutOff = key === 'insurance' && selectedStudent?.insurance_choice === 'cut_off';
      const amountValue = (isInsuranceCutOff || isSiblingDiscountedFee) ? 0 : dueAmount;
      const displayStatus = isSiblingDiscountedFee ? 'Sibling discount' : (isInsuranceCutOff ? 'Cut-Off' : currentStatus);
      return `
        <label class="pay-fee-row" data-fee-id="${fee.id}" data-due-amount="${dueAmount}">
          <span class="pay-fee-label">
            <input type="checkbox" data-fee-id="${fee.id}" ${settled || isInsuranceCutOff || isSiblingDiscountedFee ? 'checked' : ''} ${settled || isInsuranceCutOff || isSiblingDiscountedFee ? 'disabled' : ''}>
            <span>${fee.name}</span>
          </span>
          <span class="pay-fee-meta">Due: ${isSiblingDiscountedFee ? '₱0.00' : (isInsuranceCutOff ? 'Cut-Off' : peso(dueAmount))}</span>
          <input class="form-control pay-fee-amount" type="number" min="0" step="0.01" value="${amountValue}" ${settled || isInsuranceCutOff || isSiblingDiscountedFee ? 'disabled' : ''} aria-label="${fee.name} amount">
          <span class="pay-fee-meta">${displayStatus}</span>
        </label>`;
    })
    .join('');

  feeList.querySelectorAll('input[type=checkbox], .pay-fee-amount').forEach((input) => {
    input.addEventListener('change', calculatePayTotal);
    input.addEventListener('input', calculatePayTotal);
  });

  calculatePayTotal();
}

function calculatePayTotal() {
  const feeList = document.getElementById('pay-fee-list');
  const totalEl = document.getElementById('pay-total');
  if (!feeList || !totalEl) return 0;

  const rowElements = feeList.querySelectorAll('.pay-fee-row[data-fee-id]');
  let totalPaid = 0;
  let totalDue = 0;

  rowElements.forEach((row) => {
    const checkbox = row.querySelector('input[type=checkbox]');
    const amountInput = row.querySelector('.pay-fee-amount');
    const dueAmount = Number(row.dataset.dueAmount || 0);
    const amountPaid = Number(amountInput?.value || 0);

    if (checkbox?.checked) {
      totalDue += dueAmount;
      totalPaid += amountPaid;
    }
  });

  totalEl.textContent = peso(totalPaid);
  updatePaymentStatusIndicator(totalPaid, totalDue);
  return totalPaid;
}

function getSelectedFeeRows() {
  const feeList = document.getElementById('pay-fee-list');
  if (!feeList) return [];

  return Array.from(feeList.querySelectorAll('.pay-fee-row[data-fee-id]'))
    .map((row) => {
      const checkbox = row.querySelector('input[type=checkbox]');
      const amountInput = row.querySelector('.pay-fee-amount');
      const fee = getFeeById(Number(row.dataset.feeId));
      const dueAmount = Number(row.dataset.dueAmount || fee?.amount || 0);
      const amountPaid = Number(amountInput?.value || 0);
      return {
        fee,
        dueAmount,
        amountPaid,
        checked: Boolean(checkbox?.checked),
      };
    })
    .filter((item) => item.checked && item.fee);
}

function buildReceiptHtml(receiptNumber, student, checkedFees, total) {
  const items = checkedFees
    .map((item) => `<tr><td>${item.fee.name}</td><td style="text-align:right;">${peso(item.amountPaid)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${receiptNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 20px; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .title { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    .sub { color: #555; margin-bottom: 18px; }
    .meta { margin-bottom: 14px; }
    .meta div { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
    th { text-align: left; background: #f6f6f6; }
    .total { margin-top: 14px; font-size: 16px; font-weight: 700; text-align: right; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="title">PTA Cashiering System - Official Receipt</div>
    <div class="sub">${receiptNumber}</div>
    <div class="meta">
      <div><strong>Student:</strong> ${student.last}, ${student.first}</div>
      <div><strong>Grade/Section:</strong> Grade ${student.grade} - Section ${student.section}</div>
      <div><strong>Date:</strong> ${nowStr()}</div>
    </div>
    <table>
      <thead><tr><th>Fee</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
    <div class="total">Total Paid: ${peso(total)}</div>
  </div>
</body>
</html>`;
}

function downloadReceiptPdf(receiptNumber, student, checkedFees, total) {
  const html = buildReceiptHtml(receiptNumber, student, checkedFees, total);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Please allow popups to save the receipt as PDF.');
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
}

async function processPayment() {
  if (!selectedStudent) {
    alert('Choose a student first.');
    return;
  }

  const selectedFeeRows = getSelectedFeeRows();
  if (!selectedFeeRows.length) {
    alert('Select at least one fee.');
    return;
  }

  const total = calculatePayTotal();
  if (!total && !selectedFeeRows.some((item) => Number(item.dueAmount || 0) <= 0)) {
    alert('Enter at least one payment amount.');
    return;
  }

  const paymentOutcome = getPaymentOutcome(
    selectedFeeRows.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0),
    selectedFeeRows.reduce((sum, item) => sum + Number(item.dueAmount || 0), 0)
  );

  try {
    await Promise.all(
      selectedFeeRows.map((item) =>
        updatePayment(
          selectedStudent.id,
          feeKey(item.fee.name),
          getPaymentStatusValue(Number(item.amountPaid || 0), Number(item.dueAmount || 0)),
          Number(item.amountPaid || 0)
        )
      )
    );

    const createdReceipt = await createReceipt({
      student_id: selectedStudent.id,
      fees: selectedFeeRows.map((item) => item.fee.name),
      amount: total,
      notes: `Paid fees: ${selectedFeeRows.map((item) => item.fee.name).join(', ')} | Status: ${paymentOutcome}`,
    });
    downloadReceiptPdf(createdReceipt?.receipt_number, selectedStudent, selectedFeeRows, total);

    localStorage.setItem('receipt-log-updated', Date.now().toString());
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('receipt-log');
      channel.postMessage({ type: 'receipt-updated', timestamp: Date.now() });
      channel.close();
    }

    const details = await fetchStudentDetails(selectedStudent.id);
    selectedStudent = normalizeStudent(details);
    renderPayFeeList();
    calculatePayTotal();
    toast(`Payment processed and receipt saved. Status: ${paymentOutcome}.`);
  } catch (err) {
    console.error(err);
    alert('Unable to save payment. Please try again.');
  }
}

async function loadPaymentStudents() {
  paymentStudents = (await fetchStudents().catch(() => [])).map(normalizeStudent);
}

async function initPaymentsPage() {
  if (window.location.pathname.split('/').pop() !== 'payments.html') return;
  if (typeof syncGradeSections === 'function') {
    await syncGradeSections();
  }
  document.getElementById('pay-grade')?.addEventListener('change', async () => {
    updatePaySections();
    const section = getSectionValue();
    await loadPaymentStudentsForSection(getGradeValue(), section);
    renderPayFeeList();
    calculatePayTotal();
  });
  document.getElementById('pay-section')?.addEventListener('change', async () => {
    await loadPaymentStudentsForSection(getGradeValue(), getSectionValue());
    renderPayFeeList();
    calculatePayTotal();
  });
  document.getElementById('pay-sibling-discount')?.addEventListener('change', async (event) => {
    siblingDiscountEnabled = Boolean(event.target.checked);
    setSiblingDiscountControlsVisibility();
    if (!siblingDiscountEnabled) {
      selectedSiblingLastName = '';
      const select = document.getElementById('pay-sibling-lastname');
      if (select) select.value = '';
    }
    renderPayFeeList();
    calculatePayTotal();
  });
  document.getElementById('pay-sibling-lastname')?.addEventListener('change', (event) => {
    selectedSiblingLastName = event.target.value;
    renderPayFeeList();
    calculatePayTotal();
  });
  document.getElementById('process-payment-button')?.addEventListener('click', processPayment);
  setSiblingDiscountControlsVisibility();
  await loadSiblingLastNames();
  updatePaySections();
  await loadPaymentStudentsForSection(getGradeValue(), getSectionValue());
  renderPayFeeList();
}

document.addEventListener('DOMContentLoaded', initPaymentsPage);
