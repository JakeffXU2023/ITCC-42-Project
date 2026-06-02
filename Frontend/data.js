const DEFAULT_GRADE_SECTIONS = {7: 12, 8: 13, 9: 10, 10: 11, 11: 13, 12: 13};
let GRADE_SECTIONS = { ...DEFAULT_GRADE_SECTIONS };

const DB = {
  students: [
    {id: 1, last: 'Dela Cruz', first: 'Juan', grade: 'Grade 7', section: '1', sibling: false, payments: {spta: 'paid', paper: 'paid', org: 'paid', sports: 'paid', insurance: 'paid'}},
    {id: 2, last: 'Dela Cruz', first: 'Maria', grade: 'Grade 7', section: '1', sibling: true, payments: {spta: 'exempt', paper: 'exempt', org: 'paid', sports: 'unpaid', insurance: 'paid'}},
    {id: 3, last: 'Santos', first: 'Liza', grade: 'Grade 7', section: '1', sibling: false, payments: {spta: 'paid', paper: 'paid', org: 'unpaid', sports: 'paid', insurance: 'paid'}},
    {id: 4, last: 'Reyes', first: 'Carlo', grade: 'Grade 7', section: '1', sibling: false, payments: {spta: 'unpaid', paper: 'unpaid', org: 'unpaid', sports: 'unpaid', insurance: 'unpaid'}},
    {id: 5, last: 'Garcia', first: 'Ana', grade: 'Grade 7', section: '2', sibling: false, payments: {spta: 'paid', paper: 'paid', org: 'paid', sports: 'partial', insurance: 'paid'}},
    {id: 6, last: 'Ramos', first: 'Pedro', grade: 'Grade 8', section: '1', sibling: false, payments: {spta: 'paid', paper: 'partial', org: 'paid', sports: 'paid', insurance: 'paid'}},
    {id: 7, last: 'Torres', first: 'Sofia', grade: 'Grade 9', section: '3', sibling: false, payments: {spta: 'paid', paper: 'paid', org: 'paid', sports: 'paid', insurance: 'paid'}},
    {id: 8, last: 'Cruz', first: 'Miguel', grade: 'Grade 10', section: '2', sibling: false, payments: {spta: 'unpaid', paper: 'unpaid', org: 'unpaid', sports: 'unpaid', insurance: 'unpaid', graduation: 'unpaid'}},
    {id: 9, last: 'Lopez', first: 'Carmen', grade: 'Grade 11', section: '1', sibling: false, payments: {spta: 'paid', paper: 'paid', org: 'partial', sports: 'paid', insurance: 'paid'}},
    {id: 10, last: 'Flores', first: 'Jose', grade: 'Grade 12', section: '4', sibling: false, payments: {spta: 'paid', paper: 'paid', org: 'paid', sports: 'paid', insurance: 'paid', graduation: 'paid'}},
  ],
  fees: [
    {id: 1, name: 'SPTA Membership', amount: 150, scope: 'All'},
    {id: 2, name: 'School Paper', amount: 50, scope: 'All'},
    {id: 3, name: 'School Organization', amount: 100, scope: 'All'},
    {id: 4, name: 'Sports', amount: 200, scope: 'All'},
    {id: 5, name: 'Insurance', amount: 75, scope: 'All'},
    {id: 6, name: 'Graduation Fee', amount: 500, scope: 'Grade 10 & 12'},
  ],
  receipts: [],
  disbursements: [
    {id: 1, purpose: 'Financial assistance – Grade 9 scholars', category: 'Financial Assistance', date: '2025-03-15', amount: 28000, by: 'Admin'},
    {id: 2, purpose: 'Sports equipment purchase', category: 'Sports', date: '2025-02-28', amount: 18500, by: 'Admin'},
    {id: 3, purpose: 'School paper printing', category: 'School Paper', date: '2025-02-10', amount: 15400, by: 'Admin'},
  ],
  nextId: 100,
  nextReceiptId: 1001,
};

