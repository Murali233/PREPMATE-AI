require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require('morgan');
const connectDB = require("./config/db");

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for logging
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'), 
    { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'), 
    { flags: 'a' }
);

// Debug log for environment variables
console.log('Environment Variables:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET ? '***SECRET SET***' : 'MISSING',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '***API KEY SET***' : 'MISSING',
    GEMINI_API_KEY_LENGTH: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    GEMINI_API_KEY_START: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + '...' : 'N/A'
});

// Override console methods for logging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function() {
    const message = Array.from(arguments).join(' ');
    originalConsoleLog(message);
    accessLogStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

console.error = function() {
    const message = 'ERROR: ' + Array.from(arguments).join(' ');
    originalConsoleError(message);
    errorLogStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const questionRoutes = require("./routes/questionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { protect } = require("./middlewares/authMiddlewares");
const { generateInterviewQuestions, generateConceptExplanation } = require("./controllers/aiController");

const app = express();

// Connect to MongoDB
connectDB().catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Add request logging
// Rate limiting
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    }
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Logging middleware
app.use(morgan('combined', { 
    stream: accessLogStream,
    skip: (req) => req.path === '/health' // Skip logging for health checks
}));
app.use(morgan('dev', { 
    skip: (req) => req.path === '/health' // Skip logging for health checks
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // In development, allow all origins for easier debugging
        if (process.env.NODE_ENV === 'development') {
            console.log(`Allowing request from origin: ${origin}`);
            return callback(null, true);
        }
        
        // In production, only allow specific origins
        const allowedOrigins = [
            'http://localhost:5173', 
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://your-production-domain.com' // Replace with your production domain
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.warn('Request with no origin detected');
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `CORS blocked for origin: ${origin}. This origin is not allowed.`;
            console.warn(msg);
            return callback(new Error(msg), false);
        }
        
        console.log(`Allowing request from allowed origin: ${origin}`);
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept',
        'X-Access-Token',
        'X-Forwarded-For',
        'X-Forwarded-Proto',
        'X-Forwarded-Host',
        'X-Forwarded-Port'
    ],
    exposedHeaders: [
        'Content-Length',
        'X-Foo',
        'X-Bar',
        'Retry-After',
        'X-Total-Count',
        'X-Pagination'
    ],
    credentials: true,
    preflightContinue: false,
    // Set to 200 for better browser compatibility
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Middleware for JSON and URL-encoded bodies with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Routes

// API Routes
app.use("/api/auth", authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/ai', aiRoutes);

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {}));

// Global error handling middleware (should be after all other middleware and routes)
app.use((err, req, res, next) => {
    // Log the error with request details
    console.error('\n===== ERROR =====');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Request URL:', req.originalUrl);
    console.error('Request Method:', req.method);
    console.error('Error:', err.message);
    
    if (process.env.NODE_ENV === 'development') {
        console.error('Stack:', err.stack);
    }
    
    // Handle rate limit errors
    if (err.status === 429) {
        const retryAfter = err.retryAfter || 60; // Default to 60 seconds if not specified
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later',
            retryAfter: `${retryAfter} seconds`,
            ...(process.env.NODE_ENV === 'development' && { error: err.message })
        });
    }
    
    // Handle CORS errors
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'Not allowed by CORS',
            ...(process.env.NODE_ENV === 'development' && { error: err.message })
        });
    }
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            ...(process.env.NODE_ENV === 'development' && { error: err.message })
        });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message),
            ...(process.env.NODE_ENV === 'development' && { error: err.message })
        });
    }
    
    // Default error handler
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { 
            error: err.message,
            stack: err.stack 
        })
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Start the server
const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});
