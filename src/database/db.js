/**
 * Database Module - MongoDB Connection and Collections
 * Handles all database operations with error handling and reconnection
 */
import { MongoClient, Db, Collection } from 'mongodb';
import pino from 'pino';
import config from '@/config/env.js';

const logger = pino({ level: config.logging.level });

let client = null;
let db = null;

/**
 * Connect to MongoDB with retry mechanism
 * @param {number} maxRetries - Maximum number of connection retries
 * @param {number} retryDelay - Delay between retries in ms
 * @returns {Promise<Db>} MongoDB database instance
 */
export async function connectDB(maxRetries = 3, retryDelay = 3000) {
    if (db) {
        logger.info('Using existing database connection');
        return db;
    }

    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            logger.info(`Connecting to MongoDB (attempt ${retries + 1}/${maxRetries})...`);
            
            client = new MongoClient(config.mongodb.uri, {
                maxPoolSize: 10,
                minPoolSize: 1,
                connectTimeoutMS: config.connection.timeout,
                socketTimeoutMS: 45000,
                serverSelectionTimeoutMS: 5000
            });
            
            await client.connect();
            db = client.db(config.mongodb.database);
            
            // Verify connection
            await db.command({ ping: 1 });
            
            logger.info(`✅ Connected to MongoDB: ${config.mongodb.database}`);
            
            // Create indexes
            await createIndexes();
            
            return db;
            
        } catch (error) {
            retries++;
            logger.error(`❌ MongoDB connection error (attempt ${retries}/${maxRetries}):`, error.message);
            
            if (retries >= maxRetries) {
                logger.error('❌ Max retries reached for MongoDB connection');
                throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts: ${error.message}`);
            }
            
            logger.info(`⏳ Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

/**
 * Create database indexes for optimal performance
 */
async function createIndexes() {
    try {
        // Users collection indexes
        const users = db.collection('users');
        await users.createIndex({ jid: 1 }, { unique: true });
        await users.createIndex({ 'conversation.currentNode': 1 });
        await users.createIndex({ updatedAt: -1 });
        
        // Conversations collection indexes
        const conversations = db.collection('conversations');
        await conversations.createIndex({ jid: 1, 'messages.timestamp': -1 });
        await conversations.createIndex({ updatedAt: -1 });
        
        // Conversation trees collection indexes
        const trees = db.collection('conversation_trees');
        await trees.createIndex({ name: 1 }, { unique: true });
        await trees.createIndex({ active: 1 });
        
        logger.info('✅ Database indexes created successfully');
        
    } catch (error) {
        logger.warn('⚠️  Index creation error (indexes may already exist):', error.message);
    }
}

/**
 * Get the database instance
 * @returns {Db} MongoDB database instance
 * @throws Error if not connected
 */
export function getDB() {
    if (!db) {
        throw new Error('MongoDB not connected. Call connectDB() first.');
    }
    return db;
}

/**
 * Get a specific collection
 * @param {string} name - Collection name
 * @returns {Collection} MongoDB collection
 */
export function getCollection(name) {
    return getDB().collection(name);
}

/**
 * Get or create user by JID
 * @param {string} jid - WhatsApp user JID
 * @returns {Promise<Object>} User object
 */
export async function getOrCreateUser(jid) {
    const users = getCollection('users');
    const user = await users.findOneAndUpdate(
        { jid },
        {
            $setOnInsert: {
                jid,
                conversation: {
                    currentNode: 'root',
                    history: [],
                    startedAt: new Date()
                },
                metadata: {},
                createdAt: new Date()
            },
            $set: { updatedAt: new Date() }
        },
        { upsert: true, returnDocument: 'after' }
    );
    return user;
}

/**
 * Update user conversation state
 * @param {string} jid - WhatsApp user JID
 * @param {string} nodeId - Current conversation node ID
 * @param {Object} metadata - Optional metadata to update
 */
export async function updateUserConversation(jid, nodeId, metadata = {}) {
    const users = getCollection('users');
    await users.updateOne(
        { jid },
        {
            $set: {
                'conversation.currentNode': nodeId,
                ...metadata,
                updatedAt: new Date()
            }
        }
    );
}

/**
 * Add message to conversation history
 * @param {string} jid - WhatsApp user JID
 * @param {Object} message - Message object
 */
export async function addToConversationHistory(jid, message) {
    const users = getCollection('users');
    await users.updateOne(
        { jid },
        {
            $push: {
                'conversation.history': {
                    ...message,
                    timestamp: new Date()
                }
            },
            $set: { updatedAt: new Date() }
        }
    );
}

/**
 * Save a message to the conversations collection
 * @param {string} jid - WhatsApp user JID
 * @param {Object} message - Message to save
 */
export async function saveMessage(jid, message) {
    const conversations = getCollection('conversations');
    await conversations.updateOne(
        { jid },
        {
            $push: { messages: { ...message, timestamp: new Date() } },
            $set: { updatedAt: new Date() }
        },
        { upsert: true }
    );
}

/**
 * Close MongoDB connection
 */
export async function closeDB() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        logger.info('✅ MongoDB connection closed');
    }
}

export default {
    connectDB,
    getDB,
    getCollection,
    getOrCreateUser,
    updateUserConversation,
    addToConversationHistory,
    saveMessage,
    closeDB
};
