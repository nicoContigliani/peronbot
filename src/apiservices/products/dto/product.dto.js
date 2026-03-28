/**
 * Product DTO (Data Transfer Object)
 * Handles validation and transformation of product data
 */

/**
 * Validate create product data
 * @param {Object} data - Product data to validate
 * @returns {Object} Validation result with valid flag and errors
 */
export function validateCreateProduct(data) {
    const errors = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters');
    }
    
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
        errors.push('Description is required and must be at least 5 characters');
    }
    
    if (!data.category || typeof data.category !== 'string') {
        errors.push('Category is required');
    }
    
    if (data.unit_price === undefined || typeof data.unit_price !== 'number' || data.unit_price < 0) {
        errors.push('Unit price is required and must be a non-negative number');
    }
    
    if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0)) {
        errors.push('Stock must be a non-negative number');
    }
    
    if (data.image && typeof data.image !== 'string') {
        errors.push('Image must be a string');
    }
    
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
        errors.push('isActive must be a boolean');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate update product data
 * @param {Object} data - Product data to validate
 * @returns {Object} Validation result with valid flag and errors
 */
export function validateUpdateProduct(data) {
    const errors = [];
    
    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters');
        }
    }
    
    if (data.description !== undefined) {
        if (typeof data.description !== 'string' || data.description.trim().length < 5) {
            errors.push('Description must be at least 5 characters');
        }
    }
    
    if (data.category !== undefined) {
        if (typeof data.category !== 'string') {
            errors.push('Category must be a string');
        }
    }
    
    if (data.unit_price !== undefined) {
        if (typeof data.unit_price !== 'number' || data.unit_price < 0) {
            errors.push('Unit price must be a non-negative number');
        }
    }
    
    if (data.stock !== undefined) {
        if (typeof data.stock !== 'number' || data.stock < 0) {
            errors.push('Stock must be a non-negative number');
        }
    }
    
    if (data.image !== undefined && typeof data.image !== 'string') {
        errors.push('Image must be a string');
    }
    
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
        errors.push('isActive must be a boolean');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate product filter
 * @param {Object} data - Filter data to validate
 * @returns {Object} Validation result with valid flag and sanitized data
 */
export function validateProductFilter(data) {
    const errors = [];
    const sanitized = {};
    
    if (data.name !== undefined) {
        if (typeof data.name === 'string') {
            sanitized.name = data.name.trim();
        } else {
            errors.push('Name must be a string');
        }
    }
    
    if (data.category !== undefined) {
        if (typeof data.category === 'string') {
            sanitized.category = data.category.trim();
        } else {
            errors.push('Category must be a string');
        }
    }
    
    if (data.isActive !== undefined) {
        if (data.isActive === 'true' || data.isActive === true) {
            sanitized.isActive = true;
        } else if (data.isActive === 'false' || data.isActive === false) {
            sanitized.isActive = false;
        } else {
            errors.push('isActive must be a boolean');
        }
    }
    
    if (data.createdAfter !== undefined) {
        const date = new Date(data.createdAfter);
        if (!isNaN(date.getTime())) {
            sanitized.createdAfter = date;
        } else {
            errors.push('createdAfter must be a valid date');
        }
    }
    
    if (data.createdBefore !== undefined) {
        const date = new Date(data.createdBefore);
        if (!isNaN(date.getTime())) {
            sanitized.createdBefore = date;
        } else {
            errors.push('createdBefore must be a valid date');
        }
    }
    
    if (data.page !== undefined) {
        const page = parseInt(data.page);
        if (!isNaN(page) && page > 0) {
            sanitized.page = page;
        } else {
            errors.push('Page must be a positive integer');
        }
    }
    
    if (data.limit !== undefined) {
        const limit = parseInt(data.limit);
        if (!isNaN(limit) && limit > 0 && limit <= 100) {
            sanitized.limit = limit;
        } else {
            errors.push('Limit must be a positive integer up to 100');
        }
    }
    
    if (data.sortBy !== undefined) {
        const allowedFields = ['name', 'category', 'unit_price', 'createdAt', 'updatedAt'];
        if (allowedFields.includes(data.sortBy)) {
            sanitized.sortBy = data.sortBy;
        } else {
            errors.push(`sortBy must be one of: ${allowedFields.join(', ')}`);
        }
    }
    
    if (data.sortOrder !== undefined) {
        if (['asc', 'desc'].includes(data.sortOrder)) {
            sanitized.sortOrder = data.sortOrder;
        } else {
            errors.push('sortOrder must be asc or desc');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Transform product to response format
 * @param {Object} product - Product object
 * @returns {Object} Transformed product
 */
export function toProductResponse(product) {
    if (!product) return null;
    
    return {
        id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        unit_price: product.unit_price,
        stock: product.stock || 0,
        image: product.image,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
    };
}

/**
 * Transform array of products to response format
 * @param {Object[]} products - Array of product objects
 * @returns {Object[]} Transformed products
 */
export function toProductResponseArray(products) {
    return products.map(toProductResponse);
}

export default {
    validateCreateProduct,
    validateUpdateProduct,
    validateProductFilter,
    toProductResponse,
    toProductResponseArray
};
