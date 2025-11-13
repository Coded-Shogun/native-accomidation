import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './BursaryManagement.css';
import BursaryProviders from './BursaryProviders';
import StudentBursaries from './StudentBursaries';
import ResidenceVerification from './ResidenceVerification';
import BursaryReports from './BursaryReports';

/**
 * BursaryManagement - Main management interface for bursary system
 * Features:
 * - Manage bursary providers (NSFAS, etc.)
 * - Assign and track student bursaries
 * - Record residence verifications
 * - Generate compliance reports
 * - View statistics and alerts
 */
function BursaryManagement() {
  return (
    <div className="bursary-management">
      <Routes>
        <Route path="/" element={<BursaryDashboard />} />
        <Route path="/providers/*" element={<BursaryProviders />} />
        <Route path="/student-bursaries/*" element={<StudentBursaries />} />
        <Route path="/verification/*" element={<ResidenceVerification />} />
        <Route path="/reports/*" element={<BursaryReports />} />
      </Routes>
    </div>
  );
}

/**
 * BursaryDashboard - Overview dashboard with stats and quick access
 */
function BursaryDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch multiple stats in parallel
      const [statsRes, alertsRes] = await Promise.all([
        fetch('/api/management/student-bursaries/stats/summary', { headers }),
        fetch('/api/management/bursary-compliance-alerts?status=open&limit=5', { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="bursary-dashboard">
      <div className="dashboard-header">
        <h2>Bursary Management Dashboard</h2>
        <p className="dashboard-subtitle">NSFAS-compliant tracking and reporting system</p>
      </div>

      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card stat-primary">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_bursaries || 0}</div>
              <div className="stat-label">Total Bursaries</div>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.active_bursaries || 0}</div>
              <div className="stat-label">Active Bursaries</div>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.suspended_bursaries || 0}</div>
              <div className="stat-label">Suspended</div>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_students || 0}</div>
              <div className="stat-label">Students</div>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_providers || 0}</div>
              <div className="stat-label">Providers</div>
            </div>
          </div>

          <div className="stat-card stat-amount">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">
                R {stats.total_amount ? (stats.total_amount / 1000000).toFixed(2) : 0}M
              </div>
              <div className="stat-label">Total Amount</div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button
              onClick={() => navigate('/bursary/student-bursaries/assign')}
              className="action-btn action-primary"
            >
              <span className="action-icon">➕</span>
              <span>Assign Bursary</span>
            </button>

            <button
              onClick={() => navigate('/bursary/verification')}
              className="action-btn action-success"
            >
              <span className="action-icon">✓</span>
              <span>Record Verification</span>
            </button>

            <button
              onClick={() => navigate('/bursary/reports/generate')}
              className="action-btn action-info"
            >
              <span className="action-icon">📊</span>
              <span>Generate Report</span>
            </button>

            <button
              onClick={() => navigate('/bursary/providers')}
              className="action-btn action-secondary"
            >
              <span className="action-icon">🏢</span>
              <span>Manage Providers</span>
            </button>
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Recent Compliance Alerts</h3>
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <p>✓ No open compliance alerts</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                  <div className="alert-header">
                    <span className={`alert-badge badge-${alert.severity}`}>
                      {alert.severity}
                    </span>
                    <span className="alert-type">{alert.alert_type}</span>
                  </div>
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-description">{alert.description}</div>
                  <div className="alert-footer">
                    <span className="alert-date">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() =>
                        navigate(`/bursary/student-bursaries/${alert.student_bursary_id}`)
                      }
                      className="alert-view-btn"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-navigation">
        <h3>Management Sections</h3>
        <div className="nav-cards">
          <Link to="/bursary/providers" className="nav-card">
            <div className="nav-card-icon">🏢</div>
            <h4>Bursary Providers</h4>
            <p>Manage NSFAS and other funding organizations</p>
          </Link>

          <Link to="/bursary/student-bursaries" className="nav-card">
            <div className="nav-card-icon">🎓</div>
            <h4>Student Bursaries</h4>
            <p>Assign and track student funding</p>
          </Link>

          <Link to="/bursary/verification" className="nav-card">
            <div className="nav-card-icon">✓</div>
            <h4>Residence Verification</h4>
            <p>Record and view student attendance</p>
          </Link>

          <Link to="/bursary/reports" className="nav-card">
            <div className="nav-card-icon">📊</div>
            <h4>Compliance Reports</h4>
            <p>Generate and view bursary reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BursaryManagement;
