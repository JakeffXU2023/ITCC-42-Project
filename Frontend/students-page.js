const STUDENT_GRADES = ['7', '8', '9', '10', '11', '12'];
let studentRecords = [];
let studentDetails = [];
let activeGrade = '7';
let activeSection = '1';
let activeStatus = '';

function parseStudentStatuses(statusString) {
  if (!statusString) return [];
  return statusString.split('|').map((pair) => pair.split(':')[1] || 'unpaid');
}

function determineStudentStatus(statuses) {
  if (!statuses.length) return 'unpaid';
  if (statuses.every((status) => status === 'paid' || status === 'exempt')) return 'paid';
  if (statuses.every((status) => status === 'unpaid')) return 'unpaid';
  return 'partial';
}

function statusBadge(status) {
  const map = { paid: 'badge-paid', unpaid: 'badge-unpaid', partial: 'badge-partial', exempt: 'badge-exempt' };
  const labels = { paid: 'Fully paid', unpaid: 'Unpaid', partial: 'Partial', exempt: 'Exempt' };
  return `<span class="badge ${map[status] || 'badge-exempt'}">${labels[status] || status}</span>`;
}

function getCurrentSectionCount() {
  return GRADE_SECTIONS[Number(activeGrade)] || 0;
}

function getSectionLabel(section) {
  return `Sec ${section}`;
}

function tryGetStudentInfo(student) {
  const detail = studentDetails.find((item) => item.id === student.id);
  const statuses = parseStudentStatuses(detail?.payment_statuses || '');
  const status = determineStudentStatus(statuses);
  return {
    ...student,
    statuses,
    status,
    total_paid: detail?.total_paid || 0,
    spta: detail?.spta_paid ?? student.spta,
    school_paper: detail?.school_paper_paid ?? student.school_paper,
    school_org: detail?.school_org_paid ?? student.school_org,
    sports: detail?.sports_paid ?? student.sports,
    insurance_amount: detail?.insurance_paid ?? student.insurance_amount,
    graduation: detail?.graduation_paid ?? student.graduation,
  };
}

async function loadStudentRecords() {
  studentRecords = (await fetchStudents().catch(() => [])).map(normalizeStudent);
  studentDetails = await fetchDetailedStudentReport().catch(() => []);
}

function displayGrade(grade) {
  if (!grade) return '';
  return grade.startsWith('Grade ') ? grade : `Grade ${grade}`;
}

function renderGradeTabs() {
  const container = document.getElementById('grade-tabs');
  if (!container) return;
  container.innerHTML = STUDENT_GRADES.map((grade) => `
    <button class="tab-item ${grade === activeGrade ? 'active' : ''}" data-grade="${grade}">${displayGrade(grade)}</button>
  `).join('');
  container.querySelectorAll('.tab-item').forEach((button) => {
    button.addEventListener('click', () => {
      activeGrade = button.dataset.grade;
      activeSection = '1';
      renderSectionPills();
      renderStudentsTable();
      updatePageBadge();
    });
  });
}

function renderSectionPills() {
  const container = document.getElementById('section-pills-container');
  if (!container) return;
  const max = getSectionLabel(getCurrentSectionCount());
  const count = Number(max.replace('Sec ', '')) || 0;
  container.innerHTML = Array.from({ length: count }, (_, index) => {
    const section = String(index + 1);
    return `<button class="pill ${section === activeSection ? 'active' : ''}" data-section="${section}">${getSectionLabel(section)}</button>`;
  }).join('');
  container.querySelectorAll('.pill').forEach((button) => {
    button.addEventListener('click', () => {
      activeSection = button.dataset.section;
      renderSectionPills();
      renderStudentsTable();
    });
  });
}

function updatePageBadge() {
  const badge = document.getElementById('page-badge');
  if (badge) {
    badge.textContent = `${displayGrade(activeGrade)} – Sec ${activeSection}`;
  }
}

