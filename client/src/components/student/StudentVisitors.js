import React, { useState, useEffect } from 'react';
import './StudentVisitors.css';

/**
 * StudentVisitors - Visitor/guest registration and management
 * Features:
 * - Register new visitors with access codes
 * - View visitor history
 * - Check visitor status (pending, approved, checked in/out)
 * - Cancel pending registrations
 */
function StudentVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_id_number: '',
    visitor_phone: '',
    visit_date: '',
    visit_time_start: '',
    visit_time_end: '',
    visit_purpose: '',
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/visitors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVisitors(data);
      }
    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/visitors', {
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
          `Visitor registered successfully!\nAccess Code: ${data.access_code}\nStatus: ${data.status}`
        );
        setShowForm(false);
        setFormData({
          visitor_name: '',
          visitor_id_number: '',
          visitor_phone: '',
          visit_date: '',
          visit_time_start: '',
          visit_time_end: '',
          visit_purpose: '',
        });
        await fetchVisitors();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to register visitor');
      }
    } catch (err) {
      alert('Error registering visitor: ' + err.message);
    }
  };

  const handleCancelVisitor = async (visitorId) => {
    if (!window.confirm('Are you sure you want to cancel this visitor registration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/visitors/${visitorId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Visitor registration cancelled');
        await fetchVisitors();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to cancel visitor');
      }
    } catch (err) {
      alert('Error cancelling visitor: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      checked_in: 'badge-info',
      checked_out: 'badge-secondary',
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading visitors...</div>;
  }

  return (
    <div className="student-visitors">
      <div className="visitors-header">
        <h2>Visitor Registration</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Register Visitor'}
        </button>
      </div>

      {showForm && (
        <div className="visitor-form-container">
          <form onSubmit={handleSubmit} className="visitor-form">
            <h3>Register New Visitor</h3>

            <div className="form-group">
              <label htmlFor="visitor_name">
                Visitor Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="visitor_name"
                name="visitor_name"
                value={formData.visitor_name}
                onChange={handleInputChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="visitor_id_number">
                ID Number <span className="required">*</span>
              </label>
              <input
                type="text"
                id="visitor_id_number"
                name="visitor_id_number"
                value={formData.visitor_id_number}
                onChange={handleInputChange}
                required
                placeholder="9801010000000"
                pattern="[0-9]{13}"
                title="13-digit ID number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="visitor_phone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="visitor_phone"
                name="visitor_phone"
                value={formData.visitor_phone}
                onChange={handleInputChange}
                required
                placeholder="0821234567"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="visit_date">
                  Visit Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="visit_date"
                  name="visit_date"
                  value={formData.visit_date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="visit_time_start">
                  Start Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  id="visit_time_start"
                  name="visit_time_start"
                  value={formData.visit_time_start}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="visit_time_end">End Time (Optional)</label>
                <input
                  type="time"
                  id="visit_time_end"
                  name="visit_time_end"
                  value={formData.visit_time_end}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="visit_purpose">Purpose of Visit (Optional)</label>
              <textarea
                id="visit_purpose"
                name="visit_purpose"
                value={formData.visit_purpose}
                onChange={handleInputChange}
                rows="3"
                placeholder="Family visit, study session, etc."
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Register Visitor
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="visitors-list">
        <h3>My Visitors</h3>

        {visitors.length === 0 ? (
          <div className="no-visitors">
            <p>No visitor registrations yet</p>
            <p className="help-text">Click "Register Visitor" to add a new guest</p>
          </div>
        ) : (
          <div className="visitors-grid">
            {visitors.map((visitor) => (
              <div key={visitor.id} className="visitor-card">
                <div className="visitor-header">
                  <div className="visitor-icon">👤</div>
                  <div className="visitor-info">
                    <h4>{visitor.visitor_name}</h4>
                    <span className={`badge ${getStatusBadge(visitor.status)}`}>
                      {visitor.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="visitor-details">
                  <div className="detail-row">
                    <span className="label">ID Number:</span>
                    <span className="value">{visitor.visitor_id_number}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span className="value">{visitor.visitor_phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Visit Date:</span>
                    <span className="value">
                      {new Date(visitor.visit_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">
                      {visitor.visit_time_start}
                      {visitor.visit_time_end && ` - ${visitor.visit_time_end}`}
                    </span>
                  </div>

                  {visitor.access_code && visitor.status === 'approved' && (
                    <div className="access-code">
                      <span className="label">Access Code:</span>
                      <span className="code">{visitor.access_code}</span>
                    </div>
                  )}

                  {visitor.visit_purpose && (
                    <div className="detail-row">
                      <span className="label">Purpose:</span>
                      <span className="value">{visitor.visit_purpose}</span>
                    </div>
                  )}

                  {visitor.check_in_time && (
                    <div className="detail-row">
                      <span className="label">Checked In:</span>
                      <span className="value">
                        {new Date(visitor.check_in_time).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {visitor.check_out_time && (
                    <div className="detail-row">
                      <span className="label">Checked Out:</span>
                      <span className="value">
                        {new Date(visitor.check_out_time).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {visitor.status === 'pending' && (
                  <div className="visitor-actions">
                    <button
                      onClick={() => handleCancelVisitor(visitor.id)}
                      className="btn btn-danger btn-small"
                    >
                      Cancel Registration
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentVisitors;
