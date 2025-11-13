const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');

// NSFAS annual accommodation cap
const NSFAS_ANNUAL_CAP = 45000;

// Get all leases
router.get('/', async (req, res) => {
    try {
        const { status, property_id, student_id } = req.query;
        let sql = `
            SELECT l.*,
                   s.first_name, s.last_name, s.student_number,
                   r.room_number, r.room_type,
                   p.name as property_name
            FROM leases l
            JOIN students s ON l.student_id = s.id
            JOIN rooms r ON l.room_id = r.id
            JOIN properties p ON l.property_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            sql += ' AND l.status = ?';
            params.push(status);
        }

        if (property_id) {
            sql += ' AND l.property_id = ?';
            params.push(property_id);
        }

        if (student_id) {
            sql += ' AND l.student_id = ?';
            params.push(student_id);
        }

        sql += ' ORDER BY l.created_at DESC';

        const leases = await getAll(sql, params);
        res.json(leases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get lease by ID
router.get('/:id', async (req, res) => {
    try {
        const lease = await getOne(`
            SELECT l.*,
                   s.*, s.id as student_id,
                   r.room_number, r.room_type, r.size_sqm,
                   p.name as property_name, p.address as property_address
            FROM leases l
            JOIN students s ON l.student_id = s.id
            JOIN rooms r ON l.room_id = r.id
            JOIN properties p ON l.property_id = p.id
            WHERE l.id = ?
        `, [req.params.id]);

        if (!lease) {
            return res.status(404).json({ error: 'Lease not found' });
        }

        // Get payment history
        const payments = await getAll(
            'SELECT * FROM payments WHERE lease_id = ? ORDER BY payment_date DESC',
            [req.params.id]
        );

        res.json({ ...lease, payments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new lease
router.post('/', async (req, res) => {
    try {
        const {
            student_id, room_id, property_id, start_date, end_date,
            monthly_amount, lease_agreement_path, signed_date
        } = req.body;

        // Calculate annual amount
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const months = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30);
        const annual_amount = monthly_amount * 12;

        // Check NSFAS cap compliance
        const nsfas_cap_compliant = annual_amount <= NSFAS_ANNUAL_CAP ? 1 : 0;

        if (!nsfas_cap_compliant) {
            console.warn(`Warning: Lease exceeds NSFAS cap of R${NSFAS_ANNUAL_CAP}`);
        }

        // Check if student already has an active lease
        const existingLease = await getOne(
            'SELECT id FROM leases WHERE student_id = ? AND status = "active"',
            [student_id]
        );

        if (existingLease) {
            return res.status(400).json({
                error: 'Student already has an active lease'
            });
        }

        // Check if room is available
        const room = await getOne('SELECT * FROM rooms WHERE id = ?', [room_id]);
        if (room.current_occupants >= room.max_occupants) {
            return res.status(400).json({ error: 'Room is fully occupied' });
        }

        const sql = `
            INSERT INTO leases (
                student_id, room_id, property_id, start_date, end_date,
                monthly_amount, annual_amount, nsfas_cap_compliant,
                lease_agreement_path, signed_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `;

        const result = await runQuery(sql, [
            student_id, room_id, property_id, start_date, end_date,
            monthly_amount, annual_amount, nsfas_cap_compliant,
            lease_agreement_path, signed_date
        ]);

        // Update room occupancy
        await runQuery(
            'UPDATE rooms SET current_occupants = current_occupants + 1 WHERE id = ?',
            [room_id]
        );

        // Update property available beds
        await runQuery(
            'UPDATE properties SET available_beds = available_beds - 1 WHERE id = ?',
            [property_id]
        );

        const newLease = await getOne('SELECT * FROM leases WHERE id = ?', [result.id]);
        res.status(201).json(newLease);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update lease
router.put('/:id', async (req, res) => {
    try {
        const { status, end_date, monthly_amount } = req.body;

        const lease = await getOne('SELECT * FROM leases WHERE id = ?', [req.params.id]);

        if (!lease) {
            return res.status(404).json({ error: 'Lease not found' });
        }

        // If terminating lease, update room occupancy
        if (status === 'terminated' || status === 'expired') {
            if (lease.status === 'active') {
                await runQuery(
                    'UPDATE rooms SET current_occupants = current_occupants - 1 WHERE id = ?',
                    [lease.room_id]
                );

                await runQuery(
                    'UPDATE properties SET available_beds = available_beds + 1 WHERE id = ?',
                    [lease.property_id]
                );
            }
        }

        const sql = `
            UPDATE leases SET
                status = ?,
                end_date = ?,
                monthly_amount = ?
            WHERE id = ?
        `;

        await runQuery(sql, [
            status || lease.status,
            end_date || lease.end_date,
            monthly_amount || lease.monthly_amount,
            req.params.id
        ]);

        const updatedLease = await getOne('SELECT * FROM leases WHERE id = ?', [req.params.id]);
        res.json(updatedLease);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete lease
router.delete('/:id', async (req, res) => {
    try {
        const lease = await getOne('SELECT * FROM leases WHERE id = ?', [req.params.id]);

        if (lease && lease.status === 'active') {
            // Update room occupancy
            await runQuery(
                'UPDATE rooms SET current_occupants = current_occupants - 1 WHERE id = ?',
                [lease.room_id]
            );

            // Update property available beds
            await runQuery(
                'UPDATE properties SET available_beds = available_beds + 1 WHERE id = ?',
                [lease.property_id]
            );
        }

        await runQuery('DELETE FROM leases WHERE id = ?', [req.params.id]);
        res.json({ message: 'Lease deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
