import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    property_id: '',
    category: 'washing_machine',
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqResponse, propResponse] = await Promise.all([
        axios.get('/api/maintenance'),
        axios.get('/api/properties')
      ]);
      setRequests(reqResponse.data);
      setProperties(propResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/maintenance', formData);
      setShowForm(false);
      setFormData({
        property_id: '',
        category: 'washing_machine',
        title: '',
        description: '',
        priority: 'medium'
      });
      fetchData();
      alert('Maintenance request created successfully!');
    } catch (err) {
      alert('Error creating request: ' + (err.response?.data?.error || err.message));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/maintenance/${id}`, { status });
      fetchData();
      alert('Status updated successfully!');
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="loading">Loading maintenance requests...</div>;

  const openRequests = requests.filter(r => r.status === 'open');
  const inProgressRequests = requests.filter(r => r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const washingMachineRequests = requests.filter(r => r.category === 'washing_machine' && r.status !== 'completed');

  return (
    <div>
      <div className="page-header">
        <h2>Maintenance Management</h2>
        <p>Track and manage maintenance requests across all properties</p>
      </div>

      <div className="grid grid-4" style={{marginBottom: '24px'}}>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{fontSize: '32px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px'}}>
            {openRequests.length}
          </div>
          <div style={{color: '#6b7280', fontSize: '14px'}}>Open Requests</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{fontSize: '32px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px'}}>
            {inProgressRequests.length}
          </div>
          <div style={{color: '#6b7280', fontSize: '14px'}}>In Progress</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '8px'}}>
            {completedRequests.length}
          </div>
          <div style={{color: '#6b7280', fontSize: '14px'}}>Completed</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{fontSize: '32px', fontWeight: '700', color: '#ef4444', marginBottom: '8px'}}>
            {washingMachineRequests.length}
          </div>
          <div style={{color: '#6b7280', fontSize: '14px'}}>Washing Machine Issues</div>
        </div>
      </div>

      <div className="action-bar">
        <h3>All Maintenance Requests</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="card-header">Create Maintenance Request</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
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
                <label>Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="washing_machine">Washing Machine</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="security">Security</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Brief description of the issue"
                />
              </div>

              <div className="form-group">
                <label>Priority *</label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                required
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detailed description of the maintenance issue"
              />
            </div>

            <div style={{marginTop: '20px'}}>
              <button type="submit" className="btn btn-primary">Create Request</button>
              <button type="button" className="btn btn-outline" style={{marginLeft: '10px'}} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Property</th>
                <th>Category</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>#{request.id}</td>
                  <td>{request.property_name}</td>
                  <td>
                    <span className="badge badge-info">
                      {request.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{request.title}</td>
                  <td>
                    <span className={`badge ${
                      request.priority === 'urgent' ? 'badge-danger' :
                      request.priority === 'high' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {request.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      request.status === 'completed' ? 'badge-success' :
                      request.status === 'in_progress' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(request.reported_date).toLocaleDateString()}</td>
                  <td>
                    {request.status === 'open' && (
                      <button
                        className="btn btn-primary"
                        style={{padding: '6px 12px', fontSize: '12px', marginRight: '4px'}}
                        onClick={() => updateStatus(request.id, 'in_progress')}
                      >
                        Start
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        className="btn btn-secondary"
                        style={{padding: '6px 12px', fontSize: '12px'}}
                        onClick={() => updateStatus(request.id, 'completed')}
                      >
                        Complete
                      </button>
                    )}
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

export default Maintenance;
