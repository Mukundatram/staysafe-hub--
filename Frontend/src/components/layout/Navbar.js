import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { NotificationBell } from '../notification';
import { 
  HiOutlineHome, 
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlinePhone,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineCog,
  HiOutlineHeart,
  HiOutlineBadgeCheck,
  HiOutlineDocumentText,
  HiOutlineCake
} from 'react-icons/hi';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Verified Stays', href: '/properties', icon: HiOutlineHome },
    { name: 'Mess Services', href: '/mess', icon: HiOutlineCake },
    { name: 'Safety First', href: '/safety', icon: HiOutlineShieldCheck },
    { name: 'Community', href: '/community', icon: HiOutlineUserGroup },
    { name: 'Contact', href: '/contact', icon: HiOutlinePhone },
  ];

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'owner': return '/owner/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/dashboard';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <nav className="nav-wrapper">
          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo-icon">
              <HiOutlineShieldCheck size={24} />
            </div>
            <span className="logo-text">StaySafeHub Buddy</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-links desktop-only">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`nav-link ${location.pathname === link.href ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="nav-actions">
            {/* Theme Toggle */}
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <HiOutlineMoon size={20} /> : <HiOutlineSun size={20} />}
            </button>

            {/* Notification Bell - Only show when authenticated */}
            {isAuthenticated && <NotificationBell />}

            {/* Wishlist - Only show when authenticated */}
            {isAuthenticated && (
              <Link to="/wishlist" className="wishlist-icon" title="My Wishlist">
                <HiOutlineHeart size={22} />
                {wishlistCount > 0 && (
                  <span className="wishlist-count">{wishlistCount}</span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="user-menu-wrapper">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="user-avatar">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="user-dropdown"
                    >
                      <div className="user-info">
                        <span className="user-role">{user?.role}</span>
                      </div>
                      <div className="dropdown-divider" />
                      <Link to={getDashboardLink()} className="dropdown-item">
                        <HiOutlineCog size={18} />
                        Dashboard
                      </Link>
                      {user?.role !== 'admin' && (
                        <>
                          <Link to="/verification" className="dropdown-item">
                            <HiOutlineBadgeCheck size={18} />
                            Verification
                          </Link>
                          <Link to="/agreements" className="dropdown-item">
                            <HiOutlineDocumentText size={18} />
                            Agreements
                          </Link>
                        </>
                      )}
                      <button onClick={handleLogout} className="dropdown-item logout">
                        <HiOutlineLogout size={18} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="auth-buttons desktop-only">
                <Link to="/login" className="btn btn-ghost">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle mobile-only"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu"
          >
            <div className="container">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`mobile-nav-link ${location.pathname === link.href ? 'active' : ''}`}
                >
                  <link.icon size={20} />
                  {link.name}
                </Link>
              ))}
              
              {!isAuthenticated && (
                <div className="mobile-auth-buttons">
                  <Link to="/login" className="btn btn-secondary">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 1rem 0;
          transition: all var(--transition-normal);
          background: transparent;
        }

        .navbar.scrolled {
          background: var(--bg-glass);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: var(--shadow-sm);
          padding: 0.75rem 0;
        }

        .nav-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          border-radius: var(--radius-md);
          color: white;
        }

        .logo-text {
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link {
          padding: 0.625rem 1rem;
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .nav-link.active {
          color: var(--accent-primary);
          background: var(--accent-gradient-soft);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .theme-toggle {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .theme-toggle:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .wishlist-icon {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .wishlist-icon:hover {
          background: var(--bg-tertiary);
          color: var(--error);
        }

        .wishlist-count {
          position: absolute;
          top: 2px;
          right: 2px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--error);
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
          border-radius: var(--radius-full);
          padding: 0 4px;
        }

        .auth-buttons {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-menu-wrapper {
          position: relative;
        }

        .user-menu-trigger {
          padding: 0;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          border-radius: var(--radius-full);
          color: white;
          font-weight: 600;
          font-size: 1rem;
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .user-info {
          padding: 1rem;
        }

        .user-role {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          background: var(--accent-gradient-soft);
          color: var(--accent-primary);
          border-radius: var(--radius-full);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-light);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 0.9375rem;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .dropdown-item:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .dropdown-item.logout {
          color: var(--error);
        }

        .dropdown-item.logout:hover {
          background: var(--error-bg);
        }

        .mobile-menu-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          color: var(--text-primary);
        }

        .mobile-menu {
          background: var(--bg-card);
          border-top: 1px solid var(--border-light);
          overflow: hidden;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 0;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-light);
        }

        .mobile-nav-link.active {
          color: var(--accent-primary);
        }

        .mobile-auth-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.5rem 0;
        }

        .mobile-auth-buttons .btn {
          justify-content: center;
        }

        .desktop-only {
          display: none;
        }

        .mobile-only {
          display: flex;
        }

        @media (min-width: 768px) {
          .desktop-only {
            display: flex;
          }

          .mobile-only {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
