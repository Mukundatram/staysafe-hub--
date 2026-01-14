import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineLocationMarker,
  HiOutlineCurrencyRupee,
  HiOutlineStar,
  HiOutlineCheck,
  HiOutlineAdjustments,
  HiOutlineRefresh
} from 'react-icons/hi';
import Button from '../ui/Button';

const SearchFilters = ({ 
  onFilterChange, 
  filterOptions = {}, 
  initialFilters = {},
  isLoading = false 
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    amenities: [],
    hasMessService: '',
    sortBy: 'newest',
    ...initialFilters
  });

  const { 
    amenities: availableAmenities = [], 
    priceRange = { min: 0, max: 50000 },
    locations = [] 
  } = filterOptions;

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating_desc', label: 'Highest Rated' }
  ];

  const ratingOptions = [
    { value: '', label: 'Any Rating' },
    { value: '4', label: '4+ Stars' },
    { value: '3', label: '3+ Stars' },
    { value: '2', label: '2+ Stars' }
  ];

  const commonAmenities = [
    'WiFi', 'AC', 'Parking', 'Laundry', 'TV', 'Gym', 
    'Security', 'Power Backup', 'Hot Water', 'Furnished'
  ];

  const amenityList = availableAmenities.length > 0 
    ? availableAmenities 
    : commonAmenities;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFilters(prev => {
      const current = prev.amenities || [];
      const updated = current.includes(amenity)
        ? current.filter(a => a !== amenity)
        : [...current, amenity];
      return { ...prev, amenities: updated };
    });
  };

  const applyFilters = () => {
    onFilterChange(filters);
    setShowMobileFilters(false);
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      amenities: [],
      hasMessService: '',
      sortBy: 'newest'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  // Auto-apply search on enter
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const activeFilterCount = [
    filters.search,
    filters.location,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.hasMessService,
    ...(filters.amenities || [])
  ].filter(Boolean).length;

  const FiltersContent = () => (
    <div className="filters-content">
      {/* Search Input */}
      <div className="filter-section">
        <label className="filter-label">
          <HiOutlineSearch size={16} />
          Search
        </label>
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="filter-input"
          />
        </div>
      </div>

      {/* Location Filter */}
      <div className="filter-section">
        <label className="filter-label">
          <HiOutlineLocationMarker size={16} />
          Location
        </label>
        <select
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="filter-select"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <label className="filter-label">
          <HiOutlineCurrencyRupee size={16} />
          Price Range
        </label>
        <div className="price-range">
          <input
            type="number"
            placeholder={`Min (${priceRange.min})`}
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="filter-input price-input"
            min="0"
          />
          <span className="price-separator">to</span>
          <input
            type="number"
            placeholder={`Max (${priceRange.max})`}
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="filter-input price-input"
            min="0"
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div className="filter-section">
        <label className="filter-label">
          <HiOutlineStar size={16} />
          Minimum Rating
        </label>
        <div className="rating-options">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rating-option ${filters.minRating === option.value ? 'active' : ''}`}
              onClick={() => handleFilterChange('minRating', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mess Service Filter */}
      <div className="filter-section">
        <label className="filter-label">
          <HiOutlineAdjustments size={16} />
          Mess Service
        </label>
        <div className="toggle-options">
          <button
            type="button"
            className={`toggle-option ${filters.hasMessService === '' ? 'active' : ''}`}
            onClick={() => handleFilterChange('hasMessService', '')}
          >
            All
          </button>
          <button
            type="button"
            className={`toggle-option ${filters.hasMessService === 'true' ? 'active' : ''}`}
            onClick={() => handleFilterChange('hasMessService', 'true')}
          >
            With Mess
          </button>
          <button
            type="button"
            className={`toggle-option ${filters.hasMessService === 'false' ? 'active' : ''}`}
            onClick={() => handleFilterChange('hasMessService', 'false')}
          >
            Without Mess
          </button>
        </div>
      </div>

      {/* Amenities */}
      <div className="filter-section">
        <label className="filter-label">
          <HiOutlineCheck size={16} />
          Amenities
        </label>
        <div className="amenities-grid">
          {amenityList.map((amenity) => (
            <button
              key={amenity}
              type="button"
              className={`amenity-chip ${(filters.amenities || []).includes(amenity) ? 'active' : ''}`}
              onClick={() => handleAmenityToggle(amenity)}
            >
              {amenity}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="filter-section">
        <label className="filter-label">Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="filter-select"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="filter-actions">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetFilters}
          leftIcon={<HiOutlineRefresh size={16} />}
        >
          Reset
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={applyFilters}
          disabled={isLoading}
          leftIcon={<HiOutlineSearch size={16} />}
        >
          {isLoading ? 'Searching...' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filters Sidebar */}
      <div className="filters-sidebar desktop-only">
        <div className="filters-header">
          <h3>
            <HiOutlineFilter size={20} />
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="filter-count">{activeFilterCount} active</span>
          )}
        </div>
        <FiltersContent />
      </div>

      {/* Mobile Filter Button */}
      <button 
        className="mobile-filter-btn mobile-only"
        onClick={() => setShowMobileFilters(true)}
      >
        <HiOutlineFilter size={20} />
        Filters
        {activeFilterCount > 0 && (
          <span className="filter-badge">{activeFilterCount}</span>
        )}
      </button>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-filters-overlay"
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="mobile-filters-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-filters-header">
                <h3>Filters</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <HiOutlineX size={24} />
                </button>
              </div>
              <FiltersContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .filters-sidebar {
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 100px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .filters-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          margin: 0;
        }

        .filter-count {
          font-size: 0.75rem;
          background: var(--primary);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
        }

        .filter-section {
          margin-bottom: 1.5rem;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .filter-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          background: var(--bg-secondary);
          transition: all 0.2s;
        }

        .filter-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .filter-select {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          background: var(--bg-secondary);
          cursor: pointer;
        }

        .price-range {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .price-input {
          flex: 1;
        }

        .price-separator {
          color: var(--text-tertiary);
          font-size: 0.875rem;
        }

        .rating-options, .toggle-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .rating-option, .toggle-option {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rating-option:hover, .toggle-option:hover {
          border-color: var(--primary);
        }

        .rating-option.active, .toggle-option.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .amenities-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .amenity-chip {
          padding: 0.375rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          background: var(--bg-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .amenity-chip:hover {
          border-color: var(--primary);
        }

        .amenity-chip.active {
          background: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary);
        }

        .filter-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .filter-actions button {
          flex: 1;
        }

        /* Mobile */
        .desktop-only {
          display: block;
        }

        .mobile-only {
          display: none;
        }

        .mobile-filter-btn {
          display: none;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          position: relative;
        }

        .filter-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary);
          color: white;
          font-size: 0.7rem;
          border-radius: 50%;
        }

        .mobile-filters-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .mobile-filters-panel {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 100%;
          max-width: 400px;
          background: var(--bg-primary);
          padding: 1.5rem;
          overflow-y: auto;
        }

        .mobile-filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .mobile-filters-header h3 {
          font-size: 1.25rem;
          margin: 0;
        }

        .close-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
        }

        @media (max-width: 1024px) {
          .desktop-only {
            display: none;
          }

          .mobile-only, .mobile-filter-btn {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};

export default SearchFilters;
