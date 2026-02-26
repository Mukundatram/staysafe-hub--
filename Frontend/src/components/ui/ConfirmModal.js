import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamationCircle, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false
}) => {
  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const variants = {
    danger: {
      iconBg: 'var(--error-bg, #fef2f2)',
      iconColor: 'var(--error, #ef4444)',
      btnBg: 'var(--error, #ef4444)',
      icon: HiOutlineTrash
    },
    warning: {
      iconBg: 'var(--warning-bg, #fffbeb)',
      iconColor: 'var(--warning, #f59e0b)',
      btnBg: 'var(--warning, #f59e0b)',
      icon: HiOutlineExclamationCircle
    },
    info: {
      iconBg: 'var(--info-bg, #eff6ff)',
      iconColor: 'var(--info, #3b82f6)',
      btnBg: 'var(--accent-primary, #6366f1)',
      icon: HiOutlineExclamationCircle
    }
  };

  const v = variants[variant] || variants.danger;
  const Icon = v.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="confirm-modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
          >
            <button className="confirm-modal-close" onClick={onClose} aria-label="Close">
              <HiOutlineX size={20} />
            </button>

            <div className="confirm-modal-icon" style={{ background: v.iconBg, color: v.iconColor }}>
              <Icon size={28} />
            </div>

            <h3 id="confirm-modal-title" className="confirm-modal-title">{title}</h3>
            <p id="confirm-modal-desc" className="confirm-modal-message">{message}</p>

            <div className="confirm-modal-actions">
              <button
                className="confirm-modal-btn cancel"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </button>
              <button
                className="confirm-modal-btn confirm"
                onClick={onConfirm}
                disabled={isLoading}
                style={{ background: v.btnBg }}
              >
                {isLoading ? 'Processing...' : confirmText}
              </button>
            </div>
          </motion.div>

          <style>{`
            .confirm-modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              backdrop-filter: blur(4px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              padding: 1rem;
            }

            .confirm-modal {
              position: relative;
              background: var(--bg-card, #fff);
              border-radius: 20px;
              padding: 2rem;
              max-width: 400px;
              width: 100%;
              text-align: center;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }

            .confirm-modal-close {
              position: absolute;
              top: 1rem;
              right: 1rem;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              background: transparent;
              border: none;
              color: var(--text-tertiary);
              cursor: pointer;
              transition: all 0.2s;
            }

            .confirm-modal-close:hover {
              background: var(--bg-tertiary);
              color: var(--text-primary);
            }

            .confirm-modal-icon {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1.25rem;
            }

            .confirm-modal-title {
              font-size: 1.25rem;
              font-weight: 700;
              color: var(--text-primary);
              margin-bottom: 0.5rem;
            }

            .confirm-modal-message {
              font-size: 0.9375rem;
              color: var(--text-secondary);
              line-height: 1.6;
              margin-bottom: 1.75rem;
            }

            .confirm-modal-actions {
              display: flex;
              gap: 0.75rem;
            }

            .confirm-modal-btn {
              flex: 1;
              padding: 0.75rem 1.25rem;
              border-radius: 12px;
              font-size: 0.9375rem;
              font-weight: 600;
              cursor: pointer;
              border: none;
              transition: all 0.2s ease;
            }

            .confirm-modal-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            .confirm-modal-btn.cancel {
              background: var(--bg-tertiary, #f1f5f9);
              color: var(--text-primary);
            }

            .confirm-modal-btn.cancel:hover:not(:disabled) {
              background: var(--border-light, #e2e8f0);
            }

            .confirm-modal-btn.confirm {
              color: white;
            }

            .confirm-modal-btn.confirm:hover:not(:disabled) {
              opacity: 0.9;
              transform: translateY(-1px);
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
