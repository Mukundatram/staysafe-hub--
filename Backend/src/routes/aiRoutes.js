const express = require('express');
const router = express.Router();

// System prompt for property description generation
const PROPERTY_DESCRIPTION_PROMPT = `You are an expert real estate copywriter specializing in student accommodation and PG listings in India.

Your task is to generate professional, SEO-optimized property descriptions that are:
1. Engaging and appealing to students
2. Highlight key amenities and features
3. Mention nearby educational institutions, transit, and conveniences
4. Use a warm, trustworthy tone
5. Include relevant emojis sparingly for visual appeal
6. Structured with clear sections

Guidelines:
- Keep descriptions between 150-250 words
- Use bullet points for amenities
- Highlight safety features
- Mention value for money
- Include a compelling opening and closing line
- Avoid excessive marketing jargon
- Be authentic and honest`;

// Generate property description using Groq API with Llama
const generateWithGroq = async (propertyData, apiKey) => {
  try {
    const { location, rent, amenities, targetTenant, propertyType, nearbyPlaces } = propertyData;
    
    const userPrompt = `Generate a professional property listing description with the following details:

**Property Type:** ${propertyType || 'PG/Rental Room'}
**Location:** ${location}
**Monthly Rent:** ₹${rent}
**Amenities:** ${amenities || 'Standard amenities'}
**Target Tenant:** ${targetTenant || 'Students'}
**Nearby Places:** ${nearbyPlaces || 'Educational institutions and markets'}

Please create:
1. A catchy opening line
2. Property highlights (3-4 key features)
3. Amenities list with emojis
4. Nearby conveniences
5. A warm closing line encouraging inquiry

Make it SEO-friendly and appealing to ${targetTenant || 'students'} looking for accommodation in ${location}.`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: PROPERTY_DESCRIPTION_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 0.95
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Groq API request failed');
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    
    throw new Error('Invalid response from Groq API');
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
};

// Simulated response for demo (when no API key)
const generateSimulatedDescription = (propertyData) => {
  const { location, rent, amenities, targetTenant, propertyType, nearbyPlaces } = propertyData;
  
  const amenityList = amenities ? amenities.split(',').map(a => a.trim()) : ['WiFi', 'AC', 'Furnished'];
  const amenityEmojis = {
    'wifi': '📶',
    'ac': '❄️',
    'tv': '📺',
    'washing machine': '🧺',
    'parking': '🅿️',
    'food': '🍽️',
    'meals': '🍽️',
    'gym': '💪',
    'security': '🔒',
    'cctv': '📹',
    'power backup': '⚡',
    'water': '💧',
    'furnished': '🛋️',
    'attached bathroom': '🚿',
    'balcony': '🌅',
    'kitchen': '🍳',
    'laundry': '🧺',
    'study room': '📚',
    'garden': '🌳'
  };
  
  const formattedAmenities = amenityList.map(amenity => {
    const lowerAmenity = amenity.toLowerCase();
    const emoji = Object.keys(amenityEmojis).find(key => lowerAmenity.includes(key));
    return `${emoji ? amenityEmojis[emoji] : '✓'} ${amenity}`;
  }).join('\n');
  
  return `🏠 **Welcome to Your New Home in ${location}!**

Looking for a comfortable and affordable ${propertyType || 'PG accommodation'} perfect for ${targetTenant || 'students'}? Your search ends here!

**✨ Why Choose This Property?**
• Prime location in ${location} with easy access to daily essentials
• Well-maintained and clean living spaces
• Affordable rent at just ₹${rent}/month
• Safe and secure environment with 24/7 support

**🎯 Amenities That Make Life Easy:**
${formattedAmenities}

**📍 Nearby Conveniences:**
${nearbyPlaces || `• Educational institutions within walking distance
• Local markets and shopping areas nearby
• Easy access to public transportation
• Restaurants and cafes around the corner`}

**💰 Rent:** ₹${rent}/month (Great value for money!)

This ${propertyType || 'property'} is ideal for ${targetTenant || 'students and working professionals'} who value comfort, convenience, and safety.

📞 **Interested? Book a visit today!** Don't miss this opportunity to secure your perfect stay. Limited availability!

---
*Listed on StaySafe Hub - Your Trusted Accommodation Partner 🛡️*`;
};

// POST /api/ai/generate-description
router.post('/generate-description', async (req, res) => {
  try {
    const { location, rent, amenities, targetTenant, propertyType, nearbyPlaces } = req.body;
    
    // Validate required fields
    if (!location || !rent) {
      return res.status(400).json({ 
        error: 'Location and rent are required fields' 
      });
    }
    
    const propertyData = {
      location,
      rent,
      amenities: amenities || '',
      targetTenant: targetTenant || 'Students',
      propertyType: propertyType || 'PG/Rental Room',
      nearbyPlaces: nearbyPlaces || ''
    };
    
    const apiKey = process.env.GROQ_API_KEY;
    
    let description;
    
    if (apiKey && apiKey.startsWith('gsk_')) {
      // Use Groq API with Llama
      try {
        description = await generateWithGroq(propertyData, apiKey);
      } catch (apiError) {
        console.log('Groq API failed, using simulated response:', apiError.message);
        description = generateSimulatedDescription(propertyData);
      }
    } else {
      // Use simulated response
      description = generateSimulatedDescription(propertyData);
    }
    
    res.json({ 
      success: true,
      description,
      generated: true
    });
    
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ 
      error: 'Failed to generate description',
      message: error.message 
    });
  }
});

