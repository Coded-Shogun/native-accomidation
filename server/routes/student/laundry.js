const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');
const emailService = require('../../services/emailService');

router.use(authenticateToken);

/**
 * Get all laundry machines at student's property
 * GET /api/student/laundry/machines
 */
router.get('/machines', async (req, res) => {
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

    const machines = await getAll(
      `SELECT lm.*,
              s.first_name as current_user_first_name,
              s.last_name as current_user_last_name
       FROM laundry_machines lm
       LEFT JOIN students s ON lm.current_user_id = s.id
       WHERE lm.property_id = ? AND lm.is_active = 1
       ORDER BY lm.machine_number`,
      [lease.property_id]
    );

    // Calculate time remaining for machines in use
    const now = new Date();
    const enrichedMachines = machines.map((machine) => {
      if (machine.status === 'in_use' && machine.estimated_end_time) {
        const endTime = new Date(machine.estimated_end_time);
        const minutesRemaining = Math.max(0, Math.floor((endTime - now) / 60000));
        return {
          ...machine,
          minutes_remaining: minutesRemaining,
          is_current_user: machine.current_user_id === studentId,
        };
      }
      return {
        ...machine,
        is_current_user: machine.current_user_id === studentId,
      };
    });

    res.json(enrichedMachines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Start using a machine
 * POST /api/student/laundry/machines/:id/start
 */
router.post('/machines/:id/start', async (req, res) => {
  try {
    const studentId = req.user.id;
    const machineId = req.params.id;
    const { duration_minutes } = req.body; // Typical: 30-60 minutes

    const machine = await getOne('SELECT * FROM laundry_machines WHERE id = ?', [machineId]);

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    if (machine.status !== 'available') {
      return res.status(400).json({ error: 'Machine is not available' });
    }

    const cycleStartTime = new Date();
    const estimatedEndTime = new Date(cycleStartTime.getTime() + duration_minutes * 60000);

    await runQuery(
      `UPDATE laundry_machines
       SET status = 'in_use',
           current_user_id = ?,
           cycle_start_time = ?,
           estimated_end_time = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [studentId, cycleStartTime.toISOString(), estimatedEndTime.toISOString(), machineId]
    );

    logDataAccess({
      userId: studentId,
      resource: 'laundry_machine',
      action: 'START',
      resourceId: machineId,
      ip: req.ip,
      success: true,
    });

    res.json({
      message: 'Machine started successfully',
      estimated_end_time: estimatedEndTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * End machine use
 * POST /api/student/laundry/machines/:id/end
 */
router.post('/machines/:id/end', async (req, res) => {
  try {
    const studentId = req.user.id;
    const machineId = req.params.id;

    const machine = await getOne('SELECT * FROM laundry_machines WHERE id = ?', [machineId]);

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    if (machine.current_user_id !== studentId) {
      return res.status(403).json({ error: 'You are not using this machine' });
    }

    await runQuery(
      `UPDATE laundry_machines
       SET status = 'available',
           current_user_id = NULL,
           cycle_start_time = NULL,
           estimated_end_time = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [machineId]
    );

    // Notify next person in queue if any
    const nextInQueue = await getOne(
      `SELECT lq.*, s.email, s.first_name
       FROM laundry_queue lq
       JOIN students s ON lq.student_id = s.id
       WHERE lq.machine_id = ? AND lq.status = 'waiting'
       ORDER BY lq.queue_position LIMIT 1`,
      [machineId]
    );

    if (nextInQueue) {
      await runQuery(
        `UPDATE laundry_queue
         SET status = 'notified', notified_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [nextInQueue.id]
      );

      // Send email notification
      emailService.sendLaundryAvailableNotification(nextInQueue, machine).catch(console.error);
    }

    res.json({ message: 'Machine released successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get queue status
 * GET /api/student/laundry/queue
 */
router.get('/queue', async (req, res) => {
  try {
    const studentId = req.user.id;

    const myQueue = await getAll(
      `SELECT lq.*, lm.machine_number, lm.location
       FROM laundry_queue lq
       JOIN laundry_machines lm ON lq.machine_id = lm.id
       WHERE lq.student_id = ? AND lq.status IN ('waiting', 'notified')
       ORDER BY lq.created_at DESC`,
      [studentId]
    );

    res.json(myQueue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
