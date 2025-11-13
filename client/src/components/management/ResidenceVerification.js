import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResidenceVerification.css';

/**
 * ResidenceVerification - Record and view student residence verifications
 * Used for tracking NSFAS attendance requirements
 */
function ResidenceVerification() {
  const [verifications, setVerifications] = useState([]);
  const [properties, setProperties] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    property_id: '',
  });

  useEffect(() => {
    fetchVerifications();
    fetchProperties();
    fetchStudents();
  }, []);

  const fetchVerifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();

      if (filters.date_from) queryParams.append('date_from', filters.date_from);
      if (filters.date_to) queryParams.append('date_to', filters.date_to);
      if (filters.property_id) queryParams.append('property_id', filters.property_id);

      const response = await fetch(`/api/management/residence-verification?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVerifications(data);
      }
    } catch (err) {
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/properties', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
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

  if (loading) {
    return <div className="loading">Loading verifications...</div>;
  }

  return (
    <div className="residence-verification">
      <div className="verification-header">
        <h2>Residence Verification</h2>
        <div className="header-buttons">
          <button onClick={() => setShowBulkForm(true)} className="btn btn-outline">
            Bulk Verify
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + Record Verification
          </button>
        </div>
      </div>

      <div className="verification-filters">
        <div className="filter-group">
          <label>Property:</label>
          <select
            value={filters.property_id}
            onChange={(e) => setFilters({ ...filters, property_id: e.target.value })}
          >
            <option value="">All Properties</option>
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>From:</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>To:</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          />
        </div>

        <button onClick={fetchVerifications} className="btn btn-primary">
          Apply Filters
        </button>
      </div>

      {verifications.length === 0 ? (
        <div className="no-verifications">
          <p>No verifications found</p>
        </div>
      ) : (
        <div className="verifications-table-container">
          <table className="verifications-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Student Number</th>
                <th>Property</th>
                <th>Type</th>
                <th>Method</th>
                <th>Present</th>
                <th>Verified By</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((verification) => (
                <tr key={verification.id}>
                  <td>{new Date(verification.verification_date).toLocaleDateString()}</td>
                  <td>
                    {verification.first_name} {verification.last_name}
                  </td>
                  <td>{verification.student_number}</td>
                  <td>{verification.property_name}</td>
                  <td className="type-cell">{verification.verification_type}</td>
                  <td className="method-cell">{verification.verification_method}</td>
                  <td>
                    <span
                      className={`presence-badge ${
                        verification.is_present ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {verification.is_present ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td>{verification.verified_by_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <VerificationForm
          students={students}
          properties={properties}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchVerifications();
          }}
        />
      )}

      {showBulkForm && (
        <BulkVerificationForm
          students={students}
          properties={properties}
          onClose={() => setShowBulkForm(false)}
          onSuccess={() => {
            setShowBulkForm(false);
            fetchVerifications();
          }}
        />
      )}
    </div>
  );
}

/**
 * VerificationForm - Form to record single verification
 */
function VerificationForm({ students, properties, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    property_id: '',
    verification_date: new Date().toISOString().split('T')[0],
    verification_type: 'weekly',
    verification_method: 'physical',
    is_present: true,
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/management/residence-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Verification recorded successfully');
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to record verification');
      }
    } catch (err) {
      alert('Error recording verification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h3>Record Residence Verification</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
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
                <option value="">Select student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_number} - {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="property_id">
                Property <span className="required">*</span>
              </label>
              <select
                id="property_id"
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                required
              >
                <option value="">Select property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="verification_date">
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="verification_date"
                name="verification_date"
                value={formData.verification_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="verification_type">
                Type <span className="required">*</span>
              </label>
              <select
                id="verification_type"
                name="verification_type"
                value={formData.verification_type}
                onChange={handleChange}
                required
              >
                <option value="checkin">Check-in</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="random">Random</option>
                <option value="audit">Audit</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="verification_method">
                Method <span className="required">*</span>
              </label>
              <select
                id="verification_method"
                name="verification_method"
                value={formData.verification_method}
                onChange={handleChange}
                required
              >
                <option value="physical">Physical</option>
                <option value="biometric">Biometric</option>
                <option value="access_log">Access Log</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_present"
                checked={formData.is_present}
                onChange={handleChange}
              />
              Student was present
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes or observations..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Recording...' : 'Record Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * BulkVerificationForm - Form to verify multiple students at once
 */
function BulkVerificationForm({ students, properties, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formData, setFormData] = useState({
    property_id: '',
    verification_date: new Date().toISOString().split('T')[0],
    verification_type: 'checkin',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/management/residence-verification/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          student_ids: selectedStudents,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Bulk verification completed!\n${data.success_count} of ${data.total_count} students verified successfully`
        );
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to record bulk verification');
      }
    } catch (err) {
      alert('Error recording bulk verification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAll = () => {
    setSelectedStudents(students.map((s) => s.id));
  };

  const clearAll = () => {
    setSelectedStudents([]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h3>Bulk Residence Verification</h3>
        <p className="modal-subtitle">Verify multiple students at once (e.g., from access logs)</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="property_id">
                Property <span className="required">*</span>
              </label>
              <select
                id="property_id"
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                required
              >
                <option value="">Select property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="verification_date">
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="verification_date"
                name="verification_date"
                value={formData.verification_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="verification_type">
                Type <span className="required">*</span>
              </label>
              <select
                id="verification_type"
                name="verification_type"
                value={formData.verification_type}
                onChange={handleChange}
                required
              >
                <option value="checkin">Check-in</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div className="students-selection-header">
              <label>
                Select Students <span className="required">*</span>
              </label>
              <div className="selection-actions">
                <button type="button" onClick={selectAll} className="btn btn-small btn-outline">
                  Select All
                </button>
                <button type="button" onClick={clearAll} className="btn btn-small btn-outline">
                  Clear All
                </button>
                <span className="selection-count">
                  {selectedStudents.length} of {students.length} selected
                </span>
              </div>
            </div>
            <div className="students-selection-list">
              {students.map((student) => (
                <div key={student.id} className="student-checkbox-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    <span className="student-number">{student.student_number}</span>
                    <span className="student-name">
                      {student.first_name} {student.last_name}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Verifying...' : `Verify ${selectedStudents.length} Students`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResidenceVerification;
