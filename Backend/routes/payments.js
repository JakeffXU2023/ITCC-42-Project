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

    // Check if payment record exists
    const existing = await getAsync(
      'SELECT * FROM payment_status WHERE student_id = ? AND fee_type = ?',
      [student_id, normalizedFeeType]
    );
    
    if (existing) {
      // Update existing payment
      await runAsync(
        `UPDATE payment_status SET status = ?, amount_paid = ?, date_paid = CURRENT_TIMESTAMP WHERE student_id = ? AND fee_type = ?`,
        [status, amount_paid || 0, student_id, normalizedFeeType]
      );
      res.json({ message: 'Payment updated successfully' });
    } else {
      // Create new payment record
      const result = await runAsync(
        `INSERT INTO payment_status (student_id, fee_type, status, amount_paid, date_paid) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [student_id, normalizedFeeType, status, amount_paid || 0]
      );
      res.status(201).json({ id: result.id, message: 'Payment recorded successfully' });
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
