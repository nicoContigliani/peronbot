/**
 * Bot Adapter for Repartidor Service
 * Example of how to use the pure service layer with Telegram/WhatsApp Bot
 */

import { RepartidorService } from '@/services/repartidor/repartidor.service.js';
import { AppError } from '@/core/errors/AppError.js';
import { getDB } from '@/database/db.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Create Bot adapter for repartidor service
 * @param {Object} [options] - Adapter options
 * @returns {Object} Bot adapter with repartidor commands
 */
export function createRepartidorBotAdapter(options = {}) {
    // Initialize service with dependency injection
    let service = null;
    
    /**
     * Initialize service with database
     */
    async function initService() {
        if (!service) {
            const db = await getDB();
            service = new RepartidorService(db, options);
        }
        return service;
    }
    
    /**
     * Handle service errors and format for bot
     * @param {Error} error - Error object
     * @returns {Object} Formatted error for bot
     */
    function formatError(error) {
        if (error instanceof AppError) {
            return {
                success: false,
                message: error.message,
                code: error.code,
                type: error.type
            };
        }
        
        logger.error('Unexpected error:', error);
        return {
            success: false,
            message: 'Ocurrió un error inesperado',
            code: 'INTERNAL_ERROR',
            type: 'INTERNAL'
        };
    }
    
    /**
     * Handle bot command to create repartidor
     * @param {Object} botMessage - Bot message object
     * @returns {Promise<Object>} Result for bot
     */
    async function handleCreateRepartidor(botMessage) {
        try {
            const svc = await initService();
            
            // Extract data from bot message
            const data = {
                nombre: botMessage.nombre,
                telefono: botMessage.telefono,
                email: botMessage.email,
                vehiculo: botMessage.vehiculo || 'moto',
                placa: botMessage.placa,
                zona: botMessage.zona
            };
            
            const result = await svc.createRepartidor(data);
            
            return {
                success: true,
                message: `Repartidor ${result.data.nombre} creado exitosamente`,
                data: result.data
            };
        } catch (error) {
            return formatError(error);
        }
    }
    
    /**
     * Handle bot command to update location
     * @param {Object} botMessage - Bot message object with location
     * @returns {Promise<Object>} Result for bot
     */
    async function handleUpdateLocation(botMessage) {
        try {
            const svc = await initService();
            
            // Extract location from bot message
            const data = {
                repartidorId: botMessage.repartidorId,
                latitude: botMessage.latitude,
                longitude: botMessage.longitude,
                accuracy: botMessage.accuracy,
                speed: botMessage.speed,
                heading: botMessage.heading,
                timestamp: botMessage.timestamp || new Date().toISOString()
            };
            
            const result = await svc.updateLocation(data);
            
            return {
                success: true,
                message: `Ubicación actualizada para ${result.data.nombre}`,
                data: result.data
            };
        } catch (error) {
            return formatError(error);
        }
    }
    
    /**
     * Handle bot command to update status
     * @param {Object} botMessage - Bot message object
     * @returns {Promise<Object>} Result for bot
     */
    async function handleUpdateStatus(botMessage) {
        try {
            const svc = await initService();
            
            const result = await svc.updateStatus(botMessage.repartidorId, botMessage.estado);
            
            const statusMessages = {
                'disponible': 'ahora está disponible',
                'ocupado': 'ahora está ocupado',
                'offline': 'ahora está desconectado'
            };
            
            return {
                success: true,
                message: `${result.data.nombre} ${statusMessages[result.data.estado]}`,
                data: result.data
            };
        } catch (error) {
            return formatError(error);
        }
    }
    
    /**
     * Handle bot command to get repartidor info
     * @param {Object} botMessage - Bot message object
     * @returns {Promise<Object>} Result for bot
     */
    async function handleGetRepartidor(botMessage) {
        try {
            const svc = await initService();
            
            const result = await svc.getRepartidorById(botMessage.repartidorId);
            
            return {
                success: true,
                message: `Información de ${result.data.nombre}`,
                data: result.data
            };
        } catch (error) {
            return formatError(error);
        }
    }
    
    /**
     * Handle bot command to get nearby repartidores
     * @param {Object} botMessage - Bot message object with location
     * @returns {Promise<Object>} Result for bot
     */
    async function handleGetNearby(botMessage) {
        try {
            const svc = await initService();
            
            const result = await svc.getNearbyRepartidores(
                botMessage.longitude,
                botMessage.latitude,
                botMessage.maxDistance || 5000,
                { limit: botMessage.limit || 5 }
            );
            
            return {
                success: true,
                message: `Se encontraron ${result.data.length} repartidores cercanos`,
                data: result.data
            };
        } catch (error) {
            return formatError(error);
        }
    }
    
    /**
     * Process bot message and route to appropriate handler
     * @param {Object} botMessage - Bot message object
     * @returns {Promise<Object>} Result for bot
     */
    async function processMessage(botMessage) {
        const { command } = botMessage;
        
        switch (command) {
            case 'create_repartidor':
                return handleCreateRepartidor(botMessage);
            
            case 'update_location':
                return handleUpdateLocation(botMessage);
            
            case 'update_status':
                return handleUpdateStatus(botMessage);
            
            case 'get_repartidor':
                return handleGetRepartidor(botMessage);
            
            case 'get_nearby':
                return handleGetNearby(botMessage);
            
            default:
                return {
                    success: false,
                    message: `Comando no reconocido: ${command}`,
                    code: 'UNKNOWN_COMMAND',
                    type: 'VALIDATION'
                };
        }
    }
    
    return {
        processMessage,
        handleCreateRepartidor,
        handleUpdateLocation,
        handleUpdateStatus,
        handleGetRepartidor,
        handleGetNearby
    };
}

export default createRepartidorBotAdapter;
