/**
 * Broadcast Controller
 * Handles HTTP requests for broadcast operations
 */

import BotClient from '@/bot/BotClient.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Send broadcast messages to multiple clients
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function sendBroadcast(req, res) {
    try {
        const { userId, companyName, message, shift, deliveryPerson, clients, messageOptions } = req.body;

        console.log('🔍 [BROADCAST CONTROLLER] Received broadcast request:', {
            userId,
            companyName,
            clientsCount: clients?.length,
            deliveryPersonName: deliveryPerson?.name,
            deliveryPersonPhone: deliveryPerson?.phone,
            shift,
            hasMessageOptions: !!messageOptions && Object.keys(messageOptions).length > 0
        });

        // Validate required fields
        if (!userId || !companyName || !message || !shift || !deliveryPerson?.name || !deliveryPerson?.phone || !clients?.length) {
            console.log('❌ [BROADCAST CONTROLLER] Validation failed - Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Validate delivery person phone
        if (!/^\+?[1-9]\d{1,14}$/.test(deliveryPerson.phone.replace(/[\s\-()]/g, ''))) {
            console.log('❌ [BROADCAST CONTROLLER] Validation failed - Invalid delivery person phone:', deliveryPerson.phone);
            return res.status(400).json({
                success: false,
                error: 'Invalid delivery person phone number'
            });
        }

        // Validate clients
        for (const client of clients) {
            if (!client.phone || !/^\+?[1-9]\d{1,14}$/.test(client.phone.replace(/[\s\-()]/g, ''))) {
                console.log('❌ [BROADCAST CONTROLLER] Validation failed - Invalid client phone:', client.phone);
                return res.status(400).json({
                    success: false,
                    error: `Invalid client phone number: ${client.phone}`
                });
            }
        }

        // Check if bot is connected
        let botConnected = BotClient.getConnectionStatus();
        console.log('🔍 [BROADCAST CONTROLLER] Bot connection status:', botConnected);
        
        if (!botConnected) {
            console.log('⚠️ [BROADCAST CONTROLLER] Bot is not connected, attempting to reconnect...');
            
            try {
                // Attempt to reconnect
                await BotClient.connect();
                
                // Wait a moment for connection to establish
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Check connection status again
                botConnected = BotClient.getConnectionStatus();
                console.log('🔍 [BROADCAST CONTROLLER] Bot connection status after reconnect:', botConnected);
                
                if (!botConnected) {
                    console.log('❌ [BROADCAST CONTROLLER] Failed to reconnect bot');
                    return res.status(503).json({
                        success: false,
                        error: 'WhatsApp bot is not connected and failed to reconnect. Please check the bot status.'
                    });
                }
                
                console.log('✅ [BROADCAST CONTROLLER] Bot reconnected successfully');
            } catch (reconnectError) {
                console.error('❌ [BROADCAST CONTROLLER] Error reconnecting bot:', reconnectError.message);
                return res.status(503).json({
                    success: false,
                    error: 'WhatsApp bot is not connected and failed to reconnect. Please check the bot status.'
                });
            }
        }

        logger.info(`Starting broadcast for ${clients.length} clients`);
        console.log('🔍 [BROADCAST CONTROLLER] Starting to send messages to', clients.length, 'clients');

        // Send messages to all clients
        const results = [];
        const errors = [];

        for (let i = 0; i < clients.length; i++) {
            const client = clients[i];
            try {
                // Format phone number for WhatsApp (add @s.whatsapp.net)
                const phoneNumber = client.phone.replace(/[\s\-()]/g, '');
                const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;

                console.log(`🔍 [BROADCAST CONTROLLER] Sending message ${i + 1}/${clients.length} to:`, {
                    phone: client.phone,
                    jid,
                    name: client.name
                });

                // Use messageOptions if provided, otherwise use text message
                let result;
                if (messageOptions && Object.keys(messageOptions).length > 0) {
                    // Send message with options (image, audio, contact, etc.)
                    console.log('🔍 [BROADCAST CONTROLLER] Sending with messageOptions:', Object.keys(messageOptions));
                    result = await BotClient.sendMessage(jid, messageOptions);
                } else {
                    // Send plain text message
                    console.log('🔍 [BROADCAST CONTROLLER] Sending plain text message');
                    result = await BotClient.sendMessage(jid, { text: message });
                }
                
                results.push({
                    phone: client.phone,
                    name: client.name,
                    status: 'sent',
                    messageId: result?.key?.id
                });

                logger.info(`Message sent to ${client.phone} (${i + 1}/${clients.length})`);
                console.log(`✅ [BROADCAST CONTROLLER] Message sent successfully to ${client.phone}`);

                // Add delay between messages to avoid rate limiting
                if (i < clients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                }
            } catch (error) {
                logger.error(`Error sending message to ${client.phone}:`, error.message);
                console.error(`❌ [BROADCAST CONTROLLER] Error sending message to ${client.phone}:`, error.message);
                console.error('Error stack:', error.stack);
                errors.push({
                    phone: client.phone,
                    name: client.name,
                    status: 'error',
                    error: error.message
                });
            }
        }

        const broadcastResult = {
            id: `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            companyName,
            message,
            shift,
            deliveryPerson,
            totalClients: clients.length,
            sent: results.length,
            failed: errors.length,
            results,
            errors,
            status: errors.length === 0 ? 'completed' : 'partial',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        };

        logger.info(`Broadcast completed: ${results.length} sent, ${errors.length} failed`);

        res.status(201).json({
            success: true,
            data: broadcastResult
        });
    } catch (error) {
        logger.error('Error sending broadcast:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get broadcast status
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getBroadcastStatus(req, res) {
    try {
        const { id } = req.params;
        
        // In a real implementation, you would fetch from database
        // For now, return a simple response
        res.json({
            success: true,
            data: {
                id,
                status: 'completed',
                message: 'Broadcast status endpoint - implement database storage for production'
            }
        });
    } catch (error) {
        logger.error('Error getting broadcast status:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export default {
    sendBroadcast,
    getBroadcastStatus
};
