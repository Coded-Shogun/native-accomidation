import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './StudentBursaries.css';

/**
 * StudentBursaries - Manage student funding assignments
 */
function StudentBursaries() {
  return (
    <div className="student-bursaries">
      <Routes>
        <Route path="/" element={<BursariesList />} />
        <Route path="/assign" element={<AssignBursaryForm />} />
        <Route path="/:id" element={<BursaryDetails />} />
      </Routes>
    </div>
  );
}

/**
 * BursariesList - List all student bursaries with filtering
 */
function BursariesList() {
  const [bursaries, setBursaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    bursary_provider_id: searchParams.get('provider') || '',
    academic_year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    fetchBursaries();
  }, [filters]);

  const fetchBursaries = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();

      if (filters.status) queryParams.append('status', filters.status);
      if (filters.bursary_provider_id) queryParams.append('bursary_provider_id', filters.bursary_provider_id);
      if (filters.academic_year) queryParams.append('academic_year', filters.academic_year);

      const response = await fetch(`/api/management/student-bursaries?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBursaries(data);
      }
    } catch (err) {
      console.error('Error fetching bursaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      active: 'badge-success',
      suspended: 'badge-danger',
      completed: 'badge-secondary',
      cancelled: 'badge-dark',
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading bursaries...</div>;
  }

  return (
    <>
      <div className="bursaries-header">
        <h2>Student Bursaries</h2>
        <button onClick={() => navigate('/bursary/student-bursaries/assign')} className="btn btn-primary">
          + Assign Bursary
        </button>
      </div>

      <div className="bursaries-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Academic Year:</label>
          <select
            value={filters.academic_year}
            onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

        <button onClick={fetchBursaries} className="btn btn-outline">
          Apply Filters
        </button>
      </div>

      {bursaries.length === 0 ? (
        <div className="no-bursaries">
          <p>No bursaries found matching your filters</p>
        </div>
      ) : (
        <div className="bursaries-table-container">
          <table className="bursaries-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student Number</th>
                <th>Provider</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bursaries.map((bursary) => (
                <tr key={bursary.id}>
                  <td>
                    {bursary.first_name} {bursary.last_name}
                  </td>
                  <td>{bursary.student_number}</td>
                  <td>{bursary.bursary_provider_name}</td>
                  <td className="reference-cell">{bursary.bursary_reference}</td>
                  <td className="amount-cell">
                    {bursary.currency} {bursary.amount.toLocaleString()}
                  </td>
                  <td>{bursary.academic_year}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(bursary.status)}`}>
                      {bursary.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/bursary/student-bursaries/${bursary.id}`)}
                      className="btn btn-small btn-outline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/**
 * BursaryDetails - View detailed bursary information
 */
function BursaryDetails() {
  const { id } = useParams();
  const [bursary, setBursary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBursary();
  }, [id]);

  const fetchBursary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/management/student-bursaries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBursary(data);
      }
    } catch (err) {
      console.error('Error fetching bursary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, reason) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/management/student-bursaries/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, reason }),
      });

      if (response.ok) {
        alert('Status updated successfully');
        setShowStatusModal(false);
        fetchBursary();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading bursary details...</div>;
  }

  if (!bursary) {
    return <div className="error">Bursary not found</div>;
  }

  return (
    <div className="bursary-details-page">
      <div className="details-header">
        <button onClick={() => navigate('/bursary/student-bursaries')} className="btn btn-outline">
          ← Back to List
        </button>
        <button onClick={() => setShowStatusModal(true)} className="btn btn-primary">
          Update Status
        </button>
      </div>

      <div className="bursary-info-card">
        <div className="card-header">
          <div>
            <h2>
              {bursary.first_name} {bursary.last_name}
            </h2>
            <p className="student-number">{bursary.student_number}</p>
          </div>
          <span className={`badge badge-large badge-${bursary.status}`}>{bursary.status}</span>
        </div>

        <div className="card-content">
          <div className="info-section">
            <h3>Bursary Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Provider:</span>
                <span className="value">{bursary.bursary_provider_name}</span>
              </div>
              <div className="info-item">
                <span className="label">Reference:</span>
                <span className="value">{bursary.bursary_reference}</span>
              </div>
              <div className="info-item">
                <span className="label">Amount:</span>
                <span className="value">
                  {bursary.currency} {bursary.amount.toLocaleString()}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Academic Year:</span>
                <span className="value">{bursary.academic_year}</span>
              </div>
              <div className="info-item">
                <span className="label">Start Date:</span>
                <span className="value">{new Date(bursary.start_date).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="label">End Date:</span>
                <span className="value">{new Date(bursary.end_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>Student Contact</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{bursary.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Phone:</span>
                <span className="value">{bursary.phone_number}</span>
              </div>
            </div>
          </div>

          {bursary.latest_residence_verification && (
            <div className="info-section">
              <h3>Latest Residence Verification</h3>
              <div className="verification-info">
                <div className="verification-item">
                  <span className="label">Date:</span>
                  <span className="value">
                    {new Date(
                      bursary.latest_residence_verification.verification_date
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="verification-item">
                  <span className="label">Present:</span>
                  <span
                    className={`value ${
                      bursary.latest_residence_verification.is_present
                        ? 'text-success'
                        : 'text-danger'
                    }`}
                  >
                    {bursary.latest_residence_verification.is_present ? 'Yes ✓' : 'No ✗'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {bursary.alerts && bursary.alerts.length > 0 && (
            <div className="info-section">
              <h3>Compliance Alerts</h3>
              <div className="alerts-list">
                {bursary.alerts.map((alert) => (
                  <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                    <div className="alert-header">
                      <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                      <span className="alert-date">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-description">{alert.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bursary.conduct_records && bursary.conduct_records.length > 0 && (
            <div className="info-section">
              <h3>Conduct Records</h3>
              <div className="conduct-list">
                {bursary.conduct_records.map((record) => (
                  <div key={record.id} className={`conduct-item conduct-${record.severity}`}>
                    <div className="conduct-header">
                      <span className="conduct-type">{record.incident_type}</span>
                      <span className={`badge badge-${record.severity}`}>{record.severity}</span>
                      <span className="conduct-date">
                        {new Date(record.incident_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="conduct-description">{record.description}</p>
                    {record.action_taken && (
                      <p className="conduct-action">Action: {record.action_taken}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showStatusModal && (
        <StatusUpdateModal
          currentStatus={bursary.status}
          onUpdate={handleStatusUpdate}
          onClose={() => setShowStatusModal(false)}
        />
      )}
    </div>
  );
}

/**
 * StatusUpdateModal - Modal for updating bursary status
 */
function StatusUpdateModal({ currentStatus, onUpdate, onClose }) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newStatus === currentStatus) {
      alert('Please select a different status');
      return;
    }
    onUpdate(newStatus, reason);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h3>Update Bursary Status</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Status:</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reason for Status Change:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="4"
              placeholder="Explain why the status is being changed..."
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * AssignBursaryForm - Form to assign bursary to student
 */
function AssignBursaryForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    student_id: '',
    bursary_provider_id: '',
    bursary_reference: '',
    amount: '',
    currency: 'ZAR',
    academic_year: new Date().getFullYear().toString(),
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchProviders();
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/management/student-bursaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        alert('Bursary assigned successfully');
        navigate('/bursary/student-bursaries');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to assign bursary');
      }
    } catch (err) {
      alert('Error assigning bursary: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="assign-bursary-page">
      <div className="form-header">
        <h2>Assign Bursary to Student</h2>
        <button onClick={() => navigate('/bursary/student-bursaries')} className="btn btn-outline">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="assign-bursary-form">
        <div className="form-section">
          <h3>Student Selection</h3>
          <div className="form-group">
            <label htmlFor="student_id">
              Student <span className="required">*</span>
            </label>
            <select
              id="student_id"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.student_number} - {student.first_name} {student.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Bursary Details</h3>

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
              <option value="">Select a provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} ({provider.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bursary_reference">
              Bursary Reference <span className="required">*</span>
            </label>
            <input
              type="text"
              id="bursary_reference"
              name="bursary_reference"
              value={formData.bursary_reference}
              onChange={handleChange}
              required
              placeholder="e.g., NSFAS-2025-123456"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">
                Amount <span className="required">*</span>
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="50000.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select id="currency" name="currency" value={formData.currency} onChange={handleChange}>
                <option value="ZAR">ZAR (South African Rand)</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Period</h3>

          <div className="form-group">
            <label htmlFor="academic_year">
              Academic Year <span className="required">*</span>
            </label>
            <input
              type="text"
              id="academic_year"
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              required
              placeholder="2025"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date">
                Start Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_date">
                End Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/bursary/student-bursaries')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Assigning...' : 'Assign Bursary'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StudentBursaries;
