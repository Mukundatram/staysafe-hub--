import api from './api';

export const propertyService = {
  // Get all available properties
  getAll: async () => {
    const response = await api.get('/properties');
    return response.data;
  },

  // Get property by ID
  getById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  // Search properties with filters
  search: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle arrays (like amenities)
        if (Array.isArray(value) && value.length > 0) {
          params.append(key, value.join(','));
        } else if (!Array.isArray(value)) {
          params.append(key, value);
        }
      }
    });
    const response = await api.get(`/properties?${params.toString()}`);
    return response.data;
  },

  // Get properties for authenticated student
  getForStudent: async () => {
    const response = await api.get('/student/properties');
    return response.data;
  },
};

export const bookingService = {
  // Create a new booking (Student only)
  create: async (propertyId, bookingData) => {
    const response = await api.post(`/bookings/book/${propertyId}`, bookingData);
    return response.data;
  },

  // Get student's bookings
  getMyBookings: async () => {
    const response = await api.get('/bookings/my');
    return response.data;
  },

  // Get all bookings (Admin only)
  getAll: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  // Approve or reject booking (Admin only)
  updateStatus: async (bookingId, status) => {
    const response = await api.patch(`/bookings/admin/${bookingId}`, { status });
    return response.data;
  },

  // Get bookings for properties owned by current owner
  getOwnerBookings: async () => {
    const response = await api.get('/bookings/owner');
    return response.data;
  },

  // Approve or reject booking as owner for bookings that belong to their properties
  updateStatusOwner: async (bookingId, status) => {
    const response = await api.patch(`/bookings/owner/${bookingId}`, { status });
    return response.data;
  },

  // Leave room / End stay (Student only)
  leaveRoom: async (bookingId, reason = '') => {
    const response = await api.patch(`/bookings/leave/${bookingId}`, { reason });
    return response.data;
  },

  // Cancel pending booking (Student only)
  cancelBooking: async (bookingId) => {
    const response = await api.patch(`/bookings/cancel/${bookingId}`);
    return response.data;
  },
};

export const chatService = {
  // Get all conversations for the current user
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // Get messages for a specific conversation
  getMessages: async (propertyId, userId) => {
    const response = await api.get(`/chat/${propertyId}/${userId}`);
    return response.data;
  },

  // Get messages for a mess conversation
  getMessMessages: async (messId, userId) => {
    const response = await api.get(`/chat/mess/${messId}/${userId}`);
    return response.data;
  },

  // Delete conversation messages for a property + other user
  deleteConversation: async (propertyId, otherUserId) => {
    const response = await api.delete(`/chat/${propertyId}/${otherUserId}`);
    return response.data;
  },

  // Delete mess conversation
  deleteMessConversation: async (messId, otherUserId) => {
    const response = await api.delete(`/chat/mess/${messId}/${otherUserId}`);
    return response.data;
  },

  // Send a message (property)
  sendMessage: async (receiverId, propertyId, content) => {
    const response = await api.post('/chat/send', { receiverId, propertyId, content });
    return response.data;
  },

  // Send a mess message
  sendMessMessage: async (receiverId, messId, content) => {
    const response = await api.post('/chat/mess/send', { receiverId, messId, content });
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },
};

export const authService = {
  // Get student dashboard data
  getStudentDashboard: async () => {
    const response = await api.get('/student/dashboard');
    return response.data;
  },
};

