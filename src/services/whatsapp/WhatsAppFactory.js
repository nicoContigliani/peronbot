/**
 * WhatsApp Factory
 * Creates and manages WhatsApp adapter instances
 * Supports dynamic switching between Baileys and Business API
 */

import pino from 'pino';
import { BaileysAdapter } from './baileys/BaileysAdapter.js';
import { BusinessAPIAdapter } from './business-api/BusinessAPIAdapter.js';

const logger = pino({ level: 'info' });

/**
 * Supported WhatsApp providers
 */
export const WhatsAppProvider = {
    BAILEYS: 'baileys',
    BUSINESS_API: 'business-api'
};

/**
 * WhatsApp Factory Class
 * Creates appropriate adapter based on configuration
 */
export class WhatsAppFactory {
    /**
     * @param {Object} config - Configuration object
     * @param {string} config.provider - Provider to use (baileys or business-api)
     * @param {Object} config.baileys - Baileys configuration
     * @param {Object} config.businessApi - Business API configuration
     */
    constructor(config) {
        this.config = config;
        this.adapter = null;
        this.provider = config.provider || WhatsAppProvider.BAILEYS;
    }

    /**
     * Create and return the appropriate WhatsApp adapter
     * @returns {Promise<WhatsAppAdapter>}
     */
    async createAdapter() {
        logger.info(`Creating WhatsApp adapter for provider: ${this.provider}`);
        
        switch (this.provider) {
            case WhatsAppProvider.BAILEYS:
                this.adapter = await this._createBaileysAdapter();
                break;
                
            case WhatsAppProvider.BUSINESS_API:
                this.adapter = await this._createBusinessAPIAdapter();
                break;
                
            default:
                throw new Error(`Unknown WhatsApp provider: ${this.provider}`);
        }
        
        // Initialize the adapter
        await this.adapter.initialize();
        
        logger.info(`✅ WhatsApp adapter created: ${this.provider}`);
        return this.adapter;
    }

    /**
     * Create Baileys adapter
     * @returns {Promise<BaileysAdapter>}
     * @private
     */
    async _createBaileysAdapter() {
        const baileysConfig = this.config.baileys || {};
        
        const adapter = new BaileysAdapter({
            sessionFolder: baileysConfig.sessionFolder || 'baileys_auth_info',
            botName: baileysConfig.botName || 'Bototo',
            browserName: baileysConfig.browserName || 'Bototo-Bot',
            browserVersion: baileysConfig.browserVersion || '1.0',
            mobile: baileysConfig.mobile || false,
            connectionTimeout: baileysConfig.connectionTimeout || 60000,
            retryDelay: baileysConfig.retryDelay || 3000,
            maxRetries: baileysConfig.maxRetries || 5
        });
        
        return adapter;
    }

    /**
     * Create Business API adapter
     * @returns {Promise<BusinessAPIAdapter>}
     * @private
     */
    async _createBusinessAPIAdapter() {
        const businessApiConfig = this.config.businessApi || {};
        
        // Validate required configuration
        if (!businessApiConfig.phoneNumberId) {
            throw new Error('META_PHONE_NUMBER_ID is required for Business API provider');
        }
        if (!businessApiConfig.accessToken) {
            throw new Error('META_ACCESS_TOKEN is required for Business API provider');
        }
        
        const adapter = new BusinessAPIAdapter({
            phoneNumberId: businessApiConfig.phoneNumberId,
            accessToken: businessApiConfig.accessToken,
            webhookVerifyToken: businessApiConfig.webhookVerifyToken,
            apiVersion: businessApiConfig.apiVersion || 'v18.0',
            baseUrl: businessApiConfig.baseUrl || 'https://graph.facebook.com'
        });
        
        return adapter;
    }

    /**
     * Get the current adapter instance
     * @returns {WhatsAppAdapter|null}
     */
    getAdapter() {
        return this.adapter;
    }

    /**
     * Get the current provider name
     * @returns {string}
     */
    getProvider() {
        return this.provider;
    }

    /**
     * Switch to a different provider
     * @param {string} newProvider - New provider to use
     * @returns {Promise<WhatsAppAdapter>}
     */
    async switchProvider(newProvider) {
        logger.info(`Switching WhatsApp provider from ${this.provider} to ${newProvider}`);
        
        // Shutdown current adapter if exists
        if (this.adapter) {
            await this.adapter.shutdown();
            this.adapter = null;
        }
        
        // Update provider
        this.provider = newProvider;
        
        // Create new adapter
        return await this.createAdapter();
    }

    /**
     * Shutdown the factory and current adapter
     * @returns {Promise<void>}
     */
    async shutdown() {
        logger.info('Shutting down WhatsApp factory...');
        
        if (this.adapter) {
            await this.adapter.shutdown();
            this.adapter = null;
        }
        
        logger.info('WhatsApp factory shutdown complete');
    }
}

/**
 * Create WhatsApp adapter from environment configuration
 * @param {Object} envConfig - Environment configuration
 * @returns {Promise<WhatsAppAdapter>}
 */
export async function createWhatsAppAdapter(envConfig) {
    const factory = new WhatsAppFactory({
        provider: envConfig.WHATSAPP_PROVIDER || WhatsAppProvider.BAILEYS,
        baileys: {
            sessionFolder: envConfig.SESSION_FOLDER,
            botName: envConfig.BOT_NAME,
            browserName: envConfig.BROWSER_NAME,
            browserVersion: envConfig.BROWSER_VERSION,
            mobile: envConfig.BOT_MOBILE === 'true',
            connectionTimeout: parseInt(envConfig.CONNECTION_TIMEOUT) || 60000,
            retryDelay: parseInt(envConfig.RETRY_DELAY) || 3000,
            maxRetries: parseInt(envConfig.MAX_RETRIES) || 5
        },
        businessApi: {
            phoneNumberId: envConfig.META_PHONE_NUMBER_ID,
            accessToken: envConfig.META_ACCESS_TOKEN,
            webhookVerifyToken: envConfig.META_WEBHOOK_VERIFY_TOKEN,
            apiVersion: envConfig.META_API_VERSION || 'v18.0',
            baseUrl: envConfig.META_BASE_URL || 'https://graph.facebook.com'
        }
    });
    
    return await factory.createAdapter();
}

export default WhatsAppFactory;
