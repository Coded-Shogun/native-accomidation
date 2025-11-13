import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './BursaryReports.css';

/**
 * BursaryReports - Generate and view compliance reports for bursary providers
 */
function BursaryReports() {
  return (
    <div className="bursary-reports">
      <Routes>
        <Route path="/" element={<ReportsList />} />
        <Route path="/generate" element={<GenerateReportForm />} />
        <Route path="/:id" element={<ReportDetails />} />
      </Routes>
    </div>
  );
}

/**
 * ReportsList - List all generated reports
 */
function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filterStatus) queryParams.append('status', filterStatus);

      const response = await fetch(`/api/management/bursary-reports?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-secondary',
      pending_review: 'badge-warning',
      approved: 'badge-success',
      sent: 'badge-info',
      archived: 'badge-dark',
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <>
      <div className="reports-header">
        <h2>Bursary Reports</h2>
        <button onClick={() => navigate('/bursary/reports/generate')} className="btn btn-primary">
          + Generate Report
        </button>
      </div>

      <div className="reports-filters">
        <label>Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {reports.length === 0 ? (
        <div className="no-reports">
          <p>No reports found</p>
          <button onClick={() => navigate('/bursary/reports/generate')} className="btn btn-primary">
            Generate Your First Report
          </button>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div
              key={report.id}
              className="report-card"
              onClick={() => navigate(`/bursary/reports/${report.id}`)}
            >
              <div className="report-header">
                <h3>{report.provider_name}</h3>
                <span className={`badge ${getStatusBadge(report.status)}`}>
                  {report.status.replace('_', ' ')}
                </span>
              </div>

              <div className="report-details">
                <div className="detail-row">
                  <span className="label">Period:</span>
                  <span className="value">
                    {new Date(report.report_period_start).toLocaleDateString()} -{' '}
                    {new Date(report.report_period_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{report.report_type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Generated:</span>
                  <span className="value">
                    {new Date(report.generated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="report-stats">
                <div className="stat-item">
                  <div className="stat-value">{report.total_students || 0}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-item stat-success">
                  <div className="stat-value">{report.compliant_students || 0}</div>
                  <div className="stat-label">Compliant</div>
                </div>
                <div className="stat-item stat-danger">
                  <div className="stat-value">{report.non_compliant_students || 0}</div>
                  <div className="stat-label">Non-Compliant</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * ReportDetails - View report with all student items
 */
function ReportDetails() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCompliance, setFilterCompliance] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/management/bursary-reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/management/bursary-reports/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('Report status updated successfully');
        fetchReport();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const getComplianceBadge = (status) => {
    const badges = {
      compliant: 'badge-success',
      warning: 'badge-warning',
      non_compliant: 'badge-danger',
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading report...</div>;
  }

  if (!report) {
    return <div className="error">Report not found</div>;
  }

  const filteredItems =
    filterCompliance === ''
      ? report.items
      : report.items.filter((item) => item.compliance_status === filterCompliance);

  return (
    <div className="report-details-page">
      <div className="details-header">
        <button onClick={() => navigate('/bursary/reports')} className="btn btn-outline">
          ← Back to Reports
        </button>
        <div className="header-actions">
          {report.status === 'draft' && (
            <button
              onClick={() => updateReportStatus('pending_review')}
              className="btn btn-warning"
            >
              Submit for Review
            </button>
          )}
          {report.status === 'pending_review' && (
            <button onClick={() => updateReportStatus('approved')} className="btn btn-success">
              Approve Report
            </button>
          )}
          {report.status === 'approved' && (
            <button onClick={() => updateReportStatus('sent')} className="btn btn-primary">
              Mark as Sent
            </button>
          )}
        </div>
      </div>

      <div className="report-info-card">
        <div className="card-header">
          <div>
            <h2>{report.provider_name}</h2>
            <p className="report-period">
              {new Date(report.report_period_start).toLocaleDateString()} -{' '}
              {new Date(report.report_period_end).toLocaleDateString()}
            </p>
          </div>
          <span className={`badge badge-large badge-${report.status}`}>
            {report.status.replace('_', ' ')}
          </span>
        </div>

        <div className="report-summary">
          <div className="summary-stat">
            <div className="stat-value">{report.total_students || 0}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="summary-stat stat-success">
            <div className="stat-value">{report.compliant_students || 0}</div>
            <div className="stat-label">Compliant</div>
          </div>
          <div className="summary-stat stat-danger">
            <div className="stat-value">{report.non_compliant_students || 0}</div>
            <div className="stat-label">Non-Compliant</div>
          </div>
          <div className="summary-stat">
            <div className="stat-value">
              {report.total_students > 0
                ? ((report.compliant_students / report.total_students) * 100).toFixed(1)
                : 0}
              %
            </div>
            <div className="stat-label">Compliance Rate</div>
          </div>
        </div>
      </div>

      <div className="report-items-section">
        <div className="items-header">
          <h3>Student Details</h3>
          <div className="items-filter">
            <label>Filter by Compliance:</label>
            <select value={filterCompliance} onChange={(e) => setFilterCompliance(e.target.value)}>
              <option value="">All Students</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
          </div>
        </div>

        <div className="report-items-table-container">
          <table className="report-items-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student Number</th>
                <th>Bursary Ref</th>
                <th>Compliance</th>
                <th>Attendance</th>
                <th>Academic</th>
                <th>Conduct</th>
                <th>Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.student_id}>
                    <td>
                      {item.first_name} {item.last_name}
                    </td>
                    <td>{item.student_number}</td>
                    <td className="reference-cell">{item.bursary_reference}</td>
                    <td>
                      <span className={`badge ${getComplianceBadge(item.compliance_status)}`}>
                        {item.compliance_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{item.attendance_rate ? `${item.attendance_rate}%` : 'N/A'}</td>
                    <td>{item.academic_status || 'N/A'}</td>
                    <td>
                      <span className={`conduct-badge conduct-${item.conduct_status}`}>
                        {item.conduct_status}
                      </span>
                    </td>
                    <td>{item.issues_count || 0}</td>
                    <td>
                      <button
                        onClick={() =>
                          navigate(`/bursary/student-bursaries/${item.student_bursary_id}`)
                        }
                        className="btn btn-small btn-outline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-items">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * GenerateReportForm - Form to generate new report
 */
function GenerateReportForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [formData, setFormData] = useState({
    bursary_provider_id: '',
    report_period_start: '',
    report_period_end: '',
    report_type: 'compliance',
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/management/bursary-providers?is_active=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/management/bursary-reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Report generated successfully!\nTotal Students: ${data.total_students}\nCompliant: ${data.compliant_students}\nNon-Compliant: ${data.non_compliant_students}`
        );
        navigate(`/bursary/reports/${data.report_id}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to generate report');
      }
    } catch (err) {
      alert('Error generating report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setQuickPeriod = (period) => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'semester':
        start.setMonth(start.getMonth() - 6);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        return;
    }

    setFormData((prev) => ({
      ...prev,
      report_period_start: start.toISOString().split('T')[0],
      report_period_end: end.toISOString().split('T')[0],
    }));
  };

  return (
    <div className="generate-report-page">
      <div className="form-header">
        <h2>Generate Bursary Report</h2>
        <button onClick={() => navigate('/bursary/reports')} className="btn btn-outline">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="generate-report-form">
        <div className="form-section">
          <h3>Report Configuration</h3>

          <div className="form-group">
            <label htmlFor="bursary_provider_id">
              Bursary Provider <span className="required">*</span>
            </label>
            <select
              id="bursary_provider_id"
              name="bursary_provider_id"
              value={formData.bursary_provider_id}
              onChange={handleChange}
              required
            >
              <option value="">Select provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} ({provider.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="report_type">
              Report Type <span className="required">*</span>
            </label>
            <select
              id="report_type"
              name="report_type"
              value={formData.report_type}
              onChange={handleChange}
              required
            >
              <option value="compliance">Compliance</option>
              <option value="individual">Individual</option>
              <option value="aggregate">Aggregate</option>
              <option value="financial">Financial</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Report Period</h3>

          <div className="quick-periods">
            <button type="button" onClick={() => setQuickPeriod('month')} className="btn btn-small btn-outline">
              Last Month
            </button>
            <button type="button" onClick={() => setQuickPeriod('quarter')} className="btn btn-small btn-outline">
              Last Quarter
            </button>
            <button type="button" onClick={() => setQuickPeriod('semester')} className="btn btn-small btn-outline">
              Last Semester
            </button>
            <button type="button" onClick={() => setQuickPeriod('year')} className="btn btn-small btn-outline">
              Last Year
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="report_period_start">
                Start Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="report_period_start"
                name="report_period_start"
                value={formData.report_period_start}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="report_period_end">
                End Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="report_period_end"
                name="report_period_end"
                value={formData.report_period_end}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="info-box">
          <h4>📊 What will be included in this report?</h4>
          <ul>
            <li>Attendance rates from residence verifications</li>
            <li>Academic performance from course records</li>
            <li>Conduct status from disciplinary records</li>
            <li>Open compliance alerts</li>
            <li>Individual compliance status for each student</li>
            <li>Recommendations for non-compliant students</li>
          </ul>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/bursary/reports')} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BursaryReports;
