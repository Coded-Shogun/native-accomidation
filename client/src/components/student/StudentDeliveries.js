import React, { useState, useEffect } from 'react';
import './StudentDeliveries.css';

/**
 * StudentDeliveries - Package delivery tracking system
 * Features:
 * - View all deliveries
 * - Track packages by tracking number
 * - Mark deliveries as picked up
 * - Filter by status
 * - View delivery statistics
 */
function StudentDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    fetchDeliveries();
    fetchStats();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/deliveries', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/deliveries/stats/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handlePickup = async (deliveryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/deliveries/${deliveryId}/pickup`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Delivery marked as picked up');
        setSelectedDelivery(null);
        await fetchDeliveries();
        await fetchStats();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to mark as picked up');
      }
    } catch (err) {
      alert('Error marking pickup: ' + err.message);
    }
  };

  const handleTrackingSearch = async (e) => {
    e.preventDefault();
    if (!trackingSearch.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/deliveries/track/${trackingSearch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDelivery(data);
        setTrackingSearch('');
      } else {
        alert('Delivery not found with this tracking number');
      }
    } catch (err) {
      alert('Error tracking delivery: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      in_transit: 'badge-info',
      delivered: 'badge-success',
      ready_for_pickup: 'badge-primary',
      picked_up: 'badge-secondary',
      returned: 'badge-warning',
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      in_transit: '🚚',
      delivered: '📦',
      ready_for_pickup: '✅',
      picked_up: '👍',
      returned: '↩️',
    };
    return icons[status] || '📦';
  };

  const filteredDeliveries =
    filterStatus === 'all'
      ? deliveries
      : deliveries.filter((delivery) => delivery.status === filterStatus);

  if (loading) {
    return <div className="loading">Loading deliveries...</div>;
  }

  return (
    <div className="student-deliveries">
      <div className="deliveries-header">
        <h2>My Deliveries</h2>
        <button
          onClick={() => {
            fetchDeliveries();
            fetchStats();
          }}
          className="refresh-btn"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="tracking-search">
        <form onSubmit={handleTrackingSearch}>
          <input
            type="text"
            value={trackingSearch}
            onChange={(e) => setTrackingSearch(e.target.value)}
            placeholder="Enter tracking number..."
            className="tracking-input"
          />
          <button type="submit" className="btn btn-primary">
            Track
          </button>
        </form>
      </div>

      {stats && (
        <div className="delivery-stats">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total_deliveries || 0}</div>
              <div className="stat-label">Total Deliveries</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚚</div>
            <div className="stat-info">
              <div className="stat-value">{stats.in_transit || 0}</div>
              <div className="stat-label">In Transit</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.awaiting_pickup || 0}</div>
              <div className="stat-label">Ready for Pickup</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👍</div>
            <div className="stat-info">
              <div className="stat-value">{stats.picked_up || 0}</div>
              <div className="stat-label">Picked Up</div>
            </div>
          </div>
        </div>
      )}

      <div className="deliveries-filters">
        <button
          className={filterStatus === 'all' ? 'active' : ''}
          onClick={() => setFilterStatus('all')}
        >
          All
        </button>
        <button
          className={filterStatus === 'in_transit' ? 'active' : ''}
          onClick={() => setFilterStatus('in_transit')}
        >
          In Transit
        </button>
        <button
          className={filterStatus === 'ready_for_pickup' ? 'active' : ''}
          onClick={() => setFilterStatus('ready_for_pickup')}
        >
          Ready for Pickup
        </button>
        <button
          className={filterStatus === 'picked_up' ? 'active' : ''}
          onClick={() => setFilterStatus('picked_up')}
        >
          Picked Up
        </button>
      </div>

      {filteredDeliveries.length === 0 ? (
        <div className="no-deliveries">
          <div className="no-deliveries-icon">📦</div>
          <p>No deliveries to display</p>
          <p className="help-text">Your packages will appear here when they arrive</p>
        </div>
      ) : (
        <div className="deliveries-list">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="delivery-card"
              onClick={() => setSelectedDelivery(delivery)}
            >
              <div className="delivery-header">
                <div className="delivery-icon">{getStatusIcon(delivery.status)}</div>
                <div className="delivery-info">
                  <h4>{delivery.courier_name || 'Delivery'}</h4>
                  <div className="delivery-tracking">{delivery.tracking_number}</div>
                </div>
                <span className={`badge ${getStatusBadge(delivery.status)}`}>
                  {delivery.status.replace('_', ' ')}
                </span>
              </div>

              {delivery.description && (
                <div className="delivery-description">{delivery.description}</div>
              )}

              <div className="delivery-dates">
                {delivery.delivery_date && (
                  <div className="date-info">
                    <span className="label">Delivered:</span>
                    <span className="value">
                      {new Date(delivery.delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {delivery.created_at && (
                  <div className="date-info">
                    <span className="label">Logged:</span>
                    <span className="value">
                      {new Date(delivery.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {(delivery.status === 'ready_for_pickup' || delivery.status === 'delivered') && !delivery.picked_up_at && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePickup(delivery.id);
                  }}
                  className="btn btn-primary btn-small"
                >
                  Mark as Picked Up
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedDelivery && (
        <div className="delivery-modal" onClick={() => setSelectedDelivery(null)}>
          <div className="delivery-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedDelivery(null)}>
              ×
            </button>
            <div className="delivery-detail">
              <div className="delivery-detail-header">
                <div className="delivery-icon-large">
                  {getStatusIcon(selectedDelivery.status)}
                </div>
                <div>
                  <h2>{selectedDelivery.courier_name || 'Delivery'}</h2>
                  <span className={`badge ${getStatusBadge(selectedDelivery.status)}`}>
                    {selectedDelivery.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="delivery-detail-info">
                <div className="detail-row">
                  <span className="label">Tracking Number:</span>
                  <span className="value tracking-number">{selectedDelivery.tracking_number}</span>
                </div>

                {selectedDelivery.description && (
                  <div className="detail-row">
                    <span className="label">Description:</span>
                    <span className="value">{selectedDelivery.description}</span>
                  </div>
                )}

                {selectedDelivery.sender_name && (
                  <div className="detail-row">
                    <span className="label">Sender:</span>
                    <span className="value">{selectedDelivery.sender_name}</span>
                  </div>
                )}

                {selectedDelivery.courier_name && (
                  <div className="detail-row">
                    <span className="label">Courier:</span>
                    <span className="value">{selectedDelivery.courier_name}</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="label">Property:</span>
                  <span className="value">{selectedDelivery.property_name}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Logged:</span>
                  <span className="value">
                    {new Date(selectedDelivery.created_at).toLocaleString()}
                  </span>
                </div>

                {selectedDelivery.delivery_date && (
                  <div className="detail-row">
                    <span className="label">Delivered On:</span>
                    <span className="value">
                      {new Date(selectedDelivery.delivery_date).toLocaleString()}
                    </span>
                  </div>
                )}

                {selectedDelivery.received_by_name && (
                  <div className="detail-row">
                    <span className="label">Received By:</span>
                    <span className="value">{selectedDelivery.received_by_name}</span>
                  </div>
                )}

                {selectedDelivery.picked_up_at && (
                  <div className="detail-row">
                    <span className="label">Picked Up:</span>
                    <span className="value">
                      {new Date(selectedDelivery.picked_up_at).toLocaleString()}
                    </span>
                  </div>
                )}

                {selectedDelivery.notes && (
                  <div className="detail-row">
                    <span className="label">Notes:</span>
                    <span className="value">{selectedDelivery.notes}</span>
                  </div>
                )}
              </div>

              {(selectedDelivery.status === 'ready_for_pickup' ||
                selectedDelivery.status === 'delivered') &&
                !selectedDelivery.picked_up_at && (
                  <button
                    onClick={() => handlePickup(selectedDelivery.id)}
                    className="btn btn-primary btn-block"
                  >
                    Mark as Picked Up
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDeliveries;
