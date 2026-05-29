const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync } = require('../db-connection');

function parseReceiptRow(row) {
  const fees = row.fees ? JSON.parse(row.fees) : [];
  return {
    ...row,
    fees: Array.isArray(fees) ? fees : [row.fee_type].filter(Boolean),
    student: row.first_name && row.last_name ? `${row.last_name}, ${row.first_name}` : row.student || '',
  };
}

// Get all receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await allAsync(`
      SELECT r.*, s.first_name, s.last_name 
      FROM receipts r 
      JOIN students s ON r.student_id = s.id 
      ORDER BY r.payment_date DESC
    `);
    res.json(receipts.map(parseReceiptRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get receipts for a specific student
router.get('/student/:studentId', async (req, res) => {
  try {
    const receipts = await allAsync(`
      SELECT r.*, s.first_name, s.last_name
      FROM receipts r
      JOIN students s ON r.student_id = s.id
      WHERE r.student_id = ?
      ORDER BY r.payment_date DESC`,
      [req.params.studentId]
    );
    res.json(receipts.map(parseReceiptRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific receipt
router.get('/:id', async (req, res) => {
  try {
    const receipt = await getAsync('SELECT r.*, s.first_name, s.last_name FROM receipts r JOIN students s ON r.student_id = s.id WHERE r.id = ?', [req.params.id]);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(parseReceiptRow(receipt));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new receipt
router.post('/', async (req, res) => {
  try {
    const { student_id, fees, amount, notes } = req.body;
    if (!student_id || !fees || !Array.isArray(fees) || !fees.length || amount == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const receiptNumber = `RCP-${dateStr}-${randomNum}`;

    const result = await runAsync(
      `INSERT INTO receipts (receipt_number, student_id, fee_type, amount, notes, fees)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [receiptNumber, student_id, fees[0], amount, notes || '', JSON.stringify(fees)]
    );

    res.status(201).json({ 
      id: result.id, 
      receipt_number: receiptNumber,
      message: 'Receipt created successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a receipt
router.delete('/:id', async (req, res) => {
  try {
    await runAsync('DELETE FROM receipts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Receipt deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get receipts by date range
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const receipts = await allAsync(`
      SELECT r.*, s.first_name, s.last_name 
      FROM receipts r 
      JOIN students s ON r.student_id = s.id 
      WHERE DATE(r.payment_date) BETWEEN ? AND ?
      ORDER BY r.payment_date DESC
    `, [req.params.startDate, req.params.endDate]);
    res.json(receipts.map(parseReceiptRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get total receipts by fee type
router.get('/summary/by-type', async (req, res) => {
  try {
    const summary = await allAsync(`
      SELECT fee_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM receipts
      GROUP BY fee_type
      ORDER BY fee_type
    `);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
