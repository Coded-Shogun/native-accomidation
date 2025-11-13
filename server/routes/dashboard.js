const express = require('express');
const router = express.Router();
const { getOne, getAll } = require('../database/init');

// Get comprehensive dashboard statistics
router.get('/overview', async (req, res) => {
    try {
        // Property statistics
        const propertyStats = await getOne(`
            SELECT
                COUNT(*) as total_properties,
                SUM(CASE WHEN nsfas_accredited = 1 THEN 1 ELSE 0 END) as accredited_properties,
                SUM(total_beds) as total_beds,
                SUM(available_beds) as available_beds,
                SUM(total_beds - available_beds) as occupied_beds
            FROM properties
        `);

        // Student statistics
        const studentStats = await getOne(`
            SELECT
                COUNT(*) as total_students,
                SUM(CASE WHEN nsfas_beneficiary = 1 THEN 1 ELSE 0 END) as nsfas_students,
                SUM(CASE WHEN eligible_for_accommodation = 1 THEN 1 ELSE 0 END) as eligible_students
            FROM students
        `);

        // Lease statistics
        const leaseStats = await getOne(`
            SELECT
                COUNT(*) as total_leases,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_leases,
                SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_leases,
                SUM(CASE WHEN nsfas_cap_compliant = 0 THEN 1 ELSE 0 END) as non_compliant_leases
            FROM leases
        `);

        // Maintenance statistics
        const maintenanceStats = await getOne(`
            SELECT
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_requests,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_requests,
                SUM(CASE WHEN priority = 'urgent' AND status != 'completed' THEN 1 ELSE 0 END) as urgent_requests,
                SUM(CASE WHEN category = 'washing_machine' AND status != 'completed' THEN 1 ELSE 0 END) as washing_machine_issues
            FROM maintenance_requests
        `);

        // Compliance statistics
        const complianceStats = await getOne(`
            SELECT
                COUNT(*) as total_checks,
                SUM(CASE WHEN status = 'compliant' THEN 1 ELSE 0 END) as compliant,
                SUM(CASE WHEN status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant,
                SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pending_review
            FROM nsfas_compliance
        `);

        // Payment statistics (last 30 days)
        const paymentStats = await getOne(`
            SELECT
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'received' THEN amount ELSE 0 END) as total_received,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
            FROM payments
            WHERE payment_date >= date('now', '-30 days')
        `);

        // Recent activity - last 5 access logs
        const recentAccess = await getAll(`
            SELECT al.*, s.first_name, s.last_name, p.name as property_name
            FROM access_logs al
            JOIN students s ON al.student_id = s.id
            JOIN properties p ON al.property_id = p.id
            ORDER BY al.timestamp DESC
            LIMIT 5
        `);

        // Upcoming lease expirations (next 30 days)
        const upcomingExpirations = await getAll(`
            SELECT l.*, s.first_name, s.last_name, p.name as property_name, r.room_number
            FROM leases l
            JOIN students s ON l.student_id = s.id
            JOIN properties p ON l.property_id = p.id
            JOIN rooms r ON l.room_id = r.id
            WHERE l.status = 'active'
            AND l.end_date BETWEEN date('now') AND date('now', '+30 days')
            ORDER BY l.end_date ASC
        `);

        // Properties needing attention
        const propertiesNeedingAttention = await getAll(`
            SELECT
                p.id,
                p.name,
                p.nsfas_accredited,
                COUNT(mr.id) as open_maintenance_requests,
                SUM(CASE WHEN mr.priority = 'urgent' THEN 1 ELSE 0 END) as urgent_issues
            FROM properties p
            LEFT JOIN maintenance_requests mr ON p.id = mr.property_id
                AND mr.status IN ('open', 'in_progress')
            GROUP BY p.id
            HAVING open_maintenance_requests > 0 OR urgent_issues > 0
            ORDER BY urgent_issues DESC, open_maintenance_requests DESC
            LIMIT 5
        `);

        const occupancyRate = propertyStats.total_beds > 0
            ? ((propertyStats.occupied_beds / propertyStats.total_beds) * 100).toFixed(2)
            : 0;

        const complianceRate = complianceStats.total_checks > 0
            ? ((complianceStats.compliant / complianceStats.total_checks) * 100).toFixed(2)
            : 0;

        res.json({
            properties: {
                ...propertyStats,
                occupancy_rate: occupancyRate
            },
            students: studentStats,
            leases: leaseStats,
            maintenance: maintenanceStats,
            compliance: {
                ...complianceStats,
                compliance_rate: complianceRate
            },
            payments: paymentStats,
            recent_activity: {
                access_logs: recentAccess,
                upcoming_lease_expirations: upcomingExpirations,
                properties_needing_attention: propertiesNeedingAttention
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get property-specific dashboard
router.get('/property/:property_id', async (req, res) => {
    try {
        const property = await getOne('SELECT * FROM properties WHERE id = ?', [req.params.property_id]);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Room statistics
        const roomStats = await getOne(`
            SELECT
                COUNT(*) as total_rooms,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_rooms,
                SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_rooms,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as rooms_under_maintenance
            FROM rooms
            WHERE property_id = ?
        `, [req.params.property_id]);

        // Active students
        const activeStudents = await getAll(`
            SELECT s.*, l.start_date, l.end_date, r.room_number
            FROM students s
            JOIN leases l ON s.id = l.student_id
            JOIN rooms r ON l.room_id = r.id
            WHERE l.property_id = ? AND l.status = 'active'
            ORDER BY s.last_name, s.first_name
        `, [req.params.property_id]);

        // Maintenance for this property
        const maintenanceRequests = await getAll(`
            SELECT mr.*, r.room_number, s.first_name, s.last_name
            FROM maintenance_requests mr
            LEFT JOIN rooms r ON mr.room_id = r.id
            LEFT JOIN students s ON mr.student_id = s.id
            WHERE mr.property_id = ? AND mr.status IN ('open', 'in_progress')
            ORDER BY mr.priority DESC, mr.reported_date DESC
        `, [req.params.property_id]);

        // Compliance summary
        const complianceSummary = await getOne(`
            SELECT
                COUNT(*) as total_checks,
                SUM(CASE WHEN status = 'compliant' THEN 1 ELSE 0 END) as compliant,
                SUM(CASE WHEN status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant
            FROM nsfas_compliance
            WHERE property_id = ?
        `, [req.params.property_id]);

        res.json({
            property,
            room_stats: roomStats,
            active_students: activeStudents,
            maintenance_requests: maintenanceRequests,
            compliance_summary: complianceSummary
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
