import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`input-wrapper ${fullWidth ? 'full-width' : ''} ${className}`}>
      {label && (
        <label className="form-label">{label}</label>
      )}
      <div className="input-container">
        {leftIcon && (
          <span className="input-icon left">{leftIcon}</span>
        )}
        <input
          ref={ref}
          type={type}
          className={`form-input ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''} ${error ? 'has-error' : ''}`}
          {...props}
        />
        {rightIcon && (
          <span className="input-icon right">{rightIcon}</span>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
      {helperText && !error && <span className="form-helper">{helperText}</span>}

      <style>{`
        .input-wrapper {
          display: flex;
          flex-direction: column;
        }

        .input-wrapper.full-width {
          width: 100%;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .input-icon.left {
          left: 1rem;
        }

        .input-icon.right {
          right: 1rem;
        }

        .form-input.has-left-icon {
          padding-left: 2.75rem;
        }

        .form-input.has-right-icon {
          padding-right: 2.75rem;
        }

        .form-input.has-error {
          border-color: var(--error);
        }

        .form-input.has-error:focus {
          box-shadow: 0 0 0 3px var(--error-bg);
        }

        .form-helper {
          margin-top: 0.375rem;
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
