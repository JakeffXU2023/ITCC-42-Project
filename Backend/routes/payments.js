const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync } = require('../db-connection');

function normalizeFeeType(feeType) {
  const value = String(feeType || '').trim().toLowerCase();
  if (['paper', 'schoolpaper', 'school_paper'].includes(value)) return 'school_paper';
  if (['org', 'schoolorg', 'school_org', 'school_organization', 'schoolorganization'].includes(value)) return 'school_org';
  if (['spta', 'spta_membership', 'spta membership'].includes(value)) return 'spta';
  if (['graduation', 'graduation_fee', 'graduation fee'].includes(value)) return 'graduation';
  if (value === 'insurance') return 'insurance';
  if (value === 'sports') return 'sports';
  return value;
}

function getDueAmountForStudent(student, feeType) {
  if (!student) return 0;

  if (feeType === 'spta') return Number(student.spta || 0);
  if (feeType === 'school_paper') return Number(student.school_paper || 0);
  if (feeType === 'school_org') return Number(student.school_org || 0);
  if (feeType === 'sports') return Number(student.sports || 0);
  if (feeType === 'insurance') {
    if (String(student.insurance_choice || '').toLowerCase() === 'cut_off') {
      return 0;
    }
    return Number(student.insurance_amount || 0);
  }
  if (feeType === 'graduation') return Number(student.graduation || 0);
  return 0;
}

function resolvePaymentStatus(amountPaid, dueAmount, fallbackStatus = 'unpaid') {
  const paidAmount = Number(amountPaid || 0);
  const expectedAmount = Number(dueAmount || 0);

  if (expectedAmount <= 0) {
    return paidAmount <= 0 ? 'exempt' : 'overpaid';
  }
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount < expectedAmount) return 'partial';
  if (paidAmount === expectedAmount) return 'paid';
  return 'overpaid';
}

// Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await allAsync('SELECT ps.*, s.first_name, s.last_name FROM payment_status ps JOIN students s ON ps.student_id = s.id ORDER BY ps.created_at DESC');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payments for a specific student
router.get('/student/:studentId', async (req, res) => {
  try {
    const payments = await allAsync('SELECT * FROM payment_status WHERE student_id = ? ORDER BY fee_type', [req.params.studentId]);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record a payment
router.post('/', async (req, res) => {
  try {
    const { student_id, fee_type, status, amount_paid } = req.body;
    const normalizedFeeType = normalizeFeeType(fee_type);
    
    if (!student_id || !normalizedFeeType || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const student = await getAsync('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const dueAmount = getDueAmountForStudent(student, normalizedFeeType);
    const resolvedStatus = resolvePaymentStatus(amount_paid, dueAmount, status);
    
    // Check if payment record exists
    const existing = await getAsync(
      'SELECT * FROM payment_status WHERE student_id = ? AND fee_type = ?',
      [student_id, normalizedFeeType]
    );
    
    if (existing) {
      // Update existing payment
      await runAsync(
        `UPDATE payment_status SET status = ?, amount_paid = ?, date_paid = CURRENT_TIMESTAMP WHERE student_id = ? AND fee_type = ?`,
        [resolvedStatus, amount_paid || 0, student_id, normalizedFeeType]
      );
      res.json({ message: 'Payment updated successfully', status: resolvedStatus });
    } else {
      // Create new payment record
      const result = await runAsync(
        `INSERT INTO payment_status (student_id, fee_type, status, amount_paid, date_paid) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [student_id, normalizedFeeType, resolvedStatus, amount_paid || 0]
      );
      res.status(201).json({ id: result.id, status: resolvedStatus, message: 'Payment recorded successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment summary by status
router.get('/summary/by-status', async (req, res) => {
  try {
    const summary = await allAsync(`
      SELECT fee_type, status, COUNT(*) as count, SUM(amount_paid) as total_paid
      FROM payment_status
      GROUP BY fee_type, status
      ORDER BY fee_type, status
    `);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment status for all students in a grade
router.get('/grade/:grade/summary', async (req, res) => {
  try {
    const summary = await allAsync(`
      SELECT ps.fee_type, ps.status, COUNT(*) as count
      FROM payment_status ps
      JOIN students s ON ps.student_id = s.id
      WHERE s.grade = ?
      GROUP BY ps.fee_type, ps.status
      ORDER BY ps.fee_type, ps.status
    `, [req.params.grade]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
