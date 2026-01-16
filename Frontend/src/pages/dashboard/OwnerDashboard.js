import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ownerService, chatService, aiService, bookingService } from '../../services/propertyService';
import messService from '../../services/messService';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import ReviewList from '../../components/review/ReviewList';
import { LocationPicker, MapComponent } from '../../components/map';
import { ChatModal, ChatList } from '../../components/chat';
import documentService from '../../services/documentService';
import analyticsService from '../../services/analyticsService';
import toast from 'react-hot-toast';
import {
  HiOutlineHome,
  HiOutlinePlus,
  HiOutlineCurrencyRupee,
  HiOutlineLocationMarker,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlinePhotograph,
  HiOutlineWifi,
  HiOutlineCake,
  HiOutlineCalendar,
  HiOutlineMap,
  HiOutlineChatAlt2,
  HiOutlineBadgeCheck,
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineLightningBolt,
  HiOutlineUsers
} from 'react-icons/hi';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const initialFormState = {
    title: '',
    description: '',
    rent: '',
    location: '',
    amenities: '',
    meals: '',
    coordinates: null,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Chat state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatData, setSelectedChatData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState(null);
  
  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Owner bookings
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // AI Description Generator state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    location: '',
    rent: '',
    amenities: '',
    targetTenant: 'Students',
    propertyType: 'PG/Rental Room',
    nearbyPlaces: ''
  });

  // Mess Services state
  const [messServices, setMessServices] = useState([]);
  const [messLoading, setMessLoading] = useState(false);
  const [showAddMessModal, setShowAddMessModal] = useState(false);
  const [showEditMessModal, setShowEditMessModal] = useState(false);
  const [selectedMess, setSelectedMess] = useState(null);
  const [messSubmitting, setMessSubmitting] = useState(false);
  const [messSubscribers, setMessSubscribers] = useState([]);
  const [generatingMessDescription, setGeneratingMessDescription] = useState(false);
  
  const initialMessFormState = {
    name: '',
    description: '',
    location: { address: '' },
    cuisineType: [],
    mealTypes: ['lunch', 'dinner'],
    menu: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    pricing: {
      monthly: { oneMeal: '', twoMeals: '', fullDay: '' },
      daily: { perMeal: '', fullDay: '' }
    },
    timings: {
      breakfast: { start: '08:00', end: '10:00' },
      lunch: { start: '12:00', end: '14:00' },
      dinner: { start: '19:00', end: '21:00' }
    },
    features: [],
    contactNumber: ''
  };
  const [messFormData, setMessFormData] = useState(initialMessFormState);
  const [messImages, setMessImages] = useState([]);
  const [messImagePreviews, setMessImagePreviews] = useState([]);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      const response = await documentService.getVerificationStatus();
      setVerificationStatus(response.verificationStatus);
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await analyticsService.getOwnerStats();
      setAnalytics(response.stats);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchMessServices = useCallback(async () => {
    try {
      setMessLoading(true);
      const response = await messService.getMyServices();
      // Response is the array directly from backend
      setMessServices(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      console.error('Failed to fetch mess services:', err);
    } finally {
      setMessLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchVerificationStatus();
    fetchAnalytics();
    fetchMessServices();
  }, [fetchVerificationStatus, fetchAnalytics, fetchMessServices]);

  useEffect(() => {
    fetchOwnerBookings();
  }, []);

  const fetchOwnerBookings = async () => {
    try {
      setBookingsLoading(true);
      const data = await bookingService.getOwnerBookings();
      console.log('Owner bookings API response:', data);
      setOwnerBookings(Array.isArray(data) ? data : data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch owner bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleOwnerStatusUpdate = async (bookingId, status) => {
    try {
      setBookingActionLoading(bookingId);
      const resp = await bookingService.updateStatusOwner(bookingId, status);
      console.log('Owner update booking response:', resp);
      toast.success(`Booking ${status.toLowerCase()} successfully!`);
      fetchOwnerBookings();
      fetchProperties();
      setShowBookingModal(false);
    } catch (err) {
      console.error('Failed to update booking as owner:', err);
      // Show backend error message if available
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.error(serverMsg || 'Failed to update booking');
    } finally {
      setBookingActionLoading(null);
    }
  };

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await chatService.getUnreadCount();
        setUnreadCount(data.count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // Chat handlers
  const handleSelectChat = (conversation) => {
    setSelectedChatData({
      property: conversation.property,
      ownerId: conversation.otherUser._id,
      ownerName: conversation.otherUser.name
    });
    setChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setChatModalOpen(false);
    setSelectedChatData(null);
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await ownerService.getMyProperties();
      setProperties(data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    toast.promise(fetchProperties(), {
      loading: 'Refreshing properties...',
      success: 'Properties refreshed!',
      error: 'Failed to refresh'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // AI Description Generator handlers
  const handleAIInputChange = (e) => {
    const { name, value } = e.target;
    setAiFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAIModal = () => {
    // Pre-fill with form data if available
    setAiFormData({
      location: formData.location || '',
      rent: formData.rent || '',
      amenities: formData.amenities || '',
      targetTenant: 'Students',
      propertyType: 'PG/Rental Room',
      nearbyPlaces: ''
    });
    setShowAIModal(true);
  };

  const generateAIDescription = async () => {
    if (!aiFormData.location || !aiFormData.rent) {
      toast.error('Location and rent are required');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await aiService.generateDescription(aiFormData);
      if (response.success) {
        setFormData(prev => ({ ...prev, description: response.description }));
        toast.success('Description generated successfully! ✨');
        setShowAIModal(false);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    const totalImages = selectedImages.length + files.length;
    if (totalImages > 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });
    
    // Add to selected images
    setSelectedImages(prev => [...prev, ...validFiles]);
    
    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const resetImageState = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    
    // Validate minimum 3 images
    if (selectedImages.length < 3) {
      toast.error('Please upload at least 3 images');
      return;
    }
    
    try {
      setSubmitting(true);
      const propertyData = {
        title: formData.title,
        description: formData.description,
        rent: Number(formData.rent),
        location: formData.location,
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
        meals: formData.meals.split(',').map(m => m.trim()).filter(Boolean),
        coordinates: formData.coordinates ? { lat: formData.coordinates.lat, lng: formData.coordinates.lng } : null,
      };
      await ownerService.addProperty(propertyData, selectedImages);
      toast.success('Property added successfully!');
      setShowAddModal(false);
      setFormData(initialFormState);
      resetImageState();
      fetchProperties();
    } catch (err) {
      console.error('Failed to add property:', err);
      toast.error(err.response?.data?.message || 'Failed to add property');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title || '',
      description: property.description || '',
      rent: property.rent?.toString() || '',
      location: property.location || '',
      amenities: property.amenities?.join(', ') || '',
      meals: property.meals?.join(', ') || '',
      coordinates: property.coordinates || null,
    });
    setShowEditModal(true);
  };

  // Handle location selection from LocationPicker
  const handleLocationSelect = ({ lat, lng, address }) => {
    setFormData(prev => ({
      ...prev,
      location: address,
      coordinates: { lat, lng },
    }));
  };

  const handleEditProperty = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const propertyData = {
        title: formData.title,
        description: formData.description,
        rent: Number(formData.rent),
        location: formData.location,
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
        meals: formData.meals.split(',').map(m => m.trim()).filter(Boolean),
        coordinates: formData.coordinates ? { lat: formData.coordinates.lat, lng: formData.coordinates.lng } : null,
      };
      await ownerService.updateProperty(selectedProperty._id, propertyData);
      toast.success('Property updated successfully!');
      setShowEditModal(false);
      setFormData(initialFormState);
      setSelectedProperty(null);
      fetchProperties();
    } catch (err) {
      console.error('Failed to update property:', err);
      toast.error(err.response?.data?.message || 'Failed to update property');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (property) => {
    setSelectedProperty(property);
    setShowDeleteModal(true);
  };

  const handleDeleteProperty = async () => {
    try {
      setSubmitting(true);
      await ownerService.deleteProperty(selectedProperty._id);
      toast.success('Property deleted successfully!');
      setShowDeleteModal(false);
      setSelectedProperty(null);
      fetchProperties();
    } catch (err) {
      console.error('Failed to delete property:', err);
      toast.error(err.response?.data?.message || 'Failed to delete property');
    } finally {
      setSubmitting(false);
    }
  };

  // Mess Service Handlers
  const handleMessInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      if (subChild) {
        setMessFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      } else {
        setMessFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setMessFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCuisineToggle = (cuisine) => {
    setMessFormData(prev => ({
      ...prev,
      cuisineType: prev.cuisineType.includes(cuisine)
        ? prev.cuisineType.filter(c => c !== cuisine)
        : [...prev.cuisineType, cuisine]
    }));
  };

  const handleMealTypeToggle = (meal) => {
    setMessFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(meal)
        ? prev.mealTypes.filter(m => m !== meal)
        : [...prev.mealTypes, meal]
    }));
  };

  const handleFeatureToggle = (feature) => {
    setMessFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleGenerateMessDescription = async () => {
    try {
      setGeneratingMessDescription(true);
      const response = await aiService.generateMessDescription({
        name: messFormData.name,
        cuisineType: messFormData.cuisineType,
        mealTypes: messFormData.mealTypes,
        features: messFormData.features,
        pricing: messFormData.pricing,
        location: messFormData.location?.address || ''
      });
      
      if (response.success && response.description) {
        setMessFormData(prev => ({
          ...prev,
          description: response.description
        }));
        toast.success('Description generated with AI! ✨');
      } else {
        toast.error('Failed to generate description');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      toast.error('Failed to generate description');
    } finally {
      setGeneratingMessDescription(false);
    }
  };

  const handleMessImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + messImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    setMessImages(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMessImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMessImage = (index) => {
    setMessImages(prev => prev.filter((_, i) => i !== index));
    setMessImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMessService = async (e) => {
    e.preventDefault();
    try {
      setMessSubmitting(true);
      
      // Format data for the backend - map fullDay to allMeals for consistency
      const formattedPricing = {
        monthly: {
          oneMeal: messFormData.pricing.monthly.oneMeal,
          twoMeals: messFormData.pricing.monthly.twoMeals,
          allMeals: messFormData.pricing.monthly.fullDay, // Map fullDay to allMeals
          fullDay: messFormData.pricing.monthly.fullDay   // Keep for backward compat
        },
        daily: messFormData.pricing.daily
      };
      
      const formattedData = {
        name: messFormData.name,
        description: messFormData.description,
        location: messFormData.location?.address || messFormData.location,
        address: messFormData.location?.address || '',
        contactPhone: messFormData.contactNumber,
        mealTypes: messFormData.mealTypes,
        cuisineType: messFormData.cuisineType,
        menu: messFormData.menu,
        pricing: formattedPricing,
        timings: messFormData.timings,
        features: messFormData.features
      };
      
      await messService.create(formattedData, messImages);
      toast.success('Mess service created successfully!');
      setShowAddMessModal(false);
      setMessFormData(initialMessFormState);
      setMessImages([]);
      setMessImagePreviews([]);
      fetchMessServices();
    } catch (err) {
      console.error('Failed to create mess service:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create mess service');
    } finally {
      setMessSubmitting(false);
    }
  };

  const openEditMessModal = (mess) => {
    setSelectedMess(mess);
    setMessFormData({
      name: mess.name || '',
      description: mess.description || '',
      location: mess.location || { address: '' },
      cuisineType: mess.cuisineType || [],
      mealTypes: mess.mealTypes || ['lunch', 'dinner'],
      menu: mess.menu || { breakfast: [], lunch: [], dinner: [], snacks: [] },
      pricing: mess.pricing || {
        monthly: { oneMeal: '', twoMeals: '', fullDay: '' },
        daily: { perMeal: '', fullDay: '' }
      },
      timings: mess.timings || {
        breakfast: { start: '08:00', end: '10:00' },
        lunch: { start: '12:00', end: '14:00' },
        dinner: { start: '19:00', end: '21:00' }
      },
      features: mess.features || [],
      contactNumber: mess.contactPhone || mess.contactNumber || ''
    });
    setShowEditMessModal(true);
  };

  const handleUpdateMessService = async (e) => {
    e.preventDefault();
    try {
      setMessSubmitting(true);
      
      // Format data for the backend - map fullDay to allMeals for consistency
      const formattedPricing = {
        monthly: {
          oneMeal: messFormData.pricing.monthly.oneMeal,
          twoMeals: messFormData.pricing.monthly.twoMeals,
          allMeals: messFormData.pricing.monthly.fullDay, // Map fullDay to allMeals
          fullDay: messFormData.pricing.monthly.fullDay   // Keep for backward compat
        },
        daily: messFormData.pricing.daily
      };
      
      const formattedData = {
        name: messFormData.name,
        description: messFormData.description,
        location: messFormData.location?.address || messFormData.location,
        address: messFormData.location?.address || '',
        contactPhone: messFormData.contactNumber,
        mealTypes: messFormData.mealTypes,
        cuisineType: messFormData.cuisineType,
        menu: messFormData.menu,
        pricing: formattedPricing,
        timings: messFormData.timings,
        features: messFormData.features
      };
      
      await messService.update(selectedMess._id, formattedData);
      toast.success('Mess service updated successfully!');
      setShowEditMessModal(false);
      setSelectedMess(null);
      setMessFormData(initialMessFormState);
      fetchMessServices();
    } catch (err) {
      console.error('Failed to update mess service:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update mess service');
    } finally {
      setMessSubmitting(false);
    }
  };

  const handleDeleteMessService = async (messId) => {
    if (!window.confirm('Are you sure you want to delete this mess service?')) return;
    
    try {
      await messService.delete(messId);
      toast.success('Mess service deleted successfully!');
      fetchMessServices();
    } catch (err) {
      console.error('Failed to delete mess service:', err);
      toast.error(err.response?.data?.message || 'Failed to delete mess service');
    }
  };

  const fetchMessSubscribers = async (messId) => {
    try {
      const response = await messService.getSubscribers(messId);
      setMessSubscribers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    }
  };

  const handleApproveSubscription = async (subscriptionId) => {
    try {
      await messService.approveSubscription(subscriptionId);
      toast.success('Subscription approved!');
      if (selectedMess) {
        fetchMessSubscribers(selectedMess._id);
      }
    } catch (err) {
      console.error('Failed to approve subscription:', err);
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const stats = {
    totalProperties: properties.length,
    availableProperties: properties.filter(p => p.isAvailable).length,
    bookedProperties: properties.filter(p => !p.isAvailable).length,
    totalRevenue: properties.filter(p => !p.isAvailable).reduce((sum, p) => sum + (p.rent || 0), 0),
  };

  const filteredProperties = properties.filter(property => {
    if (activeTab === 'available') return property.isAvailable;
    if (activeTab === 'booked') return !property.isAvailable;
    return true;
  });

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <Loading size="lg" text="Loading your properties..." />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
        >
          <div className="header-content">
            <h1>Property Owner Dashboard</h1>
            <p>Welcome back, {user?.name || 'Owner'}! Manage your properties and track bookings.</p>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={handleRefresh} title="Refresh properties">
              <HiOutlineRefresh size={20} />
            </button>
            <Button
              variant="primary"
              leftIcon={<HiOutlinePlus size={20} />}
              onClick={() => setShowAddModal(true)}
            >
              Add Property
            </Button>
          </div>
        </motion.div>

        {/* Verification Status Banner */}
        {verificationStatus && !verificationStatus.overall && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{ marginBottom: '1.5rem' }}
          >
            <Card padding="md" style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ 
                  width: '60px', height: '60px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--primary)', color: 'white', borderRadius: '12px'
                }}>
                  <HiOutlineBadgeCheck size={32} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Complete Your Verification</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Verify your identity and property documents to build trust with students.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                    <span style={{ color: verificationStatus.identity?.verified ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {verificationStatus.identity?.verified ? '✓' : '○'} Identity
                    </span>
                    <span style={{ color: verificationStatus.address?.verified ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {verificationStatus.address?.verified ? '✓' : '○'} Address
                    </span>
                    <span style={{ color: verificationStatus.property?.verified ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {verificationStatus.property?.verified ? '✓' : '○'} Property
                    </span>
                  </div>
                </div>
                <Link to="/verification">
                  <Button variant="primary" rightIcon={<HiOutlineArrowRight size={18} />}>
                    Verify Now
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stats-grid"
        >
          <Card padding="md" className="stat-card">
            <div className="stat-icon">
              <HiOutlineHome size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalProperties}</span>
              <span className="stat-label">Total Properties</span>
            </div>
          </Card>

          <Card padding="md" className="stat-card">
            <div className="stat-icon available">
              <HiOutlineCheck size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.availableProperties}</span>
              <span className="stat-label">Available</span>
            </div>
          </Card>

          <Card padding="md" className="stat-card">
            <div className="stat-icon booked">
              <HiOutlineEye size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.bookedProperties}</span>
              <span className="stat-label">Booked</span>
            </div>
          </Card>

          <Card padding="md" className="stat-card">
            <div className="stat-icon revenue">
              <HiOutlineCurrencyRupee size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">₹{stats.totalRevenue.toLocaleString()}</span>
              <span className="stat-label">Monthly Revenue</span>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="tabs-container"
        >
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Properties ({properties.length})
          </button>
          <button
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available ({stats.availableProperties})
          </button>
          <button
            className={`tab ${activeTab === 'booked' ? 'active' : ''}`}
            onClick={() => setActiveTab('booked')}
          >
            Booked ({stats.bookedProperties})
          </button>
          <button
            className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <HiOutlineChatAlt2 size={16} />
            Messages
            {unreadCount > 0 && (
              <Badge variant="primary" className="tab-badge">{unreadCount}</Badge>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
          <button
            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
          <button
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <HiOutlineChartBar size={16} />
            Analytics
          </button>
          <button
            className={`tab ${activeTab === 'mess' ? 'active' : ''}`}
            onClick={() => setActiveTab('mess')}
          >
            <HiOutlineCake size={16} />
            Mess Services ({messServices.length})
          </button>
        </motion.div>

        {/* Bookings Section */}
        {activeTab === 'bookings' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg">
              <div className="card-header">
                <h2>
                  <HiOutlineEye size={24} />
                  Booking Requests
                </h2>
              </div>

              {bookingsLoading ? (
                <Loading size="md" text="Loading bookings..." />
              ) : ownerBookings.length === 0 ? (
                <EmptyState
                  icon={HiOutlineEye}
                  title="No bookings"
                  description="No booking requests for your properties yet."
                />
              ) : (
                <div className="bookings-grid">
                  {ownerBookings.map((booking) => (
                    <div key={booking._id} className="booking-card">
                      <div className="booking-header">
                        <Badge variant={booking.status === 'Confirmed' ? 'success' : booking.status === 'Pending' ? 'warning' : 'error'}>
                          {booking.status}
                        </Badge>
                        <span className="booking-id">#{booking._id?.slice(-6)}</span>
                      </div>

                      <div className="booking-student">
                        <div className="user-avatar">{booking.student?.name?.charAt(0) || 'U'}</div>
                        <div className="user-info">
                          <span className="user-name">{booking.student?.name || 'Unknown'}</span>
                          <span className="user-email">{booking.student?.email || 'No email'}</span>
                        </div>
                      </div>

                      <div className="booking-property">
                        <HiOutlineHome size={18} />
                        <span>{booking.property?.title || 'Property'}</span>
                      </div>

                      <div className="booking-dates">
                        <HiOutlineCalendar size={16} />
                        <span>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</span>
                      </div>

                      <div className="booking-actions">
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedBooking(booking); setShowBookingModal(true); }} leftIcon={<HiOutlineEye size={16} />}>View</Button>
                        {booking.status === 'Pending' && (
                          <>
                            <Button variant="primary" size="sm" onClick={() => handleOwnerStatusUpdate(booking._id, 'Confirmed')} isLoading={bookingActionLoading === booking._id} leftIcon={<HiOutlineCheck size={16} />}>Approve</Button>
                            <Button variant="danger" size="sm" onClick={() => handleOwnerStatusUpdate(booking._id, 'Rejected')} isLoading={bookingActionLoading === booking._id} leftIcon={<HiOutlineX size={16} />}>Reject</Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        ) : 
        // Messages Section
        activeTab === 'reviews' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg">
              <div className="card-header">
                <h2>
                  <HiOutlineStar size={24} />
                  Property Reviews
                </h2>
              </div>
              {properties.length === 0 ? (
                <EmptyState icon={HiOutlineStar} title="No properties" description="Add properties to receive reviews." />
              ) : (
                <div className="owner-reviews-list">
                  {properties.map((property) => (
                    <Card key={property._id} padding="md" className="property-review-card">
                      <div className="property-review-header">
                        <h3>{property.title}</h3>
                        <span className="property-meta">₹{property.rent?.toLocaleString()}/month</span>
                      </div>
                      <ReviewList propertyId={property._id} averageRating={property.rating?.average || 0} reviewCount={property.rating?.count || 0} ratingBreakdown={property.rating?.distribution || {}} allowOwnerRespond={true} />
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        ) : 
        activeTab === 'messages' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg" className="messages-section">
              <div className="card-header">
                <h2>
                  <HiOutlineChatAlt2 size={24} />
                  Student Messages
                </h2>
              </div>
              <ChatList onSelectChat={handleSelectChat} />
            </Card>
          </motion.div>
        ) : activeTab === 'analytics' ? (
          /* Analytics Section */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {analyticsLoading ? (
              <Card padding="xl">
                <Loading size="lg" text="Loading analytics..." />
              </Card>
            ) : analytics ? (
              <div className="analytics-section">
                {/* Analytics Overview Cards */}
                <div className="analytics-grid">
                  <Card padding="md" className="analytics-card">
                    <div className="analytics-card-header">
                      <div className="analytics-icon occupancy">
                        <HiOutlineChartBar size={24} />
                      </div>
                      <span className="analytics-label">Occupancy Rate</span>
                    </div>
                    <div className="analytics-value-large">{analytics.properties?.occupancyRate || 0}%</div>
                    <div className="analytics-bar">
                      <div 
                        className="analytics-bar-fill" 
                        style={{ width: `${analytics.properties?.occupancyRate || 0}%` }}
                      />
                    </div>
                    <div className="analytics-detail">
                      {analytics.properties?.occupied || 0} of {analytics.properties?.total || 0} properties occupied
                    </div>
                  </Card>

                  <Card padding="md" className="analytics-card">
                    <div className="analytics-card-header">
                      <div className="analytics-icon revenue">
                        <HiOutlineCurrencyRupee size={24} />
                      </div>
                      <span className="analytics-label">Total Revenue</span>
                    </div>
                    <div className="analytics-value-large">₹{(analytics.revenue?.total || 0).toLocaleString()}</div>
                    <div className="analytics-detail">
                      Avg ₹{(analytics.revenue?.averagePerProperty || 0).toLocaleString()} per property
                    </div>
                  </Card>

                  <Card padding="md" className="analytics-card">
                    <div className="analytics-card-header">
                      <div className="analytics-icon bookings">
                        <HiOutlineEye size={24} />
                      </div>
                      <span className="analytics-label">Total Bookings</span>
                    </div>
                    <div className="analytics-value-large">{analytics.bookings?.total || 0}</div>
                    <div className="analytics-breakdown">
                      <span className="breakdown-item confirmed">
                        <HiOutlineCheck size={14} /> {analytics.bookings?.confirmed || 0} Confirmed
                      </span>
                      <span className="breakdown-item pending">
                        ⏳ {analytics.bookings?.pending || 0} Pending
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Revenue Chart */}
                <Card padding="lg" className="chart-card">
                  <div className="card-header">
                    <h2>
                      <HiOutlineTrendingUp size={24} />
                      Revenue Trend (Last 6 Months)
                    </h2>
                  </div>
                  <div className="chart-container">
                    <div className="bar-chart">
                      {analytics.revenue?.monthly?.map((month, index) => {
                        const maxRevenue = Math.max(...analytics.revenue.monthly.map(m => m.revenue), 1);
                        const height = (month.revenue / maxRevenue) * 100;
                        return (
                          <div key={index} className="bar-item">
                            <div className="bar-wrapper">
                              <div 
                                className="bar" 
                                style={{ height: `${height}%` }}
                                title={`₹${month.revenue.toLocaleString()}`}
                              >
                                <span className="bar-value">₹{month.revenue >= 1000 ? `${(month.revenue/1000).toFixed(0)}k` : month.revenue}</span>
                              </div>
                            </div>
                            <span className="bar-label">{month.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Property Performance */}
                <Card padding="lg" className="performance-card">
                  <div className="card-header">
                    <h2>
                      <HiOutlineStar size={24} />
                      Property Performance
                    </h2>
                  </div>
                  {analytics.propertyPerformance?.length > 0 ? (
                    <div className="performance-table">
                      <div className="performance-header">
                        <span>Property</span>
                        <span>Rent</span>
                        <span>Bookings</span>
                        <span>Revenue</span>
                        <span>Rating</span>
                        <span>Status</span>
                      </div>
                      {analytics.propertyPerformance.map((property) => (
                        <div key={property.id} className="performance-row">
                          <span className="property-title">{property.title}</span>
                          <span>₹{property.rent?.toLocaleString()}</span>
                          <span>{property.confirmedBookings}</span>
                          <span className="revenue-cell">₹{property.revenue?.toLocaleString()}</span>
                          <span className="rating-cell">
                            <HiOutlineStar size={14} />
                            {property.rating?.toFixed(1) || '0.0'}
                          </span>
                          <span>
                            <Badge variant={property.isAvailable ? 'success' : 'warning'}>
                              {property.isAvailable ? 'Available' : 'Booked'}
                            </Badge>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={HiOutlineHome}
                      title="No properties yet"
                      description="Add properties to see their performance analytics."
                    />
                  )}
                </Card>
              </div>
            ) : (
              <Card padding="xl">
                <EmptyState
                  icon={HiOutlineChartBar}
                  title="No analytics available"
                  description="Analytics will appear here once you have properties and bookings."
                />
              </Card>
            )}
          </motion.div>
        ) : activeTab === 'mess' ? (
          /* Mess Services Section */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg" className="mess-section">
              <div className="card-header">
                <h2>
                  <HiOutlineCake size={24} />
                  My Mess Services
                </h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddMessModal(true)}
                >
                  <HiOutlinePlus size={16} />
                  Add Mess Service
                </Button>
              </div>
              
              {messLoading ? (
                <Loading size="md" text="Loading mess services..." />
              ) : messServices.length === 0 ? (
                <EmptyState
                  icon={HiOutlineCake}
                  title="No mess services yet"
                  description="Start offering mess/tiffin services to students nearby."
                  action={{
                    label: 'Add Mess Service',
                    onClick: () => setShowAddMessModal(true),
                    icon: <HiOutlinePlus size={18} />,
                  }}
                />
              ) : (
                <div className="mess-grid">
                  {messServices.map((mess) => (
                    <Card key={mess._id} padding="md" className="mess-card">
                      <div className="mess-card-header">
                        <h3>{mess.name}</h3>
                        {mess.isVerified && (
                          <Badge variant="success" size="sm">
                            <HiOutlineBadgeCheck size={14} /> Verified
                          </Badge>
                        )}
                      </div>
                      
                      <p className="mess-location">
                        <HiOutlineLocationMarker size={16} />
                        {mess.location?.address || 'Location not set'}
                      </p>
                      
                      <div className="mess-stats">
                        <div className="mess-stat">
                          <span className="stat-value">{mess.subscribers || 0}</span>
                          <span className="stat-label">Subscribers</span>
                        </div>
                        <div className="mess-stat">
                          <span className="stat-value">₹{mess.pricing?.monthly?.twoMeals || 0}</span>
                          <span className="stat-label">Per Month</span>
                        </div>
                        <div className="mess-stat">
                          <span className="stat-value">{mess.ratings?.average?.toFixed(1) || '0.0'}</span>
                          <span className="stat-label">Rating</span>
                        </div>
                      </div>
                      
                      <div className="mess-meals">
                        {mess.mealTypes?.map(meal => (
                          <span key={meal} className="meal-tag">{meal}</span>
                        ))}
                      </div>
                      
                      <div className="mess-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditMessModal(mess)}
                        >
                          <HiOutlinePencil size={16} />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMess(mess);
                            fetchMessSubscribers(mess._id);
                          }}
                        >
                          <HiOutlineUsers size={16} />
                          Subscribers
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMessService(mess._id)}
                          className="delete-btn"
                        >
                          <HiOutlineTrash size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
            
            {/* Subscribers List Modal */}
            {selectedMess && messSubscribers.length > 0 && (
              <Card padding="lg" className="subscribers-section" style={{ marginTop: '1rem' }}>
                <div className="card-header">
                  <h2>
                    <HiOutlineUsers size={24} />
                    Subscribers - {selectedMess.name}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMess(null);
                      setMessSubscribers([]);
                    }}
                  >
                    <HiOutlineX size={16} />
                  </Button>
                </div>
                <div className="subscribers-list">
                  {messSubscribers.map((sub) => (
                    <div key={sub._id} className="subscriber-item">
                      <div className="subscriber-info">
                        <span className="subscriber-name">{sub.user?.name || 'Unknown'}</span>
                        <span className="subscriber-email">{sub.user?.email && (<>
                          | <a href={`mailto:${sub.user.email}`}>{sub.user.email}</a>
                        </>)}</span>
                        <span className="subscriber-plan">Plan: {sub.plan} {sub.selectedMeals?.length > 0 && (<>
                          | Meals: {sub.selectedMeals.join(', ')}
                        </>)}
                        </span>
                        <span className="subscriber-date">Subscribed: {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span className="subscriber-status">
                          <Badge variant={sub.status === 'Active' ? 'success' : sub.status === 'Pending' ? 'warning' : 'gray'}>
                            {sub.status}
                          </Badge>
                        </span>
                      </div>
                      <div className="subscriber-actions">
                        {sub.status === 'Pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveSubscription(sub._id)}
                          >
                            Approve
                          </Button>
                        )}
                        {sub.status === 'Active' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              // Optionally implement cancel subscription for owner
                              toast('Cancel subscription not implemented');
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <style>{`
                  .subscribers-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                  }
                  .subscriber-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1rem 0;
                    border-bottom: 1px solid var(--border-light);
                  }
                  .subscriber-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                  }
                  .subscriber-name {
                    font-weight: 600;
                  }
                  .subscriber-email a {
                    color: var(--primary);
                    text-decoration: underline;
                  }
                  .subscriber-plan, .subscriber-date {
                    font-size: 0.95em;
                    color: var(--text-secondary);
                  }
                  .subscriber-status {
                    margin-top: 0.25rem;
                  }
                  .subscriber-actions {
                    display: flex;
                    gap: 0.5rem;
                  }
                `}</style>
              </Card>
            )}
          </motion.div>
        ) : (
        /* Properties Grid */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredProperties.length === 0 ? (
            <Card padding="xl">
              <EmptyState
                icon={HiOutlineHome}
                title={activeTab === 'all' ? 'No properties listed' : `No ${activeTab} properties`}
                description={activeTab === 'all' 
                  ? 'Start by adding your first property to get bookings from students.'
                  : `You don't have any ${activeTab} properties at the moment.`}
                action={activeTab === 'all' ? {
                  label: 'Add Property',
                  onClick: () => setShowAddModal(true),
                  icon: <HiOutlinePlus size={18} />,
                } : undefined}
              />
            </Card>
          ) : (
            <div className="properties-grid">
              {filteredProperties.map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card padding="lg" hoverable className="property-card">
                    <div className="property-header">
                      <div className="property-image">
                        {property.images && property.images.length > 0 ? (
                          <img 
                            src={`http://localhost:4000${property.images[0]}`} 
                            alt={property.title}
                          />
                        ) : (
                          <HiOutlinePhotograph size={32} />
                        )}
                      </div>
                      <div className="property-badge">
                        <Badge variant={property.isAvailable ? 'success' : 'warning'}>
                          {property.isAvailable ? 'Available' : 'Booked'}
                        </Badge>
                      </div>
                    </div>

                    <div className="property-body">
                      <h3 className="property-title">{property.title}</h3>
                      
                      {property.location && (
                        <p className="property-location">
                          <HiOutlineLocationMarker size={16} />
                          {property.location}
                        </p>
                      )}

                      <p className="property-description">
                        {property.description || 'No description available'}
                      </p>

                      <div className="property-rent">
                        <HiOutlineCurrencyRupee size={18} />
                        <span className="rent-amount">₹{property.rent?.toLocaleString()}</span>
                        <span className="rent-period">/month</span>
                      </div>

                      {property.amenities?.length > 0 && (
                        <div className="property-tags">
                          <HiOutlineWifi size={14} />
                          {property.amenities.slice(0, 3).map((amenity, i) => (
                            <span key={i} className="tag">{amenity}</span>
                          ))}
                          {property.amenities.length > 3 && (
                            <span className="tag more">+{property.amenities.length - 3}</span>
                          )}
                        </div>
                      )}

                      {property.meals?.length > 0 && (
                        <div className="property-tags meals">
                          <HiOutlineCake size={14} />
                          {property.meals.map((meal, i) => (
                            <span key={i} className="tag">{meal}</span>
                          ))}
                        </div>
                      )}

                      {/* Mini Map Preview */}
                      {property.coordinates?.lat && property.coordinates?.lng && (
                        <div className="property-mini-map">
                          <div className="mini-map-header">
                            <HiOutlineMap size={14} />
                            <span>Location on Map</span>
                          </div>
                          <MapComponent
                            center={[property.coordinates.lat, property.coordinates.lng]}
                            zoom={14}
                            markers={[{
                              id: property._id,
                              lat: property.coordinates.lat,
                              lng: property.coordinates.lng,
                              title: property.title,
                            }]}
                            height="120px"
                            interactive={false}
                          />
                        </div>
                      )}
                    </div>

                    <div className="property-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<HiOutlinePencil size={16} />}
                        onClick={() => openEditModal(property)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<HiOutlineTrash size={16} />}
                        onClick={() => openDeleteModal(property)}
                        className="delete-btn"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        )}

        {/* Chat Modal */}
        {selectedChatData && (
          <ChatModal
            isOpen={chatModalOpen}
            onClose={handleCloseChat}
            property={selectedChatData.property}
            ownerId={selectedChatData.ownerId}
            ownerName={selectedChatData.ownerName}
          />
        )}

        {/* Booking Detail Modal */}
        <AnimatePresence>
          {showBookingModal && selectedBooking && (
            <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Booking Details</h2>
                  <button className="close-btn" onClick={() => setShowBookingModal(false)}>
                    <HiOutlineX size={24} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="detail-section">
                    <h3>Booking Status</h3>
                    <Badge variant={selectedBooking.status === 'Confirmed' ? 'success' : selectedBooking.status === 'Pending' ? 'warning' : 'error'} size="lg">{selectedBooking.status}</Badge>
                    <p className="booking-id-full">Booking ID: {selectedBooking._id}</p>
                  </div>

                  <div className="detail-section">
                    <h3>Student Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedBooking.student?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedBooking.student?.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Property Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Title:</span>
                      <span className="detail-value">{selectedBooking.property?.title || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Booking Duration</h3>
                    <div className="detail-row">
                      <span className="detail-label">Start Date:</span>
                      <span className="detail-value">{new Date(selectedBooking.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">End Date:</span>
                      <span className="detail-value">{new Date(selectedBooking.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {selectedBooking.status === 'Pending' && (
                  <div className="modal-actions">
                    <Button variant="danger" onClick={() => handleOwnerStatusUpdate(selectedBooking._id, 'Rejected')} isLoading={bookingActionLoading === selectedBooking._id} leftIcon={<HiOutlineX size={16} />}>Reject Booking</Button>
                    <Button variant="primary" onClick={() => handleOwnerStatusUpdate(selectedBooking._id, 'Confirmed')} isLoading={bookingActionLoading === selectedBooking._id} leftIcon={<HiOutlineCheck size={16} />}>Approve Booking</Button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Property Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Add New Property</h2>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  <HiOutlineX size={24} />
                </button>
              </div>

              <form onSubmit={handleAddProperty} className="modal-form">
                <div className="form-group">
                  <Input
                    label="Property Title *"
                    name="title"
                    placeholder="e.g., Cozy 2BHK in Koramangala"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label">Description</label>
                    <button
                      type="button"
                      className="ai-generate-btn"
                      onClick={openAIModal}
                    >
                      <HiOutlineSparkles size={16} />
                      Generate with AI
                    </button>
                  </div>
                  <textarea
                    name="description"
                    className="form-input"
                    placeholder="Describe your property, its features, and nearby amenities..."
                    value={Array.isArray(formData.description) ? formData.description.map((step, idx) => `${idx + 1}. ${step}`).join('\n') : formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <Input
                      label="Monthly Rent (₹) *"
                      name="rent"
                      type="number"
                      placeholder="e.g., 15000"
                      value={formData.rent}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Location Picker with Map */}
                <div className="form-group">
                  <label className="form-label">Property Location</label>
                  <LocationPicker
                    initialLocation={formData.coordinates}
                    onLocationChange={handleLocationSelect}
                    height="280px"
                    placeholder="Search for property location..."
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Amenities (comma-separated)"
                    name="amenities"
                    placeholder="e.g., WiFi, AC, TV, Washing Machine, Parking"
                    value={formData.amenities}
                    onChange={handleInputChange}
                  />
                  <span className="input-hint">Separate each amenity with a comma</span>
                </div>

                <div className="form-group">
                  <Input
                    label="Meals Included (comma-separated)"
                    name="meals"
                    placeholder="e.g., Breakfast, Lunch, Dinner"
                    value={formData.meals}
                    onChange={handleInputChange}
                  />
                  <span className="input-hint">Leave empty if meals are not included</span>
                </div>

                {/* Image Upload Section */}
                <div className="form-group">
                  <label className="form-label">
                    Property Images * <span className="image-count">({selectedImages.length}/6)</span>
                  </label>
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="property-images"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden-input"
                    />
                    <label htmlFor="property-images" className="upload-label">
                      <HiOutlinePhotograph size={32} />
                      <span>Click to upload images</span>
                      <span className="upload-hint">Min 3, Max 6 images • JPEG, PNG, WebP • Max 5MB each</span>
                    </label>
                  </div>
                  
                  {imagePreviews.length > 0 && (
                    <div className="image-previews">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="preview-item">
                          <img src={preview} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage(index)}
                          >
                            <HiOutlineX size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedImages.length < 3 && (
                    <span className="input-hint error-hint">
                      Please upload at least {3 - selectedImages.length} more image{3 - selectedImages.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="modal-actions">
                  <Button type="button" variant="secondary" onClick={() => { setShowAddModal(false); resetImageState(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={submitting} disabled={selectedImages.length < 3}>
                    Add Property
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Property Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Edit Property</h2>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  <HiOutlineX size={24} />
                </button>
              </div>

              <form onSubmit={handleEditProperty} className="modal-form">
                <div className="form-group">
                  <Input
                    label="Property Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label">Description</label>
                    <button
                      type="button"
                      className="ai-generate-btn"
                      onClick={openAIModal}
                    >
                      <HiOutlineSparkles size={16} />
                      Generate with AI
                    </button>
                  </div>
                  <textarea
                    name="description"
                    className="form-input"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <Input
                      label="Monthly Rent (₹) *"
                      name="rent"
                      type="number"
                      value={formData.rent}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Location Picker with Map */}
                <div className="form-group">
                  <label className="form-label">Property Location</label>
                  <LocationPicker
                    initialLocation={formData.coordinates}
                    onLocationChange={handleLocationSelect}
                    height="280px"
                    placeholder="Search for property location..."
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Amenities (comma-separated)"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Meals Included (comma-separated)"
                    name="meals"
                    value={formData.meals}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="modal-actions">
                  <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={submitting}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal modal-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Delete Property</h2>
                <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                  <HiOutlineX size={24} />
                </button>
              </div>

              <div className="modal-body">
                <div className="delete-warning">
                  <HiOutlineTrash size={48} />
                </div>
                <p>Are you sure you want to delete <strong>"{selectedProperty?.title}"</strong>?</p>
                <p className="text-muted">This action cannot be undone.</p>
              </div>

              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteProperty} isLoading={submitting}>
                  Delete Property
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Description Generator Modal */}
      <AnimatePresence>
        {showAIModal && (
          <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal ai-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header ai-modal-header">
                <div className="ai-header-content">
                  <HiOutlineSparkles className="ai-icon" size={24} />
                  <div>
                    <h2>AI Description Generator</h2>
                    <p>Generate professional property descriptions instantly</p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setShowAIModal(false)}>
                  <HiOutlineX size={24} />
                </button>
              </div>

              <div className="ai-modal-body">
                <div className="ai-form-grid">
                  <div className="form-group">
                    <label className="form-label">Location *</label>
                    <input
                      type="text"
                      name="location"
                      className="form-input"
                      placeholder="e.g., Koramangala, Bangalore"
                      value={aiFormData.location}
                      onChange={handleAIInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Monthly Rent (₹) *</label>
                    <input
                      type="number"
                      name="rent"
                      className="form-input"
                      placeholder="e.g., 12000"
                      value={aiFormData.rent}
                      onChange={handleAIInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Property Type</label>
                    <select
                      name="propertyType"
                      className="form-input"
                      value={aiFormData.propertyType}
                      onChange={handleAIInputChange}
                    >
                      <option value="PG/Rental Room">PG/Rental Room</option>
                      <option value="Hostel">Hostel</option>
                      <option value="1BHK Apartment">1BHK Apartment</option>
                      <option value="2BHK Apartment">2BHK Apartment</option>
                      <option value="Shared Room">Shared Room</option>
                      <option value="Single Room">Single Room</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Tenant</label>
                    <select
                      name="targetTenant"
                      className="form-input"
                      value={aiFormData.targetTenant}
                      onChange={handleAIInputChange}
                    >
                      <option value="Students">Students</option>
                      <option value="Working Professionals">Working Professionals</option>
                      <option value="Students & Working Professionals">Students & Working Professionals</option>
                      <option value="Families">Families</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Amenities</label>
                    <input
                      type="text"
                      name="amenities"
                      className="form-input"
                      placeholder="e.g., WiFi, AC, TV, Washing Machine, Parking"
                      value={aiFormData.amenities}
                      onChange={handleAIInputChange}
                    />
                    <span className="input-hint">Separate amenities with commas</span>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Nearby Places (Optional)</label>
                    <input
                      type="text"
                      name="nearbyPlaces"
                      className="form-input"
                      placeholder="e.g., Christ University, Forum Mall, Metro Station"
                      value={aiFormData.nearbyPlaces}
                      onChange={handleAIInputChange}
                    />
                    <span className="input-hint">Mention nearby colleges, malls, or transit points</span>
                  </div>
                </div>

                <div className="ai-features">
                  <div className="ai-feature">
                    <HiOutlineLightningBolt />
                    <span>SEO Optimized</span>
                  </div>
                  <div className="ai-feature">
                    <HiOutlineStar />
                    <span>Professional Tone</span>
                  </div>
                  <div className="ai-feature">
                    <HiOutlineLocationMarker />
                    <span>Highlights Nearby Places</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem 0 0 0', background: 'inherit', position: 'sticky', bottom: 0, zIndex: 10 }}>
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowAIModal(false)}
                    style={{ minWidth: '120px', fontWeight: 500 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={generateAIDescription} 
                    isLoading={aiGenerating}
                    disabled={!aiFormData.location || !aiFormData.rent}
                    style={{ minWidth: '180px', fontWeight: 600, fontSize: '1rem', boxShadow: '0 2px 8px rgba(102,126,234,0.15)' }}
                  >
                    <HiOutlineSparkles size={20} style={{ marginRight: 8 }} />
                    Generate Description
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Mess Service Modal */}
      <AnimatePresence>
        {showAddMessModal && (
          <div className="modal-overlay" onClick={() => setShowAddMessModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content large-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Add Mess Service</h2>
                <button className="close-btn" onClick={() => setShowAddMessModal(false)}>
                  <HiOutlineX size={24} />
                </button>
              </div>

              <form onSubmit={handleAddMessService} className="modal-form">
                <div className="form-grid">
                  <Input
                    label="Mess Name"
                    name="name"
                    value={messFormData.name}
                    onChange={handleMessInputChange}
                    placeholder="e.g., Mom's Kitchen Tiffin"
                    required
                  />
                  
                  <Input
                    label="Contact Number"
                    name="contactNumber"
                    value={messFormData.contactNumber}
                    onChange={handleMessInputChange}
                    placeholder="e.g., 9876543210"
                  />
                </div>

                <Input
                  label="Address"
                  name="location.address"
                  value={messFormData.location.address}
                  onChange={handleMessInputChange}
                  placeholder="Full address"
                  required
                />

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateMessDescription}
                      disabled={generatingMessDescription}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: generatingMessDescription ? 'wait' : 'pointer',
                        opacity: generatingMessDescription ? 0.7 : 1
                      }}
                    >
                      <HiOutlineSparkles size={14} />
                      {generatingMessDescription ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                  <textarea
                    name="description"
                    value={Array.isArray(messFormData.description) ? messFormData.description.map((step, idx) => `${idx + 1}. ${step}`).join('\n') : messFormData.description}
                    onChange={handleMessInputChange}
                    placeholder="Describe your mess service, or click 'Generate with AI' to auto-generate!"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      minHeight: '120px',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-color)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-color)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Cuisine Type</label>
                  <div className="tag-selector">
                    {['North Indian', 'South Indian', 'Gujarati', 'Maharashtrian', 'Rajasthani', 'Bengali', 'Chinese', 'Continental'].map(cuisine => (
                      <button
                        key={cuisine}
                        type="button"
                        className={`tag ${messFormData.cuisineType.includes(cuisine) ? 'active' : ''}`}
                        onClick={() => handleCuisineToggle(cuisine)}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Meal Types</label>
                  <div className="tag-selector">
                    {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => (
                      <button
                        key={meal}
                        type="button"
                        className={`tag ${messFormData.mealTypes.includes(meal) ? 'active' : ''}`}
                        onClick={() => handleMealTypeToggle(meal)}
                      >
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Features</label>
                  <div className="tag-selector">
                    {['homeDelivery', 'pureVeg', 'jainFood', 'customizable', 'hygienic', 'affordablePricing'].map(feature => (
                      <button
                        key={feature}
                        type="button"
                        className={`tag ${messFormData.features.includes(feature) ? 'active' : ''}`}
                        onClick={() => handleFeatureToggle(feature)}
                      >
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Monthly Pricing (₹)</label>
                  <div className="pricing-grid">
                    <Input
                      label="One Meal"
                      name="pricing.monthly.oneMeal"
                      type="number"
                      value={messFormData.pricing.monthly.oneMeal}
                      onChange={handleMessInputChange}
                      placeholder="e.g., 1500"
                    />
                    <Input
                      label="Two Meals"
                      name="pricing.monthly.twoMeals"
                      type="number"
                      value={messFormData.pricing.monthly.twoMeals}
                      onChange={handleMessInputChange}
                      placeholder="e.g., 2500"
                    />
                    <Input
                      label="Full Day"
                      name="pricing.monthly.fullDay"
                      type="number"
                      value={messFormData.pricing.monthly.fullDay}
                      onChange={handleMessInputChange}
                      placeholder="e.g., 3500"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="form-group">
                  <label>Photos (Max 5)</label>
                  <div 
                    className="image-upload-area"
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      marginBottom: '12px',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => document.getElementById('mess-image-input').click()}
                  >
                    <input
                      type="file"
                      id="mess-image-input"
                      multiple
                      accept="image/*"
                      onChange={handleMessImageChange}
                      style={{ display: 'none' }}
                    />
                    <HiOutlinePhotograph size={40} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      Click to upload photos of your mess
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                      {messImages.length}/5 photos selected
                    </p>
                  </div>
                  
                  {messImagePreviews.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '8px'
                    }}>
                      {messImagePreviews.map((preview, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}
                        >
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeMessImage(index)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddMessModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={messSubmitting}
                  >
                    {messSubmitting ? 'Creating...' : 'Create Mess Service'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEditMessModal && (
          <div className="modal-overlay" onClick={() => setShowEditMessModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content large-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Edit Mess Service</h2>
                <button className="close-btn" onClick={() => setShowEditMessModal(false)}>
                  <HiOutlineX size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateMessService} className="modal-form">
                <div className="form-grid">
                  <Input
                    label="Mess Name"
                    name="name"
                    value={messFormData.name}
                    onChange={handleMessInputChange}
                    placeholder="e.g., Mom's Kitchen Tiffin"
                    required
                  />
                  
                  <Input
                    label="Contact Number"
                    name="contactNumber"
                    value={messFormData.contactNumber}
                    onChange={handleMessInputChange}
                    placeholder="e.g., 9876543210"
                  />
                </div>

                <Input
                  label="Address"
                  name="location.address"
                  value={messFormData.location.address}
                  onChange={handleMessInputChange}
                  placeholder="Full address"
                  required
                />

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateMessDescription}
                      disabled={generatingMessDescription}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: generatingMessDescription ? 'wait' : 'pointer',
                        opacity: generatingMessDescription ? 0.7 : 1
                      }}
                    >
                      <HiOutlineSparkles size={14} />
                      {generatingMessDescription ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                  <textarea
                    name="description"
                    value={messFormData.description}
                    onChange={handleMessInputChange}
                    placeholder="Describe your mess service, or click 'Generate with AI' to auto-generate!"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      minHeight: '120px',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-color)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-color)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Cuisine Type</label>
                  <div className="tag-selector">
                    {['North Indian', 'South Indian', 'Gujarati', 'Maharashtrian', 'Rajasthani', 'Bengali', 'Chinese', 'Continental'].map(cuisine => (
                      <button
                        key={cuisine}
                        type="button"
                        className={`tag ${messFormData.cuisineType.includes(cuisine) ? 'active' : ''}`}
                        onClick={() => handleCuisineToggle(cuisine)}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Meal Types</label>
                  <div className="tag-selector">
                    {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => (
                      <button
                        key={meal}
                        type="button"
                        className={`tag ${messFormData.mealTypes.includes(meal) ? 'active' : ''}`}
                        onClick={() => handleMealTypeToggle(meal)}
                      >
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Features</label>
                  <div className="tag-selector">
                    {['homeDelivery', 'pureVeg', 'jainFood', 'customizable', 'hygienic', 'affordablePricing'].map(feature => (
                      <button
                        key={feature}
                        type="button"
                        className={`tag ${messFormData.features.includes(feature) ? 'active' : ''}`}
                        onClick={() => handleFeatureToggle(feature)}
                      >
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Monthly Pricing (₹)</label>
                  <div className="pricing-grid">
                    <Input
                      label="One Meal"
                      name="pricing.monthly.oneMeal"
                      type="number"
                      value={messFormData.pricing.monthly.oneMeal}
                      onChange={handleMessInputChange}
                      placeholder="e.g., 1500"
                    />
                    <Input
                      label="Two Meals"
                      name="pricing.monthly.twoMeals"
                      type="number"
                      value={messFormData.pricing.monthly.twoMeals}
                      onChange={handleMessInputChange}
                      placeholder="e.g., 2500"
                    />
                    <Input
                      label="Full Day"
                      name="pricing.monthly.fullDay"
                      type="number"
                      value={messFormData.pricing.monthly.fullDay}
                      onChange={handleMessInputChange}
                      placeholder="e.g., 3500"
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowEditMessModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={messSubmitting}
                  >
                    {messSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .dashboard-page {
          min-height: calc(100vh - 80px);
          padding: 2rem 0 4rem;
          background: var(--bg-secondary);
        }

        .dashboard-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .header-content h1 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .header-content p {
          color: var(--text-secondary);
        }

        /* Bookings Grid */
        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        .booking-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
          transition: all var(--transition-normal);
        }

        .booking-card:hover {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .booking-id {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-family: monospace;
        }

        .booking-student {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-light);
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          border-radius: var(--radius-full);
          color: white;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .booking-property {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .booking-property svg {
          color: var(--accent-primary);
        }

        .booking-dates {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .booking-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
        }

        .booking-actions button {
          flex: 1;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .refresh-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .refresh-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
        }

        .stat-icon.available {
          background: var(--success-bg);
          color: var(--success);
        }

        .stat-icon.booked {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .stat-icon.revenue {
          background: var(--accent-gradient-soft);
          color: var(--accent-primary);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        /* Tabs */
        .tabs-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 1rem;
          overflow-x: auto;
        }

        .tab {
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-lg);
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .tab:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .tab.active {
          background: var(--accent-primary);
          color: white;
        }

        /* Properties Grid */
        .properties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .property-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: all var(--transition-normal);
        }

        .property-card:hover {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .property-header {
          position: relative;
        }

        .property-image {
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          color: white;
          overflow: hidden;
        }

        .property-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .property-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
        }

        .property-body {
          padding: 1.25rem;
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
          font-size: 0.875rem;
          color: var(--text-tertiary);
          margin-bottom: 0.75rem;
        }

        .property-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .property-rent {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .rent-amount {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .rent-period {
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        .property-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.625rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .tag svg {
          font-size: 0.875rem;
        }

        .property-mini-map {
          margin-top: 1rem;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-light);
        }

        .mini-map-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .property-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
        }

        .property-actions button {
          flex: 1;
        }

        .delete-btn {
          background: var(--error-bg) !important;
          color: var(--error) !important;
          border: none !important;
        }

        .delete-btn:hover {
          background: var(--error) !important;
          color: white !important;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal {
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal.modal-sm {
          max-width: 400px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 1.25rem;
        }

        .close-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .close-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .modal-form {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .modal-body {
          padding: 1.5rem;
          text-align: center;
        }

        .delete-warning {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--error-bg);
          color: var(--error);
          border-radius: 50%;
          margin: 0 auto 1.5rem;
        }

        .modal-body p {
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .modal-body .text-muted {
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .form-label-row .form-label {
          margin-bottom: 0;
        }

        .ai-generate-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .ai-generate-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        /* AI Modal Styles */
        .ai-modal {
          max-width: 600px;
        }

        .ai-modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
        }

        .ai-header-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
        }

        .ai-header-content h2 {
          color: white;
          margin-bottom: 0.125rem;
        }

        .ai-header-content p {
          font-size: 0.875rem;
          opacity: 0.9;
          color: rgba(255, 255, 255, 0.9);
        }

        .ai-icon {
          width: 40px;
          height: 40px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-lg);
        }

        .ai-modal-header .close-btn {
          color: white;
        }

        .ai-modal-header .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .ai-modal-body {
          padding: 1.5rem;
        }

        .ai-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .ai-form-grid .full-width {
          grid-column: 1 / -1;
        }

        .ai-features {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
          justify-content: center;
          flex-wrap: wrap;
        }

        .ai-feature {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          background: var(--bg-secondary);
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-full);
        }

        .ai-feature svg {
          color: var(--accent-primary);
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          font-size: 1rem;
          color: var(--text-primary);
          resize: vertical;
          transition: all var(--transition-fast);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }

        .input-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-top: 0.375rem;
        }

        .input-hint.error-hint {
          color: var(--error);
        }

        /* Image Upload Styles */
        .image-count {
          font-weight: 400;
          color: var(--text-tertiary);
        }

        .image-upload-area {
          position: relative;
        }

        .hidden-input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          overflow: hidden;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          background: var(--bg-secondary);
          border: 2px dashed var(--border-light);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-tertiary);
        }

        .upload-label:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: var(--accent-primary-alpha);
        }

        .upload-hint {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .image-previews {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .preview-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-light);
        }

        .preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-image-btn {
          position: absolute;
          top: 0.25rem;
          right: 0.25rem;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--error);
          color: white;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
          opacity: 0.9;
        }

        .remove-image-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .properties-grid {
            grid-template-columns: 1fr;
          }

          .image-previews {
            grid-template-columns: repeat(3, 1fr);
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .performance-table {
            overflow-x: auto;
          }
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 1.5rem;
          border-top: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        /* Analytics Styles */
        .analytics-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .analytics-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .analytics-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .analytics-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .analytics-icon.occupancy {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .analytics-icon.revenue {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .analytics-icon.bookings {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .analytics-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .analytics-value-large {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .analytics-bar {
          width: 100%;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .analytics-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: var(--radius-full);
          transition: width 0.5s ease;
        }

        .analytics-detail {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        .analytics-breakdown {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
        }

        .breakdown-item.confirmed {
          color: var(--success);
        }

        .breakdown-item.pending {
          color: var(--warning);
        }

        /* Chart Styles */
        .chart-card {
          margin-top: 0;
        }

        .chart-container {
          padding: 1rem 0;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 200px;
          gap: 0.5rem;
          padding: 1rem 0;
        }

        .bar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          max-width: 80px;
        }

        .bar-wrapper {
          width: 100%;
          height: 160px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(180deg, #8b5cf6, #3b82f6);
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          position: relative;
          min-height: 4px;
          transition: height 0.5s ease;
        }

        .bar-value {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .bar-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        /* Performance Table */
        .performance-card {
          margin-top: 0;
        }

        .performance-table {
          width: 100%;
        }

        .performance-header,
        .performance-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          align-items: center;
        }

        .performance-header {
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .performance-row {
          border-bottom: 1px solid var(--border-light);
          font-size: 0.875rem;
        }

        .performance-row:last-child {
          border-bottom: none;
        }

        .performance-row:hover {
          background: var(--bg-secondary);
        }

        .property-title {
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .revenue-cell {
          color: var(--success);
          font-weight: 600;
        }

        .rating-cell {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--warning);
        }

        /* Mess Services Section */
        .mess-section .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .mess-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .mess-card {
          border: 1px solid var(--border-light);
          transition: all 0.3s ease;
        }

        .mess-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .mess-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .mess-card-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .mess-location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .mess-stats {
          display: flex;
          justify-content: space-between;
          padding: 1rem 0;
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 1rem;
        }

        .mess-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .mess-stat .stat-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .mess-stat .stat-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .mess-meals {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .meal-tag {
          padding: 0.25rem 0.75rem;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: var(--radius-full);
          text-transform: capitalize;
        }

        .mess-actions {
          display: flex;
          gap: 0.5rem;
        }

        .mess-actions .delete-btn {
          color: var(--error);
        }

        .mess-actions .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Subscribers Section */
        .subscribers-section .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .subscribers-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .subscriber-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .subscriber-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .subscriber-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .subscriber-plan {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        /* Tag Selector */
        .tag-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag-selector .tag {
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tag-selector .tag:hover {
          border-color: var(--primary);
        }

        .tag-selector .tag.active {
          background: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary);
        }

        /* Pricing Grid */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }

        .large-modal {
          max-width: 700px;
          max-height: 85vh;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboard;
