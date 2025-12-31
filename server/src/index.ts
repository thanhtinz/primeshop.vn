import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import adminUsersRoutes from './routes/admin/users.js';
import webhookRoutes from './routes/webhooks.js';
import dbRoutes from './routes/db.js';
import rpcRoutes from './routes/rpc.js';
import emailRoutes from './routes/email.js';
import naperisRoutes from './routes/naperis.js';
import setupRoutes from './routes/setup.js';
import discordRoutes from './routes/discord.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
  emailLimiter,
  createAccountLimiter,
  passwordResetLimiter,
} from './middleware/rateLimiter.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression middleware - compress all responses
app.use(compression({
  // Compress responses only if they are above 1KB
  threshold: 1024,
  // Compression level (0-9, higher = better compression but slower)
  level: 6,
  // Filter function to decide what to compress
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files (for local uploads) with caching headers
app.use('/uploads', express.static('uploads', {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true,
}));

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API Routes with specific rate limiters
app.use('/api/setup', apiLimiter, setupRoutes); // Setup routes - no auth required
app.use('/api/auth', authLimiter, authRoutes); // Strict rate limit for auth
app.use('/api/oauth', authLimiter, oauthRoutes); // Strict rate limit for OAuth
app.use('/api/users', apiLimiter, authMiddleware, userRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes); // Strict for payments
app.use('/api/upload', uploadLimiter, authMiddleware, uploadRoutes); // Limit uploads
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/admin/users', apiLimiter, adminUsersRoutes); // Admin user management
app.use('/api/webhooks', webhookRoutes); // No rate limit for webhooks
app.use('/api/db', apiLimiter, dbRoutes);
app.use('/api/rpc', apiLimiter, rpcRoutes);
app.use('/api/email', emailLimiter, emailRoutes); // Limit email sending
app.use('/api/naperis', apiLimiter, naperisRoutes);
app.use('/api/discord', apiLimiter, discordRoutes); // Discord integration

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join user's personal room
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join chat room
  socket.on('join:chat', (roomId: string) => {
    socket.join(`chat:${roomId}`);
  });

  // Typing indicator
  socket.on('typing:start', (data: { roomId: string; userId: string }) => {
    socket.to(`chat:${data.roomId}`).emit('user:typing', data);
  });

  socket.on('typing:stop', (data: { roomId: string; userId: string }) => {
    socket.to(`chat:${data.roomId}`).emit('user:stop-typing', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };
