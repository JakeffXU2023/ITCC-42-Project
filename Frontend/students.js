let currentGrade = 'Grade 7';
let currentSection = '1';
let studentsPageReady = false;

function isStudentsPage() {
  return Boolean(document.getElementById('students-sheet'));
}

function bindModalClosers() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
}

function initStudentsPage() {
  if (!isStudentsPage() || studentsPageReady) return;
  studentsPageReady = true;

  renderGradeTabs();
  renderSectionPills();
  renderSpreadsheet();
  bindModalClosers();

  document.getElementById('student-search')?.addEventListener('input', renderSpreadsheet);
  document.getElementById('status-filter')?.addEventListener('change', renderSpreadsheet);

  document.getElementById('add-student-btn')?.addEventListener('click', openAddStudentModal);
  document.getElementById('save-student-btn')?.addEventListener('click', saveNewStudent);
  document.getElementById('add-fee-column-btn')?.addEventListener('click', openAddColumnModal);
  document.getElementById('save-column-btn')?.addEventListener('click', saveNewColumn);
  document.getElementById('rename-section-btn')?.addEventListener('click', openRenameSectionModal);
  document.getElementById('save-section-name-btn')?.addEventListener('click', saveSectionName);
  document.getElementById('add-section-btn')?.addEventListener('click', onAddSection);
  document.getElementById('remove-section-btn')?.addEventListener('click', openRemoveSectionModal);
  document.getElementById('confirm-section-btn')?.addEventListener('click', confirmRemoveSection);
  document.getElementById('clear-all-fees-btn')?.addEventListener('click', onClearAllFeeCategories);
  document.getElementById('school-year-reset-btn')?.addEventListener('click', openSchoolYearResetModal);
  document.getElementById('confirm-school-year-reset-btn')?.addEventListener('click', confirmSchoolYearReset);
  document.querySelectorAll('input[name="reset-scope"]').forEach((input) => {
    input.addEventListener('change', updateSchoolYearResetSummary);
  });
  document.getElementById('reset-clear-receipts')?.addEventListener('change', updateSchoolYearResetSummary);
  document.getElementById('import-excel-btn')?.addEventListener('click', () => {
    if (typeof window.openImportModal === 'function') window.openImportModal();
    else toast('Import module did not load. Refresh the page.');
  });
}

function bootStudentsPage() {
  try {
    initStudentsPage();
  } catch (err) {
    console.error('Student Records failed to start:', err);
    showSpreadsheetError(err);
  }
}

function showSpreadsheetError(err) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;
  const msg = err && err.message ? err.message : String(err);
  tbody.innerHTML =
    '<tr><td colspan="12" class="sheet-empty">Could not load spreadsheet. ' +
    escapeAttr(msg) +
    '<br><br><button type="button" class="btn btn-sm" id="sheet-retry-btn">Try again</button></td></tr>';
  document.getElementById('sheet-retry-btn')?.addEventListener('click', () => {
    studentsPageReady = false;
    bootStudentsPage();
  });
}

function updatePageBadge() {
  const badge = document.getElementById('page-badge');
  if (badge) badge.textContent = currentGrade + ' – ' + getSectionDisplayName(currentGrade, currentSection);
}

function renderGradeTabs() {
  const container = document.getElementById('grade-tabs');
  if (!container) return;
  const grades = [7, 8, 9, 10, 11, 12];
  container.innerHTML = grades
    .map((n) => {
      const label = 'Grade ' + n;
      const active = label === currentGrade ? 'active' : '';
      return '<button type="button" class="tab-btn ' + active + '" data-grade="' + label + '">' + label + '</button>';
    })
    .join('');

  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentGrade = btn.dataset.grade;
      currentSection = '1';
      renderGradeTabs();
      renderSectionPills();
      renderSpreadsheet();
    });
  });
  updatePageBadge();
}

