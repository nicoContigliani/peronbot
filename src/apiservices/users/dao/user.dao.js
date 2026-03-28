/**
 * User DAO (Data Access Object)
 * Handles database operations for users with performance optimizations
 */

import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Cache for frequently accessed data
const cache = {
    users: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
};

/**
 * Get users collection with indexes
 * @returns {Promise<Collection>}
 */
async function getCollection() {
    const db = await getDB();
    const collection = db.collection('users');
    
    // Create indexes for performance (only once)
    if (!getCollection.indexesCreated) {
        await Promise.all([
            collection.createIndex({ email: 1 }, { unique: true }),
            collection.createIndex({ name: 1 }),
            collection.createIndex({ roles: 1 }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ updatedAt: -1 }),
            // Compound indexes for common queries
            collection.createIndex({ isActive: 1, createdAt: -1 }),
            collection.createIndex({ roles: 1, isActive: 1 })
        ]);
        getCollection.indexesCreated = true;
        logger.info('User collection indexes created');
    }
    
    return collection;
}

/**
 * Get user from cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = cache.users.get(key);
    if (cached && Date.now() - cached.timestamp < cache.ttl) {
        return cached.data;
    }
    cache.users.delete(key);
    return null;
}

/**
 * Set user in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
    if (cache.users.size >= cache.maxSize) {
        // Remove oldest entries
        const entries = Array.from(cache.users.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < Math.floor(cache.maxSize * 0.1); i++) {
            cache.users.delete(entries[i][0]);
        }
    }
    
    cache.users.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear user cache
 * @param {string} [userId] - Optional user ID to clear specific cache
 */
function clearCache(userId) {
    if (userId) {
        cache.users.delete(`user:${userId}`);
    } else {
        cache.users.clear();
    }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData) {
    const collection = await getCollection();
    
    const user = {
        ...userData,
        isActive: userData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await collection.insertOne(user);
    
    const createdUser = {
        ...user,
        _id: result.insertedId
    };
    
    // Cache the new user
    setCache(`user:${result.insertedId}`, createdUser);
    
    logger.info(`User created: ${result.insertedId}`);
    return createdUser;
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User or null
 */
export async function getUserById(userId) {
    // Check cache first
    const cached = getFromCache(`user:${userId}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let user;
    try {
        user = await collection.findOne({ _id: new ObjectId(userId) });
    } catch {
        // Invalid ObjectId format
        return null;
    }
    
    if (user) {
        setCache(`user:${userId}`, user);
    }
    
    return user;
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User or null
 */
export async function getUserByEmail(email) {
    // Check cache first
    const cached = getFromCache(`user:email:${email}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const user = await collection.findOne({ email: email.toLowerCase() });
    
    if (user) {
        setCache(`user:email:${email}`, user);
        setCache(`user:${user._id}`, user);
    }
    
    return user;
}

/**
 * Get users with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<{users: Object[], total: number}>} Users and total count
 */
export async function getUsers(filters = {}) {
    const collection = await getCollection();
    
    // Build query
    const query = {};
    
    if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
    }
    
    if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
    }
    
    if (filters.roles && filters.roles.length > 0) {
        query.roles = { $in: filters.roles };
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
    
    // Execute query with projection for performance
    const projection = {
        password: 0 // Exclude password from results
    };
    
    const [users, total] = await Promise.all([
        collection
            .find(query)
            .project(projection)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(query)
    ]);
    
    return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Update user by ID
 * @param {string} userId - User ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated user or null
 */
export async function updateUser(userId, updateData) {
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
            { _id: new ObjectId(userId) },
            update,
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(userId);
        if (result.email) {
            cache.users.delete(`user:email:${result.email}`);
        }
        
        logger.info(`User updated: ${userId}`);
    }
    
    return result;
}

/**
 * Delete user by ID (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteUser(userId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
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
        clearCache(userId);
        if (result.email) {
            cache.users.delete(`user:email:${result.email}`);
        }
        
        logger.info(`User soft deleted: ${userId}`);
        return true;
    }
    
    return false;
}

/**
 * Hard delete user by ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function hardDeleteUser(userId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get user first to clear cache
    const user = await getUserById(userId);
    
    let result;
    try {
        result = await collection.deleteOne({ _id: new ObjectId(userId) });
    } catch {
        return false;
    }
    
    if (result.deletedCount > 0) {
        // Clear cache
        clearCache(userId);
        if (user?.email) {
            cache.users.delete(`user:email:${user.email}`);
        }
        
        logger.info(`User hard deleted: ${userId}`);
        return true;
    }
    
    return false;
}

/**
 * Add role to user
 * @param {string} userId - User ID
 * @param {string} roleId - Role ID
 * @returns {Promise<Object|null>} Updated user or null
 */
export async function addRoleToUser(userId, roleId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            {
                $addToSet: { roles: roleId },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        clearCache(userId);
        logger.info(`Role ${roleId} added to user ${userId}`);
    }
    
    return result;
}

/**
 * Remove role from user
 * @param {string} userId - User ID
 * @param {string} roleId - Role ID
 * @returns {Promise<Object|null>} Updated user or null
 */
export async function removeRoleFromUser(userId, roleId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            {
                $pull: { roles: roleId },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        clearCache(userId);
        logger.info(`Role ${roleId} removed from user ${userId}`);
    }
    
    return result;
}

/**
 * Get users by role
 * @param {string} roleId - Role ID
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Users with the role
 */
export async function getUsersByRole(roleId, options = {}) {
    const collection = await getCollection();
    
    const query = {
        roles: roleId,
        isActive: true
    };
    
    const limit = options.limit || 100;
    const skip = options.skip || 0;
    
    return await collection
        .find(query)
        .project({ password: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
}

/**
 * Count users by status
 * @returns {Promise<Object>} Counts by status
 */
export async function countUsersByStatus() {
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
    createUser,
    getUserById,
    getUserByEmail,
    getUsers,
    updateUser,
    deleteUser,
    hardDeleteUser,
    addRoleToUser,
    removeRoleFromUser,
    getUsersByRole,
    countUsersByStatus,
    clearCache
};
