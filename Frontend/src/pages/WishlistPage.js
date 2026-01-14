import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext';
import PropertyCard from '../components/property/PropertyCard';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import {
  HiOutlineHeart,
  HiOutlineTrash,
  HiOutlineHome,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineCheck
} from 'react-icons/hi';

const WishlistPage = () => {
  const { 
    wishlistItems, 
    loading, 
    error, 
    fetchWishlist, 
    removeFromWishlist,
    updateNotes 
  } = useWishlist();

  const [editingNotes, setEditingNotes] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleEditNotes = (item) => {
    setEditingNotes(item.property._id);
    setNoteText(item.notes || '');
  };

  const handleSaveNotes = async (propertyId) => {
    await updateNotes(propertyId, noteText);
    setEditingNotes(null);
    setNoteText('');
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNoteText('');
  };

  const handleRemove = async (propertyId) => {
    if (window.confirm('Are you sure you want to remove this property from your wishlist?')) {
      await removeFromWishlist(propertyId);
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <Loading size="lg" text="Loading your wishlist..." />
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <div className="header-content">
            <div className="header-icon">
              <HiOutlineHeart size={32} />
            </div>
            <div>
              <h1>My Wishlist</h1>
              <p>
                {wishlistItems.length > 0 
                  ? `You have ${wishlistItems.length} saved ${wishlistItems.length === 1 ? 'property' : 'properties'}`
                  : 'Save properties you love to view them later'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <Button variant="ghost" onClick={fetchWishlist}>Try Again</Button>
          </div>
        )}

        {/* Empty State */}
        {!error && wishlistItems.length === 0 && (
          <EmptyState
            icon={HiOutlineHeart}
            title="Your wishlist is empty"
            description="Start exploring properties and save your favorites by clicking the heart icon."
            action={{
              label: 'Browse Properties',
              to: '/properties',
              icon: <HiOutlineHome size={18} />,
            }}
          />
        )}

        {/* Wishlist Grid */}
        {wishlistItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="wishlist-grid"
          >
            <AnimatePresence>
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="wishlist-item"
                >
                  <PropertyCard property={item.property} showActions={true} />
                  
                  {/* Notes Section */}
                  <div className="wishlist-notes">
                    {editingNotes === item.property._id ? (
                      <div className="notes-edit">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add notes about this property..."
                          maxLength={500}
                          rows={3}
                        />
                        <div className="notes-actions">
                          <button 
                            className="save-btn"
                            onClick={() => handleSaveNotes(item.property._id)}
                          >
                            <HiOutlineCheck size={16} />
                            Save
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={handleCancelEdit}
                          >
                            <HiOutlineX size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="notes-display">
                        {item.notes ? (
                          <p className="notes-text">{item.notes}</p>
                        ) : (
                          <p className="notes-empty">No notes added</p>
                        )}
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditNotes(item)}
                        >
                          <HiOutlinePencil size={14} />
                          {item.notes ? 'Edit' : 'Add'} Notes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="wishlist-actions">
                    <span className="added-date">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </span>
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemove(item.property._id)}
                    >
                      <HiOutlineTrash size={16} />
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <style>{`
        .wishlist-page {
          min-height: 80vh;
          padding: 2rem 0;
        }

        .wishlist-page .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--error) 0%, #f87171 100%);
          border-radius: var(--radius-lg);
          color: white;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .page-header p {
          color: var(--text-secondary);
        }

        .error-banner {
          background: var(--error-bg);
          border: 1px solid var(--error);
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .error-banner p {
          color: var(--error);
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .wishlist-item {
          display: flex;
          flex-direction: column;
        }

        .wishlist-notes {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-top: none;
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
          padding: 1rem;
          margin-top: -8px;
        }

        .notes-display {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .notes-text {
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
          flex: 1;
        }

        .notes-empty {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-style: italic;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .edit-btn:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .notes-edit {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .notes-edit textarea {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-primary);
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          resize: vertical;
          font-family: inherit;
        }

        .notes-edit textarea:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .notes-actions {
          display: flex;
          gap: 0.5rem;
        }

        .save-btn, .cancel-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .save-btn {
          background: var(--accent-primary);
          color: white;
          border: none;
        }

        .save-btn:hover {
          background: var(--accent-secondary);
        }

        .cancel-btn {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-light);
        }

        .cancel-btn:hover {
          background: var(--bg-tertiary);
        }

        .wishlist-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-top: none;
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
          margin-top: -1px;
        }

        .added-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .remove-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          color: var(--error);
          background: transparent;
          border: 1px solid var(--error);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .remove-btn:hover {
          background: var(--error);
          color: white;
        }

        @media (max-width: 640px) {
          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .wishlist-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default WishlistPage;
