/**
 * HTTP Server with Swagger Documentation and WhatsApp Bot
 * Provides API endpoints and initializes the WhatsApp bot
 */

console.log('📦 [SERVER] Loading modules...');

import express from 'express';
console.log('✅ [SERVER] express loaded');

import swaggerUi from 'swagger-ui-express';
console.log('✅ [SERVER] swagger-ui-express loaded');

import swaggerSpec from '@/config/swagger.js';
console.log('✅ [SERVER] swagger config loaded');

import { fileRoutes, sessionRoutes, userRoutes, roleRoutes, permissionRoutes, productRoutes, vehicleRoutes, connectionRoutes, broadcastRoutes } from '@/routes/index.js';
console.log('✅ [SERVER] routes loaded');

import pino from 'pino';
console.log('✅ [SERVER] pino loaded');

import config from '@/config/env.js';
console.log('✅ [SERVER] config loaded');

import BotClient from '@/bot/BotClient.js';
console.log('✅ [SERVER] BotClient loaded');

import { initializeConversationTrees } from '@/bot/handlers/messageHandler.js';
console.log('✅ [SERVER] conversation trees loader loaded');

import { connectDB, closeDB } from '@/database/db.js';
console.log('✅ [SERVER] database functions loaded');

const logger = pino({ level: config.logging.level });
const app = express();
const PORT = process.env.PORT || 8000;

/**
 * Global error handlers for debugging server closure
 */

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    console.error('\n❌ [SERVER] Uncaught Exception:', error.message);
    console.error(error.stack);
    console.error('\n🔄 [SERVER] Server will exit due to uncaught exception');
    await gracefulShutdown(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
    console.error('\n❌ [SERVER] Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    console.error('\n🔄 [SERVER] Server will exit due to unhandled rejection');
    await gracefulShutdown(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
    console.log('\n\n🛑 [SERVER] Received SIGINT, shutting down gracefully...');
    await gracefulShutdown(0);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
    console.log('\n\n🛑 [SERVER] Received SIGTERM, shutting down gracefully...');
    await gracefulShutdown(0);
});

// Log when process is about to exit
process.on('exit', (code) => {
    console.log(`\n👋 [SERVER] Process exiting with code: ${code}`);
});

// Log before exit
process.on('beforeExit', () => {
    console.log('\n⚠️  [SERVER] Process is about to exit (beforeExit event)');
});

/**
 * Graceful shutdown handler
 * @param {number} exitCode - Exit code
 */
async function gracefulShutdown(exitCode = 0) {
    console.log('\n🔄 [SERVER] Performing graceful shutdown...');
    
    try {
        // Shutdown bot
        console.log('🤖 [SERVER] Shutting down WhatsApp bot...');
        await BotClient.shutdown();
        console.log('✅ [SERVER] Bot shutdown complete');
        
        // Close database connection
        console.log('🗄️  [SERVER] Closing database connection...');
        await closeDB();
        console.log('✅ [SERVER] Database connection closed');
        
        // Give time for pending operations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
    } catch (error) {
        console.error('❌ [SERVER] Error during shutdown:', error.message);
    }
    
    console.log('👋 [SERVER] Goodbye!\n');
    process.exit(exitCode);
}

// Performance optimization: Enable compression
import compression from 'compression';
console.log('✅ [SERVER] compression loaded');

app.use(compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));
console.log('✅ [SERVER] compression middleware configured');

// Middleware
console.log('🔧 [SERVER] Setting up middleware...');
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
console.log('✅ [SERVER] JSON middleware configured');
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('✅ [SERVER] URL-encoded middleware configured');

// Security headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});
console.log('✅ [SERVER] Security headers configured');

// Health check endpoint (before authentication)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Bototo API',
        bot: BotClient.getConnectionStatus() ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// CORS middleware - Enable for cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Cache control for static assets
app.use((req, res, next) => {
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
        res.header('Cache-Control', 'public, max-age=86400'); // 24 hours
    }
    next();
});

// Swagger UI
console.log('🔧 [SERVER] Setting up Swagger UI...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Bototo API Documentation'
}));
console.log('✅ [SERVER] Swagger UI configured');

