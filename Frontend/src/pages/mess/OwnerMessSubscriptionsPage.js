import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineCalendar,
    HiOutlineCurrencyRupee,
    HiOutlineChatAlt2,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineClock,
    HiOutlineRefresh,
    HiOutlineFilter,
    HiOutlineMail,
    HiOutlinePhone
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import messService from '../../services/messService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Loading from '../../components/ui/Loading';
import '../styles/OwnerMessSubscriptionsPage.css';

const OwnerMessSubscriptionsPage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [rejectModal, setRejectModal] = useState({ open: false, subscriptionId: null, reason: '' });

    const fetchSubscriptions = useCallback(async () => {
        try {
            setLoading(true);
            const status = activeTab === 'all' ? '' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
            const data = await messService.getOwnerSubscriptions({
                status: status === 'All' ? '' : status,
                page: pagination.page
            });
            setSubscriptions(data.subscriptions || []);
            setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            toast.error('Failed to load subscription requests');
        } finally {
            setLoading(false);
        }
    }, [activeTab, pagination.page]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const handleApprove = async (subscriptionId) => {
        try {
            await messService.approveSubscription(subscriptionId);
            toast.success('Subscription approved! Student can now chat with you.');
            fetchSubscriptions();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to approve subscription');
        }
    };

    const handleReject = async () => {
        if (!rejectModal.subscriptionId) return;

        try {
            await messService.rejectSubscription(rejectModal.subscriptionId, rejectModal.reason);
            toast.success('Subscription rejected');
            setRejectModal({ open: false, subscriptionId: null, reason: '' });
            fetchSubscriptions();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to reject subscription');
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Active': return 'success';
            case 'Pending': return 'warning';
            case 'Rejected': return 'error';
            case 'Cancelled': return 'gray';
            default: return 'gray';
        }
    };

    const tabs = [
        { id: 'pending', label: 'Pending', icon: HiOutlineClock },
        { id: 'active', label: 'Active', icon: HiOutlineCheck },
        { id: 'rejected', label: 'Rejected', icon: HiOutlineX },
        { id: 'all', label: 'All', icon: HiOutlineFilter }
    ];

    return (
        <div className="owner-mess-page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-info">
                        <h1>Subscription Requests</h1>
                        <p>Manage subscription requests for your mess services</p>
                    </div>
                    <Button
                        onClick={fetchSubscriptions}
                        disabled={loading}
                        variant="secondary"
                        leftIcon={<HiOutlineRefresh className={loading ? 'spin' : ''} size={20} />}
                    >
                        Refresh
                    </Button>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setPagination(p => ({ ...p, page: 1 }));
                            }}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="loading-state">
                        <Loading size="lg" text="Loading subscriptions..." />
                    </div>
                ) : subscriptions.length === 0 ? (
                    <EmptyState
                        icon={HiOutlineCalendar}
                        title="No subscription requests"
                        description={activeTab === 'pending'
                            ? "No pending subscription requests at the moment."
                            : `No ${activeTab} subscriptions found.`
                        }
                    />
                ) : (
                    <div className="subscriptions-list">
                        <AnimatePresence>
                            {subscriptions.map((subscription, index) => (
                                <motion.div
                                    key={subscription._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="sub-card" padding="lg">
                                        <div className="sub-info-container">
                                            {/* User Avatar */}
                                            <div className="user-avatar">
                                                {subscription.user?.name?.charAt(0) || 'U'}
                                            </div>

                                            {/* Subscription Info */}
                                            <div className="sub-details">
                                                <div className="sub-header">
                                                    <h3>{subscription.user?.name || 'Unknown User'}</h3>
                                                    <Badge variant={getStatusVariant(subscription.status)}>
                                                        {subscription.status}
                                                    </Badge>
                                                </div>

                                                <div className="sub-contact">
                                                    <span className="contact-item">
                                                        <HiOutlineMail size={16} />
                                                        {subscription.user?.email}
                                                    </span>
                                                    {subscription.user?.phone && (
                                                        <span className="contact-item">
                                                            <HiOutlinePhone size={16} />
                                                            {subscription.user?.phone}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="sub-meta">
                                                    <span className="meta-tag primary">
                                                        {subscription.mess?.name}
                                                    </span>
                                                    <span className="meta-tag">
                                                        <HiOutlineCurrencyRupee size={16} />
                                                        ₹{subscription.amount}
                                                    </span>
                                                    <span className="meta-tag">
                                                        {subscription.plan?.replace('-', ' ')}
                                                    </span>
                                                    <span className="meta-tag">
                                                        <HiOutlineCalendar size={16} />
                                                        {new Date(subscription.startDate).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {subscription.selectedMeals?.length > 0 && (
                                                    <div className="meals-list">
                                                        {subscription.selectedMeals.map(meal => (
                                                            <span key={meal} className="meal-tag">
                                                                {meal}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {subscription.specialInstructions && (
                                                    <div className="special-instructions">
                                                        "{subscription.specialInstructions}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="sub-actions">
                                            {subscription.status === 'Pending' && (
                                                <>
                                                    <Button
                                                        onClick={() => handleApprove(subscription._id)}
                                                        variant="success"
                                                        leftIcon={<HiOutlineCheck size={20} />}
                                                        fullWidth
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        onClick={() => setRejectModal({ open: true, subscriptionId: subscription._id, reason: '' })}
                                                        variant="danger"
                                                        leftIcon={<HiOutlineX size={20} />}
                                                        fullWidth
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {subscription.status === 'Active' && (
                                                <Button
                                                    variant="primary"
                                                    leftIcon={<HiOutlineChatAlt2 size={20} />}
                                                    fullWidth
                                                >
                                                    Chat
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="pagination">
                                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setPagination(p => ({ ...p, page }))}
                                        className={`page-btn ${pagination.page === page ? 'active' : ''}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal.open && (
                <div className="modal-overlay">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modal-content"
                    >
                        <h3>Reject Subscription</h3>
                        <p>Please provide a reason for rejection (optional):</p>
                        <textarea
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal(m => ({ ...m, reason: e.target.value }))}
                            placeholder="Enter reason..."
                        />
                        <div className="modal-actions">
                            <Button
                                onClick={() => setRejectModal({ open: false, subscriptionId: null, reason: '' })}
                                variant="secondary"
                                fullWidth
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReject}
                                variant="danger"
                                fullWidth
                            >
                                Reject
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OwnerMessSubscriptionsPage;
