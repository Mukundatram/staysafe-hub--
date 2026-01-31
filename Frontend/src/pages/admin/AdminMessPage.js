import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineSearch,
    HiOutlineLocationMarker,
    HiOutlineCheck,
    HiOutlineRefresh,
    HiOutlineShieldCheck,
    HiOutlineEye,
    HiOutlineClipboardList,
    HiOutlineUsers
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import messAdminService from '../../services/messAdminService';

const AdminMessPage = () => {
    const [activeTab, setActiveTab] = useState('mess');
    const [messServices, setMessServices] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [audits, setAudits] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ isActive: '', isVerified: '' });
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [hygieneModal, setHygieneModal] = useState({ open: false, messId: null, rating: 5 });

    const fetchStats = useCallback(async () => {
        try {
            const data = await messAdminService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    const fetchMessServices = useCallback(async () => {
        try {
            setLoading(true);
            const data = await messAdminService.getAll({
                search: searchTerm,
                isActive: filters.isActive,
                isVerified: filters.isVerified,
                page: pagination.page
            });
            setMessServices(data.messServices || []);
            setPagination(data.pagination || { page: 1, pages: 1 });
        } catch (error) {
            toast.error('Failed to load mess services');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filters, pagination.page]);

    const fetchSubscriptions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await messAdminService.getSubscriptions({ page: pagination.page });
            setSubscriptions(data.subscriptions || []);
            setPagination(data.pagination || { page: 1, pages: 1 });
        } catch (error) {
            toast.error('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    }, [pagination.page]);

    const fetchAudits = useCallback(async () => {
        try {
            setLoading(true);
            const data = await messAdminService.getAuditLogs({ page: pagination.page });
            setAudits(data.audits || []);
            setPagination(data.pagination || { page: 1, pages: 1 });
        } catch (error) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [pagination.page]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (activeTab === 'mess') fetchMessServices();
        else if (activeTab === 'subscriptions') fetchSubscriptions();
        else if (activeTab === 'audits') fetchAudits();
    }, [activeTab, fetchMessServices, fetchSubscriptions, fetchAudits]);

    const handleToggleActive = async (messId) => {
        try {
            await messAdminService.toggleActive(messId);
            toast.success('Status updated');
            fetchMessServices();
            fetchStats();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleVerifyHygiene = async () => {
        if (!hygieneModal.messId) return;
        try {
            await messAdminService.verifyHygiene(hygieneModal.messId, hygieneModal.rating);
            toast.success('Hygiene rating verified');
            setHygieneModal({ open: false, messId: null, rating: 5 });
            fetchMessServices();
            fetchStats();
        } catch (error) {
            toast.error('Failed to verify hygiene rating');
        }
    };

    const tabs = [
        { id: 'mess', label: 'Mess Services', icon: HiOutlineLocationMarker },
        { id: 'subscriptions', label: 'Subscriptions', icon: HiOutlineClipboardList },
        { id: 'audits', label: 'Audit Logs', icon: HiOutlineEye }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mess Services Administration</h1>
                    <p className="text-gray-600 mt-1">Manage and supervise all mess services</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <HiOutlineLocationMarker className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.mess?.total || 0}</p>
                                    <p className="text-sm text-gray-600">Total Services</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <HiOutlineCheck className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.mess?.active || 0}</p>
                                    <p className="text-sm text-gray-600">Active</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <HiOutlineShieldCheck className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.mess?.verified || 0}</p>
                                    <p className="text-sm text-gray-600">Verified</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <HiOutlineUsers className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.subscriptions?.active || 0}</p>
                                    <p className="text-sm text-gray-600">Active Subs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Search & Filters (for mess tab) */}
                {activeTab === 'mess' && (
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex-1 min-w-[200px] relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filters.isActive}
                            onChange={(e) => setFilters(f => ({ ...f, isActive: e.target.value }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                        <select
                            value={filters.isVerified}
                            onChange={(e) => setFilters(f => ({ ...f, isVerified: e.target.value }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Verification</option>
                            <option value="true">Verified</option>
                            <option value="false">Unverified</option>
                        </select>
                        <button
                            onClick={fetchMessServices}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <HiOutlineRefresh className="w-5 h-5" />
                            Search
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Mess Services Table */}
                        {activeTab === 'mess' && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribers</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {messServices.map(mess => (
                                            <tr key={mess._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{mess.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{mess.owner?.name || 'N/A'}</td>
                                                <td className="px-6 py-4 text-gray-600">{mess.location}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${mess.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {mess.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${mess.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {mess.isVerified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{mess.currentSubscribers || 0}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleToggleActive(mess._id)}
                                                        className={`px-3 py-1 rounded text-xs font-medium mr-2 ${mess.isActive
                                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        {mess.isActive ? 'Disable' : 'Enable'}
                                                    </button>
                                                    {!mess.isVerified && (
                                                        <button
                                                            onClick={() => setHygieneModal({ open: true, messId: mess._id, rating: 5 })}
                                                            className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Subscriptions Table */}
                        {activeTab === 'subscriptions' && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mess</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {subscriptions.map(sub => (
                                            <tr key={sub._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{sub.user?.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{sub.mess?.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{sub.plan}</td>
                                                <td className="px-6 py-4 text-gray-600">₹{sub.amount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                        sub.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            sub.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Audits Table */}
                        {activeTab === 'audits' && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mess</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {audits.map(audit => (
                                            <tr key={audit._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${audit.action === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {audit.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{audit.student?.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{audit.mess?.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{audit.performedBy?.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{audit.reason || '-'}</td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {new Date(audit.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

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
                    </>
                )}
            </div>

            {/* Hygiene Verification Modal */}
            {hygieneModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Verify Hygiene Rating</h3>
                        <p className="text-gray-600 mb-4">Set the hygiene rating for this mess service:</p>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.5"
                            value={hygieneModal.rating}
                            onChange={(e) => setHygieneModal(m => ({ ...m, rating: parseFloat(e.target.value) }))}
                            className="w-full"
                        />
                        <p className="text-center text-2xl font-bold text-indigo-600 mt-2">{hygieneModal.rating} / 5</p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setHygieneModal({ open: false, messId: null, rating: 5 })}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyHygiene}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Verify
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminMessPage;
