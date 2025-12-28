import React, { useState, useEffect } from 'react';
import './App.css';
import vtLogo from './VT_Logo.jpg';
import Login from './Login';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // New state for features
  const [profile, setProfile] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '' });
  const [filterByPermit, setFilterByPermit] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setLoading(false);
    }
  }, []);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setProfile(null);
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/me/`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchActiveEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events/active/`);
      if (response.ok) {
        const data = await response.json();
        setActiveEvents(data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchData = async () => {
    try {
      const endpoint = filterByPermit 
        ? `${API_URL}/api/lots/for-my-permit/` 
        : `${API_URL}/api/dashboard/`;
      const response = await fetch(endpoint, {
        headers: filterByPermit ? getAuthHeaders() : {}
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setLots(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchSpots = async (lotId) => {
    try {
      const response = await fetch(`${API_URL}/api/spots/?parking_lot=${lotId}`);
      if (!response.ok) throw new Error('Failed to fetch spots');
      const data = await response.json();
      setSpots(data);
    } catch (err) {
      console.error('Error fetching spots:', err);
    }
  };

  const addVehicle = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/vehicles/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newVehicle)
      });
      if (response.ok) {
        setNewVehicle({ make: '', model: '' });
        setShowAddVehicle(false);
        fetchProfile();
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
    }
  };

  const deleteVehicle = async (vehicleId) => {
    try {
      const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchProfile();
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      fetchProfile();
      fetchActiveEvents();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, filterByPermit]);

  useEffect(() => {
    if (selectedLot) {
      fetchSpots(selectedLot.id);
      const interval = setInterval(() => fetchSpots(selectedLot.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedLot]);

  // Check if a lot is restricted by an active event
  const isLotRestricted = (lotId) => {
    return activeEvents.some(event =>
      event.restricted_lots?.some(lot => lot.parking_lot_id === lotId)
    );
  };

  // Get layout type based on lot id
  const getLayoutType = (lotId) => {
    const layouts = ['horizontal', 'angled', 'vertical', 'double', 'compact'];
    return layouts[lotId % layouts.length];
  };

  // Render parking spots based on layout type
  const renderParkingLayout = () => {
    if (!selectedLot || spots.length === 0) return null;

    const layoutType = getLayoutType(selectedLot.id);
    const halfLength = Math.ceil(spots.length / 2);
    const quarterLength = Math.ceil(spots.length / 4);

    switch (layoutType) {
      case 'horizontal':
        return (
          <div className="parking-lot-layout horizontal-layout">
            <div className="parking-section">
              <div className="parking-row horizontal-row top">
                {spots.slice(0, halfLength).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot horizontal ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
              <div className="road horizontal-road">
                <div className="road-line"></div>
                <span className="road-label">← Driving Lane →</span>
                <div className="road-line"></div>
              </div>
              <div className="parking-row horizontal-row bottom">
                {spots.slice(halfLength).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot horizontal ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'angled':
        return (
          <div className="parking-lot-layout angled-layout">
            <div className="parking-section">
              <div className="parking-row angled-row top">
                {spots.slice(0, halfLength).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot angled angled-down ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
              <div className="road">
                <div className="road-line"></div>
                <div className="road-arrow">→</div>
                <span className="road-label">One Way</span>
                <div className="road-arrow">→</div>
                <div className="road-line"></div>
              </div>
              <div className="parking-row angled-row bottom">
                {spots.slice(halfLength).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot angled angled-up ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'vertical':
        return (
          <div className="parking-lot-layout vertical-layout">
            <div className="vertical-container">
              <div className="parking-column left-column">
                {spots.slice(0, halfLength).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot vertical ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
              <div className="road vertical-road">
                <div className="road-line-vertical"></div>
                <span className="road-label-vertical">↑ Driving Lane ↓</span>
                <div className="road-line-vertical"></div>
              </div>
              <div className="parking-column right-column">
                {spots.slice(halfLength).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot vertical ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'double':
        return (
          <div className="parking-lot-layout double-layout">
            <div className="parking-section">
              <div className="parking-row horizontal-row top">
                {spots.slice(0, quarterLength).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot horizontal ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
              <div className="road horizontal-road">
                <div className="road-line"></div>
                <span className="road-label">← Lane A →</span>
                <div className="road-line"></div>
              </div>
              <div className="parking-row horizontal-row middle">
                {spots.slice(quarterLength, quarterLength * 2).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot horizontal ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
              <div className="parking-island">
                <span>🌳</span>
                <span>🌳</span>
                <span>🌳</span>
              </div>
              <div className="parking-row horizontal-row middle">
                {spots.slice(quarterLength * 2, quarterLength * 3).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot horizontal ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
              <div className="road horizontal-road">
                <div className="road-line"></div>
                <span className="road-label">← Lane B →</span>
                <div className="road-line"></div>
              </div>
              <div className="parking-row horizontal-row bottom">
                {spots.slice(quarterLength * 3).map((spot) => (
                  <div
                    key={spot.parking_spot_id}
                    className={`parking-spot horizontal ${spot.availability ? 'free' : 'taken'}`}
                  >
                    <span className="spot-number">{spot.parking_spot_id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'compact':
      default:
        return (
          <div className="parking-lot-layout compact-layout">
            <div className="entry-exit">
              <span className="entry">↓ ENTRY</span>
              <span className="exit">EXIT ↑</span>
            </div>
            <div className="parking-grid">
              {spots.map((spot) => (
                <div
                  key={spot.parking_spot_id}
                  className={`parking-spot compact ${spot.availability ? 'free' : 'taken'}`}
                >
                  <span className="spot-number">{spot.parking_spot_id}</span>
                </div>
              ))}
            </div>
            <div className="road compact-road">
              <div className="road-line"></div>
              <span className="road-label">← Driving Lane →</span>
              <div className="road-line"></div>
            </div>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  if (loading) return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="header-title">
            <img src={vtLogo} alt="Virginia Tech" className="vt-logo" />
            <h1>Smart Parking</h1>
          </div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search lots..."
              className="search-input"
              disabled
            />
          </div>
        </div>
        <div className="header-bottom">
          <p>Real-time parking availability</p>
          <span className="last-updated">Loading...</span>
        </div>
      </header>
      <div className="main-content">
        <div className="lots-panel">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="lot-card skeleton">
              <div className="skeleton-title"></div>
              <div className="skeleton-stats">
                <div className="skeleton-number"></div>
                <div className="skeleton-number"></div>
              </div>
              <div className="skeleton-bar"></div>
            </div>
          ))}
        </div>
        <div className="spots-panel">
          <div className="spots-placeholder">
            <p>Select a parking lot to view individual spots</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app">
      {/* Event Banner */}
      {activeEvents.length > 0 && (
        <div className="event-banner">
          <span className="event-icon">⚠️</span>
          <div className="event-info">
            <strong>{activeEvents[0].event_name}</strong>
            <span> — The following lots are restricted: </span>
            <span className="restricted-lots">
              {activeEvents[0].restricted_lots?.map(lot => lot.parking_lot_name).join(', ') || 'None'}
            </span>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-top">
          <div className="header-title">
            <img src={vtLogo} alt="Virginia Tech" className="vt-logo" />
            <h1>Smart Parking</h1>
          </div>
          <div className="header-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search lots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="header-bottom">
          <p>Real-time parking availability</p>
          {lastUpdated && (
            <span className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </header>

      {/* User Info Panel */}
      {profile && (
        <div className="user-panel">
          <div className="user-info">
            <div className="user-greeting">
              <span>Welcome, <strong>{profile.first_name || profile.username}</strong></span>
              {profile.permit_type && (
                <span className="permit-badge">{profile.permit_type.name} Permit</span>
              )}
            </div>

            <div className="user-vehicle">
              {profile.vehicles && profile.vehicles.length > 0 ? (
                <div className="vehicle-list">
                  <span>Your vehicles:</span>
                  {profile.vehicles.map((v) => (
                    <span key={v.vehicle_id} className="vehicle-tag">
                      {v.make} {v.model}
                      <button
                        className="remove-vehicle"
                        onClick={() => deleteVehicle(v.vehicle_id)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="no-vehicle">No vehicle registered</span>
              )}
              <button
                className="add-vehicle-btn"
                onClick={() => setShowAddVehicle(!showAddVehicle)}
              >
                + Add Vehicle
              </button>
            </div>

            {profile.permit_type && (
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={filterByPermit}
                  onChange={(e) => setFilterByPermit(e.target.checked)}
                />
                <span>Show only lots for my permit</span>
              </label>
            )}
          </div>

          {showAddVehicle && (
            <form className="add-vehicle-form" onSubmit={addVehicle}>
              <input
                type="text"
                placeholder="Make (e.g., Honda)"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Model (e.g., Civic)"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                required
              />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setShowAddVehicle(false)}>Cancel</button>
            </form>
          )}
        </div>
      )}

      <div className="main-content">
        <div className="lots-panel">
          {lots
            .filter(lot => lot.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((lot) => (
              <div
                key={lot.id}
                className={`lot-card ${selectedLot?.id === lot.id ? 'selected' : ''} ${isLotRestricted(lot.id) ? 'restricted' : ''}`}
                onClick={() => setSelectedLot(lot)}
              >
                {isLotRestricted(lot.id) && (
                  <span className="restricted-badge">⚠️ Restricted</span>
                )}
                <h2>{lot.name}</h2>
                <div className="stats">
                  <div className="stat available">
                    <span className="number">{lot.available_spots}</span>
                    <span className="label">Available</span>
                  </div>
                  <div className="stat total">
                    <span className="number">{lot.total_spots}</span>
                    <span className="label">Total</span>
                  </div>
                </div>
                <div className="occupancy-bar">
                  <div
                    className="occupancy-fill"
                    style={{
                      width: `${lot.occupancy_percent}%`,
                      backgroundColor: lot.occupancy_percent > 80 ? '#ef4444' :
                        lot.occupancy_percent > 50 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
                <p className="occupancy-text">{lot.occupancy_percent}% occupied</p>
              </div>
            ))}
        </div>

        <div className="spots-panel">
          {selectedLot ? (
            <div className="spot-detail">
              <h2>{selectedLot.name} - Individual Spots</h2>
              {renderParkingLayout()}
              <div className="legend">
                <span><span className="dot free"></span> Available</span>
                <span><span className="dot taken"></span> Occupied</span>
              </div>
            </div>
          ) : (
            <div className="spots-placeholder">
              <p>Select a parking lot to view individual spots</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;