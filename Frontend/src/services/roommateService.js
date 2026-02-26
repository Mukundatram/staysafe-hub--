import api from './api';

const roommateService = {
    // Profile Management
    createOrUpdateProfile: async (profileData) => {
        const response = await api.post('/roommate/profile', profileData);
        return response.data;
    },

    getMyProfile: async () => {
        const response = await api.get('/roommate/my-profile');
        return response.data;
    },

    getProfile: async (userId) => {
        const response = await api.get(`/roommate/profile/${userId}`);
        return response.data;
    },

    toggleActive: async (isActive) => {
        const response = await api.patch('/roommate/profile/active', { isActive });
        return response.data;
    },

    deleteProfile: async () => {
        const response = await api.delete('/roommate/profile');
        return response.data;
    },

    // Matching
    getMatches: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        const response = await api.get(`/roommate/matches?${params.toString()}`);
        return response.data;
    },

    // Connection Requests
    sendRequest: async (receiverId, message = '') => {
        const response = await api.post('/roommate/request', { receiverId, message });
        return response.data;
    },

    getReceivedRequests: async () => {
        const response = await api.get('/roommate/requests/received');
        return response.data;
    },

    getSentRequests: async () => {
        const response = await api.get('/roommate/requests/sent');
        return response.data;
    },

    acceptRequest: async (requestId) => {
        const response = await api.patch(`/roommate/request/${requestId}/accept`);
        return response.data;
    },

    rejectRequest: async (requestId) => {
        const response = await api.patch(`/roommate/request/${requestId}/reject`);
        return response.data;
    },

    blockUser: async (userId) => {
        const response = await api.post(`/roommate/block/${userId}`);
        return response.data;
    },

    getConnections: async () => {
        const response = await api.get('/roommate/connections');
        return response.data;
    },

    // Messaging
    getRoommateConversations: async () => {
        const response = await api.get('/chat/roommate/conversations');
        return response.data;
    },

    getRoommateMessages: async (roommateId) => {
        const response = await api.get(`/chat/roommate/${roommateId}`);
        return response.data;
    },

    sendRoommateMessage: async (receiverId, content) => {
        const response = await api.post('/chat/roommate/send', { receiverId, content });
        return response.data;
    },

    // Property Sharing
    shareProperty: async (roommateId, propertyId, message = '') => {
        const response = await api.post('/roommate/share-property', {
            roommateId,
            propertyId,
            message
        });
        return response.data;
    },

    getSharedProperties: async (roommateId) => {
        const response = await api.get(`/roommate/shared-properties/${roommateId}`);
        return response.data;
    },

    // Joint Booking
    bookWithRoommate: async (propertyId, bookingData) => {
        const response = await api.post(`/bookings/book-with-roommate/${propertyId}`, bookingData);
        return response.data;
    },

    confirmRoommateBooking: async (bookingId, action) => {
        const response = await api.patch(`/bookings/confirm-roommate/${bookingId}`, { action });
        return response.data;
    },

    getPendingRoommateInvites: async () => {
        const response = await api.get(`/bookings/pending-roommate-invites`);
        return response.data;
    },

    // Room Share Discovery
    getRoomShares: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        const response = await api.get(`/bookings/room-shares?${params.toString()}`);
        return response.data;
    },

    requestJoinBooking: async (bookingId, message = '') => {
        const response = await api.post(`/bookings/request-join/${bookingId}`, { message });
        return response.data;
    },

    respondJoinRequest: async (bookingId, requestId, action) => {
        const response = await api.patch(`/bookings/respond-join/${bookingId}/${requestId}`, { action });
        return response.data;
    },

    getPendingJoinRequests: async () => {
        const response = await api.get('/bookings/pending-join-requests');
        return response.data;
    }
};

export default roommateService;

