import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import phoneService from '../services/phoneService';
import Loading from '../components/ui/Loading';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineAcademicCap,
  HiOutlineIdentification,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineHeart,
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineLockClosed,
  HiOutlineCalendar,
  HiOutlineArrowRight,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

const ProfilePage = () => {
  useDocumentTitle('My Profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', college: '', studentId: '' });
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user/me');
      setUser(res.data);
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        college: res.data.college || '',
        studentId: res.data.studentId || ''
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    try {
      setSaving(true);
      const res = await api.put('/user/me', form);
      toast.success('Profile updated successfully!');
      setUser(prev => ({ ...prev, ...res.data.user }));
      setEditing(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      college: user.college || '',
      studentId: user.studentId || ''
    });
    setEditing(false);
  };

  const requestOtp = async () => {
    if (!form.phone || form.phone.length < 10) return toast.error('Enter a valid phone number');
    setIsRequesting(true);
    try {
      await phoneService.requestOtp(form.phone);
      toast.success('OTP sent to your phone');
      setShowOtp(true);
    } catch (e) {
      console.error(e);
      toast.error('Failed to send OTP');
    } finally {
      setIsRequesting(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 4) return toast.error('Enter a valid OTP');
    setVerifyingOtp(true);
    try {
      await phoneService.verifyOtp(form.phone, otp);
      toast.success('Phone verified successfully!');
      setShowOtp(false);
      setOtp('');
      await fetchUser();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'OTP verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role) => {
    const roles = {
      student: { label: 'Student', color: 'var(--accent-primary)' },
      owner: { label: 'Property Owner', color: 'var(--warning)' },
      admin: { label: 'Administrator', color: 'var(--error)' }
    };
    return roles[role] || { label: role, color: 'var(--text-tertiary)' };
  };

  const getVerificationLevel = () => {
    if (!user) return { label: 'Unknown', color: 'var(--text-tertiary)', icon: HiOutlineExclamationCircle };
    const vs = user.verificationState;
    if (vs === 'verified_student' || vs === 'verified_intern' || vs === 'aadhaar_verified') {
      return { label: 'Fully Verified', color: 'var(--success)', icon: HiOutlineBadgeCheck };
    }
    if (vs === 'document_uploaded' || vs === 'email_verified') {
      return { label: 'Partially Verified', color: 'var(--warning)', icon: HiOutlineShieldCheck };
    }
    return { label: 'Not Verified', color: 'var(--error)', icon: HiOutlineExclamationCircle };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <Loading size="lg" text="Loading your profile..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-loading">
        <p>Could not load profile. Please try again.</p>
      </div>
    );
  }

  const roleBadge = getRoleBadge(user.role);
  const verification = getVerificationLevel();
  const VerificationIcon = verification.icon;

  const verificationItems = [
    {
      label: 'Identity',
      verified: user.verificationStatus?.identity?.verified || false,
      icon: HiOutlineIdentification
    },
    {
      label: 'Phone',
      verified: user.phoneVerified || false,
      icon: HiOutlinePhone
    },
    {
      label: 'Aadhaar',
      verified: user.aadhaarVerification?.verified || false,
      icon: HiOutlineShieldCheck
    }
  ];

  const quickLinks = [
    { label: 'My Dashboard', icon: HiOutlineHome, to: user.role === 'owner' ? '/owner/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/dashboard', color: 'var(--accent-primary)' },
    { label: 'My Wishlist', icon: HiOutlineHeart, to: '/wishlist', color: 'var(--accent-secondary)' },
    { label: 'Verification', icon: HiOutlineShieldCheck, to: '/verification', color: 'var(--success)' },
    { label: 'Agreements', icon: HiOutlineDocumentText, to: '/agreements', color: 'var(--warning)' }
  ];

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="profile-header-card"
        >
          <div className="profile-header-bg" />
          <div className="profile-header-content">
            <div className="profile-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar-img" />
              ) : (
                <div className="avatar-initials">{getInitials(user.name)}</div>
              )}
              <div className="avatar-status" style={{ background: verification.color }} title={verification.label} />
            </div>

            <div className="profile-header-info">
              <h1 className="profile-name">{user.name}</h1>
              <p className="profile-email">
                <HiOutlineMail size={16} />
                {user.email}
              </p>
              <div className="profile-badges">
                <span className="role-badge" style={{ background: `${roleBadge.color}20`, color: roleBadge.color }}>
                  {roleBadge.label}
                </span>
                <span className="verification-badge" style={{ background: `${verification.color}20`, color: verification.color }}>
                  <VerificationIcon size={14} />
                  {verification.label}
                </span>
              </div>
            </div>

            <div className="profile-meta">
              <div className="meta-item">
                <HiOutlineCalendar size={16} />
                <span>Member since {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="profile-grid">
          {/* Personal Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="profile-card"
          >
            <div className="card-header">
              <h2>
                <HiOutlineUser size={20} />
                Personal Information
              </h2>
              {!editing ? (
                <button className="edit-btn" onClick={() => setEditing(true)}>
                  <HiOutlinePencil size={16} />
                  Edit
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSave} disabled={saving}>
                    <HiOutlineCheck size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    <HiOutlineX size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>
                  <HiOutlineUser size={15} />
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="profile-input"
                  />
                ) : (
                  <p className="field-value">{user.name}</p>
                )}
              </div>

              <div className="form-field">
                <label>
                  <HiOutlineMail size={15} />
                  Email Address
                  <HiOutlineLockClosed size={12} className="lock-icon" />
                </label>
                <p className="field-value field-readonly">{user.email}</p>
              </div>

              <div className="form-field">
                <label>
                  <HiOutlinePhone size={15} />
                  Phone Number
                  {user.phoneVerified && (
                    <span className="verified-inline">
                      <HiOutlineCheck size={12} /> Verified
                    </span>
                  )}
                </label>
                {editing ? (
                  <div className="phone-field">
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="profile-input"
                    />
                    {!user.phoneVerified && (
                      <button
                        className="verify-phone-btn"
                        onClick={requestOtp}
                        disabled={isRequesting}
                      >
                        {isRequesting ? 'Sending...' : 'Verify'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="field-value">{user.phone || 'Not provided'}</p>
                )}
                {showOtp && editing && (
                  <div className="otp-section">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="profile-input otp-input"
                      maxLength={6}
                    />
                    <button
                      className="verify-otp-btn"
                      onClick={verifyOtp}
                      disabled={verifyingOtp}
                    >
                      {verifyingOtp ? 'Verifying...' : 'Submit OTP'}
                    </button>
                  </div>
                )}
              </div>

              {(user.role === 'student' || user.college) && (
                <>
                  <div className="form-field">
                    <label>
                      <HiOutlineAcademicCap size={15} />
                      College / University
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="college"
                        value={form.college}
                        onChange={handleChange}
                        placeholder="Enter your college name"
                        className="profile-input"
                      />
                    ) : (
                      <p className="field-value">{user.college || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="form-field">
                    <label>
                      <HiOutlineIdentification size={15} />
                      Student ID
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="studentId"
                        value={form.studentId}
                        onChange={handleChange}
                        placeholder="Enter your student ID"
                        className="profile-input"
                      />
                    ) : (
                      <p className="field-value">{user.studentId || 'Not provided'}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="profile-sidebar">
            {/* Verification Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="profile-card"
            >
              <div className="card-header">
                <h2>
                  <HiOutlineShieldCheck size={20} />
                  Verification Status
                </h2>
              </div>

              <div className="verification-list">
                {verificationItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className={`verification-item ${item.verified ? 'verified' : 'unverified'}`}>
                      <div className="verification-item-icon" style={{
                        background: item.verified ? 'var(--success-bg)' : 'var(--bg-tertiary)',
                        color: item.verified ? 'var(--success)' : 'var(--text-tertiary)'
                      }}>
                        <Icon size={18} />
                      </div>
                      <div className="verification-item-text">
                        <span className="verification-label">{item.label}</span>
                        <span className={`verification-status ${item.verified ? 'status-verified' : 'status-pending'}`}>
                          {item.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      {item.verified ? (
                        <HiOutlineCheck size={18} className="check-icon" style={{ color: 'var(--success)' }} />
                      ) : (
                        <HiOutlineX size={18} className="check-icon" style={{ color: 'var(--text-tertiary)' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              <Link to="/verification" className="verification-link">
                Complete Verification
                <HiOutlineArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Quick Links Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="profile-card"
            >
              <div className="card-header">
                <h2>
                  <HiOutlineArrowRight size={20} />
                  Quick Actions
                </h2>
              </div>

              <div className="quick-links-grid">
                {quickLinks.map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <Link key={idx} to={link.to} className="quick-link-item">
                      <div className="quick-link-icon" style={{ background: `${link.color}15`, color: link.color }}>
                        <Icon size={22} />
                      </div>
                      <span>{link.label}</span>
                      <HiOutlineArrowRight size={14} className="quick-link-arrow" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .profile-loading {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-page {
          padding: 2rem 0 4rem;
        }

        .profile-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* ===== Header Card ===== */
        .profile-header-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          overflow: hidden;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-md);
        }

        .profile-header-bg {
          height: 120px;
          background: var(--accent-gradient);
          opacity: 0.9;
        }

        .profile-header-content {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 0 2rem 2rem;
          margin-top: -50px;
          position: relative;
        }

        .profile-avatar {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-img,
        .avatar-initials {
          width: 100px;
          height: 100px;
          border-radius: var(--radius-full);
          border: 4px solid var(--bg-card);
          box-shadow: var(--shadow-lg);
        }

        .avatar-img {
          object-fit: cover;
        }

        .avatar-initials {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          background: var(--accent-gradient);
        }

        .avatar-status {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: var(--radius-full);
          border: 3px solid var(--bg-card);
        }

        .profile-header-info {
          flex: 1;
          padding-top: 56px;
        }

        .profile-name {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .profile-email {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .profile-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .role-badge,
        .verification-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.875rem;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .profile-meta {
          padding-top: 56px;
          flex-shrink: 0;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        /* ===== Grid Layout ===== */
        .profile-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .profile-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ===== Card ===== */
        .profile-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
        }

        .card-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.0625rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        /* ===== Edit Button ===== */
        .edit-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--accent-primary);
          background: transparent;
          border: 1px solid var(--accent-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .edit-btn:hover {
          background: var(--accent-primary);
          color: white;
        }

        .edit-actions {
          display: flex;
          gap: 0.5rem;
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          background: var(--success);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .save-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-tertiary);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .cancel-btn:hover {
          color: var(--text-primary);
          background: var(--border-light);
        }

        /* ===== Form ===== */
        .form-grid {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-field label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .lock-icon {
          color: var(--text-tertiary);
          margin-left: 0.25rem;
        }

        .verified-inline {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--success);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
          margin-left: 0.5rem;
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-full);
          background: var(--success-bg);
        }

        .profile-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.9375rem;
          transition: all var(--transition-fast);
          font-family: inherit;
        }

        .profile-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .profile-input::placeholder {
          color: var(--text-tertiary);
        }

        .field-value {
          font-size: 0.9375rem;
          color: var(--text-primary);
          padding: 0.75rem 0 0;
          line-height: 1.5;
        }

        .field-readonly {
          color: var(--text-secondary);
        }

        .phone-field {
          display: flex;
          gap: 0.75rem;
        }

        .phone-field .profile-input {
          flex: 1;
        }

        .verify-phone-btn {
          padding: 0.75rem 1.25rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .verify-phone-btn:hover:not(:disabled) {
          background: var(--accent-primary-hover);
        }

        .verify-phone-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .otp-section {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
          animation: slideDown 0.3s ease;
        }

        .otp-input {
          max-width: 200px;
          letter-spacing: 0.25em;
          font-weight: 600;
          text-align: center;
        }

        .verify-otp-btn {
          padding: 0.75rem 1.25rem;
          background: var(--success);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .verify-otp-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .verify-otp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ===== Verification Status ===== */
        .verification-list {
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .verification-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          transition: all var(--transition-fast);
        }

        .verification-item:hover {
          background: var(--bg-tertiary);
        }

        .verification-item-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .verification-item-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .verification-label {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .verification-status {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-verified {
          color: var(--success);
        }

        .status-pending {
          color: var(--text-tertiary);
        }

        .check-icon {
          flex-shrink: 0;
        }

        .verification-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid var(--border-light);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent-primary);
          transition: all var(--transition-fast);
        }

        .verification-link:hover {
          background: var(--bg-secondary);
        }

        /* ===== Quick Links ===== */
        .quick-links-grid {
          padding: 1rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .quick-link-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .quick-link-item:hover {
          background: var(--bg-tertiary);
          transform: translateX(4px);
        }

        .quick-link-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .quick-link-item span {
          flex: 1;
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .quick-link-arrow {
          color: var(--text-tertiary);
          transition: transform var(--transition-fast);
        }

        .quick-link-item:hover .quick-link-arrow {
          transform: translateX(4px);
          color: var(--accent-primary);
        }

        /* ===== Responsive ===== */
        @media (max-width: 768px) {
          .profile-header-content {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 0 1.25rem 1.5rem;
          }

          .profile-header-info {
            padding-top: 0.5rem;
          }

          .profile-email {
            justify-content: center;
          }

          .profile-badges {
            justify-content: center;
          }

          .profile-meta {
            padding-top: 0;
          }

          .profile-name {
            font-size: 1.5rem;
          }

          .profile-grid {
            grid-template-columns: 1fr;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .phone-field {
            flex-direction: column;
          }

          .otp-section {
            flex-direction: column;
          }

          .otp-input {
            max-width: 100%;
          }

          .profile-header-bg {
            height: 100px;
          }

          .avatar-img,
          .avatar-initials {
            width: 80px;
            height: 80px;
            font-size: 1.5rem;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
