/**
 * WhatsApp Business API Adapter
 * Implements WhatsAppAdapter interface using Meta's official WhatsApp Business API
 * This adapter uses the Cloud API (graph.facebook.com) for sending/receiving messages
 */

import axios from 'axios';
import pino from 'pino';
import { WhatsAppAdapter } from '../WhatsAppAdapter.js';

const logger = pino({ level: 'info' });

/**
 * WhatsApp Business API Adapter Implementation
 * Uses Meta's Cloud API for official WhatsApp Business messaging
 */
export class BusinessAPIAdapter extends WhatsAppAdapter {
    /**
     * @param {Object} config - Configuration object
     * @param {string} config.phoneNumberId - WhatsApp Phone Number ID
     * @param {string} config.accessToken - Meta Access Token
     * @param {string} config.webhookVerifyToken - Webhook verification token
     * @param {string} [config.apiVersion='v18.0'] - API version
     * @param {string} [config.baseUrl='https://graph.facebook.com'] - Base URL
     */
    constructor(config) {
        super();
        this.config = config;
        this.phoneNumberId = config.phoneNumberId;
        this.accessToken = config.accessToken;
        this.webhookVerifyToken = config.webhookVerifyToken;
        this.apiVersion = config.apiVersion || 'v18.0';
        this.baseUrl = config.baseUrl || 'https://graph.facebook.com';
        this.isConnected = false;
        this.messageHandler = null;
        this.connectionUpdateHandler = null;
        this.httpClient = null;
    }

