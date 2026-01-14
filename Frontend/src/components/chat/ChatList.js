import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { chatService } from '../../services/propertyService';
import Loading from '../ui/Loading';
import Badge from '../ui/Badge';
import {
  HiOutlineChatAlt2,
  HiOutlineLocationMarker,
  HiOutlineUser
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const ChatList = ({ onSelectChat }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = React.useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      if (loading) {
        toast.error('Failed to load conversations');
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchConversations]);

  if (loading) {
    return (
      <div className="chat-list-loading">
        <Loading size="md" text="Loading conversations..." />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="chat-list-empty">
        <HiOutlineChatAlt2 size={48} />
        <h3>No conversations yet</h3>
        <p>When students message you about your properties, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="chat-list">
      {conversations.map((conversation, index) => (
        <motion.div
          key={`${conversation.property?._id}-${conversation.otherUser?._id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="chat-list-item"
          onClick={() => onSelectChat(conversation)}
        >
          <div className="chat-list-avatar">
            <div className="avatar-placeholder">
              <HiOutlineUser size={24} />
            </div>
          </div>
          <div className="chat-list-content">
            <div className="chat-list-header">
              <h4>{conversation.otherUser?.name || 'User'}</h4>
              <span className="chat-list-time">
                {conversation.lastMessageTime 
                  ? format(new Date(conversation.lastMessageTime), 'MMM d, h:mm a')
                  : ''}
              </span>
            </div>
            <div className="chat-list-property">
              <HiOutlineLocationMarker size={12} />
              <span>{conversation.property?.title || 'Property'}</span>
            </div>
            <p className="chat-list-preview">
              {conversation.lastMessage?.length > 50 
                ? conversation.lastMessage.substring(0, 50) + '...'
                : conversation.lastMessage}
            </p>
          </div>
          {conversation.unreadCount > 0 && (
            <Badge variant="primary" className="chat-unread-badge">
              {conversation.unreadCount}
            </Badge>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default ChatList;
