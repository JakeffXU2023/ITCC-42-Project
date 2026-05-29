const express = require('express');
const router = express.Router();
const { allAsync, getAsync } = require('../db-connection');

// Get overall summary
router.get('/summary', async (req, res) => {
  try {
    const totalStudents = await getAsync('SELECT COUNT(*) as count FROM students');
    const totalReceipts = await getAsync('SELECT COUNT(*) as count, SUM(amount) as total FROM receipts');
    const paymentSummary = await allAsync(`
      SELECT fee_type, status, COUNT(*) as count
      FROM payment_status
      GROUP BY fee_type, status
    `);
    const totalDisbursements = await getAsync('SELECT COUNT(*) as count, SUM(amount) as total FROM disbursements');

    res.json({
      totalStudents: totalStudents.count,
      totalReceipts: totalReceipts.count,
      totalReceiptsAmount: totalReceipts.total || 0,
      paymentSummary,
      totalDisbursements: totalDisbursements.count,
      totalDisbursementsAmount: totalDisbursements.total || 0,
      netAmount: (totalReceipts.total || 0) - (totalDisbursements.total || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get report by category (School Paper, Sports, etc.)
router.get('/by-category', async (req, res) => {
  try {
    const categoryReport = await allAsync(`
      SELECT 
        fee_type as category,
        COUNT(DISTINCT student_id) as students_with_fee,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
        SUM(CASE WHEN status = 'exempt' THEN 1 ELSE 0 END) as exempt,
        SUM(amount_paid) as total_amount_collected
      FROM payment_status
      GROUP BY fee_type
      ORDER BY fee_type
    `);
    res.json(categoryReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get report by grade
router.get('/by-grade', async (req, res) => {
  try {
    const gradeReport = await allAsync(`
      SELECT 
        s.grade,
        COUNT(DISTINCT s.id) as total_students,
        SUM(CASE WHEN ps.status = 'paid' THEN 1 ELSE 0 END) as total_paid,
        SUM(CASE WHEN ps.status = 'unpaid' THEN 1 ELSE 0 END) as total_unpaid,
        SUM(ps.amount_paid) as total_amount_collected
      FROM students s
      LEFT JOIN payment_status ps ON s.id = ps.student_id
      GROUP BY s.grade
      ORDER BY s.grade
    `);
    res.json(gradeReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get report by grade and section
router.get('/by-section/:grade', async (req, res) => {
  try {
    const sectionReport = await allAsync(`
      SELECT 
        s.grade,
        s.section,
        COUNT(DISTINCT s.id) as total_students,
        SUM(CASE WHEN ps.status = 'paid' THEN 1 ELSE 0 END) as total_paid,
        SUM(CASE WHEN ps.status = 'unpaid' THEN 1 ELSE 0 END) as total_unpaid,
        SUM(ps.amount_paid) as total_amount_collected
      FROM students s
      LEFT JOIN payment_status ps ON s.id = ps.student_id
      WHERE s.grade = ?
      GROUP BY s.section
      ORDER BY s.section
    `, [req.params.grade]);
    res.json(sectionReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get detailed student payment report
router.get('/students/detailed', async (req, res) => {
  try {
    const detailedReport = await allAsync(`
      SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.grade,
        s.section,
        s.has_sibling,
        GROUP_CONCAT(ps.fee_type || ':' || ps.status, '|') as payment_statuses,
        SUM(ps.amount_paid) as total_paid,
        SUM(CASE WHEN ps.fee_type IN ('spta', 'spta_membership') THEN ps.amount_paid ELSE 0 END) as spta_paid,
        SUM(CASE WHEN ps.fee_type IN ('school_paper', 'paper') THEN ps.amount_paid ELSE 0 END) as school_paper_paid,
        SUM(CASE WHEN ps.fee_type IN ('school_org', 'org', 'school_organization') THEN ps.amount_paid ELSE 0 END) as school_org_paid,
        SUM(CASE WHEN ps.fee_type = 'sports' THEN ps.amount_paid ELSE 0 END) as sports_paid,
        SUM(CASE WHEN ps.fee_type = 'insurance' THEN ps.amount_paid ELSE 0 END) as insurance_paid,
        SUM(CASE WHEN ps.fee_type = 'graduation' THEN ps.amount_paid ELSE 0 END) as graduation_paid
      FROM students s
      LEFT JOIN payment_status ps ON s.id = ps.student_id
      GROUP BY s.id
      ORDER BY s.grade, s.section, s.last_name, s.first_name
    `);
    res.json(detailedReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get disbursements report
router.get('/disbursements', async (req, res) => {
  try {
    const disbursements = await allAsync(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        GROUP_CONCAT(purpose, '; ') as purposes
      FROM disbursements
      GROUP BY category
      ORDER BY category
    `);
    res.json(disbursements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get students with siblings
router.get('/siblings/list', async (req, res) => {
  try {
    const siblings = await allAsync(`
      SELECT 
        id,
        first_name,
        last_name,
        grade,
        section,
        has_sibling
      FROM students
      WHERE has_sibling = 1
      ORDER BY grade, section, last_name, first_name
    `);
    res.json(siblings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
