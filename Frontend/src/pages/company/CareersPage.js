import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { 
  HiOutlineCode, 
  HiOutlineDesktopComputer, 
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineHeart,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineAcademicCap,
  HiOutlineGlobe,
  HiOutlineLocationMarker,
  HiOutlineBriefcase
} from 'react-icons/hi';

const CareersPage = () => {
  const openings = [
    {
      id: 1,
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Bangalore, India',
      type: 'Full-time',
      icon: HiOutlineCode,
    },
    {
      id: 2,
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      icon: HiOutlineDesktopComputer,
    },
    {
      id: 3,
      title: 'Customer Success Manager',
      department: 'Operations',
      location: 'Mumbai, India',
      type: 'Full-time',
      icon: HiOutlineUserGroup,
    },
    {
      id: 4,
      title: 'Growth Marketing Specialist',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      icon: HiOutlineChartBar,
    },
    {
      id: 5,
      title: 'Safety Operations Analyst',
      department: 'Safety',
      location: 'Delhi, India',
      type: 'Full-time',
      icon: HiOutlineHeart,
    },
  ];

  const benefits = [
    {
      icon: HiOutlineClock,
      title: 'Flexible Hours',
      description: 'Work when you\'re most productive with flexible working hours.',
    },
    {
      icon: HiOutlineGlobe,
      title: 'Remote-First',
      description: 'Work from anywhere. We believe in results, not presence.',
    },
    {
      icon: HiOutlineCurrencyDollar,
      title: 'Competitive Pay',
      description: 'Top-of-market compensation with equity options.',
    },
    {
      icon: HiOutlineAcademicCap,
      title: 'Learning Budget',
      description: '₹50,000 annual budget for courses, books, and conferences.',
    },
    {
      icon: HiOutlineHeart,
      title: 'Health Insurance',
      description: 'Comprehensive health coverage for you and your family.',
    },
    {
      icon: HiOutlineUserGroup,
      title: 'Team Retreats',
      description: 'Annual team retreats to connect and collaborate.',
    },
  ];

  const values = [
    {
      title: 'Safety First',
      description: 'Every decision we make considers the safety of our users.',
    },
    {
      title: 'Student-Centric',
      description: 'We build for students. Their success is our success.',
    },
    {
      title: 'Transparency',
      description: 'Open communication and honest feedback are our norm.',
    },
    {
      title: 'Innovation',
      description: 'We challenge conventions and embrace new ideas.',
    },
  ];

  return (
    <div className="careers-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-content"
          >
            <span className="hero-badge">We're Hiring!</span>
            <h1>Join Our Mission to Make Student Housing Safer</h1>
            <p>
              Be part of a team that's transforming how students find safe, 
              verified accommodation across India.
            </p>
            <Button variant="white" size="lg" onClick={() => document.getElementById('openings').scrollIntoView({ behavior: 'smooth' })}>
              View Open Positions
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Values</h2>
            <p>What drives us every day</p>
          </div>
          <div className="values-grid">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="value-card"
              >
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Work With Us?</h2>
            <p>Perks and benefits that matter</p>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="benefit-card"
              >
                <div className="benefit-icon">
                  <benefit.icon size={24} />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="openings" className="openings-section">
        <div className="container">
          <div className="section-header">
            <h2>Open Positions</h2>
            <p>Find your next opportunity</p>
          </div>
          <div className="openings-list">
            {openings.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="job-card"
              >
                <div className="job-icon">
                  <job.icon size={24} />
                </div>
                <div className="job-info">
                  <h3>{job.title}</h3>
                  <div className="job-meta">
                    <span><HiOutlineBriefcase size={14} /> {job.department}</span>
                    <span><HiOutlineLocationMarker size={14} /> {job.location}</span>
                    <span className="job-type">{job.type}</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm">
                  Apply Now
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Don't See a Perfect Fit?</h2>
            <p>We're always looking for talented individuals. Send us your resume!</p>
            <Link to="/contact">
              <Button variant="primary" size="lg">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .careers-page {
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
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-content p {
          font-size: 1.125rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto 2rem;
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

        .values-section {
          padding: 5rem 0;
          background: var(--bg-primary);
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .value-card {
          padding: 2rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
          text-align: center;
        }

        .value-card h3 {
          font-size: 1.125rem;
          color: var(--accent-primary);
          margin-bottom: 0.5rem;
        }

        .value-card p {
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .benefits-section {
          padding: 5rem 0;
          background: var(--bg-secondary);
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .benefit-card {
          padding: 2rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
          text-align: center;
        }

        .benefit-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient-soft);
          color: var(--accent-primary);
          border-radius: var(--radius-lg);
        }

        .benefit-card h3 {
          font-size: 1.125rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .benefit-card p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .openings-section {
          padding: 5rem 0;
          background: var(--bg-primary);
        }

        .openings-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .job-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
          transition: var(--transition-normal);
        }

        .job-card:hover {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md);
        }

        .job-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient-soft);
          color: var(--accent-primary);
          border-radius: var(--radius-lg);
          flex-shrink: 0;
        }

        .job-info {
          flex: 1;
        }

        .job-info h3 {
          font-size: 1.125rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .job-meta {
          display: flex;
          gap: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .job-meta span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .job-type {
          padding: 0.25rem 0.75rem;
          background: var(--success-bg);
          color: var(--success);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .cta-section {
          padding: 5rem 0;
          background: var(--bg-secondary);
        }

        .cta-content {
          text-align: center;
        }

        .cta-content h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .cta-content p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        @media (max-width: 1024px) {
          .values-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 1.75rem;
          }

          .values-grid,
          .benefits-grid {
            grid-template-columns: 1fr;
          }

          .job-card {
            flex-direction: column;
            text-align: center;
          }

          .job-meta {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CareersPage;
