import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import {
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlineArrowLeft
} from 'react-icons/hi';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="not-found-content"
      >
        <div className="error-code">404</div>
        <h1>Page Not Found</h1>
        <p>
          Oops! The page you're looking for doesn't exist or has been moved. 
          Let's get you back to safety.
        </p>

        <div className="actions">
          <Link to="/">
            <Button variant="primary" size="lg" leftIcon={<HiOutlineHome size={20} />}>
              Go Home
            </Button>
          </Link>
          <Link to="/properties">
            <Button variant="secondary" size="lg" leftIcon={<HiOutlineSearch size={20} />}>
              Browse Properties
            </Button>
          </Link>
        </div>

        <button onClick={() => window.history.back()} className="back-link">
          <HiOutlineArrowLeft size={18} />
          Go back to previous page
        </button>
      </motion.div>

      <style>{`
        .not-found-page {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--bg-secondary);
        }

        .not-found-content {
          text-align: center;
          max-width: 500px;
        }

        .error-code {
          font-size: clamp(6rem, 20vw, 10rem);
          font-weight: 800;
          line-height: 1;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .not-found-content h1 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .not-found-content p {
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-tertiary);
          font-size: 0.9375rem;
          transition: color var(--transition-fast);
        }

        .back-link:hover {
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
