import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roommateService from '../../services/roommateService';
import Loading from '../../components/ui/Loading';
import toast from 'react-hot-toast';
import './RoommateChatPage.css';

const RoommateChatPage = () => {
    const { roommateId } = useParams();
    const navigate = useNavigate();
    const [roommate, setRoommate] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchRoommateProfile = useCallback(async () => {
        try {
            const data = await roommateService.getProfile(roommateId);
            setRoommate(data.profile);
        } catch (error) {
            console.error('Error fetching roommate profile:', error);
        }
    }, [roommateId]);

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const data = await roommateService.getRoommateMessages(roommateId);
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error(error.response?.data?.message || 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [roommateId]);

    useEffect(() => {
        fetchMessages();
        fetchRoommateProfile();
    }, [fetchMessages, fetchRoommateProfile]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            setSending(true);
            const data = await roommateService.sendRoommateMessage(roommateId, newMessage);
            setMessages([...messages, data]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(error.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const currentUserId = localStorage.getItem('userId');

    if (loading) {
        return (
            <div className="roommate-chat-page">
                <div className="loading"><Loading text="Loading messages..." /></div>
            </div>
        );
    }

    return (
        <div className="roommate-chat-page">
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate('/community/roommate/matches')}>
                    ← Back
                </button>
                <div className="chat-header-info">
                    {roommate?.user?.profilePicture ? (
                        <img src={roommate.user.profilePicture} alt={roommate.user.name} className="header-avatar" />
                    ) : (
                        <div className="header-avatar-placeholder">
                            {roommate?.user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h2>{roommate?.user?.name || 'Roommate'}</h2>
                        <p className="header-subtitle">{roommate?.city} • {roommate?.college}</p>
                    </div>
                </div>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.sender._id === currentUserId;
                        return (
                            <div key={message._id} className={`message ${isOwn ? 'own' : 'other'}`}>
                                {!isOwn && message.sender.profilePicture && (
                                    <img src={message.sender.profilePicture} alt={message.sender.name} className="message-avatar" />
                                )}
                                {!isOwn && !message.sender.profilePicture && (
                                    <div className="message-avatar-placeholder">
                                        {message.sender.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="message-content">
                                    <div className="message-bubble">
                                        <p>{message.content}</p>
                                    </div>
                                    <span className="message-time">{formatTime(message.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-input-container" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="message-input"
                />
                <button type="submit" disabled={sending || !newMessage.trim()} className="send-btn">
                    {sending ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default RoommateChatPage;
