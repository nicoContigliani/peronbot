/**
 * Permission DAO (Data Access Object)
 * Handles database operations for permissions with performance optimizations
 */

import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Cache for frequently accessed data
const cache = {
    permissions: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 500
};

/**
 * Get permissions collection with indexes
 * @returns {Promise<Collection>}
 */
async function getCollection() {
    const db = await getDB();
    const collection = db.collection('permissions');
    
    // Create indexes for performance (only once)
    if (!getCollection.indexesCreated) {
        await Promise.all([
            collection.createIndex({ name: 1 }, { unique: true }),
            collection.createIndex({ resource: 1 }),
            collection.createIndex({ action: 1 }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
            // Compound indexes for common queries
            collection.createIndex({ resource: 1, action: 1 }),
            collection.createIndex({ isActive: 1, createdAt: -1 })
        ]);
        getCollection.indexesCreated = true;
        logger.info('Permission collection indexes created');
    }
    
    return collection;
}

/**
 * Get permission from cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = cache.permissions.get(key);
    if (cached && Date.now() - cached.timestamp < cache.ttl) {
        return cached.data;
    }
    cache.permissions.delete(key);
    return null;
}

/**
 * Set permission in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
    if (cache.permissions.size >= cache.maxSize) {
        // Remove oldest entries
        const entries = Array.from(cache.permissions.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < Math.floor(cache.maxSize * 0.1); i++) {
            cache.permissions.delete(entries[i][0]);
        }
    }
    
    cache.permissions.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear permission cache
 * @param {string} [permissionId] - Optional permission ID to clear specific cache
 */
function clearCache(permissionId) {
    if (permissionId) {
        cache.permissions.delete(`permission:${permissionId}`);
    } else {
        cache.permissions.clear();
    }
}

/**
 * Create a new permission
 * @param {Object} permissionData - Permission data
 * @returns {Promise<Object>} Created permission
 */
export async function createPermission(permissionData) {
    const collection = await getCollection();
    
    const permission = {
        ...permissionData,
        isActive: permissionData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await collection.insertOne(permission);
    
    const createdPermission = {
        ...permission,
        _id: result.insertedId
    };
    
    // Cache the new permission
    setCache(`permission:${result.insertedId}`, createdPermission);
    
    logger.info(`Permission created: ${result.insertedId}`);
    return createdPermission;
}

/**
 * Get permission by ID
 * @param {string} permissionId - Permission ID
 * @returns {Promise<Object|null>} Permission or null
 */
export async function getPermissionById(permissionId) {
    // Check cache first
    const cached = getFromCache(`permission:${permissionId}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let permission;
    try {
        permission = await collection.findOne({ _id: new ObjectId(permissionId) });
    } catch {
        // Invalid ObjectId format
        return null;
    }
    
    if (permission) {
        setCache(`permission:${permissionId}`, permission);
    }
    
    return permission;
}

/**
 * Get permission by name
 * @param {string} name - Permission name
 * @returns {Promise<Object|null>} Permission or null
 */
export async function getPermissionByName(name) {
    // Check cache first
    const cached = getFromCache(`permission:name:${name}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const permission = await collection.findOne({ name: name.toLowerCase() });
    
    if (permission) {
        setCache(`permission:name:${name}`, permission);
        setCache(`permission:${permission._id}`, permission);
    }
    
    return permission;
}

/**
 * Get permissions with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<{permissions: Object[], total: number}>} Permissions and total count
 */
export async function getPermissions(filters = {}) {
    const collection = await getCollection();
    
    // Build query
    const query = {};
    
    if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
    }
    
    if (filters.resource) {
        query.resource = { $regex: filters.resource, $options: 'i' };
    }
    
    if (filters.action) {
        query.action = { $regex: filters.action, $options: 'i' };
    }
    
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    // Sorting
    const sort = {};
    sort[filters.sortBy || 'createdAt'] = filters.sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const [permissions, total] = await Promise.all([
        collection
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(query)
    ]);
    
    return {
        permissions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Update permission by ID
 * @param {string} permissionId - Permission ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated permission or null
 */
export async function updatePermission(permissionId, updateData) {
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
            { _id: new ObjectId(permissionId) },
            update,
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(permissionId);
        if (result.name) {
            cache.permissions.delete(`permission:name:${result.name}`);
        }
        
        logger.info(`Permission updated: ${permissionId}`);
    }
    
    return result;
}

/**
 * Delete permission by ID (soft delete)
 * @param {string} permissionId - Permission ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deletePermission(permissionId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get permission first to clear cache
    const permission = await getPermissionById(permissionId);
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(permissionId) },
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
        clearCache(permissionId);
        if (permission?.name) {
            cache.permissions.delete(`permission:name:${permission.name}`);
        }
        
        logger.info(`Permission soft deleted: ${permissionId}`);
        return true;
    }
    
    return false;
}

/**
 * Hard delete permission by ID
 * @param {string} permissionId - Permission ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function hardDeletePermission(permissionId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get permission first to clear cache
    const permission = await getPermissionById(permissionId);
    
    let result;
    try {
        result = await collection.deleteOne({ _id: new ObjectId(permissionId) });
    } catch {
        return false;
    }
    
    if (result.deletedCount > 0) {
        // Clear cache
        clearCache(permissionId);
        if (permission?.name) {
            cache.permissions.delete(`permission:name:${permission.name}`);
        }
        
        logger.info(`Permission hard deleted: ${permissionId}`);
        return true;
    }
    
    return false;
}

/**
 * Get permissions by resource
 * @param {string} resource - Resource name
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Permissions for the resource
 */
export async function getPermissionsByResource(resource, options = {}) {
    const collection = await getCollection();
    
    const query = {
        resource: resource,
        isActive: true
    };
    
    const limit = options.limit || 100;
    const skip = options.skip || 0;
    
    return await collection
        .find(query)
        .sort({ action: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();
}

/**
 * Get permissions by action
 * @param {string} action - Action name
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Permissions for the action
 */
export async function getPermissionsByAction(action, options = {}) {
    const collection = await getCollection();
    
    const query = {
        action: action,
        isActive: true
    };
    
    const limit = options.limit || 100;
    const skip = options.skip || 0;
    
    return await collection
        .find(query)
        .sort({ resource: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();
}

/**
 * Count permissions by status
 * @returns {Promise<Object>} Counts by status
 */
export async function countPermissionsByStatus() {
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
    createPermission,
    getPermissionById,
    getPermissionByName,
    getPermissions,
    updatePermission,
    deletePermission,
    hardDeletePermission,
    getPermissionsByResource,
    getPermissionsByAction,
    countPermissionsByStatus,
    clearCache
};
