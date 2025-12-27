import React, { useState, useEffect } from 'react';
import './App.css';
import vtLogo from './VT_Logo.jpg';
import Login from './Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
  };

  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/dashboard/');
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
      const response = await fetch(`http://127.0.0.1:8000/api/spots/?parking_lot=${lotId}`);
      if (!response.ok) throw new Error('Failed to fetch spots');
      const data = await response.json();
      setSpots(data);
    } catch (err) {
      console.error('Error fetching spots:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedLot) {
      fetchSpots(selectedLot.id);
      const interval = setInterval(() => fetchSpots(selectedLot.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedLot]);

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

      <div className="main-content">
        <div className="lots-panel">
          {lots.filter(lot => lot.name.toLowerCase().includes(searchTerm.toLowerCase())).map((lot) => (
            <div 
              key={lot.id} 
              className={`lot-card ${selectedLot?.id === lot.id ? 'selected' : ''}`}
              onClick={() => setSelectedLot(lot)}
            >
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