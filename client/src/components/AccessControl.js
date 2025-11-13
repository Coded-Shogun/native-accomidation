import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AccessControl() {
  const [logs, setLogs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    property_id: '',
    access_type: 'entry',
    access_method: 'manual'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, propsRes, studentsRes] = await Promise.all([
        axios.get('/api/access'),
        axios.get('/api/properties'),
        axios.get('/api/students')
      ]);
      setLogs(logsRes.data);
      setProperties(propsRes.data);
      setStudents(studentsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/access', formData);
      setShowForm(false);
      setFormData({
        student_id: '',
        property_id: '',
        access_type: 'entry',
        access_method: 'manual'
      });
      fetchData();
      alert('Access logged successfully!');
    } catch (err) {
      alert('Error logging access: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="loading">Loading access logs...</div>;

  const entries = logs.filter(l => l.access_type === 'entry');
  const exits = logs.filter(l => l.access_type === 'exit');

  return (
    <div>
      <div className="page-header">
        <h2>Access Control</h2>
        <p>Monitor and log student access to properties</p>
      </div>

      <div className="grid grid-3" style={{marginBottom: '24px'}}>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '8px'}}>
            {entries.length}
          </div>
          <div style={{color: '#6b7280', fontSize: '14px'}}>Total Entries</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{fontSize: '32px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px'}}>
            {exits.length}
          </div>
          <div style={{color: '#6b7280', fontSize: '14px'}}>Total Exits</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{fontSize: '32px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px'}}>
            {logs.length}
          </div>
          <div style={{color: '#6b7280', fontSize: '14px'}}>Total Access Events</div>
        </div>
      </div>

      <div className="action-bar">
        <h3>Access Log</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Log Access'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="card-header">Log Access Event</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Student *</label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.student_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Property *</label>
                <select
                  required
                  value={formData.property_id}
                  onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                >
                  <option value="">Select Property</option>
                  {properties.map(prop => (
                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Access Type *</label>
                <select
                  required
                  value={formData.access_type}
                  onChange={(e) => setFormData({...formData, access_type: e.target.value})}
                >
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              </div>

              <div className="form-group">
                <label>Access Method *</label>
                <select
                  required
                  value={formData.access_method}
                  onChange={(e) => setFormData({...formData, access_method: e.target.value})}
                >
                  <option value="manual">Manual</option>
                  <option value="key_card">Key Card</option>
                  <option value="pin">PIN</option>
                  <option value="biometric">Biometric</option>
                </select>
              </div>
            </div>

            <div style={{marginTop: '20px'}}>
              <button type="submit" className="btn btn-primary">Log Access</button>
              <button type="button" className="btn btn-outline" style={{marginLeft: '10px'}} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-header">Recent Access Events</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Student</th>
                <th>Student Number</th>
                <th>Property</th>
                <th>Access Type</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.first_name} {log.last_name}</td>
                  <td>{log.student_number}</td>
                  <td>{log.property_name}</td>
                  <td>
                    <span className={`badge ${log.access_type === 'entry' ? 'badge-success' : 'badge-info'}`}>
                      {log.access_type}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {log.access_method.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AccessControl;
