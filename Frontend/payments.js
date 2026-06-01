let selectedStudent = null;

function getStudentEnteredTotal(student) {
  return getStudentEnteredFees(student).reduce((sum, line) => sum + line.amount, 0);
}

function buildReceiptLinesHtml(paidLines, unpaidLines, exemptLines) {
  let html = paidLines
    .map(
      (line) =>
        '<div class="receipt-line"><span>' + line.label + '</span><span>' + peso(line.amount) + '</span></div>'
    )
    .join('');

  if (exemptLines && exemptLines.length) {
    html +=
      '<div class="receipt-unpaid-heading">Exempt (sibling)</div>' +
      exemptLines
        .map(
          (line) =>
            '<div class="receipt-line receipt-line-exempt"><span>' +
            line.label +
            '</span><span class="receipt-exempt-tag">Exempt</span></div>'
        )
        .join('');
  }

  if (unpaidLines.length) {
    html +=
      '<div class="receipt-unpaid-heading">Unpaid categories</div>' +
      unpaidLines
        .map(
          (line) =>
            '<div class="receipt-line receipt-line-unpaid"><span>' +
            line.label +
            '</span><span class="receipt-unpaid-tag">Unpaid</span></div>'
        )
        .join('');
  }

  return html;
}

function getReceiptFeeBreakdown(student, receipt) {
  const paidLines = receipt?.lines
    ? receipt.lines.map((line) => ({ label: line.name, amount: Number(line.amount) || 0 }))
    : getStudentEnteredFees(student);
  const unpaidLines = receipt?.unpaidLines
    ? receipt.unpaidLines.map((line) => ({ label: line.name, amount: 0 }))
    : paidLines.length
      ? getStudentUnpaidFees(student)
      : [];
  const exemptLines = receipt?.exemptLines
    ? receipt.exemptLines.map((line) => ({ label: line.name }))
    : getStudentExemptFees(student);
  return { paidLines, unpaidLines, exemptLines };
}

function renderReceiptPreview(student, receiptId, receipt) {
  const { paidLines, unpaidLines, exemptLines } = getReceiptFeeBreakdown(student, receipt);
  const total = paidLines.reduce((sum, line) => sum + line.amount, 0);

  const receiptItems = document.getElementById('receipt-preview-items');
  const receiptStudent = document.getElementById('receipt-preview-student');
  const receiptGrade = document.getElementById('receipt-preview-grade');
  const receiptTotal = document.getElementById('receipt-preview-total');
  const receiptDate = document.getElementById('receipt-preview-date');
  const receiptNumber = document.getElementById('receipt-preview-number');
  const receiptCard = document.getElementById('receipt-card');
  const payTotal = document.getElementById('pay-total');
  const payLines = document.getElementById('pay-entered-lines');

  if (!receiptItems || !receiptStudent || !receiptGrade || !receiptTotal) return;

  receiptStudent.textContent = getStudentFullName(student);
  let gradeText =
    student.grade +
    ' – ' +
    (typeof getSectionDisplayName === 'function'
      ? getSectionDisplayName(student.grade, student.section)
      : 'Sec ' + student.section);
  if (student.parent) gradeText += ' · Parent: ' + student.parent;
  receiptGrade.textContent = gradeText;
  receiptDate.textContent = nowStr();
  receiptNumber.textContent = '#' + (receiptId || DB.nextReceiptId);
  receiptTotal.textContent = peso(total);
  if (payTotal) payTotal.textContent = peso(total);

  const linesHtml = buildReceiptLinesHtml(paidLines, unpaidLines, exemptLines);

  receiptItems.innerHTML = linesHtml || '<p class="receipt-empty-note">No fee lines.</p>';
  if (payLines) {
    payLines.innerHTML = paidLines.length
      ? linesHtml
      : '<p style="color:var(--text-muted);font-size:13px;">No amounts entered on the spreadsheet for this student.</p>';
  }
  if (receiptCard) receiptCard.style.display = 'block';
}

async function saveReceiptFromSpreadsheet(student) {
  const paidLines = getStudentEnteredFees(student);
  if (!paidLines.length) {
    toast('Enter fee amounts on the spreadsheet first.');
    return null;
  }

  const unpaidLines = getStudentUnpaidFees(student);
  const exemptLines = getStudentExemptFees(student);
  const total = paidLines.reduce((sum, line) => sum + line.amount, 0);
  const receiptId = DB.nextReceiptId++;

  const receipt = {
    id: receiptId,
    student: getStudentFullName(student),
    grade: student.grade,
    section: student.section,
    parent: student.parent || '',
    sibling: Boolean(student.sibling),
    lines: paidLines.map((line) => ({ name: line.label, amount: line.amount })),
    unpaidLines: unpaidLines.map((line) => ({ name: line.label, amount: 0 })),
    exemptLines: exemptLines.map((line) => ({ name: line.label, amount: 0, exempt: true })),
    fees: paidLines
      .map((line) => line.label + ' ' + peso(line.amount))
      .concat(exemptLines.map((line) => line.label + ' (Exempt)'))
      .concat(unpaidLines.map((line) => line.label + ' (Unpaid)')),
    amount: total,
    date: nowStr(),
    status: unpaidLines.length ? 'partial' : 'paid',
  };

  // Add to local DB
  DB.receipts.push(receipt);

  // Sync with API
  try {
    const receiptData = {
      student_id: student.id,
      amount: total,
      status: receipt.status,
      date: receipt.date,
    };
    await createReceipt(receiptData);
  } catch (err) {
    console.error('Failed to create receipt via API:', err);
    toast('Receipt created locally but failed to sync with server.');
  }

  await saveDB();

  if (typeof window.renderStudents === 'function') window.renderStudents();
  if (typeof window.renderReceiptsTable === 'function') window.renderReceiptsTable();

  return receipt;
}

function openPaymentModal(studentId) {
  const student = getStudentById(studentId);
  if (!student) return;

  selectedStudent = student;

  const infoName = document.getElementById('pay-info-name');
  const infoMeta = document.getElementById('pay-info-meta');
  if (infoName) infoName.textContent = getStudentFullName(student);
  if (infoMeta) {
    const sectionLabel =
      typeof getSectionDisplayName === 'function'
        ? getSectionDisplayName(student.grade, student.section)
        : 'Sec ' + student.section;
    infoMeta.textContent = student.grade + ' – ' + sectionLabel + (student.parent ? ' · ' + student.parent : '');
  }

  const lines = getStudentEnteredFees(student);
  if (!lines.length) {
    toast('Enter amounts in the fee columns before recording payment.');
    return;
  }

  const receipt = saveReceiptFromSpreadsheet(student);
  if (!receipt) return;

  renderReceiptPreview(student, receipt.id, receipt);
  openModal('payment-modal');
  toast('Receipt #' + receipt.id + ' saved to Receipts Log.');
}

function initPaymentModal() {
  document.getElementById('print-receipt-button')?.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-close-modal="payment-modal"]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal('payment-modal'));
  });
}

document.addEventListener('DOMContentLoaded', initPaymentModal);
