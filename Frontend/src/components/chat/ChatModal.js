import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { chatService } from '../../services/propertyService';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import {
  HiOutlineX,
  HiOutlinePaperAirplane,
  HiOutlineLocationMarker
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const ChatModal = ({ isOpen, onClose, property, ownerId, ownerName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Move fetchMessages above useEffect to avoid ReferenceError
  const fetchMessages = React.useCallback(async () => {
    try {
      const data = await chatService.getMessages(property._id, ownerId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      if (loading) {
        toast.error('Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  }, [property, ownerId, chatService, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && property && ownerId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, property, ownerId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const message = await chatService.sendMessage(ownerId, property._id, newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="chat-modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="chat-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="chat-modal-header">
            <div className="chat-header-info">
              <div className="chat-property-thumb">
                <img
                  src={property.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=60&h=60&fit=crop'}
                  alt={property.title}
                />
              </div>
              <div className="chat-header-text">
                <h3>{ownerName || 'Property Owner'}</h3>
                <p>
                  <HiOutlineLocationMarker size={14} />
                  {property.title}
                </p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={onClose}>
              <HiOutlineX size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {loading ? (
              <div className="chat-loading">
                <Loading size="md" text="Loading messages..." />
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`chat-message ${
                    msg.sender._id === user?.id ? 'sent' : 'received'
                  }`}
                >
                  <div className="message-content">
                    <p>{msg.content}</p>
                    <span className="message-time">
                      {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="chat-input"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!newMessage.trim() || sending}
              className="chat-send-btn"
            >
              <HiOutlinePaperAirplane size={20} />
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatModal;
