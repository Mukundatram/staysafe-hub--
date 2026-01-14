import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ size = 'md', text = 'Loading...', fullScreen = false }) => {
  const sizes = {
    sm: { spinner: 24, text: '0.875rem' },
    md: { spinner: 40, text: '1rem' },
    lg: { spinner: 56, text: '1.125rem' },
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="loading-container"
    >
      <div 
        className="loading-spinner"
        style={{ 
          width: sizes[size].spinner, 
          height: sizes[size].spinner 
        }}
      />
      {text && (
        <p 
          className="loading-text"
          style={{ fontSize: sizes[size].text }}
        >
          {text}
        </p>
      )}

      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
        }

        .loading-spinner {
          border: 3px solid var(--border-light);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .loading-fullscreen {
          position: fixed;
          inset: 0;
          background: var(--bg-primary);
          z-index: 9999;
        }
      `}</style>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
