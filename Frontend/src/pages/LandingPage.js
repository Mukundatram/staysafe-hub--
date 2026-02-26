import './styles/LandingPage.css';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import PropertyCard from '../components/property/PropertyCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  HiOutlineShieldCheck,
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineLightningBolt,
  HiOutlineEye,
  HiOutlineLocationMarker,
  HiOutlineArrowRight,
  HiOutlineSearch,
  HiOutlineKey,
  HiOutlineTruck,
  HiOutlineStar,
  HiOutlineHeart
} from 'react-icons/hi';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const LandingPage = () => {
  useDocumentTitle('Home');
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const properties = await propertyService.getAll();
        setFeaturedProperties(properties.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setLoadingProperties(false);
      }
    };
    fetchProperties();
  }, []);

  const features = [
    {
      icon: HiOutlineLightningBolt,
      title: 'Multi-Task',
      description: 'Automates discovery, booking, payments, and support — without friction.',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Safety-First',
      description: 'Women-focused safety features built into every step of the journey.',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      icon: HiOutlineEye,
      title: 'Transparent',
      description: 'Clear pricing, verified listings, honest reviews — no surprises.',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      icon: HiOutlineSearch,
      title: 'Search & Discover',
      description: 'Browse verified rooms and mess services filtered by location, price, and amenities.',
    },
    {
      step: 2,
      icon: HiOutlineKey,
      title: 'Book Securely',
      description: 'Reserve your stay with secure payments and verified digital agreements.',
    },
    {
      step: 3,
      icon: HiOutlineTruck,
      title: 'Move In Safely',
      description: 'Settle into your verified accommodation with 24/7 support and community.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Students', icon: HiOutlineUsers },
    { value: '200+', label: 'Verified Properties', icon: HiOutlineHome },
    { value: '99%', label: 'Safety Rating', icon: HiOutlineShieldCheck },
    { value: '4.8', label: 'Average Rating', icon: HiOutlineStar },
  ];

  const testimonials = [
    {
      name: 'Priya S.',
      role: 'Engineering Student, Bangalore',
      text: 'StaySafe made my PG search so much easier. The verified listings gave me peace of mind as a woman moving to a new city.',
    },
    {
      name: 'Rahul M.',
      role: 'Intern, Hyderabad',
      text: 'Found an affordable room with mess service within a day. The booking process was smooth and transparent.',
    },
    {
      name: 'Ananya K.',
      role: 'Medical Student, Pune',
      text: 'The safety features and verified properties made me feel confident about my choice. Highly recommend!',
    },
  ];

  return (
    <div className="landing-page">
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1" />
          <div className="hero-shape hero-shape-2" />
          <div className="hero-shape hero-shape-3" />
        </div>

        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="hero-content"
          >
            <div className="hero-badge">
              <HiOutlineCheckCircle size={16} />
              <span>Trusted by 10,000+ students & interns</span>
            </div>

            <h1 className="hero-title">
              Safe stays and healthy meals,<br />
              <span className="text-gradient">built for students.</span>
            </h1>

            <p className="hero-subtitle">
              Verified housing, hygienic food, and a safety-first ecosystem — so you
              can move to a new city with confidence.
            </p>

            <div className="hero-ctas">
              <Link to="/properties" className="btn btn-primary btn-lg hero-btn-primary">
                <HiOutlineLocationMarker size={20} />
                Explore Properties
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                How It Works
                <HiOutlineArrowRight size={18} />
              </a>
            </div>

            <div className="hero-trust-row">
              <div className="hero-trust-item">
                <HiOutlineShieldCheck size={18} />
                <span>100% Verified</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <HiOutlineHeart size={18} />
                <span>Women Safety</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <HiOutlineStar size={18} />
                <span>4.8★ Rated</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ STATS SECTION ═══════════════ */}
      <section className="stats-section" aria-label="Statistics">
        <div className="container">
          <motion.div
            className="stats-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="stat-card"
              >
                <div className="stat-icon-wrap">
                  <stat.icon size={22} />
                </div>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FEATURES SECTION ═══════════════ */}
      <section className="features-section section" aria-label="Why choose us">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="section-header"
          >
            <span className="section-tag">Why StaySafeHub?</span>
            <h2>Built with trust, safety, and transparency.</h2>
            <p>Every feature is designed with your safety and comfort in mind.</p>
          </motion.div>

          <motion.div
            className="features-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="feature-card"
              >
                <div className="feature-icon" style={{ background: feature.gradient }}>
                  <feature.icon size={26} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="how-section section" id="how-it-works" aria-label="How it works">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="section-header"
          >
            <span className="section-tag">How It Works</span>
            <h2>Get started in 3 simple steps.</h2>
            <p>From search to move-in, we've got you covered.</p>
          </motion.div>

          <motion.div
            className="how-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {howItWorks.map((item) => (
              <motion.div key={item.step} variants={fadeInUp} className="how-card">
                <div className="how-step-badge">{item.step}</div>
                <div className="how-icon">
                  <item.icon size={28} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FEATURED PROPERTIES ═══════════════ */}
      <section className="properties-section section" aria-label="Featured properties">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="section-header"
          >
            <span className="section-tag">Featured Stays</span>
            <h2>Hand-picked verified properties.</h2>
            <p>Each listing passes our 50-point safety inspection.</p>
          </motion.div>

          {loadingProperties ? (
            <div className="properties-grid">
              <SkeletonCard variant="property-card" count={3} />
            </div>
          ) : featuredProperties.length > 0 ? (
            <>
              <motion.div
                className="properties-grid"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {featuredProperties.map((property) => (
                  <motion.div key={property._id} variants={fadeInUp}>
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </motion.div>

              <div className="view-all">
                <Link to="/properties" className="btn btn-outline btn-lg">
                  View All Listings
                  <HiOutlineArrowRight size={20} />
                </Link>
              </div>
            </>
          ) : (
            <div className="no-properties">
              <p>No properties available at the moment.</p>
              <Link to="/properties" className="btn btn-primary">
                View All Properties
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="testimonials-section section" aria-label="Testimonials">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="section-header"
          >
            <span className="section-tag">What Students Say</span>
            <h2>Loved by thousands of students.</h2>
          </motion.div>

          <motion.div
            className="testimonials-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeInUp} className="testimonial-card">
                <div className="testimonial-stars">
                  {'★★★★★'}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ CTA SECTION ═══════════════ */}
      <section className="cta-section section" aria-label="Call to action">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="cta-card"
          >
            <div className="cta-content">
              <h2>Ready to find your safe stay?</h2>
              <p>
                Join thousands of students who trust StaySafeHub for their
                accommodation and food needs.
              </p>
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-primary btn-lg cta-btn-primary">
                  Get Started Free
                </Link>
                <Link to="/properties" className="btn btn-secondary btn-lg cta-btn-secondary">
                  Browse Listings
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      
    </div>
  );
};

export default LandingPage;
