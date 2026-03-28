/**
 * Role DTO (Data Transfer Object)
 * Defines data structure for role operations
 */

/**
 * @typedef {Object} CreateRoleDTO
 * @property {string} name - Role name
 * @property {string} [description] - Role description
 * @property {string[]} [permissions] - Permission IDs
 * @property {boolean} [isActive] - Whether role is active
 */

/**
 * @typedef {Object} UpdateRoleDTO
 * @property {string} [name] - Role name
 * @property {string} [description] - Role description
 * @property {string[]} [permissions] - Permission IDs
 * @property {boolean} [isActive] - Whether role is active
 */

/**
 * @typedef {Object} RoleResponseDTO
 * @property {string} id - Role ID
 * @property {string} name - Role name
 * @property {string} description - Role description
 * @property {string[]} permissions - Permission IDs
 * @property {boolean} isActive - Whether role is active
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} RoleFilterDTO
 * @property {string} [name] - Filter by name (partial match)
 * @property {boolean} [isActive] - Filter by active status
 * @property {number} [page] - Page number (default: 1)
 * @property {number} [limit] - Items per page (default: 20, max: 100)
 * @property {string} [sortBy] - Sort field (default: createdAt)
 * @property {string} [sortOrder] - Sort order: asc/desc (default: desc)
 */

/**
 * Validate create role data
 * @param {CreateRoleDTO} data - Role data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateCreateRole(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Name is required and must be a string');
    } else if (data.name.length < 2 || data.name.length > 50) {
        errors.push('Name must be between 2 and 50 characters');
    }

    if (data.description && typeof data.description !== 'string') {
        errors.push('Description must be a string');
    }

    if (data.permissions && !Array.isArray(data.permissions)) {
        errors.push('Permissions must be an array');
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
 * Validate update role data
 * @param {UpdateRoleDTO} data - Role data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateUpdateRole(data) {
    const errors = [];

    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('Name must be a string');
        } else if (data.name.length < 2 || data.name.length > 50) {
            errors.push('Name must be between 2 and 50 characters');
        }
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
        errors.push('Description must be a string');
    }

    if (data.permissions !== undefined && !Array.isArray(data.permissions)) {
        errors.push('Permissions must be an array');
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
 * @param {RoleFilterDTO} data - Filter data
 * @returns {{valid: boolean, errors: string[], sanitized: RoleFilterDTO}}
 */
export function validateRoleFilter(data) {
    const errors = [];
    const sanitized = {};

    if (data.name && typeof data.name === 'string') {
        sanitized.name = data.name.trim();
    }

    if (data.isActive !== undefined && typeof data.isActive === 'boolean') {
        sanitized.isActive = data.isActive;
    }

    // Pagination
    sanitized.page = Math.max(1, parseInt(data.page) || 1);
    sanitized.limit = Math.min(100, Math.max(1, parseInt(data.limit) || 20));

    // Sorting
    const allowedSortFields = ['name', 'createdAt', 'updatedAt'];
    sanitized.sortBy = allowedSortFields.includes(data.sortBy) ? data.sortBy : 'createdAt';
    sanitized.sortOrder = data.sortOrder === 'asc' ? 'asc' : 'desc';

    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Convert role document to response DTO
 * @param {Object} role - Role document
 * @returns {RoleResponseDTO}
 */
export function toRoleResponse(role) {
    return {
        id: role._id?.toString() || role.id,
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
        isActive: role.isActive !== false,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
    };
}

/**
 * Convert array of roles to response DTOs
 * @param {Object[]} roles - Array of role documents
 * @returns {RoleResponseDTO[]}
 */
export function toRoleResponseArray(roles) {
    return roles.map(toRoleResponse);
}

export default {
    validateCreateRole,
    validateUpdateRole,
    validateRoleFilter,
    toRoleResponse,
    toRoleResponseArray
};
