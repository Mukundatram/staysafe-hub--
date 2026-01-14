import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineShieldCheck,
  HiOutlineAcademicCap,
  HiOutlineHome,
  HiOutlineCheck,
  HiOutlineCog
} from 'react-icons/hi';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      label: 'Student / Intern',
      icon: HiOutlineAcademicCap,
      description: 'Looking for safe accommodation',
    },
    {
      id: 'owner',
      label: 'Property Owner',
      icon: HiOutlineHome,
      description: 'List your verified property',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: HiOutlineCog,
      description: 'Manage the platform',
    },
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
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
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role
    );
    setIsLoading(false);

    if (result.success) {
      // Redirect to appropriate dashboard based on role
      const dashboardPaths = {
        student: '/dashboard',
        owner: '/owner/dashboard',
        admin: '/admin/dashboard',
      };
      const userRole = result.user?.role || formData.role;
      navigate(dashboardPaths[userRole] || '/dashboard', { replace: true });
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
        className="auth-container register"
      >
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <HiOutlineShieldCheck size={48} />
            </div>
            <h1>Join StaySafeHub</h1>
            <p>
              Create your account and become part of the safest housing 
              community for students and interns.
            </p>
            <ul className="feature-list">
              <li>
                <HiOutlineCheck className="check-icon" />
                Verified and safe accommodations
              </li>
              <li>
                <HiOutlineCheck className="check-icon" />
                Transparent pricing, no hidden fees
              </li>
              <li>
                <HiOutlineCheck className="check-icon" />
                24/7 emergency support
              </li>
              <li>
                <HiOutlineCheck className="check-icon" />
                Women-first safety features
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
            </div>

            {/* Role Selection */}
            <div className="role-selection">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`role-option ${formData.role === role.id ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                >
                  <role.icon size={24} />
                  <span className="role-label">{role.label}</span>
                  <span className="role-desc">{role.description}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  leftIcon={<HiOutlineUser size={20} />}
                />
              </div>

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
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  leftIcon={<HiOutlineLockClosed size={20} />}
                />
              </div>

              <div className="form-group">
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  leftIcon={<HiOutlineLockClosed size={20} />}
                />
              </div>

              <div className="terms-agreement">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms">Terms of Service</Link> and{' '}
                    <Link to="/privacy">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign in
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

        .auth-container.register {
          display: grid;
          width: 100%;
          max-width: 1100px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }

        @media (min-width: 768px) {
          .auth-container.register {
            grid-template-columns: 1fr 1.2fr;
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
          margin-bottom: 2rem;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-list li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9375rem;
        }

        .check-icon {
          width: 24px;
          height: 24px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
        }

        .auth-form-container {
          padding: 2.5rem 2rem;
          overflow-y: auto;
          max-height: 90vh;
        }

        @media (min-width: 768px) {
          .auth-form-container {
            padding: 3rem;
          }
        }

        .auth-form-wrapper {
          max-width: 400px;
          margin: 0 auto;
        }

        .form-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .form-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .form-header p {
          color: var(--text-secondary);
        }

        .role-selection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .role-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          text-align: center;
        }

        .role-option:hover {
          border-color: var(--accent-primary);
        }

        .role-option.active {
          background: var(--accent-gradient-soft);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .role-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .role-option.active .role-label {
          color: var(--accent-primary);
        }

        .role-desc {
          font-size: 0.75rem;
          line-height: 1.4;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .terms-agreement {
          margin: 1rem 0 1.5rem;
        }

        .checkbox-label {
          display: flex;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
          line-height: 1.5;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          accent-color: var(--accent-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .checkbox-label a {
          color: var(--accent-primary);
          font-weight: 500;
        }

        .checkbox-label a:hover {
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

export default RegisterPage;
