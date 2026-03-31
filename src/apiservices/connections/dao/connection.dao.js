/**
 * Connection DAO (Data Access Object)
 * Handles database operations for connections with performance optimizations
 */

import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Cache for frequently accessed data
const cache = {
    connections: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
};

/**
 * Get connections collection with indexes
 * @returns {Promise<Collection>}
 */
async function getCollection() {
    const db = await getDB();
    const collection = db.collection('connections');
    
    // Create indexes for performance (only once)
    if (!getCollection.indexesCreated) {
        await Promise.all([
            collection.createIndex({ name: 1 }, { unique: true }),
            collection.createIndex({ provider: 1 }),
            collection.createIndex({ status: 1 }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ updatedAt: -1 }),
            // Compound indexes for common queries
            collection.createIndex({ isActive: 1, createdAt: -1 }),
            collection.createIndex({ provider: 1, isActive: 1 })
        ]);
        getCollection.indexesCreated = true;
        logger.info('Connection collection indexes created');
    }
    
    return collection;
}

/**
 * Get connection from cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = cache.connections.get(key);
    if (cached && Date.now() - cached.timestamp < cache.ttl) {
        return cached.data;
    }
    cache.connections.delete(key);
    return null;
}

/**
 * Set connection in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
    if (cache.connections.size >= cache.maxSize) {
        // Remove oldest entries
        const entries = Array.from(cache.connections.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < Math.floor(cache.maxSize * 0.1); i++) {
            cache.connections.delete(entries[i][0]);
        }
    }
    
    cache.connections.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear connection cache
 * @param {string} [connectionId] - Optional connection ID to clear specific cache
 */
function clearCache(connectionId) {
    if (connectionId) {
        cache.connections.delete(`connection:${connectionId}`);
    } else {
        cache.connections.clear();
    }
}

/**
 * Create a new connection
 * @param {Object} connectionData - Connection data
 * @returns {Promise<Object>} Created connection
 */
export async function createConnection(connectionData) {
    const collection = await getCollection();
    
    const connection = {
        ...connectionData,
        status: 'disconnected',
        isActive: connectionData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await collection.insertOne(connection);
    
    const createdConnection = {
        ...connection,
        _id: result.insertedId
    };
    
    // Cache the new connection
    setCache(`connection:${result.insertedId}`, createdConnection);
    
    logger.info(`Connection created: ${result.insertedId}`);
    return createdConnection;
}

/**
 * Get connection by ID
 * @param {string} connectionId - Connection ID
 * @returns {Promise<Object|null>} Connection or null
 */
export async function getConnectionById(connectionId) {
    // Check cache first
    const cached = getFromCache(`connection:${connectionId}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let connection;
    try {
        connection = await collection.findOne({ _id: new ObjectId(connectionId) });
    } catch {
        // Invalid ObjectId format
        return null;
    }
    
    if (connection) {
        setCache(`connection:${connectionId}`, connection);
    }
    
    return connection;
}

/**
 * Get connection by name
 * @param {string} name - Connection name
 * @returns {Promise<Object|null>} Connection or null
 */
export async function getConnectionByName(name) {
    // Check cache first
    const cached = getFromCache(`connection:name:${name}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const connection = await collection.findOne({ name: name.toLowerCase() });
    
    if (connection) {
        setCache(`connection:name:${name}`, connection);
        setCache(`connection:${connection._id}`, connection);
    }
    
    return connection;
}

/**
 * Get connections with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<{connections: Object[], total: number}>} Connections and total count
 */
export async function getConnections(filters = {}) {
    const collection = await getCollection();
    
    // Build query
    const query = {};
    
    if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
    }
    
    if (filters.provider) {
        query.provider = filters.provider;
    }
    
    if (filters.status) {
        query.status = filters.status;
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
    const [connections, total] = await Promise.all([
        collection
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(query)
    ]);
    
    return {
        connections,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Update connection by ID
 * @param {string} connectionId - Connection ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated connection or null
 */
export async function updateConnection(connectionId, updateData) {
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
            { _id: new ObjectId(connectionId) },
            update,
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(connectionId);
        if (result.name) {
            cache.connections.delete(`connection:name:${result.name}`);
        }
        
        logger.info(`Connection updated: ${connectionId}`);
    }
    
    return result;
}

/**
 * Update connection status
 * @param {string} connectionId - Connection ID
 * @param {string} status - New status
 * @returns {Promise<Object|null>} Updated connection or null
 */
export async function updateConnectionStatus(connectionId, status) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(connectionId) },
            {
                $set: {
                    status,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(connectionId);
        logger.info(`Connection status updated: ${connectionId} -> ${status}`);
    }
    
    return result;
}

/**
 * Delete connection by ID (soft delete)
 * @param {string} connectionId - Connection ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteConnection(connectionId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(connectionId) },
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
        clearCache(connectionId);
        if (result.name) {
            cache.connections.delete(`connection:name:${result.name}`);
        }
        
        logger.info(`Connection soft deleted: ${connectionId}`);
        return true;
    }
    
    return false;
}

/**
 * Hard delete connection by ID
 * @param {string} connectionId - Connection ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function hardDeleteConnection(connectionId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get connection first to clear cache
    const connection = await getConnectionById(connectionId);
    
    let result;
    try {
        result = await collection.deleteOne({ _id: new ObjectId(connectionId) });
    } catch {
        return false;
    }
    
    if (result.deletedCount > 0) {
        // Clear cache
        clearCache(connectionId);
        if (connection?.name) {
            cache.connections.delete(`connection:name:${connection.name}`);
        }
        
        logger.info(`Connection hard deleted: ${connectionId}`);
        return true;
    }
    
    return false;
}

/**
 * Count connections by status
 * @returns {Promise<Object>} Counts by status
 */
export async function countConnectionsByStatus() {
    const collection = await getCollection();
    
    const result = await collection.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]).toArray();
    
    const counts = {
        connected: 0,
        disconnected: 0,
        connecting: 0,
        error: 0,
        total: 0
    };
    
    result.forEach(item => {
        if (item._id && counts.hasOwnProperty(item._id)) {
            counts[item._id] = item.count;
        }
        counts.total += item.count;
    });
    
    return counts;
}

export default {
    createConnection,
    getConnectionById,
    getConnectionByName,
    getConnections,
    updateConnection,
    updateConnectionStatus,
    deleteConnection,
    hardDeleteConnection,
    countConnectionsByStatus,
    clearCache
};
