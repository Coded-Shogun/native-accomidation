const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');

// All routes require student authentication
router.use(authenticateToken);

/**
 * Get all deliveries for student
 * GET /api/student/deliveries
 */
router.get('/', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status } = req.query;

    let sql = `
      SELECT d.*, p.name as property_name,
             u.full_name as received_by_name
      FROM deliveries d
      JOIN properties p ON d.property_id = p.id
      LEFT JOIN users u ON d.received_by = u.id
      WHERE d.student_id = ?
    `;

    const params = [studentId];

    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY d.created_at DESC LIMIT 50';

    const deliveries = await getAll(sql, params);

    logDataAccess({
      userId: studentId,
      resource: 'deliveries',
      action: 'READ',
      resourceId: null,
      ip: req.ip,
      success: true,
    });

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single delivery
 * GET /api/student/deliveries/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const studentId = req.user.id;
    const deliveryId = req.params.id;

    const delivery = await getOne(
      `SELECT d.*, p.name as property_name,
              u.full_name as received_by_name
       FROM deliveries d
       JOIN properties p ON d.property_id = p.id
       LEFT JOIN users u ON d.received_by = u.id
       WHERE d.id = ? AND d.student_id = ?`,
      [deliveryId, studentId]
    );

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    logDataAccess({
      userId: studentId,
      resource: 'delivery',
      action: 'READ',
      resourceId: deliveryId,
      ip: req.ip,
      success: true,
    });

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Mark delivery as picked up
 * PUT /api/student/deliveries/:id/pickup
 */
router.put('/:id/pickup', async (req, res) => {
  try {
    const studentId = req.user.id;
    const deliveryId = req.params.id;

    const delivery = await getOne(
      'SELECT * FROM deliveries WHERE id = ? AND student_id = ?',
      [deliveryId, studentId]
    );

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.status !== 'ready_for_pickup' && delivery.status !== 'delivered') {
      return res.status(400).json({
        error: 'Delivery is not ready for pickup',
        current_status: delivery.status,
      });
    }

    if (delivery.status === 'picked_up') {
      return res.status(400).json({ error: 'Delivery has already been picked up' });
    }

    const now = new Date().toISOString();

    await runQuery(
      `UPDATE deliveries
       SET status = 'picked_up',
           picked_up_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [now, deliveryId]
    );

    logDataAccess({
      userId: studentId,
      resource: 'delivery',
      action: 'UPDATE',
      resourceId: deliveryId,
      ip: req.ip,
      success: true,
      metadata: { action: 'pickup' },
    });

    res.json({
      message: 'Delivery marked as picked up',
      picked_up_at: now,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Search delivery by tracking number
 * GET /api/student/deliveries/track/:tracking_number
 */
router.get('/track/:tracking_number', async (req, res) => {
  try {
    const studentId = req.user.id;
    const trackingNumber = req.params.tracking_number;

    const delivery = await getOne(
      `SELECT d.*, p.name as property_name,
              u.full_name as received_by_name
       FROM deliveries d
       JOIN properties p ON d.property_id = p.id
       LEFT JOIN users u ON d.received_by = u.id
       WHERE d.tracking_number = ? AND d.student_id = ?`,
      [trackingNumber, studentId]
    );

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found with this tracking number' });
    }

    logDataAccess({
      userId: studentId,
      resource: 'delivery',
      action: 'READ',
      resourceId: delivery.id,
      ip: req.ip,
      success: true,
      metadata: { tracking_number: trackingNumber },
    });

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get delivery statistics for student
 * GET /api/student/deliveries/stats
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const studentId = req.user.id;

    const stats = await getOne(
      `SELECT
         COUNT(*) as total_deliveries,
         SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
         SUM(CASE WHEN status = 'delivered' OR status = 'ready_for_pickup' THEN 1 ELSE 0 END) as awaiting_pickup,
         SUM(CASE WHEN status = 'picked_up' THEN 1 ELSE 0 END) as picked_up,
         SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned
       FROM deliveries
       WHERE student_id = ?`,
      [studentId]
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
