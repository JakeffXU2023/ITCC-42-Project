const GRADE_SECTIONS = { 7: 12, 8: 13, 9: 10, 10: 11, 11: 13, 12: 13 };

const STORAGE_KEY = 'pta_cashier_db_v2';

/** Empty rows ready per grade/section (spreadsheet-style). */
const DEFAULT_ROWS_PER_SECTION = 40;

const BASE_FEE_COLUMNS = [
  { key: 'spta', label: 'SPTA Membership' },
  { key: 'paper', label: 'School Paper' },
  { key: 'org', label: 'School Organization' },
  { key: 'sports', label: 'Sports' },
  { key: 'insurance', label: 'Insurance' },
];

const GRADUATION_COLUMN = { key: 'graduation', label: 'Graduation' };

/** Siblings are exempt from these fee columns (amount forced to 0). */
const SIBLING_EXEMPT_FEE_KEYS = ['spta', 'paper'];

const SEED_DB = {
  students: [
    { id: 1, last: 'Dela Cruz', first: 'Juan', parent: 'Roberto Dela Cruz', grade: 'Grade 7', section: '1', sibling: false, amounts: { spta: 150, paper: 50, org: 100, sports: 200, insurance: 75 }, payments: { spta: 'paid', paper: 'paid', org: 'paid', sports: 'paid', insurance: 'paid' } },
    { id: 2, last: 'Dela Cruz', first: 'Maria', parent: 'Roberto Dela Cruz', grade: 'Grade 7', section: '1', sibling: true, amounts: { spta: 0, paper: 0, org: 100, sports: 0, insurance: 75 }, payments: { spta: 'exempt', paper: 'exempt', org: 'paid', sports: 'unpaid', insurance: 'paid' } },
    { id: 3, last: 'Santos', first: 'Liza', parent: 'Elena Santos', grade: 'Grade 7', section: '1', sibling: false, amounts: { spta: 150, paper: 50, org: 0, sports: 200, insurance: 75 }, payments: { spta: 'paid', paper: 'paid', org: 'unpaid', sports: 'paid', insurance: 'paid' } },
    { id: 4, last: 'Reyes', first: 'Carlo', parent: 'Ana Reyes', grade: 'Grade 7', section: '1', sibling: false, amounts: { spta: 0, paper: 0, org: 0, sports: 0, insurance: 0 }, payments: { spta: 'unpaid', paper: 'unpaid', org: 'unpaid', sports: 'unpaid', insurance: 'unpaid' } },
    { id: 5, last: 'Garcia', first: 'Ana', parent: 'Miguel Garcia', grade: 'Grade 7', section: '2', sibling: false, amounts: { spta: 150, paper: 50, org: 100, sports: 100, insurance: 75 }, payments: { spta: 'paid', paper: 'paid', org: 'paid', sports: 'partial', insurance: 'paid' } },
    { id: 6, last: 'Ramos', first: 'Pedro', parent: 'Carmen Ramos', grade: 'Grade 8', section: '1', sibling: false, amounts: { spta: 150, paper: 25, org: 100, sports: 200, insurance: 75 }, payments: { spta: 'paid', paper: 'partial', org: 'paid', sports: 'paid', insurance: 'paid' } },
    { id: 7, last: 'Torres', first: 'Sofia', parent: 'Luis Torres', grade: 'Grade 9', section: '3', sibling: false, amounts: { spta: 150, paper: 50, org: 100, sports: 200, insurance: 75 }, payments: { spta: 'paid', paper: 'paid', org: 'paid', sports: 'paid', insurance: 'paid' } },
    { id: 8, last: 'Cruz', first: 'Miguel', parent: 'Rosa Cruz', grade: 'Grade 10', section: '2', sibling: false, amounts: { spta: 0, paper: 0, org: 0, sports: 0, insurance: 0, graduation: 0 }, payments: { spta: 'unpaid', paper: 'unpaid', org: 'unpaid', sports: 'unpaid', insurance: 'unpaid', graduation: 'unpaid' } },
    { id: 9, last: 'Lopez', first: 'Carmen', parent: 'Jose Lopez', grade: 'Grade 11', section: '1', sibling: false, amounts: { spta: 150, paper: 50, org: 50, sports: 200, insurance: 75 }, payments: { spta: 'paid', paper: 'paid', org: 'partial', sports: 'paid', insurance: 'paid' } },
    { id: 10, last: 'Flores', first: 'Jose', parent: 'Teresa Flores', grade: 'Grade 12', section: '4', sibling: false, amounts: { spta: 150, paper: 50, org: 100, sports: 200, insurance: 75, graduation: 500 }, payments: { spta: 'paid', paper: 'paid', org: 'paid', sports: 'paid', insurance: 'paid', graduation: 'paid' } },
  ],
  fees: [
    { id: 1, name: 'SPTA Membership', amount: 150, scope: 'All' },
    { id: 2, name: 'School Paper', amount: 50, scope: 'All' },
    { id: 3, name: 'School Organization', amount: 100, scope: 'All' },
    { id: 4, name: 'Sports', amount: 200, scope: 'All' },
    { id: 5, name: 'Insurance', amount: 75, scope: 'All' },
    { id: 6, name: 'Graduation Fee', amount: 500, scope: 'Grade 10 & 12' },
  ],
  receipts: [],
  disbursements: [
    { id: 1, purpose: 'Financial assistance – Grade 9 scholars', category: 'Financial Assistance', date: '2025-03-15', amount: 28000, by: 'Admin' },
    { id: 2, purpose: 'Sports equipment purchase', category: 'Sports', date: '2025-02-28', amount: 18500, by: 'Admin' },
    { id: 3, purpose: 'School paper printing', category: 'School Paper', date: '2025-02-10', amount: 15400, by: 'Admin' },
  ],
  gradeSettings: {},
  nextId: 100,
  nextReceiptId: 1001,
};

