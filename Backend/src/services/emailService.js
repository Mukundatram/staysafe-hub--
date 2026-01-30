const nodemailer = require('nodemailer');

// Create transporter - Configure with your email service
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Email templates
const emailTemplates = {
  booking_request: (data) => ({
    subject: `New Booking Request for ${data.propertyTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">New Booking Request!</h2>
          <p style="color: #666; font-size: 16px;">
            Hello <strong>${data.ownerName}</strong>,
          </p>
          <p style="color: #666; font-size: 16px;">
            <strong>${data.studentName}</strong> has requested to book your property:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${data.propertyTitle}</h3>
            <p style="margin: 5px 0; color: #666;">📅 Check-in: ${data.checkInDate}</p>
            <p style="margin: 5px 0; color: #666;">📅 Check-out: ${data.checkOutDate}</p>
          </div>
          <p style="color: #666; font-size: 16px;">
            Please log in to your dashboard to approve or reject this request.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              View Request
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} StaySafe Hub. All rights reserved.
        </p>
      </div>
    `
  }),

  booking_approved: (data) => ({
    subject: `🎉 Your Booking is Approved - ${data.propertyTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #11998e;">🎉 Booking Approved!</h2>
          <p style="color: #666; font-size: 16px;">
            Hello <strong>${data.studentName}</strong>,
          </p>
          <p style="color: #666; font-size: 16px;">
            Great news! Your booking request has been approved.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #11998e; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${data.propertyTitle}</h3>
            <p style="margin: 5px 0; color: #666;">👤 Owner: ${data.ownerName}</p>
            <p style="margin: 5px 0; color: #666;">📅 Check-in: ${data.checkInDate}</p>
            <p style="margin: 5px 0; color: #666;">📅 Check-out: ${data.checkOutDate}</p>
          </div>
          <p style="color: #666; font-size: 16px;">
            You can now contact the owner through our chat feature to discuss move-in details.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              View Dashboard
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} StaySafe Hub. All rights reserved.
        </p>
      </div>
    `
  }),

  booking_rejected: (data) => ({
    subject: `Booking Update - ${data.propertyTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #e74c3c;">Booking Not Approved</h2>
          <p style="color: #666; font-size: 16px;">
            Hello <strong>${data.studentName}</strong>,
          </p>
          <p style="color: #666; font-size: 16px;">
            Unfortunately, your booking request was not approved for:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${data.propertyTitle}</h3>
          </div>
          <p style="color: #666; font-size: 16px;">
            Don't worry! There are many other great properties available. Browse our listings to find your perfect stay.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/properties" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Browse Properties
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} StaySafe Hub. All rights reserved.
        </p>
      </div>
    `
  }),

  booking_cancelled: (data) => ({
    subject: `Booking Cancelled - ${data.propertyTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #f5576c;">Booking Cancelled</h2>
          <p style="color: #666; font-size: 16px;">
            Hello <strong>${data.ownerName}</strong>,
          </p>
          <p style="color: #666; font-size: 16px;">
            <strong>${data.studentName}</strong> has cancelled their booking for:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${data.propertyTitle}</h3>
          </div>
          <p style="color: #666; font-size: 16px;">
            Your property is now available for other bookings.
          </p>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} StaySafe Hub. All rights reserved.
        </p>
      </div>
    `
  }),

  booking_completed: (data) => ({
    subject: `Stay Completed - ${data.propertyTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #667eea;">Stay Completed</h2>
          <p style="color: #666; font-size: 16px;">
            Hello <strong>${data.ownerName}</strong>,
          </p>
          <p style="color: #666; font-size: 16px;">
            <strong>${data.studentName}</strong> has ended their stay at:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${data.propertyTitle}</h3>
            ${data.reason ? `<p style="margin: 5px 0; color: #666;">📝 Reason: ${data.reason}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 16px;">
            Your property is now marked as available for new bookings.
          </p>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} StaySafe Hub. All rights reserved.
        </p>
      </div>
    `
  }),

  new_message: (data) => ({
    subject: `New Message from ${data.senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #667eea;">💬 New Message</h2>
          <p style="color: #666; font-size: 16px;">
            Hello <strong>${data.recipientName}</strong>,
          </p>
          <p style="color: #666; font-size: 16px;">
            You have a new message from <strong>${data.senderName}</strong> regarding:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${data.propertyTitle}</h3>
            <p style="margin: 10px 0; color: #333; font-style: italic;">"${data.messagePreview}"</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              View Message
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} StaySafe Hub. All rights reserved.
        </p>
      </div>
    `
  })

  ,

  college_verification: (data) => ({
    subject: `Verify your college email for StaySafe Hub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Verify your college email</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${data.userName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Click the button below to verify your college/university email address. We will not store your email beyond the verification record.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser: ${data.verifyUrl}</p>
        </div>
      </div>
    `
  }),

  // Mess Subscription Templates
  mess_subscription_request: (data) => ({
    subject: `New Mess Subscription Request - ${data.messName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">New Mess Subscription! 🍽️</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${data.ownerName}</strong>,</p>
          <p style="color: #666; font-size: 16px;"><strong>${data.studentName}</strong> has requested a subscription for <strong>${data.messName}</strong>.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 5px 0; color: #666;">📝 Plan: ${data.plan}</p>
          </div>
          <p style="color: #666; font-size: 16px;">Please log in to your dashboard to approve or reject this request.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mess/owner" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Manage Subscriptions
            </a>
          </div>
        </div>
      </div>
    `
  }),

  mess_subscription_approved: (data) => ({
    subject: `Mess Subscription Approved! - ${data.messName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #11998e;">Subscription Approved! 🎉</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${data.studentName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Your subscription for <strong>${data.messName}</strong> has been approved by <strong>${data.ownerName}</strong>.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #11998e; margin: 20px 0;">
            <p style="margin: 5px 0; color: #666;">📝 Plan: ${data.plan}</p>
          </div>
          <p style="color: #666; font-size: 16px;">You can now view your active subscription and chat with the owner.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              View Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  }),

  mess_subscription_rejected: (data) => ({
    subject: `Mess Subscription Update - ${data.messName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🏠 StaySafe Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #e74c3c;">Subscription Not Approved</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${data.studentName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Your subscription request for <strong>${data.messName}</strong> was not approved.</p>
          ${data.reason ? `
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="margin: 5px 0; color: #666;">📝 Reason: ${data.reason}</p>
          </div>` : ''}
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mess" 
               style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Find Other Messes
            </a>
          </div>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    // Skip if email not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured. Skipping email notification.');
      return { success: false, message: 'Email not configured' };
    }

    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(data);

    const mailOptions = {
      from: `"StaySafe Hub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail, emailTemplates };
