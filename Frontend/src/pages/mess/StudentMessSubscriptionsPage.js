import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineCalendar,
    HiOutlineCurrencyRupee,
    HiOutlineLocationMarker,
    HiOutlineChatAlt2,
    HiOutlineXCircle,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineRefresh,
    HiOutlineChevronRight
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import messService from '../../services/messService';

const StudentMessSubscriptionsPage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const fetchSubscriptions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await messService.getMySubscriptions();
            const activeOrPending = data.filter(sub => ['Active', 'Pending'].includes(sub.status));
            setSubscriptions(activeOrPending);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            toast.error('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const handleCancelSubscription = async (subscriptionId) => {
        if (!window.confirm('Are you sure you want to cancel this subscription?')) return;

        try {
            await messService.cancelSubscription(subscriptionId);
            toast.success('Subscription cancelled successfully');
            fetchSubscriptions();
        } catch (error) {
            toast.error('Failed to cancel subscription');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            Active: 'bg-green-100 text-green-800 border-green-200',
            Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            Rejected: 'bg-red-100 text-red-800 border-red-200',
            Cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
            Expired: 'bg-gray-100 text-gray-600 border-gray-200'
        };

        const icons = {
            Active: <HiOutlineCheckCircle className="w-4 h-4" />,
            Pending: <HiOutlineClock className="w-4 h-4" />,
            Rejected: <HiOutlineXCircle className="w-4 h-4" />,
            Cancelled: <HiOutlineXCircle className="w-4 h-4" />,
            Expired: <HiOutlineClock className="w-4 h-4" />
        };

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || styles.Pending}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return sub.status === 'Active';
        if (activeTab === 'pending') return sub.status === 'Pending';
        if (activeTab === 'rejected') return sub.status === 'Rejected';
        return true;
    });

    const tabs = [
        { id: 'all', label: 'All', count: subscriptions.length },
        { id: 'active', label: 'Active', count: subscriptions.filter(s => s.status === 'Active').length },
        { id: 'pending', label: 'Pending', count: subscriptions.filter(s => s.status === 'Pending').length },
        { id: 'rejected', label: 'Rejected', count: subscriptions.filter(s => s.status === 'Rejected').length }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Mess Subscriptions</h1>
                        <p className="text-gray-600 mt-1">Manage your mess service subscriptions</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchSubscriptions}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                        >
                            <HiOutlineRefresh className="w-5 h-5" />
                            Refresh
                        </button>
                        <Link
                            to="/mess"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-all"
                        >
                            Browse Mess Services
                            <HiOutlineChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-indigo-500' : 'bg-gray-200'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Subscriptions Grid */}
                {filteredSubscriptions.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineCalendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No subscriptions found</h3>
                        <p className="text-gray-600 mb-6">
                            {activeTab === 'all'
                                ? "You haven't subscribed to any mess services yet."
                                : `No ${activeTab} subscriptions found.`}
                        </p>
                        <Link
                            to="/mess"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                        >
                            Browse Mess Services
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {filteredSubscriptions.map((subscription, index) => (
                                <motion.div
                                    key={subscription._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                {/* Mess Image */}
                                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {subscription.mess?.images?.[0] ? (
                                                        <img
                                                            src={`http://localhost:4000${subscription.mess.images[0]}`}
                                                            alt={subscription.mess.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <HiOutlineLocationMarker className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mess Info */}
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Link
                                                            to={`/mess/${subscription.mess?._id}`}
                                                            className="text-xl font-bold text-gray-900 hover:text-indigo-600"
                                                        >
                                                            {subscription.mess?.name || 'Unknown Mess'}
                                                        </Link>
                                                        {getStatusBadge(subscription.status)}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineLocationMarker className="w-4 h-4" />
                                                            {subscription.mess?.location || 'Unknown location'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineCurrencyRupee className="w-4 h-4" />
                                                            ₹{subscription.amount}/month
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                                                            {subscription.plan?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                        </span>
                                                        {subscription.selectedMeals?.map(meal => (
                                                            <span key={meal} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm">
                                                                {meal}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineCalendar className="w-4 h-4" />
                                                            {new Date(subscription.startDate).toLocaleDateString()} - {new Date(subscription.endDate).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {subscription.status === 'Rejected' && subscription.rejectionReason && (
                                                        <div className="mt-3 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                                                            <strong>Reason:</strong> {subscription.rejectionReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                {subscription.status === 'Active' && (
                                                    <>
                                                        <Link
                                                            to={`/dashboard`}
                                                            state={{ openChat: true, messId: subscription.mess?._id, messOwnerId: subscription.mess?.owner }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                                                        >
                                                            <HiOutlineChatAlt2 className="w-5 h-5" />
                                                            Chat with Owner
                                                        </Link>
                                                        <button
                                                            onClick={() => handleCancelSubscription(subscription._id)}
                                                            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all"
                                                        >
                                                            <HiOutlineXCircle className="w-5 h-5" />
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {subscription.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleCancelSubscription(subscription._id)}
                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all"
                                                    >
                                                        <HiOutlineXCircle className="w-5 h-5" />
                                                        Cancel Request
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentMessSubscriptionsPage;