let DB = null;

async function loadDB() {
  try {
    // Try to load from API
    console.log('Loading data from API...');
    const students = await fetchStudents();
    const fees = await fetchFees();
    const receipts = await fetchReceipts();

    const dbData = {
      students: students || [],
      fees: fees || [],
      receipts: receipts || [],
      disbursements: [],
      gradeSettings: {},
      nextId: Math.max(...(students || []).map(s => s.id || 0), 100),
      nextReceiptId: Math.max(...(receipts || []).map(r => r.id || 0), 1001),
    };

    return normalizeDB(dbData);
  } catch (err) {
    console.error('Failed to load from API:', err);
    throw new Error('Backend not running');
  }
}

// Initialize DB when page loads
async function initializeDB() {
  if (DB === null) {
    DB = await loadDB();
    document.dispatchEvent(new Event('dbReady'));
  }
  return DB;
}

// Call this immediately when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDB);
} else {
  initializeDB();
}

function normalizeDB(data) {
  const db = { ...SEED_DB, ...data };
  if (!Array.isArray(db.students)) db.students = SEED_DB.students;
  if (!Array.isArray(db.fees)) db.fees = SEED_DB.fees;
  if (!db.gradeSettings || typeof db.gradeSettings !== 'object') db.gradeSettings = {};
  Object.keys(db.gradeSettings).forEach((grade) => {
    if (!db.gradeSettings[grade].sectionNames || typeof db.gradeSettings[grade].sectionNames !== 'object') {
      db.gradeSettings[grade].sectionNames = {};
    }
  });

  db.students = db.students.filter((student) => !isPlaceholderStudent(student));

  db.students.forEach((student) => {
    if (!student.amounts) student.amounts = {};
    if (!student.payments) student.payments = {};
    if (student.parent === undefined) student.parent = '';
    if (student.sibling === undefined) student.sibling = false;
    getSpreadsheetColumns(student.grade, db).forEach((col) => {
      if (student.amounts[col.key] === undefined) student.amounts[col.key] = 0;
      if (student.payments[col.key] === undefined) student.payments[col.key] = 'unpaid';
    });
    if (student.sibling) applySiblingExemptions(student);
  });
  return db;
}

async function saveDB() {
  try {
    // Save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
  } catch (err) {
    console.error('Could not save to localStorage:', err);
  }
  // Note: Individual operations (add student, create receipt, etc.) 
  // should call their respective API endpoints directly
}

