const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken, authorizeRole } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');

// All routes require authentication and staff/manager/admin role
router.use(authenticateToken);
router.use(authorizeRole('staff', 'manager', 'admin'));

/**
 * Get residence verifications
 * GET /api/management/residence-verification
 */
router.get('/', async (req, res) => {
  try {
    const { student_id, property_id, date_from, date_to } = req.query;

    let sql = `
      SELECT rv.*, s.first_name, s.last_name, s.student_number,
             p.name as property_name, u.full_name as verified_by_name
      FROM residence_verifications rv
      JOIN students s ON rv.student_id = s.id
      JOIN properties p ON rv.property_id = p.id
      LEFT JOIN users u ON rv.verified_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (student_id) {
      sql += ' AND rv.student_id = ?';
      params.push(student_id);
    }

    if (property_id) {
      sql += ' AND rv.property_id = ?';
      params.push(property_id);
    }

    if (date_from) {
      sql += ' AND rv.verification_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      sql += ' AND rv.verification_date <= ?';
      params.push(date_to);
    }

    sql += ' ORDER BY rv.verification_date DESC, rv.created_at DESC LIMIT 100';

    const verifications = await getAll(sql, params);

    res.json(verifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Record new residence verification
 * POST /api/management/residence-verification
 */
router.post('/', async (req, res) => {
  try {
    const {
      student_id,
      property_id,
      verification_date,
      verification_type,
      verification_method,
      is_present,
      notes,
      evidence_url,
    } = req.body;

    if (
      !student_id ||
      !property_id ||
      !verification_date ||
      !verification_type ||
      !verification_method ||
      is_present === undefined
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify student exists
    const student = await getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student has active bursary
    const bursary = await getOne(
      'SELECT * FROM student_bursaries WHERE student_id = ? AND status = "active"',
      [student_id]
    );

    const result = await runQuery(
      `INSERT INTO residence_verifications (
        student_id, property_id, verification_date, verification_type,
        verified_by, verification_method, is_present, notes, evidence_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        property_id,
        verification_date,
        verification_type,
        req.user.id,
        verification_method,
        is_present ? 1 : 0,
        notes || null,
        evidence_url || null,
      ]
    );

    // If student was not present and has active bursary, create alert
    if (!is_present && bursary) {
      await runQuery(
        `INSERT INTO bursary_compliance_alerts (
          student_id, student_bursary_id, alert_type, severity, title, description
        ) VALUES (?, ?, 'residence', 'warning', 'Residence Verification Failed', ?)`,
        [
          student_id,
          bursary.id,
          `Student was not present during ${verification_type} verification on ${verification_date}. ${notes || ''}`,
        ]
      );
    }

    logDataAccess({
      userId: req.user.id,
      resource: 'residence_verification',
      action: 'CREATE',
      resourceId: result.lastID,
      ip: req.ip,
      success: true,
      metadata: { student_id, is_present },
    });

    res.status(201).json({
      message: 'Residence verification recorded successfully',
      id: result.lastID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Bulk verify students (e.g., from access log data)
 * POST /api/management/residence-verification/bulk
 */
router.post('/bulk', async (req, res) => {
  try {
    const { property_id, verification_date, verification_type, student_ids } = req.body;

    if (!property_id || !verification_date || !verification_type || !Array.isArray(student_ids)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let successCount = 0;
    const errors = [];

    for (const studentId of student_ids) {
      try {
        await runQuery(
          `INSERT INTO residence_verifications (
            student_id, property_id, verification_date, verification_type,
            verified_by, verification_method, is_present
          ) VALUES (?, ?, ?, ?, ?, 'access_log', 1)`,
          [studentId, property_id, verification_date, verification_type, req.user.id]
        );
        successCount++;
      } catch (err) {
        errors.push({ student_id: studentId, error: err.message });
      }
    }

    res.json({
      message: `Bulk verification completed`,
      success_count: successCount,
      total_count: student_ids.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get attendance rate for student
 * GET /api/management/residence-verification/student/:student_id/rate
 */
router.get('/student/:student_id/rate', async (req, res) => {
  try {
    const studentId = req.params.student_id;
    const { date_from, date_to } = req.query;

    let whereClause = 'WHERE student_id = ?';
    const params = [studentId];

    if (date_from) {
      whereClause += ' AND verification_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND verification_date <= ?';
      params.push(date_to);
    }

    const stats = await getOne(
      `SELECT
        COUNT(*) as total_verifications,
        SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) as positive_verifications,
        ROUND(CAST(SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as attendance_rate
       FROM residence_verifications
       ${whereClause}`,
      params
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
