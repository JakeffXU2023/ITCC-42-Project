const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync } = require('../db-connection');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await allAsync('SELECT * FROM students ORDER BY grade, section, last_name, first_name');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const student = await getAsync('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get payment status for this student
    const payments = await allAsync('SELECT * FROM payment_status WHERE student_id = ?', [req.params.id]);
    student.payments = payments;
    
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new student
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, parent, grade, section, has_sibling, spta, school_paper, school_org, sports, insurance_amount, insurance_choice, graduation } = req.body;
    
    if (!grade || !section) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedFirstName = String(first_name || '').trim();
    const normalizedLastName = String(last_name || '').trim();
    const normalizedGradeInput = String(grade).trim();
    const formattedGrade = normalizedGradeInput.startsWith('Grade ') ? normalizedGradeInput : `Grade ${normalizedGradeInput}`;
    const normalizedSection = String(section).trim();

    const duplicateStudent = await getAsync(
      `SELECT id FROM students
       WHERE lower(trim(first_name)) = lower(trim(?))
         AND lower(trim(last_name)) = lower(trim(?))
         AND lower(trim(grade)) = lower(trim(?))
         AND trim(section) = trim(?)`,
      [normalizedFirstName, normalizedLastName, formattedGrade, normalizedSection]
    );

    if (duplicateStudent) {
      return res.status(409).json({ error: 'Duplicate student already exists for that grade and section.' });
    }

    const result = await runAsync(
      `INSERT INTO students (first_name, last_name, parent, grade, section, has_sibling, spta, school_paper, school_org, sports, insurance_amount, insurance_choice, graduation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [normalizedFirstName, normalizedLastName, parent || '', formattedGrade, normalizedSection, has_sibling ? 1 : 0, spta || 0, school_paper || 0, school_org || 0, sports || 0, insurance_amount || 0, insurance_choice || 'unpaid', graduation || 0]
    );

    // Initialize payment statuses
    const feeTypes = ['spta', 'school_paper', 'school_org', 'sports', 'insurance', 'graduation'];
    for (const feeType of feeTypes) {
      if (feeType === 'graduation' && !['Grade 10', 'Grade 12'].includes(formattedGrade)) {
        continue; // Skip graduation for non-grade 10/12
      }
      await runAsync(
        `INSERT INTO payment_status (student_id, fee_type, status, amount_paid) VALUES (?, ?, ?, ?)`,
        [result.id, feeType, 'unpaid', 0]
      );
    }

    res.status(201).json({ id: result.id, message: 'Student created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, parent, grade, section, has_sibling, spta, school_paper, school_org, sports, insurance_amount, insurance_choice, graduation } = req.body;
    const formattedGrade = String(grade).trim().startsWith('Grade ') ? String(grade).trim() : `Grade ${String(grade).trim()}`;
    
    await runAsync(
      `UPDATE students SET first_name = ?, last_name = ?, parent = ?, grade = ?, section = ?, has_sibling = ?, spta = ?, school_paper = ?, school_org = ?, sports = ?, insurance_amount = ?, insurance_choice = ?, graduation = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [first_name, last_name, parent || '', formattedGrade, section, has_sibling ? 1 : 0, spta || 0, school_paper || 0, school_org || 0, sports || 0, insurance_amount || 0, insurance_choice || 'unpaid', graduation || 0, req.params.id]
    );

    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    await runAsync('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function normalizeGradeQuery(grade) {
  const value = String(grade).trim();
  const values = new Set([value]);
  if (/^\d+$/.test(value)) {
    values.add(`Grade ${value}`);
  }
  if (value.startsWith('Grade ')) {
    const numeric = value.replace('Grade ', '');
    if (/^\d+$/.test(numeric)) {
      values.add(numeric);
    }
  }
  return Array.from(values);
}

// Get students by grade
router.get('/grade/:grade', async (req, res) => {
  try {
    const gradeValues = normalizeGradeQuery(req.params.grade);
    const placeholders = gradeValues.map(() => '?').join(', ');
    const students = await allAsync(
      `SELECT * FROM students WHERE grade IN (${placeholders}) ORDER BY section, last_name, first_name`,
      gradeValues
    );
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get students by grade and section
router.get('/grade/:grade/section/:section', async (req, res) => {
  try {
    const gradeValues = normalizeGradeQuery(req.params.grade);
    const placeholders = gradeValues.map(() => '?').join(', ');
    const students = await allAsync(
      `SELECT * FROM students WHERE grade IN (${placeholders}) AND section = ? ORDER BY last_name, first_name`,
      [...gradeValues, req.params.section]
    );
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
