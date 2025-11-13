const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken, authorizeRole } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');

// All routes require authentication and manager/admin role
router.use(authenticateToken);
router.use(authorizeRole('manager', 'admin'));

/**
 * Get all bursary reports
 * GET /api/management/bursary-reports
 */
router.get('/', async (req, res) => {
  try {
    const { bursary_provider_id, status } = req.query;

    let sql = `
      SELECT br.*, bp.name as provider_name
      FROM bursary_reports br
      JOIN bursary_providers bp ON br.bursary_provider_id = bp.id
      WHERE 1=1
    `;

    const params = [];

    if (bursary_provider_id) {
      sql += ' AND br.bursary_provider_id = ?';
      params.push(bursary_provider_id);
    }

    if (status) {
      sql += ' AND br.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY br.generated_at DESC LIMIT 50';

    const reports = await getAll(sql, params);

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single report with items
 * GET /api/management/bursary-reports/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const reportId = req.params.id;

    const report = await getOne(
      `SELECT br.*, bp.name as provider_name, bp.contact_email,
              u1.full_name as generated_by_name,
              u2.full_name as reviewed_by_name
       FROM bursary_reports br
       JOIN bursary_providers bp ON br.bursary_provider_id = bp.id
       LEFT JOIN users u1 ON br.generated_by = u1.id
       LEFT JOIN users u2 ON br.reviewed_by = u2.id
       WHERE br.id = ?`,
      [reportId]
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Get report items
    const items = await getAll(
      `SELECT bri.*, s.first_name, s.last_name, s.student_number, s.email,
              sb.bursary_reference, sb.amount
       FROM bursary_report_items bri
       JOIN students s ON bri.student_id = s.id
       JOIN student_bursaries sb ON bri.student_bursary_id = sb.id
       WHERE bri.report_id = ?
       ORDER BY bri.compliance_status, s.last_name, s.first_name`,
      [reportId]
    );

    // Log access
    await runQuery(
      `INSERT INTO bursary_access_logs (user_id, bursary_provider_id, report_id, action, ip_address)
       VALUES (?, ?, ?, 'view_report', ?)`,
      [req.user.id, report.bursary_provider_id, reportId, req.ip]
    );

    res.json({
      ...report,
      items,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Generate new bursary report
 * POST /api/management/bursary-reports/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { bursary_provider_id, report_period_start, report_period_end, report_type } = req.body;

    if (!bursary_provider_id || !report_period_start || !report_period_end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify provider exists
    const provider = await getOne('SELECT * FROM bursary_providers WHERE id = ?', [
      bursary_provider_id,
    ]);
    if (!provider) {
      return res.status(404).json({ error: 'Bursary provider not found' });
    }

    // Get all students with bursaries from this provider in the period
    const studentBursaries = await getAll(
      `SELECT sb.*, s.first_name, s.last_name, s.student_number, s.email
       FROM student_bursaries sb
       JOIN students s ON sb.student_id = s.id
       WHERE sb.bursary_provider_id = ?
       AND sb.start_date <= ?
       AND sb.end_date >= ?`,
      [bursary_provider_id, report_period_end, report_period_start]
    );

    // Create report
    const reportResult = await runQuery(
      `INSERT INTO bursary_reports (
        bursary_provider_id, report_period_start, report_period_end,
        report_type, total_students, generated_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        bursary_provider_id,
        report_period_start,
        report_period_end,
        report_type || 'compliance',
        studentBursaries.length,
        req.user.id,
      ]
    );

    const reportId = reportResult.lastID;
    let compliantCount = 0;
    let nonCompliantCount = 0;

    // Generate report items for each student
    for (const bursary of studentBursaries) {
      // Calculate compliance metrics
      const complianceData = await calculateStudentCompliance(
        bursary.student_id,
        report_period_start,
        report_period_end
      );

      const complianceStatus = complianceData.compliance_status;
      if (complianceStatus === 'compliant') compliantCount++;
      else if (complianceStatus === 'non_compliant') nonCompliantCount++;

      // Insert report item
      await runQuery(
        `INSERT INTO bursary_report_items (
          report_id, student_id, student_bursary_id, compliance_status,
          attendance_rate, residence_verified, academic_status, conduct_status,
          issues_count, metrics, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reportId,
          bursary.student_id,
          bursary.id,
          complianceStatus,
          complianceData.attendance_rate,
          complianceData.residence_verified ? 1 : 0,
          complianceData.academic_status,
          complianceData.conduct_status,
          complianceData.issues_count,
          JSON.stringify(complianceData.metrics),
          complianceData.recommendations,
        ]
      );
    }

    // Update report with compliance counts
    await runQuery(
      `UPDATE bursary_reports SET
        compliant_students = ?,
        non_compliant_students = ?
       WHERE id = ?`,
      [compliantCount, nonCompliantCount, reportId]
    );

    logDataAccess({
      userId: req.user.id,
      resource: 'bursary_report',
      action: 'CREATE',
      resourceId: reportId,
      ip: req.ip,
      success: true,
      metadata: { provider_id: bursary_provider_id, total_students: studentBursaries.length },
    });

    res.status(201).json({
      message: 'Report generated successfully',
      report_id: reportId,
      total_students: studentBursaries.length,
      compliant_students: compliantCount,
      non_compliant_students: nonCompliantCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Calculate student compliance metrics
 * Helper function to assess student performance against bursary requirements
 */
async function calculateStudentCompliance(studentId, periodStart, periodEnd) {
  try {
    // Get residence verifications
    const residenceVerifications = await getAll(
      `SELECT * FROM residence_verifications
       WHERE student_id = ?
       AND verification_date BETWEEN ? AND ?
       ORDER BY verification_date DESC`,
      [studentId, periodStart, periodEnd]
    );

    const totalVerifications = residenceVerifications.length;
    const positiveVerifications = residenceVerifications.filter((v) => v.is_present).length;
    const attendanceRate =
      totalVerifications > 0 ? (positiveVerifications / totalVerifications) * 100 : 0;
    const residenceVerified = attendanceRate >= 80; // 80% threshold

    // Get academic records
    const academicRecords = await getAll(
      `SELECT * FROM academic_records
       WHERE student_id = ?
       AND submitted_date BETWEEN ? AND ?`,
      [studentId, periodStart, periodEnd]
    );

    let academicStatus = 'unknown';
    if (academicRecords.length > 0) {
      const passedCount = academicRecords.filter((r) => r.status === 'passed').length;
      const passRate = (passedCount / academicRecords.length) * 100;
      academicStatus = passRate >= 50 ? 'passing' : 'at_risk';
    }

    // Get conduct records
    const conductRecords = await getAll(
      `SELECT * FROM conduct_records
       WHERE student_id = ?
       AND incident_date BETWEEN ? AND ?
       AND affects_bursary = 1`,
      [studentId, periodStart, periodEnd]
    );

    const seriousIncidents = conductRecords.filter(
      (r) => r.severity === 'serious' || r.severity === 'critical'
    ).length;
    const conductStatus = seriousIncidents === 0 ? 'good' : seriousIncidents < 2 ? 'warning' : 'poor';

    // Get compliance alerts
    const openAlerts = await getAll(
      `SELECT * FROM bursary_compliance_alerts
       WHERE student_id = ?
       AND status IN ('open', 'escalated')
       AND created_at BETWEEN ? AND ?`,
      [studentId, periodStart, periodEnd]
    );

    // Determine overall compliance status
    let complianceStatus = 'compliant';
    const issues = [];

    if (attendanceRate < 80) {
      complianceStatus = 'warning';
      issues.push('Low attendance rate');
    }

    if (academicStatus === 'at_risk') {
      complianceStatus = 'warning';
      issues.push('Academic performance concern');
    }

    if (conductStatus === 'poor') {
      complianceStatus = 'non_compliant';
      issues.push('Serious conduct violations');
    }

    if (openAlerts.length >= 3) {
      complianceStatus = 'non_compliant';
      issues.push('Multiple open compliance alerts');
    }

    return {
      compliance_status: complianceStatus,
      attendance_rate: attendanceRate.toFixed(2),
      residence_verified: residenceVerified,
      academic_status: academicStatus,
      conduct_status: conductStatus,
      issues_count: issues.length + openAlerts.length,
      metrics: {
        residence_verifications: totalVerifications,
        positive_verifications: positiveVerifications,
        academic_courses: academicRecords.length,
        conduct_incidents: conductRecords.length,
        serious_incidents: seriousIncidents,
        open_alerts: openAlerts.length,
      },
      recommendations: issues.length > 0 ? issues.join('; ') : 'Student is in good standing',
    };
  } catch (err) {
    console.error('Error calculating compliance:', err);
    return {
      compliance_status: 'unknown',
      attendance_rate: 0,
      residence_verified: false,
      academic_status: 'unknown',
      conduct_status: 'unknown',
      issues_count: 0,
      metrics: {},
      recommendations: 'Unable to calculate compliance metrics',
    };
  }
}

/**
 * Update report status
 * PUT /api/management/bursary-reports/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['draft', 'pending_review', 'approved', 'sent', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateFields = ['status = ?'];
    const params = [status];

    if (status === 'approved') {
      updateFields.push('reviewed_by = ?', 'reviewed_at = CURRENT_TIMESTAMP');
      params.push(req.user.id);
    }

    if (status === 'sent') {
      updateFields.push('sent_at = CURRENT_TIMESTAMP');
    }

    params.push(reportId);

    await runQuery(
      `UPDATE bursary_reports SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Report status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
