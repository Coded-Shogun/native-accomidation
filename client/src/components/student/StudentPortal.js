import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import './StudentPortal.css';
import StudentNotices from './StudentNotices';
import StudentLaundry from './StudentLaundry';
import StudentVisitors from './StudentVisitors';
import StudentComplaints from './StudentComplaints';
import StudentKiosk from './StudentKiosk';
import StudentWiFi from './StudentWiFi';
import StudentDeliveries from './StudentDeliveries';

/**
 * StudentPortal - Main layout for student-side portal
 * Provides access to all student features:
 * - Digital common area
 * - Kiosk/shop
 * - Laundry status
 * - Notice boards
 * - WiFi credentials
 * - Complaints
 * - Visitor registration
 */
function StudentPortal() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication and load student profile
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchStudentProfile();
  }, [navigate]);

  const fetchStudentProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudent(data);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="student-portal loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="student-portal">
      <nav className="student-navbar">
        <div className="student-navbar-brand">
          <h1>Student Portal</h1>
          {student && (
            <p className="student-welcome">
              Welcome, {student.first_name} {student.last_name}
            </p>
          )}
        </div>
        <div className="student-navbar-links">
          <Link to="/student">
            <i className="icon-home"></i> Dashboard
          </Link>
          <Link to="/student/notices">
            <i className="icon-notice"></i> Notices
          </Link>
          <Link to="/student/laundry">
            <i className="icon-laundry"></i> Laundry
          </Link>
          <Link to="/student/kiosk">
            <i className="icon-shop"></i> Kiosk
          </Link>
          <Link to="/student/deliveries">
            <i className="icon-package"></i> Deliveries
          </Link>
          <Link to="/student/visitors">
            <i className="icon-visitor"></i> Visitors
          </Link>
          <Link to="/student/complaints">
            <i className="icon-feedback"></i> Feedback
          </Link>
          <Link to="/student/wifi">
            <i className="icon-wifi"></i> WiFi
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <main className="student-main-content">
        <Routes>
          <Route path="/" element={<StudentDashboard student={student} />} />
          <Route path="/notices" element={<StudentNotices />} />
          <Route path="/laundry" element={<StudentLaundry />} />
          <Route path="/visitors" element={<StudentVisitors />} />
          <Route path="/complaints" element={<StudentComplaints />} />
          <Route path="/kiosk/*" element={<StudentKiosk />} />
          <Route path="/wifi" element={<StudentWiFi />} />
          <Route path="/deliveries" element={<StudentDeliveries />} />
        </Routes>
      </main>

      <footer className="student-footer">
        <p>&copy; 2025 Student Accommodation Portal | ISO 27001 & SOC 2 Compliant</p>
      </footer>
    </div>
  );
}

/**
 * StudentDashboard - Quick access dashboard with overview cards
 */
function StudentDashboard({ student }) {
  const [stats, setStats] = useState({
    newNotices: 0,
    availableMachines: 0,
    pendingDeliveries: 0,
    activeComplaints: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stats from multiple endpoints
      const [noticesRes, laundryRes, deliveriesRes, complaintsRes] = await Promise.all([
        fetch('/api/student/notices?limit=5', { headers }),
        fetch('/api/student/laundry/machines', { headers }),
        fetch('/api/student/deliveries?status=ready_for_pickup', { headers }),
        fetch('/api/student/complaints?status=submitted', { headers }),
      ]);

      const notices = noticesRes.ok ? await noticesRes.json() : [];
      const machines = laundryRes.ok ? await laundryRes.json() : [];
      const deliveries = deliveriesRes.ok ? await deliveriesRes.json() : [];
      const complaints = complaintsRes.ok ? await complaintsRes.json() : [];

      setStats({
        newNotices: notices.filter((n) => {
          const posted = new Date(n.posted_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return posted > dayAgo;
        }).length,
        availableMachines: machines.filter((m) => m.status === 'available').length,
        pendingDeliveries: deliveries.length,
        activeComplaints: complaints.length,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div className="student-dashboard">
      <h2>Dashboard</h2>

      {student && (
        <div className="student-info-card">
          <h3>My Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Student Number:</span>
              <span className="value">{student.student_number}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{student.email}</span>
            </div>
            <div className="info-item">
              <span className="label">Phone:</span>
              <span className="value">{student.phone_number}</span>
            </div>
            {student.nsfas_beneficiary && (
              <div className="info-item">
                <span className="label">NSFAS Status:</span>
                <span className="value badge-success">Active Beneficiary</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-cards">
        <Link to="/student/notices" className="dashboard-card card-notices">
          <div className="card-icon">📢</div>
          <h3>Notice Board</h3>
          <p className="card-stat">{stats.newNotices} new</p>
          <p className="card-description">View announcements and updates</p>
        </Link>

        <Link to="/student/laundry" className="dashboard-card card-laundry">
          <div className="card-icon">🧺</div>
          <h3>Laundry Status</h3>
          <p className="card-stat">{stats.availableMachines} available</p>
          <p className="card-description">Check machine availability</p>
        </Link>

        <Link to="/student/deliveries" className="dashboard-card card-deliveries">
          <div className="card-icon">📦</div>
          <h3>My Deliveries</h3>
          <p className="card-stat">{stats.pendingDeliveries} ready</p>
          <p className="card-description">Track your packages</p>
        </Link>

        <Link to="/student/kiosk" className="dashboard-card card-kiosk">
          <div className="card-icon">🏪</div>
          <h3>Kiosk Shop</h3>
          <p className="card-description">Browse available items</p>
        </Link>

        <Link to="/student/visitors" className="dashboard-card card-visitors">
          <div className="card-icon">👥</div>
          <h3>Register Visitor</h3>
          <p className="card-description">Register guests</p>
        </Link>

        <Link to="/student/wifi" className="dashboard-card card-wifi">
          <div className="card-icon">📶</div>
          <h3>WiFi Access</h3>
          <p className="card-description">Get WiFi credentials</p>
        </Link>

        <Link to="/student/complaints" className="dashboard-card card-complaints">
          <div className="card-icon">💬</div>
          <h3>Feedback</h3>
          <p className="card-stat">{stats.activeComplaints} active</p>
          <p className="card-description">Submit complaints or feedback</p>
        </Link>
      </div>
    </div>
  );
}

export default StudentPortal;
