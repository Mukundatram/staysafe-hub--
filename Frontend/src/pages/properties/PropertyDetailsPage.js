import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { MapComponent } from '../../components/map';
import { ChatModal } from '../../components/chat';
import { ReviewList } from '../../components/review';
import toast from 'react-hot-toast';
import { 
  HiOutlineLocationMarker,
  HiOutlineCurrencyRupee,
  HiOutlineShieldCheck,
  HiOutlineHeart,
  HiOutlineShare,
  HiOutlineCalendar,
  HiOutlineChat,
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineHome,
  HiOutlineWifi,
  HiOutlineLightningBolt,
  HiOutlineDesktopComputer,
  HiOutlineKey,
  HiOutlineStar,
  HiOutlineUserGroup
} from 'react-icons/hi';

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  useEffect(() => {
    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await propertyService.getById(id);
      setProperty(data);
    } catch (err) {
      console.error('Failed to fetch property:', err);
      setError('Property not found or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book this property');
      navigate('/login', { state: { from: `/properties/${id}` } });
      return;
    }
    // If property has rooms, ensure availability
    const rooms = property?.rooms || [];
    if (rooms.length > 0) {
      const availableRooms = rooms.reduce((sum, r) => sum + (r.availableRooms || 0), 0);
      if (availableRooms <= 0) {
        toast.error('No rooms available for booking');
        return;
      }
    }
    navigate(`/booking/${id}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.error('Please login to save properties');
      return;
    }
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleChatWithOwner = () => {
    if (!isAuthenticated) {
      toast.error('Please login to chat with the owner');
      navigate('/login', { state: { from: `/properties/${id}` } });
      return;
    }
    if (!property?.owner) {
      toast.error('Owner information not available');
      return;
    }
    setChatModalOpen(true);
  };

  // Fallback images if property has no images
  const fallbackImages = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop&auto=format',
  ];

  // Use actual property images if available, otherwise use fallback
  const images = property?.images && property.images.length > 0
    ? property.images.map(img => `http://localhost:4000${img}`)
    : fallbackImages;

  // Amenity icons mapping
  const amenityIcons = {
    'WiFi': HiOutlineWifi,
    'AC': HiOutlineLightningBolt,
    'TV': HiOutlineDesktopComputer,
    'Parking': HiOutlineKey,
    'default': HiOutlineCheck,
  };

  if (loading) {
    return (
      <div className="property-details-page">
        <div className="container">
          <Loading size="lg" text="Loading property details..." />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-details-page">
        <div className="container">
          <div className="error-state">
            <HiOutlineHome size={64} />
            <h2>Property Not Found</h2>
            <p>{error || 'The property you are looking for does not exist.'}</p>
            <Link to="/properties" className="btn btn-primary">
              Browse Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    title,
    description,
    rent,
    location,
    coordinates,
    amenities = [],
    meals = [],
    isAvailable,
  } = property;

  return (
    <div className="property-details-page">
      <div className="container">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="back-nav"
        >
          <button onClick={() => navigate(-1)} className="back-btn">
            <HiOutlineArrowLeft size={20} />
            Back to listings
          </button>
        </motion.div>

        <div className="property-layout">
          {/* Main Content */}
          <div className="property-main">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="image-gallery"
            >
              <div className="main-image">
                <img src={images[activeImage]} alt={title} />
                <div className="image-badges">
                  {isAvailable ? (
                    <Badge variant="success" icon={<HiOutlineCheck size={14} />}>
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="warning">Booked</Badge>
                  )}
                  <Badge variant="primary" icon={<HiOutlineShieldCheck size={14} />}>
                    Verified
                  </Badge>
                </div>
              </div>
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
            </motion.div>

            {/* Property Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="property-info"
            >
              <div className="info-header">
                <div>
                  <h1>{title}</h1>
                  <div className="location">
                    <HiOutlineLocationMarker size={18} />
                    <span>{location || 'Location not specified'}</span>
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

              {/* Rating & Reviews */}
              <div className="rating-section">
                <div className="rating">
                  <HiOutlineStar className="star-icon" size={20} />
                  <span className="rating-value">4.8</span>
                  <span className="rating-count">(24 reviews)</span>
                </div>
                <div className="verified-owner">
                  <HiOutlineUserGroup size={18} />
                  <span>Verified Owner</span>
                </div>
              </div>

              {/* Description */}
              <div className="section">
                <h2>About this property</h2>
                <p className="description">
                  {description || 'A comfortable and safe place to stay. This verified property offers all the essentials for students and interns looking for reliable accommodation.'}
                </p>
              </div>

              {/* Rooms Inventory */}
              {property.rooms && property.rooms.length > 0 && (() => {
                const rooms = property.rooms || [];
                const totalRooms = rooms.reduce((sum, r) => sum + (r.totalRooms || 0), 0);
                const availableRooms = rooms.reduce((sum, r) => sum + (r.availableRooms || 0), 0);
                const uniformMaxOccupancy = rooms.length > 0 && rooms.every(r => r.maxOccupancy === rooms[0].maxOccupancy) ? rooms[0].maxOccupancy : null;
                const uniformPricePerBed = rooms.length > 0 && rooms.every(r => r.pricePerBed === rooms[0].pricePerBed) ? rooms[0].pricePerBed : null;
                return (
                  <div className="section">
                    <h2>Room Inventory</h2>
                    <div className="inventory-row">
                      <div>Total rooms: <strong>{totalRooms}</strong></div>
                      <div>Available: <strong>{availableRooms}</strong></div>
                      <div>Members / room: <strong>{uniformMaxOccupancy ?? 'Varies'}</strong></div>
                      <div>Price / bed: <strong>{uniformPricePerBed !== null ? `₹${uniformPricePerBed}` : 'Varies'}</strong></div>
                    </div>
                  </div>
                );
              })()}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="section">
                  <h2>Amenities</h2>
                  <div className="amenities-grid">
                    {amenities.map((amenity, index) => {
                      const Icon = amenityIcons[amenity] || amenityIcons.default;
                      return (
                        <div key={index} className="amenity-item">
                          <Icon size={20} />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Meals */}
              {meals.length > 0 && (
                <div className="section">
                  <h2>Mess Services</h2>
                  <div className="meals-list">
                    {meals.map((meal, index) => (
                      <div key={index} className="meal-item">
                        <HiOutlineCheck size={18} />
                        <span>{meal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Features */}
              <div className="section">
                <h2>Safety Features</h2>
                <div className="safety-grid">
                  <div className="safety-item">
                    <div className="safety-icon verified">
                      <HiOutlineShieldCheck size={20} />
                    </div>
                    <div className="safety-content">
                      <h4>Verified Property</h4>
                      <p>This property has been physically verified by our team.</p>
                    </div>
                  </div>
                  <div className="safety-item">
                    <div className="safety-icon">
                      <HiOutlineUserGroup size={20} />
                    </div>
                    <div className="safety-content">
                      <h4>Background-Checked Owner</h4>
                      <p>The property owner has passed our verification process.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Map */}
              {coordinates && coordinates.lat && coordinates.lng && (
                <div className="section">
                  <h2>Location</h2>
                  <div className="location-map">
                    <MapComponent
                      center={[coordinates.lat, coordinates.lng]}
                      zoom={15}
                      markers={[
                        {
                          id: property._id,
                          lat: coordinates.lat,
                          lng: coordinates.lng,
                          title: title,
                          description: location,
                          price: rent,
                          popup: true,
                        },
                      ]}
                      height="300px"
                      interactive={true}
                      showUserLocation={true}
                    />
                  </div>
                  {location && (
                    <p className="map-address">
                      <HiOutlineLocationMarker size={16} />
                      {location}
                    </p>
                  )}
                </div>
              )}

              {/* Reviews Section */}
              <div className="section">
                <ReviewList 
                  propertyId={property._id}
                  averageRating={property.averageRating}
                  reviewCount={property.reviewCount}
                  ratingBreakdown={property.ratingBreakdown}
                />
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Booking Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="booking-sidebar"
          >
            <div className="booking-card">
              <div className="price-section">
                <div className="price">
                  <HiOutlineCurrencyRupee size={24} />
                  <span className="price-value">{rent?.toLocaleString() || 'N/A'}</span>
                </div>
                <span className="price-period">/month</span>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="label">Security Deposit</span>
                  <span className="value">₹{(rent || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Maintenance</span>
                  <span className="value">Included</span>
                </div>
                {meals.length > 0 && (
                  <div className="detail-row">
                    <span className="label">Mess Charges</span>
                    <span className="value">₹3,000/month</span>
                  </div>
                )}
              </div>

              <div className="booking-actions">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleBookNow}
                  disabled={!isAvailable}
                  leftIcon={<HiOutlineCalendar size={20} />}
                >
                  {isAvailable ? 'Book Now' : 'Not Available'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  leftIcon={<HiOutlineChat size={20} />}
                  onClick={handleChatWithOwner}
                >
                  Chat with Owner
                </Button>
              </div>

              <p className="booking-note">
                <HiOutlineShieldCheck size={16} />
                You won't be charged yet. Review before confirming.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .property-details-page {
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
          transition: color var(--transition-fast);
        }

        .back-btn:hover {
          color: var(--accent-primary);
        }

        .property-layout {
          display: grid;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .property-layout {
            grid-template-columns: 1fr 380px;
          }
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 400px;
          color: var(--text-secondary);
        }

        .error-state h2 {
          margin: 1rem 0 0.5rem;
        }

        .error-state p {
          margin-bottom: 1.5rem;
        }

        /* Image Gallery */
        .image-gallery {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid var(--border-light);
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
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 2px solid transparent;
          transition: all var(--transition-fast);
        }

        .thumbnail.active {
          border-color: var(--accent-primary);
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Property Info */
        .property-info {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          padding: 2rem;
          border: 1px solid var(--border-light);
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .info-header h1 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
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
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .action-btn.saved {
          background: var(--error);
          border-color: var(--error);
          color: white;
        }

        .rating-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 1.5rem;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .star-icon {
          color: #f59e0b;
          fill: #f59e0b;
        }

        .rating-value {
          font-weight: 700;
          font-size: 1.125rem;
        }

        .rating-count {
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .verified-owner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--success);
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .section {
          margin-bottom: 2rem;
        }

        .section h2 {
          font-size: 1.125rem;
          margin-bottom: 1rem;
        }

        .description {
          line-height: 1.7;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .amenity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
        }

        .meals-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .meal-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--success);
        }

        .meal-item span {
          color: var(--text-secondary);
        }

        .safety-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .safety-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
        }

        .safety-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .safety-icon.verified {
          background: var(--success-bg);
          color: var(--success);
        }

        .safety-content h4 {
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }

        .safety-content p {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        /* Location Map */
        .location-map {
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .map-address {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .map-address svg {
          flex-shrink: 0;
          color: var(--accent-primary);
          margin-top: 0.125rem;
        }

        /* Booking Sidebar */
        .booking-sidebar {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .booking-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: var(--shadow-lg);
        }

        .price-section {
          display: flex;
          align-items: baseline;
          margin-bottom: 1.5rem;
        }

        .price {
          display: flex;
          align-items: center;
          color: var(--text-primary);
        }

        .price-value {
          font-size: 2rem;
          font-weight: 800;
        }

        .price-period {
          color: var(--text-secondary);
          font-size: 1rem;
          margin-left: 0.25rem;
        }

        .booking-details {
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 1rem 0;
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
        }

        .booking-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .booking-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }
      `}</style>

      {/* Chat Modal */}
      {property?.owner && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          property={property}
          ownerId={property.owner._id}
          ownerName={property.owner.name}
        />
      )}
    </div>
  );
};

export default PropertyDetailsPage;
