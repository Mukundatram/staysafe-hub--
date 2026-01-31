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
        // Socket listeners would go here if needed, but for now relying on manual refresh or simpler polling if critical
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

    const getStatusBadge = (status) => {
        const styles = {
            Active: 'bg-green-100 text-green-800',
            Pending: 'bg-yellow-100 text-yellow-800',
            Rejected: 'bg-red-100 text-red-800',
            Cancelled: 'bg-gray-100 text-gray-800'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    const tabs = [
        { id: 'pending', label: 'Pending', icon: HiOutlineClock },
        { id: 'active', label: 'Active', icon: HiOutlineCheck },
        { id: 'rejected', label: 'Rejected', icon: HiOutlineX },
        { id: 'all', label: 'All', icon: HiOutlineFilter }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Subscription Requests</h1>
                        <p className="text-gray-600 mt-1">Manage subscription requests for your mess services</p>
                    </div>
                    <button
                        onClick={fetchSubscriptions}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setPagination(p => ({ ...p, page: 1 }));
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineCalendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No subscription requests</h3>
                        <p className="text-gray-600">
                            {activeTab === 'pending'
                                ? "No pending subscription requests at the moment."
                                : `No ${activeTab} subscriptions found.`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {subscriptions.map((subscription, index) => (
                                <motion.div
                                    key={subscription._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            {/* User Avatar */}
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                                {subscription.user?.name?.charAt(0) || 'U'}
                                            </div>

                                            {/* Subscription Info */}
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {subscription.user?.name || 'Unknown User'}
                                                    </h3>
                                                    {getStatusBadge(subscription.status)}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <HiOutlineMail className="w-4 h-4" />
                                                        {subscription.user?.email}
                                                    </span>
                                                    {subscription.user?.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlinePhone className="w-4 h-4" />
                                                            {subscription.user?.phone}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-3 text-sm">
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                                                        {subscription.mess?.name}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-1">
                                                        <HiOutlineCurrencyRupee className="w-4 h-4" />
                                                        ₹{subscription.amount}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">
                                                        {subscription.plan?.replace('-', ' ')}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-1">
                                                        <HiOutlineCalendar className="w-4 h-4" />
                                                        {new Date(subscription.startDate).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {subscription.selectedMeals?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {subscription.selectedMeals.map(meal => (
                                                            <span key={meal} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                                                                {meal}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {subscription.specialInstructions && (
                                                    <p className="mt-3 text-sm text-gray-600 italic">
                                                        "{subscription.specialInstructions}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            {subscription.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(subscription._id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                                                    >
                                                        <HiOutlineCheck className="w-5 h-5" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ open: true, subscriptionId: subscription._id, reason: '' })}
                                                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all"
                                                    >
                                                        <HiOutlineX className="w-5 h-5" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {subscription.status === 'Active' && (
                                                <button
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                                                >
                                                    <HiOutlineChatAlt2 className="w-5 h-5" />
                                                    Chat
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setPagination(p => ({ ...p, page }))}
                                        className={`w-10 h-10 rounded-lg font-medium transition-all ${pagination.page === page
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                            }`}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Subscription</h3>
                        <p className="text-gray-600 mb-4">Please provide a reason for rejection (optional):</p>
                        <textarea
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal(m => ({ ...m, reason: e.target.value }))}
                            placeholder="Enter reason..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            rows={3}
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setRejectModal({ open: false, subscriptionId: null, reason: '' })}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                            >
                                Reject
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OwnerMessSubscriptionsPage;
