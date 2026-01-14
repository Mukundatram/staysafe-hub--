import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineChatAlt2,
  HiOutlineQuestionMarkCircle,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp
} from 'react-icons/hi';

const faqs = [
  {
    question: 'How does StaySafe Hub verify properties?',
    answer: 'Our team physically inspects every property before listing. We verify ownership documents, check safety features, and ensure legal compliance. Properties get a verified badge only after passing our 50-point inspection checklist.',
  },
  {
    question: 'Is my personal information safe?',
    answer: 'Absolutely. We use bank-grade encryption and never share your personal information with third parties without consent. Your ID documents are securely stored and only accessed during verification.',
  },
  {
    question: 'What if I face issues with my stay?',
    answer: 'Our 24/7 support team is always available. You can use the in-app chat, call our helpline, or use the SOS feature for emergencies. We have a zero-tolerance policy for any misconduct.',
  },
  {
    question: 'How do I cancel or modify a booking?',
    answer: 'You can cancel or modify bookings from your dashboard. Free cancellation is available up to 48 hours before check-in. After that, cancellation policies vary by property.',
  },
  {
    question: 'Are there any hidden charges?',
    answer: 'No hidden charges! The rent shown includes all standard amenities. Any additional charges (like meals or utilities) are clearly mentioned upfront in the property listing.',
  },
  {
    question: 'Can I visit a property before booking?',
    answer: 'Yes! You can request a property visit through the app. Our team will coordinate with the owner to schedule a convenient time for you to inspect the property.',
  },
];

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="contact-page">
      <div className="container">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-section"
        >
          <Badge variant="info">
            <HiOutlineChatAlt2 size={14} />
            Get In Touch
          </Badge>
          <h1>We're Here to Help</h1>
          <p>
            Have questions, concerns, or feedback? Our support team is available 
            24/7 to assist you with anything you need.
          </p>
        </motion.section>

        <div className="contact-grid">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card padding="xl">
              <h2>Send us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <Input
                    label="Your Name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Input
                  label="Subject"
                  name="subject"
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    name="message"
                    className="form-input"
                    placeholder="Tell us more about your query..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" isLoading={submitting} fullWidth>
                  Send Message
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="contact-info"
          >
            <Card padding="lg" className="info-card">
              <div className="info-icon">
                <HiOutlinePhone size={24} />
              </div>
              <h3>Phone Support</h3>
              <p className="info-value">+91 1800-XXX-XXXX</p>
              <p className="info-note">Toll-free, 24/7</p>
            </Card>

            <Card padding="lg" className="info-card">
              <div className="info-icon">
                <HiOutlineMail size={24} />
              </div>
              <h3>Email Support</h3>
              <p className="info-value">support@staysafehub.com</p>
              <p className="info-note">Response within 24 hours</p>
            </Card>

            <Card padding="lg" className="info-card">
              <div className="info-icon">
                <HiOutlineLocationMarker size={24} />
              </div>
              <h3>Office Address</h3>
              <p className="info-value">Koramangala, Bangalore</p>
              <p className="info-note">Mon-Sat, 9AM-6PM</p>
            </Card>

            <Card padding="lg" variant="gradient" className="emergency-card">
              <div className="emergency-header">
                <HiOutlineExclamationCircle size={24} />
                <h3>Emergency Helpline</h3>
              </div>
              <p className="emergency-number">1800-SOS-SAFE</p>
              <p className="emergency-note">
                For immediate assistance in case of emergencies
              </p>
              <Button variant="danger" size="sm" fullWidth>
                <HiOutlineShieldCheck size={16} />
                SOS Emergency
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="faq-section"
        >
          <h2>
            <HiOutlineQuestionMarkCircle size={28} />
            Frequently Asked Questions
          </h2>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card 
                  padding="lg" 
                  className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`}
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <div className="faq-question">
                    <span>{faq.question}</span>
                    {expandedFaq === index ? (
                      <HiOutlineChevronUp size={20} />
                    ) : (
                      <HiOutlineChevronDown size={20} />
                    )}
                  </div>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="faq-answer"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      <style>{`
        .contact-page {
          min-height: calc(100vh - 80px);
          padding: 2rem 0 4rem;
          background: var(--bg-secondary);
        }

        .hero-section {
          text-align: center;
          padding: 2rem 0 3rem;
        }

        .hero-section h1 {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          margin: 1rem 0;
        }

        .hero-section p {
          max-width: 600px;
          margin: 0 auto;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .contact-grid {
          display: grid;
          gap: 2rem;
          margin-bottom: 4rem;
        }

        @media (min-width: 1024px) {
          .contact-grid {
            grid-template-columns: 1fr 360px;
          }
        }

        .contact-form h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-card {
          text-align: center;
        }

        .info-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient-soft);
          color: var(--accent-primary);
          border-radius: var(--radius-lg);
          margin: 0 auto 1rem;
        }

        .info-card h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .info-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .info-note {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
          margin-top: 0.25rem;
        }

        .emergency-card {
          text-align: center;
        }

        .emergency-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--error);
          margin-bottom: 0.75rem;
        }

        .emergency-header h3 {
          margin: 0;
          font-size: 1rem;
        }

        .emergency-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--error);
        }

        .emergency-note {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.5rem 0 1rem;
        }

        .faq-section {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-section h2 {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          margin-bottom: 2rem;
          text-align: center;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .faq-item {
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .faq-item:hover {
          border-color: var(--accent-primary);
        }

        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .faq-question svg {
          flex-shrink: 0;
          color: var(--text-tertiary);
        }

        .faq-answer {
          padding-top: 1rem;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .faq-item.expanded {
          border-color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default ContactPage;
