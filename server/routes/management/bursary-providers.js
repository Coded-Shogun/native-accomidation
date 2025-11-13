const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken, authorizeRole } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');

// All routes require authentication and manager/admin role
router.use(authenticateToken);
router.use(authorizeRole('manager', 'admin'));

/**
 * Get all bursary providers
 * GET /api/management/bursary-providers
 */
router.get('/', async (req, res) => {
  try {
    const { is_active } = req.query;

    let sql = 'SELECT * FROM bursary_providers';
    const params = [];

    if (is_active !== undefined) {
      sql += ' WHERE is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY name';

    const providers = await getAll(sql, params);

    logDataAccess({
      userId: req.user.id,
      resource: 'bursary_providers',
      action: 'READ',
      resourceId: null,
      ip: req.ip,
      success: true,
    });

    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single bursary provider with requirements
 * GET /api/management/bursary-providers/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const providerId = req.params.id;

    const provider = await getOne('SELECT * FROM bursary_providers WHERE id = ?', [providerId]);

    if (!provider) {
      return res.status(404).json({ error: 'Bursary provider not found' });
    }

    // Get requirements for this provider
    const requirements = await getAll(
      'SELECT * FROM bursary_requirements WHERE bursary_provider_id = ? ORDER BY is_mandatory DESC, requirement_name',
      [providerId]
    );

    // Get student count
    const stats = await getOne(
      `SELECT
        COUNT(*) as total_students,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_students
       FROM student_bursaries
       WHERE bursary_provider_id = ?`,
      [providerId]
    );

    res.json({
      ...provider,
      requirements,
      stats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Create new bursary provider
 * POST /api/management/bursary-providers
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      contact_person,
      contact_email,
      contact_phone,
      requirements,
      reporting_frequency,
      report_template,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const result = await runQuery(
      `INSERT INTO bursary_providers (
        name, type, contact_person, contact_email, contact_phone,
        requirements, reporting_frequency, report_template
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        type,
        contact_person || null,
        contact_email || null,
        contact_phone || null,
        requirements ? JSON.stringify(requirements) : null,
        reporting_frequency || 'monthly',
        report_template ? JSON.stringify(report_template) : null,
      ]
    );

    logDataAccess({
      userId: req.user.id,
      resource: 'bursary_provider',
      action: 'CREATE',
      resourceId: result.lastID,
      ip: req.ip,
      success: true,
    });

    res.status(201).json({
      message: 'Bursary provider created successfully',
      id: result.lastID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update bursary provider
 * PUT /api/management/bursary-providers/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const providerId = req.params.id;
    const {
      name,
      type,
      contact_person,
      contact_email,
      contact_phone,
      requirements,
      reporting_frequency,
      report_template,
      is_active,
    } = req.body;

    const provider = await getOne('SELECT * FROM bursary_providers WHERE id = ?', [providerId]);

    if (!provider) {
      return res.status(404).json({ error: 'Bursary provider not found' });
    }

    await runQuery(
      `UPDATE bursary_providers SET
        name = ?, type = ?, contact_person = ?, contact_email = ?, contact_phone = ?,
        requirements = ?, reporting_frequency = ?, report_template = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name || provider.name,
        type || provider.type,
        contact_person !== undefined ? contact_person : provider.contact_person,
        contact_email !== undefined ? contact_email : provider.contact_email,
        contact_phone !== undefined ? contact_phone : provider.contact_phone,
        requirements ? JSON.stringify(requirements) : provider.requirements,
        reporting_frequency || provider.reporting_frequency,
        report_template ? JSON.stringify(report_template) : provider.report_template,
        is_active !== undefined ? (is_active ? 1 : 0) : provider.is_active,
        providerId,
      ]
    );

    logDataAccess({
      userId: req.user.id,
      resource: 'bursary_provider',
      action: 'UPDATE',
      resourceId: providerId,
      ip: req.ip,
      success: true,
    });

    res.json({ message: 'Bursary provider updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add requirement to bursary provider
 * POST /api/management/bursary-providers/:id/requirements
 */
router.post('/:id/requirements', async (req, res) => {
  try {
    const providerId = req.params.id;
    const {
      requirement_type,
      requirement_name,
      description,
      metric_type,
      threshold_value,
      frequency,
      is_mandatory,
    } = req.body;

    if (!requirement_type || !requirement_name || !metric_type || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await runQuery(
      `INSERT INTO bursary_requirements (
        bursary_provider_id, requirement_type, requirement_name, description,
        metric_type, threshold_value, frequency, is_mandatory
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        providerId,
        requirement_type,
        requirement_name,
        description || null,
        metric_type,
        threshold_value || null,
        frequency,
        is_mandatory !== undefined ? (is_mandatory ? 1 : 0) : 1,
      ]
    );

    res.status(201).json({
      message: 'Requirement added successfully',
      id: result.lastID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
