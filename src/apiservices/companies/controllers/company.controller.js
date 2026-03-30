/**
 * Company Controller
 * Handles HTTP requests for company operations
 */

import * as companyDao from '../dao/company.dao.js';
import {
    validateCreateCompany,
    validateUpdateCompany,
    validateCompanyFilter,
    toCompanyResponse,
    toCompanyResponseArray
} from '../dto/company.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create a new company
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function createCompany(req, res) {
    try {
        const validation = validateCreateCompany(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // Check if email already exists
        const existingByEmail = await companyDao.getCompanyByEmail(req.body.email);
        if (existingByEmail) {
            return res.status(409).json({
                success: false,
                error: 'Email already exists'
            });
        }
        
        // Check if CUIT already exists
        const existingByCuit = await companyDao.getCompanyByCuit(req.body.cuit);
        if (existingByCuit) {
            return res.status(409).json({
                success: false,
                error: 'CUIT already exists'
            });
        }
        
        const company = await companyDao.createCompany(req.body);
        
        res.status(201).json({
            success: true,
            data: toCompanyResponse(company)
        });
    } catch (error) {
        logger.error('Error creating company:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get company by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getCompanyById(req, res) {
    try {
        const { id } = req.params;
        
        const company = await companyDao.getCompanyById(id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            data: toCompanyResponse(company)
        });
    } catch (error) {
        logger.error('Error getting company:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get companies with filters and pagination
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getCompanies(req, res) {
    try {
        const validation = validateCompanyFilter(req.query);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const result = await companyDao.getCompanies(validation.sanitized);
        
        res.json({
            success: true,
            data: toCompanyResponseArray(result.companies),
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
        logger.error('Error getting companies:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update company by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updateCompany(req, res) {
    try {
        const { id } = req.params;
        
        const validation = validateUpdateCompany(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // Check if email already exists (if updating email)
        if (req.body.email) {
            const existingByEmail = await companyDao.getCompanyByEmail(req.body.email);
            if (existingByEmail && existingByEmail._id.toString() !== id) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already exists'
                });
            }
        }
        
        // Check if CUIT already exists (if updating CUIT)
        if (req.body.cuit) {
            const existingByCuit = await companyDao.getCompanyByCuit(req.body.cuit);
            if (existingByCuit && existingByCuit._id.toString() !== id) {
                return res.status(409).json({
                    success: false,
                    error: 'CUIT already exists'
                });
            }
        }
        
        const company = await companyDao.updateCompany(id, req.body);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            data: toCompanyResponse(company)
        });
    } catch (error) {
        logger.error('Error updating company:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Delete company by ID (soft delete)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deleteCompany(req, res) {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        
        let success;
        if (hard === 'true') {
            success = await companyDao.hardDeleteCompany(id);
        } else {
            success = await companyDao.deleteCompany(id);
        }
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            message: hard === 'true' ? 'Company permanently deleted' : 'Company deactivated'
        });
    } catch (error) {
        logger.error('Error deleting company:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get company statistics
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getCompanyStats(req, res) {
    try {
        const stats = await companyDao.countCompaniesByStatus();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting company stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    createCompany,
    getCompanyById,
    getCompanies,
    updateCompany,
    deleteCompany,
    getCompanyStats
};
