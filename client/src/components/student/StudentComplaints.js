import React, { useState, useEffect } from 'react';
import './StudentComplaints.css';

/**
 * StudentComplaints - Complaint and feedback submission system
 * Features:
 * - Submit complaints with severity levels
 * - Anonymous complaint option
 * - Track complaint status
 * - Add comments to existing complaints
 * - Filter by status and category
 */
function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [formData, setFormData] = useState({
    category: 'accommodation',
    subject: '',
    description: '',
    severity: 'medium',
    is_anonymous: false,
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/complaints', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Complaint submitted successfully');
        setShowForm(false);
        setFormData({
          category: 'accommodation',
          subject: '',
          description: '',
          severity: 'medium',
          is_anonymous: false,
        });
        await fetchComplaints();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit complaint');
      }
    } catch (err) {
      alert('Error submitting complaint: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      submitted: 'badge-info',
      under_review: 'badge-warning',
      in_progress: 'badge-primary',
      resolved: 'badge-success',
      closed: 'badge-secondary',
    };
    return badges[status] || 'badge-secondary';
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: 'badge-danger',
      high: 'badge-warning',
      medium: 'badge-info',
      low: 'badge-secondary',
    };
    return badges[severity] || 'badge-secondary';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      accommodation: '🏠',
      maintenance: '🔧',
      security: '🔒',
      noise: '🔊',
      cleanliness: '🧹',
      staff: '👥',
      facilities: '🏢',
      other: '📝',
    };
    return icons[category] || '📝';
  };

  const filteredComplaints =
    filterStatus === 'all'
      ? complaints
      : complaints.filter((complaint) => complaint.status === filterStatus);

  if (loading) {
    return <div className="loading">Loading complaints...</div>;
  }

  return (
    <div className="student-complaints">
      <div className="complaints-header">
        <h2>Feedback & Complaints</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Submit Feedback'}
        </button>
      </div>

      {showForm && (
        <div className="complaint-form-container">
          <form onSubmit={handleSubmit} className="complaint-form">
            <h3>Submit Feedback or Complaint</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="accommodation">Accommodation</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security</option>
                  <option value="noise">Noise</option>
                  <option value="cleanliness">Cleanliness</option>
                  <option value="staff">Staff</option>
                  <option value="facilities">Facilities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="severity">
                  Severity <span className="required">*</span>
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">
                Subject <span className="required">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder="Brief description of the issue"
                maxLength="200"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="6"
                placeholder="Provide detailed information about your complaint or feedback"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_anonymous"
                  checked={formData.is_anonymous}
                  onChange={handleInputChange}
                />
                Submit anonymously (your identity will not be shared with property management)
              </label>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="complaints-filters">
        <button
          className={filterStatus === 'all' ? 'active' : ''}
          onClick={() => setFilterStatus('all')}
        >
          All
        </button>
        <button
          className={filterStatus === 'submitted' ? 'active' : ''}
          onClick={() => setFilterStatus('submitted')}
        >
          Submitted
        </button>
        <button
          className={filterStatus === 'under_review' ? 'active' : ''}
          onClick={() => setFilterStatus('under_review')}
        >
          Under Review
        </button>
        <button
          className={filterStatus === 'in_progress' ? 'active' : ''}
          onClick={() => setFilterStatus('in_progress')}
        >
          In Progress
        </button>
        <button
          className={filterStatus === 'resolved' ? 'active' : ''}
          onClick={() => setFilterStatus('resolved')}
        >
          Resolved
        </button>
      </div>

      <div className="complaints-list">
        {filteredComplaints.length === 0 ? (
          <div className="no-complaints">
            <p>No complaints to display</p>
            <p className="help-text">Click "Submit Feedback" to report an issue</p>
          </div>
        ) : (
          <div className="complaints-grid">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="complaint-card"
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div className="complaint-header">
                  <div className="complaint-icon">{getCategoryIcon(complaint.category)}</div>
                  <div className="complaint-info">
                    <h4>{complaint.subject}</h4>
                    <div className="complaint-badges">
                      <span className={`badge ${getStatusBadge(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                      <span className={`badge ${getSeverityBadge(complaint.severity)}`}>
                        {complaint.severity}
                      </span>
                      <span className="badge badge-category">{complaint.category}</span>
                    </div>
                  </div>
                </div>

                <div className="complaint-preview">
                  {complaint.description.substring(0, 100)}
                  {complaint.description.length > 100 ? '...' : ''}
                </div>

                <div className="complaint-footer">
                  <span className="complaint-date">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </span>
                  {complaint.assigned_to_name && (
                    <span className="complaint-assigned">
                      Assigned to: {complaint.assigned_to_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedComplaint && (
        <div className="complaint-modal" onClick={() => setSelectedComplaint(null)}>
          <div className="complaint-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedComplaint(null)}>
              ×
            </button>
            <div className="complaint-detail">
              <div className="complaint-detail-header">
                <div className="complaint-icon-large">
                  {getCategoryIcon(selectedComplaint.category)}
                </div>
                <div>
                  <h2>{selectedComplaint.subject}</h2>
                  <div className="complaint-detail-badges">
                    <span className={`badge ${getStatusBadge(selectedComplaint.status)}`}>
                      {selectedComplaint.status.replace('_', ' ')}
                    </span>
                    <span className={`badge ${getSeverityBadge(selectedComplaint.severity)}`}>
                      {selectedComplaint.severity}
                    </span>
                    <span className="badge badge-category">{selectedComplaint.category}</span>
                  </div>
                </div>
              </div>

              <div className="complaint-detail-content">
                <h3>Description</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedComplaint.description}</p>
              </div>

              <div className="complaint-detail-meta">
                <div className="meta-row">
                  <span className="label">Submitted:</span>
                  <span className="value">
                    {new Date(selectedComplaint.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedComplaint.updated_at !== selectedComplaint.created_at && (
                  <div className="meta-row">
                    <span className="label">Last Updated:</span>
                    <span className="value">
                      {new Date(selectedComplaint.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedComplaint.assigned_to_name && (
                  <div className="meta-row">
                    <span className="label">Assigned To:</span>
                    <span className="value">{selectedComplaint.assigned_to_name}</span>
                  </div>
                )}
                {selectedComplaint.resolution_notes && (
                  <div className="resolution-notes">
                    <h3>Resolution Notes</h3>
                    <p>{selectedComplaint.resolution_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentComplaints;
