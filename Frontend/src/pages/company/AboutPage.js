import React from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineShieldCheck, 
  HiOutlineUserGroup, 
  HiOutlineHeart, 
  HiOutlineLightBulb,
  HiOutlineGlobe,
  HiOutlineBadgeCheck
} from 'react-icons/hi';

const AboutPage = () => {
  const values = [
    {
      icon: HiOutlineShieldCheck,
      title: 'Safety First',
      description: 'Every property and service on our platform undergoes rigorous verification to ensure your safety.'
    },
    {
      icon: HiOutlineUserGroup,
      title: 'Community Driven',
      description: 'We believe in building a supportive community where students help each other thrive.'
    },
    {
      icon: HiOutlineHeart,
      title: 'Student Focused',
      description: 'Everything we do is designed with students and interns in mind - from pricing to features.'
    },
    {
      icon: HiOutlineLightBulb,
      title: 'Innovation',
      description: 'We continuously improve our platform with cutting-edge technology and user feedback.'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Students' },
    { value: '500+', label: 'Verified Properties' },
    { value: '50+', label: 'Cities Covered' },
    { value: '99%', label: 'Safety Rating' }
  ];

  const team = [
    { name: 'Priya Sharma', role: 'CEO & Co-Founder', image: null },
    { name: 'Rahul Verma', role: 'CTO & Co-Founder', image: null },
    { name: 'Anita Desai', role: 'Head of Safety', image: null },
    { name: 'Vikram Singh', role: 'Head of Operations', image: null }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-content"
          >
            <span className="hero-badge">About Us</span>
            <h1>Making Student Housing Safe & Accessible</h1>
            <p>
              StaySafeHub Buddy was founded with a simple mission: to provide students and 
              interns with safe, verified, and affordable housing options across India.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="container">
          <div className="story-grid">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="story-content"
            >
              <h2>Our Story</h2>
              <p>
                StaySafeHub Buddy was born from a personal experience. Our founders, as students 
                themselves, faced the challenges of finding safe and reliable accommodation in 
                new cities. The lack of verified options, hidden costs, and safety concerns 
                were all too common.
              </p>
              <p>
                In 2024, we launched StaySafeHub Buddy to change this narrative. We built a 
                platform that prioritizes safety, transparency, and community. Every property 
                on our platform is personally verified, and every service provider is thoroughly 
                vetted.
              </p>
              <p>
                Today, we're proud to serve thousands of students across India, helping them 
                find their home away from home. But we're just getting started.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="story-image"
            >
              <div className="image-placeholder">
                <HiOutlineGlobe size={64} />
              </div>
            </motion.div>
          </div>
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
                className="stat-card"
              >
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Values</h2>
            <p>The principles that guide everything we do</p>
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
                <div className="value-icon">
                  <value.icon size={28} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <div className="section-header">
            <h2>Meet Our Team</h2>
            <p>The people behind StaySafeHub Buddy</p>
          </div>
          <div className="team-grid">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="team-card"
              >
                <div className="team-avatar">
                  <HiOutlineBadgeCheck size={32} />
                </div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .about-page {
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
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-content p {
          font-size: 1.125rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto;
        }

        .story-section {
          padding: 5rem 0;
          background: var(--bg-primary);
        }

        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .story-content h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .story-content p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .story-image .image-placeholder {
          aspect-ratio: 4/3;
          background: var(--accent-gradient);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stats-section {
          padding: 4rem 0;
          background: var(--bg-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        .stat-card {
          text-align: center;
          padding: 2rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
        }

        .stat-value {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent-primary);
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: var(--text-secondary);
        }

        .values-section {
          padding: 5rem 0;
          background: var(--bg-primary);
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

        .values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        .value-card {
          text-align: center;
          padding: 2rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
        }

        .value-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient-soft);
          color: var(--accent-primary);
          border-radius: var(--radius-lg);
          margin: 0 auto 1rem;
        }

        .value-card h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .value-card p {
          font-size: 0.9375rem;
          color: var(--text-secondary);
        }

        .team-section {
          padding: 5rem 0;
          background: var(--bg-secondary);
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        .team-card {
          text-align: center;
          padding: 2rem;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
        }

        .team-avatar {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          color: white;
          border-radius: var(--radius-full);
          margin: 0 auto 1rem;
        }

        .team-card h3 {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .team-card p {
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        @media (max-width: 1024px) {
          .values-grid,
          .stats-grid,
          .team-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 1.75rem;
          }

          .story-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .values-grid,
          .stats-grid,
          .team-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
