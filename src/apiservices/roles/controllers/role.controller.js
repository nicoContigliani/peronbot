/**
 * Role Controller
 * Handles HTTP requests for role operations
 */

import * as roleDao from '../dao/role.dao.js';
import {
    validateCreateRole,
    validateUpdateRole,
    validateRoleFilter,
    toRoleResponse,
    toRoleResponseArray
} from '../dto/role.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create a new role
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function createRole(req, res) {
    try {
        const validation = validateCreateRole(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // Check if name already exists
        const existingRole = await roleDao.getRoleByName(req.body.name);
        if (existingRole) {
            return res.status(409).json({
                success: false,
                error: 'Role name already exists'
            });
        }
        
        const role = await roleDao.createRole(req.body);
        
        res.status(201).json({
            success: true,
            data: toRoleResponse(role)
        });
    } catch (error) {
        logger.error('Error creating role:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get role by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getRoleById(req, res) {
    try {
        const { id } = req.params;
        
        const role = await roleDao.getRoleById(id);
        
        if (!role) {
            return res.status(404).json({
                success: false,
                error: 'Role not found'
            });
        }
        
        res.json({
            success: true,
            data: toRoleResponse(role)
        });
    } catch (error) {
        logger.error('Error getting role:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get roles with filters and pagination
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getRoles(req, res) {
    try {
        const validation = validateRoleFilter(req.query);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const result = await roleDao.getRoles(validation.sanitized);
        
        res.json({
            success: true,
            data: toRoleResponseArray(result.roles),
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
        logger.error('Error getting roles:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update role by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updateRole(req, res) {
    try {
        const { id } = req.params;
        
        const validation = validateUpdateRole(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const role = await roleDao.updateRole(id, req.body);
        
        if (!role) {
            return res.status(404).json({
                success: false,
                error: 'Role not found'
            });
        }
        
        res.json({
            success: true,
            data: toRoleResponse(role)
        });
    } catch (error) {
        logger.error('Error updating role:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Delete role by ID (soft delete)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deleteRole(req, res) {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        
        let success;
        if (hard === 'true') {
            success = await roleDao.hardDeleteRole(id);
        } else {
            success = await roleDao.deleteRole(id);
        }
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Role not found'
            });
        }
        
        res.json({
            success: true,
            message: hard === 'true' ? 'Role permanently deleted' : 'Role deactivated'
        });
    } catch (error) {
        logger.error('Error deleting role:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Add permission to role
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function addPermissionToRole(req, res) {
    try {
        const { id, permissionId } = req.params;
        
        const role = await roleDao.addPermissionToRole(id, permissionId);
        
        if (!role) {
            return res.status(404).json({
                success: false,
                error: 'Role not found'
            });
        }
        
        res.json({
            success: true,
            data: toRoleResponse(role)
        });
    } catch (error) {
        logger.error('Error adding permission to role:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Remove permission from role
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function removePermissionFromRole(req, res) {
    try {
        const { id, permissionId } = req.params;
        
        const role = await roleDao.removePermissionFromRole(id, permissionId);
        
        if (!role) {
            return res.status(404).json({
                success: false,
                error: 'Role not found'
            });
        }
        
        res.json({
            success: true,
            data: toRoleResponse(role)
        });
    } catch (error) {
        logger.error('Error removing permission from role:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get roles by permission
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getRolesByPermission(req, res) {
    try {
        const { permissionId } = req.params;
        const { limit, skip } = req.query;
        
        const roles = await roleDao.getRolesByPermission(permissionId, {
            limit: parseInt(limit) || 100,
            skip: parseInt(skip) || 0
        });
        
        res.json({
            success: true,
            data: toRoleResponseArray(roles)
        });
    } catch (error) {
        logger.error('Error getting roles by permission:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get role statistics
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getRoleStats(req, res) {
    try {
        const stats = await roleDao.countRolesByStatus();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting role stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    createRole,
    getRoleById,
    getRoles,
    updateRole,
    deleteRole,
    addPermissionToRole,
    removePermissionFromRole,
    getRolesByPermission,
    getRoleStats
};
