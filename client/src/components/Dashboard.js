import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard/overview');
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">Error: {error}</div>;
  if (!stats) return null;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>NSFAS Student Accommodation Management System</p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-4">
        <div className="stat-card" style={{background: 'linear-gradient(135deg, #2563eb, #3b82f6)'}}>
          <h3>Total Properties</h3>
          <div className="stat-value">{stats.properties.total_properties}</div>
          <div className="stat-label">
            {stats.properties.accredited_properties} NSFAS Accredited
          </div>
        </div>

        <div className="stat-card" style={{background: 'linear-gradient(135deg, #10b981, #34d399)'}}>
          <h3>Occupancy Rate</h3>
          <div className="stat-value">{stats.properties.occupancy_rate}%</div>
          <div className="stat-label">
            {stats.properties.occupied_beds} / {stats.properties.total_beds} beds
          </div>
        </div>

        <div className="stat-card" style={{background: 'linear-gradient(135deg, #f59e0b, #fbbf24)'}}>
          <h3>Active Students</h3>
          <div className="stat-value">{stats.students.total_students}</div>
          <div className="stat-label">
            {stats.students.nsfas_students} NSFAS Beneficiaries
          </div>
        </div>

        <div className="stat-card" style={{background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)'}}>
          <h3>Active Leases</h3>
          <div className="stat-value">{stats.leases.active_leases}</div>
          <div className="stat-label">
            {stats.leases.total_leases} total leases
          </div>
        </div>
      </div>

      {/* Maintenance & Compliance */}
      <div className="grid grid-2" style={{marginTop: '20px'}}>
        <div className="card">
          <h3 className="card-header">Maintenance Status</h3>
          <div style={{display: 'grid', gap: '12px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Open Requests</span>
              <span className="badge badge-warning">{stats.maintenance.open_requests}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>In Progress</span>
              <span className="badge badge-info">{stats.maintenance.in_progress_requests}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Urgent Issues</span>
              <span className="badge badge-danger">{stats.maintenance.urgent_requests}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Washing Machine Issues</span>
              <span className="badge badge-warning">{stats.maintenance.washing_machine_issues}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-header">NSFAS Compliance</h3>
          <div style={{marginBottom: '16px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span>Compliance Rate</span>
              <strong>{stats.compliance.compliance_rate}%</strong>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${stats.compliance.compliance_rate}%`,
                height: '100%',
                backgroundColor: stats.compliance.compliance_rate >= 80 ? '#10b981' : '#f59e0b',
                transition: 'width 0.3s'
              }}></div>
            </div>
          </div>
          <div style={{display: 'grid', gap: '12px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Compliant</span>
              <span className="badge badge-success">{stats.compliance.compliant}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Non-Compliant</span>
              <span className="badge badge-danger">{stats.compliance.non_compliant}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Pending Review</span>
              <span className="badge badge-warning">{stats.compliance.pending_review}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{marginTop: '20px'}}>
        <h3 className="card-header">Recent Access Activity</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Student</th>
                <th>Property</th>
                <th>Type</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_activity.access_logs.map((log, index) => (
                <tr key={index}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.first_name} {log.last_name}</td>
                  <td>{log.property_name}</td>
                  <td>
                    <span className={`badge ${log.access_type === 'entry' ? 'badge-success' : 'badge-info'}`}>
                      {log.access_type}
                    </span>
                  </td>
                  <td>{log.access_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Lease Expirations */}
      {stats.recent_activity.upcoming_lease_expirations.length > 0 && (
        <div className="card" style={{marginTop: '20px'}}>
          <h3 className="card-header">Upcoming Lease Expirations (Next 30 Days)</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Property</th>
                  <th>Room</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.upcoming_lease_expirations.map((lease, index) => (
                  <tr key={index}>
                    <td>{lease.first_name} {lease.last_name}</td>
                    <td>{lease.property_name}</td>
                    <td>{lease.room_number}</td>
                    <td>
                      <span className="badge badge-warning">
                        {new Date(lease.end_date).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Properties Needing Attention */}
      {stats.recent_activity.properties_needing_attention.length > 0 && (
        <div className="card" style={{marginTop: '20px'}}>
          <h3 className="card-header">Properties Needing Attention</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>NSFAS Accredited</th>
                  <th>Open Maintenance</th>
                  <th>Urgent Issues</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.properties_needing_attention.map((property, index) => (
                  <tr key={index}>
                    <td>{property.name}</td>
                    <td>
                      <span className={`badge ${property.nsfas_accredited ? 'badge-success' : 'badge-warning'}`}>
                        {property.nsfas_accredited ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">{property.open_maintenance_requests}</span>
                    </td>
                    <td>
                      {property.urgent_issues > 0 && (
                        <span className="badge badge-danger">{property.urgent_issues}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
