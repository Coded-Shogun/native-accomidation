# Bursary Management & Reporting System - Quick Start Guide

## Overview

The Bursary Management & Reporting System is a comprehensive solution for tracking and reporting on students with bursaries (NSFAS and other funding providers). It ensures compliance with bursary requirements and automates report generation for funding organizations.

## Table of Contents

1. [Key Features](#key-features)
2. [Setup Process](#setup-process)
3. [Managing Bursary Providers](#managing-bursary-providers)
4. [Assigning Bursaries to Students](#assigning-bursaries-to-students)
5. [Recording Compliance Data](#recording-compliance-data)
6. [Generating Reports](#generating-reports)
7. [Understanding Compliance Metrics](#understanding-compliance-metrics)
8. [API Reference](#api-reference)

---

## Key Features

### For Property Managers:
- ✅ Track all students with bursaries
- ✅ Record residence verifications automatically or manually
- ✅ Track academic performance and conduct
- ✅ Generate compliance reports for bursary providers
- ✅ Receive alerts for non-compliant students
- ✅ Complete audit trail for accountability

### For Bursary Providers (NSFAS, etc.):
- ✅ View comprehensive reports on all funded students
- ✅ Track attendance rates and residence verification
- ✅ Monitor academic performance
- ✅ Access conduct records
- ✅ Customizable reporting frequency
- ✅ Export reports to PDF/Excel

### For Students:
- ✅ Transparent tracking of bursary compliance
- ✅ Alerts when action is needed
- ✅ Access to their own compliance status

---

## Setup Process

### 1. Create Bursary Provider (NSFAS)

```bash
POST /api/management/bursary-providers
```

**Example Request:**
```json
{
  "name": "NSFAS",
  "type": "government",
  "contact_person": "Jane Doe",
  "contact_email": "jane@nsfas.org.za",
  "contact_phone": "+27123456789",
  "reporting_frequency": "monthly",
  "requirements": [
    {
      "type": "attendance",
      "threshold": 80,
      "description": "Student must be verified present at accommodation 80% of the time"
    },
    {
      "type": "academic",
      "threshold": 50,
      "description": "Student must pass at least 50% of courses"
    },
    {
      "type": "conduct",
      "threshold": 0,
      "description": "No serious disciplinary incidents"
    }
  ]
}
```

### 2. Define Requirements for Provider

```bash
POST /api/management/bursary-providers/{provider_id}/requirements
```

**Example Request:**
```json
{
  "requirement_type": "residence_verification",
  "requirement_name": "Monthly Residence Check",
  "description": "Student must be verified as residing at accommodation",
  "metric_type": "percentage",
  "threshold_value": "80",
  "frequency": "monthly",
  "is_mandatory": true
}
```

---

## Managing Bursary Providers

### List All Providers

```bash
GET /api/management/bursary-providers
GET /api/management/bursary-providers?is_active=true
```

### Get Provider Details

```bash
GET /api/management/bursary-providers/{id}
```

**Response includes:**
- Provider information
- All requirements
- Statistics (total students, active students)

### Update Provider

```bash
PUT /api/management/bursary-providers/{id}
```

---

## Assigning Bursaries to Students

### Assign Bursary to Student

```bash
POST /api/management/student-bursaries
```

**Example Request:**
```json
{
  "student_id": 123,
  "bursary_provider_id": 1,
  "bursary_reference": "NSFAS-2025-123456",
  "amount": 50000.00,
  "currency": "ZAR",
  "academic_year": "2025",
  "start_date": "2025-02-01",
  "end_date": "2025-12-15",
  "conditions": {
    "minimum_attendance": 80,
    "minimum_pass_rate": 50,
    "no_serious_misconduct": true
  },
  "payment_schedule": {
    "installments": [
      {"date": "2025-02-01", "amount": 25000},
      {"date": "2025-07-01", "amount": 25000}
    ]
  }
}
```

### View All Bursaries

```bash
GET /api/management/student-bursaries
GET /api/management/student-bursaries?status=active
GET /api/management/student-bursaries?bursary_provider_id=1
GET /api/management/student-bursaries?academic_year=2025
```

### Update Bursary Status

```bash
PUT /api/management/student-bursaries/{id}/status
```

**Example (Suspend Bursary):**
```json
{
  "status": "suspended",
  "reason": "Multiple failed residence verifications. Student not residing at accommodation."
}
```

**Statuses:**
- `pending`: Awaiting approval
- `active`: Currently active
- `suspended`: Temporarily suspended
- `completed`: Funding period completed
- `cancelled`: Bursary cancelled

---

## Recording Compliance Data

### 1. Residence Verification

#### Manual Verification

```bash
POST /api/management/residence-verification
```

**Example (Student Present):**
```json
{
  "student_id": 123,
  "property_id": 1,
  "verification_date": "2025-11-13",
  "verification_type": "weekly",
  "verification_method": "physical",
  "is_present": true,
  "notes": "Student signed in at reception"
}
```

**Example (Student Absent):**
```json
{
  "student_id": 123,
  "property_id": 1,
  "verification_date": "2025-11-13",
  "verification_type": "random",
  "verification_method": "photo",
  "is_present": false,
  "notes": "Room inspection - student not present. Bed appears unused.",
  "evidence_url": "/uploads/verifications/2025-11-13-room-123.jpg"
}
```

**Verification Types:**
- `checkin`: Daily check-in
- `weekly`: Weekly verification
- `monthly`: Monthly inspection
- `random`: Random spot check
- `audit`: Formal audit

**Verification Methods:**
- `physical`: In-person verification
- `biometric`: Fingerprint/face recognition
- `access_log`: Automated from door access system
- `photo`: Photo evidence
- `video`: Video evidence
- `other`: Other method

#### Bulk Verification (from Access Logs)

```bash
POST /api/management/residence-verification/bulk
```

**Example:**
```json
{
  "property_id": 1,
  "verification_date": "2025-11-13",
  "verification_type": "checkin",
  "student_ids": [123, 124, 125, 126, 127]
}
```

#### Get Student Attendance Rate

```bash
GET /api/management/residence-verification/student/123/rate
GET /api/management/residence-verification/student/123/rate?date_from=2025-01-01&date_to=2025-11-13
```

**Response:**
```json
{
  "total_verifications": 40,
  "positive_verifications": 35,
  "attendance_rate": 87.5
}
```

### 2. Academic Records

**Note:** Academic records would typically be imported from the university's student information system. You can create a similar API endpoint or manually insert records.

**Example SQL:**
```sql
INSERT INTO academic_records (
  student_id, academic_year, semester, course_name, course_code,
  credits, grade, percentage, status
) VALUES (
  123, '2025', '1', 'Mathematics 101', 'MATH101',
  15, 'B', 68.5, 'passed'
);
```

### 3. Conduct Records

Conduct records are created when disciplinary incidents occur:

**Example (Manual Entry):**
```sql
INSERT INTO conduct_records (
  student_id, property_id, incident_date, incident_type,
  severity, description, action_taken, affects_bursary
) VALUES (
  123, 1, '2025-11-10', 'noise',
  'minor', 'Loud music after 10pm. First warning issued.',
  'Verbal warning', 0
);
```

**For serious incidents:**
```sql
INSERT INTO conduct_records (
  student_id, property_id, incident_date, incident_type,
  severity, description, action_taken, affects_bursary, reported_by
) VALUES (
  123, 1, '2025-11-10', 'damage',
  'serious', 'Intentional damage to common area furniture. Estimated cost R2,500.',
  'Written warning. Student liable for damages.', 1, 5
);
```

---

## Generating Reports

### Generate Report for Time Period

```bash
POST /api/management/bursary-reports/generate
```

**Example:**
```json
{
  "bursary_provider_id": 1,
  "report_period_start": "2025-01-01",
  "report_period_end": "2025-11-13",
  "report_type": "compliance"
}
```

**Response:**
```json
{
  "message": "Report generated successfully",
  "report_id": 42,
  "total_students": 150,
  "compliant_students": 125,
  "non_compliant_students": 15
}
```

**Report Types:**
- `individual`: Detailed report for each student
- `aggregate`: Summary statistics
- `compliance`: Compliance status for all students
- `financial`: Financial summary
- `custom`: Custom report format

### View Generated Report

```bash
GET /api/management/bursary-reports/{report_id}
```

**Response includes:**
- Report metadata
- Compliance statistics
- List of all students with detailed metrics
- Individual compliance status for each student

### Update Report Status

```bash
PUT /api/management/bursary-reports/{report_id}/status
```

**Workflow:**
```json
// 1. Draft (automatically created)
{"status": "draft"}

// 2. Submit for review
{"status": "pending_review"}

// 3. Approve (manager/admin)
{"status": "approved"}

// 4. Send to provider
{"status": "sent"}

// 5. Archive
{"status": "archived"}
```

---

## Understanding Compliance Metrics

### How Compliance is Calculated

The system automatically calculates compliance for each student based on:

#### 1. **Attendance Rate** (Weight: High)
- **Source:** Residence verifications
- **Calculation:** `(Positive Verifications / Total Verifications) × 100`
- **Threshold:** 80% (configurable per provider)
- **Impact:**
  - < 80%: **Warning** status
  - < 60%: **Non-compliant** status

#### 2. **Academic Performance** (Weight: High)
- **Source:** Academic records
- **Calculation:** `(Passed Courses / Total Courses) × 100`
- **Threshold:** 50% pass rate (configurable)
- **Status:**
  - ≥ 50%: **Passing**
  - < 50%: **At Risk**

#### 3. **Conduct Status** (Weight: Critical)
- **Source:** Conduct records
- **Calculation:** Count of serious/critical incidents
- **Status:**
  - 0 serious incidents: **Good**
  - 1 serious incident: **Warning**
  - ≥ 2 serious incidents: **Poor** → **Non-compliant**

#### 4. **Open Compliance Alerts** (Weight: High)
- **Source:** Compliance alerts table
- **Calculation:** Count of open/escalated alerts
- **Impact:**
  - ≥ 3 open alerts: **Non-compliant**

### Overall Compliance Status

```
COMPLIANT:
- Attendance ≥ 80%
- Academic status = Passing
- Conduct status = Good or Warning
- < 3 open alerts

WARNING:
- Attendance 60-79% OR
- Academic status = At Risk OR
- Conduct status = Warning
- Any single issue

NON-COMPLIANT:
- Attendance < 60% OR
- Conduct status = Poor OR
- ≥ 3 open alerts OR
- Multiple warning conditions
```

### Example Report Item

```json
{
  "student_id": 123,
  "student_name": "John Doe",
  "student_number": "STU2025123",
  "bursary_reference": "NSFAS-2025-123456",
  "compliance_status": "warning",
  "attendance_rate": 75.5,
  "residence_verified": false,
  "academic_status": "passing",
  "conduct_status": "good",
  "issues_count": 1,
  "metrics": {
    "residence_verifications": 40,
    "positive_verifications": 30,
    "academic_courses": 6,
    "conduct_incidents": 0,
    "serious_incidents": 0,
    "open_alerts": 1
  },
  "recommendations": "Low attendance rate - student needs to improve presence at accommodation"
}
```

---

## API Reference

### Endpoints Summary

#### Bursary Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/management/bursary-providers` | List all providers |
| GET | `/api/management/bursary-providers/:id` | Get provider details |
| POST | `/api/management/bursary-providers` | Create new provider |
| PUT | `/api/management/bursary-providers/:id` | Update provider |
| POST | `/api/management/bursary-providers/:id/requirements` | Add requirement |

#### Student Bursaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/management/student-bursaries` | List all bursaries |
| GET | `/api/management/student-bursaries/:id` | Get bursary details |
| POST | `/api/management/student-bursaries` | Assign bursary |
| PUT | `/api/management/student-bursaries/:id/status` | Update status |
| GET | `/api/management/student-bursaries/stats/summary` | Get statistics |

#### Bursary Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/management/bursary-reports` | List all reports |
| GET | `/api/management/bursary-reports/:id` | Get report with items |
| POST | `/api/management/bursary-reports/generate` | Generate new report |
| PUT | `/api/management/bursary-reports/:id/status` | Update report status |

#### Residence Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/management/residence-verification` | List verifications |
| POST | `/api/management/residence-verification` | Record verification |
| POST | `/api/management/residence-verification/bulk` | Bulk verify students |
| GET | `/api/management/residence-verification/student/:id/rate` | Get attendance rate |

---

## Best Practices

### 1. Regular Verification
- **Weekly verifications** recommended for NSFAS compliance
- Use **automated verification** from access logs where possible
- Perform **random spot checks** monthly
- Document all verifications with photos for audits

### 2. Timely Reporting
- Generate **monthly reports** for NSFAS
- Review reports before sending (use `pending_review` status)
- Archive old reports after provider receives them

### 3. Alert Management
- Review compliance alerts **daily**
- Acknowledge alerts promptly
- Contact students immediately when issues arise
- Document all resolution actions

### 4. Data Quality
- Import academic records **every semester**
- Record conduct incidents **immediately**
- Update bursary statuses **within 24 hours** of status changes

### 5. Audit Trail
- All actions are automatically logged
- Use access logs to track who viewed sensitive data
- Review audit logs monthly for compliance

---

## Troubleshooting

### Issue: Student showing as non-compliant despite good attendance

**Solution:** Check if:
1. Conduct records have serious incidents marked as `affects_bursary = 1`
2. Academic records show failing grades (< 50% pass rate)
3. Multiple open alerts exist

### Issue: Report generation is slow

**Solution:**
- Limit report period to 3-6 months maximum
- Run report generation during off-peak hours
- For annual reports, generate quarterly reports and combine

### Issue: Bursary provider can't access reports

**Solution:**
- Verify user has appropriate role (`manager` or `admin`)
- Check that JWT token is valid and not expired
- Confirm provider ID matches in report

---

## Support

For technical support or questions:
- **Documentation:** `/docs` directory
- **API Documentation:** Generated via Docusaurus
- **Issue Tracking:** Create issue in repository

---

## Changelog

### Version 1.0.0 (2025-11-13)
- Initial release
- NSFAS compliance features
- Automated report generation
- Residence verification system
- Academic and conduct tracking
- Compliance alerts
