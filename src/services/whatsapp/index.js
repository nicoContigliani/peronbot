/**
 * WhatsApp Module
 * Exports all WhatsApp-related classes and functions
 */

export { WhatsAppAdapter } from './WhatsAppAdapter.js';
export { BaileysAdapter } from './baileys/BaileysAdapter.js';
export { BusinessAPIAdapter } from './business-api/BusinessAPIAdapter.js';
export { WebhookHandler, createWebhookHandler } from './business-api/webhookHandler.js';
export { 
    WhatsAppFactory, 
    WhatsAppProvider, 
    createWhatsAppAdapter 
} from './WhatsAppFactory.js';

export default {
    WhatsAppAdapter,
    BaileysAdapter,
    BusinessAPIAdapter,
    WebhookHandler,
    WhatsAppFactory,
    WhatsAppProvider,
    createWhatsAppAdapter,
    createWebhookHandler
};
