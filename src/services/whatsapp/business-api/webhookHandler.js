/**
 * WhatsApp Business API Webhook Handler
 * Handles incoming webhooks from Meta for receiving messages
 */

import express from 'express';
import pino from 'pino';
import crypto from 'crypto';

const logger = pino({ level: 'info' });

/**
 * Webhook Handler Class
 * Handles incoming webhooks from Meta WhatsApp Business API
 */
export class WebhookHandler {
    /**
     * @param {Object} config - Configuration object
     * @param {string} config.verifyToken - Webhook verification token
     * @param {string} [config.appSecret] - App secret for signature verification
     * @param {Function} config.onMessage - Message handler function
     */
    constructor(config) {
        this.verifyToken = config.verifyToken;
        this.appSecret = config.appSecret;
        this.onMessage = config.onMessage;
        this.router = express.Router();
        this._setupRoutes();
    }

    /**
     * Setup webhook routes
     * @private
     */
    _setupRoutes() {
        // Webhook verification endpoint (GET)
        this.router.get('/webhook', (req, res) => this._handleVerification(req, res));
        
        // Webhook message endpoint (POST)
        this.router.post('/webhook', (req, res) => this._handleMessage(req, res));
    }

    /**
     * Handle webhook verification
     * @param {express.Request} req - Express request
     * @param {express.Response} res - Express response
     * @private
     */
    _handleVerification(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        logger.info('Webhook verification request received');
        
        if (mode === 'subscribe' && token === this.verifyToken) {
            logger.info('✅ Webhook verified successfully');
            res.status(200).send(challenge);
        } else {
            logger.warn('❌ Webhook verification failed');
            res.sendStatus(403);
        }
    }

    /**
     * Handle incoming webhook messages
     * @param {express.Request} req - Express request
     * @param {express.Response} res - Express response
     * @private
     */
    async _handleMessage(req, res) {
        try {
            // Verify signature if app secret is configured
            if (this.appSecret) {
                const signature = req.headers['x-hub-signature-256'];
                if (!this._verifySignature(req.body, signature)) {
                    logger.warn('❌ Invalid webhook signature');
                    res.sendStatus(403);
                    return;
                }
            }
            
            const body = req.body;
            
            // Check if this is a WhatsApp message
            if (body.object !== 'whatsapp_business_account') {
                res.sendStatus(404);
                return;
            }
            
            // Process each entry
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    if (change.field === 'messages') {
                        await this._processMessages(change.value);
                    }
                }
            }
            
            // Always respond with 200 OK to acknowledge receipt
            res.sendStatus(200);
            
        } catch (error) {
            logger.error('Error handling webhook:', error);
            res.sendStatus(500);
        }
    }

    /**
     * Process incoming messages from webhook
     * @param {Object} value - Webhook value object
     * @private
     */
    async _processMessages(value) {
        try {
            const messages = value.messages;
            
            if (!messages || messages.length === 0) {
                return;
            }
            
            for (const message of messages) {
                try {
                    if (!this.onMessage) {
                        logger.warn('No message handler configured');
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
                        case 'button':
                            // Handle button payload
                            text = message.button?.payload || message.button?.text || '';
                            break;
                        default:
                            logger.debug(`Unhandled message type: ${messageType}`);
                    }
                    
                    // Call message handler
                    await this.onMessage({
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
            logger.error('Error processing messages:', error);
        }
    }

    /**
     * Verify webhook signature
     * @param {Object} payload - Request body
     * @param {string} signature - X-Hub-Signature-256 header
     * @returns {boolean}
     * @private
     */
    _verifySignature(payload, signature) {
        if (!this.appSecret || !signature) {
            return false;
        }
        
        try {
            const payloadString = typeof payload === 'string' 
                ? payload 
                : JSON.stringify(payload);
            
            const expectedSignature = crypto
                .createHmac('sha256', this.appSecret)
                .update(payloadString)
                .digest('hex');
            
            const expected = `sha256=${expectedSignature}`;
            
            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expected)
            );
        } catch (error) {
            logger.error('Error verifying signature:', error);
            return false;
        }
    }

    /**
     * Get the Express router
     * @returns {express.Router}
     */
    getRouter() {
        return this.router;
    }
}

/**
 * Create webhook handler
 * @param {Object} config - Configuration object
 * @returns {WebhookHandler}
 */
export function createWebhookHandler(config) {
    return new WebhookHandler(config);
}

export default WebhookHandler;