function renderStudentsTable() {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;
  const query = (document.getElementById('student-search')?.value || '').trim().toLowerCase();
  const statusFilter = (document.getElementById('status-filter')?.value || '').trim();
  const rows = studentRecords
    .filter((student) => student.grade === activeGrade && student.section === activeSection)
    .map(tryGetStudentInfo)
    .filter((student) => {
      if (statusFilter && student.status !== statusFilter) return false;
      if (!query) return true;
      return `${student.first} ${student.last} ${student.grade} ${student.section}`.toLowerCase().includes(query);
    });

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:24px;">No students found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((student) => `
      <tr>
        <td>${student.last}, ${student.first}</td>
        <td>${peso(student.spta)}</td>
        <td>${peso(student.school_paper)}</td>
        <td>${peso(student.school_org)}</td>
        <td>${peso(student.sports)}</td>
        <td>${student.insurance_choice === 'cut_off' ? 'Cut-Off' : peso(student.insurance_amount)}</td>
        <td>${peso(student.graduation)}</td>
        <td>${peso(student.total_paid)}</td>
        <td>${statusBadge(student.status)}</td>
        <td><button class="btn btn-xs" type="button" data-id="${student.id}" data-action="view">View</button></td>
      </tr>`)
    .join('');

  tbody.querySelectorAll('button[data-action="view"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);
      const student = studentRecords.find((item) => item.id === id);
      if (student) {
        alert(`Selected: ${student.last}, ${student.first} — ${student.grade} / Sec ${student.section}`);
      }
    });
  });
}

function getVisibleStudents() {
  const query = (document.getElementById('student-search')?.value || '').trim().toLowerCase();
  const statusFilter = (document.getElementById('status-filter')?.value || '').trim();

  return studentRecords
    .filter((student) => student.grade === activeGrade && student.section === activeSection)
    .map(tryGetStudentInfo)
    .filter((student) => {
      if (statusFilter && student.status !== statusFilter) return false;
      if (!query) return true;
      return `${student.first} ${student.last} ${student.grade} ${student.section}`.toLowerCase().includes(query);
    });
}

function toCsvValue(value) {
  const text = String(value ?? '');
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function exportVisibleStudentsToCsv() {
  const rows = getVisibleStudents();
  if (!rows.length) {
    toast('No student records to export.');
    return;
  }

  const headers = [
    'Last Name',
    'First Name',
    'Grade',
    'Section',
    'SPTA',
    'School Paper',
    'School Org',
    'Sports',
    'Insurance',
    'Graduation',
    'Total Paid',
    'Status',
  ];

  const csvLines = [
    headers.map(toCsvValue).join(','),
    ...rows.map((student) => [
      student.last,
      student.first,
      student.grade,
      student.section,
      student.spta,
      student.school_paper,
      student.school_org,
      student.sports,
      student.insurance_choice === 'cut_off' ? 'Cut-Off' : student.insurance_amount,
      student.graduation,
      Number(student.total_paid || 0).toFixed(2),
      student.status,
    ].map(toCsvValue).join(',')),
  ];

  const csvContent = `\uFEFF${csvLines.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const datePart = new Date().toISOString().slice(0, 10);
  const filename = `students_grade-${activeGrade}_sec-${activeSection}_${datePart}.csv`;
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast(`${rows.length} student${rows.length !== 1 ? 's' : ''} exported.`);
}

function openAddStudentDialog() {
  const overlay = document.getElementById('add-student-modal-overlay');
  if (!overlay) return;

  const gradeSelect = overlay.querySelector('#add-student-grade');
  const sectionSelect = overlay.querySelector('#add-student-section');
  const firstNameInput = overlay.querySelector('#add-student-first');
  const lastNameInput = overlay.querySelector('#add-student-last');
  const siblingCheckbox = overlay.querySelector('#add-student-sibling');

  firstNameInput.value = '';
  lastNameInput.value = '';
  gradeSelect.value = activeGrade;
  setAddStudentSectionOptions(activeGrade);
  sectionSelect.value = activeSection;
  siblingCheckbox.checked = false;

  overlay.classList.add('open');
}

function closeAddStudentDialog() {
  document.getElementById('add-student-modal-overlay')?.classList.remove('open');
}

function setAddStudentSectionOptions(grade) {
  const sectionSelect = document.getElementById('add-student-section');
  if (!sectionSelect) return;
  const count = GRADE_SECTIONS[Number(grade)] || 0;
  sectionSelect.innerHTML = Array.from({ length: count }, (_, index) => {
    const section = String(index + 1);
    return `<option value="${section}">${getSectionLabel(section)}</option>`;
  }).join('');
}

async function submitAddStudentForm(event) {
  event?.preventDefault();
  const overlay = document.getElementById('add-student-modal-overlay');
  if (!overlay) return;

  const first = overlay.querySelector('#add-student-first').value.trim();
  const last = overlay.querySelector('#add-student-last').value.trim();
  const grade = overlay.querySelector('#add-student-grade').value;
  const section = overlay.querySelector('#add-student-section').value;
  const hasSibling = overlay.querySelector('#add-student-sibling').checked;

  if (!first || !last) {
    toast('Please enter first and last name.');
    return;
  }
  if (!grade) {
    toast('Please select a grade.');
    return;
  }
  if (!section) {
    toast('Please select a section.');
    return;
  }

  try {
    await createStudent({
      first_name: first,
      last_name: last,
      grade,
      section,
      has_sibling: hasSibling,
      spta: 0,
      school_paper: 0,
      school_org: 0,
      sports: 0,
      insurance_amount: 0,
      insurance_choice: 'unpaid',
      graduation: 0,
    });
    closeAddStudentDialog();
    await refreshStudents();
    toast('Student created successfully.');
  } catch (err) {
    console.error(err);
    toast('Unable to create student.');
  }
}

async function refreshStudents() {
  await loadStudentRecords();
  renderGradeTabs();
  renderSectionPills();
  renderStudentsTable();
  updatePageBadge();
}

async function initStudentsPage() {
  if (window.location.pathname.split('/').pop() !== 'students.html') return;
  document.getElementById('student-search')?.addEventListener('input', renderStudentsTable);
  document.getElementById('status-filter')?.addEventListener('change', renderStudentsTable);
  document.getElementById('add-student-btn')?.addEventListener('click', openAddStudentDialog);
  document.getElementById('add-student-close')?.addEventListener('click', closeAddStudentDialog);
  document.getElementById('add-student-cancel')?.addEventListener('click', closeAddStudentDialog);
  document.getElementById('export-excel-btn')?.addEventListener('click', exportVisibleStudentsToCsv);
  document.getElementById('add-student-grade')?.addEventListener('change', (event) => setAddStudentSectionOptions(event.target.value));
  document.getElementById('add-student-form')?.addEventListener('submit', submitAddStudentForm);
  document.getElementById('add-student-modal-overlay')?.addEventListener('click', (event) => {
    if (event.target.id === 'add-student-modal-overlay') closeAddStudentDialog();
  });
  await refreshStudents();
}

document.addEventListener('DOMContentLoaded', initStudentsPage);

document.addEventListener('students-imported', async () => {
  await refreshStudents();
});

window.addImportedStudents = async function (students) {
  let added = 0;
  for (const student of students) {
    const nameParts = String(student.name || '').split(',').map((part) => part.trim());
    const last = nameParts[0] || '';
    const first = nameParts[1] || '';
    if (!last || !first) continue;
    const newStudent = {
      first_name: first,
      last_name: last,
      grade: activeGrade,
      section: activeSection,
      has_sibling: false,
      spta: Number(student.spta) || 0,
      school_paper: Number(student.paper) || 0,
      school_org: Number(student.org) || 0,
      sports: Number(student.sports) || 0,
      insurance_amount: Number(student.insurance) || 0,
      insurance_choice: String(student.insurance).toLowerCase() === 'cut-off' ? 'cut_off' : 'paid',
      graduation: Number(student.graduation) || 0,
    };
    try {
      await createStudent(newStudent);
      added += 1;
    } catch (err) {
      console.error('Import failed for', newStudent, err);
    }
  }
  await refreshStudents();
  toast(`${added} student${added !== 1 ? 's' : ''} imported successfully.`);
};
