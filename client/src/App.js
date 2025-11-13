import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import components
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Properties from './components/Properties';
import Maintenance from './components/Maintenance';
import Compliance from './components/Compliance';
import AccessControl from './components/AccessControl';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-brand">
            <h1>Student Accommodation Manager</h1>
            <p className="navbar-subtitle">NSFAS Compliant System</p>
          </div>
          <div className="navbar-links">
            <Link to="/">Dashboard</Link>
            <Link to="/properties">Properties</Link>
            <Link to="/students">Students</Link>
            <Link to="/maintenance">Maintenance</Link>
            <Link to="/compliance">NSFAS Compliance</Link>
            <Link to="/access">Access Control</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/access" element={<AccessControl />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2025 Student Accommodation Management System | Built for NSFAS Compliance</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
