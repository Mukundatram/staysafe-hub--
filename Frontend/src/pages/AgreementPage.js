import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiFileText, 
  FiCheck, 
  FiClock, 
  FiAlertCircle,
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiEdit2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import agreementService from '../services/agreementService';
import Loading from '../components/ui/Loading';
import Button from '../components/ui/Button';

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft' },
  pending_student: { color: 'bg-yellow-100 text-yellow-600', label: 'Awaiting Student Signature' },
  pending_owner: { color: 'bg-blue-100 text-blue-600', label: 'Awaiting Owner Signature' },
  active: { color: 'bg-green-100 text-green-600', label: 'Active' },
  expired: { color: 'bg-gray-100 text-gray-600', label: 'Expired' },
  terminated: { color: 'bg-red-100 text-red-600', label: 'Terminated' },
  cancelled: { color: 'bg-red-100 text-red-600', label: 'Cancelled' }
};

const AgreementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showSignConfirm, setShowSignConfirm] = useState(false);

  const fetchAgreement = useCallback(async () => {
    try {
      const response = await agreementService.getAgreement(id);
      setAgreement(response.agreement);
    } catch (error) {
      toast.error('Failed to load agreement');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAgreement();
  }, [fetchAgreement]);

  const handleSign = async () => {
    setSigning(true);
    try {
      const response = await agreementService.signAgreement(id);
      setAgreement(response.agreement);
      toast.success('Agreement signed successfully!');
      setShowSignConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isStudent = user?.id === agreement?.student?._id;
  const isOwner = user?.id === agreement?.owner?._id;
  const canSign = (isStudent && agreement?.status === 'pending_student' && !agreement?.studentSignature?.signed) ||
                  (isOwner && agreement?.status === 'pending_owner' && !agreement?.ownerSignature?.signed);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Agreement not found</p>
      </div>
    );
  }

  const status = statusConfig[agreement.status] || statusConfig.draft;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FiFileText className="text-blue-600" />
              Rental Agreement
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Agreement #{agreement.agreementNumber}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Agreement Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          {/* Property Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              {agreement.property?.images?.[0] && (
                <img
                  src={`http://localhost:4000/${agreement.property.images[0]}`}
                  alt={agreement.property.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {agreement.property?.title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <FiHome className="w-4 h-4" />
                  {agreement.property?.location?.address || 'Address not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Property Owner (Landlord)
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {agreement.owner?.name}
                  </p>
                  <p className="text-sm text-gray-500">{agreement.owner?.email}</p>
                </div>
                {agreement.ownerSignature?.signed && (
                  <span className="ml-auto text-green-500">
                    <FiCheck className="w-5 h-5" />
                  </span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Tenant (Student)
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {agreement.student?.name}
                  </p>
                  <p className="text-sm text-gray-500">{agreement.student?.email}</p>
                </div>
                {agreement.studentSignature?.signed && (
                  <span className="ml-auto text-green-500">
                    <FiCheck className="w-5 h-5" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5 text-green-600" />
              Financial Terms
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Rent</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(agreement.monthlyRent)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Security Deposit</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(agreement.securityDeposit)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Maintenance</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(agreement.maintenanceCharges || 0)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Notice Period</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {agreement.noticePeriod} days
                </p>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-blue-600" />
              Agreement Period
            </h3>
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(agreement.startDate)}
                </p>
              </div>
              <div className="text-gray-400">→</div>
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(agreement.endDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Terms and Conditions
            </h3>
            <div className="space-y-4">
              {agreement.terms?.map((term, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {index + 1}. {term.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {term.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          {agreement.rules?.length > 0 && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                House Rules
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {agreement.rules.map((rule, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Included Services */}
          {agreement.includedServices?.length > 0 && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Included Services & Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {agreement.includedServices.map((service, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Signature Status */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Signature Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SignatureCard
                title="Owner Signature"
                signed={agreement.ownerSignature?.signed}
                signedAt={agreement.ownerSignature?.signedAt}
                name={agreement.owner?.name}
              />
              <SignatureCard
                title="Student Signature"
                signed={agreement.studentSignature?.signed}
                signedAt={agreement.studentSignature?.signedAt}
                name={agreement.student?.name}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
            <div className="flex items-center gap-3">
              {canSign && (
                <Button onClick={() => setShowSignConfirm(true)}>
                  <FiEdit2 className="w-4 h-4 mr-2" />
                  Sign Agreement
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Sign Confirmation Modal */}
        {showSignConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Digital Signature
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                By clicking "Sign Agreement", you agree to all the terms and conditions 
                mentioned in this agreement. This action cannot be undone.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Legal Notice</p>
                    <p>Your digital signature is legally binding and constitutes your acceptance of this rental agreement.</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowSignConfirm(false)}
                  disabled={signing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSign}
                  disabled={signing}
                >
                  {signing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4 mr-2" />
                      Sign Agreement
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// Signature Card Component
const SignatureCard = ({ title, signed, signedAt, name }) => {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      signed 
        ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
        : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        {signed ? (
          <FiCheck className="w-5 h-5 text-green-500" />
        ) : (
          <FiClock className="w-5 h-5 text-gray-400" />
        )}
      </div>
      {signed ? (
        <>
          <p className="font-medium text-gray-900 dark:text-white italic">
            {name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Signed on {new Date(signedAt).toLocaleString('en-IN')}
          </p>
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Pending signature
        </p>
      )}
    </div>
  );
};

export default AgreementPage;
