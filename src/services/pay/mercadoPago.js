/**
 * MercadoPago Integration Service
 * Handles payment processing for the bot
 */
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configure MercadoPago client
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    integratorId: 'dev_123456789'
});

// Create client instances for different operations
const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

/**
 * Create a payment preference
 * @param {Object} item - Product item
 * @param {string} customerEmail - Customer email
 * @param {string} externalReference - Order reference ID
 * @returns {Object} Payment preference
 */
export async function createPaymentPreference(item, customerEmail, externalReference) {
    const preference = {
        items: [
            {
                id: item.id || 'product_' + Date.now(),
                title: item.title,
                description: item.description || '',
                quantity: item.quantity || 1,
                unit_price: item.unit_price,
                currency_id: 'ARS',
                picture_url: item.picture_url || ''
            }
        ],
        payer: {
            email: customerEmail
        },
        external_reference: externalReference,
        notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL || '',
        auto_return: 'approved',
        back_urls: {
            success: process.env.MP_SUCCESS_URL || 'whatsapp://success',
            failure: process.env.MP_FAILURE_URL || 'whatsapp://failure',
            pending: process.env.MP_PENDING_URL || 'whatsapp://pending'
        }
    };

    try {
        const response = await preferenceClient.create(preference);
        return {
            success: true,
            preferenceId: response.id,
            initPoint: response.init_point,
            sandboxInitPoint: response.sandbox_init_point
        };
    } catch (error) {
        console.error('Error creating payment preference:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Create payment for multiple items (cart)
 * @param {Array} items - Array of product items
 * @param {string} customerEmail - Customer email
 * @param {string} externalReference - Order reference ID
 * @returns {Object} Payment preference
 */
export async function createCartPayment(items, customerEmail, externalReference) {
    const preference = {
        items: items.map((item, index) => ({
            id: item.id || `product_${index}_${Date.now()}`,
            title: item.title,
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price,
            currency_id: 'ARS',
            picture_url: item.picture_url || ''
        })),
        payer: {
            email: customerEmail
        },
        external_reference: externalReference,
        notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL || '',
        auto_return: 'approved',
        back_urls: {
            success: process.env.MP_SUCCESS_URL || 'whatsapp://success',
            failure: process.env.MP_FAILURE_URL || 'whatsapp://failure',
            pending: process.env.MP_PENDING_URL || 'whatsapp://pending'
        }
    };

    try {
        const response = await preferenceClient.create(preference);
        return {
            success: true,
            preferenceId: response.id,
            initPoint: response.init_point,
            sandboxInitPoint: response.sandbox_init_point
        };
    } catch (error) {
        console.error('Error creating cart payment:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get payment status
 * @param {string} paymentId - Payment ID
 * @returns {Object} Payment status
 */
export async function getPaymentStatus(paymentId) {
    try {
        const payment = await paymentClient.findById(paymentId);
        return {
            success: true,
            status: payment.status,
            statusDetail: payment.status_detail,
            transactionAmount: payment.transaction_amount,
            externalReference: payment.external_reference
        };
    } catch (error) {
        console.error('Error getting payment status:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get public key for frontend
 * @returns {string} Public key
 */
export function getPublicKey() {
    return process.env.MERCADO_PAGO_PUBLIC_KEY;
}

/**
 * Check if MercadoPago is configured
 * @returns {boolean}
 */
export function isConfigured() {
    return !!(process.env.MERCADO_PAGO_ACCESS_TOKEN && process.env.MERCADO_PAGO_PUBLIC_KEY);
}

export default {
    createPaymentPreference,
    createCartPayment,
    getPaymentStatus,
    getPublicKey,
    isConfigured
};
