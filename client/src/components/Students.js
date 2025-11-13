import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_number: '',
    first_name: '',
    last_name: '',
    id_number: '',
    email: '',
    phone: '',
    nsfas_beneficiary: false,
    nsfas_reference: '',
    institution: '',
    campus: '',
    distance_from_campus_km: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/students', formData);
      setShowForm(false);
      setFormData({
        student_number: '',
        first_name: '',
        last_name: '',
        id_number: '',
        email: '',
        phone: '',
        nsfas_beneficiary: false,
        nsfas_reference: '',
        institution: '',
        campus: '',
        distance_from_campus_km: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
      });
      fetchStudents();
      alert('Student added successfully!');
    } catch (err) {
      alert('Error adding student: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await axios.delete(`/api/students/${id}`);
      fetchStudents();
      alert('Student deleted successfully!');
    } catch (err) {
      alert('Error deleting student: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="loading">Loading students...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Student Management</h2>
        <p>Manage student accounts and NSFAS eligibility</p>
      </div>

      <div className="action-bar">
        <div className="search-box">
          <input type="text" placeholder="Search students..." />
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Student'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="card-header">Add New Student</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Student Number *</label>
                <input
                  type="text"
                  required
                  value={formData.student_number}
                  onChange={(e) => setFormData({...formData, student_number: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>ID Number *</label>
                <input
                  type="text"
                  required
                  value={formData.id_number}
                  onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Institution *</label>
                <input
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({...formData, institution: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Campus *</label>
                <input
                  type="text"
                  required
                  value={formData.campus}
                  onChange={(e) => setFormData({...formData, campus: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Distance from Campus (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.distance_from_campus_km}
                  onChange={(e) => setFormData({...formData, distance_from_campus_km: e.target.value})}
                />
                <small style={{color: '#6b7280', fontSize: '12px'}}>
                  Must be ≥20km for NSFAS accommodation eligibility
                </small>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.nsfas_beneficiary}
                    onChange={(e) => setFormData({...formData, nsfas_beneficiary: e.target.checked})}
                    style={{width: 'auto', marginRight: '8px'}}
                  />
                  NSFAS Beneficiary
                </label>
              </div>

              {formData.nsfas_beneficiary && (
                <div className="form-group">
                  <label>NSFAS Reference Number</label>
                  <input
                    type="text"
                    value={formData.nsfas_reference}
                    onChange={(e) => setFormData({...formData, nsfas_reference: e.target.value})}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                />
              </div>
            </div>

            <div style={{marginTop: '20px'}}>
              <button type="submit" className="btn btn-primary">Add Student</button>
              <button type="button" className="btn btn-outline" style={{marginLeft: '10px'}} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-header">All Students ({students.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student Number</th>
                <th>Name</th>
                <th>Email</th>
                <th>Institution</th>
                <th>NSFAS</th>
                <th>Eligible</th>
                <th>Distance (km)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.student_number}</td>
                  <td>{student.first_name} {student.last_name}</td>
                  <td>{student.email}</td>
                  <td>{student.institution}</td>
                  <td>
                    <span className={`badge ${student.nsfas_beneficiary ? 'badge-success' : 'badge-info'}`}>
                      {student.nsfas_beneficiary ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${student.eligible_for_accommodation ? 'badge-success' : 'badge-warning'}`}>
                      {student.eligible_for_accommodation ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </td>
                  <td>{student.distance_from_campus_km}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{padding: '6px 12px', fontSize: '12px'}}
                      onClick={() => handleDelete(student.id)}
                    >
                      Delete
                    </button>
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

export default Students;
