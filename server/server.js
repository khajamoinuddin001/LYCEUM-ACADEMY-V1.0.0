import './load_env.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase, closePool } from './database.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5002;

// 1. Basic configuration & Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. CORS configuration (Must be at the top)
const allowedOrigins = [
  'https://lyceumacad.com',
  'https://www.lyceumacad.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any localhost for development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight
app.options('*', cors());

// 3. Security headers (Configured to play well with CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  xFrameOptions: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": [
        "'self'",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://lyceumacad.com",
        "https://www.lyceumacad.com"
      ],
    },
  }
}));

// 4. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// 5. Request logging
import { green, yellow, red, blue, magenta, cyan, gray, bold, bgRed } from 'colorette';

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // User Info
    let userInfo = 'Anonymous';
    if (req.user) {
      userInfo = req.user.name || req.user.email || req.user.id || 'Unknown User';
      userInfo += ` (${req.user.role || 'No Role'})`;
    }
    const colorUserInfo = gray(`[${userInfo}]`);

    // HTTP Method
    let colorMethod = req.method;
    switch (req.method) {
      case 'GET': colorMethod = blue(req.method); break;
      case 'POST': colorMethod = magenta(req.method); break;
      case 'PUT':
      case 'PATCH': colorMethod = cyan(req.method); break;
      case 'DELETE': colorMethod = red(req.method); break;
      default: colorMethod = gray(req.method);
    }

    // Status Code
    let colorStatus = res.statusCode.toString();
    if (res.statusCode >= 500) {
      colorStatus = bgRed(bold(res.statusCode));
    } else if (res.statusCode >= 400) {
      colorStatus = yellow(res.statusCode);
    } else if (res.statusCode >= 300) {
      colorStatus = cyan(res.statusCode);
    } else if (res.statusCode >= 200) {
      colorStatus = green(res.statusCode);
    }

    // Duration and Slow Request Warning
    let colorDuration = `${duration}ms`;
    let slowWarning = '';
    if (duration > 500) {
      colorDuration = red(bold(colorDuration));
      slowWarning = yellow(' \u26A0\uFE0F SLOW REQUEST');
    }

    console.log(`${colorUserInfo} ${colorMethod} ${req.originalUrl} ${colorStatus} ${colorDuration}${slowWarning}`);
  });
  next();
});


// Initialize database (BLOCKING – correct)
try {
  await initDatabase();
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
    env: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.status(500).json({
    error: err.message,
    stack: err.stack
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔐 Auth endpoints at http://localhost:${PORT}/api/auth`);
  console.log(`🗄️  Database: PostgreSQL`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  const secret = process.env.JWT_SECRET;
  console.log(`🔐 JWT Secret: ${secret ? 'Set (starts with ' + secret.substring(0, 3) + '...)' : 'MISSING (Using default!)'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

