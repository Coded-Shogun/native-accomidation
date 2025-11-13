const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../database/init');

// Get all payments
router.get('/', async (req, res) => {
    try {
        const { lease_id, student_id, status, payment_method } = req.query;
        let sql = `
            SELECT p.*,
                   s.first_name, s.last_name, s.student_number,
                   l.monthly_amount as lease_monthly_amount
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN leases l ON p.lease_id = l.id
            WHERE 1=1
        `;
        const params = [];

        if (lease_id) {
            sql += ' AND p.lease_id = ?';
            params.push(lease_id);
        }

        if (student_id) {
            sql += ' AND p.student_id = ?';
            params.push(student_id);
        }

        if (status) {
            sql += ' AND p.status = ?';
            params.push(status);
        }

        if (payment_method) {
            sql += ' AND p.payment_method = ?';
            params.push(payment_method);
        }

        sql += ' ORDER BY p.payment_date DESC';

        const payments = await getAll(sql, params);
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
    try {
        const payment = await getOne(`
            SELECT p.*,
                   s.first_name, s.last_name, s.student_number, s.nsfas_reference,
                   l.property_id, l.room_id, l.monthly_amount
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN leases l ON p.lease_id = l.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new payment
router.post('/', async (req, res) => {
    try {
        const {
            lease_id, student_id, amount, payment_date,
            payment_method, reference_number, status, notes
        } = req.body;

        const sql = `
            INSERT INTO payments (
                lease_id, student_id, amount, payment_date,
                payment_method, reference_number, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            lease_id, student_id, amount, payment_date,
            payment_method || 'nsfas', reference_number,
            status || 'pending', notes
        ]);

        const newPayment = await getOne('SELECT * FROM payments WHERE id = ?', [result.id]);
        res.status(201).json(newPayment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update payment
router.put('/:id', async (req, res) => {
    try {
        const { status, reference_number, notes } = req.body;

        const sql = `
            UPDATE payments SET
                status = ?,
                reference_number = ?,
                notes = ?
            WHERE id = ?
        `;

        await runQuery(sql, [status, reference_number, notes, req.params.id]);

        const updatedPayment = await getOne('SELECT * FROM payments WHERE id = ?', [req.params.id]);
        res.json(updatedPayment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete payment
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM payments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Payment deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get payment statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const { property_id, start_date, end_date } = req.query;
        let dateFilter = '';
        let propertyFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'AND p.payment_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        if (property_id) {
            propertyFilter = 'AND l.property_id = ?';
            params.push(property_id);
        }

        const stats = await getOne(`
            SELECT
                COUNT(*) as total_payments,
                SUM(CASE WHEN p.status = 'received' THEN p.amount ELSE 0 END) as total_received,
                SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as total_pending,
                SUM(CASE WHEN p.status = 'failed' THEN p.amount ELSE 0 END) as total_failed,
                SUM(CASE WHEN p.payment_method = 'nsfas' THEN p.amount ELSE 0 END) as nsfas_payments,
                COUNT(DISTINCT p.student_id) as unique_payers
            FROM payments p
            JOIN leases l ON p.lease_id = l.id
            WHERE 1=1 ${dateFilter} ${propertyFilter}
        `, params);

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