function gradeNumber(grade) {
  return Number(String(grade).replace('Grade ', ''));
}

function getSectionCount(grade) {
  const n = gradeNumber(grade);
  const custom = DB.gradeSettings[grade]?.sectionCount;
  if (custom && custom > 0) return custom;
  return GRADE_SECTIONS[n] || 1;
}

function ensureGradeSettings(grade) {
  if (!DB.gradeSettings[grade]) DB.gradeSettings[grade] = {};
  if (!DB.gradeSettings[grade].sectionNames || typeof DB.gradeSettings[grade].sectionNames !== 'object') {
    DB.gradeSettings[grade].sectionNames = {};
  }
  return DB.gradeSettings[grade];
}

function getSectionDisplayName(grade, section) {
  const key = String(section);
  const names = DB.gradeSettings[grade]?.sectionNames;
  const custom = names && names[key];
  if (custom && String(custom).trim()) return String(custom).trim();
  return 'Sec ' + key;
}

function setSectionDisplayName(grade, section, name) {
  const settings = ensureGradeSettings(grade);
  const key = String(section);
  const trimmed = String(name || '').trim();
  if (!trimmed) delete settings.sectionNames[key];
  else settings.sectionNames[key] = trimmed;
  // saveDB is async but we don't always wait for it in UI code
  saveDB().catch(err => console.error('Failed to save section name:', err));
}

function setSectionCount(grade, count) {
  ensureGradeSettings(grade);
  DB.gradeSettings[grade].sectionCount = Math.max(1, count);
  // saveDB is async but we don't always wait for it in UI code
  saveDB().catch(err => console.error('Failed to save section count:', err));
}

function addSectionToGrade(grade) {
  setSectionCount(grade, getSectionCount(grade) + 1);
}

function removeSectionFromGrade(grade, sectionToRemove) {
  const count = getSectionCount(grade);
  if (count <= 1) return false;

  const removeNum = Number(sectionToRemove);
  if (!removeNum || removeNum < 1 || removeNum > count) return false;

  const sectionKey = String(removeNum);
  const hasStudents = DB.students.some(
    (s) => s.grade === grade && String(s.section) === sectionKey && !isPlaceholderStudent(s)
  );
  if (hasStudents) return false;

  DB.students.forEach((s) => {
    if (s.grade !== grade) return;
    const sec = Number(s.section);
    if (sec > removeNum) s.section = String(sec - 1);
  });

  const settings = ensureGradeSettings(grade);
  const names = settings.sectionNames || {};
  const newNames = {};
  for (let i = 1; i <= count; i += 1) {
    if (i === removeNum) continue;
    const newKey = i < removeNum ? String(i) : String(i - 1);
    if (names[String(i)]) newNames[newKey] = names[String(i)];
  }
  settings.sectionNames = newNames;

  setSectionCount(grade, count - 1);
  return true;
}

function getGradeExtraSectionsStatus(grade) {
  const sectionCount = getSectionCount(grade);
  const extraCount = Math.max(0, sectionCount - 1);
  let blockedStudents = 0;
  for (let i = 2; i <= sectionCount; i += 1) {
    blockedStudents += DB.students.filter(
      (s) => s.grade === grade && String(s.section) === String(i) && !isPlaceholderStudent(s)
    ).length;
  }
  return {
    sectionCount,
    extraCount,
    blockedStudents,
    canRemoveAll: extraCount > 0 && blockedStudents === 0,
  };
}

/** Collapse grade to a single section; sections 2+ must have no student data. */
function removeAllExtraSectionsFromGrade(grade) {
  const status = getGradeExtraSectionsStatus(grade);
  if (status.extraCount === 0) return { ok: false, reason: 'already_single' };
  if (!status.canRemoveAll) {
    return { ok: false, reason: 'has_students', studentCount: status.blockedStudents };
  }

  DB.students = DB.students.filter((s) => {
    if (s.grade !== grade) return true;
    return Number(s.section) <= 1;
  });

  const settings = ensureGradeSettings(grade);
  const keepName = settings.sectionNames?.['1'];
  settings.sectionNames = keepName ? { '1': keepName } : {};

  const removed = status.extraCount;
  setSectionCount(grade, 1);
  // saveDB is async but we call it without await
  saveDB().catch(err => console.error('Failed to save after removing extra sections:', err));
  return { ok: true, removed };
}

