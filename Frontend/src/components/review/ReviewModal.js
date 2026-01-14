import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiStar, 
  HiOutlineStar,
  HiX 
} from 'react-icons/hi';
import { reviewService } from '../../services/propertyService';
import toast from 'react-hot-toast';

const ReviewModal = ({ isOpen, onClose, booking, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    location: 0,
    value: 0,
    communication: 0,
    amenities: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const ratingCategories = [
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'location', label: 'Location' },
    { key: 'value', label: 'Value for Money' },
    { key: 'communication', label: 'Owner Communication' },
    { key: 'amenities', label: 'Amenities' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select an overall rating');
      return;
    }
    if (!title.trim()) {
      toast.error('Please add a review title');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please add a review comment');
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.create({
        bookingId: booking._id,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        ratings
      });
      
      toast.success('Review submitted successfully!');
      onReviewSubmitted?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value, onChange, onHover, size = 24) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="star-btn"
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(0)}
          >
            {star <= (onHover ? (hoverRating || value) : value) ? (
              <HiStar size={size} className="star-filled" />
            ) : (
              <HiOutlineStar size={size} className="star-empty" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const renderCategoryStars = (category) => {
    return (
      <div className="category-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="star-btn small"
            onClick={() => setRatings(prev => ({ ...prev, [category]: star }))}
          >
            {star <= ratings[category] ? (
              <HiStar size={18} className="star-filled" />
            ) : (
              <HiOutlineStar size={18} className="star-empty" />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="review-modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="review-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="review-modal-header">
            <h2>Write a Review</h2>
            <p className="property-name">{booking?.property?.title}</p>
            <button className="close-btn" onClick={onClose}>
              <HiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="review-form">
            {/* Overall Rating */}
            <div className="form-section">
              <label className="section-label">Overall Rating *</label>
              {renderStars(rating, setRating, setHoverRating, 32)}
              <span className="rating-text">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            </div>

            {/* Category Ratings */}
            <div className="form-section">
              <label className="section-label">Rate Specific Aspects (Optional)</label>
              <div className="category-ratings">
                {ratingCategories.map((cat) => (
                  <div key={cat.key} className="category-item">
                    <span className="category-label">{cat.label}</span>
                    {renderCategoryStars(cat.key)}
                  </div>
                ))}
              </div>
            </div>

            {/* Review Title */}
            <div className="form-section">
              <label className="section-label">Review Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                maxLength={100}
                className="review-input"
              />
            </div>

            {/* Review Comment */}
            <div className="form-section">
              <label className="section-label">Your Review *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this property. What did you like or dislike?"
                maxLength={1000}
                rows={5}
                className="review-textarea"
              />
              <span className="char-count">{comment.length}/1000</span>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      <style>{`
        .review-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .review-modal {
          background: var(--bg-primary);
          border-radius: 20px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .review-modal-header {
          position: relative;
          padding: 24px 24px 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .review-modal-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
        }

        .property-name {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: var(--bg-secondary);
          border: none;
          border-radius: 10px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .review-form {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .section-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 10px;
        }

        .star-rating {
          display: flex;
          gap: 4px;
        }

        .star-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .star-btn:hover {
          transform: scale(1.1);
        }

        .star-filled {
          color: #f59e0b;
        }

        .star-empty {
          color: #d1d5db;
        }

        .rating-text {
          display: inline-block;
          margin-left: 12px;
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .category-ratings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .category-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .category-stars {
          display: flex;
          gap: 2px;
        }

        .star-btn.small {
          padding: 2px;
        }

        .review-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          font-size: 14px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .review-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .review-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          font-size: 14px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .review-textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 6px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .btn-cancel {
          padding: 12px 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover {
          background: var(--bg-tertiary);
        }

        .btn-submit {
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .review-modal {
            max-height: 100vh;
            border-radius: 0;
          }

          .category-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default ReviewModal;
