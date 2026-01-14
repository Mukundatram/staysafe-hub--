import React, { useState, useEffect, useRef } from 'react';
import { chatbotService } from '../services/chatbotService';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import PropertyCard from '../components/property/PropertyCard';
import { 
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineHome,
  HiOutlineCake,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineChatAlt2,
  HiOutlineCheckCircle,
  HiOutlineLightningBolt,
  HiOutlineEye,
  HiOutlineLocationMarker,
  HiOutlineArrowRight
} from 'react-icons/hi';
import { FaRegTrashAlt } from 'react-icons/fa';


const LandingPage = () => {
  // Quick actions for the bot
  const quickActions = [
    { label: '🏠 Find a PG', prompt: 'Help me find a PG near my college' },
    { label: '📋 How to book?', prompt: 'How do I book a property?' },
    { label: '💰 Price range?', prompt: 'What is the typical rent range?' },
    { label: '🛡️ Safety features', prompt: 'What safety features do you offer?' },
    { label: '📝 List property', prompt: 'How can I list my property?' },
    { label: '❓ Contact support', prompt: 'How can I contact support?' },
  ];

  const [showQuickActions, setShowQuickActions] = useState(true);

  // Clear chat handler (must be inside component to access setMessages)
  const handleClearChat = () => {
    setMessages([
      {
        type: 'bot',
        content: 'Chat cleared! 🗑️ How can I help you today?',
        timestamp: new Date(),
      },
    ]);
    setShowQuickActions(true);
  };
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hello! 👋 I'm SafeBot, your AI assistant for StaySafe Hub. I can help you find accommodations, understand our booking process, and answer any questions about student housing. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  // removed unused navigate

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

  const handleActionCard = async (action) => {
    let prompt = '';
    switch (action) {
      case 'rooms':
        prompt = 'Help me find a verified room or PG.';
        break;
      case 'mess':
        prompt = 'Show me mess or food services for students.';
        break;
      case 'roommate':
        prompt = 'How can I find a roommate?';
        break;
      case 'documents':
        prompt = 'How do I upload my documents for verification?';
        break;
      default:
        prompt = '';
        break;
    }
    if (prompt) {
      setShowQuickActions(false);
      const userMsg = {
        type: 'user',
        content: prompt,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      try {
        const response = await chatbotService.sendMessage(prompt);
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            content: response.message,
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            content: "Sorry, I'm having trouble connecting right now.",
            timestamp: new Date(),
          },
        ]);
      }
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setShowQuickActions(false);
    const userMsg = {
      type: 'user',
      content: chatMessage.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatMessage('');
    setIsLoading(true);
    try {
      const response = await chatbotService.sendMessage(userMsg.content);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          content: response.message,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          content: "Sorry, I'm having trouble connecting right now.",
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  };

  // Quick action handler
  const handleQuickAction = async (prompt) => {
    setShowQuickActions(false);
    const userMsg = {
      type: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const response = await chatbotService.sendMessage(prompt);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          content: response.message,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          content: "Sorry, I'm having trouble connecting right now.",
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }
  }, [messages, isLoading]);

  const features = [
    {
      icon: HiOutlineLightningBolt,
      title: 'Multi-Task',
      description: 'Automates discovery, booking, payments, and support—without friction.',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Safety-First',
      description: 'Women-focused safety features built into every step.',
    },
    {
      icon: HiOutlineEye,
      title: 'Transparent',
      description: 'Clear pricing, verified listings, honest reviews—no surprises.',
    },
  ];

  const actionCards = [
    {
      id: 'rooms',
      icon: HiOutlineHome,
      title: 'Find Verified Rooms',
      description: 'Safe, platform-verified stays near you.',
    },
    {
      id: 'mess',
      icon: HiOutlineCake,
      title: 'Explore Mess Services',
      description: 'Hygienic, rated food services.',
    },
    {
      id: 'roommate',
      icon: HiOutlineUsers,
      title: 'Find a Roommate',
      description: 'Connect with verified peers from your college or company.',
    },
    {
      id: 'documents',
      icon: HiOutlineDocumentText,
      title: 'Upload Documents',
      description: 'Securely upload ID and verification files.',
    },
  ];

  const stats = [
    { value: '99%', label: 'Uptime' },
    { value: '200+', label: 'Verified Partners' },
    { value: '95%', label: 'User Safety Satisfaction' },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-content"
          >
            {/* Trust Badge */}
            <div className="trust-badge">
              <HiOutlineCheckCircle size={18} />
              <span>Trusted by 10,000+ students & interns</span>
            </div>

            {/* Main Heading */}
            <h1 className="hero-title">
              Safe stays and healthy meals,
              <br />
              <span className="text-gradient">built for students and interns.</span>
            </h1>

            {/* Subheading */}
            <p className="hero-subtitle">
              Verified housing, hygienic food, and a safety-first ecosystem—so you 
              can move to a new city with confidence.
            </p>

            {/* CTAs */}
            <div className="hero-ctas">
              <Link to="/contact" className="btn btn-primary btn-lg">
                Schedule a Demo
              </Link>
              <Link to="/properties" className="btn btn-secondary btn-lg">
                <HiOutlineLocationMarker size={20} />
                Explore Verified Listings
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Buddy Section */}
      <section className="buddy-section section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="buddy-panel"
          >
            {/* Greeting with Clear Chat button on the right */}
            <div className="buddy-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="buddy-avatar">
                  <HiOutlineSparkles size={32} />
                </div>
                <div className="buddy-greeting">
                  <h2>Hi! I'm your StaySafeHub Buddy 👋</h2>
                  <p>How can I help you today?</p>
                </div>
              </div>
              <button
                onClick={handleClearChat}
                title="Clear chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6c63ff',
                  cursor: 'pointer',
                  fontSize: 22,
                  padding: 4,
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                  marginLeft: 12
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#393e6e')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <FaRegTrashAlt />
              </button>
            </div>

            {/* Action Cards */}
            <div className="action-cards">
              {actionCards.map((card, index) => (
                <motion.button
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="action-card"
                  onClick={() => handleActionCard(card.id)}
                >
                  <div className="action-icon">
                    <card.icon size={24} />
                  </div>
                  <div className="action-content">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                  <HiOutlineArrowRight className="action-arrow" size={20} />
                </motion.button>
              ))}
            </div>

            {/* Chat Input */}
            <div>
              <div className="assistant-chat-history" style={{marginTop: '1rem', marginBottom: '1rem', maxHeight: 220, overflowY: 'auto', background: '#232946', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column'}}>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: 10,
                    textAlign: msg.type === 'user' ? 'right' : 'left',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      background: msg.type === 'user' ? '#6c63ff' : '#393e6e',
                      color: '#fff',
                      borderRadius: '16px',
                      padding: '8px 14px',
                      maxWidth: '80%',
                      wordBreak: 'break-word',
                    }}>{msg.content}</span>
                  </div>
                ))}
                {showQuickActions && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: '#fff', marginBottom: 6, fontWeight: 500 }}>Quick questions:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {quickActions.map((qa, i) => (
                        <button key={i} onClick={() => handleQuickAction(qa.prompt)} style={{ background: '#393e6e', color: '#fff', border: 'none', borderRadius: 16, padding: '6px 14px', cursor: 'pointer', fontSize: 15 }}>{qa.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                {isLoading && (
                  <div style={{ textAlign: 'left', color: '#fff' }}>Thinking...</div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-wrapper" onSubmit={handleChatSubmit}>
                <HiOutlineChatAlt2 className="chat-icon" size={20} />
                <input
                  type="text"
                  placeholder="Ask me anything about stays, safety, or food…"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="chat-input"
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button type="submit" className="chat-submit" disabled={isLoading}>
                  <HiOutlineArrowRight size={20} />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2>Why Choose StaySafeHub?</h2>
            <p>Built with trust, safety, and transparency at its core.</p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card"
              >
                <div className="feature-icon">
                  <feature.icon size={28} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="properties-section section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2>Featured Verified Stays</h2>
            <p>Hand-picked properties with verified safety standards.</p>
          </motion.div>

          {loadingProperties ? (
            <div className="properties-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton property-skeleton" />
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="properties-grid">
              {featuredProperties.map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-properties">
              <p>No properties available at the moment.</p>
              <Link to="/properties" className="btn btn-primary">
                View All Properties
              </Link>
            </div>
          )}

          {featuredProperties.length > 0 && (
            <div className="view-all">
              <Link to="/properties" className="btn btn-outline btn-lg">
                View All Listings
                <HiOutlineArrowRight size={20} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="trust-content"
          >
            <h2>
              <span className="text-gradient">Reliable. Safe. Verified.</span>
            </h2>
            <p>
              Our platform maintains the highest standards of safety and reliability 
              for students and interns across India.
            </p>

            <div className="stats-grid">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="stat-card"
                >
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="cta-content"
          >
            <h2>Ready to find your safe stay?</h2>
            <p>
              Join thousands of students who trust StaySafeHub for their 
              accommodation and food needs.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/properties" className="btn btn-secondary btn-lg">
                Browse Listings
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <style>{`
        .landing-page {
          overflow-x: hidden;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          padding: 4rem 0;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background: var(--accent-gradient-soft);
          z-index: -1;
        }

        .hero-bg::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 80%;
          height: 150%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        .hero-content {
          max-width: 800px;
          text-align: center;
          margin: 0 auto;
        }

        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--accent-primary);
          margin-bottom: 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          line-height: 1.2;
          margin-bottom: 1.5rem;
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
        }

        .hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
        }

        /* Buddy Section */
        .buddy-section {
          background: var(--bg-secondary);
        }

        .buddy-panel {
          max-width: 800px;
          margin: 0 auto;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-lg);
        }

        @media (min-width: 768px) {
          .buddy-panel {
            padding: 3rem;
          }
        }

        .buddy-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .buddy-avatar {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          border-radius: var(--radius-lg);
          color: white;
          flex-shrink: 0;
        }

        .buddy-greeting h2 {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }

        .buddy-greeting p {
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .action-cards {
          display: grid;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 640px) {
          .action-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          text-align: left;
          transition: all var(--transition-fast);
        }

        .action-card:hover {
          border-color: var(--accent-primary);
          background: var(--accent-gradient-soft);
        }

        .action-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient-soft);
          border-radius: var(--radius-md);
          color: var(--accent-primary);
          flex-shrink: 0;
        }

        .action-card:hover .action-icon {
          background: var(--accent-gradient);
          color: white;
        }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-content h3 {
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }

        .action-content p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .action-arrow {
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        .action-card:hover .action-arrow {
          color: var(--accent-primary);
        }

        .chat-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
        }

        .chat-input-wrapper:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .chat-icon {
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        .chat-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.9375rem;
          color: var(--text-primary);
          outline: none;
        }

        .chat-input::placeholder {
          color: var(--text-tertiary);
        }

        .chat-submit {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          border-radius: var(--radius-md);
          color: white;
          flex-shrink: 0;
          transition: transform var(--transition-fast);
        }

        .chat-submit:hover {
          transform: scale(1.05);
        }

        /* Features Section */
        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-header h2 {
          margin-bottom: 0.75rem;
        }

        .section-header p {
          color: var(--text-secondary);
          font-size: 1.125rem;
        }

        .features-grid {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          text-align: center;
          padding: 2rem;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient-soft);
          border-radius: var(--radius-lg);
          color: var(--accent-primary);
          margin: 0 auto 1.25rem;
        }

        .feature-card h3 {
          font-size: 1.125rem;
          margin-bottom: 0.75rem;
        }

        .feature-card p {
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        /* Properties Section */
        .properties-section {
          background: var(--bg-secondary);
        }

        .properties-grid {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .properties-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .properties-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .properties-loading {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .property-skeleton {
          height: 320px;
        }

        .no-properties {
          text-align: center;
          padding: 3rem;
        }

        .no-properties p {
          margin-bottom: 1rem;
        }

        .view-all {
          text-align: center;
          margin-top: 3rem;
        }

        /* Trust Section */
        .trust-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .trust-content h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .trust-content > p {
          color: var(--text-secondary);
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9375rem;
          color: var(--text-secondary);
        }

        /* CTA Section */
        .cta-section {
          background: var(--accent-gradient);
          color: white;
        }

        .cta-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-content h2 {
          color: white;
          margin-bottom: 1rem;
        }

        .cta-content p {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2rem;
        }

        .cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
        }

        .cta-buttons .btn-primary {
          background: white;
          color: var(--accent-primary);
          box-shadow: none;
        }

        .cta-buttons .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .cta-buttons .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
