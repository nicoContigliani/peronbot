/**
 * Permission DTO (Data Transfer Object)
 * Defines data structure for permission operations
 */

/**
 * @typedef {Object} CreatePermissionDTO
 * @property {string} name - Permission name
 * @property {string} [description] - Permission description
 * @property {string} resource - Resource name (e.g., 'users', 'roles')
 * @property {string} action - Action name (e.g., 'read', 'write', 'delete')
 * @property {boolean} [isActive] - Whether permission is active
 */

/**
 * @typedef {Object} UpdatePermissionDTO
 * @property {string} [name] - Permission name
 * @property {string} [description] - Permission description
 * @property {string} [resource] - Resource name
 * @property {string} [action] - Action name
 * @property {boolean} [isActive] - Whether permission is active
 */

/**
 * @typedef {Object} PermissionResponseDTO
 * @property {string} id - Permission ID
 * @property {string} name - Permission name
 * @property {string} description - Permission description
 * @property {string} resource - Resource name
 * @property {string} action - Action name
 * @property {boolean} isActive - Whether permission is active
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} PermissionFilterDTO
 * @property {string} [name] - Filter by name (partial match)
 * @property {string} [resource] - Filter by resource
 * @property {string} [action] - Filter by action
 * @property {boolean} [isActive] - Filter by active status
 * @property {number} [page] - Page number (default: 1)
 * @property {number} [limit] - Items per page (default: 20, max: 100)
 * @property {string} [sortBy] - Sort field (default: createdAt)
 * @property {string} [sortOrder] - Sort order: asc/desc (default: desc)
 */

/**
 * Validate create permission data
 * @param {CreatePermissionDTO} data - Permission data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateCreatePermission(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Name is required and must be a string');
    } else if (data.name.length < 2 || data.name.length > 100) {
        errors.push('Name must be between 2 and 100 characters');
    }

    if (data.description && typeof data.description !== 'string') {
        errors.push('Description must be a string');
    }

    if (!data.resource || typeof data.resource !== 'string') {
        errors.push('Resource is required and must be a string');
    }

    if (!data.action || typeof data.action !== 'string') {
        errors.push('Action is required and must be a string');
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
 * Validate update permission data
 * @param {UpdatePermissionDTO} data - Permission data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateUpdatePermission(data) {
    const errors = [];

    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('Name must be a string');
        } else if (data.name.length < 2 || data.name.length > 100) {
            errors.push('Name must be between 2 and 100 characters');
        }
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
        errors.push('Description must be a string');
    }

    if (data.resource !== undefined && typeof data.resource !== 'string') {
        errors.push('Resource must be a string');
    }

    if (data.action !== undefined && typeof data.action !== 'string') {
        errors.push('Action must be a string');
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
 * @param {PermissionFilterDTO} data - Filter data
 * @returns {{valid: boolean, errors: string[], sanitized: PermissionFilterDTO}}
 */
export function validatePermissionFilter(data) {
    const errors = [];
    const sanitized = {};

    if (data.name && typeof data.name === 'string') {
        sanitized.name = data.name.trim();
    }

    if (data.resource && typeof data.resource === 'string') {
        sanitized.resource = data.resource.trim();
    }

    if (data.action && typeof data.action === 'string') {
        sanitized.action = data.action.trim();
    }

    if (data.isActive !== undefined && typeof data.isActive === 'boolean') {
        sanitized.isActive = data.isActive;
    }

    // Pagination
    sanitized.page = Math.max(1, parseInt(data.page) || 1);
    sanitized.limit = Math.min(100, Math.max(1, parseInt(data.limit) || 20));

    // Sorting
    const allowedSortFields = ['name', 'resource', 'action', 'createdAt', 'updatedAt'];
    sanitized.sortBy = allowedSortFields.includes(data.sortBy) ? data.sortBy : 'createdAt';
    sanitized.sortOrder = data.sortOrder === 'asc' ? 'asc' : 'desc';

    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Convert permission document to response DTO
 * @param {Object} permission - Permission document
 * @returns {PermissionResponseDTO}
 */
export function toPermissionResponse(permission) {
    return {
        id: permission._id?.toString() || permission.id,
        name: permission.name,
        description: permission.description || '',
        resource: permission.resource,
        action: permission.action,
        isActive: permission.isActive !== false,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
    };
}

/**
 * Convert array of permissions to response DTOs
 * @param {Object[]} permissions - Array of permission documents
 * @returns {PermissionResponseDTO[]}
 */
export function toPermissionResponseArray(permissions) {
    return permissions.map(toPermissionResponse);
}

export default {
    validateCreatePermission,
    validateUpdatePermission,
    validatePermissionFilter,
    toPermissionResponse,
    toPermissionResponseArray
};