    /**
     * Initialize the adapter
     * @returns {Promise<void>}
     */
    async initialize() {
        logger.info('Initializing WhatsApp Business API adapter...');
        
        // Validate required configuration
        if (!this.phoneNumberId) {
            throw new Error('META_PHONE_NUMBER_ID is required for Business API');
        }
        if (!this.accessToken) {
            throw new Error('META_ACCESS_TOKEN is required for Business API');
        }
        
        // Create HTTP client
        this.httpClient = axios.create({
            baseURL: `${this.baseUrl}/${this.apiVersion}`,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        // Add response interceptor for error handling
        this.httpClient.interceptors.response.use(
            response => response,
            error => this._handleApiError(error)
        );
        
        logger.info('WhatsApp Business API adapter initialized');
    }

    /**
     * Handle API errors
     * @param {Error} error - Axios error
     * @private
     */
    _handleApiError(error) {
        if (error.response) {
            const { status, data } = error.response;
            const errorMessage = data?.error?.message || 'Unknown API error';
            const errorCode = data?.error?.code || 'UNKNOWN';
            
            logger.error(`WhatsApp API Error [${status}]: ${errorMessage} (code: ${errorCode})`);
            
            // Handle specific error codes
            if (status === 401) {
                logger.error('Authentication failed - check your access token');
            } else if (status === 403) {
                logger.error('Permission denied - check your app permissions');
            } else if (status === 429) {
                logger.error('Rate limit exceeded - implement backoff strategy');
            }
        } else if (error.request) {
            logger.error('No response received from WhatsApp API:', error.message);
        } else {
            logger.error('Error setting up request:', error.message);
        }
        
        return Promise.reject(error);
    }

    /**
     * Connect to WhatsApp Business API
     * @returns {Promise<void>}
     */
    async connect() {
        try {
            logger.info('Connecting to WhatsApp Business API...');
            
            // Verify credentials by making a test API call
            const response = await this.httpClient.get(`/${this.phoneNumberId}`);
            
            if (response.data && response.data.id) {
                this.isConnected = true;
                logger.info(`✅ Connected to WhatsApp Business API (Phone: ${response.data.display_phone_number})`);
                
                // Notify connection update handler
                if (this.connectionUpdateHandler) {
                    await this.connectionUpdateHandler({
                        connection: 'open',
                        status: 'connected'
                    });
                }
            } else {
                throw new Error('Invalid response from WhatsApp API');
            }
            
        } catch (error) {
            this.isConnected = false;
            logger.error('Failed to connect to WhatsApp Business API:', error.message);
            throw error;
        }
    }

    /**
     * Disconnect from WhatsApp Business API
     * @returns {Promise<void>}
     */
    async disconnect() {
        this.isConnected = false;
        logger.info('Disconnected from WhatsApp Business API');
        
        // Notify connection update handler
        if (this.connectionUpdateHandler) {
            await this.connectionUpdateHandler({
                connection: 'close',
                status: 'disconnected'
            });
        }
    }

    /**
     * Get connection status
     * @returns {ConnectionStatus}
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            provider: 'business-api',
            status: this.isConnected ? 'connected' : 'disconnected'
        };
    }

    /**
     * Send a text message
     * @param {string} jid - Recipient JID (phone number with country code)
     * @param {string} text - Message text
     * @param {Object} [options] - Message options
     * @returns {Promise<MessageResult>}
     */
    async sendMessage(jid, text, options = {}) {
        if (!this.isConnected) {
            return {
                success: false,
                error: 'Not connected to WhatsApp Business API'
            };
        }

        try {
            // Extract phone number from JID (remove @s.whatsapp.net)
            const phoneNumber = jid.replace('@s.whatsapp.net', '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneNumber,
                type: 'text',
                text: {
                    preview_url: options.previewUrl || false,
                    body: text
                }
            };
            
            const response = await this.httpClient.post(`/${this.phoneNumberId}/messages`, payload);
            
            logger.info(`📤 Message sent to ${phoneNumber} via Business API`);
            
            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
            
        } catch (error) {
            logger.error('Error sending message via Business API:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send a message with buttons
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {Array} buttons - Array of button objects
     * @param {string} [footer] - Optional footer text
     * @returns {Promise<MessageResult>}
     */
    async sendButtons(jid, text, buttons, footer = null) {
        if (!this.isConnected) {
            return {
                success: false,
                error: 'Not connected to WhatsApp Business API'
            };
        }

        try {
            const phoneNumber = jid.replace('@s.whatsapp.net', '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneNumber,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: {
                        text: text
                    },
                    action: {
                        buttons: buttons.map((btn, index) => ({
                            type: 'reply',
                            reply: {
                                id: btn.id || btn.key || `btn_${index}`,
                                title: btn.text.substring(0, 20) // Max 20 chars
                            }
                        }))
                    }
                }
            };
            
            if (footer) {
                payload.interactive.footer = { text: footer };
            }
            
            const response = await this.httpClient.post(`/${this.phoneNumberId}/messages`, payload);
            
            logger.info(`📤 Button message sent to ${phoneNumber} via Business API`);
            
            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
            
        } catch (error) {
            logger.error('Error sending buttons via Business API:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send a list message
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {string} buttonText - Button text
     * @param {Array} sections - Array of sections with rows
     * @returns {Promise<MessageResult>}
     */
    async sendListMessage(jid, text, buttonText, sections) {
        if (!this.isConnected) {
            return {
                success: false,
                error: 'Not connected to WhatsApp Business API'
            };
        }

        try {
            const phoneNumber = jid.replace('@s.whatsapp.net', '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneNumber,
                type: 'interactive',
                interactive: {
                    type: 'list',
                    body: {
                        text: text
                    },
                    action: {
                        button: buttonText.substring(0, 20), // Max 20 chars
                        sections: sections.map(section => ({
                            title: section.title,
                            rows: section.rows.map(row => ({
                                id: row.id,
                                title: row.title.substring(0, 24), // Max 24 chars
                                description: row.description?.substring(0, 72) // Max 72 chars
                            }))
                        }))
                    }
                }
            };
            
            const response = await this.httpClient.post(`/${this.phoneNumberId}/messages`, payload);
            
            logger.info(`📤 List message sent to ${phoneNumber} via Business API`);
            
            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
            
        } catch (error) {
            logger.error('Error sending list message via Business API:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send an image message
     * @param {string} jid - Recipient JID
     * @param {string|Buffer} image - Image URL or Buffer
     * @param {string} [caption] - Image caption
     * @returns {Promise<MessageResult>}
     */
    async sendImage(jid, image, caption = '') {
        if (!this.isConnected) {
            return {
                success: false,
                error: 'Not connected to WhatsApp Business API'
            };
        }

        try {
            const phoneNumber = jid.replace('@s.whatsapp.net', '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneNumber,
                type: 'image',
                image: {
                    link: typeof image === 'string' ? image : undefined,
                    caption: caption
                }
            };
            
            // If image is a buffer, we need to upload it first
            if (Buffer.isBuffer(image)) {
                // TODO: Implement media upload for buffers
                throw new Error('Buffer upload not yet implemented - use URL instead');
            }
            
            const response = await this.httpClient.post(`/${this.phoneNumberId}/messages`, payload);
            
            logger.info(`📤 Image sent to ${phoneNumber} via Business API`);
            
            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
            
        } catch (error) {
            logger.error('Error sending image via Business API:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send a document message
     * @param {string} jid - Recipient JID
     * @param {string|Buffer} document - Document URL or Buffer
     * @param {string} [filename] - Document filename
     * @param {string} [caption] - Document caption
     * @returns {Promise<MessageResult>}
     */
    async sendDocument(jid, document, filename = '', caption = '') {
        if (!this.isConnected) {
            return {
                success: false,
                error: 'Not connected to WhatsApp Business API'
            };
        }

        try {
            const phoneNumber = jid.replace('@s.whatsapp.net', '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneNumber,
                type: 'document',
                document: {
                    link: typeof document === 'string' ? document : undefined,
                    filename: filename,
                    caption: caption
                }
            };
            
            // If document is a buffer, we need to upload it first
            if (Buffer.isBuffer(document)) {
                // TODO: Implement media upload for buffers
                throw new Error('Buffer upload not yet implemented - use URL instead');
            }
            
            const response = await this.httpClient.post(`/${this.phoneNumberId}/messages`, payload);
            
            logger.info(`📤 Document sent to ${phoneNumber} via Business API`);
            
            return {
                success: true,
                messageId: response.data?.messages?.[0]?.id
            };
            
        } catch (error) {
            logger.error('Error sending document via Business API:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user info
     * @param {string} jid - User JID
     * @returns {Promise<Object|null>}
     */
    async getUserInfo(jid) {
        // Business API doesn't provide user info endpoint
        // Return basic info based on phone number
        const phoneNumber = jid.replace('@s.whatsapp.net', '');
        return {
            exists: true,
            jid: jid,
            phoneNumber: phoneNumber
        };
    }

    /**
     * Check if user exists on WhatsApp
     * @param {string} jid - User JID
     * @returns {Promise<boolean>}
     */
    async userExists(jid) {
        // Business API assumes all numbers exist
        // In production, you might want to validate numbers
        return true;
    }

    /**
     * Register message handler
     * @param {Function} handler - Message handler function
     */
    onMessage(handler) {
        this.messageHandler = handler;
    }

    /**
     * Register connection update handler
     * @param {Function} handler - Connection update handler function
     */
    onConnectionUpdate(handler) {
        this.connectionUpdateHandler = handler;
    }

    /**
     * Process incoming webhook message
     * @param {Object} webhookData - Webhook payload from Meta
     * @returns {Promise<void>}
     */
    async processWebhook(webhookData) {
        try {
            if (!webhookData.entry || !webhookData.entry[0]) {
                return;
            }
            
            const entry = webhookData.entry[0];
            const changes = entry.changes?.[0];
            
            if (!changes || changes.field !== 'messages') {
                return;
            }
            
            const value = changes.value;
            const messages = value.messages;
            
            if (!messages || messages.length === 0) {
                return;
            }
            
            for (const message of messages) {
                try {
                    // Skip if no message handler
                    if (!this.messageHandler) {
                        continue;
                    }
                    
                    // Extract message data
                    const jid = `${message.from}@s.whatsapp.net`;
                    const messageType = message.type;
                    
                    let text = '';
                    switch (messageType) {
                        case 'text':
                            text = message.text?.body || '';
                            break;
                        case 'image':
                            text = message.image?.caption || '';
                            break;
                        case 'video':
                            text = message.video?.caption || '';
                            break;
                        case 'document':
                            text = message.document?.caption || '';
                            break;
                        case 'interactive':
                            // Handle button/list replies
                            if (message.interactive?.type === 'button_reply') {
                                text = message.interactive.button_reply.id;
                            } else if (message.interactive?.type === 'list_reply') {
                                text = message.interactive.list_reply.id;
                            }
                            break;
                        default:
                            logger.debug(`Unhandled message type: ${messageType}`);
                    }
                    
                    // Call message handler
                    await this.messageHandler({
                        jid,
                        text: text.trim(),
                        messageType,
                        raw: message
                    });
                    
                } catch (error) {
                    logger.error('Error processing webhook message:', error);
                }
            }
            
        } catch (error) {
            logger.error('Error processing webhook:', error);
        }
    }

    /**
     * Verify webhook signature
     * @param {string} payload - Raw webhook payload
     * @param {string} signature - X-Hub-Signature-256 header
     * @returns {boolean}
     */
    verifyWebhookSignature(payload, signature) {
        // TODO: Implement signature verification
        // This is important for production security
        logger.warn('Webhook signature verification not implemented');
        return true;
    }

    /**
     * Get the underlying HTTP client instance
     * @returns {axios.AxiosInstance|null}
     */
    getClient() {
        return this.httpClient;
    }

    /**
     * Shutdown the adapter gracefully
     * @returns {Promise<void>}
     */
    async shutdown() {
        logger.info('Shutting down WhatsApp Business API adapter...');
        
        await this.disconnect();
        
        if (this.httpClient) {
            this.httpClient = null;
        }
        
        logger.info('WhatsApp Business API adapter shutdown complete');
    }
}

export default BusinessAPIAdapter;
