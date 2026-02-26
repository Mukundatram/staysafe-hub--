import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChevronUp } from 'react-icons/hi';

const BackToTop = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={scrollToTop}
                    aria-label="Back to top"
                    style={{
                        position: 'fixed',
                        bottom: '90px',
                        right: '24px',
                        zIndex: 40,
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                    }}
                >
                    <HiOutlineChevronUp size={22} />

                    <style>{`
            button[aria-label="Back to top"]:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
            }
          `}</style>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default BackToTop;
