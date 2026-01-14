import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  HiOutlineShieldCheck,
  HiOutlineIdentification,
  HiOutlineHome,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineExclamationCircle,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineBell
} from 'react-icons/hi';

const safetyFeatures = [
  {
    icon: HiOutlineIdentification,
    title: 'ID Verification',
    description: 'Every user undergoes thorough identity verification with government-issued ID and selfie verification.',
    color: 'var(--accent-primary)',
  },
  {
    icon: HiOutlineHome,
    title: 'Property Verification',
    description: 'All listed properties are physically verified by our team for safety, amenities, and legal compliance.',
    color: 'var(--success)',
  },
  {
    icon: HiOutlinePhone,
    title: '24/7 Emergency Support',
    description: 'Round-the-clock helpline and SOS feature that connects you to local authorities instantly.',
    color: 'var(--error)',
  },
  {
    icon: HiOutlineLockClosed,
    title: 'Secure Payments',
    description: 'Bank-grade encryption for all transactions. No cash dealings - everything is documented and traceable.',
    color: 'var(--warning)',
  },
  {
    icon: HiOutlineUserGroup,
    title: 'Verified Community',
    description: 'Connect only with verified students and working professionals. Background checks on all users.',
    color: 'var(--info)',
  },
  {
    icon: HiOutlineDocumentText,
    title: 'Legal Contracts',
    description: 'Digital rental agreements with proper documentation. Your rights are protected legally.',
    color: 'var(--accent-secondary)',
  },
];

const verificationProcess = [
  {
    step: 1,
    title: 'Create Account',
    description: 'Sign up with your email and basic details.',
  },
  {
    step: 2,
    title: 'Submit Documents',
    description: 'Upload your government ID, college ID, or company ID.',
  },
  {
    step: 3,
    title: 'Selfie Verification',
    description: 'Take a quick selfie for face matching with your ID.',
  },
  {
    step: 4,
    title: 'Verification Review',
    description: 'Our team reviews your documents within 24 hours.',
  },
  {
    step: 5,
    title: 'Verified Badge',
    description: 'Get your verified badge and start booking safely!',
  },
];

const SafetyPage = () => {
  return (
    <div className="safety-page">
      <div className="container">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-section"
        >
          <div className="hero-content">
            <Badge variant="success">
              <HiOutlineShieldCheck size={14} />
              Safety First
            </Badge>
            <h1>Your Safety is Our Priority</h1>
            <p>
              We've built multiple layers of verification and safety features to ensure 
              every student and intern has a secure, trustworthy living experience.
            </p>
          </div>

          <div className="trust-stats">
            <div className="stat">
              <span className="stat-value">100%</span>
              <span className="stat-label">Verified Properties</span>
            </div>
            <div className="stat">
              <span className="stat-value">50,000+</span>
              <span className="stat-label">Safe Stays</span>
            </div>
            <div className="stat">
              <span className="stat-value">24/7</span>
              <span className="stat-label">Emergency Support</span>
            </div>
            <div className="stat">
              <span className="stat-value">0</span>
              <span className="stat-label">Major Incidents</span>
            </div>
          </div>
        </motion.section>

        {/* Safety Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="features-section"
        >
          <h2>How We Keep You Safe</h2>
          <div className="features-grid">
            {safetyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card padding="lg" hoverable className="feature-card">
                  <div className="feature-icon" style={{ color: feature.color }}>
                    <feature.icon size={32} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Verification Process */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="process-section"
        >
          <Card padding="xl" variant="gradient">
            <h2>Verification Process</h2>
            <p className="section-subtitle">
              Our simple 5-step verification ensures a trusted community.
            </p>

            <div className="process-timeline">
              {verificationProcess.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="process-step"
                >
                  <div className="step-number">{item.step}</div>
                  <div className="step-content">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.section>

        {/* Emergency CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="emergency-section"
        >
          <Card padding="xl" className="emergency-card">
            <div className="emergency-content">
              <div className="emergency-icon">
                <HiOutlineExclamationCircle size={48} />
              </div>
              <div className="emergency-text">
                <h3>In Case of Emergency</h3>
                <p>
                  If you're in immediate danger, use our SOS feature in the app or call our 
                  24/7 helpline. We'll connect you to local authorities within seconds.
                </p>
              </div>
            </div>
            <div className="emergency-actions">
              <Button 
                variant="danger" 
                size="lg"
                leftIcon={<HiOutlinePhone size={20} />}
              >
                Emergency Helpline: 1800-XXX-XXXX
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                leftIcon={<HiOutlineBell size={20} />}
              >
                Report an Incident
              </Button>
            </div>
          </Card>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="cta-section"
        >
          <h2>Ready for a Safe Stay?</h2>
          <p>Join thousands of students who trust StaySafe Hub for their housing needs.</p>
          <div className="cta-buttons">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
            <Link to="/properties">
              <Button variant="secondary" size="lg">
                Browse Properties
              </Button>
            </Link>
          </div>
        </motion.section>
      </div>

      <style>{`
        .safety-page {
          min-height: calc(100vh - 80px);
          padding: 2rem 0 4rem;
          background: var(--bg-secondary);
        }

        .hero-section {
          text-align: center;
          padding: 2rem 0 3rem;
        }

        .hero-content h1 {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          margin: 1rem 0;
        }

        .hero-content p {
          max-width: 600px;
          margin: 0 auto;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .trust-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 800px;
          margin: 3rem auto 0;
        }

        @media (min-width: 768px) {
          .trust-stats {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .features-section {
          margin: 4rem 0;
        }

        .features-section h2 {
          text-align: center;
          font-size: 1.75rem;
          margin-bottom: 2rem;
        }

        .features-grid {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          text-align: center;
        }

        .feature-icon {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-xl);
          margin: 0 auto 1.5rem;
        }

        .feature-card h3 {
          font-size: 1.125rem;
          margin-bottom: 0.75rem;
        }

        .feature-card p {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .process-section {
          margin: 4rem 0;
        }

        .process-section h2 {
          text-align: center;
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .section-subtitle {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
        }

        .process-timeline {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .process-step {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
        }

        .step-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-primary);
          color: white;
          border-radius: var(--radius-full);
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-content h4 {
          font-size: 1.0625rem;
          margin-bottom: 0.25rem;
        }

        .step-content p {
          font-size: 0.9375rem;
          color: var(--text-secondary);
        }

        .emergency-section {
          margin: 4rem 0;
        }

        .emergency-card {
          border: 2px solid var(--error);
          background: var(--error-bg);
        }

        .emergency-content {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .emergency-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--error);
          color: white;
          border-radius: var(--radius-full);
        }

        .emergency-text {
          flex: 1;
          min-width: 280px;
        }

        .emergency-text h3 {
          font-size: 1.5rem;
          color: var(--error);
          margin-bottom: 0.5rem;
        }

        .emergency-text p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .emergency-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .cta-section {
          text-align: center;
          padding: 4rem 0 2rem;
        }

        .cta-section h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .cta-section p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .cta-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};

export default SafetyPage;
