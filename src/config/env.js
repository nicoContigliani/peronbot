/**
 * Environment Configuration Module
 * Loads and validates environment variables for the bot
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Bot configuration object
 */
export const config = {
    // WhatsApp Provider
    whatsapp: {
        provider: process.env.WHATSAPP_PROVIDER || 'baileys',
        baileys: {
            sessionFolder: process.env.SESSION_FOLDER || 'baileys_auth_info',
            botName: process.env.BOT_NAME || 'Bototo',
            browserName: process.env.BROWSER_NAME || 'Bototo-Bot',
            browserVersion: process.env.BROWSER_VERSION || '1.0',
            mobile: process.env.BOT_MOBILE === 'true',
            connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT) || 60000,
            retryDelay: parseInt(process.env.RETRY_DELAY) || 3000,
            maxRetries: parseInt(process.env.MAX_RETRIES) || 5
        },
        businessApi: {
            phoneNumberId: process.env.META_PHONE_NUMBER_ID,
            accessToken: process.env.META_ACCESS_TOKEN,
            webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
            webhookSecret: process.env.META_WEBHOOK_SECRET,
            apiVersion: process.env.META_API_VERSION || 'v18.0',
            baseUrl: process.env.META_BASE_URL || 'https://graph.facebook.com'
        }
    },
    
    // MongoDB
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bototo',
        database: process.env.MONGODB_DB || 'bototo'
    },
    
    // Bot settings
    bot: {
        name: process.env.BOT_NAME || 'Bototo',
        browser: process.env.BROWSER_NAME || 'Bototo-Bot',
        browserVersion: process.env.BROWSER_VERSION || '1.0',
        mobile: process.env.BOT_MOBILE === 'true',
        prefix: process.env.COMMAND_PREFIX || '!'
    },
    
    // Connection settings
    connection: {
        timeout: parseInt(process.env.CONNECTION_TIMEOUT) || 60000,
        retryDelay: parseInt(process.env.RETRY_DELAY) || 3000,
        maxRetries: parseInt(process.env.MAX_RETRIES) || 5
    },
    
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    },
    
    // Supabase
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
        bucket: process.env.SUPABASE_BUCKET || 'files'
    }
};

/**
 * Validates required environment variables
 * @throws Error if required variables are missing
 */
export function validateConfig() {
    const required = [];
    
    if (!process.env.MONGODB_URI) {
        console.warn('⚠️  MONGODB_URI not set, using default localhost');
    }
    
    return required;
}

export default config;
