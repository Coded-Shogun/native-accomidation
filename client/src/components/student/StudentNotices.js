import React, { useState, useEffect } from 'react';
import './StudentNotices.css';

/**
 * StudentNotices - Notice board component
 * Displays announcements, maintenance updates, events, and WiFi updates
 * Filtered by priority and category
 */
function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    fetchNotices();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/notices', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotices(data);
      } else {
        setError('Failed to load notices');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: 'badge-urgent',
      high: 'badge-high',
      normal: 'badge-normal',
      low: 'badge-low',
    };
    return badges[priority] || 'badge-normal';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      general: '📢',
      maintenance: '🔧',
      event: '📅',
      urgent: '⚠️',
      wifi: '📶',
    };
    return icons[category] || '📢';
  };

  const filteredNotices =
    filterCategory === 'all'
      ? notices
      : notices.filter((notice) => notice.category === filterCategory);

  if (loading) {
    return <div className="loading">Loading notices...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="student-notices">
      <div className="notices-header">
        <h2>Notice Board</h2>
        <button onClick={fetchNotices} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="notices-filters">
        <button
          className={filterCategory === 'all' ? 'active' : ''}
          onClick={() => setFilterCategory('all')}
        >
          All
        </button>
        <button
          className={filterCategory === 'general' ? 'active' : ''}
          onClick={() => setFilterCategory('general')}
        >
          General
        </button>
        <button
          className={filterCategory === 'maintenance' ? 'active' : ''}
          onClick={() => setFilterCategory('maintenance')}
        >
          Maintenance
        </button>
        <button
          className={filterCategory === 'event' ? 'active' : ''}
          onClick={() => setFilterCategory('event')}
        >
          Events
        </button>
        <button
          className={filterCategory === 'urgent' ? 'active' : ''}
          onClick={() => setFilterCategory('urgent')}
        >
          Urgent
        </button>
        <button
          className={filterCategory === 'wifi' ? 'active' : ''}
          onClick={() => setFilterCategory('wifi')}
        >
          WiFi
        </button>
      </div>

      {filteredNotices.length === 0 ? (
        <div className="no-notices">
          <p>No notices to display</p>
        </div>
      ) : (
        <div className="notices-list">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`notice-card priority-${notice.priority}`}
              onClick={() => setSelectedNotice(notice)}
            >
              <div className="notice-header">
                <div className="notice-icon">{getCategoryIcon(notice.category)}</div>
                <div className="notice-title-section">
                  <h3>{notice.title}</h3>
                  <div className="notice-meta">
                    <span className={`badge ${getPriorityBadge(notice.priority)}`}>
                      {notice.priority}
                    </span>
                    <span className="badge badge-category">{notice.category}</span>
                    <span className="notice-date">
                      {new Date(notice.posted_at).toLocaleDateString()}
                    </span>
                    {notice.posted_by_name && (
                      <span className="notice-author">by {notice.posted_by_name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="notice-preview">
                {notice.content.substring(0, 150)}
                {notice.content.length > 150 ? '...' : ''}
              </div>
              {notice.expires_at && (
                <div className="notice-expiry">
                  Expires: {new Date(notice.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedNotice && (
        <div className="notice-modal" onClick={() => setSelectedNotice(null)}>
          <div className="notice-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedNotice(null)}>
              ×
            </button>
            <div className="notice-detail">
              <div className="notice-detail-header">
                <div className="notice-icon-large">
                  {getCategoryIcon(selectedNotice.category)}
                </div>
                <div>
                  <h2>{selectedNotice.title}</h2>
                  <div className="notice-detail-meta">
                    <span className={`badge ${getPriorityBadge(selectedNotice.priority)}`}>
                      {selectedNotice.priority}
                    </span>
                    <span className="badge badge-category">{selectedNotice.category}</span>
                    <span className="notice-date">
                      Posted: {new Date(selectedNotice.posted_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="notice-detail-content">
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedNotice.content}</p>
              </div>
              {selectedNotice.posted_by_name && (
                <div className="notice-detail-footer">
                  <p>Posted by: {selectedNotice.posted_by_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentNotices;
