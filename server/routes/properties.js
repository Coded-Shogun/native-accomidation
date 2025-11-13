const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');

// Get all properties
router.get('/', async (req, res) => {
    try {
        const { nsfas_accredited } = req.query;
        let sql = 'SELECT * FROM properties WHERE 1=1';
        const params = [];

        if (nsfas_accredited !== undefined) {
            sql += ' AND nsfas_accredited = ?';
            params.push(nsfas_accredited === 'true' ? 1 : 0);
        }

        sql += ' ORDER BY created_at DESC';

        const properties = await getAll(sql, params);
        res.json(properties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get property by ID with full details
router.get('/:id', async (req, res) => {
    try {
        const property = await getOne('SELECT * FROM properties WHERE id = ?', [req.params.id]);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Get rooms
        const rooms = await getAll('SELECT * FROM rooms WHERE property_id = ? ORDER BY room_number', [req.params.id]);

        // Get facilities
        const facilities = await getAll('SELECT * FROM facilities WHERE property_id = ?', [req.params.id]);

        // Get compliance status
        const compliance = await getAll('SELECT * FROM nsfas_compliance WHERE property_id = ?', [req.params.id]);

        // Get active leases count
        const leaseCount = await getOne(
            'SELECT COUNT(*) as count FROM leases WHERE property_id = ? AND status = "active"',
            [req.params.id]
        );

        res.json({
            ...property,
            rooms,
            facilities,
            compliance,
            active_leases: leaseCount.count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new property
router.post('/', async (req, res) => {
    try {
        const {
            name, address, total_beds, available_beds,
            proof_of_ownership, registration_status
        } = req.body;

        const sql = `
            INSERT INTO properties (
                name, address, total_beds, available_beds,
                proof_of_ownership, registration_status
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            name, address, total_beds, available_beds || total_beds,
            proof_of_ownership, registration_status || 'pending'
        ]);

        const newProperty = await getOne('SELECT * FROM properties WHERE id = ?', [result.id]);
        res.status(201).json(newProperty);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update property
router.put('/:id', async (req, res) => {
    try {
        const {
            name, address, total_beds, available_beds, registration_status,
            nsfas_accredited, accreditation_date, contract_start_date, contract_end_date
        } = req.body;

        const sql = `
            UPDATE properties SET
                name = ?, address = ?, total_beds = ?, available_beds = ?,
                registration_status = ?, nsfas_accredited = ?,
                accreditation_date = ?, contract_start_date = ?, contract_end_date = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await runQuery(sql, [
            name, address, total_beds, available_beds, registration_status,
            nsfas_accredited ? 1 : 0, accreditation_date, contract_start_date,
            contract_end_date, req.params.id
        ]);

        const updatedProperty = await getOne('SELECT * FROM properties WHERE id = ?', [req.params.id]);
        res.json(updatedProperty);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete property
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM properties WHERE id = ?', [req.params.id]);
        res.json({ message: 'Property deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get property occupancy stats
router.get('/:id/occupancy', async (req, res) => {
    try {
        const stats = await getOne(`
            SELECT
                p.total_beds,
                p.available_beds,
                COUNT(DISTINCT l.id) as active_leases,
                SUM(r.current_occupants) as current_occupants
            FROM properties p
            LEFT JOIN rooms r ON p.id = r.property_id
            LEFT JOIN leases l ON p.id = l.property_id AND l.status = 'active'
            WHERE p.id = ?
            GROUP BY p.id
        `, [req.params.id]);

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
