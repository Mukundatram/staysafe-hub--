import api from './api';

// Generate a unique session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('chatbot-session-id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('chatbot-session-id', sessionId);
  }
  return sessionId;
};

export const chatbotService = {
  // Send a message to the chatbot
  sendMessage: async (message) => {
    const response = await api.post('/chatbot/message', {
      message,
      sessionId: getSessionId()
    });
    return response.data;
  },

  // Get quick action suggestions
  getQuickActions: async () => {
    const response = await api.get('/chatbot/quick-actions');
    return response.data;
  },

  // Clear conversation history
  clearConversation: async () => {
    const sessionId = getSessionId();
    const response = await api.delete(`/chatbot/clear/${sessionId}`);
    // Generate new session ID
    sessionStorage.removeItem('chatbot-session-id');
    return response.data;
  },

  // Get new session ID
  resetSession: () => {
    sessionStorage.removeItem('chatbot-session-id');
    return getSessionId();
  }
};
