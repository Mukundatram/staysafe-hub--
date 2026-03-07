import '../styles/PropertiesPage.css';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { propertyService } from '../../services/propertyService';
import PropertyCard from '../../components/property/PropertyCard';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonCard from '../../components/ui/SkeletonCard';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { MapComponent } from '../../components/map';
import {
  HiOutlineSearch,
  HiOutlineAdjustments,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineHome,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
  HiOutlineViewGrid,
  HiOutlineMap,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi';
import { BiCurrentLocation } from 'react-icons/bi';

// Search location using Nominatim (OpenStreetMap)
const searchLocation = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
    );
    return await response.json();
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
};

const PropertiesPage = () => {
  useDocumentTitle('Properties');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  // Pagination state
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Location search states
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedLocationCoords, setSelectedLocationCoords] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Current filters state
  const [currentFilters, setCurrentFilters] = useState({
    search: searchParams.get('search') || '',
    sortBy: 'newest',
    page: 1
  });

  // Legacy filter states (keeping for backward compatibility with existing UI)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    verifiedOnly: true,
    minPrice: '',
    maxPrice: '',
    location: '',
    hasMess: false,
  });

  useEffect(() => {
    fetchProperties(currentFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to detect user's live location
  const detectUserLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          // Build a more descriptive location name
          const address = data.address || {};
          const locationParts = [];

          // Add suburb/neighbourhood if available
          if (address.suburb || address.neighbourhood) {
            locationParts.push(address.suburb || address.neighbourhood);
          }

          // Add city/town/village
          if (address.city || address.town || address.village) {
            locationParts.push(address.city || address.town || address.village);
          }

          // Fallback to state if nothing else
          if (locationParts.length === 0 && address.state) {
            locationParts.push(address.state);
          }

          const locationName = locationParts.length > 0
            ? locationParts.join(', ')
            : 'Your Location';

          // Update the location filter with the detected location name
          setFilters(prev => ({ ...prev, location: locationName }));
          setSelectedLocationCoords({ lat: latitude, lng: longitude });

          // Show filters panel so user can see the location was set
          setShowFilters(true);
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          // Still set coordinates even if reverse geocoding fails
          setSelectedLocationCoords({ lat: latitude, lng: longitude });
          setFilters(prev => ({ ...prev, location: 'My Location' }));
          setShowFilters(true);
        }

        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsDetectingLocation(false);

        // Show user-friendly error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied. Please enable location permissions in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable. Please try again.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out. Please try again.');
            break;
          default:
            alert('Unable to get your location. Please try again or enter location manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const fetchProperties = async (searchFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await propertyService.search(searchFilters);

      // Handle both old format (array) and new format (object with properties)
      if (Array.isArray(data)) {
        setProperties(data);
      } else {
        setProperties(data.properties || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    const updatedFilters = { ...currentFilters, page: newPage };
    setCurrentFilters(updatedFilters);
    fetchProperties(updatedFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter properties based on search and filters (local filtering for backward compatibility)
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = property.title?.toLowerCase().includes(query);
        const matchesLocation = property.location?.toLowerCase().includes(query);
        const matchesDescription = property.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesDescription) {
          return false;
        }
      }

      // Location filter
      if (filters.location) {
        if (!property.location?.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Price range filter
      if (filters.minPrice && property.rent < Number(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && property.rent > Number(filters.maxPrice)) {
        return false;
      }

      // Mess filter
      if (filters.hasMess && (!property.meals || property.meals.length === 0)) {
        return false;
      }

      return true;
    });
  }, [properties, searchQuery, filters]);

  // Prepare map markers from filtered properties with coordinates
  const mapMarkers = useMemo(() => {
    return filteredProperties
      .filter(p => p.coordinates?.lat && p.coordinates?.lng)
      .map(p => ({
        id: p._id,
        lat: p.coordinates.lat,
        lng: p.coordinates.lng,
        title: p.title,
        description: p.location,
        price: p.rent,
        image: p.images?.[0] ? `${p.images[0]?.startsWith('http') ? '' : (process.env.REACT_APP_API_BASE_URL ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') : (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:4000'))}${p.images[0]}` : null,
      }));
  }, [filteredProperties]);

  // Calculate map center based on markers or selected location
  const mapCenter = useMemo(() => {
    // If a location is selected from suggestions, center on it
    if (selectedLocationCoords) {
      return [selectedLocationCoords.lat, selectedLocationCoords.lng];
    }
    // Otherwise center on markers
    if (mapMarkers.length === 0) return [20.5937, 78.9629]; // Default India center
    const avgLat = mapMarkers.reduce((sum, m) => sum + m.lat, 0) / mapMarkers.length;
    const avgLng = mapMarkers.reduce((sum, m) => sum + m.lng, 0) / mapMarkers.length;
    return [avgLat, avgLng];
  }, [mapMarkers, selectedLocationCoords]);

  // Calculate map zoom based on selection
  const mapZoom = useMemo(() => {
    if (selectedLocationCoords) return 13;
    if (mapMarkers.length === 1) return 15;
    if (mapMarkers.length > 1) return 10;
    return 5;
  }, [mapMarkers.length, selectedLocationCoords]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Update URL params
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  // Handle location input change with debounced search
  const handleLocationInputChange = useCallback(async (value) => {
    setFilters((prev) => ({ ...prev, location: value }));
    setSelectedLocationCoords(null); // Reset coords when typing

    if (value.length >= 3) {
      const results = await searchLocation(value);
      setLocationSuggestions(results);
      setShowLocationSuggestions(true);
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  }, []);

  // Handle selecting a location suggestion
  const handleSelectLocationSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    // Extract short location name
    const shortName = suggestion.display_name.split(',').slice(0, 2).join(',');

    setFilters((prev) => ({ ...prev, location: shortName }));
    setSelectedLocationCoords({ lat, lng });
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);

    // Switch to map view to show the location
    setViewMode('map');
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      verifiedOnly: true,
      minPrice: '',
      maxPrice: '',
      location: '',
      hasMess: false,
    });
    setSearchQuery('');
    setSearchParams({});
    setSelectedLocationCoords(null);
    setLocationSuggestions([]);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== 'verifiedOnly'
  ).length + (searchQuery ? 1 : 0);

  if (loading) {
    return (
      <div className="properties-page">
        <div className="container">
          <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1>Verified Stays</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Finding your perfect safe accommodation...</p>
          </div>
          <div className="properties-grid">
            <SkeletonCard variant="property-card" count={6} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="properties-page">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <div className="header-content">
            <h1>Verified Stays</h1>
            <p>Find your perfect safe accommodation from our verified listings.</p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="search-section"
        >
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <HiOutlineSearch className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search rooms, locations, or amenities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="clear-search"
                >
                  <HiOutlineX size={18} />
                </button>
              )}
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={detectUserLocation}
              disabled={isDetectingLocation}
              leftIcon={<BiCurrentLocation size={18} className={isDetectingLocation ? 'spin' : ''} />}
              className="find-near-me-btn"
            >
              {isDetectingLocation ? 'Detecting...' : 'Near Me'}
            </Button>
            <Button
              type="button"
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<HiOutlineAdjustments size={18} />}
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-count">{activeFilterCount}</span>
              )}
            </Button>
          </form>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="filter-panel"
            >
              <div className="filter-grid">
                {/* Location with Autocomplete */}
                <div className="filter-group location-autocomplete">
                  <label>Location</label>
                  <div className="location-input-wrapper">
                    <HiOutlineLocationMarker size={18} className="location-icon" />
                    <input
                      type="text"
                      placeholder="Search location..."
                      value={filters.location}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      onFocus={() => filters.location.length >= 3 && setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                      className="location-search-input"
                    />
                    <button
                      type="button"
                      className={`use-my-location-btn ${isDetectingLocation ? 'detecting' : ''}`}
                      onClick={detectUserLocation}
                      disabled={isDetectingLocation}
                      title="Use my live location"
                    >
                      <BiCurrentLocation size={18} className={isDetectingLocation ? 'spin' : ''} />
                    </button>
                    {filters.location && (
                      <button
                        type="button"
                        className="clear-location"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, location: '' }));
                          setSelectedLocationCoords(null);
                          setLocationSuggestions([]);
                        }}
                      >
                        <HiOutlineX size={16} />
                      </button>
                    )}
                  </div>
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <ul className="location-suggestions">
                      {locationSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSelectLocationSuggestion(suggestion)}
                          className="location-suggestion-item"
                        >
                          <HiOutlineLocationMarker size={16} />
                          <span>{suggestion.display_name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Price Range */}
                <div className="filter-group">
                  <label>Min Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Max Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>

                {/* Toggles */}
                <div className="filter-group">
                  <label>Options</label>
                  <div className="filter-toggles">
                    <label className="toggle-option">
                      <input
                        type="checkbox"
                        checked={filters.verifiedOnly}
                        onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                      />
                      <HiOutlineShieldCheck size={16} />
                      <span>Verified Only</span>
                    </label>
                    <label className="toggle-option">
                      <input
                        type="checkbox"
                        checked={filters.hasMess}
                        onChange={(e) => handleFilterChange('hasMess', e.target.checked)}
                      />
                      <span>Mess Included</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="filter-actions">
                <Button variant="ghost" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results */}
        <div className="properties-layout">
          {/* Main Content */}
          <div className="properties-main">
            <div className="results-header">
              <p className="results-count">
                {pagination.total > 0
                  ? `${pagination.total} ${pagination.total === 1 ? 'property' : 'properties'} found`
                  : `${filteredProperties.length} ${filteredProperties.length === 1 ? 'property' : 'properties'} found`
                }
              </p>
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <HiOutlineViewGrid size={20} />
                </button>
                <button
                  className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                  title="Map View"
                >
                  <HiOutlineMap size={20} />
                </button>
              </div>
            </div>

            {error ? (
              <EmptyState
                variant="error"
                title="Failed to load properties"
                description={error}
                action={{
                  label: 'Try Again',
                  onClick: fetchProperties,
                }}
              />
            ) : filteredProperties.length === 0 ? (
              <EmptyState
                icon={HiOutlineHome}
                title="No properties found"
                description="Try adjusting your search or filters to find what you're looking for."
                action={{
                  label: 'Clear Filters',
                  onClick: clearFilters,
                  icon: <HiOutlineRefresh size={18} />,
                }}
              />
            ) : viewMode === 'map' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="map-view-container"
              >
                <MapComponent
                  center={mapCenter}
                  zoom={mapZoom}
                  markers={[
                    ...mapMarkers,
                    // Add selected location marker if exists
                    ...(selectedLocationCoords ? [{
                      id: 'selected-location',
                      lat: selectedLocationCoords.lat,
                      lng: selectedLocationCoords.lng,
                      title: filters.location,
                      description: 'Searched Location',
                      isSearchMarker: true,
                    }] : [])
                  ]}
                  height="600px"
                  interactive={true}
                  showUserLocation={true}
                  onLocationSelect={(marker) => {
                    if (marker?.id && marker.id !== 'selected-location') {
                      navigate(`/properties/${marker.id}`);
                    }
                  }}
                />

                {/* Property List Below Map */}
                <div className="map-property-list">
                  <h3 className="map-list-title">
                    {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'}
                    {filters.location && ` near "${filters.location}"`}
                  </h3>
                  {filteredProperties.length === 0 ? (
                    <div className="no-properties-message">
                      <p>No properties found in this area. Try a different location.</p>
                    </div>
                  ) : (
                    filteredProperties.map((property) => (
                      <div
                        key={property._id}
                        className="map-property-item"
                        onClick={() => navigate(`/properties/${property._id}`)}
                      >
                        <div className="map-property-image">
                          {property.images?.[0] ? (
                            <img src={`${property.images[0]?.startsWith('http') ? '' : (process.env.REACT_APP_API_BASE_URL ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') : (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:4000'))}${property.images[0]}`} alt={property.title} />
                          ) : (
                            <HiOutlineHome size={24} />
                          )}
                        </div>
                        <div className="map-property-info">
                          <h4>{property.title}</h4>
                          <p className="map-property-location">
                            <HiOutlineLocationMarker size={14} />
                            {property.location || 'Location not specified'}
                          </p>
                          <span className="map-property-price">₹{property.rent?.toLocaleString()}/month</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="properties-grid">
                {filteredProperties.map((property, index) => (
                  <motion.div
                    key={property._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <HiOutlineChevronLeft size={18} />
                  Previous
                </button>
                <div className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <button
                  className="pagination-btn"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                  <HiOutlineChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default PropertiesPage;
