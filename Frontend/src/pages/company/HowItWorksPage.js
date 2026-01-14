import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { 
  HiOutlineSearch, 
  HiOutlineShieldCheck, 
  HiOutlineHome,
  HiOutlineClipboardCheck,
  HiOutlineKey,
  HiOutlineHeart
} from 'react-icons/hi';

const HowItWorksPage = () => {
  const steps = [
    {
      number: '01',
      icon: HiOutlineSearch,
      title: 'Search & Discover',
      description: 'Browse through our curated list of verified properties. Use filters to find the perfect match based on location, budget, and amenities.',
      forStudent: true
    },
    {
      number: '02',
      icon: HiOutlineShieldCheck,
      title: 'Verify & Review',
      description: 'Check safety ratings, read verified reviews from real students, and view detailed property information including photos and virtual tours.',
      forStudent: true
    },
    {
      number: '03',
      icon: HiOutlineClipboardCheck,
      title: 'Book Securely',
      description: 'Submit your booking request with required documents. Our secure platform ensures your data is protected throughout the process.',
      forStudent: true
    },
    {
      number: '04',
      icon: HiOutlineKey,
      title: 'Move In Safely',
      description: 'Once approved, receive all necessary details. Our support team is available 24/7 to help with any issues during your stay.',
      forStudent: true
    }
  ];

  const ownerSteps = [
    {
      number: '01',
      icon: HiOutlineHome,
      title: 'List Your Property',
      description: 'Create a detailed listing with photos, amenities, and pricing. Our team will guide you through the process.',
    },
    {
      number: '02',
      icon: HiOutlineShieldCheck,
      title: 'Get Verified',
      description: 'Complete our verification process. We verify ownership documents and conduct property inspections.',
    },
    {
      number: '03',
      icon: HiOutlineClipboardCheck,
      title: 'Receive Bookings',
      description: 'Get booking requests from verified students. Review profiles and approve bookings that match your preferences.',
    },
    {
      number: '04',
      icon: HiOutlineHeart,
      title: 'Earn & Grow',
      description: 'Receive timely payments and build your reputation. Get featured for excellent service and safety standards.',
    }
  ];

  return (
    <div className="how-it-works-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-content"
          >
            <span className="hero-badge">How It Works</span>
            <h1>Finding Your Safe Stay Made Simple</h1>
            <p>
              Our streamlined process ensures you find verified, safe accommodation 
              in just a few simple steps.
            </p>
          </motion.div>
        </div>
      </section>

      {/* For Students Section */}
      <section className="steps-section">
        <div className="container">
          <div className="section-header">
            <h2>For Students & Interns</h2>
            <p>Your journey to finding the perfect accommodation</p>
          </div>
          <div className="steps-timeline">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="step-card"
              >
                <div className="step-number">{step.number}</div>
                <div className="step-icon">
                  <step.icon size={28} />
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/properties">
              <Button variant="primary" size="lg">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Owners Section */}
      <section className="steps-section alt">
        <div className="container">
          <div className="section-header">
            <h2>For Property Owners</h2>
            <p>Start earning by listing your verified property</p>
          </div>
          <div className="steps-timeline">
            {ownerSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="step-card"
              >
                <div className="step-number">{step.number}</div>
                <div className="step-icon owner">
                  <step.icon size={28} />
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/register?role=owner">
              <Button variant="secondary" size="lg">
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2>Still Have Questions?</h2>
            <p>We're here to help you every step of the way</p>
          </div>
          <div className="cta-buttons">
            <Link to="/contact">
              <Button variant="primary">Contact Support</Button>
            </Link>
            <Link to="/safety">
              <Button variant="secondary">Learn About Safety</Button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .how-it-works-page {
          min-height: 100vh;
        }

        .hero-section {
          background: var(--accent-gradient);
          padding: 6rem 0;
          color: white;
          text-align: center;
        }

        .hero-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        .hero-content h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .hero-content p {
          font-size: 1.125rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto;
        }

        .steps-section {
          padding: 5rem 0;
          background: var(--bg-primary);
        }

        .steps-section.alt {
          background: var(--bg-secondary);
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-header h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .section-header p {
          color: var(--text-secondary);
        }

        .steps-timeline {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .step-card {
          display: flex;
          gap: 1rem;
          padding: 2rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
          position: relative;
        }

        .step-number {
          position: absolute;
          top: -12px;
          left: 24px;
          padding: 0.25rem 0.75rem;
          background: var(--accent-primary);
          color: white;
          font-weight: 700;
          font-size: 0.75rem;
          border-radius: var(--radius-md);
        }

        .step-icon {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient-soft);
          color: var(--accent-primary);
          border-radius: var(--radius-lg);
        }

        .step-icon.owner {
          background: var(--success-bg);
          color: var(--success);
        }

        .step-content h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .step-content p {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .section-cta {
          text-align: center;
          margin-top: 3rem;
        }

        .faq-section {
          padding: 5rem 0;
          background: var(--bg-primary);
          text-align: center;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 1.75rem;
          }

          .steps-timeline {
            grid-template-columns: 1fr;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default HowItWorksPage;
