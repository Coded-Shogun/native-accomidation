const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');

// Get all maintenance requests
router.get('/', async (req, res) => {
    try {
        const { property_id, status, category, priority } = req.query;
        let sql = `
            SELECT mr.*,
                   p.name as property_name,
                   r.room_number,
                   s.first_name, s.last_name, s.student_number
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.id
            LEFT JOIN rooms r ON mr.room_id = r.id
            LEFT JOIN students s ON mr.student_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (property_id) {
            sql += ' AND mr.property_id = ?';
            params.push(property_id);
        }

        if (status) {
            sql += ' AND mr.status = ?';
            params.push(status);
        }

        if (category) {
            sql += ' AND mr.category = ?';
            params.push(category);
        }

        if (priority) {
            sql += ' AND mr.priority = ?';
            params.push(priority);
        }

        sql += ' ORDER BY mr.priority DESC, mr.reported_date DESC';

        const requests = await getAll(sql, params);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get maintenance request by ID
router.get('/:id', async (req, res) => {
    try {
        const request = await getOne(`
            SELECT mr.*,
                   p.name as property_name, p.address as property_address,
                   r.room_number,
                   s.first_name, s.last_name, s.student_number, s.phone
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.id
            LEFT JOIN rooms r ON mr.room_id = r.id
            LEFT JOIN students s ON mr.student_id = s.id
            WHERE mr.id = ?
        `, [req.params.id]);

        if (!request) {
            return res.status(404).json({ error: 'Maintenance request not found' });
        }

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new maintenance request
router.post('/', async (req, res) => {
    try {
        const {
            property_id, room_id, student_id, category, title,
            description, priority, assigned_to
        } = req.body;

        const sql = `
            INSERT INTO maintenance_requests (
                property_id, room_id, student_id, category, title,
                description, priority, assigned_to, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
        `;

        const result = await runQuery(sql, [
            property_id, room_id, student_id, category, title,
            description, priority || 'medium', assigned_to
        ]);

        const newRequest = await getOne(
            'SELECT * FROM maintenance_requests WHERE id = ?',
            [result.id]
        );

        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update maintenance request
router.put('/:id', async (req, res) => {
    try {
        const {
            status, priority, assigned_to, cost, notes, completed_date
        } = req.body;

        const request = await getOne(
            'SELECT * FROM maintenance_requests WHERE id = ?',
            [req.params.id]
        );

        if (!request) {
            return res.status(404).json({ error: 'Maintenance request not found' });
        }

        // If marking as completed, set completed_date
        const completedDateValue = status === 'completed' && !request.completed_date
            ? new Date().toISOString()
            : completed_date;

        const sql = `
            UPDATE maintenance_requests SET
                status = ?,
                priority = ?,
                assigned_to = ?,
                cost = ?,
                notes = ?,
                completed_date = ?
            WHERE id = ?
        `;

        await runQuery(sql, [
            status || request.status,
            priority || request.priority,
            assigned_to !== undefined ? assigned_to : request.assigned_to,
            cost !== undefined ? cost : request.cost,
            notes !== undefined ? notes : request.notes,
            completedDateValue,
            req.params.id
        ]);

        const updatedRequest = await getOne(
            'SELECT * FROM maintenance_requests WHERE id = ?',
            [req.params.id]
        );

        res.json(updatedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete maintenance request
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM maintenance_requests WHERE id = ?', [req.params.id]);
        res.json({ message: 'Maintenance request deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get maintenance statistics
router.get('/stats/:property_id', async (req, res) => {
    try {
        const stats = await getOne(`
            SELECT
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_requests,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_requests,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
                SUM(CASE WHEN priority = 'urgent' AND status != 'completed' THEN 1 ELSE 0 END) as urgent_open,
                SUM(CASE WHEN category = 'washing_machine' THEN 1 ELSE 0 END) as washing_machine_requests,
                SUM(CASE WHEN status = 'completed' THEN COALESCE(cost, 0) ELSE 0 END) as total_maintenance_cost,
                AVG(CASE WHEN status = 'completed' THEN
                    julianday(completed_date) - julianday(reported_date)
                    ELSE NULL END) as avg_completion_days
            FROM maintenance_requests
            WHERE property_id = ?
        `, [req.params.property_id]);

        // Get breakdown by category
        const categoryBreakdown = await getAll(`
            SELECT category, COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM maintenance_requests
            WHERE property_id = ?
            GROUP BY category
        `, [req.params.property_id]);

        res.json({
            ...stats,
            category_breakdown: categoryBreakdown
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
