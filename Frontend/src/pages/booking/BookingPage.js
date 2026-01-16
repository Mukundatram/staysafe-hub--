import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { propertyService, bookingService } from '../../services/propertyService';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { format, addMonths } from 'date-fns';
import {
  HiOutlineCalendar,
  HiOutlineCurrencyRupee,
  HiOutlineCheck,
  HiOutlineShieldCheck,
  HiOutlineArrowLeft,
  HiOutlineHome,
  HiOutlineCake,
  HiOutlineDocumentText,
  HiOutlineCheckCircle
} from 'react-icons/hi';

const BookingPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  useAuth(); // Ensure user is authenticated
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);

  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
    mealsSelected: false,
    planType: 'room', // room, room-mess, mess
  });
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getById(propertyId);
      setProperty(data);
    } catch (err) {
      console.error('Failed to fetch property:', err);
      toast.error('Property not found');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        mealsSelected: formData.mealsSelected,
      };
      if (selectedRoomId) payload.roomId = selectedRoomId;
      await bookingService.create(propertyId, payload);
      setBookingComplete(true);
      toast.success('Booking request submitted successfully!');
    } catch (err) {
      console.error('Booking failed:', err);
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    let rent = property?.rent || 0;
    // If a room is selected, use room price where available
    if (selectedRoomId && property?.rooms) {
      const room = property.rooms.find(r => r._id === selectedRoomId || r._id === String(selectedRoomId));
      if (room) {
        rent = (room.pricePerRoom && room.pricePerRoom > 0) ? room.pricePerRoom : (room.pricePerBed || rent);
      }
    }
    const messCharges = formData.mealsSelected ? 3000 : 0;
    const securityDeposit = rent;
    return {
      monthlyRent: rent,
      messCharges,
      securityDeposit,
      total: rent + messCharges + securityDeposit,
    };
  };

  if (loading) {
    return (
      <div className="booking-page">
        <div className="container">
          <Loading size="lg" text="Loading booking details..." />
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="booking-page">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="booking-success"
          >
            <div className="success-icon">
              <HiOutlineCheckCircle size={64} />
            </div>
            <h1>You're all set 🎉</h1>
            <p>Your stay is confirmed and secured.</p>
            <div className="success-details">
              <Card padding="md">
                <h3>{property.title}</h3>
                <p>
                  <HiOutlineCalendar size={16} />
                  {format(new Date(formData.startDate), 'MMM d, yyyy')} - {format(new Date(formData.endDate), 'MMM d, yyyy')}
                </p>
              </Card>
            </div>
            <div className="success-actions">
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button variant="secondary" onClick={() => navigate('/properties')}>
                Browse More Properties
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const totals = calculateTotal();

  const plans = [
    {
      id: 'room',
      icon: HiOutlineHome,
      title: 'Room Only',
      description: 'Just the accommodation',
      price: property?.rent || 0,
    },
    {
      id: 'room-mess',
      icon: HiOutlineCake,
      title: 'Room + Mess',
      description: 'Accommodation with meals',
      price: (property?.rent || 0) + 3000,
    },
  ];

  return (
    <div className="booking-page">
      <div className="container">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="back-nav"
        >
          <button onClick={() => navigate(-1)} className="back-btn">
            <HiOutlineArrowLeft size={20} />
            Back to property
          </button>
        </motion.div>

        <div className="booking-layout">
          {/* Main Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="booking-form-section"
          >
            {/* Progress Steps */}
            <div className="progress-steps">
              {['Choose Plan', 'Select Dates', 'Confirm'].map((label, index) => (
                <div
                  key={label}
                  className={`step ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'completed' : ''}`}
                >
                  <div className="step-number">
                    {step > index + 1 ? <HiOutlineCheck size={16} /> : index + 1}
                  </div>
                  <span className="step-label">{label}</span>
                </div>
              ))}
            </div>

            {/* Step 1: Choose Plan */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="step-content"
              >
                <h2>Choose your plan</h2>
                <p>Select the accommodation option that works best for you.</p>

                <div className="plans-grid">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      className={`plan-card ${formData.planType === plan.id ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          planType: plan.id,
                          mealsSelected: plan.id === 'room-mess',
                        }));
                      }}
                    >
                      <div className="plan-icon">
                        <plan.icon size={28} />
                      </div>
                      <h3>{plan.title}</h3>
                      <p>{plan.description}</p>
                      <div className="plan-price">
                        <HiOutlineCurrencyRupee size={18} />
                        <span>{plan.price.toLocaleString()}</span>
                        <small>/month</small>
                      </div>
                      {formData.planType === plan.id && (
                        <div className="plan-selected">
                          <HiOutlineCheck size={20} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="step-actions">
                  <Button variant="primary" size="lg" onClick={() => setStep(2)}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Dates */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="step-content"
              >
                <h2>Select your dates</h2>
                <p>When would you like to move in?</p>

                <div className="dates-form">
                  {property?.rooms && property.rooms.length > 0 && (
                    <div className="form-group">
                      <label>Choose Room</label>
                      <select value={selectedRoomId || ''} onChange={e => setSelectedRoomId(e.target.value)}>
                        <option value="">-- Select room --</option>
                        {property.rooms.map(room => (
                          <option key={room._id} value={room._id} disabled={room.availableRooms <= 0}>
                            {room.roomName || room.roomNumber || room.roomType} - Available: {room.availableRooms} - Max Occupancy: {room.maxOccupancy}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <Input
                      label="Move-in Date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      leftIcon={<HiOutlineCalendar size={18} />}
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      label="Move-out Date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      leftIcon={<HiOutlineCalendar size={18} />}
                    />
                  </div>
                </div>

                <div className="step-actions">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" size="lg" onClick={() => setStep(3)}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="step-content"
              >
                <h2>Confirm your booking</h2>
                <p>Review the details before confirming.</p>

                <div className="confirmation-summary">
                  <div className="summary-item">
                    <div className="summary-icon">
                      <HiOutlineHome size={20} />
                    </div>
                    <div className="summary-content">
                      <h4>Property</h4>
                      <p>{property.title}</p>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon">
                      <HiOutlineCalendar size={20} />
                    </div>
                    <div className="summary-content">
                      <h4>Duration</h4>
                      <p>
                        {format(new Date(formData.startDate), 'MMM d, yyyy')} - {format(new Date(formData.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon">
                      <HiOutlineDocumentText size={20} />
                    </div>
                    <div className="summary-content">
                      <h4>Plan</h4>
                      <p>{formData.mealsSelected ? 'Room + Mess' : 'Room Only'}</p>
                    </div>
                  </div>
                </div>

                <div className="agreement-section">
                  <label className="checkbox-label">
                    <input type="checkbox" required />
                    <span>
                      I agree to the <a href="/terms">Terms & Conditions</a> and{' '}
                      <a href="/privacy">Privacy Policy</a>
                    </span>
                  </label>
                </div>

                <div className="step-actions">
                  <Button variant="secondary" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={submitting}
                    leftIcon={<HiOutlineShieldCheck size={20} />}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar - Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="booking-sidebar"
          >
            <Card padding="lg">
              <h3>Booking Summary</h3>
              
              <div className="property-preview">
                <img
                  src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=150&fit=crop"
                  alt={property.title}
                />
                <div className="preview-content">
                  <h4>{property.title}</h4>
                  <p>{property.location}</p>
                </div>
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Monthly Rent</span>
                  <span>₹{totals.monthlyRent.toLocaleString()}</span>
                </div>
                {formData.mealsSelected && (
                  <div className="price-row">
                    <span>Mess Charges</span>
                    <span>₹{totals.messCharges.toLocaleString()}</span>
                  </div>
                )}
                <div className="price-row">
                  <span>Security Deposit</span>
                  <span>₹{totals.securityDeposit.toLocaleString()}</span>
                </div>
                <div className="price-row total">
                  <span>Total Due Now</span>
                  <span>₹{totals.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="secure-notice">
                <HiOutlineShieldCheck size={18} />
                <span>Your payment is secured</span>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <style>{`
        .booking-page {
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

        .booking-layout {
          display: grid;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .booking-layout {
            grid-template-columns: 1fr 380px;
          }
        }

        .booking-form-section {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: 2rem;
        }

        /* Progress Steps */
        .progress-steps {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 2.5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border-light);
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .step-number {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .step.active .step-number {
          background: var(--accent-gradient);
          color: white;
        }

        .step.completed .step-number {
          background: var(--success);
          color: white;
        }

        .step-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-tertiary);
        }

        .step.active .step-label {
          color: var(--text-primary);
        }

        .step.completed .step-label {
          color: var(--success);
        }

        /* Step Content */
        .step-content h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .step-content > p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .plans-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .plans-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .plan-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          text-align: center;
          transition: all var(--transition-fast);
        }

        .plan-card:hover {
          border-color: var(--accent-primary);
        }

        .plan-card.selected {
          border-color: var(--accent-primary);
          background: var(--accent-gradient-soft);
        }

        .plan-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          color: var(--accent-primary);
          margin-bottom: 1rem;
        }

        .plan-card.selected .plan-icon {
          background: var(--accent-gradient);
          color: white;
        }

        .plan-card h3 {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .plan-card p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .plan-price {
          display: flex;
          align-items: center;
          color: var(--text-primary);
          font-size: 1.25rem;
          font-weight: 700;
        }

        .plan-price small {
          font-size: 0.875rem;
          font-weight: 400;
          color: var(--text-secondary);
          margin-left: 0.25rem;
        }

        .plan-selected {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-primary);
          border-radius: var(--radius-full);
          color: white;
        }

        .dates-form {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .dates-form {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .confirmation-summary {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
        }

        .summary-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient-soft);
          border-radius: var(--radius-md);
          color: var(--accent-primary);
          flex-shrink: 0;
        }

        .summary-content h4 {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .summary-content p {
          color: var(--text-primary);
          font-weight: 500;
        }

        .agreement-section {
          margin-bottom: 2rem;
        }

        .checkbox-label {
          display: flex;
          gap: 0.75rem;
          font-size: 0.9375rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          accent-color: var(--accent-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .checkbox-label a {
          color: var(--accent-primary);
          font-weight: 500;
        }

        .step-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        /* Sidebar */
        .booking-sidebar {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .booking-sidebar h3 {
          font-size: 1.125rem;
          margin-bottom: 1.25rem;
        }

        .property-preview {
          display: flex;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 1rem;
        }

        .property-preview img {
          width: 80px;
          height: 60px;
          object-fit: cover;
          border-radius: var(--radius-md);
        }

        .preview-content h4 {
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }

        .preview-content p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .price-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9375rem;
        }

        .price-row span:first-child {
          color: var(--text-secondary);
        }

        .price-row.total {
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-light);
          font-weight: 700;
          font-size: 1rem;
        }

        .price-row.total span:first-child {
          color: var(--text-primary);
        }

        .secure-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
          color: var(--success);
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Success State */
        .booking-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 2rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .success-icon {
          color: var(--success);
          margin-bottom: 1.5rem;
        }

        .booking-success h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .booking-success > p {
          color: var(--text-secondary);
          font-size: 1.125rem;
          margin-bottom: 2rem;
        }

        .success-details {
          width: 100%;
          margin-bottom: 2rem;
        }

        .success-details h3 {
          margin-bottom: 0.5rem;
        }

        .success-details p {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }

        .success-actions {
          display: flex;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};

export default BookingPage;
