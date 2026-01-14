import api from './api';

const wishlistService = {
  // Get user's full wishlist with property details
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  // Get only property IDs in wishlist (for quick checking)
  getWishlistIds: async () => {
    const response = await api.get('/wishlist/ids');
    return response.data;
  },

  // Check if a specific property is in wishlist
  checkInWishlist: async (propertyId) => {
    const response = await api.get(`/wishlist/check/${propertyId}`);
    return response.data;
  },

  // Add property to wishlist
  addToWishlist: async (propertyId, notes = '') => {
    const response = await api.post(`/wishlist/${propertyId}`, { notes });
    return response.data;
  },

  // Remove property from wishlist
  removeFromWishlist: async (propertyId) => {
    const response = await api.delete(`/wishlist/${propertyId}`);
    return response.data;
  },

  // Toggle wishlist status (add/remove)
  toggleWishlist: async (propertyId) => {
    const response = await api.post(`/wishlist/toggle/${propertyId}`);
    return response.data;
  },

  // Update notes for a wishlist item
  updateNotes: async (propertyId, notes) => {
    const response = await api.patch(`/wishlist/${propertyId}/notes`, { notes });
    return response.data;
  }
};

export default wishlistService;
