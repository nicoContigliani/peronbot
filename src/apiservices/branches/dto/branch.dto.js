/**
 * Branch DTO (Data Transfer Object)
 * Defines data structure for branch operations
 */

/**
 * @typedef {Object} CreateBranchDTO
 * @property {string} name - Branch name
 * @property {string} companyId - Company ID
 * @property {string} [email] - Branch email
 * @property {string} [phone] - Branch phone
 * @property {string} [address] - Branch address
 * @property {string} [city] - Branch city
 * @property {string} [province] - Branch province
 * @property {string} [country] - Branch country
 * @property {string} [code] - Branch code
 * @property {boolean} [isActive] - Whether branch is active
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} UpdateBranchDTO
 * @property {string} [name] - Branch name
 * @property {string} [email] - Branch email
 * @property {string} [phone] - Branch phone
 * @property {string} [address] - Branch address
 * @property {string} [city] - Branch city
 * @property {string} [province] - Branch province
 * @property {string} [country] - Branch country
 * @property {string} [code] - Branch code
 * @property {boolean} [isActive] - Whether branch is active
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} BranchResponseDTO
 * @property {string} id - Branch ID
 * @property {string} name - Branch name
 * @property {string} companyId - Company ID
 * @property {string} [email] - Branch email
 * @property {string} [phone] - Branch phone
 * @property {string} [address] - Branch address
 * @property {string} [city] - Branch city
 * @property {string} [province] - Branch province
 * @property {string} [country] - Branch country
 * @property {string} [code] - Branch code
 * @property {boolean} isActive - Whether branch is active
 * @property {Object} metadata - Additional metadata
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} BranchFilterDTO
 * @property {string} [name] - Filter by name (partial match)
 * @property {string} [companyId] - Filter by company ID
 * @property {string} [email] - Filter by email (partial match)
 * @property {boolean} [isActive] - Filter by active status
 * @property {Date} [createdAfter] - Filter by creation date
 * @property {Date} [createdBefore] - Filter by creation date
 * @property {number} [page] - Page number (default: 1)
 * @property {number} [limit] - Items per page (default: 20, max: 100)
 * @property {string} [sortBy] - Sort field (default: createdAt)
 * @property {string} [sortOrder] - Sort order: asc/desc (default: desc)
 */

/**
 * Validate create branch data
 * @param {CreateBranchDTO} data - Branch data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateCreateBranch(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Name is required and must be a string');
    } else if (data.name.length < 2 || data.name.length > 200) {
        errors.push('Name must be between 2 and 200 characters');
    }

    if (!data.companyId || typeof data.companyId !== 'string') {
        errors.push('Company ID is required and must be a string');
    }

    if (data.email && typeof data.email !== 'string') {
        errors.push('Email must be a string');
    } else if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }

    if (data.phone && typeof data.phone !== 'string') {
        errors.push('Phone must be a string');
    }

    if (data.address && typeof data.address !== 'string') {
        errors.push('Address must be a string');
    }

    if (data.city && typeof data.city !== 'string') {
        errors.push('City must be a string');
    }

    if (data.province && typeof data.province !== 'string') {
        errors.push('Province must be a string');
    }

    if (data.country && typeof data.country !== 'string') {
        errors.push('Country must be a string');
    }

    if (data.code && typeof data.code !== 'string') {
        errors.push('Code must be a string');
    }

    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
        errors.push('isActive must be a boolean');
    }

    if (data.metadata && typeof data.metadata !== 'object') {
        errors.push('Metadata must be an object');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate update branch data
 * @param {UpdateBranchDTO} data - Branch data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateUpdateBranch(data) {
    const errors = [];

    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('Name must be a string');
        } else if (data.name.length < 2 || data.name.length > 200) {
            errors.push('Name must be between 2 and 200 characters');
        }
    }

    if (data.email !== undefined) {
        if (typeof data.email !== 'string') {
            errors.push('Email must be a string');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Invalid email format');
        }
    }

    if (data.phone !== undefined && typeof data.phone !== 'string') {
        errors.push('Phone must be a string');
    }

    if (data.address !== undefined && typeof data.address !== 'string') {
        errors.push('Address must be a string');
    }

    if (data.city !== undefined && typeof data.city !== 'string') {
        errors.push('City must be a string');
    }

    if (data.province !== undefined && typeof data.province !== 'string') {
        errors.push('Province must be a string');
    }

    if (data.country !== undefined && typeof data.country !== 'string') {
        errors.push('Country must be a string');
    }

    if (data.code !== undefined && typeof data.code !== 'string') {
        errors.push('Code must be a string');
    }

    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
        errors.push('isActive must be a boolean');
    }

    if (data.metadata !== undefined && typeof data.metadata !== 'object') {
        errors.push('Metadata must be an object');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate filter data
 * @param {BranchFilterDTO} data - Filter data
 * @returns {{valid: boolean, errors: string[], sanitized: BranchFilterDTO}}
 */
export function validateBranchFilter(data) {
    const errors = [];
    const sanitized = {};

    if (data.name && typeof data.name === 'string') {
        sanitized.name = data.name.trim();
    }

    if (data.companyId && typeof data.companyId === 'string') {
        sanitized.companyId = data.companyId;
    }

    if (data.email && typeof data.email === 'string') {
        sanitized.email = data.email.trim();
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
    const allowedSortFields = ['name', 'email', 'createdAt', 'updatedAt'];
    sanitized.sortBy = allowedSortFields.includes(data.sortBy) ? data.sortBy : 'createdAt';
    sanitized.sortOrder = data.sortOrder === 'asc' ? 'asc' : 'desc';

    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Convert branch document to response DTO
 * @param {Object} branch - Branch document
 * @returns {BranchResponseDTO}
 */
export function toBranchResponse(branch) {
    return {
        id: branch._id?.toString() || branch.id,
        name: branch.name,
        companyId: branch.companyId,
        email: branch.email,
        phone: branch.phone,
        address: branch.address,
        city: branch.city,
        province: branch.province,
        country: branch.country,
        code: branch.code,
        isActive: branch.isActive !== false,
        metadata: branch.metadata || {},
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt
    };
}

/**
 * Convert array of branches to response DTOs
 * @param {Object[]} branches - Array of branch documents
 * @returns {BranchResponseDTO[]}
 */
export function toBranchResponseArray(branches) {
    return branches.map(toBranchResponse);
}

export default {
    validateCreateBranch,
    validateUpdateBranch,
    validateBranchFilter,
    toBranchResponse,
    toBranchResponseArray
};
