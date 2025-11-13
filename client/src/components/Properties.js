import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    total_beds: '',
    available_beds: '',
    registration_status: 'pending'
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      setProperties(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/properties', formData);
      setShowForm(false);
      setFormData({
        name: '',
        address: '',
        total_beds: '',
        available_beds: '',
        registration_status: 'pending'
      });
      fetchProperties();
      alert('Property added successfully!');
    } catch (err) {
      alert('Error adding property: ' + (err.response?.data?.error || err.message));
    }
  };

  const initializeCompliance = async (propertyId) => {
    try {
      await axios.post(`/api/compliance/initialize/${propertyId}`);
      alert('Compliance checklist initialized successfully!');
    } catch (err) {
      alert('Error initializing compliance: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="loading">Loading properties...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Property Management</h2>
        <p>Manage accommodation properties and NSFAS accreditation</p>
      </div>

      <div className="action-bar">
        <div className="search-box">
          <input type="text" placeholder="Search properties..." />
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Property'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="card-header">Add New Property</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Property Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Total Beds *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.total_beds}
                  onChange={(e) => setFormData({...formData, total_beds: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Available Beds</label>
                <input
                  type="number"
                  min="0"
                  value={formData.available_beds}
                  onChange={(e) => setFormData({...formData, available_beds: e.target.value})}
                  placeholder="Defaults to total beds"
                />
              </div>

              <div className="form-group">
                <label>Registration Status</label>
                <select
                  value={formData.registration_status}
                  onChange={(e) => setFormData({...formData, registration_status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div style={{marginTop: '20px'}}>
              <button type="submit" className="btn btn-primary">Add Property</button>
              <button type="button" className="btn btn-outline" style={{marginLeft: '10px'}} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-2">
        {properties.map((property) => (
          <div key={property.id} className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px'}}>
              <div>
                <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '4px'}}>{property.name}</h3>
                <p style={{color: '#6b7280', fontSize: '14px'}}>{property.address}</p>
              </div>
              <span className={`badge ${property.nsfas_accredited ? 'badge-success' : 'badge-warning'}`}>
                {property.nsfas_accredited ? 'NSFAS Accredited' : 'Not Accredited'}
              </span>
            </div>

            <div style={{display: 'grid', gap: '12px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#6b7280'}}>Total Beds</span>
                <strong>{property.total_beds}</strong>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#6b7280'}}>Available Beds</span>
                <strong>{property.available_beds}</strong>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#6b7280'}}>Occupancy</span>
                <strong>
                  {property.total_beds > 0
                    ? Math.round(((property.total_beds - property.available_beds) / property.total_beds) * 100)
                    : 0}%
                </strong>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#6b7280'}}>Registration Status</span>
                <span className={`badge ${
                  property.registration_status === 'approved' ? 'badge-success' :
                  property.registration_status === 'rejected' ? 'badge-danger' :
                  'badge-warning'
                }`}>
                  {property.registration_status}
                </span>
              </div>
            </div>

            <div style={{display: 'flex', gap: '8px'}}>
              <button
                className="btn btn-primary"
                style={{flex: 1, padding: '8px', fontSize: '14px'}}
                onClick={() => initializeCompliance(property.id)}
              >
                Initialize Compliance
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Properties;
