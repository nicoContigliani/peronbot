/**
 * WhatsApp Adapter Interface
 * Common interface for all WhatsApp implementations (Baileys, Business API, etc.)
 * This ensures all adapters have the same methods and behavior
 */

/**
 * @typedef {Object} MessageResult
 * @property {boolean} success - Whether message was sent successfully
 * @property {string} [messageId] - Message ID if sent
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} ConnectionStatus
 * @property {boolean} isConnected - Whether connected to WhatsApp
 * @property {string} [provider] - Provider name (baileys, business-api)
 * @property {string} [status] - Connection status description
 */

/**
 * @typedef {Object} IncomingMessage
 * @property {string} jid - Sender JID (WhatsApp ID)
 * @property {string} text - Message text
 * @property {string} [messageType] - Message type
 * @property {Object} [raw] - Raw message object
 */

/**
 * WhatsApp Adapter Base Class
 * All WhatsApp adapters must extend this class and implement all methods
 */
export class WhatsAppAdapter {
    /**
     * Initialize the adapter
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new Error('Method initialize() must be implemented');
    }

    /**
     * Connect to WhatsApp
     * @returns {Promise<void>}
     */
    async connect() {
        throw new Error('Method connect() must be implemented');
    }

    /**
     * Disconnect from WhatsApp
     * @returns {Promise<void>}
     */
    async disconnect() {
        throw new Error('Method disconnect() must be implemented');
    }

    /**
     * Get connection status
     * @returns {ConnectionStatus}
     */
    getConnectionStatus() {
        throw new Error('Method getConnectionStatus() must be implemented');
    }

    /**
     * Send a text message
     * @param {string} jid - Recipient JID (WhatsApp ID)
     * @param {string} text - Message text
     * @param {Object} [options] - Message options
     * @returns {Promise<MessageResult>}
     */
    async sendMessage(jid, text, options = {}) {
        throw new Error('Method sendMessage() must be implemented');
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
        throw new Error('Method sendButtons() must be implemented');
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
        throw new Error('Method sendListMessage() must be implemented');
    }

    /**
     * Send an image message
     * @param {string} jid - Recipient JID
     * @param {string|Buffer} image - Image URL or Buffer
     * @param {string} [caption] - Image caption
     * @returns {Promise<MessageResult>}
     */
    async sendImage(jid, image, caption = '') {
        throw new Error('Method sendImage() must be implemented');
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
        throw new Error('Method sendDocument() must be implemented');
    }

    /**
     * Get user info
     * @param {string} jid - User JID
     * @returns {Promise<Object|null>}
     */
    async getUserInfo(jid) {
        throw new Error('Method getUserInfo() must be implemented');
    }

    /**
     * Check if user exists on WhatsApp
     * @param {string} jid - User JID
     * @returns {Promise<boolean>}
     */
    async userExists(jid) {
        throw new Error('Method userExists() must be implemented');
    }

    /**
     * Register message handler
     * @param {Function} handler - Message handler function
     */
    onMessage(handler) {
        throw new Error('Method onMessage() must be implemented');
    }

    /**
     * Register connection update handler
     * @param {Function} handler - Connection update handler function
     */
    onConnectionUpdate(handler) {
        throw new Error('Method onConnectionUpdate() must be implemented');
    }

    /**
     * Get the underlying socket/client instance (for advanced usage)
     * @returns {Object|null}
     */
    getClient() {
        throw new Error('Method getClient() must be implemented');
    }

    /**
     * Shutdown the adapter gracefully
     * @returns {Promise<void>}
     */
    async shutdown() {
        throw new Error('Method shutdown() must be implemented');
    }
}

export default WhatsAppAdapter;
