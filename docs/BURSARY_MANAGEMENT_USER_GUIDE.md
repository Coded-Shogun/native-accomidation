# Bursary Management System - User Guide

## Overview

The Bursary Management System provides a comprehensive interface for managing NSFAS and other funding sources for student accommodation. This guide covers how to use the management portal to track student funding, record compliance data, and generate reports for bursary providers.

**Key Features**:
- Manage funding organizations (NSFAS, corporate sponsors, NGOs)
- Assign and track bursaries for individual students
- Record residence verifications for NSFAS compliance
- Generate automated compliance reports
- Monitor student academic and conduct status
- Real-time compliance alerts

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Bursary Providers](#managing-bursary-providers)
4. [Student Bursaries](#student-bursaries)
5. [Residence Verification](#residence-verification)
6. [Compliance Reports](#compliance-reports)
7. [Understanding Compliance Metrics](#understanding-compliance-metrics)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Bursary Management System

1. Log in to the Student Accommodation Management System
2. Navigate to **Bursary Management** in the main navigation bar
3. You will see the dashboard with overview statistics

**Required Role**: Manager or Admin

---

## Dashboard Overview

The bursary management dashboard provides a quick overview of your system:

### Statistics Cards

| Metric | Description |
|--------|-------------|
| **Total Bursaries** | All bursary records in the system |
| **Active Bursaries** | Currently active student funding |
| **Suspended** | Bursaries that have been suspended |
| **Students** | Number of students with bursaries |
| **Providers** | Number of funding organizations |
| **Total Amount** | Sum of all bursary amounts (in millions) |

### Quick Actions

- **Assign Bursary** - Quickly assign funding to a student
- **Record Verification** - Log student residence verification
- **Generate Report** - Create compliance report for provider
- **Manage Providers** - View/edit funding organizations

### Recent Compliance Alerts

View the latest compliance issues that require attention:
- **Info** - General notifications
- **Warning** - Issues that need monitoring
- **Critical** - Urgent problems requiring immediate action

Click **View Details** on any alert to see the full student bursary information.

---

## Managing Bursary Providers

### Viewing All Providers

1. Navigate to **Bursary Management** → **Bursary Providers**
2. View all funding organizations in a grid layout

Each provider card shows:
- Provider icon (based on type)
- Organization name
- Provider type
- Contact information
- Reporting frequency
- Active/Inactive status

### Adding a New Provider

1. Click **+ Add Provider** button
2. Fill in the required information:

**Basic Information**:
- **Provider Name** *(required)* - e.g., "NSFAS", "FirstRand Foundation"
- **Provider Type** *(required)* - Choose from:
  - Government (e.g., NSFAS)
  - Corporate (e.g., company foundations)
  - NGO (e.g., charity organizations)
  - University (e.g., institutional bursaries)
  - Private (e.g., individual donors)
  - Other

- **Reporting Frequency** *(required)* - How often to generate reports:
  - Weekly
  - Monthly
  - Quarterly
  - Semester
  - Annual

**Contact Information** *(optional)*:
- Contact Person
- Contact Email
- Contact Phone

3. Check **Provider is active** to enable
4. Click **Create Provider**

### Viewing Provider Details

Click on any provider card to view:

**Contact Information**:
- Contact person, email, and phone
- Reporting frequency

**Statistics**:
- Total students with this bursary
- Currently active students

**Requirements**:
- List of compliance requirements
- Mandatory vs. optional indicators
- Requirement types and frequencies
- Threshold values

**Quick Actions**:
- **View Students with this Bursary** - Filter student bursaries by provider
- **View Reports** - See all reports generated for this provider

### Editing a Provider

1. Open provider details
2. Click **Edit Provider**
3. Update information
4. Click **Update Provider**

---

## Student Bursaries

### Viewing All Student Bursaries

Navigate to **Bursary Management** → **Student Bursaries**

### Filtering Bursaries

Use the filter panel to narrow down results:

| Filter | Options |
|--------|---------|
| **Status** | All, Active, Pending, Suspended, Completed, Cancelled |
| **Provider** | Select from dropdown |
| **Academic Year** | Enter year (defaults to current) |

Click any row to view detailed information.

### Assigning a New Bursary

1. Click **+ Assign Bursary**
2. Fill in the form:

**Student Information**:
- Select student from dropdown

**Bursary Details**:
- **Bursary Provider** *(required)* - Select funding organization
- **Bursary Reference** *(required)* - Unique reference number from provider
- **Amount** *(required)* - Funding amount
- **Currency** - Default: ZAR
- **Academic Year** *(required)* - e.g., "2025"

**Dates**:
- **Start Date** *(required)* - When funding begins
- **End Date** *(required)* - When funding ends

**Additional Information** *(optional)*:
- **Conditions** - Any special terms or requirements
- **Payment Schedule** - When disbursements occur

3. Click **Assign Bursary**

### Viewing Student Bursary Details

Click on any bursary to see:

**Bursary Information**:
- Student name and details
- Provider information
- Amount and reference number
- Academic year and dates
- Current status

**Compliance Alerts**:
- Recent alerts for this student
- Severity levels (info, warning, critical)
- Alert descriptions and dates
- Current status of each alert

**Latest Residence Verification**:
- Most recent attendance verification
- Verification date and type
- Whether student was present
- Verification method used

**Conduct Records**:
- Disciplinary incidents affecting bursary
- Incident dates and severity
- Descriptions and outcomes

### Updating Bursary Status

1. Open bursary details
2. Click **Update Status**
3. Select new status:
   - **Pending** - Awaiting approval
   - **Active** - Currently funded
   - **Suspended** - Temporarily halted
   - **Completed** - Funding period ended
   - **Cancelled** - Permanently terminated

4. Provide reason (required for suspended/cancelled)
5. Click **Update Status**

**Note**: Changing status to Suspended or Cancelled will automatically create a compliance alert.

---

## Residence Verification

Residence verification is critical for NSFAS compliance. It proves that students are actually living at the accommodation property.

### Recording Single Verification

1. Navigate to **Bursary Management** → **Residence Verification**
2. Use the **Single Verification** form:

**Student Selection**:
- Type student name or number in search box
- Select student from dropdown

**Verification Details**:
- **Property** - Select property from dropdown
- **Verification Date** *(required)* - Date of check
- **Verification Type** *(required)*:
  - Check-in (daily entry)
  - Weekly (scheduled check)
  - Monthly (scheduled check)
  - Random (unscheduled check)
  - Audit (official inspection)

- **Verification Method** *(required)*:
  - Physical (staff physically saw student)
  - Biometric (fingerprint/face scan)
  - Access Log (door access system)
  - Photo (photographic evidence)
  - Video (video surveillance)
  - Other

- **Is Present** *(required)* - Yes or No
- **Notes** *(optional)* - Additional comments
- **Evidence URL** *(optional)* - Link to photo/video

3. Click **Record Verification**

**Automatic Alert Generation**:
If a student is marked as **not present** and has an active bursary, a compliance alert will be automatically created.

### Bulk Verification

Use this for verifying multiple students at once, typically from access control logs:

1. Select **Bulk Verification** form
2. Fill in common details:
   - **Property**
   - **Verification Date**
   - **Verification Type**

3. Enter **Student IDs**:
   - One student ID per line
   - Can be student numbers or database IDs
   - Example:
     ```
     STU001
     STU002
     STU003
     ```

4. Click **Bulk Verify**

The system will:
- Process all student IDs
- Create verification records (marked as present)
- Show success count vs total count

**Best Practice**: Use bulk verification with your access control system export. Export student IDs who accessed the building, then paste into this form.

### Viewing Verification History

The verification history table shows:
- Student name and number
- Property name
- Verification date and type
- Presence status (✓ Present or ✗ Absent)
- Verification method
- Verified by (staff member)

Use filters to narrow results:
- **Property** - Specific location
- **Date Range** - Start and end dates
- **Presence** - All, Present only, Absent only

---

## Compliance Reports

### Viewing Existing Reports

Navigate to **Bursary Management** → **Compliance Reports**

Each report card shows:
- Report ID and status
- Bursary provider name
- Report period (start to end dates)
- Report type
- Statistics:
  - Total students
  - Compliant students
  - Non-compliant students
  - Compliance percentage

### Generating a New Report

1. Click **+ Generate Report**
2. Fill in the form:

**Report Configuration**:
- **Bursary Provider** *(required)* - Select organization
- **Report Period Start** *(required)* - Beginning of period
- **Report Period End** *(required)* - End of period
- **Report Type** *(required)*:
  - Individual (per-student details)
  - Aggregate (summary statistics)
  - Compliance (focus on compliance metrics)
  - Financial (focus on amounts and payments)
  - Custom (configurable fields)

**Quick Period Selectors**:
- Click pre-defined periods to auto-fill dates:
  - **Last 7 Days**
  - **Last 30 Days**
  - **Last 3 Months**
  - **Last 6 Months**
  - **This Year**

3. Click **Generate Report**

The system will:
- Calculate compliance for all students with this bursary
- Analyze residence verifications, academic records, and conduct
- Generate compliance status for each student
- Create summary statistics
- Save report with status "Draft"

### Viewing Report Details

Click on any report to see:

**Report Overview**:
- Provider name and period
- Report status
- Summary statistics with percentages

**Students Compliance Table**:

| Column | Description |
|--------|-------------|
| **Student** | Name and student number |
| **Bursary Reference** | Funding reference number |
| **Attendance** | Percentage of positive verifications |
| **Academic Status** | Passing, At Risk, or Unknown |
| **Conduct** | Good, Warning, or Poor |
| **Compliance Status** | Compliant, Warning, or Non-Compliant |
| **Issues** | Count of problems |
| **Recommendations** | Suggested actions |

**Status Badges**:
- 🟢 **Compliant** - Student meets all requirements
- 🟡 **Warning** - Student has minor issues to address
- 🔴 **Non-Compliant** - Student has serious compliance problems

### Updating Report Status

Reports follow a workflow:

1. **Draft** - Just generated, being reviewed
2. **Pending Review** - Submitted for approval
3. **Approved** - Verified and ready to send
4. **Sent** - Delivered to bursary provider
5. **Archived** - Historical record

Use the status dropdown to change report status.

### Exporting Reports

Click export buttons to download in different formats:
- **📄 Export PDF** - Formatted document for printing
- **📊 Export Excel** - Spreadsheet for analysis
- **📋 Export CSV** - Data for import into other systems

---

## Understanding Compliance Metrics

### How Compliance is Calculated

The system uses an automated algorithm to determine student compliance:

#### 1. Attendance Rate

```
Attendance Rate = (Positive Verifications / Total Verifications) × 100
```

- **Compliant**: ≥ 80% attendance rate
- **Warning**: 60-79% attendance rate
- **Non-Compliant**: < 60% attendance rate

#### 2. Academic Performance

Based on submitted academic records:

- **Passing**: ≥ 50% of courses passed
- **At Risk**: < 50% of courses passed
- **Unknown**: No academic records submitted

#### 3. Conduct Status

Based on disciplinary records:

- **Good**: No serious or critical incidents
- **Warning**: 1 serious incident
- **Poor**: ≥ 2 serious incidents or any critical incident

#### 4. Overall Compliance Status

| Status | Criteria |
|--------|----------|
| **Compliant** | Attendance ≥ 80%, Academic passing, Conduct good, < 3 open alerts |
| **Warning** | Attendance 60-79%, OR Academic at risk, OR Conduct warning |
| **Non-Compliant** | Attendance < 60%, OR Multiple serious conduct issues |

### Common Compliance Issues

| Issue | Description | Resolution |
|-------|-------------|------------|
| **Low Attendance** | < 80% positive verifications | Increase verification frequency, check access control logs |
| **Academic Performance** | Failing multiple courses | Contact student, offer tutoring, review study conditions |
| **Conduct Violations** | Serious disciplinary incidents | Follow disciplinary procedures, may affect bursary |
| **Missing Verifications** | No recent verification records | Schedule verifications, ensure staff compliance |
| **Open Alerts** | Multiple unresolved alerts | Review and resolve each alert, update status |

---

## Best Practices

### For Bursary Provider Management

1. **Keep Contact Information Updated**
   - Regularly verify email addresses and phone numbers
   - Update contact person when staff changes
   - Test email delivery before generating reports

2. **Set Appropriate Reporting Frequency**
   - NSFAS typically requires monthly reporting
   - Corporate sponsors may prefer quarterly
   - Align with provider's actual requirements

3. **Document Requirements Clearly**
   - Add all provider requirements to system
   - Mark mandatory vs. optional correctly
   - Include threshold values for metrics

### For Student Bursary Management

1. **Accurate Reference Numbers**
   - Use exact reference from provider
   - Double-check before saving
   - Keep physical documentation as backup

2. **Regular Status Updates**
   - Review bursary statuses monthly
   - Update promptly when circumstances change
   - Document reasons for suspensions

3. **Monitor Expiry Dates**
   - Set reminders for end dates
   - Begin renewal process 60 days before expiry
   - Don't let bursaries expire unexpectedly

### For Residence Verification

1. **Consistent Verification Schedule**
   - Verify at least weekly for NSFAS compliance
   - Use same day/time each week
   - Don't skip verifications

2. **Multiple Verification Methods**
   - Use access control logs as primary
   - Supplement with physical checks
   - Keep photographic evidence for audits

3. **Immediate Recording**
   - Record verifications on the same day
   - Don't backdate verifications
   - Be honest about absences

4. **Bulk Verification Efficiency**
   - Export access logs daily/weekly
   - Use bulk verification feature
   - Reduces manual data entry

### For Report Generation

1. **Regular Reporting Schedule**
   - Generate reports monthly (minimum)
   - Use consistent reporting periods
   - Archive old reports

2. **Review Before Sending**
   - Check summary statistics
   - Review student compliance details
   - Verify date ranges are correct

3. **Act on Compliance Issues**
   - Don't just generate reports
   - Follow up on non-compliant students
   - Document interventions

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Student Not Found in Search

**Cause**: Student doesn't exist or isn't enrolled

**Solution**:
1. Check spelling of name/student number
2. Verify student has active lease
3. Check student is in database (Students section)
4. Contact admin if student should exist

#### Issue: Cannot Assign Bursary

**Possible Causes**:
- Missing required fields
- Duplicate bursary reference
- Student already has active bursary for same provider/year

**Solution**:
1. Check all required fields are filled
2. Verify bursary reference is unique
3. Check if student has existing bursary for this provider/year
4. Update existing bursary instead of creating new one

#### Issue: Compliance Status Shows "Non-Compliant" But Student Seems Fine

**Possible Causes**:
- Missing verification records
- Outdated academic records
- Unresolved compliance alerts

**Solution**:
1. Check verification history - are there enough records?
2. Verify academic records are current
3. Review and resolve open compliance alerts
4. Ensure all data is up to date

#### Issue: Report Generation Fails

**Possible Causes**:
- No students with selected provider
- Invalid date range
- System error

**Solution**:
1. Verify students exist with this bursary provider
2. Check date range is logical (start before end)
3. Ensure date range includes bursary periods
4. Check system logs for errors
5. Contact technical support if persists

#### Issue: Bulk Verification Not Working

**Possible Causes**:
- Invalid student IDs
- Wrong format
- Students not found

**Solution**:
1. Verify student IDs are correct
2. Use one ID per line
3. Remove any extra spaces or characters
4. Check students exist in database
5. Try with smaller batch to identify problem IDs

#### Issue: Can't See Bursary Management Section

**Cause**: Insufficient permissions

**Solution**:
1. Verify you have Manager or Admin role
2. Log out and log back in
3. Contact system administrator to update your role

---

## Compliance Audit Checklist

Use this checklist to prepare for NSFAS or other bursary audits:

### Pre-Audit (1 Month Before)

- [ ] All bursary providers are current and active
- [ ] All student bursaries have correct reference numbers
- [ ] All bursaries have accurate start/end dates
- [ ] Contact information for all providers is updated
- [ ] All students have been verified in last 30 days
- [ ] Academic records are current for all students
- [ ] No unresolved critical compliance alerts
- [ ] Reports generated for audit period
- [ ] Physical documentation matches system records

### During Audit

- [ ] Generate fresh compliance report for audit period
- [ ] Export reports to PDF for auditor
- [ ] Provide verification history for sample students
- [ ] Show compliance calculation methodology
- [ ] Demonstrate alert system
- [ ] Show evidence of follow-up on non-compliant students

### Post-Audit

- [ ] Address any findings
- [ ] Update procedures based on recommendations
- [ ] Document lessons learned
- [ ] Improve verification processes if needed

---

## Support and Resources

### Additional Documentation

- **BURSARY_REPORTING_GUIDE.md** - Technical API documentation
- **ISO27001_COMPLIANCE.md** - Security and data protection
- **SOC2_COMPLIANCE.md** - Compliance framework details

### Getting Help

If you encounter issues not covered in this guide:

1. Check system logs for error messages
2. Review audit trail for recent changes
3. Contact your system administrator
4. For technical issues, refer to the API documentation

### Training Resources

New staff should:
1. Read this guide thoroughly
2. Practice with test data
3. Shadow experienced staff for one week
4. Review compliance requirements with supervisor
5. Understand NSFAS specific requirements

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-13 | Initial release with full bursary management features |

---

*This system is ISO 27001 and SOC 2 compliant. All data access is logged for audit purposes.*