function hasGraduationFees(grade) {
  const n = gradeNumber(grade);
  return n === 10 || n === 12;
}

function getSpreadsheetColumns(grade, dbRef) {
  const store = dbRef || DB;
  const cols = [...BASE_FEE_COLUMNS];
  if (hasGraduationFees(grade)) cols.push(GRADUATION_COLUMN);
  const extra = (store.gradeSettings[grade] && store.gradeSettings[grade].extraColumns) || [];
  return cols.concat(extra);
}

function slugifyColumnKey(label, grade) {
  const base = label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24) || 'fee';
  let key = base;
  let i = 1;
  const existing = new Set(getSpreadsheetColumns(grade, DB).map((c) => c.key));
  while (existing.has(key)) {
    key = `${base}_${i++}`;
  }
  return key;
}

function addCustomColumn(grade, label) {
  const trimmed = (label || '').trim();
  if (!trimmed) return null;
  if (!DB.gradeSettings[grade]) DB.gradeSettings[grade] = {};
  if (!DB.gradeSettings[grade].extraColumns) DB.gradeSettings[grade].extraColumns = [];
  const key = slugifyColumnKey(trimmed, grade);
  const col = { key, label: trimmed, custom: true, amount: 0 };
  DB.gradeSettings[grade].extraColumns.push(col);
  DB.students
    .filter((s) => s.grade === grade)
    .forEach((s) => {
      if (!s.amounts) s.amounts = {};
      if (!s.payments) s.payments = {};
      s.amounts[key] = s.amounts[key] ?? 0;
      s.payments[key] = s.payments[key] ?? 'unpaid';
    });
  // saveDB is async but we call it without await
  saveDB().catch(err => console.error('Failed to save custom column:', err));
  return col;
}

function removeCustomColumn(grade, key) {
  const settings = DB.gradeSettings[grade];
  if (!settings?.extraColumns) return false;
  const idx = settings.extraColumns.findIndex((c) => c.key === key);
  if (idx === -1) return false;
  settings.extraColumns.splice(idx, 1);
  DB.students.forEach((s) => {
    delete s.amounts?.[key];
    delete s.payments?.[key];
  });
  // saveDB is async but we call it without await
  saveDB().catch(err => console.error('Failed to save after removing column:', err));
  return true;
}

function feeAmountForKey(key) {
  const map = {
    spta: 'SPTA Membership',
    paper: 'School Paper',
    org: 'School Organization',
    sports: 'Sports',
    insurance: 'Insurance',
    graduation: 'Graduation Fee',
  };
  const name = map[key];
  if (name) {
    const fee = DB.fees.find((f) => f.name === name);
    if (fee) return fee.amount;
  }
  const custom = Object.values(DB.gradeSettings).flatMap((g) => g.extraColumns || []).find((c) => c.key === key);
  return custom?.amount ?? 0;
}

function isSiblingExemptFee(key) {
  return SIBLING_EXEMPT_FEE_KEYS.includes(key);
}

function applySiblingExemptions(student) {
  if (!student.amounts) student.amounts = {};
  if (!student.payments) student.payments = {};
  SIBLING_EXEMPT_FEE_KEYS.forEach((key) => {
    if (student.sibling) {
      student.amounts[key] = 0;
      student.payments[key] = 'exempt';
    } else if (student.payments[key] === 'exempt') {
      syncPaymentStatus(student, key);
    }
  });
}

function setStudentSibling(student, isSibling) {
  student.sibling = Boolean(isSibling);
  applySiblingExemptions(student);
  syncAllPaymentStatuses(student);
}

function getStudentExemptFees(student) {
  if (!student.sibling) return [];
  return getSpreadsheetColumns(student.grade)
    .filter((col) => isSiblingExemptFee(col.key))
    .map((col) => ({ key: col.key, label: col.label }));
}

