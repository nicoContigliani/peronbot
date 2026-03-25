/**
 * WhatsApp Bot Client
 * Manages connection to WhatsApp using Baileys with full error handling
 */
import makeWASocketModule from '@whiskeysockets/baileys';
const { makeWASocket, useMultiFileAuthState, DisconnectReason, delay, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = makeWASocketModule;
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';
import { config } from '../config/env.js';
import { connectDB, closeDB } from '../database/db.js';
import { handleMessages } from './handlers/messageHandler.js';

const logger = pino({ level: config.logging.level });

/**
 * Bot Client Class
 * Handles WhatsApp connection, reconnection, and events
 */
export class BotClient {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.retryCount = 0;
        this.maxRetries = config.connection.maxRetries;
    }

    /**
     * Initialize and connect to WhatsApp
     * @returns {Promise<makeWASocket>} Socket instance
     */
    async connect() {
        if (this.isConnected) {
            logger.info('Already connected to WhatsApp');
            return this.sock;
        }

        if (this.isConnecting) {
            logger.info('Connection in progress...');
            await delay(2000);
            return this.sock;
        }

        this.isConnecting = true;

        try {
            logger.info('--- Initializing WhatsApp Connection ---');

            // Fetch latest Baileys version
            const { version, isLatest } = await fetchLatestBaileysVersion();
            logger.info(`Using Baileys version: ${version.join('.')} (latest: ${isLatest})`);

            // Load or create session
            let { state, saveCreds } = await useMultiFileAuthState(config.sessionFolder);
            
            // Check if session is valid, if not delete and recreate
            if (!state.creds || !state.creds.me) {
                console.log('⚠️ Invalid session detected, creating new one...');
                // Delete old session files
                const fs = await import('fs');
                const path = await import('path');
                const sessionPath = path.resolve(config.sessionFolder);
                
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
                
                // Create fresh session
                ({ state, saveCreds } = await useMultiFileAuthState(config.sessionFolder));
            }
            
            // Create socket with optimized settings
            this.sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger)
                },
                printQRInTerminal: true,
                logger: logger,
                browser: [config.bot.browser, 'Chrome', config.bot.browserVersion],
                mobile: config.bot.mobile,
                connectTimeoutMs: config.connection.timeout,
                keepAliveIntervalMs: 30000,
                // Don't emit own events to avoid double processing
                emitOwnEvents: false,
                // Retry configuration
                retryRequestDelayMs: 500,
                maxMsgRetryCount: 3,
            });

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

            return this.sock;

        } catch (error) {
            this.isConnecting = false;
            logger.error('❌ Failed to initialize bot:', error);
            throw error;
        }
    }

    /**
     * Handle connection state updates
     * @param {Object} update - Connection update object
     */
    async handleConnectionUpdate(update) {
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
            console.log(`   🤖 ${config.bot.name} is now ONLINE!`);
            console.log('   ═════════════════════════════════════\n');
            
            // Initialize message handler
            handleMessages(this.sock);
        }

        if (connection === 'close') {
            this.isConnected = false;
            this.isConnecting = false;
            
            const reason = lastDisconnect?.error 
                ? lastDisconnect.error.message 
                : 'Unknown reason';
            
            console.log(`\n❌ Connection closed: ${reason}`);

            // Check if should reconnect
            const shouldReconnect = this.shouldReconnect(lastDisconnect);
            
            if (shouldReconnect && this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`\n⏳ Attempting to reconnect (${this.retryCount}/${this.maxRetries})...`);
                await delay(config.connection.retryDelay);
                await this.connect();
            } else if (!shouldReconnect) {
                console.log('\n🛑 Logged out or session invalid.');
                console.log('   Delete the session folder to re-authenticate:');
                console.log(`   rm -rf ${config.sessionFolder}\n`);
                await this.shutdown();
            } else {
                console.log('\n❌ Max reconnection attempts reached.');
                await this.shutdown();
            }
        }

        if (status) {
            logger.info(`Status: ${status}`);
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
            
            // Don't reconnect for bad session (requires re-auth)
            if (statusCode === DisconnectReason.badSession) {
                return false;
            }
            
            // Check for conflict (session replaced by another device)
            const errorString = lastDisconnect.error.toString();
            if (errorString.includes('conflict') || errorString.includes('replaced')) {
                // This means another session took over - don't keep retrying
                // User needs to log out from WhatsApp Web/Desktop
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
     */
    async handleMessages(messages, type) {
        if (type !== 'notify') return;
        
        for (const message of messages) {
            try {
                // Skip own messages and status updates
                if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') {
                    continue;
                }

                // Process message (handled by messageHandler.js)
                await this.processMessage(message);
                
            } catch (error) {
                logger.error('Error processing message:', error);
            }
        }
    }

    /**
     * Process a single message
     * @param {Object} message - Message object
     */
    async processMessage(message) {
        const jid = message.key.remoteJid;
        const messageType = Object.keys(message.message || {})[0];
        
        // Extract text based on message type
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

        // Store message in database
        try {
            const { saveMessage } = await import('../database/db.js');
            await saveMessage(jid, {
                type: messageType,
                text,
                fromMe: false,
                messageId: message.key.id
            });
        } catch (error) {
            logger.warn('Could not save message to database:', error.message);
        }

        // Emit event for message handler
        if (this.onMessage) {
            await this.onMessage({
                jid,
                text: text.trim(),
                messageType,
                message,
                raw: message
            });
        }
    }

    /**
     * Handle group participant updates
     * @param {Object} update - Group update object
     */
    handleGroupParticipants(update) {
        const { id, participants, action } = update;
        logger.info(`Group update ${id}: ${action} - ${participants.join(', ')}`);
    }

    /**
     * Handle presence updates
     * @param {Object} update - Presence update object
     */
    handlePresence(update) {
        logger.debug('Presence update:', update);
    }

    /**
     * Send a text message
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {Object} options - Message options
     */
    async sendMessage(jid, text, options = {}) {
        if (!this.sock) {
            throw new Error('Bot not connected');
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                text,
                ...options
            });
            
            logger.info(`📤 Message sent to ${jid}`);
            
            // Store in database
            try {
                const { saveMessage } = await import('../database/db.js');
                await saveMessage(jid, {
                    type: 'text',
                    text,
                    fromMe: true,
                    messageId: result.key.id
                });
            } catch (error) {
                logger.warn('Could not save sent message:', error.message);
            }
            
            return result;
            
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Send a message with buttons
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {Array} buttons - Array of button objects
     * @param {string} footer - Optional footer
     */
    async sendButtons(jid, text, buttons, footer = null) {
        if (!this.sock) {
            throw new Error('Bot not connected');
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
            return result;
            
        } catch (error) {
            logger.error('Error sending buttons:', error);
            throw error;
        }
    }

    /**
     * Send a list message
     * @param {string} jid - Recipient JID
     * @param {string} text - Message text
     * @param {string} buttonText - Button text
     * @param {Array} sections - Array of sections with rows
     */
    async sendListMessage(jid, text, buttonText, sections) {
        if (!this.sock) {
            throw new Error('Bot not connected');
        }

        try {
            const result = await this.sock.sendMessage(jid, {
                text,
                buttonText: buttonText,
                sections: sections
            });
            
            logger.info(`📤 List message sent to ${jid}`);
            return result;
            
        } catch (error) {
            logger.error('Error sending list message:', error);
            throw error;
        }
    }

    /**
     * Get user info
     * @param {string} jid - User JID
     */
    async getUserInfo(jid) {
        if (!this.sock) {
            throw new Error('Bot not connected');
        }

        try {
            return await this.sock.onWhatsApp(jid);
        } catch (error) {
            logger.error('Error getting user info:', error);
            throw error;
        }
    }

    /**
     * Get the socket instance
     * @returns {makeWASocket|null}
     */
    getSocket() {
        return this.sock;
    }

    /**
     * Check if connected
     * @returns {boolean}
     */
    getConnectionStatus() {
        return this.isConnected;
    }

    /**
     * Shutdown the bot gracefully
     */
    async shutdown() {
        logger.info('Shutting down bot...');
        
        if (this.sock) {
            this.sock.end(undefined);
            this.sock = null;
        }
        
        this.isConnected = false;
        this.isConnecting = false;
        
        try {
            await closeDB();
        } catch (error) {
            logger.error('Error closing database:', error);
        }
        
        logger.info('Bot shutdown complete');
        process.exit(0);
    }
}

// Export a singleton instance
export default new BotClient();
