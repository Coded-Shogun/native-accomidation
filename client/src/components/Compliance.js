import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Compliance() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [compliance, setCompliance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchComplianceData();
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      setProperties(response.data);
      if (response.data.length > 0) {
        setSelectedProperty(response.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setLoading(false);
    }
  };

  const fetchComplianceData = async () => {
    try {
      const [complianceRes, summaryRes] = await Promise.all([
        axios.get(`/api/compliance/property/${selectedProperty}`),
        axios.get(`/api/compliance/summary/${selectedProperty}`)
      ]);
      setCompliance(complianceRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Error fetching compliance data:', err);
    }
  };

  const updateCompliance = async (id, status) => {
    try {
      await axios.put(`/api/compliance/${id}`, {
        status,
        last_inspection_date: new Date().toISOString().split('T')[0]
      });
      fetchComplianceData();
      alert('Compliance status updated successfully!');
    } catch (err) {
      alert('Error updating compliance: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="loading">Loading compliance data...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>NSFAS Compliance Tracking</h2>
        <p>Monitor and manage NSFAS accreditation requirements</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label>Select Property</label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            style={{maxWidth: '400px'}}
          >
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>
                {prop.name} {prop.nsfas_accredited ? '(NSFAS Accredited)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-4" style={{marginBottom: '24px'}}>
            <div className="card" style={{textAlign: 'center'}}>
              <div style={{fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '8px'}}>
                {summary.overall_compliance_percentage}%
              </div>
              <div style={{color: '#6b7280', fontSize: '14px'}}>Overall Compliance</div>
            </div>
            <div className="card" style={{textAlign: 'center'}}>
              <div style={{fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '8px'}}>
                {summary.compliance_stats.compliant}
              </div>
              <div style={{color: '#6b7280', fontSize: '14px'}}>Compliant</div>
            </div>
            <div className="card" style={{textAlign: 'center'}}>
              <div style={{fontSize: '32px', fontWeight: '700', color: '#ef4444', marginBottom: '8px'}}>
                {summary.compliance_stats.non_compliant}
              </div>
              <div style={{color: '#6b7280', fontSize: '14px'}}>Non-Compliant</div>
            </div>
            <div className="card" style={{textAlign: 'center'}}>
              <div style={{fontSize: '32px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px'}}>
                {summary.compliance_stats.pending_review}
              </div>
              <div style={{color: '#6b7280', fontSize: '14px'}}>Pending Review</div>
            </div>
          </div>

          {/* Facility Compliance */}
          <div className="card">
            <h3 className="card-header">Facility Ratios (NSFAS Requirements)</h3>
            <div className="grid grid-2">
              <div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span>Sink Ratio (Max 1:4)</span>
                  <span className={`badge ${summary.facility_compliance.sink_compliant ? 'badge-success' : 'badge-danger'}`}>
                    1:{summary.facility_compliance.sink_ratio.toFixed(1)}
                  </span>
                </div>
                <p style={{fontSize: '12px', color: '#6b7280'}}>
                  {summary.facility_compliance.sink_compliant
                    ? 'Meets NSFAS requirement'
                    : 'Does not meet NSFAS requirement (1 sink per 4 residents)'}
                </p>
              </div>
              <div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span>Shower Ratio (Max 1:7)</span>
                  <span className={`badge ${summary.facility_compliance.shower_compliant ? 'badge-success' : 'badge-danger'}`}>
                    1:{summary.facility_compliance.shower_ratio.toFixed(1)}
                  </span>
                </div>
                <p style={{fontSize: '12px', color: '#6b7280'}}>
                  {summary.facility_compliance.shower_compliant
                    ? 'Meets NSFAS requirement'
                    : 'Does not meet NSFAS requirement (1 shower per 7 residents)'}
                </p>
              </div>
            </div>
          </div>

          {/* Non-Compliant Rooms */}
          {summary.non_compliant_rooms.length > 0 && (
            <div className="alert alert-warning">
              <strong>Warning:</strong> {summary.non_compliant_rooms.length} room(s) do not meet the minimum size requirement (8 sqm for single rooms):
              {summary.non_compliant_rooms.map(room => (
                <div key={room.room_number} style={{marginTop: '4px'}}>
                  Room {room.room_number}: {room.size_sqm} sqm
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Compliance Checklist */}
      {compliance && compliance.grouped && (
        <div>
          {Object.entries(compliance.grouped).map(([category, items]) => (
            <div key={category} className="card">
              <h3 className="card-header">{category}</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Requirement</th>
                      <th>Status</th>
                      <th>Last Inspection</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.requirement_description}</td>
                        <td>
                          <span className={`badge ${
                            item.status === 'compliant' ? 'badge-success' :
                            item.status === 'non_compliant' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          {item.last_inspection_date
                            ? new Date(item.last_inspection_date).toLocaleDateString()
                            : 'Not inspected'}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{padding: '6px 12px', fontSize: '12px', marginRight: '4px'}}
                            onClick={() => updateCompliance(item.id, 'compliant')}
                          >
                            Mark Compliant
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{padding: '6px 12px', fontSize: '12px'}}
                            onClick={() => updateCompliance(item.id, 'non_compliant')}
                          >
                            Mark Non-Compliant
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NSFAS Requirements Info */}
      <div className="card" style={{backgroundColor: '#eff6ff'}}>
        <h3 className="card-header">NSFAS 2025 Requirements Summary</h3>
        <ul style={{paddingLeft: '20px', lineHeight: '1.8'}}>
          <li>Annual accommodation cap: R45,000</li>
          <li>Single rooms must be larger than 8 square meters</li>
          <li>One sink per 4 residents</li>
          <li>One shower per 7 residents</li>
          <li>Students must live 20km+ from campus to qualify</li>
          <li>Three-year contract with annual reviews</li>
          <li>Compliance with health, safety, and security standards</li>
          <li>NSFAS can conduct unannounced inspections</li>
        </ul>
      </div>
    </div>
  );
}

export default Compliance;
