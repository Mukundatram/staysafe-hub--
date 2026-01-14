import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineLocationMarker,
  HiOutlineCurrencyRupee,
  HiOutlineShieldCheck,
  HiOutlineHeart,
  HiHeart,
  HiOutlineCheck
} from 'react-icons/hi';

const PropertyCard = ({ property, showActions = true }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  
  const {
    _id,
    title,
    description,
    rent,
    location,
    amenities = [],
    meals = [],
    images = [],
    isAvailable,
  } = property;

  const isFavorite = isInWishlist(_id);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(_id, title);
  };

  // Use actual property image if available, otherwise use placeholder
  const imageUrl = images && images.length > 0 
    ? `http://localhost:4000${images[0]}` 
    : `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop&auto=format`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="property-card"
    >
      <Link to={`/properties/${_id}`} className="property-link">
        {/* Image */}
        <div className="property-image">
          <img src={imageUrl} alt={title} loading="lazy" />
          <div className="image-overlay">
            {isAvailable ? (
              <Badge variant="success" icon={<HiOutlineCheck size={12} />}>
                Available
              </Badge>
            ) : (
              <Badge variant="warning">Booked</Badge>
            )}
          </div>
          {showActions && user && (
            <button 
              className={`wishlist-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleWishlistClick}
              title={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isFavorite ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="property-content">
          {/* Header */}
          <div className="property-header">
            <div className="verified-badge">
              <HiOutlineShieldCheck size={16} />
              <span>Verified</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="property-title">{title}</h3>

          {/* Location */}
          <div className="property-location">
            <HiOutlineLocationMarker size={16} />
            <span>{location || 'Location not specified'}</span>
          </div>

          {/* Description */}
          {description && (
            <p className="property-description">{description}</p>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="property-amenities">
              {amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="amenity-tag">{amenity}</span>
              ))}
              {amenities.length > 3 && (
                <span className="amenity-more">+{amenities.length - 3}</span>
              )}
            </div>
          )}

          {/* Meals */}
          {meals.length > 0 && (
            <div className="property-meals">
              <span className="meals-label">Meals:</span>
              <span className="meals-value">{meals.join(', ')}</span>
            </div>
          )}

          {/* Footer */}
          <div className="property-footer">
            <div className="property-price">
              <HiOutlineCurrencyRupee size={18} />
              <span className="price-value">{rent?.toLocaleString() || 'N/A'}</span>
              <span className="price-period">/month</span>
            </div>
            <span className="view-details">View Details →</span>
          </div>
        </div>
      </Link>

      <style>{`
        .property-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .property-card:hover {
          box-shadow: var(--shadow-lg);
          border-color: var(--accent-primary);
        }

        .property-link {
          display: block;
        }

        .property-image {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
        }

        .property-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-slow);
        }

        .property-card:hover .property-image img {
          transform: scale(1.05);
        }

        .image-overlay {
          position: absolute;
          top: 1rem;
          left: 1rem;
        }

        .wishlist-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-glass);
          backdrop-filter: blur(8px);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          transition: all var(--transition-fast);
          cursor: pointer;
          border: none;
        }

        .wishlist-btn:hover {
          background: var(--error);
          color: white;
          transform: scale(1.1);
        }

        .wishlist-btn.active {
          background: var(--error);
          color: white;
        }

        .wishlist-btn.active:hover {
          background: var(--error-dark, #dc2626);
        }

        .property-content {
          padding: 1.25rem;
        }

        .property-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .verified-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--success);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .property-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .property-location {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }

        .property-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .property-amenities {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .amenity-tag {
          padding: 0.25rem 0.625rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .amenity-more {
          padding: 0.25rem 0.625rem;
          background: var(--accent-gradient-soft);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--accent-primary);
          font-weight: 500;
        }

        .property-meals {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          margin-bottom: 1rem;
        }

        .meals-label {
          color: var(--text-tertiary);
        }

        .meals-value {
          color: var(--text-secondary);
        }

        .property-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
        }

        .property-price {
          display: flex;
          align-items: center;
          color: var(--text-primary);
        }

        .price-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .price-period {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          margin-left: 0.25rem;
        }

        .view-details {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent-primary);
          transition: transform var(--transition-fast);
        }

        .property-card:hover .view-details {
          transform: translateX(4px);
        }
      `}</style>
    </motion.div>
  );
};

export default PropertyCard;
