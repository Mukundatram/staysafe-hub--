import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import wishlistService from '../services/wishlistService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch wishlist IDs when user logs in
  const fetchWishlistIds = useCallback(async () => {
    if (!user) {
      setWishlistIds([]);
      return;
    }

    try {
      const data = await wishlistService.getWishlistIds();
      if (data.success) {
        setWishlistIds(data.propertyIds);
      }
    } catch (err) {
      console.error('Error fetching wishlist IDs:', err);
    }
  }, [user]);

  // Fetch full wishlist with property details
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await wishlistService.getWishlist();
      if (data.success) {
        setWishlistItems(data.wishlist);
        setWishlistIds(data.wishlist.map(item => item.property._id));
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if property is in wishlist
  const isInWishlist = useCallback((propertyId) => {
    return wishlistIds.includes(propertyId);
  }, [wishlistIds]);

  // Toggle wishlist status
  const toggleWishlist = useCallback(async (propertyId, propertyTitle = 'Property') => {
    if (!user) {
      toast.error('Please login to save properties');
      return { success: false };
    }

    try {
      const data = await wishlistService.toggleWishlist(propertyId);
      
      if (data.success) {
        if (data.action === 'added') {
          setWishlistIds(prev => [...prev, propertyId]);
          toast.success(`${propertyTitle} added to wishlist`);
        } else {
          setWishlistIds(prev => prev.filter(id => id !== propertyId));
          toast.success(`${propertyTitle} removed from wishlist`);
        }
        return { success: true, isInWishlist: data.isInWishlist };
      }
      
      return { success: false };
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      toast.error('Failed to update wishlist');
      return { success: false };
    }
  }, [user]);

  // Add to wishlist
  const addToWishlist = useCallback(async (propertyId, notes = '') => {
    if (!user) {
      toast.error('Please login to save properties');
      return { success: false };
    }

    try {
      const data = await wishlistService.addToWishlist(propertyId, notes);
      
      if (data.success) {
        setWishlistIds(prev => [...prev, propertyId]);
        toast.success('Property added to wishlist');
        return { success: true };
      }
      
      return { success: false };
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to add to wishlist');
      }
      return { success: false };
    }
  }, [user]);

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (propertyId) => {
    if (!user) return { success: false };

    try {
      const data = await wishlistService.removeFromWishlist(propertyId);
      
      if (data.success) {
        setWishlistIds(prev => prev.filter(id => id !== propertyId));
        setWishlistItems(prev => prev.filter(item => item.property._id !== propertyId));
        toast.success('Property removed from wishlist');
        return { success: true };
      }
      
      return { success: false };
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove from wishlist');
      return { success: false };
    }
  }, [user]);

  // Update notes
  const updateNotes = useCallback(async (propertyId, notes) => {
    try {
      const data = await wishlistService.updateNotes(propertyId, notes);
      
      if (data.success) {
        setWishlistItems(prev => 
          prev.map(item => 
            item.property._id === propertyId 
              ? { ...item, notes } 
              : item
          )
        );
        toast.success('Notes updated');
        return { success: true };
      }
      
      return { success: false };
    } catch (err) {
      console.error('Error updating notes:', err);
      toast.error('Failed to update notes');
      return { success: false };
    }
  }, []);

  // Fetch wishlist IDs on mount and when user changes
  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  // Clear wishlist when user logs out
  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      setWishlistItems([]);
    }
  }, [user]);

  const value = {
    wishlistIds,
    wishlistItems,
    loading,
    error,
    isInWishlist,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    updateNotes,
    fetchWishlist,
    fetchWishlistIds,
    wishlistCount: wishlistIds.length
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
