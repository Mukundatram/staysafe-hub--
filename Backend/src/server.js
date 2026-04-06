require('dotenv').config();
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const propertyRoutes = require("./routes/propertyRoutes");
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const documentRoutes = require('./routes/documentRoutes');
const aadhaarRoutes = require('./routes/aadhaarRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const phoneRoutes = require('./routes/phoneRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const aiRoutes = require('./routes/aiRoutes');
const messRoutes = require('./routes/messRoutes');
const messAdminRoutes = require('./routes/messAdminRoutes');
const userRoutes = require('./routes/userRoutes');
const roommateRoutes = require('./routes/roommateRoutes');

const app = express();

// ✅ MIDDLEWARE
// Allow requests from the production frontend URL or local dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// ✅ DEBUG LOGGING
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ✅ SERVE STATIC FILES (for uploaded images)
// Prevent direct public access to sensitive document uploads. Document files under /uploads/documents
// must be served via authenticated endpoints.
app.use('/uploads/documents', (req, res, next) => {
  return res.status(403).send('Forbidden');
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ✅ ROOT ROUTE (health check)
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Backend is running 🚀",
    status: "ok"
  });
});

// ✅ CRON ROUTE (for scheduled jobs)
app.get('/cron', (req, res) => {
  console.log("Cron job triggered at:", new Date().toISOString());

  // 🔥 Add your logic here
  // Example:
  // - update database
  // - run ML model
  // - send notifications
  // - cleanup tasks

  res.status(200).json({
    success: true,
    message: "Cron executed"
  });
});

// ✅ ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/aadhaar', aadhaarRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/phone', phoneRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/admin', messAdminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/roommate', roommateRoutes);

app.use('/api/properties', propertyRoutes);

// ✅ GLOBAL ERROR HANDLER (must be after all routes)
app.use((err, req, res, next) => {
  console.error(`[GlobalError] ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ✅ PORT (KEEP 4000)
const PORT = process.env.PORT || 4000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Simple auth for socket connections using JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    console.log('[Socket] handshake: no token provided');
    return next();
  }
  console.log('[Socket] handshake: token present');
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) {
      console.log('[Socket] token present but verification failed');
      return next();
    }
    socket.user = decoded;
    console.log('[Socket] token verified; user attached to socket');
    return next();
  });
});

io.on('connection', (socket) => {
  // If authenticated, join a personal room
  if (socket.user && socket.user._id) {
    const room = `user_${socket.user._id}`;
    socket.join(room);
    console.log('[Socket] user connected and joined room', room);
  } else {
    console.log('[Socket] unauthenticated client connected');
  }

  socket.on('disconnect', () => {
    // handle disconnect if needed
  });
});

// expose io through app for routes to emit events
app.set('io', io);

// ✅ DB + SERVER
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch(err => console.error(err));

// Force restart for debugging
