const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync, getCurrentSchoolYear, normalizeSchoolYear, switchSchoolYear } = require('../db-connection');

const DEFAULT_GRADE_SECTIONS = { 7: 12, 8: 13, 9: 10, 10: 11, 11: 13, 12: 13 };

router.get('/school-year', (req, res) => {
  res.json({
    schoolYear: getCurrentSchoolYear(),
  });
});

router.put('/school-year', async (req, res) => {
  try {
    const normalizedSchoolYear = normalizeSchoolYear(req.body?.schoolYear);
    if (!normalizedSchoolYear) {
      return res.status(400).json({
        error: 'School year must use the YYYY-YYYY format and span consecutive years.',
      });
    }

    const result = await switchSchoolYear(normalizedSchoolYear);
    res.json({
      message: 'School year updated successfully',
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sections', async (req, res) => {
  try {
    const rows = await allAsync('SELECT grade, section_count FROM section_settings ORDER BY grade');
    const sections = Object.fromEntries(Object.entries(DEFAULT_GRADE_SECTIONS).map(([grade, count]) => [grade, count]));

    rows.forEach((row) => {
      sections[String(row.grade)] = Number(row.section_count);
    });

    res.json({ sections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sections/:grade', async (req, res) => {
  try {
    const grade = Number(req.params.grade);
    if (!Number.isInteger(grade) || grade < 7 || grade > 12) {
      return res.status(400).json({ error: 'Invalid grade.' });
    }

    const delta = Number(req.body?.delta || 0);
    if (![-1, 1].includes(delta)) {
      return res.status(400).json({ error: 'Delta must be 1 or -1.' });
    }

    const currentRow = await getAsync('SELECT section_count FROM section_settings WHERE grade = ?', [grade]);
    const currentCount = Number(currentRow?.section_count || DEFAULT_GRADE_SECTIONS[grade] || 1);
    const nextCount = currentCount + delta;

    if (nextCount < 1 || nextCount > 13) {
      return res.status(400).json({ error: 'Section count must stay between 1 and 13.' });
    }

    if (delta < 0) {
      const sectionsToRemove = Array.from({ length: currentCount - nextCount }, (_, index) => String(currentCount - index));
      const placeholders = sectionsToRemove.map(() => '?').join(', ');
      const studentsInRemovedSections = await allAsync(
        `SELECT COUNT(*) as count FROM students WHERE grade = ? AND section IN (${placeholders})`,
        [grade, ...sectionsToRemove]
      );
      const removedCount = Number(studentsInRemovedSections?.[0]?.count || 0);
      if (removedCount > 0) {
        return res.status(409).json({
          error: 'Cannot remove sections that still have students assigned to them.',
        });
      }
    }

    await runAsync(
      `INSERT INTO section_settings (grade, section_count)
       VALUES (?, ?)
       ON CONFLICT(grade) DO UPDATE SET section_count = excluded.section_count`,
      [grade, nextCount]
    );

    res.json({
      message: 'Section count updated successfully',
      grade,
      sectionCount: nextCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
