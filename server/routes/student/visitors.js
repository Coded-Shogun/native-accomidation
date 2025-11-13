const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');
const emailService = require('../../services/emailService');

// All routes require student authentication
router.use(authenticateToken);

/**
 * Register a new visitor
 * POST /api/student/visitors
 */
router.post('/', async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      visitor_name,
      visitor_id_number,
      visitor_phone,
      visit_date,
      visit_time_start,
      visit_time_end,
      visit_purpose,
    } = req.body;

    // Validate required fields
    if (!visitor_name || !visitor_id_number || !visitor_phone || !visit_date || !visit_time_start) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get student's active lease and property
    const lease = await getOne(
      'SELECT property_id FROM leases WHERE student_id = ? AND status = "active"',
      [studentId]
    );

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    // Generate unique access code (6-digit alphanumeric)
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await runQuery(
      `INSERT INTO visitors (
        student_id, property_id, visitor_name, visitor_id_number,
        visitor_phone, visit_date, visit_time_start, visit_time_end,
        visit_purpose, status, access_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        studentId,
        lease.property_id,
        visitor_name,
        visitor_id_number,
        visitor_phone,
        visit_date,
        visit_time_start,
        visit_time_end || null,
        visit_purpose || null,
        accessCode,
      ]
    );

    logDataAccess({
      userId: studentId,
      resource: 'visitor',
      action: 'CREATE',
      resourceId: result.lastID,
      ip: req.ip,
      success: true,
    });

    res.status(201).json({
      message: 'Visitor registration submitted for approval',
      visitor_id: result.lastID,
      access_code: accessCode,
      status: 'pending',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all visitor registrations for student
 * GET /api/student/visitors
 */
router.get('/', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status } = req.query;

    let sql = `
      SELECT v.*, p.name as property_name
      FROM visitors v
      JOIN properties p ON v.property_id = p.id
      WHERE v.student_id = ?
    `;

    const params = [studentId];

    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY v.visit_date DESC, v.created_at DESC LIMIT 50';

    const visitors = await getAll(sql, params);

    logDataAccess({
      userId: studentId,
      resource: 'visitors',
      action: 'READ',
      resourceId: null,
      ip: req.ip,
      success: true,
    });

    res.json(visitors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single visitor registration
 * GET /api/student/visitors/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const studentId = req.user.id;
    const visitorId = req.params.id;

    const visitor = await getOne(
      `SELECT v.*, p.name as property_name, u.full_name as approved_by_name
       FROM visitors v
       JOIN properties p ON v.property_id = p.id
       LEFT JOIN users u ON v.approved_by = u.id
       WHERE v.id = ? AND v.student_id = ?`,
      [visitorId, studentId]
    );

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor registration not found' });
    }

    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Cancel visitor registration
 * DELETE /api/student/visitors/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const studentId = req.user.id;
    const visitorId = req.params.id;

    const visitor = await getOne(
      'SELECT * FROM visitors WHERE id = ? AND student_id = ?',
      [visitorId, studentId]
    );

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor registration not found' });
    }

    if (['checked_in', 'checked_out'].includes(visitor.status)) {
      return res.status(400).json({ error: 'Cannot cancel a visitor who has already checked in' });
    }

    await runQuery('UPDATE visitors SET status = "rejected" WHERE id = ?', [visitorId]);

    logDataAccess({
      userId: studentId,
      resource: 'visitor',
      action: 'DELETE',
      resourceId: visitorId,
      ip: req.ip,
      success: true,
    });

    res.json({ message: 'Visitor registration cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
