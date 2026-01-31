import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineHeart,
  HiOutlineShare,
  HiOutlineCheck,
  HiOutlineUsers,
  HiOutlineCurrencyRupee,
  HiOutlineCalendar,
  HiOutlineBadgeCheck,
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiStar
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import messService from '../../services/messService';
import Loading from '../../components/ui/Loading';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { ChatModal } from '../../components/chat';
import { HiOutlineChatAlt2 } from 'react-icons/hi';
import toast from 'react-hot-toast';
import MessReviews from '../../components/mess/MessReviews';

const MessDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('menu');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    plan: 'monthly',
    selectedMeals: ['lunch', 'dinner'],
    deliveryPreference: 'pickup'
  });
  const [subscribing, setSubscribing] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (isAuthenticated) {
        try {
          const subs = await messService.getMySubscriptions();
          const active = subs.some(s => ['Active', 'Pending'].includes(s.status));
          setHasActiveSubscription(active);
        } catch (err) {
          console.error('Failed to check subscription status:', err);
        }
      }
    };
    checkSubscription();
  }, [isAuthenticated]);

  const fetchMessDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await messService.getById(id);
      setMess(response);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load mess details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMessDetails();
  }, [fetchMessDetails]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/mess/${id}` } });
      return;
    }

    try {
      setSubscribing(true);
      // Send correct plan value to backend
      const subscriptionPayload = {
        ...subscriptionData,
        plan: getSubscriptionPlan(),
        startDate: new Date().toISOString()
      };
      await messService.subscribe(id, subscriptionPayload);
      setShowSubscribeModal(false);
      toast.success('Subscription request sent successfully! Redirecting to dashboard...', { duration: 3000 });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.error('Please login to save');
      return;
    }
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from favorites' : 'Added to favorites');
  };

  const getMonthlyPrice = () => {
    const { selectedMeals, plan } = subscriptionData;
    if (!mess?.pricing) return 0;

    if (plan === 'daily') {
      // Daily pricing structure uses individual meal prices (breakfast, lunch, dinner)
      const dailyPricing = mess.pricing.daily;
      if (!dailyPricing) return 0;

      // Sum up the prices for selected meals
      let total = 0;
      selectedMeals.forEach(meal => {
        const mealLower = meal.toLowerCase();
        if (dailyPricing[mealLower]) {
          total += dailyPricing[mealLower];
        }
      });
      return total;
    } else {
      // Monthly pricing structure uses oneMeal, twoMeals, allMeals
      const monthlyPricing = mess.pricing.monthly;
      if (!monthlyPricing) return 0;

      if (selectedMeals.length >= 3) {
        return monthlyPricing.allMeals || monthlyPricing.fullDay || 0;
      } else if (selectedMeals.length === 2) {
        return monthlyPricing.twoMeals || 0;
      } else {
        return monthlyPricing.oneMeal || 0;
      }
    }
  };

  // Get the correct plan value for the backend
  const getSubscriptionPlan = () => {
    const { selectedMeals, plan } = subscriptionData;
    const prefix = plan === 'monthly' ? 'monthly' : 'daily';

    if (selectedMeals.length >= 3) {
      return `${prefix}-all`;
    } else if (selectedMeals.length === 2) {
      return `${prefix}-two`;
    } else {
      return `${prefix}-one`;
    }
  };

  // Fallback images
  const fallbackImages = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
  ];

  const images = mess?.images && mess.images.length > 0
    ? mess.images.map(img => img.startsWith('http') ? img : `http://localhost:4000${img}`)
    : fallbackImages;

  if (loading) {
    return (
      <div className="mess-details-page">
        <div className="container">
          <Loading size="lg" text="Loading mess details..." />
        </div>
      </div>
    );
  }

  if (error || !mess) {
    return (
      <div className="mess-details-page">
        <div className="container">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '400px',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ fontSize: '64px', marginBottom: '16px' }}>🍽️</span>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Mess Not Found</h2>
            <p style={{ marginBottom: '24px' }}>{error || 'The mess service you are looking for does not exist.'}</p>
            <Link to="/mess" className="btn btn-primary">
              Browse Mess Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'menu', label: 'Menu' },
    { id: 'weekly', label: 'Weekly Menu' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'reviews', label: 'Reviews' }
  ];

  return (
    <div className="mess-details-page">
      <div className="container">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="back-nav"
        >
          <button onClick={() => navigate('/mess')} className="back-btn">
            <HiOutlineArrowLeft size={20} />
            Back to Mess Services
          </button>
        </motion.div>

        <div className="mess-layout">
          {/* Main Content */}
          <div className="mess-main">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="image-gallery"
            >
              <div className="main-image">
                <img src={images[activeImage]} alt={mess.name} />
                <div className="image-badges">
                  <Badge variant="success" icon={<HiOutlineCheck size={14} />}>
                    Active
                  </Badge>
                  {mess.isVerified && (
                    <Badge variant="primary" icon={<HiOutlineBadgeCheck size={14} />}>
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              {images.length > 1 && (
                <div className="thumbnail-strip">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${activeImage === index ? 'active' : ''}`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img src={img} alt={`View ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Mess Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mess-info"
            >
              <div className="info-header">
                <div>
                  <h1>{mess.name}</h1>
                  <div className="location">
                    <HiOutlineLocationMarker size={18} />
                    <span>{mess.location?.address || mess.address || 'Location not specified'}</span>
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className={`action-btn ${isSaved ? 'saved' : ''}`}
                    onClick={handleSave}
                  >
                    <HiOutlineHeart size={20} />
                  </button>
                  <button className="action-btn" onClick={handleShare}>
                    <HiOutlineShare size={20} />
                  </button>
                </div>
              </div>

              {/* Rating & Stats */}
              <div className="rating-section">
                <div className="rating">
                  <HiStar style={{ color: '#fbbf24' }} size={20} />
                  <span className="rating-value">{mess.ratings?.average?.toFixed(1) || 'New'}</span>
                  {mess.ratings?.count > 0 && (
                    <span className="rating-count">({mess.ratings.count} reviews)</span>
                  )}
                </div>
                <div className="subscribers">
                  <HiOutlineUsers size={18} />
                  <span>{mess.subscribers || 0} subscribers</span>
                </div>
              </div>

              {/* Tags */}
              <div className="tags-section">
                {mess.cuisineType?.map((cuisine) => (
                  <span key={cuisine} className="tag cuisine">{cuisine}</span>
                ))}
                {mess.mealTypes?.map((meal) => (
                  <span key={meal} className="tag meal">{meal}</span>
                ))}
              </div>

              {/* Description */}
              <div className="section">
                <h2>About</h2>
                <p className="description">
                  {mess.description || 'A quality mess service providing delicious home-cooked meals for students and professionals.'}
                </p>
              </div>

              {/* Quick Info */}
              <div className="section">
                <h2>Quick Info</h2>
                <div className="quick-info-grid">
                  <div className="quick-info-item">
                    <div className="quick-info-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                      <HiOutlineClock size={24} />
                    </div>
                    <div className="quick-info-content">
                      <span className="label">Timings</span>
                      <span className="value">
                        {mess.timings?.lunch?.start || '12:00'} - {mess.timings?.dinner?.end || '21:00'}
                      </span>
                    </div>
                  </div>
                  <div className="quick-info-item">
                    <div className="quick-info-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <HiOutlineCurrencyRupee size={24} />
                    </div>
                    <div className="quick-info-content">
                      <span className="label">Starting at</span>
                      <span className="value">₹{mess.pricing?.monthly?.oneMeal || '1500'}/month</span>
                    </div>
                  </div>
                  <div className="quick-info-item">
                    <div className="quick-info-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      <HiOutlinePhone size={24} />
                    </div>
                    <div className="quick-info-content">
                      <span className="label">Contact</span>
                      <span className="value">{mess.contactPhone || mess.contactNumber || 'Not available'}</span>
                    </div>
                  </div>
                  <div className="quick-info-item">
                    <div className="quick-info-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                      <HiOutlineCalendar size={24} />
                    </div>
                    <div className="quick-info-content">
                      <span className="label">Delivery</span>
                      <span className="value">
                        {mess.features?.includes('homeDelivery') ? 'Available' : 'Pickup Only'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              {mess.features && mess.features.length > 0 && (
                <div className="section">
                  <h2>Features</h2>
                  <div className="features-grid">
                    {mess.features.map((feature) => (
                      <div key={feature} className="feature-item">
                        <HiOutlineCheck size={18} />
                        <span>{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="section tabs-section">
                <div className="tabs-header">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="tab-content">
                  {activeTab === 'menu' && (
                    <div className="menu-content">
                      {mess.menu?.breakfast?.length > 0 && (
                        <div className="menu-section">
                          <h4>🌅 Breakfast</h4>
                          <div className="menu-items">
                            {mess.menu.breakfast.map((item, idx) => (
                              <span key={idx} className="menu-item breakfast">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {mess.menu?.lunch?.length > 0 && (
                        <div className="menu-section">
                          <h4>☀️ Lunch</h4>
                          <div className="menu-items">
                            {mess.menu.lunch.map((item, idx) => (
                              <span key={idx} className="menu-item lunch">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {mess.menu?.dinner?.length > 0 && (
                        <div className="menu-section">
                          <h4>🌙 Dinner</h4>
                          <div className="menu-items">
                            {mess.menu.dinner.map((item, idx) => (
                              <span key={idx} className="menu-item dinner">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {!mess.menu?.breakfast?.length && !mess.menu?.lunch?.length && !mess.menu?.dinner?.length && (
                        <p style={{ color: 'var(--text-secondary)' }}>Menu not available yet</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'weekly' && (
                    <div className="weekly-content">
                      <p style={{ color: 'var(--text-secondary)' }}>Weekly menu not available yet</p>
                    </div>
                  )}

                  {activeTab === 'pricing' && (
                    <div className="pricing-content">
                      {mess.pricing?.monthly && (
                        <div className="pricing-card monthly">
                          <h4>Monthly Plans</h4>
                          <div className="pricing-rows">
                            <div className="pricing-row">
                              <span>One Meal</span>
                              <span className="price">₹{mess.pricing.monthly.oneMeal || 'N/A'}</span>
                            </div>
                            <div className="pricing-row">
                              <span>Two Meals</span>
                              <span className="price">₹{mess.pricing.monthly.twoMeals || 'N/A'}</span>
                            </div>
                            <div className="pricing-row">
                              <span>Full Day</span>
                              <span className="price">₹{mess.pricing.monthly.allMeals || mess.pricing.monthly.fullDay || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {mess.pricing?.daily && (
                        <div className="pricing-card daily">
                          <h4>Daily Rates</h4>
                          <div className="pricing-rows">
                            <div className="pricing-row">
                              <span>Breakfast</span>
                              <span className="price">₹{mess.pricing.daily.breakfast || 'N/A'}</span>
                            </div>
                            <div className="pricing-row">
                              <span>Lunch</span>
                              <span className="price">₹{mess.pricing.daily.lunch || 'N/A'}</span>
                            </div>
                            <div className="pricing-row">
                              <span>Dinner</span>
                              <span className="price">₹{mess.pricing.daily.dinner || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="reviews-content">
                      <MessReviews messId={id} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Subscribe Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="subscribe-sidebar"
          >
            <div className="subscribe-card">
              <div className="price-section">
                <div className="price">
                  <HiOutlineCurrencyRupee size={24} />
                  <span className="price-value">
                    {mess.pricing?.monthly?.oneMeal || '1,500'}
                  </span>
                </div>
                <span className="price-period">/month</span>
              </div>

              <div className="subscribe-details">
                <div className="detail-row">
                  <span className="label">One Meal Plan</span>
                  <span className="value">₹{mess.pricing?.monthly?.oneMeal || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Two Meals Plan</span>
                  <span className="value">₹{mess.pricing?.monthly?.twoMeals || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Full Day Plan</span>
                  <span className="value">₹{mess.pricing?.monthly?.allMeals || mess.pricing?.monthly?.fullDay || 'N/A'}</span>
                </div>
              </div>

              <div className="subscribe-actions">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    if (hasActiveSubscription) {
                      toast.error('You already have an active or pending subscription. Please cancel it before subscribing to a new mess.');
                      return;
                    }
                    setShowSubscribeModal(true);
                  }}
                  leftIcon={<HiOutlineCalendar size={20} />}
                  disabled={hasActiveSubscription}
                  style={hasActiveSubscription ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                >
                  {hasActiveSubscription ? 'Subscription Active/Pending' : 'Subscribe Now'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  leftIcon={<HiOutlineChatAlt2 size={20} />}
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error('Please login to contact the owner');
                      navigate('/login', { state: { from: `/mess/${id}` } });
                      return;
                    }
                    setShowChatModal(true);
                  }}
                >
                  Contact Owner
                </Button>
              </div>

              <p className="subscribe-note">
                <HiOutlineShieldCheck size={16} />
                You won't be charged yet. Review before confirming.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Subscribe Modal */}
      {/* Subscribe Modal */}
      <AnimatePresence>
        {showSubscribeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowSubscribeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="subscribe-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Subscribe to {mess.name}</h3>

              <div className="modal-section">
                <label>Plan Type</label>
                <div className="option-grid">
                  {['monthly', 'daily'].map((plan) => (
                    <button
                      key={plan}
                      onClick={() => setSubscriptionData(prev => ({ ...prev, plan }))}
                      className={`option-btn ${subscriptionData.plan === plan ? 'active' : ''}`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <label>Select Meals</label>
                <div className="option-grid four-col">
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
                    <button
                      key={meal}
                      onClick={() => {
                        setSubscriptionData(prev => ({
                          ...prev,
                          selectedMeals: prev.selectedMeals.includes(meal)
                            ? prev.selectedMeals.filter(m => m !== meal)
                            : [...prev.selectedMeals, meal]
                        }));
                      }}
                      className={`option-btn ${subscriptionData.selectedMeals.includes(meal) ? 'active' : ''}`}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <label>Delivery Preference</label>
                <div className="option-grid">
                  {['pickup', 'delivery'].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setSubscriptionData(prev => ({ ...prev, deliveryPreference: pref }))}
                      className={`option-btn ${subscriptionData.deliveryPreference === pref ? 'active' : ''}`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div className="price-summary">
                <div className="summary-row">
                  <span>Selected Meals</span>
                  <span>{subscriptionData.selectedMeals.join(', ') || 'None'}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{getMonthlyPrice()}/{subscriptionData.plan === 'monthly' ? 'month' : 'day'}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowSubscribeModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing || subscriptionData.selectedMeals.length === 0}
                  className="btn-subscribe"
                >
                  {subscribing ? 'Processing...' : 'Subscribe'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        property={mess}
        ownerId={mess.owner?._id}
        ownerName={mess.owner?.name || 'Mess Owner'}
        type="mess"
      />

      <style>{`
        .mess-details-page {
          min-height: calc(100vh - 80px);
          padding: 1.5rem 0 4rem;
          background: var(--bg-secondary);
        }

        .back-nav {
          margin-bottom: 1.5rem;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: var(--primary-color);
        }

        .mess-layout {
          display: grid;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .mess-layout {
            grid-template-columns: 1fr 380px;
          }
        }

        /* Image Gallery */
        .image-gallery {
          background: var(--bg-card);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .main-image {
          position: relative;
          aspect-ratio: 16 / 9;
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-badges {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .thumbnail-strip {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
        }

        .thumbnail {
          flex-shrink: 0;
          width: 80px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .thumbnail.active {
          border-color: var(--primary-color);
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Mess Info */
        .mess-info {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--border-color);
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .info-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }

        .location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--bg-secondary);
          color: var(--primary-color);
        }

        .action-btn.saved {
          background: #fee2e2;
          color: #ef4444;
          border-color: #fecaca;
        }

        .rating-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1rem;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rating-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .rating-count {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .subscribers {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }

        .tags-section {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .tag {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .tag.cuisine {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .tag.meal {
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }

        .section {
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .section:last-child {
          border-bottom: none;
        }

        .section h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 1rem 0;
        }

        .description {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .quick-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .quick-info-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .quick-info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .quick-info-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-info-content {
          display: flex;
          flex-direction: column;
        }

        .quick-info-content .label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .quick-info-content .value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }

        .feature-item svg {
          color: #10b981;
        }

        /* Tabs */
        .tabs-section {
          border-bottom: none;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1.5rem;
        }

        .tab-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }

        .menu-section {
          margin-bottom: 1.5rem;
        }

        .menu-section:last-child {
          margin-bottom: 0;
        }

        .menu-section h4 {
          margin: 0 0 0.75rem 0;
          color: var(--text-primary);
        }

        .menu-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .menu-item {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
        }

        .menu-item.breakfast { background: rgba(251, 191, 36, 0.1); color: #d97706; }
        .menu-item.lunch { background: rgba(249, 115, 22, 0.1); color: #ea580c; }
        .menu-item.dinner { background: rgba(59, 130, 246, 0.1); color: #2563eb; }

        .pricing-content {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .pricing-content {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .pricing-card {
          padding: 1.5rem;
          border-radius: 12px;
        }

        .pricing-card.monthly {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
        }

        .pricing-card.daily {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
        }

        .pricing-card h4 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .pricing-rows {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .pricing-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
        }

        .pricing-row .price {
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Sidebar */
        .subscribe-sidebar {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .subscribe-card {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--border-color);
        }

        .price-section {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 1.5rem;
        }

        .price {
          display: flex;
          align-items: center;
        }

        .price-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .price-period {
          color: var(--text-secondary);
        }

        .subscribe-details {
          padding: 1rem 0;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .detail-row .label {
          color: var(--text-secondary);
        }

        .detail-row .value {
          font-weight: 500;
          color: var(--text-primary);
        }

        .subscribe-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .subscribe-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1000;
        }

        .subscribe-modal {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 1.5rem;
          max-width: 450px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .subscribe-modal h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 1.5rem 0;
        }

        .modal-section {
          margin-bottom: 1.5rem;
        }

        .modal-section label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .option-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .option-grid.four-col {
          grid-template-columns: repeat(4, 1fr);
        }

        .option-btn {
          padding: 0.75rem;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          background: none;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: capitalize;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option-btn:hover {
          border-color: var(--primary-color);
        }

        .option-btn.active {
          border-color: var(--primary-color);
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary-color);
        }

        .price-summary {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .summary-row.total {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          border-top: 1px solid var(--border-color);
          margin-top: 0.5rem;
          padding-top: 1rem;
        }

        .summary-row.total span:last-child {
          color: var(--primary-color);
        }

        .modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .btn-cancel {
          padding: 0.875rem;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          background: none;
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: var(--bg-secondary);
        }

        .btn-subscribe {
          padding: 0.875rem;
          border: none;
          border-radius: 10px;
          background: var(--primary-color);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-subscribe:hover {
          opacity: 0.9;
        }

        .btn-subscribe:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default MessDetailsPage;
