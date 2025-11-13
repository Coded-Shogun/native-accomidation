import React, { useState, useEffect } from 'react';
import './StudentLaundry.css';

/**
 * StudentLaundry - Real-time laundry machine status and queue management
 * Features:
 * - View available/in-use machines
 * - Start and end machine cycles
 * - Join queue when machines are busy
 * - Real-time countdown timers
 */
function StudentLaundry() {
  const [machines, setMachines] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);

  useEffect(() => {
    fetchMachines();
    fetchQueue();

    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchMachines();
      fetchQueue();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/laundry/machines', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMachines(data);
        setError(null);
      } else {
        setError('Failed to load machine status');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/laundry/queue', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQueue(data);
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    }
  };

  const handleStartMachine = async (machineId, durationMinutes) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/laundry/machines/${machineId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration_minutes: durationMinutes }),
      });

      if (response.ok) {
        await fetchMachines();
        setSelectedMachine(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to start machine');
      }
    } catch (err) {
      alert('Error starting machine: ' + err.message);
    }
  };

  const handleEndMachine = async (machineId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/laundry/machines/${machineId}/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchMachines();
        await fetchQueue();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to end machine use');
      }
    } catch (err) {
      alert('Error ending machine: ' + err.message);
    }
  };

  const getMachineStatusBadge = (status) => {
    const badges = {
      available: 'badge-success',
      in_use: 'badge-warning',
      maintenance: 'badge-info',
      out_of_order: 'badge-danger',
    };
    return badges[status] || 'badge-secondary';
  };

  const getMachineIcon = (type) => {
    const icons = {
      washer: '🧺',
      dryer: '🌀',
      combo: '🧼',
    };
    return icons[type] || '🧺';
  };

  const formatTimeRemaining = (minutes) => {
    if (minutes <= 0) return 'Finishing...';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return <div className="loading">Loading laundry status...</div>;
  }

  return (
    <div className="student-laundry">
      <div className="laundry-header">
        <h2>Laundry Room Status</h2>
        <button onClick={() => { fetchMachines(); fetchQueue(); }} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="laundry-stats">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">
              {machines.filter((m) => m.status === 'available').length}
            </div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <div className="stat-value">
              {machines.filter((m) => m.status === 'in_use').length}
            </div>
            <div className="stat-label">In Use</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <div className="stat-value">
              {machines.filter((m) => m.status === 'maintenance' || m.status === 'out_of_order')
                .length}
            </div>
            <div className="stat-label">Unavailable</div>
          </div>
        </div>
      </div>

      <div className="machines-grid">
        {machines.map((machine) => (
          <div
            key={machine.id}
            className={`machine-card machine-${machine.status} ${
              machine.is_current_user ? 'current-user' : ''
            }`}
          >
            <div className="machine-header">
              <div className="machine-icon">{getMachineIcon(machine.machine_type)}</div>
              <div className="machine-info">
                <h3>{machine.machine_number}</h3>
                <span className={`badge ${getMachineStatusBadge(machine.status)}`}>
                  {machine.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="machine-details">
              <div className="machine-type">
                Type: {machine.machine_type.charAt(0).toUpperCase() + machine.machine_type.slice(1)}
              </div>

              {machine.status === 'in_use' && (
                <>
                  {machine.is_current_user ? (
                    <div className="machine-in-use current-user-info">
                      <p className="user-label">✓ You are using this machine</p>
                      {machine.minutes_remaining > 0 && (
                        <div className="time-remaining">
                          <div className="timer">⏰ {formatTimeRemaining(machine.minutes_remaining)}</div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${
                                  ((60 - machine.minutes_remaining) / 60) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleEndMachine(machine.id)}
                        className="btn btn-danger btn-small"
                      >
                        End Cycle
                      </button>
                    </div>
                  ) : (
                    <div className="machine-in-use">
                      <p>
                        In use by: {machine.first_name} {machine.last_name?.charAt(0)}.
                      </p>
                      {machine.minutes_remaining > 0 && (
                        <div className="time-remaining">
                          <div className="timer">⏰ {formatTimeRemaining(machine.minutes_remaining)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {machine.status === 'available' && (
                <button
                  onClick={() => setSelectedMachine(machine)}
                  className="btn btn-primary btn-block"
                >
                  Start Using
                </button>
              )}

              {(machine.status === 'maintenance' || machine.status === 'out_of_order') && (
                <div className="machine-unavailable">
                  <p>This machine is currently unavailable</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {queue.length > 0 && (
        <div className="queue-section">
          <h3>Queue Status</h3>
          <div className="queue-list">
            {queue.map((item) => (
              <div key={item.id} className="queue-item">
                <div className="queue-position">#{item.queue_position}</div>
                <div className="queue-info">
                  <div className="queue-machine">{item.machine_number}</div>
                  <div className="queue-status">{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMachine && (
        <div className="machine-modal" onClick={() => setSelectedMachine(null)}>
          <div className="machine-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedMachine(null)}>
              ×
            </button>
            <h3>Start Using {selectedMachine.machine_number}</h3>
            <p>How long do you need the machine?</p>
            <div className="duration-options">
              <button
                onClick={() => handleStartMachine(selectedMachine.id, 30)}
                className="btn btn-outline"
              >
                30 minutes
              </button>
              <button
                onClick={() => handleStartMachine(selectedMachine.id, 45)}
                className="btn btn-outline"
              >
                45 minutes
              </button>
              <button
                onClick={() => handleStartMachine(selectedMachine.id, 60)}
                className="btn btn-outline"
              >
                60 minutes
              </button>
              <button
                onClick={() => handleStartMachine(selectedMachine.id, 90)}
                className="btn btn-outline"
              >
                90 minutes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentLaundry;
