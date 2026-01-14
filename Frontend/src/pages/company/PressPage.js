import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { 
  HiOutlineNewspaper, 
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlineExternalLink
} from 'react-icons/hi';

const PressPage = () => {
  const pressReleases = [
    {
      date: 'February 15, 2024',
      title: 'StaySafeHub Raises $5M Series A to Expand Verified Student Housing Network',
      excerpt: 'Funding will accelerate expansion to 50 new cities and enhance safety verification processes.',
      link: '#'
    },
    {
      date: 'January 8, 2024',
      title: 'StaySafeHub Partners with Top Universities for Campus Housing Integration',
      excerpt: 'Partnership enables seamless off-campus housing discovery for over 100,000 students.',
      link: '#'
    },
    {
      date: 'December 1, 2023',
      title: 'StaySafeHub Launches 24/7 Emergency Support Feature',
      excerpt: 'New feature provides instant access to emergency services and support for all users.',
      link: '#'
    },
    {
      date: 'October 20, 2023',
      title: 'StaySafeHub Reaches 50,000 Verified Properties Milestone',
      excerpt: 'Platform growth reflects increasing demand for safe, verified student accommodation.',
      link: '#'
    },
  ];

  const mediaFeatures = [
    { name: 'TechCrunch', logo: 'TC', color: '#0a0' },
    { name: 'Economic Times', logo: 'ET', color: '#1a1a1a' },
    { name: 'YourStory', logo: 'YS', color: '#e91e63' },
    { name: 'Inc42', logo: 'I42', color: '#ff5722' },
    { name: 'Business Standard', logo: 'BS', color: '#d32f2f' },
    { name: 'Mint', logo: 'M', color: '#4caf50' },
  ];

  const stats = [
    { value: '100K+', label: 'Students Housed' },
    { value: '50K+', label: 'Verified Properties' },
    { value: '30+', label: 'Cities Covered' },
    { value: '4.8★', label: 'Average Rating' },
  ];

  return (
    <div className="press-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-content"
          >
            <span className="hero-badge">Press & Media</span>
            <h1>StaySafeHub in the News</h1>
            <p>
              Get the latest updates, press releases, and media resources 
              about India's leading student housing platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="stat-item"
              >
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured In */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured In</h2>
          </div>
          <div className="media-logos">
            {mediaFeatures.map((media, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="media-logo"
                style={{ '--logo-color': media.color }}
              >
                <span className="logo-text">{media.logo}</span>
                <span className="logo-name">{media.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="releases-section">
        <div className="container">
          <div className="section-header">
            <h2>Press Releases</h2>
            <p>Latest announcements and updates</p>
          </div>
          <div className="releases-list">
            {pressReleases.map((release, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="release-card"
              >
                <span className="release-date">{release.date}</span>
                <h3>{release.title}</h3>
                <p>{release.excerpt}</p>
                <a href={release.link} className="release-link">
                  Read Full Release <HiOutlineExternalLink size={16} />
                </a>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="media-kit-section">
        <div className="container">
          <div className="media-kit-content">
            <div className="kit-info">
              <HiOutlineNewspaper size={48} />
              <h2>Media Kit</h2>
              <p>
                Download our media kit containing logos, brand guidelines, 
                high-resolution images, and company information.
              </p>
              <Button variant="primary" size="lg">
                <HiOutlineDownload size={18} />
                Download Media Kit
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-content">
            <HiOutlineMail size={40} />
            <h2>Media Inquiries</h2>
            <p>
              For press inquiries, interviews, or additional information, 
              please contact our communications team.
            </p>
            <a href="mailto:press@staysafehub.com" className="contact-email">
              press@staysafehub.com
            </a>
          </div>
        </div>
      </section>

      <style>{`
        .press-page {
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

        .stats-section {
          padding: 3rem 0;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-light);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
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

        .featured-section {
          padding: 5rem 0;
          background: var(--bg-secondary);
        }

        .media-logos {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1.5rem;
        }

        .media-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 2rem 1rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--logo-color);
        }

        .logo-name {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .releases-section {
          padding: 5rem 0;
          background: var(--bg-primary);
        }

        .releases-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .release-card {
          padding: 2rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
        }

        .release-date {
          font-size: 0.875rem;
          color: var(--accent-primary);
          font-weight: 500;
        }

        .release-card h3 {
          font-size: 1.25rem;
          color: var(--text-primary);
          margin: 0.75rem 0;
        }

        .release-card p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .release-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--accent-primary);
          font-weight: 500;
          font-size: 0.875rem;
        }

        .release-link:hover {
          text-decoration: underline;
        }

        .media-kit-section {
          padding: 5rem 0;
          background: var(--bg-secondary);
        }

        .media-kit-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .kit-info {
          text-align: center;
          padding: 3rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
        }

        .kit-info svg {
          color: var(--accent-primary);
          margin-bottom: 1rem;
        }

        .kit-info h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .kit-info p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .kit-info button {
          display: inline-flex;
          gap: 0.5rem;
        }

        .contact-section {
          padding: 5rem 0;
          background: var(--bg-primary);
        }

        .contact-content {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .contact-content svg {
          color: var(--accent-primary);
          margin-bottom: 1rem;
        }

        .contact-content h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .contact-content p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .contact-email {
          font-size: 1.25rem;
          color: var(--accent-primary);
          font-weight: 600;
        }

        .contact-email:hover {
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .media-logos {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 1.75rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .media-logos {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default PressPage;