function renderSectionPills() {
  const container = document.getElementById('section-pills-container');
  if (!container) return;
  const count = getSectionCount(currentGrade);
  const pills = [];
  for (let i = 1; i <= count; i += 1) {
    const active = String(i) === String(currentSection) ? 'active' : '';
    const label = getSectionDisplayName(currentGrade, i);
    const defaultLabel = 'Sec ' + i;
    const isCustom = label !== defaultLabel;
    pills.push(
      '<button type="button" class="sec-pill ' +
        active +
        (isCustom ? ' sec-pill-named' : '') +
        '" data-section="' +
        i +
        '" title="' +
        escapeAttr(label + (isCustom ? ' (Sec ' + i + ')' : ' — double-click to rename')) +
        '">' +
        escapeAttr(label) +
        '</button>'
    );
  }
  container.innerHTML = pills.join('');

  container.querySelectorAll('.sec-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      currentSection = pill.dataset.section;
      renderSectionPills();
      renderSpreadsheet();
    });
    pill.addEventListener('dblclick', (e) => {
      e.preventDefault();
      currentSection = pill.dataset.section;
      renderSectionPills();
      openRenameSectionModal();
    });
  });
  updatePageBadge();
}

function openRenameSectionModal() {
  const gradeLabel = document.getElementById('rename-section-grade-label');
  const numLabel = document.getElementById('rename-section-num-label');
  const input = document.getElementById('rename-section-input');
  const defaultName = 'Sec ' + currentSection;
  const currentName = getSectionDisplayName(currentGrade, currentSection);

  if (gradeLabel) gradeLabel.textContent = currentGrade;
  if (numLabel) numLabel.textContent = currentSection;
  if (input) {
    input.value = currentName === defaultName ? '' : currentName;
    input.placeholder = 'e.g. Maggie, Hope (default: ' + defaultName + ')';
  }
  openModal('rename-section-modal');
  input?.focus();
  input?.select();
}

function saveSectionName() {
  const input = document.getElementById('rename-section-input');
  const value = input ? input.value : '';
  setSectionDisplayName(currentGrade, currentSection, value);
  closeModal('rename-section-modal');
  renderSectionPills();
  renderSpreadsheet();
  const label = getSectionDisplayName(currentGrade, currentSection);
  toast('Section renamed to "' + label + '".');
}

function getDisplayRows() {
  const query = (document.getElementById('student-search')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('status-filter')?.value || '';
  const filtering = Boolean(query || statusFilter);

  let students = getStudentsByGradeSection(currentGrade, currentSection).sort((a, b) => a.id - b.id);

  if (filtering) {
    return students
      .filter((student) => {
        const name = getStudentFullName(student).toLowerCase();
        const parent = (student.parent || '').toLowerCase();
        const matchesQuery = !query || name.includes(query) || parent.includes(query);
        const status = getStudentStatus(student);
        const matchesStatus = !statusFilter || status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .map((student) => ({ student: student }));
  }

  const rows = students.map((student) => ({ student: student }));
  while (rows.length < DEFAULT_ROWS_PER_SECTION) {
    rows.push({ blank: true });
  }
  return rows;
}

function renderSpreadsheet() {
  const table = document.getElementById('students-sheet');
  const thead = document.getElementById('students-thead');
  const tbody = document.getElementById('students-tbody');
  if (!table || !thead || !tbody) return;

  try {
    const columns = getSpreadsheetColumns(currentGrade);
    const rows = getDisplayRows();

    const headerCells = [
      '<th class="sheet-th sheet-th-fixed">#</th>',
    '<th class="sheet-th sheet-th-parent">Parents</th>',
    '<th class="sheet-th sheet-th-student">Name of Student</th>',
      '<th class="sheet-th sheet-th-sibling" title="Exempt from SPTA & School Paper">Sibling</th>',
    ]
      .concat(
        columns.map(function (col) {
          return (
            '<th class="sheet-th sheet-th-fee">' +
            col.label +
            (col.custom
              ? ' <button type="button" class="col-remove-btn" data-key="' +
                col.key +
                '" title="Remove column">×</button>'
              : '') +
            '</th>'
          );
        })
      )
      .concat([
        '<th class="sheet-th sheet-th-total">Total</th>',
        '<th class="sheet-th sheet-th-status">Payment Status</th>',
        '<th class="sheet-th sheet-th-actions">Actions</th>',
      ]);

    thead.innerHTML = '<tr>' + headerCells.join('') + '</tr>';

    thead.querySelectorAll('.col-remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.key;
        if (!window.confirm('Remove this fee column for ' + currentGrade + '?')) return;
        if (removeCustomColumn(currentGrade, key)) {
          toast('Column removed.');
          renderSpreadsheet();
        }
      });
    });

    tbody.innerHTML = rows
      .map((row, index) => {
        if (row.student) return renderStudentRow(row.student, index, columns);
        return renderBlankRow(index, columns);
      })
      .join('');

    bindSpreadsheetInputs(tbody);
  } catch (err) {
    console.error('renderSpreadsheet error:', err);
    showSpreadsheetError(err);
  }
}

