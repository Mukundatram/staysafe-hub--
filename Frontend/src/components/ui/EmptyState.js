import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi';
import Button from './Button';

const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
}) => {
  const Icon = icon || HiOutlineExclamationCircle;
  
  // Check if icon is a React element (JSX) or a component
  const isElement = React.isValidElement(icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`empty-state ${variant}`}
    >
      <div className="empty-icon">
        {isElement ? icon : <Icon size={48} />}
      </div>
      <h3 className="empty-title">{title}</h3>
      {description && (
        <p className="empty-description">{description}</p>
      )}
      {action && (
        <div className="empty-action">
          {action.to ? (
            <Link to={action.to}>
              <Button
                variant={action.variant || 'primary'}
                leftIcon={action.icon || <HiOutlineRefresh size={18} />}
              >
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              leftIcon={action.icon || <HiOutlineRefresh size={18} />}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}

      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3rem 1.5rem;
          min-height: 300px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          color: var(--text-tertiary);
          margin-bottom: 1.5rem;
        }

        .empty-state.error .empty-icon {
          background: var(--error-bg);
          color: var(--error);
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .empty-description {
          color: var(--text-secondary);
          max-width: 400px;
          margin-bottom: 1.5rem;
        }

        .empty-action {
          margin-top: 0.5rem;
        }
      `}</style>
    </motion.div>
  );
};

export default EmptyState;
