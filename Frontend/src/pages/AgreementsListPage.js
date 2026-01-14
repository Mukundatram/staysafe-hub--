import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFileText, 
  FiCheck, 
  FiClock, 
  FiAlertCircle,
  FiHome,
  FiFilter,
  FiX,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiEdit3,
  FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import agreementService from '../services/agreementService';

const statusConfig = {
  draft: { bg: '#64748b', label: 'Draft', icon: FiEdit3 },
  pending_student: { bg: '#f59e0b', label: 'Awaiting Student', icon: FiClock },
  pending_owner: { bg: '#3b82f6', label: 'Awaiting Owner', icon: FiClock },
  active: { bg: '#10b981', label: 'Active', icon: FiCheck },
  expired: { bg: '#64748b', label: 'Expired', icon: FiAlertCircle },
  terminated: { bg: '#ef4444', label: 'Terminated', icon: FiX },
  cancelled: { bg: '#ef4444', label: 'Cancelled', icon: FiX }
};

const AgreementsListPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [agreements, setAgreements] = useState([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAgreements = useCallback(async () => {
    try {
      const role = filter === 'all' ? '' : filter;
      const response = await agreementService.getMyAgreements(role, statusFilter);
      setAgreements(response.agreements || []);
    } catch (error) {
      toast.error('Failed to load agreements');
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--border-light)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
            }}>
              <FiFileText size={28} color="white" />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                My Agreements
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                View and manage your rental agreements
              </p>
            </div>
          </div>
        </div>

        {/* Filters Container */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-light)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
            
            {/* Filter Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <FiFilter size={18} />
              <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>Filters:</span>
            </div>

            {/* Role Filter */}
            {(user?.role === 'owner' || user?.role === 'student') && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'owner', 'student'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: filter === f ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                      color: filter === f ? 'white' : 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      boxShadow: filter === f ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'owner' ? 'As Owner' : 'As Student'}
                  </button>
                ))}
              </div>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                minWidth: '160px'
              }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_student">Awaiting Student</option>
              <option value="pending_owner">Awaiting Owner</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Results count */}
            <span style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--accent-primary)',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {agreements.length} agreement{agreements.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Agreements Grid */}
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          <AnimatePresence mode="popLayout">
            {agreements.length > 0 ? (
              agreements.map((agreement, index) => {
                const status = statusConfig[agreement.status] || statusConfig.draft;
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={agreement._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      to={`/agreements/${agreement._id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-light)',
                        padding: '1.25rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                      }}
                      >
                        {/* Property Image / Icon */}
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden'
                        }}>
                          {agreement.property?.images?.[0] ? (
                            <img 
                              src={`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${agreement.property.images[0]}`}
                              alt="Property"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <FiHome size={28} color="white" />
                          )}
                        </div>

                        {/* Agreement Info */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <h3 style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              margin: 0
                            }}>
                              {agreement.property?.title || 'Untitled Property'}
                            </h3>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              background: status.bg,
                              color: 'white',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <StatusIcon size={12} />
                              {status.label}
                            </span>
                          </div>

                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            fontSize: '0.875rem',
                            color: 'var(--text-tertiary)'
                          }}>
                            {/* Duration */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FiCalendar size={14} />
                              <span>{formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}</span>
                            </div>

                            {/* Rent */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FiDollarSign size={14} />
                              <span>{formatCurrency(agreement.monthlyRent)}/mo</span>
                            </div>

                            {/* Role */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FiUser size={14} />
                              <span>
                                {agreement.owner?._id === user?._id ? 'You (Owner)' : 'You (Student)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Counterparty */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 16px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '12px',
                          minWidth: '180px'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}>
                            {(agreement.owner?._id === user?._id 
                              ? agreement.student?.name?.[0] 
                              : agreement.owner?.name?.[0]) || '?'}
                          </div>
                          <div>
                            <p style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-tertiary)',
                              margin: 0
                            }}>
                              {agreement.owner?._id === user?._id ? 'Student' : 'Owner'}
                            </p>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: 'var(--text-primary)',
                              margin: 0
                            }}>
                              {agreement.owner?._id === user?._id 
                                ? agreement.student?.name 
                                : agreement.owner?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'var(--bg-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-tertiary)'
                        }}>
                          <FiChevronRight size={20} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: '24px',
                  border: '2px dashed var(--border-light)',
                  padding: '4rem 2rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                  }}>
                    <FiFileText size={36} color="var(--text-tertiary)" />
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: '0 0 8px'
                  }}>
                    No Agreements Found
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-tertiary)',
                    margin: 0,
                    maxWidth: '400px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}>
                    {user?.role === 'owner' 
                      ? "You haven't created any rental agreements yet. Agreements will appear here when students book your properties."
                      : "You don't have any rental agreements yet. Book a property to get started!"}
                  </p>

                  {user?.role === 'student' && (
                    <Link to="/properties">
                      <button style={{
                        marginTop: '1.5rem',
                        padding: '12px 28px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'var(--accent-gradient)',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }}>
                        <FiHome size={18} />
                        Browse Properties
                      </button>
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary Cards */}
        {agreements.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <SummaryCard 
              icon={FiCheck}
              label="Active"
              count={agreements.filter(a => a.status === 'active').length}
              color="#10b981"
            />
            <SummaryCard 
              icon={FiClock}
              label="Pending"
              count={agreements.filter(a => a.status.includes('pending')).length}
              color="#f59e0b"
            />
            <SummaryCard 
              icon={FiEdit3}
              label="Draft"
              count={agreements.filter(a => a.status === 'draft').length}
              color="#64748b"
            />
            <SummaryCard 
              icon={FiAlertCircle}
              label="Expired/Terminated"
              count={agreements.filter(a => ['expired', 'terminated', 'cancelled'].includes(a.status)).length}
              color="#ef4444"
            />
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ icon: Icon, label, count, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: 'var(--bg-card)',
      borderRadius: '16px',
      padding: '1.25rem',
      border: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}
  >
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: `${color}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Icon size={22} color={color} />
    </div>
    <div>
      <p style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: 0,
        lineHeight: 1
      }}>
        {count}
      </p>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-tertiary)',
        margin: '4px 0 0'
      }}>
        {label}
      </p>
    </div>
  </motion.div>
);

export default AgreementsListPage;
