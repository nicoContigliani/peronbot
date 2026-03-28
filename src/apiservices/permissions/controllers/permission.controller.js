/**
 * Permission Controller
 * Handles HTTP requests for permission operations
 */

import * as permissionDao from '../dao/permission.dao.js';
import {
    validateCreatePermission,
    validateUpdatePermission,
    validatePermissionFilter,
    toPermissionResponse,
    toPermissionResponseArray
} from '../dto/permission.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create a new permission
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function createPermission(req, res) {
    try {
        const validation = validateCreatePermission(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // Check if name already exists
        const existingPermission = await permissionDao.getPermissionByName(req.body.name);
        if (existingPermission) {
            return res.status(409).json({
                success: false,
                error: 'Permission name already exists'
            });
        }
        
        const permission = await permissionDao.createPermission(req.body);
        
        res.status(201).json({
            success: true,
            data: toPermissionResponse(permission)
        });
    } catch (error) {
        logger.error('Error creating permission:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get permission by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getPermissionById(req, res) {
    try {
        const { id } = req.params;
        
        const permission = await permissionDao.getPermissionById(id);
        
        if (!permission) {
            return res.status(404).json({
                success: false,
                error: 'Permission not found'
            });
        }
        
        res.json({
            success: true,
            data: toPermissionResponse(permission)
        });
    } catch (error) {
        logger.error('Error getting permission:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get permissions with filters and pagination
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getPermissions(req, res) {
    try {
        const validation = validatePermissionFilter(req.query);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const result = await permissionDao.getPermissions(validation.sanitized);
        
        res.json({
            success: true,
            data: toPermissionResponseArray(result.permissions),
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
        logger.error('Error getting permissions:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update permission by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updatePermission(req, res) {
    try {
        const { id } = req.params;
        
        const validation = validateUpdatePermission(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const permission = await permissionDao.updatePermission(id, req.body);
        
        if (!permission) {
            return res.status(404).json({
                success: false,
                error: 'Permission not found'
            });
        }
        
        res.json({
            success: true,
            data: toPermissionResponse(permission)
        });
    } catch (error) {
        logger.error('Error updating permission:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Delete permission by ID (soft delete)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deletePermission(req, res) {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        
        let success;
        if (hard === 'true') {
            success = await permissionDao.hardDeletePermission(id);
        } else {
            success = await permissionDao.deletePermission(id);
        }
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Permission not found'
            });
        }
        
        res.json({
            success: true,
            message: hard === 'true' ? 'Permission permanently deleted' : 'Permission deactivated'
        });
    } catch (error) {
        logger.error('Error deleting permission:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get permissions by resource
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getPermissionsByResource(req, res) {
    try {
        const { resource } = req.params;
        const { limit, skip } = req.query;
        
        const permissions = await permissionDao.getPermissionsByResource(resource, {
            limit: parseInt(limit) || 100,
            skip: parseInt(skip) || 0
        });
        
        res.json({
            success: true,
            data: toPermissionResponseArray(permissions)
        });
    } catch (error) {
        logger.error('Error getting permissions by resource:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get permissions by action
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getPermissionsByAction(req, res) {
    try {
        const { action } = req.params;
        const { limit, skip } = req.query;
        
        const permissions = await permissionDao.getPermissionsByAction(action, {
            limit: parseInt(limit) || 100,
            skip: parseInt(skip) || 0
        });
        
        res.json({
            success: true,
            data: toPermissionResponseArray(permissions)
        });
    } catch (error) {
        logger.error('Error getting permissions by action:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get permission statistics
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getPermissionStats(req, res) {
    try {
        const stats = await permissionDao.countPermissionsByStatus();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting permission stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    createPermission,
    getPermissionById,
    getPermissions,
    updatePermission,
    deletePermission,
    getPermissionsByResource,
    getPermissionsByAction,
    getPermissionStats
};
