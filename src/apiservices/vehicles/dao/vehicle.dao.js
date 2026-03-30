/**
 * Vehicle DAO (Data Access Object)
 * Handles database operations for vehicles
 */

import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Cache for frequently accessed data
const cache = {
    vehicles: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
};

/**
 * Get vehicles collection with indexes
 * @returns {Promise<Collection>}
 */
async function getCollection() {
    const db = await getDB();
    const collection = db.collection('vehicles');
    
    // Create indexes for performance (only once)
    if (!getCollection.indexesCreated) {
        await Promise.all([
            collection.createIndex({ placa: 1 }, { unique: true }),
            collection.createIndex({ repartidor_id: 1 }),
            collection.createIndex({ tipo: 1 }),
            collection.createIndex({ marca: 1 }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ updatedAt: -1 }),
            // Compound indexes for common queries
            collection.createIndex({ isActive: 1, createdAt: -1 }),
            collection.createIndex({ repartidor_id: 1, isActive: 1 }),
            collection.createIndex({ tipo: 1, isActive: 1 })
        ]);
        getCollection.indexesCreated = true;
        logger.info('Vehicle collection indexes created');
    }
    
    return collection;
}

/**
 * Get vehicle from cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = cache.vehicles.get(key);
    if (cached && Date.now() - cached.timestamp < cache.ttl) {
        return cached.data;
    }
    cache.vehicles.delete(key);
    return null;
}

/**
 * Set vehicle in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
    if (cache.vehicles.size >= cache.maxSize) {
        // Remove oldest entries
        const entries = Array.from(cache.vehicles.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < Math.floor(cache.maxSize * 0.1); i++) {
            cache.vehicles.delete(entries[i][0]);
        }
    }
    
    cache.vehicles.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear vehicle cache
 * @param {string} [vehicleId] - Optional vehicle ID to clear specific cache
 */
function clearCache(vehicleId) {
    if (vehicleId) {
        cache.vehicles.delete(`vehicle:${vehicleId}`);
    } else {
        cache.vehicles.clear();
    }
}

/**
 * Create a new vehicle
 * @param {Object} vehicleData - Vehicle data
 * @returns {Promise<Object>} Created vehicle
 */
