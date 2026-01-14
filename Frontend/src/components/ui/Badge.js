import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}) => {
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
  };

  const sizes = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg',
  };

  return (
    <span className={`badge ${variants[variant]} ${sizes[size]} ${className}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}

      <style>{`
        .badge-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.6875rem;
        }

        .badge-lg {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .badge-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </span>
  );
};

export default Badge;
