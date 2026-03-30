/**
 * Baileys Adapter
 * Wraps the existing Baileys implementation to conform to WhatsAppAdapter interface
 * This adapter uses WhatsApp Web (unofficial) via Baileys library
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
import { WhatsAppAdapter } from '../WhatsAppAdapter.js';

const logger = pino({ level: 'info' });

/**
 * Baileys Adapter Implementation
 * Wraps Baileys library to provide unified WhatsApp interface
 */
export class BaileysAdapter extends WhatsAppAdapter {
    /**
     * @param {Object} config - Configuration object
     * @param {string} config.sessionFolder - Session folder path
     * @param {string} config.botName - Bot name
     * @param {string} config.browserName - Browser name
     * @param {string} config.browserVersion - Browser version
     * @param {boolean} config.mobile - Whether to use mobile mode
     * @param {number} config.connectionTimeout - Connection timeout in ms
     * @param {number} config.retryDelay - Retry delay in ms
     * @param {number} config.maxRetries - Maximum retry attempts
     */
    constructor(config) {
        super();
        this.config = config;
        this.sock = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.retryCount = 0;
        this.maxRetries = config.maxRetries || 5;
        this.messageHandler = null;
        this.connectionUpdateHandler = null;
    }

    /**
     * Initialize the adapter
     * @returns {Promise<void>}
     */
    async initialize() {
        logger.info('Initializing Baileys adapter...');
        // No initialization needed for Baileys
    }

