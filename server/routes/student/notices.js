const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');

// All routes require student authentication
router.use(authenticateToken);

/**
 * Get all active notices for student
 * GET /api/student/notices
 */
router.get('/', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { category } = req.query;

    // Get student's property
    const student = await getOne('SELECT * FROM students WHERE id = ?', [studentId]);
    const lease = await getOne(
      'SELECT property_id FROM leases WHERE student_id = ? AND status = "active"',
      [studentId]
    );

    if (!lease) {
      return res.json([]); // No active lease, no property-specific notices
    }

    let sql = `
      SELECT n.*, u.full_name as posted_by_name
      FROM notices n
      LEFT JOIN users u ON n.posted_by = u.id
      WHERE n.is_active = 1
      AND (n.target_audience = 'all' OR
           (n.target_audience = 'property' AND n.property_id = ?))
      AND (n.expires_at IS NULL OR n.expires_at > datetime('now'))
    `;

    const params = [lease.property_id];

    if (category) {
      sql += ' AND n.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY n.priority DESC, n.posted_at DESC LIMIT 50';

    const notices = await getAll(sql, params);

    logDataAccess({
      userId: studentId,
      resource: 'notices',
      action: 'READ',
      resourceId: null,
      ip: req.ip,
      success: true,
    });

    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single notice by ID
 * GET /api/student/notices/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const notice = await getOne(
      `SELECT n.*, u.full_name as posted_by_name
       FROM notices n
       LEFT JOIN users u ON n.posted_by = u.id
       WHERE n.id = ? AND n.is_active = 1`,
      [req.params.id]
    );

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
