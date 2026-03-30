/**
 * Vehicle Controller
 * Handles HTTP requests for vehicle operations
 */

import * as vehicleDao from '../dao/vehicle.dao.js';
import {
    validateCreateVehicle,
    validateUpdateVehicle,
    validateVehicleFilter,
    toVehicleResponse,
    toVehicleResponseArray
} from '../dto/vehicle.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create a new vehicle
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function createVehicle(req, res) {
    try {
        const validation = validateCreateVehicle(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // Check if placa already exists
        const existingVehicle = await vehicleDao.getVehicleByPlaca(req.body.placa);
        if (existingVehicle) {
            return res.status(409).json({
                success: false,
                error: 'Vehicle placa already exists'
            });
        }
        
        const vehicle = await vehicleDao.createVehicle(req.body);
        
        res.status(201).json({
            success: true,
            data: toVehicleResponse(vehicle)
        });
    } catch (error) {
        logger.error('Error creating vehicle:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get vehicle by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getVehicleById(req, res) {
    try {
        const { id } = req.params;
        
        const vehicle = await vehicleDao.getVehicleById(id);
        
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vehicle not found'
            });
        }
        
        res.json({
            success: true,
            data: toVehicleResponse(vehicle)
        });
    } catch (error) {
        logger.error('Error getting vehicle:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get vehicles with filters and pagination
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getVehicles(req, res) {
    try {
        const validation = validateVehicleFilter(req.query);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const result = await vehicleDao.getVehicles(validation.sanitized);
        
        res.json({
            success: true,
            data: toVehicleResponseArray(result.vehicles),
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
        logger.error('Error getting vehicles:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update vehicle by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updateVehicle(req, res) {
    try {
        const { id } = req.params;
        
        const validation = validateUpdateVehicle(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // If placa is being updated, check if it already exists
        if (req.body.placa) {
            const existingVehicle = await vehicleDao.getVehicleByPlaca(req.body.placa);
            if (existingVehicle && existingVehicle._id.toString() !== id) {
                return res.status(409).json({
                    success: false,
                    error: 'Vehicle placa already exists'
                });
            }
        }
        
        const vehicle = await vehicleDao.updateVehicle(id, req.body);
        
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vehicle not found'
            });
        }
        
        res.json({
            success: true,
            data: toVehicleResponse(vehicle)
        });
    } catch (error) {
        logger.error('Error updating vehicle:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Delete vehicle by ID (soft delete)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deleteVehicle(req, res) {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        
        let success;
        if (hard === 'true') {
            success = await vehicleDao.hardDeleteVehicle(id);
        } else {
            success = await vehicleDao.deleteVehicle(id);
        }
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Vehicle not found'
            });
        }
        
        res.json({
            success: true,
            message: hard === 'true' ? 'Vehicle permanently deleted' : 'Vehicle deactivated'
        });
    } catch (error) {
        logger.error('Error deleting vehicle:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get vehicles by repartidor ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getVehiclesByRepartidor(req, res) {
    try {
        const { repartidorId } = req.params;
        const { limit, skip } = req.query;
        
        const vehicles = await vehicleDao.getVehiclesByRepartidor(repartidorId, {
            limit: parseInt(limit) || 100,
            skip: parseInt(skip) || 0
        });
        
        res.json({
            success: true,
            data: toVehicleResponseArray(vehicles)
        });
    } catch (error) {
        logger.error('Error getting vehicles by repartidor:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get vehicles by type
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getVehiclesByType(req, res) {
    try {
        const { tipo } = req.params;
        const { limit, skip } = req.query;
        
        const vehicles = await vehicleDao.getVehiclesByType(tipo, {
            limit: parseInt(limit) || 100,
            skip: parseInt(skip) || 0
        });
        
        res.json({
            success: true,
            data: toVehicleResponseArray(vehicles)
        });
    } catch (error) {
        logger.error('Error getting vehicles by type:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get vehicle statistics
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getVehicleStats(req, res) {
    try {
        const [typeStats, repartidorStats] = await Promise.all([
            vehicleDao.countVehiclesByType(),
            vehicleDao.countVehiclesByRepartidor()
        ]);
        
        res.json({
            success: true,
            data: {
                byType: typeStats,
                byRepartidor: repartidorStats
            }
        });
    } catch (error) {
        logger.error('Error getting vehicle stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    createVehicle,
    getVehicleById,
    getVehicles,
    updateVehicle,
    deleteVehicle,
    getVehiclesByRepartidor,
    getVehiclesByType,
    getVehicleStats
};
