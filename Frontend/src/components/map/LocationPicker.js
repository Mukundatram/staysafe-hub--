import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HiOutlineLocationMarker, HiOutlineSearch } from 'react-icons/hi';
import { BiCurrentLocation } from 'react-icons/bi';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customIcon = L.divIcon({
  className: 'location-picker-marker',
  html: `
    <div style="
      background: #6366f1;
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      border: 3px solid white;
      animation: bounce 0.5s ease;
    ">
      <div style="
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Component to handle map clicks
const LocationMarker = ({ position, setPosition, onLocationChange }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      if (onLocationChange) {
        fetchAddress(lat, lng).then(address => {
          onLocationChange({ lat, lng, address });
        });
      }
    },
  });

  return position ? <Marker position={position} icon={customIcon} /> : null;
};

// Reverse geocoding using Nominatim
const fetchAddress = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || '';
  } catch (error) {
    console.error('Error fetching address:', error);
    return '';
  }
};

// Search location using Nominatim
const searchLocation = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
    );
    return await response.json();
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
};

const LocationPicker = ({
  initialLocation = null,
  onLocationChange,
  height = '350px',
  placeholder = 'Search for a location...',
  showLiveLocation = true,
}) => {
  const [position, setPosition] = useState(initialLocation ? [initialLocation.lat, initialLocation.lng] : null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // ...existing code...
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [mapCenter, setMapCenter] = useState(initialLocation ? [initialLocation.lat, initialLocation.lng] : [20.5937, 78.9629]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    // setIsSearching(true); // removed unused state
    const results = await searchLocation(searchQuery);
    setSearchResults(results);
    // setIsSearching(false); // removed unused state
  }, [searchQuery]);

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery('');
    if (onLocationChange) {
      onLocationChange({ lat, lng, address: result.display_name });
    }
  };

  const handleLocationChange = ({ lat, lng, address: newAddress }) => {
    setAddress(newAddress);
    if (onLocationChange) {
      onLocationChange({ lat, lng, address: newAddress });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosition([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        const addr = await fetchAddress(latitude, longitude);
        setAddress(addr);
        setIsLocating(false);
        if (onLocationChange) {
          onLocationChange({ lat: latitude, lng: longitude, address: addr, accuracy });
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
        }
        setLocationError(errorMessage);
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length >= 3) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchQuery, handleSearch]);

  return (
    <div className="location-picker">
      {/* Live Location Button */}
      {showLiveLocation && (
        <button
          type="button"
          onClick={getCurrentLocation}
          className={`detect-location-btn ${isLocating ? 'locating' : ''}`}
          disabled={isLocating}
        >
          <BiCurrentLocation size={20} className={isLocating ? 'spin' : ''} />
          <span>{isLocating ? 'Detecting your location...' : 'Detect My Live Location'}</span>
        </button>
      )}

      {locationError && (
        <div className="location-error">
          <span>{locationError}</span>
        </div>
      )}

      <div className="search-container">
        <div className="search-input-wrapper">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="search-input"
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            className={`current-location-btn ${isLocating ? 'locating' : ''}`}
            title="Use current location"
            disabled={isLocating}
          >
            <BiCurrentLocation size={20} className={isLocating ? 'spin' : ''} />
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((result, index) => (
              <li key={index} onClick={() => handleSelectResult(result)}>
                <HiOutlineLocationMarker />
                <span>{result.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="map-container" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={position ? 15 : 5}
          style={{ height: '100%', width: '100%' }}
          key={`${mapCenter[0]}-${mapCenter[1]}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationChange={handleLocationChange}
          />
        </MapContainer>
      </div>

      {address && (
        <div className="selected-address">
          <HiOutlineLocationMarker />
          <span>{address}</span>
        </div>
      )}

      <style>{`
        .location-picker {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detect-location-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          padding: 1rem 1.5rem;
          background: var(--accent-gradient);
          border: none;
          border-radius: var(--radius-lg);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .detect-location-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }

        .detect-location-btn:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .detect-location-btn.locating {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .detect-location-btn .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .location-error {
          padding: 0.75rem 1rem;
          background: var(--error-bg);
          border: 1px solid var(--error);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: 0.875rem;
        }

        .search-container {
          position: relative;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--bg-input);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 0 1rem;
          transition: var(--transition-fast);
        }

        .search-input-wrapper:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .search-icon {
          color: var(--text-tertiary);
          font-size: 1.25rem;
        }

        .search-input {
          flex: 1;
          padding: 0.875rem 0.75rem;
          border: none;
          background: transparent;
          font-size: 0.9375rem;
          color: var(--text-primary);
        }

        .search-input:focus {
          outline: none;
        }

        .current-location-btn {
          padding: 0.5rem;
          background: var(--accent-gradient-soft);
          border: none;
          border-radius: var(--radius-md);
          color: var(--accent-primary);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .current-location-btn:hover:not(:disabled) {
          background: var(--accent-primary);
          color: white;
        }

        .current-location-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .current-location-btn.locating {
          background: var(--success);
          color: white;
        }

        .current-location-btn .spin {
          animation: spin 1s linear infinite;
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          margin-top: 0.5rem;
          max-height: 250px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: var(--shadow-lg);
        }

        .search-results li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .search-results li:hover {
          background: var(--bg-hover);
        }

        .search-results li svg {
          color: var(--accent-primary);
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .search-results li span {
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .map-container {
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-light);
        }

        .selected-address {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          background: var(--success-bg);
          border-radius: var(--radius-lg);
          color: var(--success);
        }

        .selected-address svg {
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .selected-address span {
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .location-picker-marker {
          background: transparent;
          border: none;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LocationPicker;
