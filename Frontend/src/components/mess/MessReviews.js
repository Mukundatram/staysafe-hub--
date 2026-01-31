import React, { useState, useEffect } from 'react';
import { reviewService } from '../../services/propertyService';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import { HiStar, HiOutlineUserCircle } from 'react-icons/hi';
import { format } from 'date-fns';

const MessReviews = ({ messId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const data = await reviewService.getMessReviews(messId);
                setReviews(data.reviews);
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        if (messId) {
            fetchReviews();
        }
    }, [messId]);

    if (loading) return <Loading size="sm" />;

    if (reviews.length === 0) {
        return (
            <EmptyState
                icon={HiStar}
                title="No reviews yet"
                description="Be the first to review this mess service!"
            />
        );
    }

    return (
        <div className="mess-reviews">
            <div className="reviews-list">
                {reviews.map((review) => (
                    <div key={review._id} className="review-item" style={{ borderBottom: '1px solid #eee', padding: '1rem 0' }}>
                        <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div className="reviewer-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <HiOutlineUserCircle size={24} color="#666" />
                                <div>
                                    <span style={{ fontWeight: '600', display: 'block' }}>{review.student?.name || 'Student'}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                            <div className="review-rating" style={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                                <span style={{ fontWeight: 'bold', marginRight: '0.25rem' }}>{review.rating}</span>
                                <HiStar />
                            </div>
                        </div>
                        <h4 style={{ margin: '0.5rem 0', fontSize: '1rem' }}>{review.title}</h4>
                        <p style={{ color: '#444', lineHeight: '1.5' }}>{review.comment}</p>

                        {/* Owner Response */}
                        {review.ownerResponse && (
                            <div className="owner-response" style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginTop: '1rem', borderLeft: '3px solid #6366f1' }}>
                                <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Owner's Response:</p>
                                <p style={{ fontSize: '0.9rem', color: '#555' }}>{review.ownerResponse.comment}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MessReviews;