export const ownerService = {
  // Add new property with images
  addProperty: async (propertyData, images) => {
    const formData = new FormData();

    // Add text fields
    formData.append('title', propertyData.title);
    formData.append('description', propertyData.description || '');
    formData.append('rent', propertyData.rent);
    formData.append('location', propertyData.location || '');
    formData.append('amenities', propertyData.amenities?.join(',') || '');
    formData.append('meals', propertyData.meals?.join(',') || '');
    if (propertyData.linkedMess) formData.append('linkedMess', propertyData.linkedMess);

    // Add coordinates if available
    if (propertyData.coordinates) {
      formData.append('coordinates', JSON.stringify(propertyData.coordinates));
    }
    // Optional initial room inventory fields
    if (propertyData.totalRooms !== undefined) formData.append('totalRooms', propertyData.totalRooms);
    if (propertyData.maxOccupancy !== undefined) formData.append('maxOccupancy', propertyData.maxOccupancy);
    if (propertyData.pricePerBed !== undefined) formData.append('pricePerBed', propertyData.pricePerBed);

    // Add images
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }

    const response = await api.post('/owner/add-property', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get owner's properties
  getMyProperties: async () => {
    const response = await api.get('/owner/my-properties');
    return response.data;
  },

  // Update property
  updateProperty: async (propertyId, propertyData, newImages = null) => {
    if (newImages && newImages.length > 0) {
      const formData = new FormData();
      formData.append('title', propertyData.title);
      formData.append('description', propertyData.description || '');
      formData.append('rent', propertyData.rent);
      formData.append('location', propertyData.location || '');
      formData.append('amenities', propertyData.amenities?.join(',') || '');
      formData.append('meals', propertyData.meals?.join(',') || '');

      // Add coordinates if available
      if (propertyData.coordinates) {
        formData.append('coordinates', JSON.stringify(propertyData.coordinates));
      }

      newImages.forEach(image => {
        formData.append('images', image);
      });

      const response = await api.put(`/owner/property/${propertyId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Include linkedMess when updating without new images
      const response = await api.put(`/owner/property/${propertyId}`, propertyData);
      return response.data;
    }
  },

  // Delete property
  deleteProperty: async (propertyId) => {
    const response = await api.delete(`/owner/property/${propertyId}`);
    return response.data;
  },

  // Add a room to a property
  addRoom: async (propertyId, roomData) => {
    const response = await api.post(`/owner/property/${propertyId}/rooms`, roomData);
    return response.data;
  },

  // List rooms for a property
  getRooms: async (propertyId) => {
    const response = await api.get(`/owner/property/${propertyId}/rooms`);
    return response.data;
  },

  // Update a room
  updateRoom: async (propertyId, roomId, roomData) => {
    const response = await api.patch(`/owner/property/${propertyId}/rooms/${roomId}`, roomData);
    return response.data;
  },

  // Delete a room
  deleteRoom: async (propertyId, roomId) => {
    const response = await api.delete(`/owner/property/${propertyId}/rooms/${roomId}`);
    return response.data;
  },
};

export const notificationService = {
  // Get all notifications for the current user
  getAll: async (page = 1, limit = 20) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  delete: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export const reviewService = {
  // Get reviews for a property
  getPropertyReviews: async (propertyId, page = 1, limit = 10, sort = 'newest') => {
    const response = await api.get(`/reviews/property/${propertyId}?page=${page}&limit=${limit}&sort=${sort}`);
    return response.data;
  },

  // Get reviews for a mess
  getMessReviews: async (messId, page = 1, limit = 10, sort = 'newest') => {
    const response = await api.get(`/reviews/mess/${messId}?page=${page}&limit=${limit}&sort=${sort}`);
    return response.data;
  },

  // Create a new review
  create: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Check if user can review a booking
  canReview: async (bookingId) => {
    const response = await api.get(`/reviews/can-review/${bookingId}`);
    return response.data;
  },

  // Check if user can review a mess subscription
  canReviewMess: async (subscriptionId) => {
    const response = await api.get(`/reviews/check-mess-eligibility/${subscriptionId}`);
    return response.data;
  },

  // Get user's reviews
  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  // Owner respond to a review
  respond: async (reviewId, comment) => {
    const response = await api.patch(`/reviews/${reviewId}/respond`, { comment });
    return response.data;
  },

  // Delete a review
  delete: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    const response = await api.patch(`/reviews/${reviewId}/helpful`);
    return response.data;
  },
};

// AI Service for property description generation
export const aiService = {
  // Generate property description using AI
  generateDescription: async (propertyData) => {
    const response = await api.post('/ai/generate-description', propertyData);
    return response.data;
  },

  // Enhance existing description
  enhanceDescription: async (descriptionData) => {
    const response = await api.post('/ai/enhance-description', descriptionData);
    return response.data;
  },

  // Generate mess service description using AI
  generateMessDescription: async (messData) => {
    const response = await api.post('/ai/generate-mess-description', messData);
    return response.data;
  },
};
