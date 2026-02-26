import '../styles/LoginPage.css';
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const LoginPage = () => {
  useDocumentTitle('Login');
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

              <div style={{ marginTop: '0.75rem', position: 'relative' }}>
                <div className="divider" style={{
                  display: 'flex', alignItems: 'center', textAlign: 'center', color: '#9ca3af', margin: '15px 0'
                }}>
                  <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb' }}></div>
                  <span style={{ padding: '0 10px', fontSize: '0.875rem' }}>or</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb' }}></div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => { window.location.href = '/api/auth/google'; }}
                >
                  Sign in with Google
                </Button>
              </div>
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
    </div>
  );
};

export default LoginPage;
