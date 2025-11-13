const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');
const { decrypt } = require('../../utils/encryption');

// All routes require student authentication
router.use(authenticateToken);

/**
 * Get current WiFi credentials for student's property
 * GET /api/student/wifi/current
 */
router.get('/current', async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student's property
    const lease = await getOne(
      'SELECT property_id FROM leases WHERE student_id = ? AND status = "active"',
      [studentId]
    );

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    // Get current valid WiFi credentials for the property
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const credentials = await getOne(
      `SELECT *
       FROM wifi_credentials
       WHERE property_id = ?
       AND is_active = 1
       AND valid_from <= ?
       AND valid_until >= ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [lease.property_id, now, now]
    );

    if (!credentials) {
      return res.status(404).json({
        error: 'No active WiFi credentials available',
        message: 'Please contact property management for WiFi access.',
      });
    }

    // Decrypt password before sending
    let decryptedPassword;
    try {
      decryptedPassword = decrypt(credentials.password);
    } catch (decryptError) {
      // If decryption fails, password might not be encrypted (backward compatibility)
      decryptedPassword = credentials.password;
    }

    // Calculate days until expiration
    const validUntilDate = new Date(credentials.valid_until);
    const daysUntilExpiration = Math.ceil((validUntilDate - new Date()) / (1000 * 60 * 60 * 24));

    logDataAccess({
      userId: studentId,
      resource: 'wifi_credentials',
      action: 'READ',
      resourceId: credentials.id,
      ip: req.ip,
      success: true,
    });

    res.json({
      network_name: credentials.network_name,
      password: decryptedPassword,
      valid_from: credentials.valid_from,
      valid_until: credentials.valid_until,
      days_until_expiration: daysUntilExpiration,
      expires_soon: daysUntilExpiration <= 7,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get WiFi credential history (past and upcoming)
 * GET /api/student/wifi/history
 */
router.get('/history', async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student's property
    const lease = await getOne(
      'SELECT property_id FROM leases WHERE student_id = ? AND status = "active"',
      [studentId]
    );

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    const credentials = await getAll(
      `SELECT id, network_name, valid_from, valid_until, is_active, created_at
       FROM wifi_credentials
       WHERE property_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [lease.property_id]
    );

    // Add status to each credential
    const now = new Date().toISOString().split('T')[0];
    const enrichedCredentials = credentials.map((cred) => {
      let status;
      if (!cred.is_active) {
        status = 'inactive';
      } else if (cred.valid_until < now) {
        status = 'expired';
      } else if (cred.valid_from > now) {
        status = 'upcoming';
      } else {
        status = 'current';
      }

      return {
        ...cred,
        status,
        password: undefined, // Don't include password in history
      };
    });

    logDataAccess({
      userId: studentId,
      resource: 'wifi_credentials',
      action: 'READ',
      resourceId: null,
      ip: req.ip,
      success: true,
      metadata: { action: 'history' },
    });

    res.json(enrichedCredentials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