function syncPaymentStatus(student, key) {
  if (!student.payments) student.payments = {};
  if (!student.amounts) student.amounts = {};
  if (student.sibling && isSiblingExemptFee(key)) {
    student.amounts[key] = 0;
    student.payments[key] = 'exempt';
    return;
  }
  const paid = Number(student.amounts[key]) || 0;
  if (student.payments[key] === 'exempt') return;
  student.payments[key] = paid > 0 ? 'paid' : 'unpaid';
}

function syncAllPaymentStatuses(student) {
  getSpreadsheetColumns(student.grade).forEach((col) => syncPaymentStatus(student, col.key));
}

/** Fee lines with amount > 0 entered on the spreadsheet. */
function getStudentEnteredFees(student) {
  return getSpreadsheetColumns(student.grade)
    .map((col) => ({
      key: col.key,
      label: col.label,
      amount: Number(student.amounts && student.amounts[col.key]) || 0,
    }))
    .filter((line) => line.amount > 0);
}

/** Fee categories with no amount entered (0) — shown on partial payment receipts. */
function getStudentUnpaidFees(student) {
  return getSpreadsheetColumns(student.grade)
    .map((col) => ({
      key: col.key,
      label: col.label,
      amount: Number(student.amounts && student.amounts[col.key]) || 0,
    }))
    .filter((line) => line.amount <= 0 && !(student.sibling && isSiblingExemptFee(line.key)));
}

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
  syncAllPaymentStatuses(student);
  const columns = getSpreadsheetColumns(student.grade).filter(
    (col) => !(student.sibling && isSiblingExemptFee(col.key))
  );
  const withInput = columns.filter((col) => (Number(student.amounts && student.amounts[col.key]) || 0) > 0);
  const withoutInput = columns.filter((col) => (Number(student.amounts && student.amounts[col.key]) || 0) <= 0);

  if (withInput.length === 0) return 'unpaid';
  if (withoutInput.length === 0) return 'paid';
  return 'partial';
}

function badgeHTML(status) {
  const map = { paid: 'badge-paid', unpaid: 'badge-unpaid', partial: 'badge-partial', exempt: 'badge-exempt' };
  const labels = { paid: 'Paid', unpaid: 'Unpaid', partial: 'Partial', exempt: 'Exempt' };
  return `<span class="badge ${map[status] || 'badge-exempt'}">${labels[status] || status}</span>`;
}

function getStudentTotal(student) {
  syncAllPaymentStatuses(student);
  let total = 0;
  getSpreadsheetColumns(student.grade).forEach((col) => {
    if (student.sibling && isSiblingExemptFee(col.key)) return;
    total += Number(student.amounts?.[col.key]) || 0;
  });
  return total;
}

function feeKey(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace('school_organization', 'org')
    .replace('spta_membership', 'spta')
    .replace('school_paper', 'paper')
    .replace('graduation_fee', 'graduation')
    .replace('insurance', 'insurance')
    .replace('sports', 'sports');
}

function feesForGrade(grade) {
  const numericGrade = gradeNumber(grade);
  return DB.fees.filter((fee) => {
    if (fee.scope === 'All') return true;
    if (fee.scope === 'Grade 10 & 12') return numericGrade === 10 || numericGrade === 12;
    if (fee.scope === 'Grade 7-10') return numericGrade >= 7 && numericGrade <= 10;
    if (fee.scope === 'Grade 11-12') return numericGrade >= 11 && numericGrade <= 12;
    return true;
  });
}

function getStudentsByGradeSection(grade, section) {
  return DB.students.filter((student) => student.grade === grade && String(student.section) === String(section));
}

function getStudentById(id) {
  return DB.students.find((student) => student.id === id);
}

function getStudentDisplayName(student) {
  if (student.name && String(student.name).trim()) return normalizePersonName(student.name);
  const last = normalizePersonName(student.last || '');
  const first = normalizePersonName(student.first || '');
  if (last && first) return last + ', ' + first;
  return last || first || '';
}

