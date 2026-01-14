const express = require('express');
const router = express.Router();

// Store conversation history in memory (for demo - use Redis/DB in production)
const conversationHistory = new Map();

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are SafeBot, the friendly AI assistant for StaySafe Hub - a trusted student accommodation platform in India.

Your role is to help users with:
1. Finding suitable PG/hostel accommodations
2. Understanding the booking process
3. Safety features and verification processes
4. Answering FAQs about rent, deposits, and policies
5. Helping property owners list their properties
6. Resolving common issues and concerns

Key information about StaySafe Hub:
- We verify all properties and owners for student safety
- Students can book PGs, hostels, and rental rooms
- We offer features like virtual tours, reviews, and direct chat with owners
- Emergency SOS feature for student safety
- Document verification for trust and security

Guidelines:
- Be helpful, friendly, and concise
- Use simple language, occasionally use emojis
- If you don't know something specific, suggest contacting support
- Always prioritize student safety in your responses
- Keep responses under 150 words unless detailed explanation needed
- For specific property queries, suggest using the search feature
- For booking issues, recommend checking the dashboard or contacting support`;

// Simulated AI responses for demo (when no API key)
const getSimulatedResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.match(/^(hi|hello|hey|hii+|namaste)/)) {
    return "Hello! 👋 Welcome to StaySafe Hub! I'm SafeBot, your AI assistant. How can I help you today? You can ask me about:\n\n• Finding accommodations\n• Booking process\n• Safety features\n• Property listings\n• Any other queries!";
  }
  
  // Property search related
  if (lowerMessage.includes('find') && (lowerMessage.includes('pg') || lowerMessage.includes('room') || lowerMessage.includes('hostel'))) {
    return "I'd be happy to help you find accommodation! 🏠\n\nTo find the perfect place:\n1. Go to 'Verified Stays' in the menu\n2. Use filters for location, budget, and amenities\n3. Check reviews and safety ratings\n\nTip: You can also use our map view to find properties near your college! What's your preferred location and budget?";
  }
  
  // Budget related
  if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable') || lowerMessage.includes('price') || lowerMessage.includes('rent')) {
    return "Great question about pricing! 💰\n\nOur properties range from:\n• Budget PGs: ₹4,000 - ₹8,000/month\n• Standard Rooms: ₹8,000 - ₹15,000/month\n• Premium Stays: ₹15,000+/month\n\nUse the price filter on our search page to find options within your budget. Most include basic amenities like WiFi and meals!";
  }
  
  // Booking process
  if (lowerMessage.includes('book') || lowerMessage.includes('booking')) {
    return "Here's how to book on StaySafe Hub! 📋\n\n1. **Browse** - Find properties you like\n2. **View Details** - Check amenities, reviews, photos\n3. **Book Now** - Select dates and submit request\n4. **Confirmation** - Owner reviews and confirms\n5. **Move In** - Complete payment and enjoy!\n\nAll bookings are protected with our safety guarantee. Need help with a specific step?";
  }
  
  // Safety features
  if (lowerMessage.includes('safe') || lowerMessage.includes('security') || lowerMessage.includes('verify') || lowerMessage.includes('trust')) {
    return "Your safety is our priority! 🛡️\n\nStaySafe Hub offers:\n• ✅ Verified property owners\n• ✅ Document verification for all users\n• ✅ 24/7 Emergency SOS button\n• ✅ Genuine reviews from students\n• ✅ Secure payment options\n• ✅ Direct chat with owners\n\nAll properties undergo physical verification before listing!";
  }
  
  // Owner/listing related
  if (lowerMessage.includes('list') && (lowerMessage.includes('property') || lowerMessage.includes('owner'))) {
    return "Want to list your property? 🏡\n\n1. Register as a Property Owner\n2. Add property details & photos\n3. Submit documents for verification\n4. Once approved, your listing goes live!\n\nBenefits:\n• Reach thousands of students\n• Easy booking management\n• Secure payments\n• Dashboard analytics\n\nGo to Register → Select 'Property Owner' to get started!";
  }
  
  // Contact/support
  if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
    return "Need help? We're here for you! 📞\n\nYou can:\n• Visit our Contact page for the form\n• Email: support@staysafehub.com\n• Check FAQs in the Help section\n• Use Emergency SOS for urgent safety concerns\n\nFor booking issues, check your Dashboard first. What specific issue can I help with?";
  }
  
  // Amenities
  if (lowerMessage.includes('amenity') || lowerMessage.includes('amenities') || lowerMessage.includes('wifi') || lowerMessage.includes('food') || lowerMessage.includes('meal') || lowerMessage.includes('ac')) {
    return "Common amenities on StaySafe Hub properties: 🏠\n\n• 📶 WiFi/Internet\n• 🍽️ Meals (Veg/Non-veg options)\n• ❄️ AC/Non-AC rooms\n• 🧺 Laundry service\n• 🚿 Attached/Common bathrooms\n• 📺 Common TV area\n• 🅿️ Parking\n\nUse amenity filters while searching to find exactly what you need!";
  }
  
  // Payment
  if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('deposit')) {
    return "Payment Information 💳\n\n• **Booking**: Request is free, pay after confirmation\n• **Security Deposit**: Usually 1-2 months rent\n• **Rent**: Monthly payment to owner\n\nPayment modes vary by property - discuss with owner via chat. Always get receipts for your records!\n\nAny specific payment query?";
  }
  
  // Thank you
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're welcome! 😊 Happy to help!\n\nIf you have more questions, feel free to ask anytime. Good luck finding your perfect stay! 🏠✨";
  }
  
  // Default response
  return "Thanks for your message! 🤔\n\nI can help you with:\n• 🏠 Finding PGs/Hostels\n• 📋 Booking process\n• 🛡️ Safety features\n• 💰 Pricing & payments\n• 📝 Property listings\n• ❓ General FAQs\n\nCould you please rephrase or ask about one of these topics? Or visit our Contact page for specific support!";
};

// Groq API integration with Llama 3.1-8b-instant
const getGroqResponse = async (messages, apiKey) => {
  try {
    // Build messages array for Groq API (OpenAI-compatible format)
    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Groq API error:', data.error);
      return null;
    }
    
    // Extract text from Groq response
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    
    return null;
  } catch (error) {
    console.error('Error calling Groq:', error);
    return null;
  }
};

/* ===================== CHAT ENDPOINT ===================== */
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get or create conversation history
    if (!conversationHistory.has(sessionId)) {
      conversationHistory.set(sessionId, []);
    }
    const history = conversationHistory.get(sessionId);

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Keep only last 10 messages for context
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    let botResponse;
    const apiKey = process.env.GROQ_API_KEY;

    if (apiKey && apiKey.startsWith('gsk_')) {
      // Use Groq AI with Llama if API key is available
      botResponse = await getGroqResponse(history, apiKey);
    }

    // Fall back to simulated responses if no API key or API failed
    if (!botResponse) {
      botResponse = getSimulatedResponse(message);
    }

    // Add bot response to history
    history.push({ role: 'assistant', content: botResponse });

    res.json({
      message: botResponse,
      sessionId
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Failed to get response' });
  }
});

/* ===================== CLEAR CONVERSATION ===================== */
router.delete('/clear/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  conversationHistory.delete(sessionId);
  res.json({ message: 'Conversation cleared' });
});

/* ===================== QUICK ACTIONS ===================== */
router.get('/quick-actions', (req, res) => {
  res.json([
    { id: 1, text: '🏠 Find a PG', query: 'Help me find a PG near my college' },
    { id: 2, text: '📋 How to book?', query: 'How do I book a property?' },
    { id: 3, text: '💰 Price range?', query: 'What is the typical rent range?' },
    { id: 4, text: '🛡️ Safety features', query: 'What safety features do you offer?' },
    { id: 5, text: '📝 List property', query: 'How can I list my property?' },
    { id: 6, text: '❓ Contact support', query: 'How can I contact support?' }
  ]);
});

module.exports = router;
