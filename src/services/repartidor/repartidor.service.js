/**
 * Repartidor Service - Pure Business Logic Layer
 * Transport-agnostic service for delivery driver operations
 * 
 * This service is independent of Express, Bot, Socket, or any other transport layer.
 * It receives plain JSON objects and returns Promises with results or throws AppError.
 */

import { AppError } from '@/core/errors/AppError.js';
import {
    validateLocationUpdate,
    validateRepartidorCreate,
    validateRepartidorUpdate,
    toRepartidorResponse,
    toRepartidorResponseArray
} from '../../apiservices/repartidores/dto/repartidor.dto.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * @typedef {Object} ServiceResult
 * @property {boolean} success - Whether operation was successful
 * @property {Object} [data] - Result data
 * @property {Object} [error] - Error information if failed
 */

/**
 * RepartidorService - Pure business logic for delivery drivers
 * Uses dependency injection for database access
 */
export class RepartidorService {
    /**
     * @param {Object} db - Database instance or model
     * @param {Object} [options] - Service options
     * @param {number} [options.cacheTTL=300000] - Cache TTL in milliseconds (5 minutes)
     * @param {number} [options.maxCacheSize=1000] - Maximum cache size
     */
    constructor(db, options = {}) {
        this.db = db;
        this.cacheTTL = options.cacheTTL || 5 * 60 * 1000;
        this.maxCacheSize = options.maxCacheSize || 1000;
        this.cache = new Map();
        this.locks = new Map(); // For atomic operations
    }

    /**
     * Get repartidores collection
     * @returns {Promise<Collection>}
     */
    async getCollection() {
        const collection = this.db.collection('repartidores');
        
        // Create indexes if not exists
        if (!this._indexesCreated) {
            await Promise.all([
                collection.createIndex({ email: 1 }, { unique: true }),
                collection.createIndex({ telefono: 1 }),
                collection.createIndex({ estado: 1 }),
                collection.createIndex({ zona: 1 }),
                collection.createIndex({ 'ubicacion.coordinates': '2dsphere' }),
                collection.createIndex({ createdAt: -1 }),
                collection.createIndex({ updatedAt: -1 })
            ]);
            this._indexesCreated = true;
            logger.info('Repartidor collection indexes created');
        }
        
        return collection;
    }

    /**
     * Acquire lock for atomic operations
     * @param {string} repartidorId - Repartidor ID
     * @returns {Promise<boolean>} Whether lock was acquired
     */
    async acquireLock(repartidorId) {
        if (this.locks.has(repartidorId)) {
            return false;
        }
        this.locks.set(repartidorId, Date.now());
        return true;
    }

    /**
     * Release lock
     * @param {string} repartidorId - Repartidor ID
     */
    releaseLock(repartidorId) {
        this.locks.delete(repartidorId);
    }

