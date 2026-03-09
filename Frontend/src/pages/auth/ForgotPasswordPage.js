import '../styles/LoginPage.css';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { HiOutlineMail, HiOutlineShieldCheck, HiOutlineCheck } from 'react-icons/hi';
import api from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
    useDocumentTitle('Forgot Password');
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
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
                        <h1>Forgot Password?</h1>
                        <p>
                            No worries! Enter your registered email address and we'll
                            send you a secure link to reset your password.
                        </p>
                        <div className="trust-metrics">
                            <div className="metric">
                                <span className="metric-value">🔒</span>
                                <span className="metric-label">Secure Reset</span>
                            </div>
                            <div className="metric">
                                <span className="metric-value">15m</span>
                                <span className="metric-label">Link Expiry</span>
                            </div>
                            <div className="metric">
                                <span className="metric-value">✉️</span>
                                <span className="metric-label">Email Delivery</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="auth-form-container">
                    <div className="auth-form-wrapper">

                        {sent ? (
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
                                <h2 style={{ marginBottom: '0.75rem' }}>Check your inbox!</h2>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    We've sent a password reset link to <strong>{email}</strong>.<br />
                                    The link expires in <strong>15 minutes</strong>.
                                </p>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '1rem' }}>
                                    Didn't receive it? Check your spam folder or{' '}
                                    <button
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                        onClick={() => setSent(false)}
                                    >
                                        try again
                                    </button>.
                                </p>
                                <div style={{ marginTop: '2rem' }}>
                                    <Link to="/login" className="auth-link" style={{ fontWeight: 600 }}>
                                        ← Back to Sign In
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                <div className="form-header">
                                    <h2>Reset Password</h2>
                                    <p>Enter your email to receive a reset link</p>
                                </div>

                                <form onSubmit={handleSubmit} className="auth-form">
                                    <div className="form-group">
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            name="email"
                                            placeholder="Enter your registered email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                            error={error}
                                            leftIcon={<HiOutlineMail size={20} />}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        isLoading={isLoading}
                                    >
                                        Send Reset Link
                                    </Button>
                                </form>

                                <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                                    <p>
                                        Remember your password?{' '}
                                        <Link to="/login" className="auth-link">Sign in</Link>
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

export default ForgotPasswordPage;
