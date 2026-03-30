/**
 * Branch DAO (Data Access Object)
 * Handles database operations for branches with performance optimizations
 */

import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Cache for frequently accessed data
const cache = {
    branches: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
};

/**
 * Get branches collection with indexes
 * @returns {Promise<Collection>}
 */
async function getCollection() {
    const db = await getDB();
    const collection = db.collection('branches');
    
    // Create indexes for performance (only once)
    if (!getCollection.indexesCreated) {
        await Promise.all([
            collection.createIndex({ name: 1 }),
            collection.createIndex({ companyId: 1 }),
            collection.createIndex({ email: 1 }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ updatedAt: -1 }),
            // Compound indexes for common queries
            collection.createIndex({ companyId: 1, isActive: 1 }),
            collection.createIndex({ companyId: 1, createdAt: -1 })
        ]);
        getCollection.indexesCreated = true;
        logger.info('Branch collection indexes created');
    }
    
    return collection;
}

/**
 * Get branch from cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = cache.branches.get(key);
    if (cached && Date.now() - cached.timestamp < cache.ttl) {
        return cached.data;
    }
    cache.branches.delete(key);
    return null;
}

/**
 * Set branch in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
    if (cache.branches.size >= cache.maxSize) {
        // Remove oldest entries
        const entries = Array.from(cache.branches.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < Math.floor(cache.maxSize * 0.1); i++) {
            cache.branches.delete(entries[i][0]);
        }
    }
    
    cache.branches.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear branch cache
 * @param {string} [branchId] - Optional branch ID to clear specific cache
 */
function clearCache(branchId) {
    if (branchId) {
        cache.branches.delete(`branch:${branchId}`);
    } else {
        cache.branches.clear();
    }
}

/**
 * Create a new branch
 * @param {Object} branchData - Branch data
 * @returns {Promise<Object>} Created branch
 */
export async function createBranch(branchData) {
    const collection = await getCollection();
    
    const branch = {
        ...branchData,
        isActive: branchData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await collection.insertOne(branch);
    
    const createdBranch = {
        ...branch,
        _id: result.insertedId
    };
    
    // Cache the new branch
    setCache(`branch:${result.insertedId}`, createdBranch);
    
    logger.info(`Branch created: ${result.insertedId}`);
    return createdBranch;
}

/**
 * Get branch by ID
 * @param {string} branchId - Branch ID
 * @returns {Promise<Object|null>} Branch or null
 */
export async function getBranchById(branchId) {
    // Check cache first
    const cached = getFromCache(`branch:${branchId}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let branch;
    try {
        branch = await collection.findOne({ _id: new ObjectId(branchId) });
    } catch {
        // Invalid ObjectId format
        return null;
    }
    
    if (branch) {
        setCache(`branch:${branchId}`, branch);
    }
    
    return branch;
}

/**
 * Get branches by company ID
 * @param {string} companyId - Company ID
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Branches
 */
export async function getBranchesByCompanyId(companyId, options = {}) {
    const collection = await getCollection();
    
    const query = {
        companyId: companyId,
        isActive: true
    };
    
    const limit = options.limit || 100;
    const skip = options.skip || 0;
    
    return await collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
}

/**
 * Get branches with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<{branches: Object[], total: number}>} Branches and total count
 */
export async function getBranches(filters = {}) {
    const collection = await getCollection();
    
    // Build query
    const query = {};
    
    if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
    }
    
    if (filters.companyId) {
        query.companyId = filters.companyId;
    }
    
    if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
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
    const [branches, total] = await Promise.all([
        collection
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(query)
    ]);
    
    return {
        branches,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Update branch by ID
 * @param {string} branchId - Branch ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated branch or null
 */
export async function updateBranch(branchId, updateData) {
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
            { _id: new ObjectId(branchId) },
            update,
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(branchId);
        
        logger.info(`Branch updated: ${branchId}`);
    }
    
    return result;
}

/**
 * Delete branch by ID (soft delete)
 * @param {string} branchId - Branch ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteBranch(branchId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(branchId) },
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
        clearCache(branchId);
        
        logger.info(`Branch soft deleted: ${branchId}`);
        return true;
    }
    
    return false;
}

/**
 * Hard delete branch by ID
 * @param {string} branchId - Branch ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function hardDeleteBranch(branchId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.deleteOne({ _id: new ObjectId(branchId) });
    } catch {
        return false;
    }
    
    if (result.deletedCount > 0) {
        // Clear cache
        clearCache(branchId);
        
        logger.info(`Branch hard deleted: ${branchId}`);
        return true;
    }
    
    return false;
}

/**
 * Count branches by company
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Counts by status
 */
export async function countBranchesByCompany(companyId) {
    const collection = await getCollection();
    
    const result = await collection.aggregate([
        {
            $match: { companyId: companyId }
        },
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
    createBranch,
    getBranchById,
    getBranchesByCompanyId,
    getBranches,
    updateBranch,
    deleteBranch,
    hardDeleteBranch,
    countBranchesByCompany,
    clearCache
};
