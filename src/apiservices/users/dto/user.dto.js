/**
 * User DTO (Data Transfer Object)
 * Defines data structure for user operations
 */

/**
 * @typedef {Object} CreateUserDTO
 * @property {string} email - User email
 * @property {string} name - User name
 * @property {string} [password] - User password (hashed)
 * @property {string[]} [roles] - User role IDs
 * @property {boolean} [isActive] - Whether user is active
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} UpdateUserDTO
 * @property {string} [name] - User name
 * @property {string[]} [roles] - User role IDs
 * @property {boolean} [isActive] - Whether user is active
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} UserResponseDTO
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} name - User name
 * @property {string[]} roles - User role IDs
 * @property {boolean} isActive - Whether user is active
 * @property {Object} metadata - Additional metadata
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} UserFilterDTO
 * @property {string} [email] - Filter by email (partial match)
 * @property {string} [name] - Filter by name (partial match)
 * @property {string[]} [roles] - Filter by role IDs
 * @property {boolean} [isActive] - Filter by active status
 * @property {Date} [createdAfter] - Filter by creation date
 * @property {Date} [createdBefore] - Filter by creation date
 * @property {number} [page] - Page number (default: 1)
 * @property {number} [limit] - Items per page (default: 20, max: 100)
 * @property {string} [sortBy] - Sort field (default: createdAt)
 * @property {string} [sortOrder] - Sort order: asc/desc (default: desc)
 */

/**
 * @typedef {Object} PaginatedResponseDTO
 * @property {boolean} success - Whether operation was successful
 * @property {UserResponseDTO[]} data - Array of users
 * @property {Object} pagination - Pagination info
 * @property {number} pagination.page - Current page
 * @property {number} pagination.limit - Items per page
 * @property {number} pagination.total - Total items
 * @property {number} pagination.totalPages - Total pages
 * @property {boolean} pagination.hasNext - Whether there's next page
 * @property {boolean} pagination.hasPrev - Whether there's previous page
 */

/**
 * Validate create user data
 * @param {CreateUserDTO} data - User data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateCreateUser(data) {
    const errors = [];

    if (!data.email || typeof data.email !== 'string') {
        errors.push('Email is required and must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Name is required and must be a string');
    } else if (data.name.length < 2 || data.name.length > 100) {
        errors.push('Name must be between 2 and 100 characters');
    }

    if (data.password && typeof data.password !== 'string') {
        errors.push('Password must be a string');
    }

    if (data.roles && !Array.isArray(data.roles)) {
        errors.push('Roles must be an array');
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
 * Validate update user data
 * @param {UpdateUserDTO} data - User data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateUpdateUser(data) {
    const errors = [];

    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('Name must be a string');
        } else if (data.name.length < 2 || data.name.length > 100) {
            errors.push('Name must be between 2 and 100 characters');
        }
    }

    if (data.roles !== undefined && !Array.isArray(data.roles)) {
        errors.push('Roles must be an array');
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
 * Validate filter data
 * @param {UserFilterDTO} data - Filter data
 * @returns {{valid: boolean, errors: string[], sanitized: UserFilterDTO}}
 */
export function validateUserFilter(data) {
    const errors = [];
    const sanitized = {};

    if (data.email && typeof data.email === 'string') {
        sanitized.email = data.email.trim();
    }

    if (data.name && typeof data.name === 'string') {
        sanitized.name = data.name.trim();
    }

    if (data.roles && Array.isArray(data.roles)) {
        sanitized.roles = data.roles.filter(r => typeof r === 'string');
    }

    if (data.isActive !== undefined && typeof data.isActive === 'boolean') {
        sanitized.isActive = data.isActive;
    }

    if (data.createdAfter) {
        const date = new Date(data.createdAfter);
        if (!isNaN(date.getTime())) {
            sanitized.createdAfter = date;
        }
    }

    if (data.createdBefore) {
        const date = new Date(data.createdBefore);
        if (!isNaN(date.getTime())) {
            sanitized.createdBefore = date;
        }
    }

    // Pagination
    sanitized.page = Math.max(1, parseInt(data.page) || 1);
    sanitized.limit = Math.min(100, Math.max(1, parseInt(data.limit) || 20));

    // Sorting
    const allowedSortFields = ['email', 'name', 'createdAt', 'updatedAt'];
    sanitized.sortBy = allowedSortFields.includes(data.sortBy) ? data.sortBy : 'createdAt';
    sanitized.sortOrder = data.sortOrder === 'asc' ? 'asc' : 'desc';

    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Convert user document to response DTO
 * @param {Object} user - User document
 * @returns {UserResponseDTO}
 */
export function toUserResponse(user) {
    return {
        id: user._id?.toString() || user.id,
        email: user.email,
        name: user.name,
        roles: user.roles || [],
        isActive: user.isActive !== false,
        metadata: user.metadata || {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

/**
 * Convert array of users to response DTOs
 * @param {Object[]} users - Array of user documents
 * @returns {UserResponseDTO[]}
 */
export function toUserResponseArray(users) {
    return users.map(toUserResponse);
}

export default {
    validateCreateUser,
    validateUpdateUser,
    validateUserFilter,
    toUserResponse,
    toUserResponseArray
};
