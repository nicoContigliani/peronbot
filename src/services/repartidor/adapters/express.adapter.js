/**
 * Express Adapter for Repartidor Service
 * Example of how to use the pure service layer with Express
 */

import { RepartidorService } from '@/services/repartidor/repartidor.service.js';
import { AppError } from '@/core/errors/AppError.js';
import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create Express adapter for repartidor service
 * @param {Object} [options] - Adapter options
 * @returns {Object} Express router with repartidor endpoints
 */
export function createRepartidorExpressAdapter(options = {}) {
    const router = express.Router();
    
    // Initialize service with dependency injection
    let service = null;
    
    /**
     * Initialize service with database
     */
    async function initService() {
        if (!service) {
            const db = await getDB();
            service = new RepartidorService(db, options);
        }
        return service;
    }
    
    /**
     * Handle service errors and convert to Express responses
     * @param {Error} error - Error object
     * @param {Response} res - Express response
     */
    function handleError(error, res) {
        if (error instanceof AppError) {
            const statusCode = getStatusCodeForErrorType(error.type);
            return res.status(statusCode).json(error.toJSON());
        }
        
        logger.error('Unexpected error:', error);
        return res.status(500).json({
            success: false,
            error: {
                name: 'InternalServerError',
                message: 'An unexpected error occurred',
                code: 'INTERNAL_ERROR',
                type: 'INTERNAL',
                timestamp: new Date().toISOString()
            }
        });
    }
    
    /**
     * Get HTTP status code for error type
     * @param {string} errorType - Error type
     * @returns {number} HTTP status code
     */
    function getStatusCodeForErrorType(errorType) {
        const statusCodes = {
            'VALIDATION': 400,
            'NOT_FOUND': 404,
            'CONFLICT': 409,
            'UNAUTHORIZED': 401,
            'FORBIDDEN': 403,
            'DATABASE': 500
        };
        return statusCodes[errorType] || 500;
    }
    
    /**
     * POST /repartidores - Create repartidor
     */
    router.post('/', async (req, res) => {
        try {
            const svc = await initService();
            const result = await svc.createRepartidor(req.body);
            res.status(201).json(result);
        } catch (error) {
            handleError(error, res);
        }
    });
    
    /**
     * GET /repartidores - Get repartidores with filters
     */
    router.get('/', async (req, res) => {
        try {
            const svc = await initService();
            const result = await svc.getRepartidores(req.query);
            res.json(result);
        } catch (error) {
            handleError(error, res);
        }
    });
    
    /**
     * GET /repartidores/:id - Get repartidor by ID
     */
    router.get('/:id', async (req, res) => {
        try {
            const svc = await initService();
            const result = await svc.getRepartidorById(req.params.id);
            res.json(result);
        } catch (error) {
            handleError(error, res);
        }
    });
    
    /**
     * PUT /repartidores/:id - Update repartidor
     */
    router.put('/:id', async (req, res) => {
        try {
            const svc = await initService();
            const result = await svc.updateRepartidor(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            handleError(error, res);
        }
    });
    
    /**
     * PATCH /repartidores/:id/location - Update location
     */
    router.patch('/:id/location', async (req, res) => {
        try {
            const svc = await initService();
            const result = await svc.updateLocation({
                repartidorId: req.params.id,
                ...req.body
            });
            res.json(result);
        } catch (error) {
            handleError(error, res);
        }
    });
    
    /**
     * PATCH /repartidores/:id/status - Update status
     */
    router.patch('/:id/status', async (req, res) => {
        try {
            const svc = await initService();
            const result = await svc.updateStatus(req.params.id, req.body.estado);
            res.json(result);
        } catch (error) {
            handleError(error, res);
        }
    });
    
    /**
     * GET /repartidores/nearby/:lng/:lat - Get nearby repartidores
     */
    router.get('/nearby/:lng/:lat', async (req, res) => {
        try {
            const svc = await initService();
            const { lng, lat } = req.params;
            const maxDistance = parseInt(req.query.maxDistance) || 5000;
            const result = await svc.getNearbyRepartidores(
                parseFloat(lng),
                parseFloat(lat),
                maxDistance,
                req.query
            );
            res.json(result);
        } catch (error) {
            handleError(error, res);
        }
    });
    
    /**
     * DELETE /repartidores/:id - Delete repartidor
     */
    router.delete('/:id', async (req, res) => {
        try {
            const svc = await initService();
            const result = await svc.deleteRepartidor(req.params.id);
            res.json(result);
        } catch (error) {
            handleError(error, res);
        }
    });
    
    return router;
}

export default createRepartidorExpressAdapter;
