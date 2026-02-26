import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    HiOutlineUser,
    HiOutlineLocationMarker,
    HiOutlineBadgeCheck,
    HiOutlineCurrencyRupee,
    HiOutlineCalendar,
    HiOutlineHeart,
    HiOutlineChat
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import roommateService from '../../services/roommateService';
import Button from '../ui/Button';
import './RoommateMatchCard.css';

const RoommateMatchCard = ({ match, onRequestSent }) => {
    const navigate = useNavigate();
    const {
        user,
        profile,
        matchPercentage,
        explanation,
        commonInterests = [],
        connectionStatus = 'none',
        canConnect = true
    } = match;

    const [sending, setSending] = useState(false);
    const [requested, setRequested] = useState(connectionStatus !== 'none');

    const getLifestyleTag = (lifestyle) => {
        const tags = [];

        if (lifestyle.sleepSchedule === 'early') tags.push('🌅 Early Bird');
        if (lifestyle.sleepSchedule === 'late') tags.push('🌙 Night Owl');
        if (lifestyle.sleepSchedule === 'flexible') tags.push('⏰ Flexible');

        if (lifestyle.foodPreference === 'veg') tags.push('🥗 Veg');
        if (lifestyle.foodPreference === 'non-veg') tags.push('🍗 Non-Veg');
        if (lifestyle.foodPreference === 'both') tags.push('🍽️ Flexible Diet');

        if (lifestyle.smoking === 'no') tags.push('🚭 Non-Smoker');
        if (lifestyle.cleanlinessLevel === 'high') tags.push('✨ Very Clean');

        return tags.slice(0, 4);
    };

    const handleConnect = async () => {
        if (!canConnect || requested) return;

        setSending(true);
        try {
            await roommateService.sendRequest(user._id, `Hey! We have ${matchPercentage}% compatibility. Would love to connect!`);
            toast.success('Connection request sent!');
            setRequested(true);
            if (onRequestSent) onRequestSent();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send request');
        } finally {
            setSending(false);
        }
    };

    const handleMessage = () => {
        navigate(`/community/roommate/chat/${user._id}`);
    };

    const getButtonState = () => {
        // Check if user is properly verified using the correct fields
        const isUserVerified = user.isVerified ||
            user.verificationStatus?.isFullyVerified ||
            user.aadhaarVerification?.verified;

        if (connectionStatus === 'pending') return { text: 'Request Pending', disabled: true, variant: 'secondary' };
        if (connectionStatus === 'accepted') return { text: 'Connected ✓', disabled: true, variant: 'success' };
        if (connectionStatus === 'rejected') return { text: 'Request Declined', disabled: true, variant: 'secondary' };
        if (requested) return { text: 'Request Sent', disabled: true, variant: 'secondary' };
        if (!isUserVerified) return { text: 'Unverified User', disabled: true, variant: 'secondary' };
        return { text: 'Connect', disabled: false, variant: 'primary' };
    };

    const buttonState = getButtonState();
    const lifestyleTags = getLifestyleTag(profile.lifestyle);
    const isConnected = connectionStatus === 'accepted';

    return (
        <motion.div
            className="roommate-match-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <div className="match-header">
                <div className="match-percentage">
                    <div className={`percentage-circle ${matchPercentage >= 80 ? 'high' : matchPercentage >= 60 ? 'medium' : 'low'}`}>
                        <span className="percentage-value">{matchPercentage}%</span>
                    </div>
                    <span className="match-label">Match</span>
                </div>

                <div className="user-info">
                    <div className="user-avatar">
                        {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} />
                        ) : (
                            <HiOutlineUser size={32} />
                        )}
                        {(user.isVerified || user.verificationStatus?.isFullyVerified || user.aadhaarVerification?.verified) && (
                            <div className="verified-badge">
                                <HiOutlineBadgeCheck size={18} />
                            </div>
                        )}
                    </div>

                    <div className="user-details">
                        <h3>{user.name}</h3>
                        {profile.college && (
                            <p className="user-college">{profile.college}</p>
                        )}
                        {profile.studentStatus && (
                            <span className="status-badge">{profile.studentStatus}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="match-explanation">
                <p>{explanation}</p>
            </div>

            <div className="match-details">
                <div className="detail-item">
                    <HiOutlineLocationMarker />
                    <span>{profile.city}{profile.area && `, ${profile.area}`}</span>
                </div>

                <div className="detail-item">
                    <HiOutlineCurrencyRupee />
                    <span>₹{profile.budgetMin.toLocaleString()} - ₹{profile.budgetMax.toLocaleString()}/mo</span>
                </div>

                <div className="detail-item">
                    <HiOutlineCalendar />
                    <span>Move-in: {new Date(profile.expectedMoveInDate).toLocaleDateString()}</span>
                </div>
            </div>

            {lifestyleTags.length > 0 && (
                <div className="lifestyle-tags">
                    {lifestyleTags.map((tag, idx) => (
                        <span key={idx} className="lifestyle-tag">{tag}</span>
                    ))}
                </div>
            )}

            {commonInterests.length > 0 && (
                <div className="common-interests">
                    <HiOutlineHeart className="heart-icon" />
                    <span>{commonInterests.length} common interest{commonInterests.length !== 1 ? 's' : ''}</span>
                    <div className="interests-list">
                        {commonInterests.slice(0, 3).join(', ')}
                        {commonInterests.length > 3 && ` + ${commonInterests.length - 3} more`}
                    </div>
                </div>
            )}

            <div className="card-actions">
                {isConnected ? (
                    <>
                        <Button
                            variant="primary"
                            onClick={handleMessage}
                            fullWidth
                        >
                            <HiOutlineChat style={{ marginRight: '0.5rem' }} />
                            Message
                        </Button>
                    </>
                ) : (
                    <Button
                        variant={buttonState.variant}
                        onClick={handleConnect}
                        disabled={buttonState.disabled || sending}
                        fullWidth
                    >
                        {sending ? 'Sending...' : buttonState.text}
                    </Button>
                )}
            </div>
        </motion.div>
    );
};

export default RoommateMatchCard;