function peso(value) {
  return '₱' + Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function nowStr() {
  return new Date().toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toast(message) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2800);
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function getStudentStatus(student) {
  return determinePaymentStatus(Object.values(student.payments));
}

function determinePaymentStatus(statuses) {
  const normalized = (statuses || []).filter(Boolean);
  if (!normalized.length) return 'unpaid';
  if (normalized.some((status) => status === 'overpaid')) return 'overpaid';
  if (normalized.every((status) => status === 'paid' || status === 'exempt')) return 'paid';
  if (normalized.every((status) => status === 'unpaid')) return 'unpaid';
  return 'partial';
}

function badgeHTML(status) {
  const map = { paid: 'badge-paid', unpaid: 'badge-unpaid', partial: 'badge-partial', overpaid: 'badge-overpaid', exempt: 'badge-exempt' };
  const labels = { paid: 'Paid', unpaid: 'Unpaid', partial: 'Partial', overpaid: 'Overpaid', exempt: 'Exempt' };
  return `<span class="badge ${map[status] || 'badge-exempt'}">${labels[status] || status}</span>`;
}

function getStudentTotal(student) {
  let total = 0;
  DB.fees.forEach((fee) => {
    const key = feeKey(fee.name);
    const status = student.payments[key];
    if (status === 'paid') total += fee.amount;
  });
  return total;
}

function feeKey(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace('school_organization', 'school_org')
    .replace('spta_membership', 'spta')
    .replace('school_paper', 'school_paper')
    .replace('graduation_fee', 'graduation')
    .replace('insurance', 'insurance')
    .replace('sports', 'sports');
}

function feesForGrade(grade) {
  const numericGrade = parseInt(grade.replace('Grade ', ''));
  return DB.fees.filter((fee) => {
    if (fee.scope === 'All') return true;
    if (fee.scope === 'Grade 10 & 12') return numericGrade === 10 || numericGrade === 12;
    if (fee.scope === 'Grade 7-10') return numericGrade >= 7 && numericGrade <= 10;
    if (fee.scope === 'Grade 11-12') return numericGrade >= 11 && numericGrade <= 12;
    return true;
  });
}

function getStudentsByGradeSection(grade, section) {
  return DB.students.filter((student) => student.grade === grade && student.section === section);
}

function getStudentById(id) {
  return DB.students.find((student) => student.id === id);
}

function getStudentFullName(student) {
  return `${student.last}, ${student.first}`;
}

function getFeeById(id) {
  return DB.fees.find((fee) => fee.id === id);
}

async function syncSchoolYearLabels() {
  try {
    const response = await fetch('http://localhost:3001/api/settings/school-year');
    if (!response.ok) return;

    const data = await response.json();
    const schoolYear = String(data.schoolYear || '').trim();
    if (!schoolYear) return;

    document.querySelectorAll('.brand-year').forEach((element) => {
      element.textContent = `SY ${schoolYear}`;
    });
  } catch {
    // Ignore backend readiness errors on initial load.
  }
}

function setGradeSections(sectionMap) {
  const nextSections = { ...DEFAULT_GRADE_SECTIONS };
  Object.entries(sectionMap || {}).forEach(([grade, count]) => {
    const normalizedGrade = Number(grade);
    const normalizedCount = Number(count);
    if (Number.isInteger(normalizedGrade) && Number.isInteger(normalizedCount)) {
      nextSections[normalizedGrade] = Math.max(1, Math.min(13, normalizedCount));
    }
  });
  GRADE_SECTIONS = nextSections;
  return GRADE_SECTIONS;
}

async function syncGradeSections() {
  try {
    const response = await fetch('http://localhost:3001/api/settings/sections');
    if (!response.ok) return GRADE_SECTIONS;

    const data = await response.json();
    if (data && data.sections) {
      setGradeSections(data.sections);
    }
    return GRADE_SECTIONS;
  } catch {
    return GRADE_SECTIONS;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  syncSchoolYearLabels();
  syncGradeSections();
});
