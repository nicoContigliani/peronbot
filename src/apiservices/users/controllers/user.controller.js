/**
 * User Controller
 * Handles HTTP requests for user operations
 */

import * as userDao from '../dao/user.dao.js';
import {
    validateCreateUser,
    validateUpdateUser,
    validateUserFilter,
    toUserResponse,
    toUserResponseArray
} from '../dto/user.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create a new user
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function createUser(req, res) {
    try {
        const validation = validateCreateUser(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // Check if email already exists
        const existingUser = await userDao.getUserByEmail(req.body.email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Email already exists'
            });
        }
        
        const user = await userDao.createUser(req.body);
        
        res.status(201).json({
            success: true,
            data: toUserResponse(user)
        });
    } catch (error) {
        logger.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get user by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getUserById(req, res) {
    try {
        const { id } = req.params;
        
        const user = await userDao.getUserById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: toUserResponse(user)
        });
    } catch (error) {
        logger.error('Error getting user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get users with filters and pagination
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getUsers(req, res) {
    try {
        const validation = validateUserFilter(req.query);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const result = await userDao.getUsers(validation.sanitized);
        
        res.json({
            success: true,
            data: toUserResponseArray(result.users),
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
        logger.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update user by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updateUser(req, res) {
    try {
        const { id } = req.params;
        
        const validation = validateUpdateUser(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const user = await userDao.updateUser(id, req.body);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: toUserResponse(user)
        });
    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Delete user by ID (soft delete)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        
        let success;
        if (hard === 'true') {
            success = await userDao.hardDeleteUser(id);
        } else {
            success = await userDao.deleteUser(id);
        }
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: hard === 'true' ? 'User permanently deleted' : 'User deactivated'
        });
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Add role to user
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function addRoleToUser(req, res) {
    try {
        const { id, roleId } = req.params;
        
        const user = await userDao.addRoleToUser(id, roleId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: toUserResponse(user)
        });
    } catch (error) {
        logger.error('Error adding role to user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Remove role from user
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function removeRoleFromUser(req, res) {
    try {
        const { id, roleId } = req.params;
        
        const user = await userDao.removeRoleFromUser(id, roleId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: toUserResponse(user)
        });
    } catch (error) {
        logger.error('Error removing role from user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get users by role
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getUsersByRole(req, res) {
    try {
        const { roleId } = req.params;
        const { limit, skip } = req.query;
        
        const users = await userDao.getUsersByRole(roleId, {
            limit: parseInt(limit) || 100,
            skip: parseInt(skip) || 0
        });
        
        res.json({
            success: true,
            data: toUserResponseArray(users)
        });
    } catch (error) {
        logger.error('Error getting users by role:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get user statistics
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getUserStats(req, res) {
    try {
        const stats = await userDao.countUsersByStatus();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting user stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    createUser,
    getUserById,
    getUsers,
    updateUser,
    deleteUser,
    addRoleToUser,
    removeRoleFromUser,
    getUsersByRole,
    getUserStats
};
