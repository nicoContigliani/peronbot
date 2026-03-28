/**
 * Role DAO (Data Access Object)
 * Handles database operations for roles with performance optimizations
 */

import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Cache for frequently accessed data
const cache = {
    roles: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 500
};

/**
 * Get roles collection with indexes
 * @returns {Promise<Collection>}
 */
async function getCollection() {
    const db = await getDB();
    const collection = db.collection('roles');
    
    // Create indexes for performance (only once)
    if (!getCollection.indexesCreated) {
        await Promise.all([
            collection.createIndex({ name: 1 }, { unique: true }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ permissions: 1 }),
            // Compound indexes for common queries
            collection.createIndex({ isActive: 1, createdAt: -1 })
        ]);
        getCollection.indexesCreated = true;
        logger.info('Role collection indexes created');
    }
    
    return collection;
}

/**
 * Get role from cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = cache.roles.get(key);
    if (cached && Date.now() - cached.timestamp < cache.ttl) {
        return cached.data;
    }
    cache.roles.delete(key);
    return null;
}

/**
 * Set role in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
    if (cache.roles.size >= cache.maxSize) {
        // Remove oldest entries
        const entries = Array.from(cache.roles.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < Math.floor(cache.maxSize * 0.1); i++) {
            cache.roles.delete(entries[i][0]);
        }
    }
    
    cache.roles.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear role cache
 * @param {string} [roleId] - Optional role ID to clear specific cache
 */
function clearCache(roleId) {
    if (roleId) {
        cache.roles.delete(`role:${roleId}`);
    } else {
        cache.roles.clear();
    }
}

/**
 * Create a new role
 * @param {Object} roleData - Role data
 * @returns {Promise<Object>} Created role
 */
export async function createRole(roleData) {
    const collection = await getCollection();
    
    const role = {
        ...roleData,
        isActive: roleData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await collection.insertOne(role);
    
    const createdRole = {
        ...role,
        _id: result.insertedId
    };
    
    // Cache the new role
    setCache(`role:${result.insertedId}`, createdRole);
    
    logger.info(`Role created: ${result.insertedId}`);
    return createdRole;
}

/**
 * Get role by ID
 * @param {string} roleId - Role ID
 * @returns {Promise<Object|null>} Role or null
 */
export async function getRoleById(roleId) {
    // Check cache first
    const cached = getFromCache(`role:${roleId}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let role;
    try {
        role = await collection.findOne({ _id: new ObjectId(roleId) });
    } catch {
        // Invalid ObjectId format
        return null;
    }
    
    if (role) {
        setCache(`role:${roleId}`, role);
    }
    
    return role;
}

/**
 * Get role by name
 * @param {string} name - Role name
 * @returns {Promise<Object|null>} Role or null
 */
export async function getRoleByName(name) {
    // Check cache first
    const cached = getFromCache(`role:name:${name}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const role = await collection.findOne({ name: name.toLowerCase() });
    
    if (role) {
        setCache(`role:name:${name}`, role);
        setCache(`role:${role._id}`, role);
    }
    
    return role;
}

/**
 * Get roles with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<{roles: Object[], total: number}>} Roles and total count
 */
export async function getRoles(filters = {}) {
    const collection = await getCollection();
    
    // Build query
    const query = {};
    
    if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
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
    const [roles, total] = await Promise.all([
        collection
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(query)
    ]);
    
    return {
        roles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Update role by ID
 * @param {string} roleId - Role ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated role or null
 */
export async function updateRole(roleId, updateData) {
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
            { _id: new ObjectId(roleId) },
            update,
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(roleId);
        if (result.name) {
            cache.roles.delete(`role:name:${result.name}`);
        }
        
        logger.info(`Role updated: ${roleId}`);
    }
    
    return result;
}

/**
 * Delete role by ID (soft delete)
 * @param {string} roleId - Role ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteRole(roleId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get role first to clear cache
    const role = await getRoleById(roleId);
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(roleId) },
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
        clearCache(roleId);
        if (role?.name) {
            cache.roles.delete(`role:name:${role.name}`);
        }
        
        logger.info(`Role soft deleted: ${roleId}`);
        return true;
    }
    
    return false;
}

/**
 * Hard delete role by ID
 * @param {string} roleId - Role ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function hardDeleteRole(roleId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get role first to clear cache
    const role = await getRoleById(roleId);
    
    let result;
    try {
        result = await collection.deleteOne({ _id: new ObjectId(roleId) });
    } catch {
        return false;
    }
    
    if (result.deletedCount > 0) {
        // Clear cache
        clearCache(roleId);
        if (role?.name) {
            cache.roles.delete(`role:name:${role.name}`);
        }
        
        logger.info(`Role hard deleted: ${roleId}`);
        return true;
    }
    
    return false;
}

/**
 * Add permission to role
 * @param {string} roleId - Role ID
 * @param {string} permissionId - Permission ID
 * @returns {Promise<Object|null>} Updated role or null
 */
export async function addPermissionToRole(roleId, permissionId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(roleId) },
            {
                $addToSet: { permissions: permissionId },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        clearCache(roleId);
        logger.info(`Permission ${permissionId} added to role ${roleId}`);
    }
    
    return result;
}

/**
 * Remove permission from role
 * @param {string} roleId - Role ID
 * @param {string} permissionId - Permission ID
 * @returns {Promise<Object|null>} Updated role or null
 */
export async function removePermissionFromRole(roleId, permissionId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(roleId) },
            {
                $pull: { permissions: permissionId },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        clearCache(roleId);
        logger.info(`Permission ${permissionId} removed from role ${roleId}`);
    }
    
    return result;
}

/**
 * Get roles by permission
 * @param {string} permissionId - Permission ID
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Roles with the permission
 */
export async function getRolesByPermission(permissionId, options = {}) {
    const collection = await getCollection();
    
    const query = {
        permissions: permissionId,
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
 * Count roles by status
 * @returns {Promise<Object>} Counts by status
 */
export async function countRolesByStatus() {
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
    createRole,
    getRoleById,
    getRoleByName,
    getRoles,
    updateRole,
    deleteRole,
    hardDeleteRole,
    addPermissionToRole,
    removePermissionFromRole,
    getRolesByPermission,
    countRolesByStatus,
    clearCache
};
