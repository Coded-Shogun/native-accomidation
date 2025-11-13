const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');

// Get all facilities for a property
router.get('/property/:property_id', async (req, res) => {
    try {
        const facilities = await getAll(
            'SELECT * FROM facilities WHERE property_id = ? ORDER BY facility_type',
            [req.params.property_id]
        );

        // Get property info for ratio calculations
        const property = await getOne(
            'SELECT total_beds, available_beds FROM properties WHERE id = ?',
            [req.params.property_id]
        );

        const currentOccupants = property.total_beds - property.available_beds;

        // Calculate ratios
        const facilitiesWithRatios = facilities.map(facility => {
            const ratio = facility.working_condition > 0
                ? currentOccupants / facility.working_condition
                : null;

            let recommended = null;
            let compliant = true;

            // NSFAS standards
            if (facility.facility_type === 'sink') {
                recommended = Math.ceil(currentOccupants / 4);
                compliant = facility.working_condition >= recommended;
            } else if (facility.facility_type === 'shower') {
                recommended = Math.ceil(currentOccupants / 7);
                compliant = facility.working_condition >= recommended;
            }

            return {
                ...facility,
                ratio,
                recommended,
                compliant,
                current_occupants: currentOccupants
            };
        });

        res.json(facilitiesWithRatios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get facility by ID
router.get('/:id', async (req, res) => {
    try {
        const facility = await getOne('SELECT * FROM facilities WHERE id = ?', [req.params.id]);

        if (!facility) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        res.json(facility);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new facility
router.post('/', async (req, res) => {
    try {
        const {
            property_id, facility_type, quantity,
            working_condition, last_maintenance_date, notes
        } = req.body;

        const sql = `
            INSERT INTO facilities (
                property_id, facility_type, quantity,
                working_condition, last_maintenance_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            property_id, facility_type, quantity,
            working_condition !== undefined ? working_condition : quantity,
            last_maintenance_date, notes
        ]);

        const newFacility = await getOne('SELECT * FROM facilities WHERE id = ?', [result.id]);
        res.status(201).json(newFacility);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update facility
router.put('/:id', async (req, res) => {
    try {
        const {
            quantity, working_condition, last_maintenance_date, notes
        } = req.body;

        const sql = `
            UPDATE facilities SET
                quantity = ?,
                working_condition = ?,
                last_maintenance_date = ?,
                notes = ?
            WHERE id = ?
        `;

        await runQuery(sql, [
            quantity, working_condition, last_maintenance_date, notes,
            req.params.id
        ]);

        const updatedFacility = await getOne('SELECT * FROM facilities WHERE id = ?', [req.params.id]);
        res.json(updatedFacility);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete facility
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM facilities WHERE id = ?', [req.params.id]);
        res.json({ message: 'Facility deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