// API Routes
console.log('🔧 [SERVER] Setting up API routes...');
app.use('/api/files', fileRoutes);
console.log('✅ [SERVER] /api/files route configured');
app.use('/api/session', sessionRoutes);
console.log('✅ [SERVER] /api/session route configured');
app.use('/api/users', userRoutes);
console.log('✅ [SERVER] /api/users route configured');
app.use('/api/roles', roleRoutes);
console.log('✅ [SERVER] /api/roles route configured');
app.use('/api/permissions', permissionRoutes);
console.log('✅ [SERVER] /api/permissions route configured');
app.use('/api/products', productRoutes);
console.log('✅ [SERVER] /api/products route configured');
app.use('/api/vehicles', vehicleRoutes);
console.log('✅ [SERVER] /api/vehicles route configured');
app.use('/api/connections', connectionRoutes);
console.log('✅ [SERVER] /api/connections route configured');
app.use('/api/broadcasts', broadcastRoutes);
console.log('✅ [SERVER] /api/broadcasts route configured');

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Get API information and available endpoints.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bototo API Server
 *                 documentation:
 *                   type: string
 *                   example: http://localhost:3000/api-docs
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     files:
 *                       type: string
 *                       example: /api/files
 *                     health:
 *                       type: string
 *                       example: /health
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Bototo API Server',
        documentation: `http://localhost:${PORT}/api-docs`,
        endpoints: {
            files: '/api/files',
            health: '/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        documentation: `http://localhost:${PORT}/api-docs`
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Server error:', err.message);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

/**
 * Initialize WhatsApp Bot
 */
async function initializeBot() {
    try {
        console.log('\n🤖 [BOT] Initializing WhatsApp Bot...');
        
        // Connect to database
        console.log('🗄️  [BOT] Connecting to database...');
        await connectDB();
        console.log('✅ [BOT] Database connected');
        
        // Initialize conversation trees
        console.log('🌳 [BOT] Loading conversation trees...');
        initializeConversationTrees();
        console.log('✅ [BOT] Conversation trees loaded');
        
        // Connect to WhatsApp
        console.log('📱 [BOT] Connecting to WhatsApp...');
        await BotClient.connect();
        console.log('✅ [BOT] WhatsApp connection initiated');
        
    } catch (error) {
        console.error('\n❌ [BOT] Failed to initialize bot:', error.message);
        console.error(error.stack);
        // Don't exit - server can still run without bot
        console.log('⚠️  [BOT] Server will continue without bot functionality');
    }
}

// Start server
console.log('\n📡 [SERVER] Starting server initialization...');
console.log(`📡 [SERVER] Attempting to bind to port ${PORT} on 0.0.0.0`);

const server = app.listen(PORT, '0.0.0.0', async () => {
    // Show base server route and confirm .env usage
    console.log('\n🔧 Server Configuration:');
    console.log(`   PORT from .env: ${process.env.PORT || 'NOT SET (using default 8000)'}`);
    console.log(`   BACKEND_DOMAIN from .env: ${process.env.BACKEND_DOMAIN || 'NOT SET'}`);
    console.log(`   Active PORT: ${PORT}`);
    console.log(`   Base Server URL: http://0.0.0.0:${PORT}`);
    console.log(`\n🚀 Bototo API Server running on port ${PORT}`);
    console.log(`📚 Swagger documentation: http://0.0.0.0:${PORT}/api-docs`);
    console.log(`🔗 API endpoints: http://0.0.0.0:${PORT}/api/files`);
    console.log(`❤️  Health check: http://0.0.0.0:${PORT}/health\n`);
    console.log('✅ [SERVER] Server successfully started and listening for connections');
    
    // Initialize bot after server is running
    await initializeBot();
});

// Handle server errors
server.on('error', (error) => {
    console.error('\n❌ [SERVER] Server error:', error.message);
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ [SERVER] Port ${PORT} is already in use`);
    } else if (error.code === 'EACCES') {
        console.error(`❌ [SERVER] Permission denied to bind to port ${PORT}`);
    }
    console.error(error.stack);
    process.exit(1);
});

// Log when server closes
server.on('close', () => {
    console.log('\n🛑 [SERVER] Server closed');
});

export default app;
