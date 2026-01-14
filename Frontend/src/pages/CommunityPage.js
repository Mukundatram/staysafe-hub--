import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUserGroup,
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiOutlineAcademicCap,
  HiOutlineChatAlt2,
  HiOutlineHeart,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineFilter
} from 'react-icons/hi';
import toast from 'react-hot-toast';

// Mock data for community members
const mockRoommates = [
  {
    id: 1,
    name: 'Priya Sharma',
    avatar: 'PS',
    location: 'Koramangala, Bangalore',
    college: 'IIT Bangalore',
    course: 'Computer Science',
    year: '3rd Year',
    budget: '8,000 - 12,000',
    interests: ['Coding', 'Reading', 'Music'],
    verified: true,
    compatibility: 92,
  },
  {
    id: 2,
    name: 'Rahul Verma',
    avatar: 'RV',
    location: 'HSR Layout, Bangalore',
    college: 'NIT Karnataka',
    course: 'Electronics',
    year: '4th Year',
    budget: '7,000 - 10,000',
    interests: ['Gaming', 'Cricket', 'Movies'],
    verified: true,
    compatibility: 87,
  },
  {
    id: 3,
    name: 'Ananya Gupta',
    avatar: 'AG',
    location: 'Indiranagar, Bangalore',
    college: 'BITS Pilani',
    course: 'Mechanical Engineering',
    year: '2nd Year',
    budget: '10,000 - 15,000',
    interests: ['Yoga', 'Photography', 'Travel'],
    verified: true,
    compatibility: 78,
  },
  {
    id: 4,
    name: 'Vikram Singh',
    avatar: 'VS',
    location: 'Whitefield, Bangalore',
    college: 'PES University',
    course: 'Data Science',
    year: 'Intern',
    budget: '6,000 - 9,000',
    interests: ['AI/ML', 'Chess', 'Cooking'],
    verified: false,
    compatibility: 84,
  },
];

const CommunityPage = () => {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const filteredRoommates = mockRoommates.filter(roommate => {
    const matchesSearch = roommate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roommate.college.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !filterLocation || roommate.location.toLowerCase().includes(filterLocation.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const handleConnect = (name) => {
    if (!isAuthenticated) {
      toast.error('Please login to connect with roommates');
      return;
    }
    toast.success(`Connection request sent to ${name}!`);
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
          </div>
        </motion.section>

        {/* Search & Filters */}
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
                  placeholder="Filter by location..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  leftIcon={<HiOutlineLocationMarker size={20} />}
                />
              </div>
              <Button variant="secondary" leftIcon={<HiOutlineFilter size={18} />}>
                More Filters
              </Button>
            </div>
          </Card>
        </motion.section>

        {/* Roommates Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="roommates-section"
        >
          <div className="section-header">
            <h2>Recommended Matches</h2>
            <span className="results-count">{filteredRoommates.length} potential roommates</span>
          </div>

          <div className="roommates-grid">
            {filteredRoommates.map((roommate, index) => (
              <motion.div
                key={roommate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card padding="lg" hoverable className="roommate-card">
                  <div className="card-top">
                    <div className="avatar" style={{ 
                      background: `linear-gradient(135deg, hsl(${roommate.id * 50}, 70%, 55%), hsl(${roommate.id * 50 + 40}, 70%, 45%))` 
                    }}>
                      {roommate.avatar}
                    </div>
                    <div className="compatibility">
                      <span className="match-score">{roommate.compatibility}%</span>
                      <span className="match-label">Match</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="name-row">
                      <h3>{roommate.name}</h3>
                      {roommate.verified && (
                        <HiOutlineShieldCheck className="verified-icon" size={18} />
                      )}
                    </div>

                    <div className="info-item">
                      <HiOutlineAcademicCap size={16} />
                      <span>{roommate.college} · {roommate.year}</span>
                    </div>

                    <div className="info-item">
                      <HiOutlineLocationMarker size={16} />
                      <span>{roommate.location}</span>
                    </div>

                    <div className="budget-row">
                      <span className="budget-label">Budget:</span>
                      <span className="budget-value">₹{roommate.budget}/mo</span>
                    </div>

                    <div className="interests">
                      {roommate.interests.map((interest, i) => (
                        <span key={i} className="interest-tag">{interest}</span>
                      ))}
                    </div>
                  </div>

                  <div className="card-actions">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      leftIcon={<HiOutlineChatAlt2 size={16} />}
                      onClick={() => handleConnect(roommate.name)}
                    >
                      Connect
                    </Button>
                    <button className="wishlist-btn">
                      <HiOutlineHeart size={18} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

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
          margin-bottom: 1rem;
        }

        .interest-tag {
          padding: 0.25rem 0.625rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--text-secondary);
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

        .wishlist-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          color: var(--text-tertiary);
          transition: all var(--transition-fast);
        }

        .wishlist-btn:hover {
          background: var(--error-bg);
          color: var(--error);
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