function renderFeeCell(student, col) {
  if (student.sibling && isSiblingExemptFee(col.key)) {
    return (
      '<td class="sheet-td-fee sheet-td-exempt"><span class="sheet-exempt-label" title="Sibling exemption — SPTA & School Paper">Exempt</span></td>'
    );
  }
  const val = Number(student.amounts && student.amounts[col.key]) || 0;
  return (
    '<td class="sheet-td-fee"><input class="sheet-input sheet-input-num" type="number" min="0" step="0.01" data-id="' +
    student.id +
    '" data-field="amount-' +
    col.key +
    '" value="' +
    (val === 0 ? '' : val) +
    '" placeholder="0"></td>'
  );
}

function renderStudentRow(student, index, columns) {
  syncAllPaymentStatuses(student);
  const status = getStudentStatus(student);
  const feeCells = columns.map((col) => renderFeeCell(student, col)).join('');

  const rowClass = isPlaceholderStudent(student) ? 'sheet-row-empty' : '';

  return (
    '<tr class="' +
    rowClass +
    '" data-student-id="' +
    student.id +
    '">' +
    '<td class="sheet-td-num">' +
    (index + 1) +
    '</td>' +
    '<td class="sheet-td-parent"><input class="sheet-input sheet-input-parent" type="text" data-id="' +
    student.id +
    '" data-field="parent" value="' +
    escapeAttr(normalizeParentName(student.parent || '')) +
    '" placeholder="Enter parent name"></td>' +
    '<td class="sheet-td-student"><input class="sheet-input sheet-input-student" type="text" data-id="' +
    student.id +
    '" data-field="name" value="' +
    escapeAttr(normalizePersonName(getStudentDisplayName(student))) +
    '" placeholder="ENTER STUDENT NAME"></td>' +
    '<td class="sheet-td-sibling"><label class="sheet-sibling-check"><input type="checkbox" data-id="' +
    student.id +
    '" data-field="sibling"' +
    (student.sibling ? ' checked' : '') +
    ' title="Exempt from SPTA & School Paper"><span>Sibling</span></label></td>' +
    feeCells +
    '<td class="sheet-td-total">' +
    peso(getStudentTotal(student)) +
    '</td>' +
    '<td class="sheet-td-status">' +
    badgeHTML(status) +
    '</td>' +
    '<td class="sheet-td-actions">' +
    '<button type="button" class="btn btn-xs" data-action="pay" data-id="' +
    student.id +
    '">Payment</button>' +
    '<button type="button" class="btn btn-xs btn-danger" data-action="clear" data-id="' +
    student.id +
    '">Clear</button>' +
    '</td>' +
    '</tr>'
  );
}

function renderBlankRow(index, columns) {
  const feeCells = columns
    .map(
      (col) =>
        '<td class="sheet-td-fee"><input class="sheet-input sheet-input-num" type="number" min="0" step="0.01" data-blank="1" data-field="amount-' +
        col.key +
        '" value="" placeholder="0"></td>'
    )
    .join('');

  return (
    '<tr class="sheet-row-empty" data-blank="1">' +
    '<td class="sheet-td-num">' +
    (index + 1) +
    '</td>' +
    '<td class="sheet-td-parent"><input class="sheet-input sheet-input-parent" type="text" data-blank="1" data-field="parent" value="" placeholder="Enter parent name"></td>' +
    '<td class="sheet-td-student"><input class="sheet-input sheet-input-student" type="text" data-blank="1" data-field="name" value="" placeholder="ENTER STUDENT NAME"></td>' +
    '<td class="sheet-td-sibling"><span class="sheet-muted">—</span></td>' +
    feeCells +
    '<td class="sheet-td-total">' +
    peso(0) +
    '</td>' +
    '<td class="sheet-td-status">' +
    badgeHTML('unpaid') +
    '</td>' +
    '<td class="sheet-td-actions"><span class="sheet-muted">Type to save row</span></td>' +
    '</tr>'
  );
}

function escapeAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function ensureStudentFromInput(input) {
  const existingId = Number(input.dataset.id);
  if (existingId) return getStudentById(existingId);

  const tr = input.closest('tr');
  if (!tr || !tr.dataset.blank) return null;

  const student = addStudentRecord(currentGrade, currentSection, {});
  tr.dataset.studentId = student.id;
  tr.removeAttribute('data-blank');
  tr.classList.remove('sheet-row-empty');

  tr.querySelectorAll('input[data-field]').forEach((inp) => {
    inp.dataset.id = student.id;
    inp.removeAttribute('data-blank');
  });

  const actions = tr.querySelector('.sheet-td-actions');
  if (actions) {
    actions.innerHTML =
      '<button type="button" class="btn btn-xs" data-action="pay" data-id="' +
      student.id +
      '">Payment</button>' +
      '<button type="button" class="btn btn-xs btn-danger" data-action="clear" data-id="' +
      student.id +
      '">Clear</button>';
    actions.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === 'clear') onClearStudentRow(id);
        if (btn.dataset.action === 'pay') openPaymentModal(id);
      });
    });
  }

  return student;
}

function applyUppercaseToStudentNameInput(input) {
  if (input.dataset.field !== 'name') return;
  const pos = input.selectionStart;
  const upper = normalizePersonName(input.value);
  if (input.value !== upper) {
    input.value = upper;
    if (pos != null) input.setSelectionRange(pos, pos);
  }
}

function bindSpreadsheetInputs(tbody) {
  tbody.querySelectorAll('.sheet-input').forEach((input) => {
    if (input.dataset.field === 'parent') {
      input.classList.add('sheet-input-parent');
    }
    if (input.dataset.field === 'name') {
      input.classList.add('sheet-input-student');
      input.addEventListener('input', applyUppercaseToStudentNameInput);
    }
    input.addEventListener('change', onSheetCellChange);
    input.addEventListener('blur', onSheetCellChange);
  });

  tbody.querySelectorAll('input[data-field="sibling"]').forEach((input) => {
    input.addEventListener('change', onSiblingToggle);
  });

  tbody.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      if (btn.dataset.action === 'clear') onClearStudentRow(id);
      if (btn.dataset.action === 'pay') openPaymentModal(id);
    });
  });
}

function onSheetCellChange(event) {
  const input = event.target;
  const field = input.dataset.field;
  if (!field) return;

  const student = ensureStudentFromInput(input);
  if (!student) return;

  if (field === 'parent') {
    student.parent = normalizeParentName(input.value);
    input.value = student.parent;
    saveDB();
    return;
  }

  if (field === 'name') {
    setStudentDisplayName(student, input.value);
    input.value = getStudentDisplayName(student);
    saveDB();
    return;
  }

  if (field.indexOf('amount-') === 0) {
    const key = field.replace('amount-', '');
    if (student.sibling && isSiblingExemptFee(key)) return;
    if (!student.amounts) student.amounts = {};
    student.amounts[key] = Math.max(0, Number(input.value) || 0);
    syncPaymentStatus(student, key);
    saveDB();
    renderSpreadsheet();
  }
}

function onSiblingToggle(event) {
  const input = event.target;
  const student = getStudentById(Number(input.dataset.id));
  if (!student) return;
  setStudentSibling(student, input.checked);
  saveDB();
  if (input.checked) {
    toast('Sibling marked — SPTA & School Paper are exempt.');
  }
  renderSpreadsheet();
}

function openAddStudentModal() {
  const nameInput = document.getElementById('new-student-name');
  const parentInput = document.getElementById('new-student-parent');
  const siblingInput = document.getElementById('new-student-sibling');
  if (nameInput) nameInput.value = '';
  if (parentInput) parentInput.value = '';
  if (siblingInput) siblingInput.checked = false;
  if (nameInput && !nameInput.dataset.uppercaseBound) {
    nameInput.dataset.uppercaseBound = '1';
    nameInput.classList.add('sheet-input-student');
    nameInput.addEventListener('input', applyUppercaseToStudentNameInput);
  }
  openModal('add-student-modal');
  parentInput?.focus();
}

async function saveNewStudent() {
  const name = normalizePersonName(document.getElementById('new-student-name')?.value || '');
  const parent = normalizeParentName(document.getElementById('new-student-parent')?.value || '');
  if (!name) {
    toast('Student name is required.');
    return;
  }
  const isSibling = Boolean(document.getElementById('new-student-sibling')?.checked);
  try {
    await addStudentRecord(currentGrade, currentSection, { name: name, parent: parent, sibling: isSibling });
    closeModal('add-student-modal');
    toast('Student row added.');
    renderSpreadsheet();
  } catch (err) {
    console.error('Failed to add student:', err);
    toast('Failed to add student. Please try again.');
  }
}

