import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { messService } from '../../services/messService';
import { MessCard } from '../../components/mess';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineLocationMarker
} from 'react-icons/hi';

const MessServicesPage = () => {
  const [messServices, setMessServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    cuisineType: [],
    mealType: [],
    minPrice: '',
    maxPrice: '',
    features: [],
    minRating: '',
    sortBy: 'newest'
  });

  const cuisineOptions = [
    'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 
    'North Indian', 'South Indian', 'Chinese', 'Multi-Cuisine'
  ];

  const mealOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'All Meals'];

  const featureOptions = [
    'Home Delivery', 'Takeaway', 'Dine-in', 'AC Dining',
    'Pure Veg', 'Hygiene Certified', 'Weekly Menu Change',
    'Tiffin Service', 'Student Discount', 'Trial Meal Available'
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' }
  ];

  const fetchMessServices = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const queryFilters = { ...filters, page, limit: 12 };
      const response = await messService.getAll(queryFilters);
      setMessServices(response.messServices || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching mess services:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, messService]);

  useEffect(() => {
    fetchMessServices();
  }, [fetchMessServices]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMessServices(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFilterToggle = (key, value) => {
    setFilters(prev => {
      const currentValues = prev[key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [key]: newValues };
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      cuisineType: [],
      mealType: [],
      minPrice: '',
      maxPrice: '',
      features: [],
      minRating: '',
      sortBy: 'newest'
    });
  };

  const applyFilters = () => {
    fetchMessServices(1);
    setShowFilters(false);
  };

  const hasActiveFilters = () => {
    return filters.location || 
           filters.cuisineType.length > 0 || 
           filters.mealType.length > 0 ||
           filters.features.length > 0 ||
           filters.minPrice || 
           filters.maxPrice ||
           filters.minRating;
  };

  return (
    <div className="mess-services-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>🍽️ Mess Services</h1>
            <p>Find hygienic and affordable mess & tiffin services near you</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <HiOutlineSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or area..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
            <div className="location-input-wrapper">
              <HiOutlineLocationMarker className="location-icon" />
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="location-input"
              />
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
          </form>

          <div className="filter-actions">
            <button 
              className={`filter-toggle-btn ${hasActiveFilters() ? 'has-filters' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <HiOutlineFilter />
              Filters
              {hasActiveFilters() && <span className="filter-count">{
                (filters.cuisineType.length || 0) + 
                (filters.mealType.length || 0) + 
                (filters.features.length || 0) +
                (filters.minPrice ? 1 : 0) +
                (filters.maxPrice ? 1 : 0) +
                (filters.minRating ? 1 : 0)
              }</span>}
            </button>

            <select
              className="sort-select"
              value={filters.sortBy}
              onChange={(e) => {
                handleFilterChange('sortBy', e.target.value);
                fetchMessServices(1);
              }}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="filters-panel"
            >
              <div className="filters-content">
                {/* Cuisine Type */}
                <div className="filter-group">
                  <h4>Cuisine Type</h4>
                  <div className="filter-options">
                    {cuisineOptions.map(cuisine => (
                      <button
                        key={cuisine}
                        className={`filter-chip ${filters.cuisineType.includes(cuisine) ? 'active' : ''}`}
                        onClick={() => handleArrayFilterToggle('cuisineType', cuisine)}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meal Type */}
                <div className="filter-group">
                  <h4>Meal Type</h4>
                  <div className="filter-options">
                    {mealOptions.map(meal => (
                      <button
                        key={meal}
                        className={`filter-chip ${filters.mealType.includes(meal) ? 'active' : ''}`}
                        onClick={() => handleArrayFilterToggle('mealType', meal)}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="filter-group">
                  <h4>Monthly Price Range (₹)</h4>
                  <div className="price-range">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="price-input"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="price-input"
                    />
                  </div>
                </div>

                {/* Min Rating */}
                <div className="filter-group">
                  <h4>Minimum Rating</h4>
                  <div className="rating-options">
                    {[4, 3, 2].map(rating => (
                      <button
                        key={rating}
                        className={`rating-chip ${filters.minRating === String(rating) ? 'active' : ''}`}
                        onClick={() => handleFilterChange('minRating', 
                          filters.minRating === String(rating) ? '' : String(rating)
                        )}
                      >
                        {rating}+ ⭐
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="filter-group">
                  <h4>Features</h4>
                  <div className="filter-options">
                    {featureOptions.map(feature => (
                      <button
                        key={feature}
                        className={`filter-chip ${filters.features.includes(feature) ? 'active' : ''}`}
                        onClick={() => handleArrayFilterToggle('features', feature)}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="filters-actions">
                <Button variant="secondary" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button variant="primary" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="results-section">
          {loading ? (
            <Loading text="Finding mess services..." />
          ) : messServices.length === 0 ? (
            <EmptyState
              icon={<span style={{ fontSize: '4rem' }}>🍽️</span>}
              title="No mess services found"
              description="Try adjusting your filters or search in a different area"
              action={
                <Button variant="primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="results-header">
                <p className="results-count">
                  Showing <strong>{messServices.length}</strong> of <strong>{pagination.total}</strong> mess services
                </p>
              </div>

              <div className="mess-grid">
                {messServices.map((mess, index) => (
                  <MessCard key={mess._id} mess={mess} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <Button
                    variant="secondary"
                    disabled={pagination.page === 1}
                    onClick={() => fetchMessServices(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="page-info">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchMessServices(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .mess-services-page {
          min-height: calc(100vh - 80px);
          padding: 2rem 0 4rem;
          background: var(--bg-secondary);
        }

        .page-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: var(--text-secondary);
        }

        .search-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        .search-form {
          display: flex;
          flex: 1;
          gap: 0.75rem;
          min-width: 300px;
        }

        .search-input-wrapper,
        .location-input-wrapper {
          position: relative;
          flex: 1;
        }

        .search-icon,
        .location-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
        }

        .search-input,
        .location-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          font-size: 1rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .search-input:focus,
        .location-input:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .filter-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-toggle-btn:hover,
        .filter-toggle-btn.has-filters {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .filter-count {
          background: var(--accent-primary);
          color: white;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .sort-select {
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          color: var(--text-primary);
          cursor: pointer;
        }

        .filters-panel {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          margin-bottom: 1.5rem;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .filters-content {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .filter-group h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }

        .filter-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .filter-chip {
          padding: 0.5rem 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-chip:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .filter-chip.active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }

        .price-range {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .price-input {
          width: 100px;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .rating-options {
          display: flex;
          gap: 0.5rem;
        }

        .rating-chip {
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .rating-chip.active {
          background: var(--warning);
          border-color: var(--warning);
          color: white;
        }

        .filters-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-light);
          background: var(--bg-tertiary);
        }

        .results-header {
          margin-bottom: 1rem;
        }

        .results-count {
          color: var(--text-secondary);
        }

        .mess-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .page-info {
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .search-form {
            flex-direction: column;
          }

          .filter-actions {
            width: 100%;
            justify-content: space-between;
          }

          .filters-content {
            grid-template-columns: 1fr;
          }

          .mess-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MessServicesPage;