export async function createVehicle(vehicleData) {
    const collection = await getCollection();
    
    const vehicle = {
        ...vehicleData,
        isActive: vehicleData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await collection.insertOne(vehicle);
    
    const createdVehicle = {
        ...vehicle,
        _id: result.insertedId
    };
    
    // Cache the new vehicle
    setCache(`vehicle:${result.insertedId}`, createdVehicle);
    
    logger.info(`Vehicle created: ${result.insertedId}`);
    return createdVehicle;
}

/**
 * Get vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object|null>} Vehicle or null
 */
export async function getVehicleById(vehicleId) {
    // Check cache first
    const cached = getFromCache(`vehicle:${vehicleId}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let vehicle;
    try {
        vehicle = await collection.findOne({ _id: new ObjectId(vehicleId) });
    } catch {
        // Invalid ObjectId format
        return null;
    }
    
    if (vehicle) {
        setCache(`vehicle:${vehicleId}`, vehicle);
    }
    
    return vehicle;
}

/**
 * Get vehicle by placa
 * @param {string} placa - Vehicle placa
 * @returns {Promise<Object|null>} Vehicle or null
 */
export async function getVehicleByPlaca(placa) {
    // Check cache first
    const cached = getFromCache(`vehicle:placa:${placa}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const vehicle = await collection.findOne({ placa: placa.toUpperCase() });
    
    if (vehicle) {
        setCache(`vehicle:placa:${placa}`, vehicle);
        setCache(`vehicle:${vehicle._id}`, vehicle);
    }
    
    return vehicle;
}

/**
 * Get vehicles with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<{vehicles: Object[], total: number}>} Vehicles and total count
 */
export async function getVehicles(filters = {}) {
    const collection = await getCollection();
    
    // Build query
    const query = {};
    
    if (filters.placa) {
        query.placa = { $regex: filters.placa, $options: 'i' };
    }
    
    if (filters.tipo) {
        query.tipo = filters.tipo;
    }
    
    if (filters.marca) {
        query.marca = { $regex: filters.marca, $options: 'i' };
    }
    
    if (filters.modelo) {
        query.modelo = { $regex: filters.modelo, $options: 'i' };
    }
    
    if (filters.color) {
        query.color = { $regex: filters.color, $options: 'i' };
    }
    
    if (filters.repartidor_id) {
        query.repartidor_id = filters.repartidor_id;
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
    const [vehicles, total] = await Promise.all([
        collection
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(query)
    ]);
    
    return {
        vehicles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Get vehicles by repartidor ID
 * @param {string} repartidorId - Repartidor ID
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Vehicles for the repartidor
 */
export async function getVehiclesByRepartidor(repartidorId, options = {}) {
    const collection = await getCollection();
    
    const query = {
        repartidor_id: repartidorId,
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
 * Get vehicles by type
 * @param {string} tipo - Vehicle type
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Vehicles of the type
 */
export async function getVehiclesByType(tipo, options = {}) {
    const collection = await getCollection();
    
    const query = {
        tipo,
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
 * Update vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated vehicle or null
 */
export async function updateVehicle(vehicleId, updateData) {
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
            { _id: new ObjectId(vehicleId) },
            update,
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(vehicleId);
        if (result.placa) {
            cache.vehicles.delete(`vehicle:placa:${result.placa}`);
        }
        
        logger.info(`Vehicle updated: ${vehicleId}`);
    }
    
    return result;
}

/**
 * Delete vehicle by ID (soft delete)
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteVehicle(vehicleId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(vehicleId) },
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
        clearCache(vehicleId);
        if (result.placa) {
            cache.vehicles.delete(`vehicle:placa:${result.placa}`);
        }
        
        logger.info(`Vehicle soft deleted: ${vehicleId}`);
        return true;
    }
    
    return false;
}

/**
 * Hard delete vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function hardDeleteVehicle(vehicleId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get vehicle first to clear cache
    const vehicle = await getVehicleById(vehicleId);
    
    let result;
    try {
        result = await collection.deleteOne({ _id: new ObjectId(vehicleId) });
    } catch {
        return false;
    }
    
    if (result.deletedCount > 0) {
        // Clear cache
        clearCache(vehicleId);
        if (vehicle?.placa) {
            cache.vehicles.delete(`vehicle:placa:${vehicle.placa}`);
        }
        
        logger.info(`Vehicle hard deleted: ${vehicleId}`);
        return true;
    }
    
    return false;
}

/**
 * Count vehicles by type
 * @returns {Promise<Object>} Counts by type
 */
export async function countVehiclesByType() {
    const collection = await getCollection();
    
    const result = await collection.aggregate([
        {
            $group: {
                _id: '$tipo',
                count: { $sum: 1 }
            }
        }
    ]).toArray();
    
    const counts = {};
    result.forEach(item => {
        counts[item._id] = item.count;
    });
    
    return counts;
}

/**
 * Count vehicles by repartidor
 * @returns {Promise<Object>} Counts by repartidor
 */
export async function countVehiclesByRepartidor() {
    const collection = await getCollection();
    
    const result = await collection.aggregate([
        {
            $group: {
                _id: '$repartidor_id',
                count: { $sum: 1 }
            }
        }
    ]).toArray();
    
    const counts = {};
    result.forEach(item => {
        counts[item._id] = item.count;
    });
    
    return counts;
}

export default {
    createVehicle,
    getVehicleById,
    getVehicleByPlaca,
    getVehicles,
    getVehiclesByRepartidor,
    getVehiclesByType,
    updateVehicle,
    deleteVehicle,
    hardDeleteVehicle,
    countVehiclesByType,
    countVehiclesByRepartidor,
    clearCache
};
