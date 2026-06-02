const API_BASE = 'http://localhost:3001/api';

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API ${response.status} ${response.statusText}: ${error}`);
  }
  return response.json();
}

async function fetchStudents() {
  return apiFetch('/students');
}

async function fetchStudentsByGrade(grade) {
  return apiFetch(`/students/grade/${encodeURIComponent(grade)}`);
}

async function fetchStudentsByGradeSection(grade, section) {
  return apiFetch(`/students/grade/${encodeURIComponent(grade)}/section/${encodeURIComponent(section)}`);
}

async function fetchStudentPayments(studentId) {
  return apiFetch(`/payments/student/${studentId}`);
}

async function createStudent(studentData) {
  return apiFetch('/students', {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
}

async function updateStudent(studentId, studentData) {
  return apiFetch(`/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(studentData),
  });
}

async function fetchReceipts() {
  return apiFetch('/receipts');
}

async function createReceipt(receiptData) {
  return apiFetch('/receipts', {
    method: 'POST',
    body: JSON.stringify(receiptData),
  });
}

async function deleteReceipt(receiptId) {
  return apiFetch(`/receipts/${receiptId}`, {
    method: 'DELETE',
  });
}

async function fetchReportSummary() {
  return apiFetch('/reports/summary');
}

async function fetchReportByCategory() {
  return apiFetch('/reports/by-category');
}

async function fetchReportByGrade() {
  return apiFetch('/reports/by-grade');
}

async function fetchDetailedStudentReport() {
  return apiFetch('/reports/students/detailed');
}

async function fetchSiblingStudents() {
  return apiFetch('/reports/siblings/list');
}

async function fetchDisbursements() {
  return apiFetch('/disbursements');
}

async function fetchStudentDetails(studentId) {
  return apiFetch(`/students/${studentId}`);
}

async function updatePayment(studentId, feeType, status, amountPaid) {
  return apiFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, fee_type: feeType, status, amount_paid: amountPaid }),
  });
}

async function fetchFees() {
  return apiFetch('/fees');
}

async function createFee(feeData) {
  return apiFetch('/fees', {
    method: 'POST',
    body: JSON.stringify(feeData),
  });
}

async function updateFee(feeId, feeData) {
  return apiFetch(`/fees/${feeId}`, {
    method: 'PUT',
    body: JSON.stringify(feeData),
  });
}

async function deleteFeeApi(feeId) {
  return apiFetch(`/fees/${feeId}`, {
    method: 'DELETE',
  });
}

function normalizeGradeValue(grade) {
  if (grade == null) return '';
  const value = String(grade).trim();
  if (value.startsWith('Grade ')) {
    return value.replace('Grade ', '');
  }
  return String(Number(value)) === value ? value : value;
}

function normalizePayments(payments) {
  if (!payments) return {};
  if (Array.isArray(payments)) {
    return payments.reduce((acc, payment) => {
      if (payment && payment.fee_type) {
        acc[payment.fee_type] = payment.status || 'unpaid';
      }
      return acc;
    }, {});
  }
  return payments;
}

function normalizeStudent(student) {
  return {
    id: student.id,
    first: student.first || student.first_name || '',
    last: student.last || student.last_name || '',
    grade: normalizeGradeValue(student.grade),
    section: student.section,
    sibling: student.sibling != null ? Boolean(student.sibling) : Boolean(student.has_sibling),
    has_sibling: student.has_sibling != null ? Boolean(student.has_sibling) : Boolean(student.sibling),
    spta: student.spta || 0,
    school_paper: student.school_paper || 0,
    school_org: student.school_org || 0,
    sports: student.sports || 0,
    insurance_amount: student.insurance_amount || 0,
    insurance_choice: student.insurance_choice || 'unpaid',
    graduation: student.graduation || 0,
    payments: normalizePayments(student.payments),
  };
}

function normalizeReceipt(receipt) {
  return {
    ...receipt,
    fees: receipt.fees || (receipt.fee_type ? [receipt.fee_type] : []),
    student: receipt.student || `${receipt.last_name || ''}, ${receipt.first_name || ''}`.trim(),
    amount: Number(receipt.amount || 0),
  };
}

function formatName(student) {
  return `${student.last}, ${student.first}`.trim();
}
