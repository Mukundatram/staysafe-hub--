import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiArrowLeft } from 'react-icons/hi';
import roommateService from '../../services/roommateService';
import RoommateProfileForm from '../../components/roommate/RoommateProfileForm';
import Loading from '../../components/ui/Loading';
import Button from '../../components/ui/Button';
import './RoommateProfilePage.css';

const RoommateProfilePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await roommateService.getMyProfile();
            setProfile(data.profile);
        } catch (error) {
            if (error.response?.status === 404) {
                setEditMode(true);
            } else {
                toast.error('Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdated = (updatedProfile) => {
        setProfile(updatedProfile);
        setEditMode(false);
        toast.success('Profile updated successfully!');
    };

    const handleToggleActive = async () => {
        try {
            await roommateService.toggleActive(!profile.isProfileActive);
            setProfile(prev => ({ ...prev, isProfileActive: !prev.isProfileActive }));
            toast.success(`Profile ${!profile.isProfileActive ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error('Failed to update profile status');
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (editMode || !profile) {
        return (
            <div className="roommate-profile-page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/community/roommate')}>
                        <HiArrowLeft /> Back to Matches
                    </button>
                    <h1>{profile ? 'Edit Your Profile' : 'Create Your Profile'}</h1>
                </div>
                <RoommateProfileForm
                    existingProfile={profile}
                    onSuccess={handleProfileUpdated}
                />
            </div>
        );
    }

    return (
        <div className="roommate-profile-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate('/community/roommate')}>
                    <HiArrowLeft /> Back to Matches
                </button>
                <h1>My Roommate Profile</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-container"
            >
                <div className="profile-status">
                    <span className={`status-badge ${profile.isProfileActive ? 'active' : 'inactive'}`}>
                        {profile.isProfileActive ? '✓ Active' : '✕ Inactive'}
                    </span>
                    <Button variant="secondary" onClick={handleToggleActive}>
                        {profile.isProfileActive ? 'Deactivate' : 'Activate'} Profile
                    </Button>
                    <Button variant="primary" onClick={() => setEditMode(true)}>
                        Edit Profile
                    </Button>
                </div>

                <div className="profile-section">
                    <h2>Basic Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Location</label>
                            <p>{profile.city}{profile.area && `, ${profile.area}`}</p>
                        </div>
                        <div className="info-item">
                            <label>Budget Range</label>
                            <p>₹{profile.budgetMin?.toLocaleString()} - ₹{profile.budgetMax?.toLocaleString()}/month</p>
                        </div>
                        <div className="info-item">
                            <label>Move-in Date</label>
                            <p>{new Date(profile.expectedMoveInDate).toLocaleDateString()}</p>
                        </div>
                        <div className="info-item">
                            <label>Duration</label>
                            <p>{profile.duration}</p>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h2>Student Details</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Status</label>
                            <p>{profile.studentStatus}</p>
                        </div>
                        {profile.college && (
                            <div className="info-item">
                                <label>College</label>
                                <p>{profile.college}</p>
                            </div>
                        )}
                        {profile.year && (
                            <div className="info-item">
                                <label>Year</label>
                                <p>{profile.year}</p>
                            </div>
                        )}
                    </div>
                </div>

                {profile.lifestyle && (
                    <div className="profile-section">
                        <h2>Lifestyle Preferences</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Sleep Schedule</label>
                                <p>{profile.lifestyle.sleepSchedule}</p>
                            </div>
                            <div className="info-item">
                                <label>Food Preference</label>
                                <p>{profile.lifestyle.foodPreference}</p>
                            </div>
                            <div className="info-item">
                                <label>Smoking</label>
                                <p>{profile.lifestyle.smoking}</p>
                            </div>
                            <div className="info-item">
                                <label>Guests</label>
                                <p>{profile.lifestyle.guests}</p>
                            </div>
                            <div className="info-item">
                                <label>Cleanliness Level</label>
                                <p>{profile.lifestyle.cleanlinessLevel}</p>
                            </div>
                        </div>
                    </div>
                )}

                {profile.interests && profile.interests.length > 0 && (
                    <div className="profile-section">
                        <h2>Interests & Hobbies</h2>
                        <div className="interests-list">
                            {profile.interests.map((interest, index) => (
                                <span key={index} className="interest-tag">{interest}</span>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default RoommateProfilePage;
