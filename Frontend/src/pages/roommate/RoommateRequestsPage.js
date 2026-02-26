import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineInbox, HiOutlinePaperAirplane, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import roommateService from '../../services/roommateService';
import Loading from '../../components/ui/Loading';
import Button from '../../components/ui/Button';
import './RoommateRequestsPage.css';

const RoommateRequestsPage = () => {
    const [activeTab, setActiveTab] = useState('received');
    const [loading, setLoading] = useState(true);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const [received, sent] = await Promise.all([
                roommateService.getReceivedRequests(),
                roommateService.getSentRequests()
            ]);
            setReceivedRequests(received.requests || []);
            setSentRequests(sent.requests || []);
        } catch (error) {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            await roommateService.acceptRequest(requestId);
            toast.success('Request accepted! You can now chat.');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to accept request');
        }
    };

    const handleReject = async (requestId) => {
        try {
            await roommateService.rejectRequest(requestId);
            toast.success('Request rejected');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to reject request');
        }
    };

    const RequestCard = ({ request, type }) => {
        const user = type === 'received' ? request.sender : request.receiver;
        const profile = request.senderProfile;

        return (
            <motion.div
                className="request-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="request-header">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} />
                            ) : (
                                <div className="avatar-placeholder">{user.name[0]}</div>
                            )}
                        </div>
                        <div>
                            <h4>{user.name}</h4>
                            {profile?.college && <p className="user-college">{profile.college}</p>}
                        </div>
                    </div>

                    <div className={`status-badge status-${request.status}`}>
                        {request.status}
                    </div>
                </div>

                {request.message && (
                    <div className="request-message">
                        <p>"{request.message}"</p>
                    </div>
                )}

                <div className="request-meta">
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>

                {type === 'received' && request.status === 'pending' && (
                    <div className="request-actions">
                        <Button
                            variant="success"
                            onClick={() => handleAccept(request._id)}
                            size="small"
                        >
                            <HiOutlineCheck /> Accept
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => handleReject(request._id)}
                            size="small"
                        >
                            <HiOutlineX /> Reject
                        </Button>
                    </div>
                )}
            </motion.div>
        );
    };

    if (loading) {
        return <Loading />;
    }

    const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;

    return (
        <div className="roommate-requests-page">
            <div className="page-header">
                <h1>Connection Requests</h1>
                <p>Manage your roommate connection requests</p>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'received' ? 'active' : ''}`}
                    onClick={() => setActiveTab('received')}
                >
                    <HiOutlineInbox />
                    Received ({receivedRequests.length})
                </button>
                <button
                    className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    <HiOutlinePaperAirplane />
                    Sent ({sentRequests.length})
                </button>
            </div>

            <div className="requests-list">
                {currentRequests.length === 0 ? (
                    <div className="empty-state">
                        {activeTab === 'received' ? (
                            <>
                                <HiOutlineInbox size={64} />
                                <h3>No Received Requests</h3>
                                <p>You haven't received any connection requests yet</p>
                            </>
                        ) : (
                            <>
                                <HiOutlinePaperAirplane size={64} />
                                <h3>No Sent Requests</h3>
                                <p>You haven't sent any connection requests yet</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="requests-grid">
                        {currentRequests.map((request) => (
                            <RequestCard key={request._id} request={request} type={activeTab} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoommateRequestsPage;