    /**
     * Connect to WhatsApp
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.isConnected) {
            logger.info('Already connected to WhatsApp');
            return;
        }

        if (this.isConnecting) {
            logger.info('Connection in progress...');
            await delay(2000);
            return;
        }

        this.isConnecting = true;

        try {
            logger.info('--- Initializing WhatsApp Connection (Baileys) ---');

            // Fetch latest Baileys version
            const { version, isLatest } = await fetchLatestBaileysVersion();
            logger.info(`Using Baileys version: ${version.join('.')} (latest: ${isLatest})`);

            // Load or create session
            let { state, saveCreds } = await useMultiFileAuthState(this.config.sessionFolder);
            
            // Check if session is valid, if not delete and recreate
            if (!state.creds || !state.creds.me) {
                logger.warn('Invalid session detected, creating new one...');
                const fs = await import('fs');
                const path = await import('path');
                const sessionPath = path.resolve(this.config.sessionFolder);
                
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
                
                // Create fresh session
                ({ state, saveCreds } = await useMultiFileAuthState(this.config.sessionFolder));
            }
            
            // Create socket with optimized settings
            this.sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger)
                },
                printQRInTerminal: true,
                logger: logger,
                browser: [this.config.browserName, 'Chrome', this.config.browserVersion],
                mobile: this.config.mobile,
                connectTimeoutMs: this.config.connectionTimeout,
                keepAliveIntervalMs: 30000,
                emitOwnEvents: false,
                retryRequestDelayMs: 500,
                maxMsgRetryCount: 3,
            });

            // Handle connection updates
            this.sock.ev.on('connection.update', (update) => 
                this._handleConnectionUpdate(update)
            );

            // Handle credentials updates
            this.sock.ev.on('creds.update', saveCreds);

            // Handle incoming messages
            this.sock.ev.on('messages.upsert', ({ messages, type }) => 
                this._handleMessages(messages, type)
            );

            // Handle group participants update
            this.sock.ev.on('group-participants.update', (update) => 
                this._handleGroupParticipants(update)
            );

            // Handle presence updates
            this.sock.ev.on('presence.update', (update) => 
                this._handlePresence(update)
            );

            logger.info('Baileys adapter initialized successfully');

        } catch (error) {
            this.isConnecting = false;
            logger.error('Failed to initialize Baileys adapter:', error);
            throw error;
        }
    }

    /**
     * Handle connection state updates
     * @param {Object} update - Connection update object
     * @private
     */
    async _handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr, status } = update;

        // Handle QR code
        if (qr) {
            console.log('\n--- 📱 QR Code received, scan with your phone ---');
            try {
                const qrString = await qrcode.toString(qr, { 
                    type: 'terminal', 
                    small: true,
                    margin: 2
                });
                console.log(qrString);
                console.log('-------------------------------------------');
            } catch (error) {
                logger.error('Error generating QR:', error);
            }
        }

        // Handle connection status
        if (connection === 'open') {
            this.isConnected = true;
            this.isConnecting = false;
            this.retryCount = 0;
            console.log('\n✅ ═════════════════════════════════════');
            console.log(`   🤖 ${this.config.botName} is now ONLINE!`);
            console.log('   ═════════════════════════════════════\n');
        }

        if (connection === 'close') {
            this.isConnected = false;
            this.isConnecting = false;
            
            const reason = lastDisconnect?.error 
                ? lastDisconnect.error.message 
                : 'Unknown reason';
            
            console.log(`\n❌ Connection closed: ${reason}`);

            // Check if should reconnect
            const shouldReconnect = this._shouldReconnect(lastDisconnect);
            
            if (shouldReconnect && this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`\n⏳ Attempting to reconnect (${this.retryCount}/${this.maxRetries})...`);
                await delay(this.config.retryDelay);
                await this.connect();
            } else if (!shouldReconnect) {
                console.log('\n🛑 Logged out or session invalid.');
                console.log('   Delete the session folder to re-authenticate:');
                console.log(`   rm -rf ${this.config.sessionFolder}\n`);
                await this.shutdown();
            } else {
                console.log('\n❌ Max reconnection attempts reached.');
                await this.shutdown();
            }
        }

        if (status) {
            logger.info(`Status: ${status}`);
        }

        // Call external handler if registered
        if (this.connectionUpdateHandler) {
            try {
                await this.connectionUpdateHandler(update);
            } catch (error) {
                logger.error('Error in connection update handler:', error);
            }
        }
    }

    /**
     * Determine if should reconnect based on disconnect reason
     * @param {Object} lastDisconnect - Last disconnect error
     * @returns {boolean}
     * @private
     */
    _shouldReconnect(lastDisconnect) {
        if (!lastDisconnect?.error) return true;
        
        if (lastDisconnect.error instanceof Boom) {
            const statusCode = lastDisconnect.error.output.statusCode;
            
            // Don't reconnect if logged out
            if (statusCode === DisconnectReason.loggedOut) {
                return false;
            }
            
            // Don't reconnect for bad session (requires re-auth)
            if (statusCode === DisconnectReason.badSession) {
                return false;
            }
            
            // Check for conflict (session replaced by another device)
            const errorString = lastDisconnect.error.toString();
            if (errorString.includes('conflict') || errorString.includes('replaced')) {
                console.log('\n⚠️  Another session took over this number.');
                console.log('    Please log out from WhatsApp Web/Desktop and restart.');
                return false;
            }
            
            // Reconnect for other errors
            return true;
        }
        
        return true;
    }

    /**
     * Handle incoming messages
     * @param {Array} messages - Array of messages
     * @param {string} type - Message event type
     * @private
     */
    async _handleMessages(messages, type) {
        if (type !== 'notify') return;
        
        for (const message of messages) {
            try {
                // Skip own messages and status updates
                if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') {
                    continue;
                }

                // Extract message data
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
                        logger.debug(`Unhandled message type: ${messageType}`);
                }

                // Call message handler if registered
                if (this.messageHandler) {
                    try {
                        await this.messageHandler({
                            jid,
                            text: text.trim(),
                            messageType,
                            raw: message
                        });
                    } catch (error) {
                        logger.error('Error in message handler:', error);
                    }
                }
                
            } catch (error) {
                logger.error('Error processing message:', error);
            }
        }
    }

    /**
     * Handle group participant updates
     * @param {Object} update - Group update object
     * @private
     */
    _handleGroupParticipants(update) {
        const { id, participants, action } = update;
        logger.info(`Group update ${id}: ${action} - ${participants.join(', ')}`);
    }

    /**
     * Handle presence updates
     * @param {Object} update - Presence update object
     * @private
     */
    _handlePresence(update) {
        logger.debug('Presence update:', update);
    }

    /**
     * Disconnect from WhatsApp
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.sock) {
            this.sock.end(undefined);
            this.sock = null;
        }
        this.isConnected = false;
        this.isConnecting = false;
        logger.info('Disconnected from WhatsApp');
    }

    /**
     * Get connection status
     * @returns {ConnectionStatus}
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            provider: 'baileys',
            status: this.isConnected ? 'connected' : (this.isConnecting ? 'connecting' : 'disconnected')
        };
    }

    /**
     * Send a text message
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {Object} [options] - Message options
     * @returns {Promise<MessageResult>}
     */
    async sendMessage(jid, text, options = {}) {
        if (!this.sock) {
            return {
                success: false,
                error: 'Not connected to WhatsApp'
            };
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                text,
                ...options
            });
            
            logger.info(`📤 Message sent to ${jid}`);
            
            return {
                success: true,
                messageId: result?.key?.id
            };
            
        } catch (error) {
            logger.error('Error sending message:', error);
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
        if (!this.sock) {
            return {
                success: false,
                error: 'Not connected to WhatsApp'
            };
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                text,
                footer: footer,
                buttons: buttons.map(btn => ({
                    buttonId: btn.id || btn.key,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1
            });
            
            logger.info(`📤 Button message sent to ${jid}`);
            
            return {
                success: true,
                messageId: result?.key?.id
            };
            
        } catch (error) {
            logger.error('Error sending buttons:', error);
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
        if (!this.sock) {
            return {
                success: false,
                error: 'Not connected to WhatsApp'
            };
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                text,
                buttonText: buttonText,
                sections: sections
            });
            
            logger.info(`📤 List message sent to ${jid}`);
            
            return {
                success: true,
                messageId: result?.key?.id
            };
            
        } catch (error) {
            logger.error('Error sending list message:', error);
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
        if (!this.sock) {
            return {
                success: false,
                error: 'Not connected to WhatsApp'
            };
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                image: image,
                caption: caption
            });
            
            logger.info(`📤 Image sent to ${jid}`);
            
            return {
                success: true,
                messageId: result?.key?.id
            };
            
        } catch (error) {
            logger.error('Error sending image:', error);
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
        if (!this.sock) {
            return {
                success: false,
                error: 'Not connected to WhatsApp'
            };
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                document: document,
                fileName: filename,
                caption: caption
            });
            
            logger.info(`📤 Document sent to ${jid}`);
            
            return {
                success: true,
                messageId: result?.key?.id
            };
            
        } catch (error) {
            logger.error('Error sending document:', error);
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
        if (!this.sock) {
            return null;
        }

        try {
            return await this.sock.onWhatsApp(jid);
        } catch (error) {
            logger.error('Error getting user info:', error);
            return null;
        }
    }

    /**
     * Check if user exists on WhatsApp
     * @param {string} jid - User JID
     * @returns {Promise<boolean>}
     */
    async userExists(jid) {
        const info = await this.getUserInfo(jid);
        return info && info.exists;
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
     * Get the underlying socket instance
     * @returns {makeWASocket|null}
     */
    getClient() {
        return this.sock;
    }

    /**
     * Shutdown the adapter gracefully
     * @returns {Promise<void>}
     */
    async shutdown() {
        logger.info('Shutting down Baileys adapter...');
        
        await this.disconnect();
        
        logger.info('Baileys adapter shutdown complete');
    }
}

export default BaileysAdapter;
