/**
 * HTTP Server with Swagger Documentation
 * Provides API endpoints for file processing with interactive documentation
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '@/config/swagger.js';
import { fileRoutes, sessionRoutes, userRoutes, roleRoutes, permissionRoutes, productRoutes, vehicleRoutes } from '@/routes/index.js';
import { clerkAuthMiddleware } from '@/middleware/index.js';
import pino from 'pino';
import config from '@/config/env.js';

const logger = pino({ level: config.logging.level });
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware
app.use(clerkAuthMiddleware);

// CORS middleware (optional - uncomment if needed)
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Bototo API Documentation'
}));

// API Routes
app.use('/api/files', fileRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vehicles', vehicleRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API server is running and healthy.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-01T00:00:00.000Z
 *                 service:
 *                   type: string
 *                   example: Bototo API
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Bototo API'
    });
});

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

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Bototo API Server running on port ${PORT}`);
    console.log(`📚 Swagger documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🔗 API endpoints: http://localhost:${PORT}/api/files`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
});

export default app;
