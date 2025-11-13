import React, { useState, useEffect } from 'react';
import './StudentWiFi.css';

/**
 * StudentWiFi - WiFi credentials access for students
 * Features:
 * - View current WiFi password (decrypted)
 * - See password expiration date
 * - View credential history
 * - Copy credentials to clipboard
 * - Notifications for expiring passwords
 */
function StudentWiFi() {
  const [currentWiFi, setCurrentWiFi] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCurrentWiFi();
    fetchHistory();
  }, []);

  const fetchCurrentWiFi = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/wifi/current', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentWiFi(data);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'No WiFi credentials available');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/wifi/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return <div className="loading">Loading WiFi credentials...</div>;
  }

  if (error) {
    return (
      <div className="student-wifi">
        <h2>WiFi Access</h2>
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h3>No WiFi Credentials Available</h3>
          <p>{error}</p>
          <p>Please contact property management for WiFi access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-wifi">
      <div className="wifi-header">
        <h2>WiFi Access</h2>
        <button onClick={fetchCurrentWiFi} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {currentWiFi && (
        <>
          {currentWiFi.expires_soon && (
            <div className="wifi-alert alert-warning">
              ⚠️ WiFi password expires in {currentWiFi.days_until_expiration} day(s). A new password
              will be provided soon.
            </div>
          )}

          <div className="wifi-card current-wifi">
            <div className="wifi-card-header">
              <div className="wifi-icon">📶</div>
              <h3>Current WiFi Credentials</h3>
            </div>

            <div className="wifi-credentials">
              <div className="credential-row">
                <div className="credential-label">Network Name (SSID):</div>
                <div className="credential-value network-name">
                  {currentWiFi.network_name}
                  <button
                    onClick={() => copyToClipboard(currentWiFi.network_name)}
                    className="copy-btn"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="credential-row">
                <div className="credential-label">Password:</div>
                <div className="credential-value password-value">
                  <span className={showPassword ? '' : 'password-hidden'}>
                    {showPassword ? currentWiFi.password : '••••••••••••'}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-btn"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(currentWiFi.password)}
                    className="copy-btn"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              {copied && <div className="copy-success">✓ Copied to clipboard!</div>}

              <div className="credential-validity">
                <div className="validity-row">
                  <span className="label">Valid From:</span>
                  <span className="value">
                    {new Date(currentWiFi.valid_from).toLocaleDateString()}
                  </span>
                </div>
                <div className="validity-row">
                  <span className="label">Valid Until:</span>
                  <span className="value">
                    {new Date(currentWiFi.valid_until).toLocaleDateString()}
                  </span>
                </div>
                <div className="validity-row">
                  <span className="label">Days Remaining:</span>
                  <span className={`value ${currentWiFi.expires_soon ? 'expiring' : ''}`}>
                    {currentWiFi.days_until_expiration} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="wifi-instructions">
            <h3>Connection Instructions</h3>
            <ol>
              <li>Open your device's WiFi settings</li>
              <li>
                Select the network: <strong>{currentWiFi.network_name}</strong>
              </li>
              <li>Enter the password shown above</li>
              <li>Connect and enjoy high-speed internet access</li>
            </ol>
          </div>
        </>
      )}

      {history.length > 0 && (
        <div className="wifi-history">
          <h3>Credential History</h3>
          <div className="history-list">
            {history.map((cred) => (
              <div key={cred.id} className={`history-item status-${cred.status}`}>
                <div className="history-network">{cred.network_name}</div>
                <div className="history-dates">
                  {new Date(cred.valid_from).toLocaleDateString()} -{' '}
                  {new Date(cred.valid_until).toLocaleDateString()}
                </div>
                <span className={`badge badge-${cred.status}`}>{cred.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wifi-support">
        <h3>Need Help?</h3>
        <p>If you're having trouble connecting to WiFi:</p>
        <ul>
          <li>Make sure you're within range of the WiFi access points</li>
          <li>Check that you've entered the password correctly (passwords are case-sensitive)</li>
          <li>Try forgetting the network and reconnecting</li>
          <li>Restart your device</li>
          <li>
            If problems persist, contact property management or submit a complaint via the Feedback
            section
          </li>
        </ul>
      </div>
    </div>
  );
}

export default StudentWiFi;