function openAddColumnModal() {
  const label = document.getElementById('add-column-grade-label');
  const nameInput = document.getElementById('new-column-label');
  if (label) label.textContent = currentGrade;
  if (nameInput) nameInput.value = '';
  openModal('add-column-modal');
  nameInput?.focus();
}

function saveNewColumn() {
  const label = (document.getElementById('new-column-label')?.value || '').trim();
  if (!label) {
    toast('Enter a category name.');
    return;
  }
  const col = addCustomColumn(currentGrade, label);
  if (!col) return;
  closeModal('add-column-modal');
  toast('Column "' + col.label + '" added for ' + currentGrade + '.');
  renderSpreadsheet();
}

function onAddSection() {
  addSectionToGrade(currentGrade);
  toast('Section added. Total: ' + getSectionCount(currentGrade));
  renderSectionPills();
}

function countSectionStudents(grade, section) {
  return getStudentsByGradeSection(grade, section).filter((s) => !isPlaceholderStudent(s)).length;
}

function updateRemoveSectionMessage() {
  const select = document.getElementById('remove-section-select');
  const message = document.getElementById('confirm-section-message');
  const confirmBtn = document.getElementById('confirm-section-btn');
  if (!select || !message) return;

  const section = select.value;

  if (section === '__all__') {
    const status = getGradeExtraSectionsStatus(currentGrade);
    if (status.blockedStudents > 0) {
      message.textContent =
        'Cannot remove all: ' +
        status.blockedStudents +
        ' student row(s) still have data in sections 2–' +
        status.sectionCount +
        '. Clear or move them first.';
      message.style.color = 'var(--red-600, #dc2626)';
    } else {
      message.textContent =
        'Removes ' +
        status.extraCount +
        ' empty section(s). "' +
        getSectionDisplayName(currentGrade, 1) +
        '" (Section 1) will remain.';
      message.style.color = '';
    }
    if (confirmBtn) confirmBtn.textContent = 'Remove all extra sections';
    return;
  }

  if (confirmBtn) confirmBtn.textContent = 'Remove section';

  const name = getSectionDisplayName(currentGrade, section);
  const count = countSectionStudents(currentGrade, section);
  if (count > 0) {
    message.textContent =
      '"' + name + '" has ' + count + ' student row(s) with data. Clear or move them before removing.';
    message.style.color = 'var(--red-600, #dc2626)';
  } else {
    message.textContent = '"' + name + '" is empty and can be removed.';
    message.style.color = '';
  }
}

function openRemoveSectionModal() {
  const count = getSectionCount(currentGrade);
  if (count <= 1) {
    toast('This grade already has only one section.');
    return;
  }

  const gradeLabel = document.getElementById('remove-section-grade-label');
  const select = document.getElementById('remove-section-select');
  if (gradeLabel) gradeLabel.textContent = currentGrade;

  if (select) {
    const options = [
      '<option value="__all__">All extra sections (keep Section 1 only)</option>',
    ];
    for (let i = 1; i <= count; i += 1) {
      const name = getSectionDisplayName(currentGrade, i);
      const students = countSectionStudents(currentGrade, i);
      const suffix = students > 0 ? ' — ' + students + ' student(s)' : ' — empty';
      options.push('<option value="' + i + '">' + escapeAttr(name + suffix) + '</option>');
    }
    select.innerHTML = options.join('');
    select.value = String(currentSection);

    if (!select.dataset.changeBound) {
      select.dataset.changeBound = '1';
      select.addEventListener('change', updateRemoveSectionMessage);
    }
  }

  updateRemoveSectionMessage();
  openModal('confirm-section-modal');
}

