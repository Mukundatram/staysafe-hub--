import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import Layout from './components/layout/Layout';
import { ChatbotWidget } from './components/chatbot';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PropertiesPage from './pages/properties/PropertiesPage';
import PropertyDetailsPage from './pages/properties/PropertyDetailsPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import OwnerDashboard from './pages/dashboard/OwnerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import BookingPage from './pages/booking/BookingPage';
import CommunityPage from './pages/CommunityPage';
import SafetyPage from './pages/SafetyPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsPage from './pages/NotificationsPage';
import WishlistPage from './pages/WishlistPage';
import VerificationPage from './pages/VerificationPage';
import AgreementsListPage from './pages/AgreementsListPage';
import AgreementPage from './pages/AgreementPage';
import MessServicesPage from './pages/mess/MessServicesPage';
import MessDetailsPage from './pages/mess/MessDetailsPage';

function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-text)',
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/:id" element={<PropertyDetailsPage />} />
          <Route path="mess" element={<MessServicesPage />} />
          <Route path="mess/:id" element={<MessDetailsPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route path="contact" element={<ContactPage />} />
          
          {/* Protected Routes */}
          <Route path="dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="owner/dashboard" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="booking/:propertyId" element={<ProtectedRoute allowedRoles={['student']}><BookingPage /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute allowedRoles={['student', 'owner', 'admin']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="wishlist" element={<ProtectedRoute allowedRoles={['student', 'owner', 'admin']}><WishlistPage /></ProtectedRoute>} />
          <Route path="verification" element={<ProtectedRoute allowedRoles={['student', 'owner']}><VerificationPage /></ProtectedRoute>} />
          <Route path="agreements" element={<ProtectedRoute allowedRoles={['student', 'owner']}><AgreementsListPage /></ProtectedRoute>} />
          <Route path="agreements/:id" element={<ProtectedRoute allowedRoles={['student', 'owner', 'admin']}><AgreementPage /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      
      {/* AI Chatbot Widget */}
      <ChatbotWidget />
    </>
  );
}

export default App;
