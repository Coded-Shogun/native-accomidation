const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');

// NSFAS Compliance Requirements Checklist
const NSFAS_REQUIREMENTS = [
    {
        category: 'Documentation',
        requirements: [
            'Proof of ownership submitted',
            'Bed registration paid',
            'Standard lease agreements prepared',
            'Three-year contract signed'
        ]
    },
    {
        category: 'Health & Safety',
        requirements: [
            'Fire safety compliance',
            'Secure entrance systems',
            'Emergency exits clearly marked',
            'Fire extinguishers present and serviced',
            'First aid kits available'
        ]
    },
    {
        category: 'Facilities & Amenities',
        requirements: [
            'Water supply adequate and reliable',
            'Electricity supply adequate and reliable',
            'Sanitation facilities meet standards',
            'One sink per 4 residents',
            'One shower per 7 residents',
            'Study areas available',
            'Common areas maintained'
        ]
    },
    {
        category: 'Room Specifications',
        requirements: [
            'Single rooms larger than 8 sqm',
            'Adequate ventilation',
            'Adequate natural light',
            'Secure locks on doors',
            'Clean and maintained'
        ]
    },
    {
        category: 'Security',
        requirements: [
            '24/7 security or access control',
            'CCTV cameras operational',
            'Secure perimeter fencing',
            'Emergency contact numbers displayed'
        ]
    }
];

// Get all compliance records for a property
router.get('/property/:property_id', async (req, res) => {
    try {
        const records = await getAll(
            'SELECT * FROM nsfas_compliance WHERE property_id = ? ORDER BY compliance_category, created_at DESC',
            [req.params.property_id]
        );

        // Group by category
        const grouped = records.reduce((acc, record) => {
            if (!acc[record.compliance_category]) {
                acc[record.compliance_category] = [];
            }
            acc[record.compliance_category].push(record);
            return acc;
        }, {});

        res.json({ records, grouped });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get NSFAS requirements template
router.get('/requirements', (req, res) => {
    res.json(NSFAS_REQUIREMENTS);
});

// Get compliance summary for a property
router.get('/summary/:property_id', async (req, res) => {
    try {
        const property = await getOne('SELECT * FROM properties WHERE id = ?', [req.params.property_id]);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const complianceStats = await getOne(`
            SELECT
                COUNT(*) as total_requirements,
                SUM(CASE WHEN status = 'compliant' THEN 1 ELSE 0 END) as compliant,
                SUM(CASE WHEN status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant,
                SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending_review
            FROM nsfas_compliance
            WHERE property_id = ?
        `, [req.params.property_id]);

        // Check facility ratios
        const facilities = await getAll(
            'SELECT * FROM facilities WHERE property_id = ?',
            [req.params.property_id]
        );

        const totalOccupants = property.total_beds - property.available_beds;

        // Calculate facility ratios
        const sinks = facilities.find(f => f.facility_type === 'sink');
        const showers = facilities.find(f => f.facility_type === 'shower');

        const sinkRatio = sinks ? totalOccupants / sinks.working_condition : 0;
        const showerRatio = showers ? totalOccupants / showers.working_condition : 0;

        const facilityCompliance = {
            sink_ratio: sinkRatio,
            sink_compliant: sinkRatio <= 4,
            shower_ratio: showerRatio,
            shower_compliant: showerRatio <= 7
        };

        // Check room size compliance
        const nonCompliantRooms = await getAll(`
            SELECT room_number, size_sqm, room_type
            FROM rooms
            WHERE property_id = ? AND room_type = 'single' AND size_sqm < 8
        `, [req.params.property_id]);

        const overallCompliance = complianceStats.total_requirements > 0
            ? (complianceStats.compliant / complianceStats.total_requirements * 100).toFixed(2)
            : 0;

        res.json({
            property_name: property.name,
            nsfas_accredited: property.nsfas_accredited,
            accreditation_date: property.accreditation_date,
            contract_start_date: property.contract_start_date,
            contract_end_date: property.contract_end_date,
            overall_compliance_percentage: overallCompliance,
            compliance_stats: complianceStats,
            facility_compliance: facilityCompliance,
            non_compliant_rooms: nonCompliantRooms,
            total_occupants: totalOccupants
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create compliance record
router.post('/', async (req, res) => {
    try {
        const {
            property_id, compliance_category, requirement_description,
            status, evidence_document_path, last_inspection_date,
            next_inspection_date, inspector_notes
        } = req.body;

        const sql = `
            INSERT INTO nsfas_compliance (
                property_id, compliance_category, requirement_description,
                status, evidence_document_path, last_inspection_date,
                next_inspection_date, inspector_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            property_id, compliance_category, requirement_description,
            status || 'pending_review', evidence_document_path,
            last_inspection_date, next_inspection_date, inspector_notes
        ]);

        const newRecord = await getOne(
            'SELECT * FROM nsfas_compliance WHERE id = ?',
            [result.id]
        );

        res.status(201).json(newRecord);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update compliance record
router.put('/:id', async (req, res) => {
    try {
        const {
            status, evidence_document_path, last_inspection_date,
            next_inspection_date, inspector_notes
        } = req.body;

        const sql = `
            UPDATE nsfas_compliance SET
                status = ?,
                evidence_document_path = ?,
                last_inspection_date = ?,
                next_inspection_date = ?,
                inspector_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await runQuery(sql, [
            status, evidence_document_path, last_inspection_date,
            next_inspection_date, inspector_notes, req.params.id
        ]);

        const updatedRecord = await getOne(
            'SELECT * FROM nsfas_compliance WHERE id = ?',
            [req.params.id]
        );

        res.json(updatedRecord);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete compliance record
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM nsfas_compliance WHERE id = ?', [req.params.id]);
        res.json({ message: 'Compliance record deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Initialize compliance checklist for a property
router.post('/initialize/:property_id', async (req, res) => {
    try {
        const property = await getOne('SELECT id FROM properties WHERE id = ?', [req.params.property_id]);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Check if already initialized
        const existing = await getOne(
            'SELECT COUNT(*) as count FROM nsfas_compliance WHERE property_id = ?',
            [req.params.property_id]
        );

        if (existing.count > 0) {
            return res.status(400).json({
                error: 'Compliance checklist already initialized for this property'
            });
        }

        // Insert all requirements
        for (const category of NSFAS_REQUIREMENTS) {
            for (const requirement of category.requirements) {
                await runQuery(`
                    INSERT INTO nsfas_compliance (
                        property_id, compliance_category, requirement_description, status
                    ) VALUES (?, ?, ?, 'pending_review')
                `, [req.params.property_id, category.category, requirement]);
            }
        }

        res.json({ message: 'Compliance checklist initialized successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
