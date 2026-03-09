import '../styles/LoginPage.css';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { HiOutlineLockClosed, HiOutlineShieldCheck, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import api from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
    useDocumentTitle('Reset Password');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token || !email) {
            toast.error('Invalid reset link. Please request a new one.');
            navigate('/forgot-password', { replace: true });
        }
    }, [token, email, navigate]);

    const validate = () => {
        const e = {};
        if (!formData.newPassword) e.newPassword = 'New password is required';
        else if (formData.newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
        if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
        else if (formData.newPassword !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                token,
                newPassword: formData.newPassword
            });
            setSuccess(true);
            toast.success('Password reset successfully!');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
            toast.error(msg);
            setErrors({ newPassword: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
                        <h1>Set New Password</h1>
                        <p>
                            Create a strong new password for your StaySafe Hub account.
                            Make sure it's something you haven't used before.
                        </p>
                        <div className="trust-metrics">
                            <div className="metric">
                                <span className="metric-value">🔒</span>
                                <span className="metric-label">Encrypted</span>
                            </div>
                            <div className="metric">
                                <span className="metric-value">6+</span>
                                <span className="metric-label">Min Chars</span>
                            </div>
                            <div className="metric">
                                <span className="metric-value">✅</span>
                                <span className="metric-label">Secure</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="auth-form-container">
                    <div className="auth-form-wrapper">

                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '2rem 0' }}
                            >
                                <div style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: 'var(--success-bg, #dcfce7)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    border: '2px solid var(--success, #22c55e)'
                                }}>
                                    <HiOutlineCheck size={36} style={{ color: 'var(--success, #22c55e)' }} />
                                </div>
                                <h2 style={{ marginBottom: '0.75rem' }}>Password Reset!</h2>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    Your password has been updated successfully.<br />
                                    Redirecting you to Sign In…
                                </p>
                                <div style={{ marginTop: '2rem' }}>
                                    <Link to="/login" className="auth-link" style={{ fontWeight: 600 }}>
                                        Go to Sign In →
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                <div className="form-header">
                                    <h2>New Password</h2>
                                    <p>Resetting password for <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong></p>
                                </div>

                                <form onSubmit={handleSubmit} className="auth-form">
                                    <div className="form-group">
                                        <Input
                                            label="New Password"
                                            type="password"
                                            name="newPassword"
                                            placeholder="Enter new password"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            error={errors.newPassword}
                                            leftIcon={<HiOutlineLockClosed size={20} />}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <Input
                                            label="Confirm New Password"
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="Confirm new password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            error={errors.confirmPassword}
                                            leftIcon={<HiOutlineLockClosed size={20} />}
                                        />
                                    </div>

                                    {/* Password match indicator */}
                                    {formData.newPassword && formData.confirmPassword && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            fontSize: '0.875rem', marginBottom: '0.5rem',
                                            color: formData.newPassword === formData.confirmPassword ? 'var(--success, #22c55e)' : 'var(--error, #ef4444)'
                                        }}>
                                            {formData.newPassword === formData.confirmPassword
                                                ? <><HiOutlineCheck size={16} /> Passwords match</>
                                                : <><HiOutlineX size={16} /> Passwords don't match</>
                                            }
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        isLoading={isLoading}
                                    >
                                        Reset Password
                                    </Button>
                                </form>

                                <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                                    <p>
                                        <Link to="/forgot-password" className="auth-link">← Request a new link</Link>
                                    </p>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
