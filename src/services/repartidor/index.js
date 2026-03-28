/**
 * Repartidor Service Module
 * Main export for delivery driver service layer
 */

export { RepartidorService } from './repartidor.service.js';
export { createRepartidorExpressAdapter } from './adapters/express.adapter.js';
export { createRepartidorBotAdapter } from './adapters/bot.adapter.js';
export { AppError } from '../../core/errors/AppError.js';
export * from '../../apiservices/repartidores/dto/repartidor.dto.js';
