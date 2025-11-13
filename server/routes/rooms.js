const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');

// Get all rooms (optionally filter by property)
router.get('/', async (req, res) => {
    try {
        const { property_id, status } = req.query;
        let sql = `
            SELECT r.*, p.name as property_name
            FROM rooms r
            JOIN properties p ON r.property_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (property_id) {
            sql += ' AND r.property_id = ?';
            params.push(property_id);
        }

        if (status) {
            sql += ' AND r.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY p.name, r.room_number';

        const rooms = await getAll(sql, params);
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get room by ID
router.get('/:id', async (req, res) => {
    try {
        const room = await getOne(`
            SELECT r.*, p.name as property_name, p.address as property_address
            FROM rooms r
            JOIN properties p ON r.property_id = p.id
            WHERE r.id = ?
        `, [req.params.id]);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Get current occupants
        const occupants = await getAll(`
            SELECT s.*, l.start_date, l.end_date
            FROM students s
            JOIN leases l ON s.id = l.student_id
            WHERE l.room_id = ? AND l.status = 'active'
        `, [req.params.id]);

        res.json({ ...room, occupants });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new room
router.post('/', async (req, res) => {
    try {
        const {
            property_id, room_number, room_type, size_sqm,
            max_occupants, monthly_rate, status
        } = req.body;

        // Validate room size meets NSFAS requirements (single room > 8 sqm)
        if (room_type === 'single' && size_sqm < 8) {
            return res.status(400).json({
                error: 'Single rooms must be larger than 8 square meters to meet NSFAS requirements'
            });
        }

        const sql = `
            INSERT INTO rooms (
                property_id, room_number, room_type, size_sqm,
                max_occupants, monthly_rate, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            property_id, room_number, room_type, size_sqm,
            max_occupants, monthly_rate, status || 'available'
        ]);

        const newRoom = await getOne('SELECT * FROM rooms WHERE id = ?', [result.id]);
        res.status(201).json(newRoom);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update room
router.put('/:id', async (req, res) => {
    try {
        const {
            room_number, room_type, size_sqm, max_occupants,
            current_occupants, monthly_rate, status
        } = req.body;

        const sql = `
            UPDATE rooms SET
                room_number = ?, room_type = ?, size_sqm = ?,
                max_occupants = ?, current_occupants = ?,
                monthly_rate = ?, status = ?
            WHERE id = ?
        `;

        await runQuery(sql, [
            room_number, room_type, size_sqm, max_occupants,
            current_occupants, monthly_rate, status, req.params.id
        ]);

        const updatedRoom = await getOne('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete room
router.delete('/:id', async (req, res) => {
    try {
        // Check if room has active leases
        const activeLease = await getOne(
            'SELECT id FROM leases WHERE room_id = ? AND status = "active"',
            [req.params.id]
        );

        if (activeLease) {
            return res.status(400).json({
                error: 'Cannot delete room with active leases'
            });
        }

        await runQuery('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ message: 'Room deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
