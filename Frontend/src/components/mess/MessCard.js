import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineLocationMarker,
  HiOutlineStar,
  HiOutlineUserGroup,
  HiOutlineBadgeCheck,
  HiOutlineCurrencyRupee
} from 'react-icons/hi';
import Badge from '../ui/Badge';

// Demo placeholder images for mess services
const demoMessImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'
];

const MessCard = ({ mess, onSubscribe }) => {
  const {
    _id,
    name,
    description,
    location,
    images,
    averageRating,
    totalReviews,
    cuisineType,
    mealTypes,
    pricing,
    features,
    isVerified,
    currentSubscribers,
    maxSubscribers
  } = mess;

  // Get image URL - use uploaded images or random demo image
  const getImageUrl = () => {
    if (images && images.length > 0) {
      // Check if it's already a full URL or needs base URL
      if (images[0].startsWith('http')) {
        return images[0];
      }
      return `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${images[0]}`;
    }
    // Use a random demo image based on the mess id for consistency
    const randomIndex = _id ? _id.charCodeAt(_id.length - 1) % demoMessImages.length : 0;
    return demoMessImages[randomIndex];
  };

  const imageUrl = getImageUrl();

  // Extract location string - handle both string and object formats
  const getLocationString = () => {
    if (!location) return 'Location not specified';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      // Try common location object properties
      return location.address || location.area || location.city || location.formatted || 'Location not specified';
    }
    return 'Location not specified';
  };

  const locationString = getLocationString();

  const monthlyPrice = pricing?.monthly?.allMeals || pricing?.monthly?.lunch || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mess-card"
    >
      <Link to={`/mess/${_id}`} className="mess-card-link">
        <div className="mess-card-image">
          <img src={imageUrl} alt={name} />
          {isVerified && (
            <div className="verified-badge">
              <HiOutlineBadgeCheck size={16} />
              Verified
            </div>
          )}
          <div className="cuisine-badges">
            {cuisineType?.slice(0, 2).map((cuisine, index) => (
              <Badge key={index} variant="light" size="sm">
                {cuisine}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mess-card-content">
          <div className="mess-card-header">
            <h3 className="mess-name">{name}</h3>
            {averageRating > 0 && (
              <div className="mess-rating">
                <HiOutlineStar className="star-icon" />
                <span>{averageRating.toFixed(1)}</span>
                <span className="review-count">({totalReviews})</span>
              </div>
            )}
          </div>

          <div className="mess-location">
            <HiOutlineLocationMarker />
            <span>{locationString}</span>
          </div>

          {description && (
            <p className="mess-description">
              {description.length > 80 ? `${description.substring(0, 80)}...` : description}
            </p>
          )}

          <div className="mess-meals">
            {mealTypes?.map((meal, index) => (
              <span key={index} className="meal-tag">{meal}</span>
            ))}
          </div>

          <div className="mess-features">
            {features?.slice(0, 3).map((feature, index) => (
              <span key={index} className="feature-tag">✓ {feature}</span>
            ))}
          </div>

          <div className="mess-card-footer">
            <div className="mess-price">
              <HiOutlineCurrencyRupee />
              <span className="price-amount">₹{monthlyPrice}</span>
              <span className="price-period">/month</span>
            </div>
            <div className="mess-subscribers">
              <HiOutlineUserGroup />
              <span>{currentSubscribers || 0}/{maxSubscribers}</span>
            </div>
          </div>
        </div>
      </Link>

      <style jsx>{`
        .mess-card {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
          border: 1px solid var(--border-light);
        }

        .mess-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--accent-primary);
        }

        .mess-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .mess-card-image {
          position: relative;
          height: 180px;
          overflow: hidden;
        }

        .mess-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .mess-card:hover .mess-card-image img {
          transform: scale(1.05);
        }

        .verified-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--success);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-full);
        }

        .cuisine-badges {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: flex;
          gap: 6px;
        }

        .mess-card-content {
          padding: 1rem;
        }

        .mess-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .mess-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          flex: 1;
        }

        .mess-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .star-icon {
          color: #f59e0b;
          fill: #f59e0b;
        }

        .review-count {
          color: var(--text-tertiary);
          font-weight: 400;
        }

        .mess-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .mess-description {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .mess-meals {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 0.5rem;
        }

        .meal-tag {
          font-size: 0.75rem;
          padding: 2px 8px;
          background: var(--accent-primary-alpha);
          color: var(--accent-primary);
          border-radius: var(--radius-full);
          font-weight: 500;
        }

        .mess-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 0.75rem;
        }

        .feature-tag {
          font-size: 0.75rem;
          color: var(--success);
        }

        .mess-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-light);
        }

        .mess-price {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .price-amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .price-period {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .mess-subscribers {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      `}</style>
    </motion.div>
  );
};

export default MessCard;
