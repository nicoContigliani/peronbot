/**
 * Socket Module
 * Reusable WhatsApp socket connection manager with full typing
 */

import makeWASocketModule from '@whiskeysockets/baileys';
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = makeWASocketModule;
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';

/**
 * @typedef {Object} SocketConfig
 * @property {string} sessionFolder - Path to session folder
 * @property {string} browserName - Browser name for WhatsApp
 * @property {string} browserVersion - Browser version
 * @property {boolean} mobile - Whether to use mobile mode
 * @property {number} connectTimeoutMs - Connection timeout in ms
 * @property {number} maxRetries - Maximum reconnection attempts
 * @property {number} retryDelay - Delay between retries in ms
 * @property {string} logLevel - Logging level
 */

/**
 * @typedef {Object} ConnectionState
 * @property {boolean} isConnected - Whether socket is connected
 * @property {boolean} isConnecting - Whether socket is connecting
 * @property {number} retryCount - Current retry count
 * @property {string|null} lastError - Last error message
 */

/**
 * @typedef {Object} MessageData
 * @property {string} jid - Recipient JID
 * @property {string} text - Message text
 * @property {string} messageType - Type of message
 * @property {Object} message - Full message object
 * @property {Object} raw - Raw message data
 */

/**
 * @typedef {Object} SendMessageResult
 * @property {Object} key - Message key
 * @property {string} key.id - Message ID
 * @property {string} key.remoteJid - Recipient JID
 * @property {boolean} key.fromMe - Whether message is from bot
 */

/**
 * @typedef {Object} Button
 * @property {string} id - Button ID
 * @property {string} text - Button display text
 */

/**
 * @typedef {Object} Section
 * @property {string} title - Section title
 * @property {Array<SectionRow>} rows - Section rows
 */

/**
 * @typedef {Object} SectionRow
 * @property {string} title - Row title
 * @property {string} description - Row description
 * @property {string} rowId - Row ID
 */

/**
 * @typedef {Object} SocketEventHandlers
 * @property {Function} [onMessage] - Message handler
 * @property {Function} [onConnectionUpdate] - Connection update handler
 * @property {Function} [onQR] - QR code handler
 * @property {Function} [onError] - Error handler
 */

/**
 * WhatsApp Socket Manager Class
 * Handles connection, reconnection, and message events
 */
export class SocketManager {
    /**
     * Create a socket manager instance
     * @param {SocketConfig} config - Socket configuration
     */
    constructor(config = {}) {
        this.config = {
            sessionFolder: config.sessionFolder || 'baileys_auth_info',
            browserName: config.browserName || 'Bot',
            browserVersion: config.browserVersion || '1.0',
            mobile: config.mobile || false,
            connectTimeoutMs: config.connectTimeoutMs || 60000,
            maxRetries: config.maxRetries || 5,
            retryDelay: config.retryDelay || 3000,
            logLevel: config.logLevel || 'silent'
        };

        this.sock = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.retryCount = 0;
        this.logger = pino({ level: this.config.logLevel });
        this.eventHandlers = {};
    }

    /**
     * Set event handlers
     * @param {SocketEventHandlers} handlers - Event handlers
     */
    setEventHandlers(handlers) {
        this.eventHandlers = { ...this.eventHandlers, ...handlers };
    }

