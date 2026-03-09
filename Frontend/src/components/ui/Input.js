import React, { forwardRef, useState } from 'react';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

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
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const eyeButton = isPassword ? (
    <button
      type="button"
      className="password-toggle-btn"
      onClick={() => setShowPassword(prev => !prev)}
      tabIndex={-1}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
    </button>
  ) : null;

  const effectiveRightIcon = isPassword ? null : rightIcon;

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
          type={resolvedType}
          className={`form-input ${leftIcon ? 'has-left-icon' : ''} ${(effectiveRightIcon || isPassword) ? 'has-right-icon' : ''} ${error ? 'has-error' : ''}`}
          {...props}
        />
        {effectiveRightIcon && (
          <span className="input-icon right">{effectiveRightIcon}</span>
        )}
        {eyeButton}
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

        .password-toggle-btn {
          position: absolute;
          right: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.15s ease;
          line-height: 0;
        }

        .password-toggle-btn:hover {
          color: var(--text-primary);
        }

        .password-toggle-btn:focus-visible {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
