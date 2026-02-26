import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import roommateService from '../services/roommateService';
import {
  HiOutlineUserGroup,
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiOutlineAcademicCap,
  HiOutlineChatAlt2,
  HiOutlineHeart,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineFilter,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineArrowRight
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const CommunityPage = () => {
  useDocumentTitle('Community');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(null);

  const fetchMatches = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await roommateService.getMatches({ minScore: 30 });
      setRoommates(data.matches || []);
      setHasProfile(true);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      if (err.response?.status === 404) {
        // User hasn't created a roommate profile
        setHasProfile(false);
        setRoommates([]);
      } else {
        toast.error('Failed to load community matches');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const filteredRoommates = roommates.filter(match => {
    const name = match.user?.name || '';
    const college = match.profile?.college || match.user?.college || '';
    const city = match.profile?.city || '';
    const area = match.profile?.area || '';

    const matchesSearch = !searchTerm ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = !filterLocation ||
      city.toLowerCase().includes(filterLocation.toLowerCase()) ||
      area.toLowerCase().includes(filterLocation.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  const handleConnect = async (match) => {
    if (!isAuthenticated) {
      toast.error('Please login to connect with roommates');
      return;
    }

    const userId = match.user?._id;
    if (!userId) return;

    try {
      setSendingRequest(userId);
      await roommateService.sendRequest(userId, 'Hi! I found you on the community page and would like to connect.');
      toast.success(`Connection request sent to ${match.user.name}!`);
      // Update local state to reflect pending status
      setRoommates(prev => prev.map(m =>
        m.user?._id === userId
          ? { ...m, connectionStatus: 'pending', canConnect: false }
          : m
      ));
    } catch (err) {
      console.error('Failed to send request:', err);
      const msg = err.response?.data?.error || 'Failed to send connection request';
      toast.error(msg);
    } finally {
      setSendingRequest(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getConnectionButton = (match) => {
    const userId = match.user?._id;
    const status = match.connectionStatus;
    const isSending = sendingRequest === userId;

    if (status === 'accepted') {
      return (
        <Button variant="secondary" size="sm" leftIcon={<HiOutlineCheck size={16} />} disabled>
          Connected
        </Button>
      );
    }
    if (status === 'pending') {
      return (
        <Button variant="outline" size="sm" leftIcon={<HiOutlineClock size={16} />} disabled>
          Pending
        </Button>
      );
    }
    return (
      <Button
        variant="outline"
        size="sm"
        leftIcon={<HiOutlineChatAlt2 size={16} />}
        onClick={() => handleConnect(match)}
        isLoading={isSending}
        disabled={isSending}
      >
        Connect
      </Button>
    );
  };

  const formatBudget = (min, max) => {
    if (!min && !max) return 'N/A';
    const fmtMin = min ? `₹${min.toLocaleString('en-IN')}` : '';
    const fmtMax = max ? `₹${max.toLocaleString('en-IN')}` : '';
    if (fmtMin && fmtMax) return `${fmtMin} - ${fmtMax}`;
    return fmtMin || fmtMax;
  };

  const isVerified = (match) => {
    const u = match.user;
    return u?.verificationStatus?.isFullyVerified || u?.aadhaarVerification?.verified || u?.isVerified;
  };

  return (
    <div className="community-page">
      <div className="container">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-section"
        >
          <div className="hero-content">
            <Badge variant="info">
              <HiOutlineUserGroup size={14} />
              Community
            </Badge>
            <h1>Find Your Perfect Roommate</h1>
            <p>
              Connect with verified students and interns who share your interests,
              budget, and lifestyle preferences. Building communities, one match at a time.
            </p>
            {isAuthenticated && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/community/roommate')}
                  leftIcon={<HiOutlineUserGroup size={20} />}
                >
                  Find Your Roommate
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/community/roommate/profile')}
                  leftIcon={<HiOutlineStar size={20} />}
                >
                  My Profile
                </Button>
              </div>
            )}
            {!isAuthenticated && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login">
                  <Button variant="primary" size="lg">
                    Login to Find Roommates
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" size="lg">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.section>

        {/* Search & Filters — show only when authenticated */}
        {isAuthenticated && hasProfile && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="search-section"
          >
            <Card padding="lg">
              <div className="search-grid">
                <div className="search-input-wrapper">
                  <Input
                    placeholder="Search by name or college..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<HiOutlineSearch size={20} />}
                  />
                </div>
                <div className="filter-input-wrapper">
                  <Input
                    placeholder="Filter by city or area..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    leftIcon={<HiOutlineLocationMarker size={20} />}
                  />
                </div>
                <Button
                  variant="secondary"
                  leftIcon={<HiOutlineFilter size={18} />}
                  onClick={fetchMatches}
                >
                  Refresh
                </Button>
              </div>
            </Card>
          </motion.section>
        )}

        {/* Content Section */}
        {isAuthenticated && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="roommates-section"
          >
            {loading ? (
              <Loading size="lg" text="Finding your matches..." />
            ) : !hasProfile ? (
              <EmptyState
                icon={<HiOutlineUserGroup size={48} />}
                title="Create Your Roommate Profile"
                description="Set up your roommate profile to see compatible matches based on your preferences, budget, and lifestyle."
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/community/roommate/profile')}
                  leftIcon={<HiOutlineArrowRight size={18} />}
                >
                  Create Profile
                </Button>
              </EmptyState>
            ) : filteredRoommates.length === 0 ? (
              <EmptyState
                icon={<HiOutlineSearch size={48} />}
                title={searchTerm || filterLocation ? 'No matches found' : 'No matches yet'}
                description={searchTerm || filterLocation
                  ? 'Try adjusting your search or filters.'
                  : 'There are no compatible roommate profiles in your area yet. Check back later or update your preferences.'
                }
              >
                {(searchTerm || filterLocation) && (
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterLocation(''); }}>
                    Clear Filters
                  </Button>
                )}
              </EmptyState>
            ) : (
              <>
                <div className="section-header">
                  <h2>Recommended Matches</h2>
                  <span className="results-count">{filteredRoommates.length} potential roommate{filteredRoommates.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="roommates-grid">
                  {filteredRoommates.map((match, index) => {
                    const profile = match.profile || {};
                    const u = match.user || {};
                    return (
                      <motion.div
                        key={u._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + index * 0.04 }}
                      >
                        <Card padding="lg" hoverable className="roommate-card">
                          <div className="card-top">
                            <div className="avatar" style={{
                              background: `linear-gradient(135deg, hsl(${(index * 50 + 120) % 360}, 70%, 55%), hsl(${(index * 50 + 160) % 360}, 70%, 45%))`
                            }}>
                              {getInitials(u.name)}
                            </div>
                            <div className="compatibility">
                              <span className="match-score">{match.matchPercentage || 0}%</span>
                              <span className="match-label">Match</span>
                            </div>
                          </div>

                          <div className="card-body">
                            <div className="name-row">
                              <h3>{u.name || 'Unknown'}</h3>
                              {isVerified(match) && (
                                <HiOutlineShieldCheck className="verified-icon" size={18} />
                              )}
                            </div>

                            {(profile.college || u.college) && (
                              <div className="info-item">
                                <HiOutlineAcademicCap size={16} />
                                <span>
                                  {profile.college || u.college}
                                  {profile.year ? ` · Year ${profile.year}` : ''}
                                  {profile.studentStatus === 'intern' ? ' · Intern' : ''}
                                  {profile.studentStatus === 'working' ? ' · Working' : ''}
                                </span>
                              </div>
                            )}

                            <div className="info-item">
                              <HiOutlineLocationMarker size={16} />
                              <span>{profile.area ? `${profile.area}, ` : ''}{profile.city || 'N/A'}</span>
                            </div>

                            <div className="budget-row">
                              <span className="budget-label">Budget:</span>
                              <span className="budget-value">{formatBudget(profile.budgetMin, profile.budgetMax)}/mo</span>
                            </div>

                            {profile.interests && profile.interests.length > 0 && (
                              <div className="interests">
                                {profile.interests.slice(0, 4).map((interest, i) => (
                                  <span key={i} className="interest-tag">{interest}</span>
                                ))}
                                {profile.interests.length > 4 && (
                                  <span className="interest-tag interest-more">+{profile.interests.length - 4}</span>
                                )}
                              </div>
                            )}

                            {match.commonInterests && match.commonInterests.length > 0 && (
                              <div className="common-interests">
                                <HiOutlineHeart size={12} />
                                <span>{match.commonInterests.length} common interest{match.commonInterests.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          <div className="card-actions">
                            {getConnectionButton(match)}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.section>
        )}

        {/* Community Guidelines */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="guidelines-section"
        >
          <Card padding="xl" variant="gradient">
            <div className="guidelines-content">
              <h2>Community Guidelines</h2>
              <div className="guidelines-grid">
                <div className="guideline-item">
                  <HiOutlineShieldCheck size={24} />
                  <h4>Verified Profiles</h4>
                  <p>Only connect with ID-verified students and interns for your safety.</p>
                </div>
                <div className="guideline-item">
                  <HiOutlineStar size={24} />
                  <h4>Respectful Community</h4>
                  <p>We maintain a zero-tolerance policy for harassment or discrimination.</p>
                </div>
                <div className="guideline-item">
                  <HiOutlineChatAlt2 size={24} />
                  <h4>Open Communication</h4>
                  <p>Discuss expectations openly before committing to share a space.</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>
      </div>

      <style>{`
        .community-page {
          min-height: calc(100vh - 80px);
          padding: 2rem 0 4rem;
          background: var(--bg-secondary);
        }

        .hero-section {
          text-align: center;
          padding: 2rem 0 3rem;
        }

        .hero-content h1 {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          margin: 1rem 0;
        }

        .hero-content p {
          max-width: 600px;
          margin: 0 auto;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .search-section {
          margin-bottom: 2rem;
        }

        .search-grid {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .search-grid {
            grid-template-columns: 1fr 1fr auto;
          }
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          font-size: 1.25rem;
        }

        .results-count {
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        .roommates-grid {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .roommates-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .roommates-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .roommates-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .roommate-card {
          display: flex;
          flex-direction: column;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .avatar {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          color: white;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .compatibility {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--success-bg);
          border-radius: var(--radius-lg);
        }

        .match-score {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--success);
        }

        .match-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--success);
        }

        .card-body {
          flex: 1;
        }

        .name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .name-row h3 {
          font-size: 1.0625rem;
        }

        .verified-icon {
          color: var(--accent-primary);
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .budget-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.75rem 0;
        }

        .budget-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .budget-value {
          font-weight: 600;
          color: var(--accent-primary);
        }

        .interests {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-bottom: 0.5rem;
        }

        .interest-tag {
          padding: 0.25rem 0.625rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .interest-more {
          background: var(--accent-gradient-soft);
          color: var(--accent-primary);
          font-weight: 600;
        }

        .common-interests {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--accent-secondary);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
        }

        .card-actions .btn {
          flex: 1;
        }

        .guidelines-section {
          margin-top: 4rem;
        }

        .guidelines-content {
          text-align: center;
        }

        .guidelines-content h2 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
        }

        .guidelines-grid {
          display: grid;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .guidelines-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .guideline-item {
          text-align: center;
        }

        .guideline-item svg {
          color: var(--accent-primary);
          margin-bottom: 1rem;
        }

        .guideline-item h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .guideline-item p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default CommunityPage;
