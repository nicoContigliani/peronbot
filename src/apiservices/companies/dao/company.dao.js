/**
 * Company DAO (Data Access Object)
 * Handles database operations for companies with performance optimizations
 */

import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Cache for frequently accessed data
const cache = {
    companies: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
};

/**
 * Get companies collection with indexes
 * @returns {Promise<Collection>}
 */
async function getCollection() {
    const db = await getDB();
    const collection = db.collection('companies');
    
    // Create indexes for performance (only once)
    if (!getCollection.indexesCreated) {
        await Promise.all([
            collection.createIndex({ name: 1 }),
            collection.createIndex({ email: 1 }, { unique: true }),
            collection.createIndex({ cuit: 1 }, { unique: true }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ updatedAt: -1 }),
            // Compound indexes for common queries
            collection.createIndex({ isActive: 1, createdAt: -1 }),
            collection.createIndex({ name: 1, isActive: 1 })
        ]);
        getCollection.indexesCreated = true;
        logger.info('Company collection indexes created');
    }
    
    return collection;
}

/**
 * Get company from cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = cache.companies.get(key);
    if (cached && Date.now() - cached.timestamp < cache.ttl) {
        return cached.data;
    }
    cache.companies.delete(key);
    return null;
}

/**
 * Set company in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
    if (cache.companies.size >= cache.maxSize) {
        // Remove oldest entries
        const entries = Array.from(cache.companies.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < Math.floor(cache.maxSize * 0.1); i++) {
            cache.companies.delete(entries[i][0]);
        }
    }
    
    cache.companies.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear company cache
 * @param {string} [companyId] - Optional company ID to clear specific cache
 */
function clearCache(companyId) {
    if (companyId) {
        cache.companies.delete(`company:${companyId}`);
    } else {
        cache.companies.clear();
    }
}

/**
 * Create a new company
 * @param {Object} companyData - Company data
 * @returns {Promise<Object>} Created company
 */
export async function createCompany(companyData) {
    const collection = await getCollection();
    
    const company = {
        ...companyData,
        isActive: companyData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await collection.insertOne(company);
    
    const createdCompany = {
        ...company,
        _id: result.insertedId
    };
    
    // Cache the new company
    setCache(`company:${result.insertedId}`, createdCompany);
    
    logger.info(`Company created: ${result.insertedId}`);
    return createdCompany;
}

/**
 * Get company by ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object|null>} Company or null
 */
export async function getCompanyById(companyId) {
    // Check cache first
    const cached = getFromCache(`company:${companyId}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let company;
    try {
        company = await collection.findOne({ _id: new ObjectId(companyId) });
    } catch {
        // Invalid ObjectId format
        return null;
    }
    
    if (company) {
        setCache(`company:${companyId}`, company);
    }
    
    return company;
}

/**
 * Get company by email
 * @param {string} email - Company email
 * @returns {Promise<Object|null>} Company or null
 */
export async function getCompanyByEmail(email) {
    // Check cache first
    const cached = getFromCache(`company:email:${email}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const company = await collection.findOne({ email: email.toLowerCase() });
    
    if (company) {
        setCache(`company:email:${email}`, company);
        setCache(`company:${company._id}`, company);
    }
    
    return company;
}

/**
 * Get company by CUIT
 * @param {string} cuit - Company CUIT
 * @returns {Promise<Object|null>} Company or null
 */
export async function getCompanyByCuit(cuit) {
    // Check cache first
    const cached = getFromCache(`company:cuit:${cuit}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const company = await collection.findOne({ cuit: cuit });
    
    if (company) {
        setCache(`company:cuit:${cuit}`, company);
        setCache(`company:${company._id}`, company);
    }
    
    return company;
}

/**
 * Get companies with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<{companies: Object[], total: number}>} Companies and total count
 */
export async function getCompanies(filters = {}) {
    const collection = await getCollection();
    
    // Build query
    const query = {};
    
    if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
    }
    
    if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
    }
    
    if (filters.cuit) {
        query.cuit = { $regex: filters.cuit, $options: 'i' };
    }
    
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    
    if (filters.createdAfter || filters.createdBefore) {
        query.createdAt = {};
        if (filters.createdAfter) {
            query.createdAt.$gte = filters.createdAfter;
        }
        if (filters.createdBefore) {
            query.createdAt.$lte = filters.createdBefore;
        }
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    // Sorting
    const sort = {};
    sort[filters.sortBy || 'createdAt'] = filters.sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const [companies, total] = await Promise.all([
        collection
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(query)
    ]);
    
    return {
        companies,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Update company by ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated company or null
 */
export async function updateCompany(companyId, updateData) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    const update = {
        $set: {
            ...updateData,
            updatedAt: new Date()
        }
    };
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(companyId) },
            update,
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(companyId);
        if (result.email) {
            cache.companies.delete(`company:email:${result.email}`);
        }
        if (result.cuit) {
            cache.companies.delete(`company:cuit:${result.cuit}`);
        }
        
        logger.info(`Company updated: ${companyId}`);
    }
    
    return result;
}

/**
 * Delete company by ID (soft delete)
 * @param {string} companyId - Company ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteCompany(companyId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(companyId) },
            {
                $set: {
                    isActive: false,
                    deletedAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
    } catch {
        return false;
    }
    
    if (result) {
        // Clear cache
        clearCache(companyId);
        if (result.email) {
            cache.companies.delete(`company:email:${result.email}`);
        }
        if (result.cuit) {
            cache.companies.delete(`company:cuit:${result.cuit}`);
        }
        
        logger.info(`Company soft deleted: ${companyId}`);
        return true;
    }
    
    return false;
}

/**
 * Hard delete company by ID
 * @param {string} companyId - Company ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function hardDeleteCompany(companyId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get company first to clear cache
    const company = await getCompanyById(companyId);
    
    let result;
    try {
        result = await collection.deleteOne({ _id: new ObjectId(companyId) });
    } catch {
        return false;
    }
    
    if (result.deletedCount > 0) {
        // Clear cache
        clearCache(companyId);
        if (company?.email) {
            cache.companies.delete(`company:email:${company.email}`);
        }
        if (company?.cuit) {
            cache.companies.delete(`company:cuit:${company.cuit}`);
        }
        
        logger.info(`Company hard deleted: ${companyId}`);
        return true;
    }
    
    return false;
}

/**
 * Count companies by status
 * @returns {Promise<Object>} Counts by status
 */
export async function countCompaniesByStatus() {
    const collection = await getCollection();
    
    const result = await collection.aggregate([
        {
            $group: {
                _id: '$isActive',
                count: { $sum: 1 }
            }
        }
    ]).toArray();
    
    const counts = {
        active: 0,
        inactive: 0,
        total: 0
    };
    
    result.forEach(item => {
        if (item._id === true) {
            counts.active = item.count;
        } else {
            counts.inactive = item.count;
        }
        counts.total += item.count;
    });
    
    return counts;
}

export default {
    createCompany,
    getCompanyById,
    getCompanyByEmail,
    getCompanyByCuit,
    getCompanies,
    updateCompany,
    deleteCompany,
    hardDeleteCompany,
    countCompaniesByStatus,
    clearCache
};
