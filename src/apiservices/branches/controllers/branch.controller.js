/**
 * Branch Controller
 * Handles HTTP requests for branch operations
 */

import * as branchDao from '../dao/branch.dao.js';
import {
    validateCreateBranch,
    validateUpdateBranch,
    validateBranchFilter,
    toBranchResponse,
    toBranchResponseArray
} from '../dto/branch.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create a new branch
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function createBranch(req, res) {
    try {
        const validation = validateCreateBranch(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const branch = await branchDao.createBranch(req.body);
        
        res.status(201).json({
            success: true,
            data: toBranchResponse(branch)
        });
    } catch (error) {
        logger.error('Error creating branch:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get branch by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getBranchById(req, res) {
    try {
        const { id } = req.params;
        
        const branch = await branchDao.getBranchById(id);
        
        if (!branch) {
            return res.status(404).json({
                success: false,
                error: 'Branch not found'
            });
        }
        
        res.json({
            success: true,
            data: toBranchResponse(branch)
        });
    } catch (error) {
        logger.error('Error getting branch:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get branches with filters and pagination
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getBranches(req, res) {
    try {
        const validation = validateBranchFilter(req.query);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const result = await branchDao.getBranches(validation.sanitized);
        
        res.json({
            success: true,
            data: toBranchResponseArray(result.branches),
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
        logger.error('Error getting branches:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get branches by company ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getBranchesByCompanyId(req, res) {
    try {
        const { companyId } = req.params;
        const { limit, skip } = req.query;
        
        const branches = await branchDao.getBranchesByCompanyId(companyId, {
            limit: parseInt(limit) || 100,
            skip: parseInt(skip) || 0
        });
        
        res.json({
            success: true,
            data: toBranchResponseArray(branches)
        });
    } catch (error) {
        logger.error('Error getting branches by company:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update branch by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updateBranch(req, res) {
    try {
        const { id } = req.params;
        
        const validation = validateUpdateBranch(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const branch = await branchDao.updateBranch(id, req.body);
        
        if (!branch) {
            return res.status(404).json({
                success: false,
                error: 'Branch not found'
            });
        }
        
        res.json({
            success: true,
            data: toBranchResponse(branch)
        });
    } catch (error) {
        logger.error('Error updating branch:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Delete branch by ID (soft delete)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deleteBranch(req, res) {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        
        let success;
        if (hard === 'true') {
            success = await branchDao.hardDeleteBranch(id);
        } else {
            success = await branchDao.deleteBranch(id);
        }
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Branch not found'
            });
        }
        
        res.json({
            success: true,
            message: hard === 'true' ? 'Branch permanently deleted' : 'Branch deactivated'
        });
    } catch (error) {
        logger.error('Error deleting branch:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get branch statistics by company
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getBranchStatsByCompany(req, res) {
    try {
        const { companyId } = req.params;
        
        const stats = await branchDao.countBranchesByCompany(companyId);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting branch stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    createBranch,
    getBranchById,
    getBranches,
    getBranchesByCompanyId,
    updateBranch,
    deleteBranch,
    getBranchStatsByCompany
};