function confirmRemoveSection() {
  const select = document.getElementById('remove-section-select');
  const sectionToRemove = select?.value;
  if (!sectionToRemove) return;

  closeModal('confirm-section-modal');

  if (sectionToRemove === '__all__') {
    const result = removeAllExtraSectionsFromGrade(currentGrade);
    if (!result.ok) {
      if (result.reason === 'has_students') {
        toast('Cannot remove all: ' + result.studentCount + ' student row(s) still have data in extra sections.');
      } else {
        toast('This grade already has only one section.');
      }
      return;
    }
    currentSection = '1';
    toast('Removed ' + result.removed + ' section(s). Only Section 1 remains.');
    renderSectionPills();
    renderSpreadsheet();
    return;
  }

  const displayName = getSectionDisplayName(currentGrade, sectionToRemove);

  if (!removeSectionFromGrade(currentGrade, sectionToRemove)) {
    toast('Cannot remove "' + displayName + '": it still has student data.');
    return;
  }

  const removedNum = Number(sectionToRemove);
  const curNum = Number(currentSection);
  if (curNum === removedNum) {
    currentSection = String(Math.min(removedNum, getSectionCount(currentGrade)));
  } else if (curNum > removedNum) {
    currentSection = String(curNum - 1);
  }

  toast('"' + displayName + '" removed.');
  renderSectionPills();
  renderSpreadsheet();
}

function clearStudentFeeCategories(student) {
  getSpreadsheetColumns(student.grade).forEach((col) => {
    if (!student.amounts) student.amounts = {};
    if (!student.payments) student.payments = {};
    student.amounts[col.key] = 0;
    if (student.sibling && isSiblingExemptFee(col.key)) {
      student.payments[col.key] = 'exempt';
    } else {
      student.payments[col.key] = 'unpaid';
    }
  });
  syncAllPaymentStatuses(student);
}

function onClearStudentRow(id) {
  const student = getStudentById(id);
  if (!student) return;
  setStudentDisplayName(student, '');
  student.parent = '';
  setStudentSibling(student, false);
  clearStudentFeeCategories(student);
  saveDB();
  toast('Row cleared.');
  renderSpreadsheet();
}

function countStudentsInResetScope(scope) {
  if (scope === 'all') return DB.students.length;
  if (scope === 'grade') return DB.students.filter((s) => s.grade === currentGrade).length;
  return getStudentsByGradeSection(currentGrade, currentSection).length;
}

function countReceiptsInResetScope(scope) {
  if (!Array.isArray(DB.receipts)) return 0;
  if (scope === 'all') return DB.receipts.length;
  if (scope === 'grade') return DB.receipts.filter((r) => r.grade === currentGrade).length;
  return DB.receipts.filter(
    (r) => r.grade === currentGrade && String(r.section) === String(currentSection)
  ).length;
}

function updateSchoolYearResetSummary() {
  const scope = document.querySelector('input[name="reset-scope"]:checked')?.value || 'section';
  const summary = document.getElementById('reset-summary');
  const sectionLabel = document.getElementById('reset-scope-section-label');
  const gradeLabel = document.getElementById('reset-scope-grade-label');
  if (sectionLabel) {
    sectionLabel.textContent = currentGrade + ' – ' + getSectionDisplayName(currentGrade, currentSection);
  }
  if (gradeLabel) gradeLabel.textContent = currentGrade;

  const students = countStudentsInResetScope(scope);
  const receipts = countReceiptsInResetScope(scope);
  const clearReceipts = document.getElementById('reset-clear-receipts')?.checked;

  if (!summary) return;
  if (students === 0 && (!clearReceipts || receipts === 0)) {
    summary.textContent = 'Nothing saved to delete for this scope.';
    summary.style.color = '';
    return;
  }
  let text = 'Will delete ' + students + ' saved student row(s)';
  if (clearReceipts && receipts > 0) text += ' and ' + receipts + ' receipt(s)';
  else if (clearReceipts) text += ' (no receipts in this scope)';
  text += '. Empty spreadsheet rows will remain ready for new entries.';
  summary.textContent = text;
  summary.style.color = 'var(--red-600, #dc2626)';
}

function openSchoolYearResetModal() {
  const confirmInput = document.getElementById('reset-confirm-input');
  const receiptsCheck = document.getElementById('reset-clear-receipts');
  const sectionRadio = document.querySelector('input[name="reset-scope"][value="section"]');
  if (sectionRadio) sectionRadio.checked = true;
  if (receiptsCheck) receiptsCheck.checked = false;
  if (confirmInput) confirmInput.value = '';
  updateSchoolYearResetSummary();
  openModal('school-year-reset-modal');
  confirmInput?.focus();
}