function normalizePersonName(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeParentName(value) {
  return String(value || '').trim();
}

function setStudentDisplayName(student, value) {
  const name = normalizePersonName(value);
  student.name = name;
  const comma = name.indexOf(',');
  if (comma >= 0) {
    student.last = name.slice(0, comma).trim();
    student.first = name.slice(comma + 1).trim();
  } else {
    student.last = name;
    student.first = '';
  }
}

function getStudentFullName(student) {
  return getStudentDisplayName(student);
}

function isPlaceholderStudent(student) {
  const hasName = Boolean(getStudentDisplayName(student));
  const hasParent = Boolean((student.parent || '').trim());
  const hasAmounts = Object.values(student.amounts || {}).some((v) => Number(v) > 0);
  return !hasName && !hasParent && !hasAmounts;
}

function getFeeById(id) {
  return DB.fees.find((fee) => fee.id === id);
}

async function addStudentRecord(grade, section, data = {}, options = {}) {
  const student = {
    id: DB.nextId++,
    name: data.name || '',
    last: data.last || '',
    first: data.first || '',
    parent: normalizeParentName(data.parent || ''),
    grade,
    section: String(section),
    sibling: Boolean(data.sibling),
    amounts: {},
    payments: {},
  };
  if (data.name) setStudentDisplayName(student, data.name);
  else if (data.last || data.first) setStudentDisplayName(student, getStudentDisplayName(student));

  getSpreadsheetColumns(grade).forEach((col) => {
    student.amounts[col.key] = Number(data.amounts?.[col.key]) || 0;
    student.payments[col.key] = 'unpaid';
  });
  if (student.sibling) applySiblingExemptions(student);
  syncAllPaymentStatuses(student);
  
  // Add to local DB
  DB.students.push(student);
  
  // Sync with API
  if (!options.skipApi) {
    try {
      const studentData = {
        first_name: student.first,
        last_name: student.last,
        grade: student.grade,
        section: student.section,
        has_sibling: student.sibling,
      };
      const result = await createStudent(studentData);
      if (result && result.id) {
        student.id = result.id;
        // Update local DB with API-assigned ID
        const idx = DB.students.findIndex(s => s === student);
        if (idx !== -1) DB.students[idx] = student;
      }
    } catch (err) {
      console.error('Failed to create student via API:', err);
    }
  }
  
  if (!options.skipSave) await saveDB();
  return student;
}

async function deleteStudentRecord(id) {
  const idx = DB.students.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  
  const student = DB.students[idx];
  
  // Remove from local DB
  DB.students.splice(idx, 1);
  
  // Sync with API
  try {
    await deleteStudent(id);
  } catch (err) {
    console.error('Failed to delete student via API:', err);
    // Re-add to local DB if API delete fails
    DB.students.splice(idx, 0, student);
    return false;
  }
  
  await saveDB();
  return true;
}

/**
 * Remove saved student rows (names + fee inputs) for a new school year.
 * Keeps section layout, section names, and custom fee columns.
 * @param {{ scope: 'section'|'grade'|'all', grade?: string, section?: string, clearReceipts?: boolean }} options
 */
async function resetStudentsForSchoolYear(options) {
  const scope = options.scope || 'section';
  const grade = options.grade;
  const section = options.section != null ? String(options.section) : null;
  const clearReceipts = Boolean(options.clearReceipts);

  const studentsBefore = DB.students.length;

  if (scope === 'all') {
    DB.students = [];
  } else if (scope === 'grade' && grade) {
    DB.students = DB.students.filter((s) => s.grade !== grade);
  } else if (scope === 'section' && grade && section) {
    DB.students = DB.students.filter((s) => !(s.grade === grade && String(s.section) === section));
  } else {
    return { ok: false, reason: 'invalid_scope' };
  }

  const studentsRemoved = studentsBefore - DB.students.length;
  let receiptsRemoved = 0;

  if (clearReceipts && Array.isArray(DB.receipts)) {
    const receiptsBefore = DB.receipts.length;
    if (scope === 'all') {
      DB.receipts = [];
    } else if (scope === 'grade' && grade) {
      DB.receipts = DB.receipts.filter((r) => r.grade !== grade);
    } else if (scope === 'section' && grade && section) {
      DB.receipts = DB.receipts.filter((r) => !(r.grade === grade && String(r.section) === section));
    }
    receiptsRemoved = receiptsBefore - DB.receipts.length;
  }

  await saveDB();
  return { ok: true, studentsRemoved, receiptsRemoved };
}
