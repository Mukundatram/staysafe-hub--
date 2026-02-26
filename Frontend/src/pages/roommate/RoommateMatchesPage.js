import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineAdjustments, HiOutlineUserGroup } from 'react-icons/hi';
import roommateService from '../../services/roommateService';
import RoommateMatchCard from '../../components/roommate/RoommateMatchCard';
import RoommateProfileForm from '../../components/roommate/RoommateProfileForm';
import Loading from '../../components/ui/Loading';
import Button from '../../components/ui/Button';
import './RoommateMatchesPage.css';

const RoommateMatchesPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [matches, setMatches] = useState([]);
    const [filters, setFilters] = useState({
        minScore: 50,
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState(null);

    // Define fetchMatches before useEffect to avoid initialization error
    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const data = await roommateService.getMatches(filters);
            setMatches(data.matches || []);
            setPagination(data.pagination);
        } catch (error) {
            toast.error('Failed to fetch matches');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        checkProfile();
    }, []);

    useEffect(() => {
        if (hasProfile) {
            fetchMatches();
        }
    }, [hasProfile, filters, fetchMatches]);

    const checkProfile = async () => {
        try {
            await roommateService.getMyProfile();
            setHasProfile(true);
        } catch (error) {
            if (error.response?.status === 404) {
                setHasProfile(false);
                setShowProfileForm(true);
            }
        } finally {
            setLoading(false);
        }
    };


    const handleProfileCreated = () => {
        setHasProfile(true);
        setShowProfileForm(false);
        toast.success('Profile created! Finding matches...');
    };

    const handleRequestSent = () => {
        // Optionally refresh matches to update button states
        fetchMatches();
    };

    if (loading && !hasProfile) {
        return <Loading />;
    }

    if (showProfileForm) {
        return (
            <div className="roommate-matches-page">
                <div className="page-header">
                    <h1>Create Your Roommate Profile</h1>
                    <p>Tell us about yourself to find compatible roommates</p>
                </div>
                <RoommateProfileForm onSuccess={handleProfileCreated} />
            </div>
        );
    }

    return (
        <div className="roommate-matches-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>
                        <HiOutlineUserGroup /> Find Your Perfect Roommate
                    </h1>
                    <p>Discover compatible roommates based on lifestyle, interests, and preferences</p>
                </div>

                <div className="header-actions">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/community/roommate/profile')}
                    >
                        My Profile
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/community/roommate/requests')}
                    >
                        Requests
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/community/roommate/connections')}
                    >
                        Connections
                    </Button>
                </div>
            </div>

            <div className="filters-section">
                <div className="filters-header">
                    <HiOutlineAdjustments />
                    <span>Filters</span>
                </div>

                <div className="filter-controls">
                    <div className="filter-item">
                        <label>Minimum Match Score</label>
                        <select
                            value={filters.minScore}
                            onChange={(e) => setFilters({ ...filters, minScore: e.target.value, page: 1 })}
                        >
                            <option value="0">All Matches</option>
                            <option value="50">50% & Above</option>
                            <option value="60">60% & Above</option>
                            <option value="70">70% & Above</option>
                            <option value="80">80% & Above</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <Loading />
            ) : matches.length === 0 ? (
                <div className="empty-state">
                    <HiOutlineUserGroup size={64} />
                    <h3>No Matches Found</h3>
                    <p>Try adjusting your filters or update your profile preferences</p>
                    <Button onClick={() => navigate('/community/roommate/profile')}>
                        Update Profile
                    </Button>
                </div>
            ) : (
                <>
                    <div className="matches-grid">
                        {matches.map((match, index) => (
                            <motion.div
                                key={match.user._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <RoommateMatchCard
                                    match={match}
                                    onRequestSent={handleRequestSent}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {pagination && pagination.pages > 1 && (
                        <div className="pagination">
                            <Button
                                variant="secondary"
                                disabled={filters.page === 1}
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                            >
                                Previous
                            </Button>

                            <span className="page-info">
                                Page {pagination.page} of {pagination.pages}
                            </span>

                            <Button
                                variant="secondary"
                                disabled={filters.page === pagination.pages}
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RoommateMatchesPage;
