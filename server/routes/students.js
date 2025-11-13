const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');
const { body, validationResult } = require('express-validator');

// Get all students
router.get('/', async (req, res) => {
    try {
        const { nsfas_beneficiary, eligible } = req.query;
        let sql = 'SELECT * FROM students WHERE 1=1';
        const params = [];

        if (nsfas_beneficiary !== undefined) {
            sql += ' AND nsfas_beneficiary = ?';
            params.push(nsfas_beneficiary === 'true' ? 1 : 0);
        }

        if (eligible !== undefined) {
            sql += ' AND eligible_for_accommodation = ?';
            params.push(eligible === 'true' ? 1 : 0);
        }

        sql += ' ORDER BY created_at DESC';

        const students = await getAll(sql, params);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const student = await getOne('SELECT * FROM students WHERE id = ?', [req.params.id]);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get current lease info
        const lease = await getOne(`
            SELECT l.*, r.room_number, p.name as property_name
            FROM leases l
            JOIN rooms r ON l.room_id = r.id
            JOIN properties p ON l.property_id = p.id
            WHERE l.student_id = ? AND l.status = 'active'
        `, [req.params.id]);

        res.json({ ...student, current_lease: lease });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new student
router.post('/', [
    body('student_number').notEmpty().trim(),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('id_number').notEmpty().trim(),
    body('email').isEmail(),
    body('phone').notEmpty().trim(),
    body('institution').notEmpty().trim(),
    body('campus').notEmpty().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const {
            student_number, first_name, last_name, id_number, email, phone,
            nsfas_beneficiary, nsfas_reference, institution, campus,
            distance_from_campus_km, emergency_contact_name, emergency_contact_phone
        } = req.body;

        // Check eligibility based on distance (20km rule)
        const eligible_for_accommodation = distance_from_campus_km >= 20 ? 1 : 0;

        const sql = `
            INSERT INTO students (
                student_number, first_name, last_name, id_number, email, phone,
                nsfas_beneficiary, nsfas_reference, institution, campus,
                distance_from_campus_km, eligible_for_accommodation,
                emergency_contact_name, emergency_contact_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            student_number, first_name, last_name, id_number, email, phone,
            nsfas_beneficiary ? 1 : 0, nsfas_reference, institution, campus,
            distance_from_campus_km, eligible_for_accommodation,
            emergency_contact_name, emergency_contact_phone
        ]);

        const newStudent = await getOne('SELECT * FROM students WHERE id = ?', [result.id]);
        res.status(201).json(newStudent);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Student number, ID number, or email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update student
router.put('/:id', async (req, res) => {
    try {
        const {
            first_name, last_name, email, phone, nsfas_beneficiary,
            nsfas_reference, institution, campus, distance_from_campus_km,
            emergency_contact_name, emergency_contact_phone
        } = req.body;

        // Recalculate eligibility if distance changed
        const eligible_for_accommodation = distance_from_campus_km >= 20 ? 1 : 0;

        const sql = `
            UPDATE students SET
                first_name = ?, last_name = ?, email = ?, phone = ?,
                nsfas_beneficiary = ?, nsfas_reference = ?, institution = ?, campus = ?,
                distance_from_campus_km = ?, eligible_for_accommodation = ?,
                emergency_contact_name = ?, emergency_contact_phone = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await runQuery(sql, [
            first_name, last_name, email, phone,
            nsfas_beneficiary ? 1 : 0, nsfas_reference, institution, campus,
            distance_from_campus_km, eligible_for_accommodation,
            emergency_contact_name, emergency_contact_phone,
            req.params.id
        ]);

        const updatedStudent = await getOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
        res.json(updatedStudent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get student's access history
router.get('/:id/access-history', async (req, res) => {
    try {
        const history = await getAll(`
            SELECT al.*, p.name as property_name
            FROM access_logs al
            JOIN properties p ON al.property_id = p.id
            WHERE al.student_id = ?
            ORDER BY al.timestamp DESC
            LIMIT 50
        `, [req.params.id]);

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get student's maintenance requests
router.get('/:id/maintenance', async (req, res) => {
    try {
        const requests = await getAll(`
            SELECT mr.*, p.name as property_name, r.room_number
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.id
            LEFT JOIN rooms r ON mr.room_id = r.id
            WHERE mr.student_id = ?
            ORDER BY mr.reported_date DESC
        `, [req.params.id]);

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
