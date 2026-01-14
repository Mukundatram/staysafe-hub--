import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HiOutlineShieldCheck,
  HiOutlineHeart,
  HiOutlineMail,
  HiOutlinePhone
} from 'react-icons/hi';
import { FaTwitter, FaInstagram, FaLinkedinIn, FaFacebookF } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
    ],
    services: [
      { name: 'Verified Stays', href: '/properties' },
      { name: 'Mess Services', href: '/properties?type=mess' },
      { name: 'Roommate Finder', href: '/community' },
      { name: 'For Property Owners', href: '/register?role=owner' },
    ],
    safety: [
      { name: 'Safety Features', href: '/safety' },
      { name: 'Verification Process', href: '/safety#verification' },
      { name: 'Emergency Support', href: '/safety#emergency' },
      { name: 'Women Safety', href: '/safety#women' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Refund Policy', href: '/refund' },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', icon: FaTwitter, href: 'https://twitter.com' },
    { name: 'Instagram', icon: FaInstagram, href: 'https://instagram.com' },
    { name: 'LinkedIn', icon: FaLinkedinIn, href: 'https://linkedin.com' },
    { name: 'Facebook', icon: FaFacebookF, href: 'https://facebook.com' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        {/* Main Footer */}
        <div className="footer-main">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-icon">
                <HiOutlineShieldCheck size={24} />
              </div>
              <span>StaySafeHub Buddy</span>
            </Link>
            <p className="footer-description">
              Safe stays and healthy meals, built for students and interns. 
              Your trusted partner for verified housing and food services.
            </p>
            <div className="footer-contact">
              <a href="mailto:support@staysafehub.com" className="contact-item">
                <HiOutlineMail size={18} />
                support@staysafehub.com
              </a>
              <a href="tel:+918055295930" className="contact-item">
                <HiOutlinePhone size={18} />
                +91 8055295930
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="footer-links">
            <div className="links-column">
              <h4>Company</h4>
              <ul>
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="links-column">
              <h4>Services</h4>
              <ul>
                {footerLinks.services.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="links-column">
              <h4>Safety</h4>
              <ul>
                {footerLinks.safety.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="links-column">
              <h4>Legal</h4>
              <ul>
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>
              © {currentYear} StaySafeHub Buddy. Made with{' '}
              <HiOutlineHeart className="heart-icon" /> for students everywhere.
            </p>
          </div>

          <div className="footer-social">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label={social.name}
              >
                <social.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .footer {
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-light);
          padding-top: 4rem;
        }

        .footer-main {
          display: grid;
          gap: 3rem;
          padding-bottom: 3rem;
        }

        @media (min-width: 768px) {
          .footer-main {
            grid-template-columns: 1.5fr 2fr;
            gap: 4rem;
          }
        }

        .footer-brand {
          max-width: 320px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .footer-logo .logo-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          border-radius: var(--radius-md);
          color: white;
        }

        .footer-description {
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }

        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.9375rem;
          transition: color var(--transition-fast);
        }

        .contact-item:hover {
          color: var(--accent-primary);
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .footer-links {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .links-column h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .links-column ul {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .links-column a {
          color: var(--text-secondary);
          font-size: 0.9375rem;
          transition: color var(--transition-fast);
        }

        .links-column a:hover {
          color: var(--accent-primary);
        }

        .footer-bottom {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-top: 1px solid var(--border-light);
        }

        @media (min-width: 768px) {
          .footer-bottom {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .footer-copyright p {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-tertiary);
          font-size: 0.875rem;
        }

        .heart-icon {
          color: var(--error);
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .footer-social {
          display: flex;
          gap: 0.75rem;
        }

        .social-link {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .social-link:hover {
          background: var(--accent-primary);
          color: white;
          transform: translateY(-2px);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
