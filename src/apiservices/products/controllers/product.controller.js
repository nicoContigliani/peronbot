/**
 * Product Controller
 * Handles HTTP requests for product operations
 */

import * as productDao from '../dao/product.dao.js';
import {
    validateCreateProduct,
    validateUpdateProduct,
    validateProductFilter,
    toProductResponse,
    toProductResponseArray
} from '../dto/product.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create a new product
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function createProduct(req, res) {
    try {
        const validation = validateCreateProduct(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        // Check if name already exists
        const existingProduct = await productDao.getProductByName(req.body.name);
        if (existingProduct) {
            return res.status(409).json({
                success: false,
                error: 'Product name already exists'
            });
        }
        
        const product = await productDao.createProduct(req.body);
        
        res.status(201).json({
            success: true,
            data: toProductResponse(product)
        });
    } catch (error) {
        logger.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get product by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getProductById(req, res) {
    try {
        const { id } = req.params;
        
        const product = await productDao.getProductById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: toProductResponse(product)
        });
    } catch (error) {
        logger.error('Error getting product:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get products with filters and pagination
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getProducts(req, res) {
    try {
        const validation = validateProductFilter(req.query);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const result = await productDao.getProducts(validation.sanitized);
        
        res.json({
            success: true,
            data: toProductResponseArray(result.products),
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
        logger.error('Error getting products:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Update product by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        
        const validation = validateUpdateProduct(req.body);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }
        
        const product = await productDao.updateProduct(id, req.body);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: toProductResponse(product)
        });
    } catch (error) {
        logger.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Delete product by ID (soft delete)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        
        let success;
        if (hard === 'true') {
            success = await productDao.hardDeleteProduct(id);
        } else {
            success = await productDao.deleteProduct(id);
        }
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: hard === 'true' ? 'Product permanently deleted' : 'Product deactivated'
        });
    } catch (error) {
        logger.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get products by category
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getProductsByCategory(req, res) {
    try {
        const { category } = req.params;
        const { limit, skip } = req.query;
        
        const products = await productDao.getProductsByCategory(category, {
            limit: parseInt(limit) || 100,
            skip: parseInt(skip) || 0
        });
        
        res.json({
            success: true,
            data: toProductResponseArray(products)
        });
    } catch (error) {
        logger.error('Error getting products by category:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get product statistics
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getProductStats(req, res) {
    try {
        const stats = await productDao.countProductsByCategory();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting product stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    createProduct,
    getProductById,
    getProducts,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getProductStats
};
