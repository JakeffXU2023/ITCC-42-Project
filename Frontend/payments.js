let selectedStudent = null;
let selectedFees = new Set();
let paymentStudents = [];

function getGradeValue() {
  return document.getElementById('pay-grade')?.value || '';
}

function getSectionValue() {
  return document.getElementById('pay-section')?.value || '';
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
  const student = paymentStudents.find((student) => student.id === studentId);
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
    return;
  }
  const fees = feesForGrade(grade);
  selectedFees = new Set();
  feeList.innerHTML = fees
    .map((fee) => {
      const key = feeKey(fee.name);
      const disabled = selectedStudent && selectedStudent.payments && selectedStudent.payments[key] === 'paid';
      const checked = disabled ? 'checked' : '';
      return `<label class="pay-fee-row"><input type="checkbox" data-fee-id="${fee.id}" ${checked} ${disabled ? 'disabled' : ''}><span class="pay-fee-label">${fee.name}</span> <span style="font-size:13px;font-weight:700;">${peso(fee.amount)}</span></label>`;
    })
    .join('');
  feeList.querySelectorAll('input[type=checkbox]').forEach((input) => {
    input.addEventListener('change', calculatePayTotal);
  });
}

function calculatePayTotal() {
  const feeList = document.getElementById('pay-fee-list');
  const totalEl = document.getElementById('pay-total');
  if (!feeList || !totalEl) return 0;
  const checkboxes = feeList.querySelectorAll('input[type=checkbox]');
  let total = 0;
  selectedFees = new Set();
  checkboxes.forEach((checkbox) => {
    const fee = getFeeById(Number(checkbox.dataset.feeId));
    if (checkbox.checked && fee) {
      selectedFees.add(fee.id);
      total += fee.amount;
    }
  });
  totalEl.textContent = peso(total);
  return total;
}

function buildReceiptHtml(receiptNumber, student, checkedFees, total) {
  const items = checkedFees
    .map((fee) => `<tr><td>${fee.name}</td><td style="text-align:right;">${peso(fee.amount)}</td></tr>`)
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
  const total = calculatePayTotal();
  if (!total) {
    alert('Select at least one fee.');
    return;
  }
  const checkedFees = Array.from(document.querySelectorAll('#pay-fee-list input[type=checkbox]:checked'))
    .map((checkbox) => getFeeById(Number(checkbox.dataset.feeId)))
    .filter(Boolean);
  if (!checkedFees.length) {
    alert('Select at least one fee.');
    return;
  }

  try {
    await Promise.all(
      checkedFees.map((fee) => updatePayment(selectedStudent.id, feeKey(fee.name), 'paid', fee.amount))
    );

    const createdReceipt = await createReceipt({
      student_id: selectedStudent.id,
      fees: checkedFees.map((fee) => fee.name),
      amount: total,
      notes: `Paid fees: ${checkedFees.map((fee) => fee.name).join(', ')}`,
    });
    downloadReceiptPdf(createdReceipt?.receipt_number, selectedStudent, checkedFees, total);

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
    toast('Payment processed and receipt saved. Use Print dialog to save as PDF.');
  } catch (err) {
    console.error(err);
    alert('Unable to save payment. Please try again.');
  }
}

async function loadPaymentStudents() {
  paymentStudents = (await fetchStudents()
    .catch(() => []))
    .map(normalizeStudent);
}

async function initPaymentsPage() {
  if (window.location.pathname.split('/').pop() !== 'payments.html') return;
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
  document.getElementById('process-payment-button')?.addEventListener('click', processPayment);
  updatePaySections();
  await loadPaymentStudentsForSection(getGradeValue(), getSectionValue());
  renderPayFeeList();
}

document.addEventListener('DOMContentLoaded', initPaymentsPage);