    /**
     * Get from cache
     * @param {string} key - Cache key
     * @returns {Object|null}
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * Set cache
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setCache(key, data) {
        if (this.cache.size >= this.maxCacheSize) {
            // Remove oldest entries
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            for (let i = 0; i < Math.floor(this.maxCacheSize * 0.1); i++) {
                this.cache.delete(entries[i][0]);
            }
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache
     * @param {string} [repartidorId] - Optional repartidor ID to clear specific cache
     */
    clearCache(repartidorId) {
        if (repartidorId) {
            this.cache.delete(`repartidor:${repartidorId}`);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Create a new repartidor
     * @param {Object} data - Repartidor data
     * @returns {Promise<ServiceResult>} Created repartidor
     */
    async createRepartidor(data) {
        try {
            // Validate input
            const validatedData = validateRepartidorCreate(data);
            
            const collection = await this.getCollection();
            
            // Check if email already exists
            const existingByEmail = await collection.findOne({ email: validatedData.email });
            if (existingByEmail) {
                throw AppError.conflict('Email already exists', { email: validatedData.email });
            }
            
            // Check if telefono already exists
            const existingByPhone = await collection.findOne({ telefono: validatedData.telefono });
            if (existingByPhone) {
                throw AppError.conflict('Phone number already exists', { telefono: validatedData.telefono });
            }
            
            const repartidor = {
                ...validatedData,
                estado: 'offline',
                ubicacion: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const result = await collection.insertOne(repartidor);
            
            const createdRepartidor = {
                ...repartidor,
                _id: result.insertedId
            };
            
            // Cache the new repartidor
            this.setCache(`repartidor:${result.insertedId}`, createdRepartidor);
            
            logger.info(`Repartidor created: ${result.insertedId}`);
            
            return {
                success: true,
                data: toRepartidorResponse(createdRepartidor)
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error creating repartidor:', error);
            throw AppError.database('Failed to create repartidor', { originalError: error.message });
        }
    }

    /**
     * Get repartidor by ID
     * @param {string} repartidorId - Repartidor ID
     * @returns {Promise<ServiceResult>} Repartidor data
     */
    async getRepartidorById(repartidorId) {
        try {
            // Check cache first
            const cached = this.getFromCache(`repartidor:${repartidorId}`);
            if (cached) {
                return {
                    success: true,
                    data: toRepartidorResponse(cached)
                };
            }
            
            const collection = await this.getCollection();
            const { ObjectId } = await import('mongodb');
            
            let repartidor;
            try {
                repartidor = await collection.findOne({ _id: new ObjectId(repartidorId) });
            } catch {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            if (!repartidor) {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            // Cache the repartidor
            this.setCache(`repartidor:${repartidorId}`, repartidor);
            
            return {
                success: true,
                data: toRepartidorResponse(repartidor)
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error getting repartidor:', error);
            throw AppError.database('Failed to get repartidor', { originalError: error.message });
        }
    }

    /**
     * Update repartidor location (atomic operation)
     * @param {Object} data - Location update data
     * @returns {Promise<ServiceResult>} Updated repartidor
     */
    async updateLocation(data) {
        const repartidorId = data.repartidorId;
        
        // Acquire lock for atomic operation
        const lockAcquired = await this.acquireLock(repartidorId);
        if (!lockAcquired) {
            throw AppError.conflict('Repartidor is being updated by another process', { repartidorId });
        }
        
        try {
            // Validate input
            const validatedData = validateLocationUpdate(data);
            
            const collection = await this.getCollection();
            const { ObjectId } = await import('mongodb');
            
            const update = {
                $set: {
                    ubicacion: {
                        type: 'Point',
                        coordinates: [validatedData.longitude, validatedData.latitude],
                        accuracy: validatedData.accuracy,
                        speed: validatedData.speed,
                        heading: validatedData.heading,
                        timestamp: new Date(validatedData.timestamp)
                    },
                    updatedAt: new Date()
                }
            };
            
            let result;
            try {
                result = await collection.findOneAndUpdate(
                    { _id: new ObjectId(repartidorId) },
                    update,
                    { returnDocument: 'after' }
                );
            } catch {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            if (!result) {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            // Clear cache
            this.clearCache(repartidorId);
            
            logger.info(`Repartidor location updated: ${repartidorId}`);
            
            return {
                success: true,
                data: toRepartidorResponse(result)
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error updating repartidor location:', error);
            throw AppError.database('Failed to update repartidor location', { originalError: error.message });
        } finally {
            // Always release lock
            this.releaseLock(repartidorId);
        }
    }

    /**
     * Update repartidor status (atomic operation)
     * @param {string} repartidorId - Repartidor ID
     * @param {string} estado - New status (disponible, ocupado, offline)
     * @returns {Promise<ServiceResult>} Updated repartidor
     */
    async updateStatus(repartidorId, estado) {
        // Acquire lock for atomic operation
        const lockAcquired = await this.acquireLock(repartidorId);
        if (!lockAcquired) {
            throw AppError.conflict('Repartidor is being updated by another process', { repartidorId });
        }
        
        try {
            if (!['disponible', 'ocupado', 'offline'].includes(estado)) {
                throw AppError.validation('Invalid status', { estado, allowed: ['disponible', 'ocupado', 'offline'] });
            }
            
            const collection = await this.getCollection();
            const { ObjectId } = await import('mongodb');
            
            const update = {
                $set: {
                    estado,
                    updatedAt: new Date()
                }
            };
            
            let result;
            try {
                result = await collection.findOneAndUpdate(
                    { _id: new ObjectId(repartidorId) },
                    update,
                    { returnDocument: 'after' }
                );
            } catch {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            if (!result) {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            // Clear cache
            this.clearCache(repartidorId);
            
            logger.info(`Repartidor status updated: ${repartidorId} -> ${estado}`);
            
            return {
                success: true,
                data: toRepartidorResponse(result)
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error updating repartidor status:', error);
            throw AppError.database('Failed to update repartidor status', { originalError: error.message });
        } finally {
            // Always release lock
            this.releaseLock(repartidorId);
        }
    }

    /**
     * Update repartidor information
     * @param {string} repartidorId - Repartidor ID
     * @param {Object} data - Update data
     * @returns {Promise<ServiceResult>} Updated repartidor
     */
    async updateRepartidor(repartidorId, data) {
        try {
            // Validate input
            const validatedData = validateRepartidorUpdate(data);
            
            if (Object.keys(validatedData).length === 0) {
                throw AppError.validation('No valid update data provided');
            }
            
            const collection = await this.getCollection();
            const { ObjectId } = await import('mongodb');
            
            const update = {
                $set: {
                    ...validatedData,
                    updatedAt: new Date()
                }
            };
            
            let result;
            try {
                result = await collection.findOneAndUpdate(
                    { _id: new ObjectId(repartidorId) },
                    update,
                    { returnDocument: 'after' }
                );
            } catch {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            if (!result) {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            // Clear cache
            this.clearCache(repartidorId);
            
            logger.info(`Repartidor updated: ${repartidorId}`);
            
            return {
                success: true,
                data: toRepartidorResponse(result)
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error updating repartidor:', error);
            throw AppError.database('Failed to update repartidor', { originalError: error.message });
        }
    }

    /**
     * Get repartidores with filters
     * @param {Object} filters - Filter criteria
     * @returns {Promise<ServiceResult>} List of repartidores
     */
    async getRepartidores(filters = {}) {
        try {
            const collection = await this.getCollection();
            
            // Build query
            const query = {};
            
            if (filters.estado) {
                query.estado = filters.estado;
            }
            
            if (filters.zona) {
                query.zona = filters.zona;
            }
            
            if (filters.vehiculo) {
                query.vehiculo = filters.vehiculo;
            }
            
            // Pagination
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const skip = (page - 1) * limit;
            
            // Sorting
            const sort = {};
            sort[filters.sortBy || 'createdAt'] = filters.sortOrder === 'asc' ? 1 : -1;
            
            // Execute query
            const [repartidores, total] = await Promise.all([
                collection
                    .find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                collection.countDocuments(query)
            ]);
            
            return {
                success: true,
                data: toRepartidorResponseArray(repartidores),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            logger.error('Error getting repartidores:', error);
            throw AppError.database('Failed to get repartidores', { originalError: error.message });
        }
    }

    /**
     * Get nearby repartidores
     * @param {number} longitude - Longitude
     * @param {number} latitude - Latitude
     * @param {number} maxDistance - Maximum distance in meters
     * @param {Object} [options] - Query options
     * @returns {Promise<ServiceResult>} List of nearby repartidores
     */
    async getNearbyRepartidores(longitude, latitude, maxDistance, options = {}) {
        try {
            const collection = await this.getCollection();
            
            const query = {
                ubicacion: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                },
                estado: 'disponible'
            };
            
            const limit = options.limit || 10;
            
            const repartidores = await collection
                .find(query)
                .limit(limit)
                .toArray();
            
            return {
                success: true,
                data: toRepartidorResponseArray(repartidores)
            };
        } catch (error) {
            logger.error('Error getting nearby repartidores:', error);
            throw AppError.database('Failed to get nearby repartidores', { originalError: error.message });
        }
    }

    /**
     * Delete repartidor (soft delete)
     * @param {string} repartidorId - Repartidor ID
     * @returns {Promise<ServiceResult>} Deletion result
     */
    async deleteRepartidor(repartidorId) {
        try {
            const collection = await this.getCollection();
            const { ObjectId } = await import('mongodb');
            
            let result;
            try {
                result = await collection.findOneAndUpdate(
                    { _id: new ObjectId(repartidorId) },
                    {
                        $set: {
                            estado: 'offline',
                            deletedAt: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    { returnDocument: 'after' }
                );
            } catch {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            if (!result) {
                throw AppError.notFound('Repartidor not found', { repartidorId });
            }
            
            // Clear cache
            this.clearCache(repartidorId);
            
            logger.info(`Repartidor soft deleted: ${repartidorId}`);
            
            return {
                success: true,
                data: { message: 'Repartidor deactivated' }
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error deleting repartidor:', error);
            throw AppError.database('Failed to delete repartidor', { originalError: error.message });
        }
    }
}

export default RepartidorService;
