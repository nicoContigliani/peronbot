/**
 * Connection Controller
 * Handles HTTP requests for connection operations
 */

import * as connectionDao from '../dao/connection.dao.js';
import {
    validateCreateConnection,
    validateUpdateConnection,
    validateConnectionFilter,
    toConnectionResponse,
    toConnectionResponseArray
} from '../dto/connection.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create a new connection
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function createConnection(req, res) {
    try {
        const validation = validateCreateConnection(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // Check if name already exists
        const existingConnection = await connectionDao.getConnectionByName(req.body.name);
        if (existingConnection) {
            return res.status(409).json({
                success: false,
                error: 'Connection name already exists'
            });
        }
        
        const connection = await connectionDao.createConnection(req.body);
        
        res.status(201).json({
            success: true,
            data: toConnectionResponse(connection)
        });
    } catch (error) {
        logger.error('Error creating connection:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get connection by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getConnectionById(req, res) {
    try {
        const { id } = req.params;
        
        const connection = await connectionDao.getConnectionById(id);
        
        if (!connection) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }
        
        res.json({
            success: true,
            data: toConnectionResponse(connection)
        });
    } catch (error) {
        logger.error('Error getting connection:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get connections with filters and pagination
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getConnections(req, res) {
    try {
        const validation = validateConnectionFilter(req.query);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const result = await connectionDao.getConnections(validation.sanitized);
        
        res.json({
            success: true,
            data: toConnectionResponseArray(result.connections),
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.page < result.totalPages,
                hasPrev: result.page > 1
            }
        });
    } catch (error) {
        logger.error('Error getting connections:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update connection by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updateConnection(req, res) {
    try {
        const { id } = req.params;
        
        const validation = validateUpdateConnection(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const connection = await connectionDao.updateConnection(id, req.body);
        
        if (!connection) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }
        
        res.json({
            success: true,
            data: toConnectionResponse(connection)
        });
    } catch (error) {
        logger.error('Error updating connection:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update connection status
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updateConnectionStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !['connected', 'disconnected', 'connecting', 'error'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status must be one of: connected, disconnected, connecting, error'
            });
        }
        
        const connection = await connectionDao.updateConnectionStatus(id, status);
        
        if (!connection) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }
        
        res.json({
            success: true,
            data: toConnectionResponse(connection)
        });
    } catch (error) {
        logger.error('Error updating connection status:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Delete connection by ID (soft delete)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deleteConnection(req, res) {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        
        let success;
        if (hard === 'true') {
            success = await connectionDao.hardDeleteConnection(id);
        } else {
            success = await connectionDao.deleteConnection(id);
        }
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }
        
        res.json({
            success: true,
            message: hard === 'true' ? 'Connection permanently deleted' : 'Connection deactivated'
        });
    } catch (error) {
        logger.error('Error deleting connection:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get connection statistics
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getConnectionStats(req, res) {
    try {
        const stats = await connectionDao.countConnectionsByStatus();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting connection stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    createConnection,
    getConnectionById,
    getConnections,
    updateConnection,
    updateConnectionStatus,
    deleteConnection,
    getConnectionStats
};
