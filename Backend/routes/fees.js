const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync } = require('../db-connection');

// Get all fees
router.get('/', async (req, res) => {
  try {
    const fees = await allAsync('SELECT * FROM fees ORDER BY id');
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new fee category
router.post('/', async (req, res) => {
  try {
    const { name, amount, scope } = req.body;
    if (!name || amount == null || !scope) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await runAsync('INSERT INTO fees (name, amount, scope) VALUES (?, ?, ?)', [name, amount, scope]);
    res.status(201).json({ id: result.id, message: 'Fee category created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update fee category
router.put('/:id', async (req, res) => {
  try {
    const { name, amount, scope } = req.body;
    if (!name || amount == null || !scope) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    await runAsync('UPDATE fees SET name = ?, amount = ?, scope = ? WHERE id = ?', [name, amount, scope, req.params.id]);
    res.json({ message: 'Fee category updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete fee category
router.delete('/:id', async (req, res) => {
  try {
    await runAsync('DELETE FROM fees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Fee category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
