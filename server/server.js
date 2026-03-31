import './load_env.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { initDatabase, closePool, query } from './database.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import { authenticateApiKey, autoRequireApiKeyAccess } from './auth.js';
import { generatePayrollForMonth } from './routes/api.js';
import { initLmsSockets } from './sockets/lms.js';

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
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin', 'X-Current-Page'],
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
// Inline ANSI color helpers — no external package needed
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const blue = (s) => `\x1b[34m${s}\x1b[0m`;
const magenta = (s) => `\x1b[35m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const gray = (s) => `\x1b[90m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const bgRed = (s) => `\x1b[41m${s}\x1b[0m`;


app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // User Info
    let userInfo = 'Anonymous';
    if (req.user) {
      userInfo = req.user.email || req.user.name || req.user.id || 'Unknown User';
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

// ============================================================
// PAYROLL AUTO-GENERATION CRON
// Runs every day at midnight. Checks if today matches the
// admin-configured generation date+time. If so, generates
// payslips for the previous month.
// ============================================================
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await query("SELECT value FROM system_settings WHERE key = 'PAYROLL_SCHEDULE'");
    const schedule = result.rows[0]?.value || { dayOfMonth: 1, hour: 0, minute: 0 };

    const now = new Date();
    const configuredDay = Number(schedule.dayOfMonth || 1);
    const configuredHour = Number(schedule.hour || 0);

    if (now.getDate() === configuredDay && now.getHours() === configuredHour) {
      // Generate for the previous month
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      console.log(`📊 [Payroll Cron] Auto-generating payroll for ${prevMonth}/${prevYear}...`);
      const report = await generatePayrollForMonth(prevMonth, prevYear);

      for (const row of report) {
        await query(`
          INSERT INTO payslips (user_id, month, year, data, generated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (user_id, month, year)
          DO UPDATE SET data = $4, generated_at = NOW()
        `, [row.userId, prevMonth, prevYear, JSON.stringify(row)]);
      }
      console.log(`✅ [Payroll Cron] Generated ${report.length} payslips for ${prevMonth}/${prevYear}`);
    }
  } catch (err) {
    console.error('❌ [Payroll Cron] Error:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

// ============================================================
// AUTO CHECK-OUT CRON
// Runs every hour. If a staff member has not checked out and
// it is more than 6 hours past their shift_end time, the
// system automatically checks them out AT their shift end
// time and marks the attendance as 'Half Day'.
// The payroll engine already deducts 0.5 day for missing
// or early check-outs, so no additional payroll logic needed.
// ============================================================
cron.schedule('0 * * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nowIndia = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    // Fetch all today's logs where check_out is still NULL
    const logsRes = await query(`
      SELECT al.id, al.user_id, al.date, al.check_in, u.shift_end
      FROM attendance_logs al
      JOIN users u ON u.id = al.user_id
      WHERE al.date = $1 AND al.check_out IS NULL AND u.shift_end IS NOT NULL
    `, [today]);

    let autoCount = 0;
    for (const log of logsRes.rows) {
      const [endH, endM] = log.shift_end.split(':').map(Number);

      // Build shift_end as a Date in IST for today
      const shiftEndTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      shiftEndTime.setHours(endH, endM, 0, 0);

      // How many hours since shift ended?
      const hoursSinceEnd = (nowIndia - shiftEndTime) / (1000 * 60 * 60);

      if (hoursSinceEnd >= 6) {
        // Auto check-out at the shift_end time (not NOW)
        const checkoutTimestamp = `${today} ${log.shift_end}:00`;
        await query(`
          UPDATE attendance_logs
          SET check_out = $1::timestamp AT TIME ZONE 'Asia/Kolkata',
              status    = 'Half Day'
          WHERE id = $2
        `, [checkoutTimestamp, log.id]);
        autoCount++;
        console.log(`🕐 [Auto Check-out] User ${log.user_id} auto checked-out at ${log.shift_end} (Half Day)`);
      }
    }

    if (autoCount > 0) {
      console.log(`✅ [Auto Check-out] Auto checked-out ${autoCount} staff member(s).`);
    }
  } catch (err) {
    console.error('❌ [Auto Check-out Cron] Error:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authenticateApiKey, autoRequireApiKeyAccess, apiRoutes);

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

// Initialize Sockets
initLmsSockets(server, allowedOrigins);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Force exit after 5s if connections don't close gracefully
  const forceExitTimeout = setTimeout(() => {
    console.log('⚠️ Forced shutdown after 5s timeout');
    process.exit(1);
  }, 5000);
  forceExitTimeout.unref();

  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    clearTimeout(forceExitTimeout);
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');

  // Force exit after 5s if connections don't close gracefully
  const forceExitTimeout = setTimeout(() => {
    console.log('⚠️ Forced shutdown after 5s timeout');
    process.exit(1);
  }, 5000);
  forceExitTimeout.unref();

  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    clearTimeout(forceExitTimeout);
    process.exit(0);
  });
});

