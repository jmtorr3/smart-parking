import React, { useState, useEffect } from 'react';
import './App.css';
import vtLogo from './VT_Logo.jpg';

function App() {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedLot) {
      fetchSpots(selectedLot.id);
      const interval = setInterval(() => fetchSpots(selectedLot.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedLot]);

  if (loading) return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="header-title">
            <img src={vtLogo} alt="Virginia Tech" className="vt-logo" />
            <h1>VT Smart Parking</h1>
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
          <span className="last-updated">Loading...</span>
          <p>Real-time parking availability</p>
        </div>
      </header>
      <div className="dashboard">
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
    </div>
  );

  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="header-title">
            <img src={vtLogo} alt="Virginia Tech" className="vt-logo" />
            <h1>VT Smart Parking</h1>
          </div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search lots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="header-bottom">
          {lastUpdated && (
            <span className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <p>Real-time parking availability</p>
        </div>
      </header>

      <div className="dashboard">
        {lots.filter(lot => lot.name.toLowerCase().includes(searchTerm.toLowerCase())).map((lot) => (
          <div 
            key={lot.id} 
            className={`lot-card ${selectedLot?.id === lot.id ? 'selected' : ''}`}
            onClick={() => setSelectedLot(selectedLot?.id === lot.id ? null : lot)}
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

      {selectedLot && (
        <div className="spot-detail">
          <h2>{selectedLot.name} - Individual Spots</h2>
          <div className="spots-grid">
            {spots.map((spot) => (
              <div 
                key={spot.parking_spot_id} 
                className={`spot ${spot.availability ? 'free' : 'taken'}`}
              >
                {spot.parking_spot_id}
              </div>
            ))}
          </div>
          <div className="legend">
            <span><span className="dot free"></span> Available</span>
            <span><span className="dot taken"></span> Occupied</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;