import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineChat,
  HiOutlineX,
  HiOutlinePaperAirplane,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiOutlineMinus
} from 'react-icons/hi';
import { chatbotService } from '../../services/chatbotService';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load quick actions on mount
  useEffect(() => {
    loadQuickActions();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const loadQuickActions = async () => {
    try {
      const actions = await chatbotService.getQuickActions();
      setQuickActions(actions);
    } catch (error) {
      console.error('Failed to load quick actions:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    // Add welcome message if no messages
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'bot',
        content: "Hello! 👋 I'm SafeBot, your AI assistant for StaySafe Hub.\n\nI can help you find accommodations, understand our booking process, and answer any questions about student housing.\n\nHow can I assist you today?",
        timestamp: new Date()
      }]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowQuickActions(false);
    setIsTyping(true);

    try {
      const response = await chatbotService.sendMessage(messageText.trim());
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          content: response.message,
          timestamp: new Date()
        }]);
      }, 500 + Math.random() * 500);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        content: "Sorry, I'm having trouble connecting right now. Please try again or contact our support team.",
        timestamp: new Date(),
        isError: true
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action) => {
    handleSendMessage(action.query);
  };

  const handleClearChat = async () => {
    try {
      await chatbotService.clearConversation();
      setMessages([{
        id: 'welcome-new',
        type: 'bot',
        content: "Chat cleared! 🔄 How can I help you today?",
        timestamp: new Date()
      }]);
      setShowQuickActions(true);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="chatbot-toggle"
            onClick={handleOpen}
            aria-label="Open chat"
          >
            <HiOutlineChat size={28} />
            <span className="toggle-badge">AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="header-info">
                <div className="bot-avatar">
                  <HiOutlineSparkles size={20} />
                </div>
                <div className="bot-details">
                  <span className="bot-name">SafeBot</span>
                  <span className="bot-status">
                    <span className="status-dot"></span>
                    Online
                  </span>
                </div>
              </div>
              <div className="header-actions">
                <button 
                  className="header-btn" 
                  onClick={handleClearChat}
                  title="Clear chat"
                >
                  <HiOutlineRefresh size={18} />
                </button>
                <button 
                  className="header-btn" 
                  onClick={handleMinimize}
                  title="Minimize"
                >
                  <HiOutlineMinus size={18} />
                </button>
                <button 
                  className="header-btn close" 
                  onClick={handleClose}
                  title="Close"
                >
                  <HiOutlineX size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body - Hidden when minimized */}
            {!isMinimized && (
              <>
                <div className="chatbot-messages">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`message ${msg.type} ${msg.isError ? 'error' : ''}`}
                    >
                      {msg.type === 'bot' && (
                        <div className="message-avatar">
                          <HiOutlineSparkles size={14} />
                        </div>
                      )}
                      <div className="message-content">
                        <div className="message-text">
                          {msg.content.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                              {line}
                              {i < msg.content.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </div>
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="message bot typing"
                    >
                      <div className="message-avatar">
                        <HiOutlineSparkles size={14} />
                      </div>
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick Actions */}
                  {showQuickActions && quickActions.length > 0 && messages.length <= 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="quick-actions"
                    >
                      <span className="quick-actions-label">Quick questions:</span>
                      <div className="quick-actions-grid">
                        {quickActions.map((action) => (
                          <button
                            key={action.id}
                            className="quick-action-btn"
                            onClick={() => handleQuickAction(action)}
                          >
                            {action.text}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chatbot-input">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isTyping}
                  />
                  <button
                    className="send-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <HiOutlinePaperAirplane size={20} />
                  </button>
                </div>

                {/* Footer */}
                <div className="chatbot-footer">
                  Powered by AI • StaySafe Hub
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .chatbot-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--accent-gradient);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
          z-index: 1000;
        }

        .toggle-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #10b981;
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 8px;
        }

        .chatbot-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          max-width: calc(100vw - 32px);
          background: var(--bg-primary);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1001;
          border: 1px solid var(--border-primary);
        }

        .chatbot-window.minimized {
          height: auto !important;
        }

        .chatbot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--accent-gradient);
          color: white;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bot-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bot-details {
          display: flex;
          flex-direction: column;
        }

        .bot-name {
          font-weight: 600;
          font-size: 1rem;
        }

        .bot-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          opacity: 0.9;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .header-actions {
          display: flex;
          gap: 4px;
        }

        .header-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .header-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .header-btn.close:hover {
          background: rgba(239, 68, 68, 0.8);
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg-secondary);
        }

        .message {
          display: flex;
          gap: 8px;
          max-width: 85%;
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message.bot {
          align-self: flex-start;
        }

        .message-avatar {
          width: 28px;
          height: 28px;
          min-width: 28px;
          background: var(--accent-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .message-text {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .message.bot .message-text {
          background: var(--bg-primary);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }

        .message.user .message-text {
          background: var(--accent-gradient);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.error .message-text {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .message-time {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          padding: 0 4px;
        }

        .message.user .message-time {
          text-align: right;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: var(--bg-primary);
          border-radius: 16px;
          border-bottom-left-radius: 4px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: var(--text-tertiary);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: var(--bg-primary);
          border-radius: 12px;
        }

        .quick-actions-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .quick-actions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .quick-action-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-primary);
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-radius: 20px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-action-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .chatbot-input {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-primary);
          border-top: 1px solid var(--border-primary);
        }

        .chatbot-input input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid var(--border-primary);
          border-radius: 24px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .chatbot-input input:focus {
          border-color: var(--accent-primary);
        }

        .chatbot-input input::placeholder {
          color: var(--text-tertiary);
        }

        .send-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: var(--accent-gradient);
          color: white;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, opacity 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-btn svg {
          transform: rotate(90deg);
        }

        .chatbot-footer {
          text-align: center;
          padding: 8px;
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          background: var(--bg-primary);
        }

        @media (max-width: 480px) {
          .chatbot-window {
            bottom: 0;
            right: 0;
            width: 100%;
            max-width: 100%;
            height: 100vh !important;
            border-radius: 0;
          }

          .chatbot-window.minimized {
            height: auto !important;
            bottom: 0;
            border-radius: 16px 16px 0 0;
          }

          .chatbot-toggle {
            bottom: 16px;
            right: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default ChatbotWidget;
