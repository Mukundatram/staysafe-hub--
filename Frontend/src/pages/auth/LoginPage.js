import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await login(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      // Navigate based on role
      const dashboardPaths = {
        student: '/dashboard',
        owner: '/owner/dashboard',
        admin: '/admin/dashboard',
      };
      const redirectPath = dashboardPaths[result.user.role] || from;
      navigate(redirectPath, { replace: true });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-container"
      >
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <HiOutlineShieldCheck size={48} />
            </div>
            <h1>Welcome Back!</h1>
            <p>
              Log in to access your safe stays, manage bookings, 
              and connect with your community.
            </p>
            <div className="trust-metrics">
              <div className="metric">
                <span className="metric-value">10,000+</span>
                <span className="metric-label">Happy Students</span>
              </div>
              <div className="metric">
                <span className="metric-value">200+</span>
                <span className="metric-label">Verified Properties</span>
              </div>
              <div className="metric">
                <span className="metric-value">99%</span>
                <span className="metric-label">Safety Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <div className="form-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  leftIcon={<HiOutlineMail size={20} />}
                />
              </div>

              <div className="form-group">
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  leftIcon={<HiOutlineLockClosed size={20} />}
                />
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .auth-page {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: var(--bg-secondary);
        }

        .auth-container {
          display: grid;
          width: 100%;
          max-width: 1000px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }

        @media (min-width: 768px) {
          .auth-container {
            grid-template-columns: 1fr 1fr;
          }
        }

        .auth-branding {
          background: var(--accent-gradient);
          padding: 3rem;
          display: none;
        }

        @media (min-width: 768px) {
          .auth-branding {
            display: flex;
            align-items: center;
          }
        }

        .branding-content {
          color: white;
        }

        .brand-logo {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-lg);
          margin-bottom: 2rem;
        }

        .branding-content h1 {
          font-size: 2rem;
          color: white;
          margin-bottom: 1rem;
        }

        .branding-content p {
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.7;
          margin-bottom: 2.5rem;
        }

        .trust-metrics {
          display: flex;
          gap: 1.5rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .metric-label {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .auth-form-container {
          padding: 3rem 2rem;
        }

        @media (min-width: 768px) {
          .auth-form-container {
            padding: 3rem;
          }
        }

        .auth-form-wrapper {
          max-width: 360px;
          margin: 0 auto;
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .form-header p {
          color: var(--text-secondary);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0.5rem 0 1.5rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .remember-me input {
          width: 16px;
          height: 16px;
          accent-color: var(--accent-primary);
        }

        .forgot-link {
          font-size: 0.875rem;
          color: var(--accent-primary);
          font-weight: 500;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
        }

        .auth-footer p {
          color: var(--text-secondary);
        }

        .auth-link {
          color: var(--accent-primary);
          font-weight: 600;
        }

        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
