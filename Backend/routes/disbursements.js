const express = require('express');
const router = express.Router();
const { allAsync, runAsync } = require('../db-connection');

router.get('/', async (req, res) => {
  try {
    const disbursements = await allAsync(`
      SELECT id, purpose, category, amount, disbursement_date, created_by, created_at
      FROM disbursements
      ORDER BY disbursement_date DESC, id DESC
    `);
    res.json(disbursements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { purpose, category, amount, created_by } = req.body;
    if (!purpose || !category || amount == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await runAsync(
      `INSERT INTO disbursements (purpose, category, amount, created_by)
       VALUES (?, ?, ?, ?)`,
      [purpose, category, amount, created_by || 'Admin']
    );

    res.status(201).json({
      id: result.id,
      message: 'Disbursement recorded successfully',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
