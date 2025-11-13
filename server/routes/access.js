const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');

// Get all access logs
router.get('/', async (req, res) => {
    try {
        const { property_id, student_id, access_type, date } = req.query;
        let sql = `
            SELECT al.*,
                   s.first_name, s.last_name, s.student_number,
                   p.name as property_name
            FROM access_logs al
            JOIN students s ON al.student_id = s.id
            JOIN properties p ON al.property_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (property_id) {
            sql += ' AND al.property_id = ?';
            params.push(property_id);
        }

        if (student_id) {
            sql += ' AND al.student_id = ?';
            params.push(student_id);
        }

        if (access_type) {
            sql += ' AND al.access_type = ?';
            params.push(access_type);
        }

        if (date) {
            sql += ' AND DATE(al.timestamp) = DATE(?)';
            params.push(date);
        }

        sql += ' ORDER BY al.timestamp DESC LIMIT 500';

        const logs = await getAll(sql, params);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Log new access event
router.post('/', async (req, res) => {
    try {
        const { student_id, property_id, access_type, access_method, notes } = req.body;

        // Verify student has active lease at this property
        const lease = await getOne(`
            SELECT id FROM leases
            WHERE student_id = ? AND property_id = ? AND status = 'active'
        `, [student_id, property_id]);

        if (!lease) {
            return res.status(403).json({
                error: 'Student does not have an active lease at this property'
            });
        }

        const sql = `
            INSERT INTO access_logs (
                student_id, property_id, access_type, access_method, notes
            ) VALUES (?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            student_id, property_id, access_type,
            access_method || 'manual', notes
        ]);

        const newLog = await getOne('SELECT * FROM access_logs WHERE id = ?', [result.id]);
        res.status(201).json(newLog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get access statistics for a property
router.get('/stats/:property_id', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let dateFilter = '';
        const params = [req.params.property_id];

        if (start_date && end_date) {
            dateFilter = 'AND timestamp BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const stats = await getOne(`
            SELECT
                COUNT(*) as total_access_events,
                COUNT(DISTINCT student_id) as unique_students,
                SUM(CASE WHEN access_type = 'entry' THEN 1 ELSE 0 END) as entries,
                SUM(CASE WHEN access_type = 'exit' THEN 1 ELSE 0 END) as exits
            FROM access_logs
            WHERE property_id = ? ${dateFilter}
        `, params);

        // Get current occupants in building (entries without corresponding exits)
        const currentlyInside = await getAll(`
            SELECT DISTINCT s.id, s.first_name, s.last_name, s.student_number,
                   MAX(al.timestamp) as last_entry
            FROM students s
            JOIN access_logs al ON s.id = al.student_id
            WHERE al.property_id = ?
            AND al.access_type = 'entry'
            AND NOT EXISTS (
                SELECT 1 FROM access_logs al2
                WHERE al2.student_id = al.student_id
                AND al2.property_id = al.property_id
                AND al2.access_type = 'exit'
                AND al2.timestamp > al.timestamp
            )
            GROUP BY s.id
        `, [req.params.property_id]);

        res.json({
            ...stats,
            currently_inside: currentlyInside,
            current_occupancy_count: currentlyInside.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete access log
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM access_logs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Access log deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
