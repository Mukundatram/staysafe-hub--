import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import roommateService from '../../services/roommateService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import {
    HiOutlineHome,
    HiOutlineLocationMarker,
    HiOutlineCalendar,
    HiOutlineUserGroup,
    HiOutlineCurrencyRupee,
    HiOutlineUser
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './RoomSharesPage.css';

const RoomSharesPage = () => {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShare, setSelectedShare] = useState(null);
    const [message, setMessage] = useState('');
    const [showMessageModal, setShowMessageModal] = useState(false);

    useEffect(() => {
        fetchRoomShares();
    }, []);

    const fetchRoomShares = async () => {
        try {
            setLoading(true);
            const data = await roommateService.getRoomShares();
            setShares(data.shares || []);
        } catch (err) {
            console.error('Failed to load room shares:', err);
            toast.error('Failed to load room shares');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestJoin = (share) => {
        setSelectedShare(share);
        setMessage('');
        setShowMessageModal(true);
    };

    const handleSendRequest = async () => {
        if (!selectedShare) return;

        try {
            await roommateService.requestJoinBooking(selectedShare._id, message);
            toast.success('Join request sent! 🎉');
            setShowMessageModal(false);
            setMessage('');
            setSelectedShare(null);
            fetchRoomShares(); // Refresh to update button states
        } catch (err) {
            console.error('Failed to send request:', err);
            toast.error(err.response?.data?.message || 'Failed to send request');
        }
    };

    if (loading) {
        return (
            <div className="room-shares-page">
                <div className="container">
                    <Loading size="lg" text="Finding available room shares..." />
                </div>
            </div>
        );
    }

    return (
        <div className="room-shares-page">
            <div className="container">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="page-header"
                >
                    <div className="header-content">
                        <h1>
                            <HiOutlineHome size={32} />
                            Find Room Share Opportunities
                        </h1>
                        <p>Join existing bookings and share costs with fellow students</p>
                    </div>
                </motion.div>

                {shares.length === 0 ? (
                    <EmptyState
                        icon={HiOutlineUserGroup}
                        title="No room shares available"
                        description="There are currently no bookings open to roommate sharing. Check back later!"
                    />
                ) : (
                    <div className="shares-grid">
                        {shares.map((share, idx) => (
                            <motion.div
                                key={share._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card padding="md" className="share-card">
                                    {/* Property Image */}
                                    <div className="share-image">
                                        <img
                                            src={share.property.images?.[0]
                                                ? `${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:4000'}${share.property.images[0]}`
                                                : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop"}
                                            alt={share.property.title}
                                        />
                                        <div className="image-overlay">
                                            <Badge variant="success">
                                                {share.availableSpots} {share.availableSpots === 1 ? 'Spot' : 'Spots'} Available
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Property Info */}
                                    <div className="share-content">
                                        <h3>{share.property.title}</h3>
                                        <p className="location">
                                            <HiOutlineLocationMarker size={16} />
                                            {share.property.location}
                                        </p>

                                        {/* Current Occupant */}
                                        <div className="occupant-info">
                                            <HiOutlineUser size={16} />
                                            <span>
                                                <strong>Current Occupant:</strong> {share.student?.name || 'Student'}
                                            </span>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="share-details">
                                            <div className="detail-item">
                                                <HiOutlineCalendar size={16} />
                                                <div>
                                                    <span className="detail-label">Move-in</span>
                                                    <span className="detail-value">
                                                        {format(new Date(share.startDate), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="detail-item">
                                                <HiOutlineCurrencyRupee size={16} />
                                                <div>
                                                    <span className="detail-label">Cost Per Person</span>
                                                    <span className="detail-value">
                                                        ₹{share.costPerPerson?.toLocaleString()}/mo
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="detail-item">
                                                <HiOutlineUserGroup size={16} />
                                                <div>
                                                    <span className="detail-label">Max Occupancy</span>
                                                    <span className="detail-value">{share.maxOccupancy} people</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Button
                                            variant={share.hasPendingRequest ? 'secondary' : 'primary'}
                                            fullWidth
                                            onClick={() => handleRequestJoin(share)}
                                            disabled={share.hasPendingRequest}
                                            leftIcon={<HiOutlineUserGroup size={18} />}
                                        >
                                            {share.hasPendingRequest ? 'Request Pending' : 'Request to Join'}
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Message Modal */}
                {showMessageModal && (
                    <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2>Send Join Request</h2>
                            <p>Introduce yourself to {selectedShare?.student?.name}</p>

                            <textarea
                                className="message-input"
                                placeholder="Hi! I'm looking for a roommate and would love to share this room with you. I'm a..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                maxLength={500}
                            />

                            <div className="modal-actions">
                                <Button variant="ghost" onClick={() => setShowMessageModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleSendRequest}>
                                    Send Request
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomSharesPage;
