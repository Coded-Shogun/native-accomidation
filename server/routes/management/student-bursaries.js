const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken, authorizeRole } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');
const emailService = require('../../services/emailService');

// All routes require authentication and manager/admin role
router.use(authenticateToken);
router.use(authorizeRole('manager', 'admin'));

/**
 * Get all student bursaries with filtering
 * GET /api/management/student-bursaries
 */
router.get('/', async (req, res) => {
  try {
    const { status, bursary_provider_id, academic_year } = req.query;

    let sql = `
      SELECT sb.*, s.first_name, s.last_name, s.student_number, s.email,
             bp.name as bursary_provider_name, bp.type as provider_type
      FROM student_bursaries sb
      JOIN students s ON sb.student_id = s.id
      JOIN bursary_providers bp ON sb.bursary_provider_id = bp.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND sb.status = ?';
      params.push(status);
    }

    if (bursary_provider_id) {
      sql += ' AND sb.bursary_provider_id = ?';
      params.push(bursary_provider_id);
    }

    if (academic_year) {
      sql += ' AND sb.academic_year = ?';
      params.push(academic_year);
    }

    sql += ' ORDER BY sb.created_at DESC LIMIT 100';

    const bursaries = await getAll(sql, params);

    res.json(bursaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single student bursary with detailed info
 * GET /api/management/student-bursaries/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const bursaryId = req.params.id;

    const bursary = await getOne(
      `SELECT sb.*, s.first_name, s.last_name, s.student_number, s.email, s.phone_number,
              bp.name as bursary_provider_name, bp.type as provider_type,
              bp.contact_person, bp.contact_email
       FROM student_bursaries sb
       JOIN students s ON sb.student_id = s.id
       JOIN bursary_providers bp ON sb.bursary_provider_id = bp.id
       WHERE sb.id = ?`,
      [bursaryId]
    );

    if (!bursary) {
      return res.status(404).json({ error: 'Student bursary not found' });
    }

    // Get compliance alerts for this bursary
    const alerts = await getAll(
      `SELECT * FROM bursary_compliance_alerts
       WHERE student_bursary_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [bursaryId]
    );

    // Get latest residence verification
    const latestVerification = await getOne(
      `SELECT * FROM residence_verifications
       WHERE student_id = ?
       ORDER BY verification_date DESC
       LIMIT 1`,
      [bursary.student_id]
    );

    // Get conduct records
    const conductRecords = await getAll(
      `SELECT * FROM conduct_records
       WHERE student_id = ? AND affects_bursary = 1
       ORDER BY incident_date DESC`,
      [bursary.student_id]
    );

    res.json({
      ...bursary,
      alerts,
      latest_residence_verification: latestVerification,
      conduct_records: conductRecords,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Create new student bursary
 * POST /api/management/student-bursaries
 */
router.post('/', async (req, res) => {
  try {
    const {
      student_id,
      bursary_provider_id,
      bursary_reference,
      amount,
      currency,
      academic_year,
      start_date,
      end_date,
      conditions,
      payment_schedule,
    } = req.body;

    if (!student_id || !bursary_provider_id || !bursary_reference || !amount || !academic_year || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify student exists
    const student = await getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify provider exists
    const provider = await getOne('SELECT * FROM bursary_providers WHERE id = ?', [
      bursary_provider_id,
    ]);
    if (!provider) {
      return res.status(404).json({ error: 'Bursary provider not found' });
    }

    const result = await runQuery(
      `INSERT INTO student_bursaries (
        student_id, bursary_provider_id, bursary_reference, amount, currency,
        academic_year, start_date, end_date, conditions, payment_schedule, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        student_id,
        bursary_provider_id,
        bursary_reference,
        amount,
        currency || 'ZAR',
        academic_year,
        start_date,
        end_date,
        conditions ? JSON.stringify(conditions) : null,
        payment_schedule ? JSON.stringify(payment_schedule) : null,
      ]
    );

    logDataAccess({
      userId: req.user.id,
      resource: 'student_bursary',
      action: 'CREATE',
      resourceId: result.lastID,
      ip: req.ip,
      success: true,
      metadata: { student_id, bursary_provider_id, amount },
    });

    // Send notification email to student
    try {
      // TODO: Create a bursary assignment email template
      console.log(`Bursary assigned to student ${student.email}`);
    } catch (emailErr) {
      console.error('Failed to send bursary notification:', emailErr);
    }

    res.status(201).json({
      message: 'Student bursary created successfully',
      id: result.lastID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update student bursary status
 * PUT /api/management/student-bursaries/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const bursaryId = req.params.id;
    const { status, reason } = req.body;

    const validStatuses = ['pending', 'active', 'suspended', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const bursary = await getOne('SELECT * FROM student_bursaries WHERE id = ?', [bursaryId]);
    if (!bursary) {
      return res.status(404).json({ error: 'Student bursary not found' });
    }

    await runQuery(
      'UPDATE student_bursaries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, bursaryId]
    );

    // Create alert if suspended or cancelled
    if (status === 'suspended' || status === 'cancelled') {
      await runQuery(
        `INSERT INTO bursary_compliance_alerts (
          student_id, student_bursary_id, alert_type, severity, title, description
        ) VALUES (?, ?, 'other', 'critical', ?, ?)`,
        [
          bursary.student_id,
          bursaryId,
          `Bursary ${status}`,
          reason || `Your bursary has been ${status}. Please contact administration.`,
        ]
      );
    }

    logDataAccess({
      userId: req.user.id,
      resource: 'student_bursary',
      action: 'UPDATE',
      resourceId: bursaryId,
      ip: req.ip,
      success: true,
      metadata: { status, reason },
    });

    res.json({ message: 'Bursary status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get bursary statistics
 * GET /api/management/student-bursaries/stats/summary
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { academic_year } = req.query;

    let whereClause = '';
    const params = [];

    if (academic_year) {
      whereClause = 'WHERE academic_year = ?';
      params.push(academic_year);
    }

    const stats = await getOne(
      `SELECT
        COUNT(*) as total_bursaries,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_bursaries,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_bursaries,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        COUNT(DISTINCT student_id) as total_students,
        COUNT(DISTINCT bursary_provider_id) as total_providers
       FROM student_bursaries
       ${whereClause}`,
      params
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
