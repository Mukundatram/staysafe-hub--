import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  variant = 'default',
  hoverable = true,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const paddings = {
    none: '0',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
  };

  return (
    <motion.div
      whileHover={hoverable ? { y: -4, boxShadow: 'var(--shadow-lg)' } : {}}
      onClick={onClick}
      className={`custom-card ${variant} ${onClick ? 'clickable' : ''} ${className}`}
      style={{ padding: paddings[padding] }}
      {...props}
    >
      {children}

      <style>{`
        .custom-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .custom-card.clickable {
          cursor: pointer;
        }

        .custom-card.glass {
          background: var(--bg-glass);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .custom-card.gradient {
          background: var(--accent-gradient);
          border: none;
          color: white;
        }

        .custom-card.gradient p,
        .custom-card.gradient h1,
        .custom-card.gradient h2,
        .custom-card.gradient h3,
        .custom-card.gradient h4,
        .custom-card.gradient h5,
        .custom-card.gradient h6 {
          color: white;
        }

        .custom-card.bordered {
          border-width: 2px;
        }
      `}</style>
    </motion.div>
  );
};

export default Card;