async function confirmSchoolYearReset() {
  const typed = (document.getElementById('reset-confirm-input')?.value || '').trim();
  if (typed !== 'RESET') {
    toast('Type RESET in the box to confirm.');
    return;
  }

  const scope = document.querySelector('input[name="reset-scope"]:checked')?.value || 'section';
  const clearReceipts = Boolean(document.getElementById('reset-clear-receipts')?.checked);
  const students = countStudentsInResetScope(scope);

  if (students === 0 && (!clearReceipts || countReceiptsInResetScope(scope) === 0)) {
    toast('Nothing to reset for this scope.');
    return;
  }

  const result = await resetStudentsForSchoolYear({
    scope: scope,
    grade: currentGrade,
    section: currentSection,
    clearReceipts: clearReceipts,
  });

  if (!result.ok) {
    toast('Reset could not be completed.');
    return;
  }

  closeModal('school-year-reset-modal');
  if (scope === 'all') {
    currentGrade = 'Grade 7';
    currentSection = '1';
  }

  let msg = 'School year reset complete. Removed ' + result.studentsRemoved + ' student row(s).';
  if (clearReceipts && result.receiptsRemoved > 0) {
    msg += ' Removed ' + result.receiptsRemoved + ' receipt(s).';
  }
  toast(msg);

  if (typeof window.renderReceiptsTable === 'function') window.renderReceiptsTable();
  renderGradeTabs();
  renderSectionPills();
  renderSpreadsheet();
}

function onClearAllFeeCategories() {
  const students = getStudentsByGradeSection(currentGrade, currentSection);
  const hasAmounts = students.some((student) =>
    getSpreadsheetColumns(student.grade).some((col) => Number(student.amounts?.[col.key]) > 0)
  );
  if (!hasAmounts) {
    toast('No fee amounts to clear in this section.');
    return;
  }

  const sectionLabel = getSectionDisplayName(currentGrade, currentSection);
  const ok = window.confirm(
    'Clear all fee amounts in ' +
      currentGrade +
      ' – ' +
      sectionLabel +
      '?\n\nStudent names, parents, and sibling settings will be kept.'
  );
  if (!ok) return;

  students.forEach(clearStudentFeeCategories);
  saveDB();
  toast('Cleared fee amounts for all students in this section.');
  renderSpreadsheet();
}

function addImportedStudentsForSection(students, grade, section) {
  let added = 0;
  let skipped = 0;
  students.forEach((row) => {
    const name = (row.name || '').trim();
    if (!name) {
      skipped += 1;
      return;
    }
    const amounts = {
      spta: Number(row.spta) || 0,
      paper: Number(row.paper) || 0,
      org: Number(row.org) || 0,
      sports: Number(row.sports) || 0,
      insurance: Number(row.insurance) || 0,
    };
    if (hasGraduationFees(grade)) amounts.graduation = Number(row.graduation) || 0;

    addStudentRecord(grade, section, {
      name: normalizePersonName(name),
      parent: normalizeParentName(row.parent || ''),
      amounts: amounts,
    });
    added += 1;
  });
  renderSpreadsheet();
  return { added: added, skipped: skipped };
}

window.renderStudents = renderSpreadsheet;
window.loadStudents = renderSpreadsheet;
window.addImportedStudents = function (students) {
  const result = addImportedStudentsForSection(students, currentGrade, currentSection);
  toast(
    result.added +
      ' student' +
      (result.added !== 1 ? 's' : '') +
      ' imported' +
      (result.skipped ? ' · ' + result.skipped + ' skipped' : '') +
      '.'
  );
};

async function ensureDBReady() {
  if (DB !== null) return;
  return new Promise((resolve) => {
    document.addEventListener('dbReady', () => resolve(), { once: true });
    initializeDB().then(() => resolve()).catch((err) => {
      console.error('Failed to initialize DB:', err);
      showBackendError();
      resolve(); // Still resolve to prevent hanging
    });
  });
}

function showBackendError() {
  const tbody = document.getElementById('students-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="12" class="sheet-empty" style="color:var(--red-600);font-weight:600;">Error: Backend not running</td></tr>';
  }
  // Hide all controls
  document.getElementById('add-student-btn')?.setAttribute('disabled', 'disabled');
  document.getElementById('add-fee-column-btn')?.setAttribute('disabled', 'disabled');
  document.getElementById('import-excel-btn')?.setAttribute('disabled', 'disabled');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await ensureDBReady();
    bootStudentsPage();
  });
} else {
  ensureDBReady().then(() => bootStudentsPage());
}
