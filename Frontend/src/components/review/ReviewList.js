import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiStar, 
  HiOutlineThumbUp,
  HiThumbUp,
  HiOutlineChevronDown,
  HiOutlineFilter
} from 'react-icons/hi';
import { reviewService } from '../../services/propertyService';
import { formatDistanceToNow } from 'date-fns';

const ReviewList = ({ propertyId, averageRating = 0, reviewCount = 0, ratingBreakdown = {} }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [ratingDistribution, setRatingDistribution] = useState({});
  const [sortBy, setSortBy] = useState('newest');
  const [helpedReviews, setHelpedReviews] = useState(new Set());

  const fetchReviews = React.useCallback(async (page = 1, sort = sortBy) => {
    try {
      setLoading(true);
      const data = await reviewService.getPropertyReviews(propertyId, page, 5, sort);
      setReviews(data.reviews || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      setRatingDistribution(data.ratingDistribution || {});
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyId, sortBy]);

  useEffect(() => {
    if (propertyId) {
      fetchReviews(1, sortBy);
    }
  }, [propertyId, sortBy, fetchReviews]);

  const handleMarkHelpful = async (reviewId) => {
    if (helpedReviews.has(reviewId)) return;
    
    try {
      await reviewService.markHelpful(reviewId);
      setHelpedReviews(prev => new Set([...prev, reviewId]));
      setReviews(prev => 
        prev.map(r => r._id === reviewId ? { ...r, helpfulVotes: r.helpfulVotes + 1 } : r)
      );
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const renderStars = (rating, size = 16) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiStar 
            key={star} 
            size={size} 
            className={star <= rating ? 'star-filled' : 'star-empty'} 
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating) => {
    if (reviewCount === 0) return 0;
    return Math.round((ratingDistribution[rating] || 0) / reviewCount * 100);
  };

  const categories = [
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'location', label: 'Location' },
    { key: 'value', label: 'Value' },
    { key: 'communication', label: 'Communication' },
    { key: 'amenities', label: 'Amenities' }
  ];

  return (
    <div className="reviews-section">
      {/* Reviews Header */}
      <div className="reviews-header">
        <div className="rating-summary">
          <div className="overall-rating">
            <HiStar size={28} className="star-filled" />
            <span className="rating-number">{averageRating.toFixed(1)}</span>
            <span className="rating-count">({reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      {reviewCount > 0 && (
        <>
          {/* Rating Breakdown */}
          <div className="rating-breakdown-grid">
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="rating-bar-row">
                  <span className="bar-label">{rating}</span>
                  <HiStar size={14} className="star-filled" />
                  <div className="bar-track">
                    <motion.div 
                      className="bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${getRatingPercentage(rating)}%` }}
                      transition={{ duration: 0.5, delay: rating * 0.1 }}
                    />
                  </div>
                  <span className="bar-count">{ratingDistribution[rating] || 0}</span>
                </div>
              ))}
            </div>

            <div className="category-breakdown">
              {categories.map((cat) => (
                <div key={cat.key} className="category-row">
                  <span className="category-name">{cat.label}</span>
                  <div className="category-rating">
                    <span className="category-value">
                      {(ratingBreakdown[cat.key] || 0).toFixed(1)}
                    </span>
                    {renderStars(Math.round(ratingBreakdown[cat.key] || 0), 12)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="reviews-controls">
            <span className="reviews-title">Reviews</span>
            <div className="sort-dropdown">
              <HiOutlineFilter size={16} />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <HiOutlineChevronDown size={16} />
            </div>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="reviews-loading">
              <div className="spinner"></div>
              <p>Loading reviews...</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map((review, index) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="review-card"
                >
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.student?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="reviewer-details">
                        <span className="reviewer-name">{review.student?.name || 'Anonymous'}</span>
                        <span className="review-date">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating, 18)}
                    </div>
                  </div>

                  <h4 className="review-title">{review.title}</h4>
                  <p className="review-comment">{review.comment}</p>

                  {/* Category Ratings */}
                  {review.ratings && Object.values(review.ratings).some(v => v > 0) && (
                    <div className="review-categories">
                      {categories.map((cat) => (
                        review.ratings[cat.key] > 0 && (
                          <span key={cat.key} className="category-badge">
                            {cat.label}: {review.ratings[cat.key]}
                          </span>
                        )
                      ))}
                    </div>
                  )}

                  {/* Owner Response */}
                  {review.ownerResponse?.comment && (
                    <div className="owner-response">
                      <span className="response-label">Owner's Response:</span>
                      <p>{review.ownerResponse.comment}</p>
                    </div>
                  )}

                  {/* Helpful Button */}
                  <div className="review-actions">
                    <button 
                      className={`helpful-btn ${helpedReviews.has(review._id) ? 'helped' : ''}`}
                      onClick={() => handleMarkHelpful(review._id)}
                      disabled={helpedReviews.has(review._id)}
                    >
                      {helpedReviews.has(review._id) ? (
                        <HiThumbUp size={16} />
                      ) : (
                        <HiOutlineThumbUp size={16} />
                      )}
                      Helpful ({review.helpfulVotes})
                    </button>
                    {review.isVerified && (
                      <span className="verified-badge">✓ Verified Stay</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="reviews-pagination">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`page-btn ${pagination.page === page ? 'active' : ''}`}
                  onClick={() => fetchReviews(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {reviewCount === 0 && !loading && (
        <div className="no-reviews">
          <p>No reviews yet. Be the first to review this property!</p>
        </div>
      )}

      <style>{`
        .reviews-section {
          margin-top: 40px;
          padding-top: 40px;
          border-top: 1px solid var(--border-color);
        }

        .reviews-header {
          margin-bottom: 24px;
        }

        .overall-rating {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rating-number {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .rating-count {
          font-size: 16px;
          color: var(--text-secondary);
        }

        .rating-breakdown-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
          padding: 24px;
          background: var(--bg-secondary);
          border-radius: 16px;
        }

        .rating-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rating-bar-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bar-label {
          width: 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .bar-track {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          border-radius: 4px;
        }

        .bar-count {
          width: 24px;
          font-size: 12px;
          color: var(--text-muted);
          text-align: right;
        }

        .category-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .category-name {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .category-rating {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .reviews-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .reviews-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sort-dropdown {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border-radius: 10px;
          color: var(--text-secondary);
        }

        .sort-dropdown select {
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 13px;
          cursor: pointer;
          appearance: none;
        }

        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .review-card {
          padding: 24px;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
        }

        .review-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .reviewer-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
        }

        .reviewer-details {
          display: flex;
          flex-direction: column;
        }

        .reviewer-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .review-date {
          font-size: 12px;
          color: var(--text-muted);
        }

        .review-rating {
          display: flex;
        }

        .stars-display {
          display: flex;
          gap: 2px;
        }

        .star-filled {
          color: #f59e0b;
        }

        .star-empty {
          color: #e5e7eb;
        }

        .review-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px;
        }

        .review-comment {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 12px;
        }

        .review-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .category-badge {
          padding: 4px 10px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .owner-response {
          margin-top: 16px;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          border-left: 3px solid var(--primary);
        }

        .response-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary);
          display: block;
          margin-bottom: 8px;
        }

        .owner-response p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .review-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .helpful-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--bg-tertiary);
          border: none;
          border-radius: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .helpful-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
        }

        .helpful-btn.helped {
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary);
        }

        .helpful-btn:disabled {
          cursor: default;
        }

        .verified-badge {
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }

        .reviews-pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }

        .page-btn {
          width: 36px;
          height: 36px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-btn:hover, .page-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .reviews-loading, .no-reviews {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-color);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .rating-breakdown-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .review-header {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ReviewList;
