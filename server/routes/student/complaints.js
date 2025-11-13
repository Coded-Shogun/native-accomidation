const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');

// All routes require student authentication
router.use(authenticateToken);

/**
 * Submit a new complaint
 * POST /api/student/complaints
 */
router.post('/', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { category, subject, description, severity, is_anonymous } = req.body;

    // Validate required fields
    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate category
    const validCategories = [
      'accommodation',
      'maintenance',
      'security',
      'noise',
      'cleanliness',
      'staff',
      'facilities',
      'other',
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const complaintSeverity = severity || 'medium';
    if (!validSeverities.includes(complaintSeverity)) {
      return res.status(400).json({ error: 'Invalid severity level' });
    }

    // Get student's active lease and property
    const lease = await getOne(
      'SELECT property_id FROM leases WHERE student_id = ? AND status = "active"',
      [studentId]
    );

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    const result = await runQuery(
      `INSERT INTO complaints (
        student_id, property_id, category, subject, description,
        severity, is_anonymous, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        studentId,
        lease.property_id,
        category,
        subject,
        description,
        complaintSeverity,
        is_anonymous ? 1 : 0,
      ]
    );

    logDataAccess({
      userId: studentId,
      resource: 'complaint',
      action: 'CREATE',
      resourceId: result.lastID,
      ip: req.ip,
      success: true,
      metadata: { category, severity: complaintSeverity, is_anonymous: is_anonymous ? 1 : 0 },
    });

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint_id: result.lastID,
      status: 'submitted',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all complaints for student
 * GET /api/student/complaints
 */
router.get('/', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, category } = req.query;

    let sql = `
      SELECT c.*, p.name as property_name,
             u.full_name as assigned_to_name
      FROM complaints c
      JOIN properties p ON c.property_id = p.id
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.student_id = ?
    `;

    const params = [studentId];

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (category) {
      sql += ' AND c.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT 50';

    const complaints = await getAll(sql, params);

    logDataAccess({
      userId: studentId,
      resource: 'complaints',
      action: 'READ',
      resourceId: null,
      ip: req.ip,
      success: true,
    });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single complaint
 * GET /api/student/complaints/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const studentId = req.user.id;
    const complaintId = req.params.id;

    const complaint = await getOne(
      `SELECT c.*, p.name as property_name,
              u.full_name as assigned_to_name
       FROM complaints c
       JOIN properties p ON c.property_id = p.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.id = ? AND c.student_id = ?`,
      [complaintId, studentId]
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    logDataAccess({
      userId: studentId,
      resource: 'complaint',
      action: 'READ',
      resourceId: complaintId,
      ip: req.ip,
      success: true,
    });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add update/comment to complaint (student perspective)
 * PUT /api/student/complaints/:id/comment
 */
router.put('/:id/comment', async (req, res) => {
  try {
    const studentId = req.user.id;
    const complaintId = req.params.id;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const complaint = await getOne(
      'SELECT * FROM complaints WHERE id = ? AND student_id = ?',
      [complaintId, studentId]
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.status === 'closed') {
      return res.status(400).json({ error: 'Cannot comment on a closed complaint' });
    }

    // Append comment to description (in production, use a separate comments table)
    const updatedDescription = `${complaint.description}\n\n--- Student Comment (${new Date().toISOString()}) ---\n${comment}`;

    await runQuery(
      'UPDATE complaints SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedDescription, complaintId]
    );

    logDataAccess({
      userId: studentId,
      resource: 'complaint',
      action: 'UPDATE',
      resourceId: complaintId,
      ip: req.ip,
      success: true,
      metadata: { action: 'comment_added' },
    });

    res.json({ message: 'Comment added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
