import '../styles/RegisterPage.css';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  HiOutlineCog,
  HiOutlineCheck
} from 'react-icons/hi';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const RegisterPage = () => {
  useDocumentTitle('Register - StaySafe Hub');
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  // Step 1: form, Step 2: OTP
  const [step, setStep] = useState(1);
  const [pendingUserId, setPendingUserId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
  });

  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register, verifyOtp, resendOtp } = useAuth();
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

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsLoading(true);
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role
    );
    setIsLoading(false);

    if (result.success) {
      setPendingUserId(result.pendingUserId);
      setStep(2);
      setResendCooldown(60); // 1 minute cooldown
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setErrors({ otp: 'Please enter the 6-digit code' });
      return;
    }

    setIsLoading(true);
    const result = await verifyOtp(pendingUserId, otp);
    setIsLoading(false);

    if (result.success) {
      const dashboardPaths = {
        student: '/dashboard',
        owner: '/owner/dashboard',
        admin: '/admin/dashboard',
      };
      const userRole = result.user?.role || formData.role;
      navigate(dashboardPaths[userRole] || '/dashboard', { replace: true });
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    const result = await resendOtp(pendingUserId);
    setIsLoading(false);
    if (result.success) {
      setResendCooldown(60);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Google Sign In (skips OTP since Google verifies email)
  const handleGoogleSignIn = () => {
    window.location.href = `/api/auth/google?role=${formData.role}`;
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
              <li><HiOutlineCheck className="check-icon" /> Verified and safe accommodations</li>
              <li><HiOutlineCheck className="check-icon" /> Transparent pricing, no hidden fees</li>
              <li><HiOutlineCheck className="check-icon" /> 24/7 emergency support</li>
              <li><HiOutlineCheck className="check-icon" /> Women-first safety features</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-container">
          <div className="auth-form-wrapper">

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="form-header">
                    <h2>Create Account</h2>
                    <p>Fill in your details to get started</p>
                  </div>

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

                  <form onSubmit={handleRegisterSubmit} className="auth-form">
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
                          I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>
                        </span>
                      </label>
                    </div>

                    <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
                      Continue
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
                        onClick={handleGoogleSignIn}
                      >
                        Sign up with Google
                      </Button>
                    </div>
                  </form>

                  <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                    <p>
                      Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="form-header">
                    <h2>Verify Your Email</h2>
                    <p>We've sent a 6-digit verification code to <strong style={{ color: '#4f46e5' }}>{formData.email}</strong></p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="auth-form" style={{ marginTop: '30px' }}>
                    <div className="form-group">
                      <Input
                        label="Verification Code"
                        type="text"
                        name="otp"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value);
                          if (errors.otp) setErrors({});
                        }}
                        error={errors.otp}
                        style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}
                        maxLength={6}
                      />
                    </div>

                    <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
                      Verify & Complete Registration
                    </Button>

                    <div className="resend-container" style={{ textAlign: 'center', marginTop: '20px' }}>
                      <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        Didn't receive the code?{' '}
                        {resendCooldown > 0 ? (
                          <span>Resend in {resendCooldown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isLoading}
                            style={{
                              background: 'none', border: 'none', color: '#4f46e5',
                              fontWeight: '600', cursor: 'pointer', padding: 0
                            }}
                          >
                            Resend Code
                          </button>
                        )}
                      </p>
                    </div>
                  </form>

                  <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button
                      className="auth-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => setStep(1)}
                    >
                      &larr; Back to Registration
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