// POST /api/ai/enhance-description
router.post('/enhance-description', async (req, res) => {
  try {
    const { currentDescription, location, rent } = req.body;
    
    if (!currentDescription) {
      return res.status(400).json({ 
        error: 'Current description is required' 
      });
    }
    
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey || !apiKey.startsWith('gsk_')) {
      // Return enhanced version with formatting
      const enhanced = `✨ **Enhanced Property Listing**

${currentDescription}

---
📍 Location: ${location || 'Great location'}
💰 Rent: ₹${rent || 'Contact for pricing'}/month

*Book your visit today on StaySafe Hub! 🛡️*`;
      
      return res.json({ 
        success: true,
        description: enhanced,
        enhanced: true
      });
    }
    
    // Use Groq to enhance
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: PROPERTY_DESCRIPTION_PROMPT },
              { 
                role: 'user', 
                content: `Please enhance and improve this property description while keeping the core information:

"${currentDescription}"

Location: ${location || 'Not specified'}
Rent: ₹${rent || 'Not specified'}

Make it more engaging, add relevant emojis, improve formatting, and make it SEO-friendly. Keep the same facts but make it more appealing.`
              }
            ],
            temperature: 0.7,
            max_tokens: 1024
          })
        }
      );
      
      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        return res.json({
          success: true,
          description: data.choices[0].message.content,
          enhanced: true
        });
      }
      
      throw new Error('Invalid response');
    } catch (apiError) {
      // Fallback to simple enhancement
      const enhanced = `✨ **Enhanced Property Listing**

${currentDescription}

---
📍 Location: ${location || 'Great location'}
💰 Rent: ₹${rent || 'Contact for pricing'}/month

*Book your visit today on StaySafe Hub! 🛡️*`;
      
      return res.json({ 
        success: true,
        description: enhanced,
        enhanced: true
      });
    }
    
  } catch (error) {
    console.error('Error enhancing description:', error);
    res.status(500).json({ 
      error: 'Failed to enhance description',
      message: error.message 
    });
  }
});

// System prompt for mess service description generation
const MESS_DESCRIPTION_PROMPT = `You are an expert food service copywriter specializing in mess/tiffin services for students in India.

Your task is to generate professional, engaging mess service descriptions that are:
1. Appetizing and appealing to students
2. Highlight food quality, hygiene, and variety
3. Mention cuisine specialties and meal options
4. Use a warm, trustworthy tone
5. Include relevant food emojis for visual appeal
6. Keep it concise but informative

Guidelines:
- Keep descriptions between 80-150 words
- Highlight hygiene and quality
- Mention value for money
- Be authentic and honest
- Make it student-friendly`;

// Generate mess description using Groq API
const generateMessDescriptionWithGroq = async (messData, apiKey) => {
  try {
    const { name, cuisineType, mealTypes, features, pricing, location } = messData;
    
    const userPrompt = `Generate a professional mess service description with the following details:

**Mess Name:** ${name || 'Our Mess Service'}
**Location:** ${location || 'Convenient location'}
**Cuisine Types:** ${cuisineType?.join(', ') || 'Multi-cuisine'}
**Meal Types:** ${mealTypes?.join(', ') || 'Lunch, Dinner'}
**Features:** ${features?.join(', ') || 'Home-style cooking'}
**Monthly Pricing:** Starting from ₹${pricing?.monthly?.oneMeal || '1500'}

Create a short, engaging description (80-150 words) that:
1. Opens with an appetizing hook
2. Highlights food quality and hygiene
3. Mentions key features
4. Ends with a call to action

Make it appealing to students looking for affordable, tasty, and hygienic mess services.`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: MESS_DESCRIPTION_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 512,
          top_p: 0.95
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Groq API request failed');
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    
    throw new Error('Invalid response from Groq API');
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
};

// Simulated mess description for demo
const generateSimulatedMessDescription = (messData) => {
  const { name, cuisineType, mealTypes, features, pricing, location } = messData;
  
  const cuisines = cuisineType?.join(', ') || 'Multi-cuisine';
  const meals = mealTypes?.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ') || 'Lunch & Dinner';
  
  return `🍽️ **Welcome to ${name || 'Our Mess Service'}!**

Craving delicious, home-style ${cuisines} food? We've got you covered! 

✨ Our mess offers freshly prepared ${meals} made with love and the finest ingredients. Every meal is crafted in a hygienic kitchen with a focus on taste and nutrition.

🌟 **Why Choose Us?**
• ${features?.slice(0, 3).join(' • ') || 'Pure Veg • Home Delivery • Hygienic'}
• Affordable plans starting at just ₹${pricing?.monthly?.oneMeal || '1500'}/month
• Perfect for students in ${location || 'your area'}

Don't compromise on taste or health – subscribe today and enjoy worry-free meals! 🥗

📞 *Contact us to try a free trial meal!*`;
};

// POST /api/ai/generate-mess-description
router.post('/generate-mess-description', async (req, res) => {
  try {
    const { name, cuisineType, mealTypes, features, pricing, location } = req.body;
    
    const messData = {
      name: name || '',
      cuisineType: cuisineType || [],
      mealTypes: mealTypes || [],
      features: features || [],
      pricing: pricing || {},
      location: location || ''
    };
    
    const apiKey = process.env.GROQ_API_KEY;
    
    let description;
    
    if (apiKey && apiKey.startsWith('gsk_')) {
      try {
        description = await generateMessDescriptionWithGroq(messData, apiKey);
      } catch (apiError) {
        console.log('Groq API failed, using simulated response:', apiError.message);
        description = generateSimulatedMessDescription(messData);
      }
    } else {
      description = generateSimulatedMessDescription(messData);
    }
    
    res.json({ 
      success: true,
      description,
      generated: true
    });
    
  } catch (error) {
    console.error('Error generating mess description:', error);
    res.status(500).json({ 
      error: 'Failed to generate description',
      message: error.message 
    });
  }
});

module.exports = router;
