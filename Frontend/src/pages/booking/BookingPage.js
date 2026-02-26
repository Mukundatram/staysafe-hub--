import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { propertyService, bookingService } from '../../services/propertyService';
import messService from '../../services/messService';
import roommateService from '../../services/roommateService';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import AdditionalMemberForm from '../../components/booking/AdditionalMemberForm';
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
  HiOutlineCheckCircle,
  HiOutlineUsers
} from 'react-icons/hi';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const BookingPage = () => {
  useDocumentTitle('Book Property');
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
  const [roomsCount, setRoomsCount] = useState(1);
  const [membersCount, setMembersCount] = useState(1);
  const [additionalMembers, setAdditionalMembers] = useState([]);
  const [includeMess, setIncludeMess] = useState(false);
  const [messOptions, setMessOptions] = useState([]);
  const [selectedMessId, setSelectedMessId] = useState(null);
  const [selectedMessPlan, setSelectedMessPlan] = useState('monthly-all');

  // Joint booking with roommate
  const [bookWithRoommate, setBookWithRoommate] = useState(false);
  const [connectedRoommates, setConnectedRoommates] = useState([]);
  const [selectedRoommateId, setSelectedRoommateId] = useState(null);
  const [loadingRoommates, setLoadingRoommates] = useState(false);

  // Room share discovery (open to roommate)
  const [openToRoommate, setOpenToRoommate] = useState(false);

  useEffect(() => {
    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  useEffect(() => {
    // fetch mess options once property is loaded
    const loadMess = async () => {
      if (!property) return;
      try {
        // search mess services by property location
        const resp = await messService.getAll({ location: property.location });
        // messService.getAll returns { messServices, pagination } per backend; normalize
        const list = Array.isArray(resp) ? resp : (resp.messServices || resp.data || []);
        setMessOptions(list || []);
      } catch (e) {
        console.error('Failed to load mess options:', e);
      } finally {
      }
    };
    loadMess();
  }, [property]);

  // Dynamically manage additional members array based on membersCount
  useEffect(() => {
    if (membersCount <= 1) {
      setAdditionalMembers([]);
    } else {
      const needed = membersCount - 1; // -1 because first member is the main booker
      setAdditionalMembers(prev => {
        const current = [...prev];
        // Add new empty members if needed
        while (current.length < needed) {
          current.push({
            fullName: '',
            phoneNumber: '',
            identityProofType: 'Aadhar Card',
            identityProofFile: null
          });
        }
        // Remove extra members if count decreased
        return current.slice(0, needed);
      });
    }
  }, [membersCount]);

  // Fetch connected roommates when bookWithRoommate is enabled
  useEffect(() => {
    if (bookWithRoommate) {
      fetchConnectedRoommates();
    }
  }, [bookWithRoommate]);

  const fetchConnectedRoommates = async () => {
    try {
      setLoadingRoommates(true);
      const data = await roommateService.getConnections();
      setConnectedRoommates(data.connections || []);
    } catch (error) {
      console.error('Failed to fetch roommates:', error);
      toast.error('Failed to load connected roommates');
    } finally {
      setLoadingRoommates(false);
    }
  };

  // Handler for updating individual member data
  const handleMemberChange = (index, updatedMember) => {
    setAdditionalMembers(prev => {
      const updated = [...prev];
      updated[index] = updatedMember;
      return updated;
    });
  };

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
      // Client-side validation: ensure selected room has enough availability and members fit capacity
      const basePayload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        mealsSelected: formData.mealsSelected,
        openToRoommate: openToRoommate,
      };

      if (selectedRoomId) {
        const room = property.rooms.find(r => r._id === selectedRoomId || r._id === String(selectedRoomId));
        if (!room) {
          toast.error('Selected room not found');
          return;
        }

        // roomsCount must not exceed availableRooms
        if ((roomsCount || 1) > (room.availableRooms || 0)) {
          toast.error(`Only ${room.availableRooms || 0} room(s) available for the selected type`);
          return;
        }

        // members must fit into selected rooms based on maxOccupancy
        const maxAllowedMembers = (room.maxOccupancy || 1) * (roomsCount || 1);
        if ((membersCount || 1) > maxAllowedMembers) {
          toast.error(`Total members exceed capacity. Max allowed: ${maxAllowedMembers}`);
          return;
        }

        basePayload.roomId = selectedRoomId;
        basePayload.roomsCount = roomsCount;
        basePayload.membersCount = membersCount;
      }

      // Attach mess selection if requested
      if (includeMess) {
        if (!selectedMessId) {
          toast.error('Please select a mess provider');
          return;
        }
        if (!selectedMessPlan) {
          toast.error('Please select a mess plan');
          return;
        }
        basePayload.messId = selectedMessId;
        basePayload.messPlan = selectedMessPlan;
        // align mess subscription start with booking start date by default
        basePayload.messStartDate = formData.startDate;
      }

      // Validate additional members if membersCount > 1
      if (membersCount > 1 && !bookWithRoommate) {
        const missingInfo = [];
        additionalMembers.forEach((member, index) => {
          if (!member.fullName) missingInfo.push(`Member ${index + 2}: Full Name required`);
          if (!member.phoneNumber) missingInfo.push(`Member ${index + 2}: Phone Number required`);
          else if (!/^\d{10}$/.test(member.phoneNumber)) missingInfo.push(`Member ${index + 2}: Phone must be 10 digits`);
          if (!member.identityProofFile) missingInfo.push(`Member ${index + 2}: ID proof upload required`);
        });

        if (missingInfo.length > 0) {
          toast.error(missingInfo[0]); // Show first error
          return;
        }

        // Use FormData for file upload
        const formDataObj = new FormData();

        // Append all base booking data
        Object.keys(basePayload).forEach(key => {
          formDataObj.append(key, basePayload[key]);
        });

        // Append additional members data with indexed keys
        additionalMembers.forEach((member, index) => {
          formDataObj.append(`member_${index}_fullName`, member.fullName);
          formDataObj.append(`member_${index}_phoneNumber`, member.phoneNumber);
          formDataObj.append(`member_${index}_identityProofType`, member.identityProofType);
          if (member.identityProofFile) {
            formDataObj.append(`member_${index}_idFile`, member.identityProofFile);
          }
        });

        setSubmitting(true);
        // Send FormData (backend should handle multipart/form-data)
        await bookingService.createWithFiles(propertyId, formDataObj);
        setBookingComplete(true);
        toast.success('Booking request submitted successfully!');
      } else if (bookWithRoommate) {
        // Joint booking with roommate
        if (!selectedRoommateId) {
          toast.error('Please select a roommate to book with');
          return;
        }

        setSubmitting(true);
        basePayload.roommateId = selectedRoommateId;
        // Set membersCount to 2 for joint booking if not already set
        if (!basePayload.membersCount || basePayload.membersCount < 2) {
          basePayload.membersCount = 2;
        }
        await roommateService.bookWithRoommate(propertyId, basePayload);
        setBookingComplete(true);
        toast.success('Joint booking created! Waiting for roommate confirmation.');
      } else {
        // Single member - use regular JSON payload
        setSubmitting(true);
        await bookingService.create(propertyId, basePayload);
        setBookingComplete(true);
        toast.success('Booking request submitted successfully!');
      }
    } catch (err) {
      console.error('Booking failed:', err);
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    let rent = property?.rent || 0;
    // If a room is selected, use room price where available and account for roomsCount/membersCount
    if (selectedRoomId && property?.rooms) {
      const room = property.rooms.find(r => r._id === selectedRoomId || r._id === String(selectedRoomId));
      if (room) {
        // Determine per-room charge
        const perRoom = (room.pricePerRoom && room.pricePerRoom > 0) ? room.pricePerRoom : null;
        const perBed = (room.pricePerBed && room.pricePerBed > 0) ? room.pricePerBed : null;
        if (perRoom !== null) {
          rent = perRoom * (roomsCount || 1);
        } else if (perBed !== null) {
          rent = perBed * (membersCount || 1);
        } else {
          rent = property?.rent || 0;
        }
      }
    }
    // Determine mess charges: prefer selected mess provider, fallback to legacy flag
    let messCharges = 0;
    if (selectedMessId && messOptions && messOptions.length > 0) {
      const mess = messOptions.find(m => m._id === selectedMessId || m._id === String(selectedMessId));
      if (mess) {
        const plan = selectedMessPlan || 'monthly-all';
        const pricing = mess.pricing || {};
        switch (plan) {
          case 'monthly-all':
            messCharges = pricing.monthly?.allMeals || 0;
            break;
          case 'monthly-two':
            messCharges = pricing.monthly?.twoMeals || 0;
            break;
          case 'monthly-one':
            messCharges = pricing.monthly?.oneMeal || 0;
            break;
          default:
            messCharges = pricing.monthly?.allMeals || 0;
        }
      }
    } else {
      messCharges = formData.mealsSelected ? 3000 : 0;
    }
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

  // Derived validation state for UI (disable confirm button if invalid)
  const selectedRoomObj = selectedRoomId ? property.rooms.find(r => r._id === selectedRoomId || r._id === String(selectedRoomId)) : null;
  const isInvalidSelection = Boolean(selectedRoomObj && ((roomsCount || 1) > (selectedRoomObj.availableRooms || 0) || (membersCount || 1) > ((selectedRoomObj.maxOccupancy || 1) * (roomsCount || 1))));
  const isInvalidMessSelection = includeMess && (!selectedMessId || !selectedMessPlan);

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
                    <div>
                      <div className="form-group">
                        <label>Choose Room Type</label>
                        <select value={selectedRoomId || ''} onChange={e => setSelectedRoomId(e.target.value)}>
                          <option value="">-- Select room type --</option>
                          {property.rooms.map(room => (
                            <option key={room._id} value={room._id} disabled={room.availableRooms <= 0}>
                              {room.roomName || room.roomNumber || room.roomType} - Available: {room.availableRooms} - Max: {room.maxOccupancy}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedRoomId && (() => {
                        const room = property.rooms.find(r => r._id === selectedRoomId || r._id === String(selectedRoomId));
                        if (!room) return null;
                        return (
                          <div>
                            <div className="form-group">
                              <label>Number of Rooms</label>
                              <input type="number" min={1} max={room.availableRooms || 1} value={roomsCount} onChange={e => setRoomsCount(Math.max(1, parseInt(e.target.value) || 1))} />
                              <span className="input-hint">Max {room.availableRooms} rooms available</span>
                            </div>

                            <div className="form-group">
                              <label>Total Members</label>
                              <input type="number" min={1} value={membersCount} onChange={e => setMembersCount(Math.max(1, parseInt(e.target.value) || 1))} />
                              <span className="input-hint">Max per room: {room.maxOccupancy} — total max: {room.maxOccupancy * roomsCount}</span>
                            </div>

                            {/* Book with Roommate Option */}
                            <div className="form-group">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={bookWithRoommate}
                                  onChange={(e) => {
                                    setBookWithRoommate(e.target.checked);
                                    if (e.target.checked) {
                                      // Auto-set members to 2 when booking with roommate
                                      setMembersCount(2);
                                    }
                                  }}
                                />
                                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>Book with a connected roommate</span>
                              </label>
                              {bookWithRoommate && (
                                <p className="input-hint" style={{ marginTop: '0.5rem' }}>
                                  Split the cost and book together with your connected roommate
                                </p>
                              )}
                            </div>

                            {bookWithRoommate && (
                              <div>
                                <div className="form-group">
                                  <label>Select Roommate</label>
                                  {loadingRoommates ? (
                                    <p className="input-hint">Loading roommates...</p>
                                  ) : connectedRoommates.length === 0 ? (
                                    <p className="input-hint" style={{ color: 'var(--error, #ef4444)' }}>
                                      No connected roommates found. Connect with roommates first.
                                    </p>
                                  ) : (
                                    <select
                                      value={selectedRoommateId || ''}
                                      onChange={(e) => setSelectedRoommateId(e.target.value)}
                                    >
                                      <option value="">-- Select a roommate --</option>
                                      {connectedRoommates.map((conn) => {
                                        const roommate = conn.sender._id === localStorage.getItem('userId')
                                          ? conn.receiver
                                          : conn.sender;
                                        return (
                                          <option key={roommate._id} value={roommate._id}>
                                            {roommate.name} • {conn.senderProfile?.city || conn.receiverProfile?.city || 'Location N/A'}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  )}
                                </div>
                                {selectedRoommateId && (
                                  <div className="roommate-booking-notice" style={{
                                    background: 'var(--bg-tertiary, #f0f9ff)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginTop: '1rem',
                                    border: '1px solid var(--border-light, #e5e7eb)'
                                  }}>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>
                                      📩 Your roommate will receive an invitation to confirm this joint booking
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Open to Roommate - Only for solo bookings */}
                            {membersCount === 1 && !bookWithRoommate && (
                              <div className="form-group">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={openToRoommate}
                                    onChange={(e) => setOpenToRoommate(e.target.checked)}
                                  />
                                  <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                                    I'm open to sharing this room with a roommate
                                  </span>
                                </label>
                                {openToRoommate && (
                                  <p className="input-hint" style={{ marginTop: '0.5rem' }}>
                                    ✨ Your booking will appear in "Find Room Shares" for other students to join
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Additional Member Forms - Only shown when members > 1 AND NOT booking with roommate */}
                            {membersCount > 1 && !bookWithRoommate && (
                              <div className="additional-members-section">
                                <div className="section-header">
                                  <HiOutlineUsers size={20} />
                                  <h3>Additional Members Information</h3>
                                  <span className="member-count-badge">{additionalMembers.length} member{additionalMembers.length !== 1 ? 's' : ''}</span>
                                </div>
                                <p className="section-description">
                                  Please provide details for all additional members who will be staying
                                </p>
                                {additionalMembers.map((member, index) => (
                                  <AdditionalMemberForm
                                    key={index}
                                    memberIndex={index}
                                    memberData={member}
                                    onChange={handleMemberChange}
                                  />
                                ))}
                              </div>
                            )}

                            <div className="form-group">
                              <label>
                                <input type="checkbox" checked={includeMess} onChange={e => setIncludeMess(e.target.checked)} /> Include Mess Service
                              </label>
                            </div>

                            {includeMess && (
                              <div>
                                <div className="form-group">
                                  <label>Choose Mess Provider</label>
                                  <select value={selectedMessId || ''} onChange={e => setSelectedMessId(e.target.value)}>
                                    <option value="">-- Select mess --</option>
                                    {messOptions.map(m => (
                                      <option key={m._id} value={m._id} disabled={!m.isActive}>
                                        {m.name} — {m.location} — ₹{m.pricing?.monthly?.allMeals ? m.pricing.monthly.allMeals : (m.pricing?.daily?.fullDay || '—')}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {selectedMessId && (
                                  <div className="form-group">
                                    <label>Plan</label>
                                    <select value={selectedMessPlan} onChange={e => setSelectedMessPlan(e.target.value)}>
                                      {/* Offer monthly options by default */}
                                      <option value="monthly-all">Monthly — All Meals</option>
                                      <option value="monthly-two">Monthly — Two Meals</option>
                                      <option value="monthly-one">Monthly — One Meal</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                    disabled={isInvalidSelection || isInvalidMessSelection || submitting}
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

        /* Additional Members Section */
        .additional-members-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .section-header h3 {
          flex: 1;
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .member-count-badge {
          padding: 0.375rem 0.75rem;
          background: var(--accent-primary-alpha);
          color: var(--accent-primary);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .section-description {
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        /* Success Page */

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