    /**
     * Initialize and connect to WhatsApp
     * @returns {Promise<Object>} Socket instance
     */
    async connect() {
        if (this.isConnected) {
            this.logger.info('Already connected to WhatsApp');
            return this.sock;
        }

        if (this.isConnecting) {
            this.logger.info('Connection in progress...');
            await delay(2000);
            return this.sock;
        }

        this.isConnecting = true;

        try {
            this.logger.info('--- Initializing WhatsApp Connection ---');

            // Fetch latest Baileys version
            const { version, isLatest } = await fetchLatestBaileysVersion();
            this.logger.info(`Using Baileys version: ${version.join('.')} (latest: ${isLatest})`);

            // Load or create session
            let { state, saveCreds } = await useMultiFileAuthState(this.config.sessionFolder);
            
            // Check if session is valid
            if (!state.creds || !state.creds.me) {
                this.logger.warn('Invalid session detected, creating new one...');
                await this.clearSession();
                ({ state, saveCreds } = await useMultiFileAuthState(this.config.sessionFolder));
            }
            
            // Create socket with optimized settings
            this.sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, this.logger)
                },
                printQRInTerminal: true,
                logger: this.logger,
                browser: [this.config.browserName, 'Chrome', this.config.browserVersion],
                mobile: this.config.mobile,
                connectTimeoutMs: this.config.connectTimeoutMs,
                keepAliveIntervalMs: 30000,
                emitOwnEvents: false,
                retryRequestDelayMs: 500,
                maxMsgRetryCount: 3,
            });

            // Setup event listeners
            this.setupEventListeners(saveCreds);

            return this.sock;

        } catch (error) {
            this.isConnecting = false;
            this.logger.error('❌ Failed to initialize socket:', error);
            
            if (this.eventHandlers.onError) {
                this.eventHandlers.onError(error);
            }
            
            throw error;
        }
    }

    /**
     * Setup event listeners
     * @param {Function} saveCreds - Credentials save function
     */
    setupEventListeners(saveCreds) {
        // Handle connection updates
        this.sock.ev.on('connection.update', (update) => 
            this.handleConnectionUpdate(update)
        );

        // Handle credentials updates
        this.sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        this.sock.ev.on('messages.upsert', ({ messages, type }) => 
            this.handleMessages(messages, type)
        );

        // Handle group participants update
        this.sock.ev.on('group-participants.update', (update) => 
            this.handleGroupParticipants(update)
        );

        // Handle presence updates
        this.sock.ev.on('presence.update', (update) => 
            this.handlePresence(update)
        );
    }

    /**
     * Handle connection state updates
     * @param {Object} update - Connection update object
     */
    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr, status } = update;

        // Handle QR code
        if (qr) {
            this.logger.info('📱 QR Code received');
            
            if (this.eventHandlers.onQR) {
                this.eventHandlers.onQR(qr);
            } else {
                // Default QR display
                try {
                    const qrString = await qrcode.toString(qr, { 
                        type: 'terminal', 
                        small: true,
                        margin: 2
                    });
                    console.log('\n--- 📱 Scan QR Code with your phone ---');
                    console.log(qrString);
                    console.log('-------------------------------------------\n');
                } catch (error) {
                    this.logger.error('Error generating QR:', error);
                }
            }
        }

        // Handle connection status
        if (connection === 'open') {
            this.isConnected = true;
            this.isConnecting = false;
            this.retryCount = 0;
            
            this.logger.info('✅ Connection established');
            
            if (this.eventHandlers.onConnectionUpdate) {
                this.eventHandlers.onConnectionUpdate({ status: 'connected' });
            }
        }

        if (connection === 'close') {
            this.isConnected = false;
            this.isConnecting = false;
            
            const reason = lastDisconnect?.error 
                ? lastDisconnect.error.message 
                : 'Unknown reason';
            
            this.logger.warn(`Connection closed: ${reason}`);

            // Check if should reconnect
            const shouldReconnect = this.shouldReconnect(lastDisconnect);
            
            if (shouldReconnect && this.retryCount < this.config.maxRetries) {
                this.retryCount++;
                this.logger.info(`Attempting to reconnect (${this.retryCount}/${this.config.maxRetries})...`);
                
                await delay(this.config.retryDelay);
                await this.connect();
            } else if (!shouldReconnect) {
                this.logger.error('Logged out or session invalid. Clear session to re-authenticate.');
                
                if (this.eventHandlers.onConnectionUpdate) {
                    this.eventHandlers.onConnectionUpdate({ 
                        status: 'logged_out',
                        reason 
                    });
                }
            } else {
                this.logger.error('Max reconnection attempts reached.');
                
                if (this.eventHandlers.onConnectionUpdate) {
                    this.eventHandlers.onConnectionUpdate({ 
                        status: 'failed',
                        reason: 'Max retries exceeded'
                    });
                }
            }
        }

        if (status) {
            this.logger.info(`Status: ${status}`);
        }
    }

    /**
     * Determine if should reconnect based on disconnect reason
     * @param {Object} lastDisconnect - Last disconnect error
     * @returns {boolean}
     */
    shouldReconnect(lastDisconnect) {
        if (!lastDisconnect?.error) return true;
        
        if (lastDisconnect.error instanceof Boom) {
            const statusCode = lastDisconnect.error.output.statusCode;
            
            // Don't reconnect if logged out
            if (statusCode === DisconnectReason.loggedOut) {
                return false;
            }
            
            // Don't reconnect for bad session
            if (statusCode === DisconnectReason.badSession) {
                return false;
            }
            
            // Check for conflict
            const errorString = lastDisconnect.error.toString();
            if (errorString.includes('conflict') || errorString.includes('replaced')) {
                return false;
            }
            
            return true;
        }
        
        return true;
    }

    /**
     * Handle incoming messages
     * @param {Array} messages - Array of messages
     * @param {string} type - Message event type
     */
    async handleMessages(messages, type) {
        if (type !== 'notify') return;
        
        for (const message of messages) {
            try {
                // Skip own messages and status updates
                if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') {
                    continue;
                }

                // Extract message data
                const messageData = this.extractMessageData(message);
                
                // Call message handler
                if (this.eventHandlers.onMessage) {
                    await this.eventHandlers.onMessage(messageData);
                }
                
            } catch (error) {
                this.logger.error('Error processing message:', error);
                
                if (this.eventHandlers.onError) {
                    this.eventHandlers.onError(error);
                }
            }
        }
    }

    /**
     * Extract message data from message object
     * @param {Object} message - Raw message object
     * @returns {MessageData}
     */
    extractMessageData(message) {
        const jid = message.key.remoteJid;
        const messageType = Object.keys(message.message || {})[0];
        
        let text = '';
        switch (messageType) {
            case 'conversation':
                text = message.message.conversation;
                break;
            case 'extendedTextMessage':
                text = message.message.extendedTextMessage.text;
                break;
            case 'imageMessage':
                text = message.message.imageMessage.caption || '';
                break;
            case 'videoMessage':
                text = message.message.videoMessage.caption || '';
                break;
            case 'documentMessage':
                text = message.message.documentMessage.caption || '';
                break;
            default:
                this.logger.debug(`Unhandled message type: ${messageType}`);
        }

        return {
            jid,
            text: text.trim(),
            messageType,
            message,
            raw: message
        };
    }

    /**
     * Handle group participant updates
     * @param {Object} update - Group update object
     */
    handleGroupParticipants(update) {
        const { id, participants, action } = update;
        this.logger.info(`Group update ${id}: ${action} - ${participants.join(', ')}`);
    }

    /**
     * Handle presence updates
     * @param {Object} update - Presence update object
     */
    handlePresence(update) {
        this.logger.debug('Presence update:', update);
    }

    /**
     * Send a text message
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {Object} options - Message options
     * @returns {Promise<SendMessageResult>}
     */
    async sendMessage(jid, text, options = {}) {
        if (!this.sock) {
            throw new Error('Socket not connected');
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                text,
                ...options
            });
            
            this.logger.info(`📤 Message sent to ${jid}`);
            return result;
            
        } catch (error) {
            this.logger.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Send a message with buttons
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {Array<Button>} buttons - Array of button objects
     * @param {string} [footer] - Optional footer
     * @returns {Promise<SendMessageResult>}
     */
    async sendButtons(jid, text, buttons, footer = null) {
        if (!this.sock) {
            throw new Error('Socket not connected');
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                text,
                footer: footer,
                buttons: buttons.map(btn => ({
                    buttonId: btn.id,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1
            });
            
            this.logger.info(`📤 Button message sent to ${jid}`);
            return result;
            
        } catch (error) {
            this.logger.error('Error sending buttons:', error);
            throw error;
        }
    }

    /**
     * Send a list message
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {string} buttonText - Button text
     * @param {Array<Section>} sections - Array of sections with rows
     * @returns {Promise<SendMessageResult>}
     */
    async sendListMessage(jid, text, buttonText, sections) {
        if (!this.sock) {
            throw new Error('Socket not connected');
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                text,
                buttonText: buttonText,
                sections: sections
            });
            
            this.logger.info(`📤 List message sent to ${jid}`);
            return result;
            
        } catch (error) {
            this.logger.error('Error sending list message:', error);
            throw error;
        }
    }

    /**
     * Get user info
     * @param {string} jid - User JID
     * @returns {Promise<Object>}
     */
    async getUserInfo(jid) {
        if (!this.sock) {
            throw new Error('Socket not connected');
        }

        try {
            return await this.sock.onWhatsApp(jid);
        } catch (error) {
            this.logger.error('Error getting user info:', error);
            throw error;
        }
    }

    /**
     * Get the socket instance
     * @returns {Object|null}
     */
    getSocket() {
        return this.sock;
    }

    /**
     * Get connection state
     * @returns {ConnectionState}
     */
    getConnectionState() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            retryCount: this.retryCount,
            lastError: null
        };
    }

    /**
     * Clear session folder
     * @returns {Promise<void>}
     */
    async clearSession() {
        try {
            const fs = await import('fs');
            const path = await import('path');
            const sessionPath = path.resolve(this.config.sessionFolder);
            
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                this.logger.info('Session cleared');
            }
        } catch (error) {
            this.logger.error('Error clearing session:', error);
            throw error;
        }
    }

    /**
     * Disconnect and cleanup
     * @returns {Promise<void>}
     */
    async disconnect() {
        this.logger.info('Disconnecting socket...');
        
        if (this.sock) {
            this.sock.end(undefined);
            this.sock = null;
        }
        
        this.isConnected = false;
        this.isConnecting = false;
        
        this.logger.info('Socket disconnected');
    }
}

/**
 * Create a socket manager instance
 * @param {SocketConfig} config - Socket configuration
 * @returns {SocketManager}
 */
export function createSocketManager(config) {
    return new SocketManager(config);
}

export default {
    SocketManager,
    createSocketManager
};
