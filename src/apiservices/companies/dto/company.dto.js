/**
 * Company DTO (Data Transfer Object)
 * Defines data structure for company operations
 */

/**
 * @typedef {Object} CreateCompanyDTO
 * @property {string} name - Company name
 * @property {string} email - Company email
 * @property {string} cuit - Company CUIT (tax ID)
 * @property {string} [phone] - Company phone
 * @property {string} [address] - Company address
 * @property {string} [city] - Company city
 * @property {string} [province] - Company province
 * @property {string} [country] - Company country
 * @property {string} [website] - Company website
 * @property {string} [logo] - Company logo URL
 * @property {boolean} [isActive] - Whether company is active
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} UpdateCompanyDTO
 * @property {string} [name] - Company name
 * @property {string} [email] - Company email
 * @property {string} [cuit] - Company CUIT
 * @property {string} [phone] - Company phone
 * @property {string} [address] - Company address
 * @property {string} [city] - Company city
 * @property {string} [province] - Company province
 * @property {string} [country] - Company country
 * @property {string} [website] - Company website
 * @property {string} [logo] - Company logo URL
 * @property {boolean} [isActive] - Whether company is active
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} CompanyResponseDTO
 * @property {string} id - Company ID
 * @property {string} name - Company name
 * @property {string} email - Company email
 * @property {string} cuit - Company CUIT
 * @property {string} [phone] - Company phone
 * @property {string} [address] - Company address
 * @property {string} [city] - Company city
 * @property {string} [province] - Company province
 * @property {string} [country] - Company country
 * @property {string} [website] - Company website
 * @property {string} [logo] - Company logo URL
 * @property {boolean} isActive - Whether company is active
 * @property {Object} metadata - Additional metadata
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} CompanyFilterDTO
 * @property {string} [name] - Filter by name (partial match)
 * @property {string} [email] - Filter by email (partial match)
 * @property {string} [cuit] - Filter by CUIT (partial match)
 * @property {boolean} [isActive] - Filter by active status
 * @property {Date} [createdAfter] - Filter by creation date
 * @property {Date} [createdBefore] - Filter by creation date
 * @property {number} [page] - Page number (default: 1)
 * @property {number} [limit] - Items per page (default: 20, max: 100)
 * @property {string} [sortBy] - Sort field (default: createdAt)
 * @property {string} [sortOrder] - Sort order: asc/desc (default: desc)
 */

/**
 * Validate create company data
 * @param {CreateCompanyDTO} data - Company data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateCreateCompany(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Name is required and must be a string');
    } else if (data.name.length < 2 || data.name.length > 200) {
        errors.push('Name must be between 2 and 200 characters');
    }

    if (!data.email || typeof data.email !== 'string') {
        errors.push('Email is required and must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }

    if (!data.cuit || typeof data.cuit !== 'string') {
        errors.push('CUIT is required and must be a string');
    } else if (!/^\d{2}-\d{8}-\d{1}$/.test(data.cuit) && !/^\d{11}$/.test(data.cuit)) {
        errors.push('Invalid CUIT format (expected: XX-XXXXXXXX-X or XXXXXXXXXXX)');
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

    if (data.website && typeof data.website !== 'string') {
        errors.push('Website must be a string');
    }

    if (data.logo && typeof data.logo !== 'string') {
        errors.push('Logo must be a string');
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
 * Validate update company data
 * @param {UpdateCompanyDTO} data - Company data
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateUpdateCompany(data) {
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

    if (data.cuit !== undefined) {
        if (typeof data.cuit !== 'string') {
            errors.push('CUIT must be a string');
        } else if (!/^\d{2}-\d{8}-\d{1}$/.test(data.cuit) && !/^\d{11}$/.test(data.cuit)) {
            errors.push('Invalid CUIT format (expected: XX-XXXXXXXX-X or XXXXXXXXXXX)');
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

    if (data.website !== undefined && typeof data.website !== 'string') {
        errors.push('Website must be a string');
    }

    if (data.logo !== undefined && typeof data.logo !== 'string') {
        errors.push('Logo must be a string');
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
 * @param {CompanyFilterDTO} data - Filter data
 * @returns {{valid: boolean, errors: string[], sanitized: CompanyFilterDTO}}
 */
export function validateCompanyFilter(data) {
    const errors = [];
    const sanitized = {};

    if (data.name && typeof data.name === 'string') {
        sanitized.name = data.name.trim();
    }

    if (data.email && typeof data.email === 'string') {
        sanitized.email = data.email.trim();
    }

    if (data.cuit && typeof data.cuit === 'string') {
        sanitized.cuit = data.cuit.trim();
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
    const allowedSortFields = ['name', 'email', 'cuit', 'createdAt', 'updatedAt'];
    sanitized.sortBy = allowedSortFields.includes(data.sortBy) ? data.sortBy : 'createdAt';
    sanitized.sortOrder = data.sortOrder === 'asc' ? 'asc' : 'desc';

    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Convert company document to response DTO
 * @param {Object} company - Company document
 * @returns {CompanyResponseDTO}
 */
export function toCompanyResponse(company) {
    return {
        id: company._id?.toString() || company.id,
        name: company.name,
        email: company.email,
        cuit: company.cuit,
        phone: company.phone,
        address: company.address,
        city: company.city,
        province: company.province,
        country: company.country,
        website: company.website,
        logo: company.logo,
        isActive: company.isActive !== false,
        metadata: company.metadata || {},
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
    };
}

/**
 * Convert array of companies to response DTOs
 * @param {Object[]} companies - Array of company documents
 * @returns {CompanyResponseDTO[]}
 */
export function toCompanyResponseArray(companies) {
    return companies.map(toCompanyResponse);
}

export default {
    validateCreateCompany,
    validateUpdateCompany,
    validateCompanyFilter,
    toCompanyResponse,
    toCompanyResponseArray
};
