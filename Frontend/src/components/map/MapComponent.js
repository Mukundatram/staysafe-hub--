import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BiCurrentLocation } from 'react-icons/bi';

// Fix for default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = (color = '#6366f1') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// User location marker icon (blue pulsing dot)
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
    ">
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        background: rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        animation: pulse 2s infinite;
      "></div>
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Component to update map view when center changes
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const MapComponent = ({
  center = [20.5937, 78.9629], // Default to India center
  zoom = 5,
  markers = [],
  height = '400px',
  showSearch = false,
  onLocationSelect,
  interactive = true,
  className = '',
  showUserLocation = false,
}) => {
  const customIcon = createCustomIcon();
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Auto-detect location if showUserLocation is true
  useEffect(() => {
    if (showUserLocation) {
      detectUserLocation();
    }
  }, [showUserLocation, detectUserLocation]);

  return (
    <div className={`map-wrapper ${className}`} style={{ height, width: '100%' }}>
      {showUserLocation && (
        <button
          className={`map-locate-btn ${isLocating ? 'locating' : ''}`}
          onClick={detectUserLocation}
          title="Show my location"
        >
          <BiCurrentLocation size={20} className={isLocating ? 'spin' : ''} />
        </button>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, index) => {
          // Use different icon for search markers
          const markerIcon = marker.isSearchMarker 
            ? createCustomIcon('#10b981') // Green for search location
            : customIcon;
          
          return (
            <Marker
              key={marker.id || index}
              position={[marker.lat, marker.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => {
                  if (onLocationSelect && !marker.isSearchMarker) {
                    onLocationSelect(marker);
                  }
                }
              }}
            >
              <Popup>
                <div className="map-popup">
                  {marker.image && (
                    <img src={marker.image} alt={marker.title} className="popup-image" />
                  )}
                  <div className="popup-content">
                    <h4>{marker.isSearchMarker ? '📍 ' : ''}{marker.title}</h4>
                    {marker.description && <p>{marker.description}</p>}
                    {marker.price && <span className="popup-price">₹{marker.price}/month</span>}
                    {marker.isSearchMarker && <p className="search-marker-label">Searched Location</p>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* User Location Marker */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy || 50}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="user-location-popup">
                  <strong>📍 Your Location</strong>
                  <p>Accuracy: ~{Math.round(userLocation.accuracy || 0)}m</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      <style>{`
        .map-wrapper {
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .map-locate-btn {
          position: absolute;
          bottom: 80px;
          right: 10px;
          z-index: 1000;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 4px;
          cursor: pointer;
          color: #666;
          transition: all 0.2s ease;
        }

        .map-locate-btn:hover {
          background: #f4f4f4;
          color: #3b82f6;
        }

        .map-locate-btn.locating {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .map-locate-btn .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        .user-location-marker {
          background: transparent;
          border: none;
        }

        .user-location-popup {
          text-align: center;
        }

        .user-location-popup p {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: #666;
        }

        .leaflet-container {
          font-family: inherit;
        }

        .custom-marker {
          background: transparent;
          border: none;
        }

        .map-popup {
          min-width: 200px;
        }

        .popup-image {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
        }

        .popup-content h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .popup-content p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .popup-price {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--accent-primary);
        }

        .search-marker-label {
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .leaflet-popup-content-wrapper {
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }

        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
