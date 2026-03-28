/**
 * Product DAO (Data Access Object)
 * Handles database operations for products
 */

import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Cache for frequently accessed data
const cache = {
    products: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
};

/**
 * Get products collection with indexes
 * @returns {Promise<Collection>}
 */
async function getCollection() {
    const db = await getDB();
    const collection = db.collection('products');
    
    // Create indexes for performance (only once)
    if (!getCollection.indexesCreated) {
        await Promise.all([
            collection.createIndex({ name: 1 }, { unique: true }),
            collection.createIndex({ category: 1 }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ updatedAt: -1 }),
            // Compound indexes for common queries
            collection.createIndex({ isActive: 1, createdAt: -1 }),
            collection.createIndex({ category: 1, isActive: 1 })
        ]);
        getCollection.indexesCreated = true;
        logger.info('Product collection indexes created');
    }
    
    return collection;
}

/**
 * Get product from cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = cache.products.get(key);
    if (cached && Date.now() - cached.timestamp < cache.ttl) {
        return cached.data;
    }
    cache.products.delete(key);
    return null;
}

/**
 * Set product in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
    if (cache.products.size >= cache.maxSize) {
        // Remove oldest entries
        const entries = Array.from(cache.products.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < Math.floor(cache.maxSize * 0.1); i++) {
            cache.products.delete(entries[i][0]);
        }
    }
    
    cache.products.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear product cache
 * @param {string} [productId] - Optional product ID to clear specific cache
 */
function clearCache(productId) {
    if (productId) {
        cache.products.delete(`product:${productId}`);
    } else {
        cache.products.clear();
    }
}

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
export async function createProduct(productData) {
    const collection = await getCollection();
    
    const product = {
        ...productData,
        isActive: productData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await collection.insertOne(product);
    
    const createdProduct = {
        ...product,
        _id: result.insertedId
    };
    
    // Cache the new product
    setCache(`product:${result.insertedId}`, createdProduct);
    
    logger.info(`Product created: ${result.insertedId}`);
    return createdProduct;
}

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} Product or null
 */
export async function getProductById(productId) {
    // Check cache first
    const cached = getFromCache(`product:${productId}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let product;
    try {
        product = await collection.findOne({ _id: new ObjectId(productId) });
    } catch {
        // Invalid ObjectId format
        return null;
    }
    
    if (product) {
        setCache(`product:${productId}`, product);
    }
    
    return product;
}

/**
 * Get product by name
 * @param {string} name - Product name
 * @returns {Promise<Object|null>} Product or null
 */
export async function getProductByName(name) {
    // Check cache first
    const cached = getFromCache(`product:name:${name}`);
    if (cached) {
        return cached;
    }
    
    const collection = await getCollection();
    const product = await collection.findOne({ name: name.toLowerCase() });
    
    if (product) {
        setCache(`product:name:${name}`, product);
        setCache(`product:${product._id}`, product);
    }
    
    return product;
}

/**
 * Get products with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<{products: Object[], total: number}>} Products and total count
 */
export async function getProducts(filters = {}) {
    const collection = await getCollection();
    
    // Build query
    const query = {};
    
    if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
    }
    
    if (filters.category) {
        query.category = filters.category;
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
    const [products, total] = await Promise.all([
        collection
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(query)
    ]);
    
    return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Update product by ID
 * @param {string} productId - Product ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated product or null
 */
export async function updateProduct(productId, updateData) {
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
            { _id: new ObjectId(productId) },
            update,
            { returnDocument: 'after' }
        );
    } catch {
        return null;
    }
    
    if (result) {
        // Clear cache
        clearCache(productId);
        if (result.name) {
            cache.products.delete(`product:name:${result.name}`);
        }
        
        logger.info(`Product updated: ${productId}`);
    }
    
    return result;
}

/**
 * Delete product by ID (soft delete)
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteProduct(productId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    let result;
    try {
        result = await collection.findOneAndUpdate(
            { _id: new ObjectId(productId) },
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
        clearCache(productId);
        if (result.name) {
            cache.products.delete(`product:name:${result.name}`);
        }
        
        logger.info(`Product soft deleted: ${productId}`);
        return true;
    }
    
    return false;
}

/**
 * Hard delete product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function hardDeleteProduct(productId) {
    const collection = await getCollection();
    const { ObjectId } = await import('mongodb');
    
    // Get product first to clear cache
    const product = await getProductById(productId);
    
    let result;
    try {
        result = await collection.deleteOne({ _id: new ObjectId(productId) });
    } catch {
        return false;
    }
    
    if (result.deletedCount > 0) {
        // Clear cache
        clearCache(productId);
        if (product?.name) {
            cache.products.delete(`product:name:${product.name}`);
        }
        
        logger.info(`Product hard deleted: ${productId}`);
        return true;
    }
    
    return false;
}

/**
 * Get products by category
 * @param {string} category - Category
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Products in the category
 */
export async function getProductsByCategory(category, options = {}) {
    const collection = await getCollection();
    
    const query = {
        category,
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
 * Count products by category
 * @returns {Promise<Object>} Counts by category
 */
export async function countProductsByCategory() {
    const collection = await getCollection();
    
    const result = await collection.aggregate([
        {
            $group: {
                _id: '$category',
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
    createProduct,
    getProductById,
    getProductByName,
    getProducts,
    updateProduct,
    deleteProduct,
    hardDeleteProduct,
    getProductsByCategory,
    countProductsByCategory,
    clearCache
};
