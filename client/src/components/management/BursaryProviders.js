import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './BursaryProviders.css';

/**
 * BursaryProviders - Manage funding organizations (NSFAS, etc.)
 */
function BursaryProviders() {
  return (
    <div className="bursary-providers">
      <Routes>
        <Route path="/" element={<ProvidersList />} />
        <Route path="/new" element={<ProviderForm />} />
        <Route path="/:id" element={<ProviderDetails />} />
        <Route path="/:id/edit" element={<ProviderForm />} />
      </Routes>
    </div>
  );
}

/**
 * ProvidersList - List all bursary providers
 */
function ProvidersList() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/management/bursary-providers', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading providers...</div>;
  }

  return (
    <>
      <div className="providers-header">
        <h2>Bursary Providers</h2>
        <button onClick={() => navigate('/bursary/providers/new')} className="btn btn-primary">
          + Add Provider
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="no-providers">
          <p>No bursary providers configured</p>
          <button onClick={() => navigate('/bursary/providers/new')} className="btn btn-primary">
            Add Your First Provider
          </button>
        </div>
      ) : (
        <div className="providers-grid">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="provider-card"
              onClick={() => navigate(`/bursary/providers/${provider.id}`)}
            >
              <div className="provider-header">
                <div className="provider-icon">
                  {provider.type === 'government' && '🏛️'}
                  {provider.type === 'corporate' && '🏢'}
                  {provider.type === 'ngo' && '🤝'}
                  {provider.type === 'university' && '🎓'}
                  {provider.type === 'private' && '👤'}
                  {provider.type === 'other' && '📋'}
                </div>
                <div className="provider-info">
                  <h3>{provider.name}</h3>
                  <span className="provider-type">{provider.type}</span>
                </div>
                {!provider.is_active && <span className="badge badge-inactive">Inactive</span>}
              </div>

              <div className="provider-details">
                {provider.contact_person && (
                  <div className="detail-row">
                    <span className="label">Contact:</span>
                    <span className="value">{provider.contact_person}</span>
                  </div>
                )}
                {provider.contact_email && (
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{provider.contact_email}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Reporting:</span>
                  <span className="value">{provider.reporting_frequency}</span>
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
 * ProviderDetails - View provider details and requirements
 */
function ProviderDetails() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const fetchProvider = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/management/bursary-providers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProvider(data);
      }
    } catch (err) {
      console.error('Error fetching provider:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading provider...</div>;
  }

  if (!provider) {
    return <div className="error">Provider not found</div>;
  }

  return (
    <div className="provider-details-page">
      <div className="details-header">
        <button onClick={() => navigate('/bursary/providers')} className="btn btn-outline">
          ← Back to Providers
        </button>
        <button
          onClick={() => navigate(`/bursary/providers/${id}/edit`)}
          className="btn btn-primary"
        >
          Edit Provider
        </button>
      </div>

      <div className="provider-info-card">
        <div className="card-header">
          <div className="provider-icon-large">
            {provider.type === 'government' && '🏛️'}
            {provider.type === 'corporate' && '🏢'}
            {provider.type === 'ngo' && '🤝'}
            {provider.type === 'university' && '🎓'}
            {provider.type === 'private' && '👤'}
          </div>
          <div>
            <h2>{provider.name}</h2>
            <span className="provider-type-badge">{provider.type}</span>
            {!provider.is_active && <span className="badge badge-inactive">Inactive</span>}
          </div>
        </div>

        <div className="card-content">
          <div className="info-section">
            <h3>Contact Information</h3>
            <div className="info-grid">
              {provider.contact_person && (
                <div className="info-item">
                  <span className="label">Contact Person:</span>
                  <span className="value">{provider.contact_person}</span>
                </div>
              )}
              {provider.contact_email && (
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{provider.contact_email}</span>
                </div>
              )}
              {provider.contact_phone && (
                <div className="info-item">
                  <span className="label">Phone:</span>
                  <span className="value">{provider.contact_phone}</span>
                </div>
              )}
              <div className="info-item">
                <span className="label">Reporting Frequency:</span>
                <span className="value">{provider.reporting_frequency}</span>
              </div>
            </div>
          </div>

          {provider.stats && (
            <div className="info-section">
              <h3>Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{provider.stats.total_students || 0}</div>
                  <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{provider.stats.active_students || 0}</div>
                  <div className="stat-label">Active Students</div>
                </div>
              </div>
            </div>
          )}

          {provider.requirements && provider.requirements.length > 0 && (
            <div className="info-section">
              <h3>Requirements</h3>
              <div className="requirements-list">
                {provider.requirements.map((req) => (
                  <div key={req.id} className="requirement-item">
                    <div className="requirement-header">
                      <span className="requirement-name">{req.requirement_name}</span>
                      <span className={`badge ${req.is_mandatory ? 'badge-danger' : 'badge-info'}`}>
                        {req.is_mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </div>
                    <div className="requirement-details">
                      <span className="requirement-type">{req.requirement_type}</span>
                      <span className="requirement-frequency">{req.frequency}</span>
                      {req.threshold_value && (
                        <span className="requirement-threshold">
                          Threshold: {req.threshold_value}
                        </span>
                      )}
                    </div>
                    {req.description && (
                      <p className="requirement-description">{req.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="provider-actions">
        <button
          onClick={() => navigate(`/bursary/student-bursaries?provider=${id}`)}
          className="btn btn-outline"
        >
          View Students with this Bursary
        </button>
        <button
          onClick={() => navigate(`/bursary/reports?provider=${id}`)}
          className="btn btn-outline"
        >
          View Reports
        </button>
      </div>
    </div>
  );
}

/**
 * ProviderForm - Create or edit provider
 */
function ProviderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'government',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    reporting_frequency: 'monthly',
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  const fetchProvider = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/management/bursary-providers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          type: data.type,
          contact_person: data.contact_person || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          reporting_frequency: data.reporting_frequency,
          is_active: data.is_active === 1,
        });
      }
    } catch (err) {
      console.error('Error fetching provider:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = id
        ? `/api/management/bursary-providers/${id}`
        : '/api/management/bursary-providers';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(id ? 'Provider updated successfully' : 'Provider created successfully');
        navigate('/bursary/providers');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save provider');
      }
    } catch (err) {
      alert('Error saving provider: ' + err.message);
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
    <div className="provider-form-page">
      <div className="form-header">
        <h2>{id ? 'Edit Provider' : 'Add New Provider'}</h2>
        <button onClick={() => navigate('/bursary/providers')} className="btn btn-outline">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="provider-form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label htmlFor="name">
              Provider Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., NSFAS"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">
                Provider Type <span className="required">*</span>
              </label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} required>
                <option value="government">Government</option>
                <option value="corporate">Corporate</option>
                <option value="ngo">NGO</option>
                <option value="university">University</option>
                <option value="private">Private</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reporting_frequency">
                Reporting Frequency <span className="required">*</span>
              </label>
              <select
                id="reporting_frequency"
                name="reporting_frequency"
                value={formData.reporting_frequency}
                onChange={handleChange}
                required
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semester">Semester</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Information</h3>

          <div className="form-group">
            <label htmlFor="contact_person">Contact Person</label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="Full name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_email">Contact Email</label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_phone">Contact Phone</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="+27 12 345 6789"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Provider is active
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/bursary/providers')} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : id ? 'Update Provider' : 'Create Provider'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BursaryProviders;
