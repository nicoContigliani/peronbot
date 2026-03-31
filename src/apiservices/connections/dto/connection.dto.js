/**
 * Connection DTO (Data Transfer Object)
 * Validates and transforms connection data
 */

/**
 * Validate connection creation data
 * @param {Object} data - Connection data
 * @returns {Object} Validation result
 */
export function validateCreateConnection(data) {
    const errors = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }
    
    if (data.name && data.name.length > 100) {
        errors.push('Name must be 100 characters or less');
    }
    
    if (!data.provider || !['baileys', 'business-api'].includes(data.provider)) {
        errors.push('Provider must be either "baileys" or "business-api"');
    }
    
    if (data.phoneNumber && typeof data.phoneNumber !== 'string') {
        errors.push('Phone number must be a string');
    }
    
    if (data.webhookUrl && typeof data.webhookUrl !== 'string') {
        errors.push('Webhook URL must be a string');
    }
    
    if (data.webhookUrl && !isValidUrl(data.webhookUrl)) {
        errors.push('Webhook URL must be a valid URL');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        sanitized: errors.length === 0 ? {
            name: data.name.trim(),
            provider: data.provider,
            phoneNumber: data.phoneNumber || null,
            webhookUrl: data.webhookUrl || null,
            isActive: data.isActive !== false,
            metadata: data.metadata || {}
        } : null
    };
}

/**
 * Validate connection update data
 * @param {Object} data - Connection update data
 * @returns {Object} Validation result
 */
export function validateUpdateConnection(data) {
    const errors = [];
    
    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            errors.push('Name must be a non-empty string');
        } else if (data.name.length > 100) {
            errors.push('Name must be 100 characters or less');
        }
    }
    
    if (data.provider !== undefined && !['baileys', 'business-api'].includes(data.provider)) {
        errors.push('Provider must be either "baileys" or "business-api"');
    }
    
    if (data.phoneNumber !== undefined && typeof data.phoneNumber !== 'string') {
        errors.push('Phone number must be a string');
    }
    
    if (data.webhookUrl !== undefined) {
        if (typeof data.webhookUrl !== 'string') {
            errors.push('Webhook URL must be a string');
        } else if (!isValidUrl(data.webhookUrl)) {
            errors.push('Webhook URL must be a valid URL');
        }
    }
    
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
        errors.push('isActive must be a boolean');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        sanitized: errors.length === 0 ? {
            ...(data.name && { name: data.name.trim() }),
            ...(data.provider && { provider: data.provider }),
            ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
            ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.metadata && { metadata: data.metadata })
        } : null
    };
}

/**
 * Validate connection filter parameters
 * @param {Object} filters - Filter parameters
 * @returns {Object} Validation result
 */
export function validateConnectionFilter(filters) {
    const errors = [];
    const sanitized = {};
    
    if (filters.name) {
        sanitized.name = filters.name;
    }
    
    if (filters.provider) {
        if (!['baileys', 'business-api'].includes(filters.provider)) {
            errors.push('Provider must be either "baileys" or "business-api"');
        } else {
            sanitized.provider = filters.provider;
        }
    }
    
    if (filters.isActive !== undefined) {
        if (typeof filters.isActive === 'string') {
            sanitized.isActive = filters.isActive === 'true';
        } else if (typeof filters.isActive === 'boolean') {
            sanitized.isActive = filters.isActive;
        } else {
            errors.push('isActive must be a boolean or string "true"/"false"');
        }
    }
    
    if (filters.status) {
        if (!['connected', 'disconnected', 'connecting', 'error'].includes(filters.status)) {
            errors.push('Status must be one of: connected, disconnected, connecting, error');
        } else {
            sanitized.status = filters.status;
        }
    }
    
    if (filters.createdAfter) {
        const date = new Date(filters.createdAfter);
        if (isNaN(date.getTime())) {
            errors.push('createdAfter must be a valid date');
        } else {
            sanitized.createdAfter = date;
        }
    }
    
    if (filters.createdBefore) {
        const date = new Date(filters.createdBefore);
        if (isNaN(date.getTime())) {
            errors.push('createdBefore must be a valid date');
        } else {
            sanitized.createdBefore = date;
        }
    }
    
    if (filters.page) {
        const page = parseInt(filters.page);
        if (isNaN(page) || page < 1) {
            errors.push('Page must be a positive integer');
        } else {
            sanitized.page = page;
        }
    }
    
    if (filters.limit) {
        const limit = parseInt(filters.limit);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            errors.push('Limit must be between 1 and 100');
        } else {
            sanitized.limit = limit;
        }
    }
    
    if (filters.sortBy) {
        const allowedFields = ['name', 'provider', 'status', 'createdAt', 'updatedAt'];
        if (!allowedFields.includes(filters.sortBy)) {
            errors.push(`sortBy must be one of: ${allowedFields.join(', ')}`);
        } else {
            sanitized.sortBy = filters.sortBy;
        }
    }
    
    if (filters.sortOrder) {
        if (!['asc', 'desc'].includes(filters.sortOrder)) {
            errors.push('sortOrder must be either "asc" or "desc"');
        } else {
            sanitized.sortOrder = filters.sortOrder;
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Transform connection to response format
 * @param {Object} connection - Connection object
 * @returns {Object} Transformed connection
 */
export function toConnectionResponse(connection) {
    return {
        id: connection._id,
        name: connection.name,
        provider: connection.provider,
        phoneNumber: connection.phoneNumber,
        webhookUrl: connection.webhookUrl,
        status: connection.status || 'disconnected',
        isActive: connection.isActive,
        metadata: connection.metadata,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
    };
}

/**
 * Transform array of connections to response format
 * @param {Array} connections - Array of connection objects
 * @returns {Array} Transformed connections
 */
export function toConnectionResponseArray(connections) {
    return connections.map(toConnectionResponse);
}

/**
 * Check if string is valid URL
 * @param {string} str - String to check
 * @returns {boolean}
 */
function isValidUrl(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

export default {
    validateCreateConnection,
    validateUpdateConnection,
    validateConnectionFilter,
    toConnectionResponse,
    toConnectionResponseArray
};
