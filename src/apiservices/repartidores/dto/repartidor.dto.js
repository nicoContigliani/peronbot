/**
 * Repartidor DTO (Data Transfer Object)
 * Defines data structures and validation for delivery driver operations
 */

import { AppError } from '@/core/errors/AppError.js';

/**
 * @typedef {Object} LocationUpdateDTO
 * @property {string} repartidorId - Driver ID
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 * @property {number} [accuracy] - GPS accuracy in meters
 * @property {number} [speed] - Speed in km/h
 * @property {number} [heading] - Direction in degrees (0-360)
 * @property {string} [timestamp] - ISO timestamp of location update
 */

/**
 * @typedef {Object} RepartidorCreateDTO
 * @property {string} nombre - Driver name
 * @property {string} telefono - Phone number
 * @property {string} email - Email address
 * @property {string} [vehiculo] - Vehicle type (moto, bici, auto)
 * @property {string} [placa] - Vehicle plate number
 * @property {string} [zona] - Operating zone
 */

/**
 * @typedef {Object} RepartidorUpdateDTO
 * @property {string} [nombre] - Driver name
 * @property {string} [telefono] - Phone number
 * @property {string} [email] - Email address
 * @property {string} [vehiculo] - Vehicle type
 * @property {string} [placa] - Vehicle plate number
 * @property {string} [zona] - Operating zone
 * @property {string} [estado] - Driver status (disponible, ocupado, offline)
 */

/**
 * @typedef {Object} RepartidorResponseDTO
 * @property {string} id - Driver ID
 * @property {string} nombre - Driver name
 * @property {string} telefono - Phone number
 * @property {string} email - Email address
 * @property {string} vehiculo - Vehicle type
 * @property {string} placa - Vehicle plate number
 * @property {string} zona - Operating zone
 * @property {string} estado - Driver status
 * @property {Object} ubicacion - Current location
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * Validate location update data
 * @param {Object} data - Location update data
 * @returns {LocationUpdateDTO} Validated and sanitized data
 * @throws {AppError} If validation fails
 */
export function validateLocationUpdate(data) {
    const errors = [];

    if (!data.repartidorId || typeof data.repartidorId !== 'string') {
        errors.push('repartidorId is required and must be a string');
    }

    if (data.latitude === undefined || typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
        errors.push('latitude is required and must be a number between -90 and 90');
    }

    if (data.longitude === undefined || typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
        errors.push('longitude is required and must be a number between -180 and 180');
    }

    if (data.accuracy !== undefined && (typeof data.accuracy !== 'number' || data.accuracy < 0)) {
        errors.push('accuracy must be a non-negative number');
    }

    if (data.speed !== undefined && (typeof data.speed !== 'number' || data.speed < 0)) {
        errors.push('speed must be a non-negative number');
    }

    if (data.heading !== undefined && (typeof data.heading !== 'number' || data.heading < 0 || data.heading > 360)) {
        errors.push('heading must be a number between 0 and 360');
    }

    if (data.timestamp !== undefined && isNaN(new Date(data.timestamp).getTime())) {
        errors.push('timestamp must be a valid ISO date string');
    }

    if (errors.length > 0) {
        throw AppError.validation('Invalid location update data', { errors });
    }

    return {
        repartidorId: data.repartidorId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        timestamp: data.timestamp || new Date().toISOString()
    };
}

/**
 * Validate repartidor create data
 * @param {Object} data - Repartidor create data
 * @returns {RepartidorCreateDTO} Validated and sanitized data
 * @throws {AppError} If validation fails
 */
export function validateRepartidorCreate(data) {
    const errors = [];

    if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length < 2) {
        errors.push('nombre is required and must be at least 2 characters');
    }

    if (!data.telefono || typeof data.telefono !== 'string') {
        errors.push('telefono is required and must be a string');
    }

    if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
        errors.push('email is required and must be a valid email address');
    }

    if (data.vehiculo !== undefined && !['moto', 'bici', 'auto'].includes(data.vehiculo)) {
        errors.push('vehiculo must be one of: moto, bici, auto');
    }

    if (data.placa !== undefined && typeof data.placa !== 'string') {
        errors.push('placa must be a string');
    }

    if (data.zona !== undefined && typeof data.zona !== 'string') {
        errors.push('zona must be a string');
    }

    if (errors.length > 0) {
        throw AppError.validation('Invalid repartidor create data', { errors });
    }

    return {
        nombre: data.nombre.trim(),
        telefono: data.telefono.trim(),
        email: data.email.trim().toLowerCase(),
        vehiculo: data.vehiculo || 'moto',
        placa: data.placa?.trim(),
        zona: data.zona?.trim()
    };
}

/**
 * Validate repartidor update data
 * @param {Object} data - Repartidor update data
 * @returns {RepartidorUpdateDTO} Validated and sanitized data
 * @throws {AppError} If validation fails
 */
export function validateRepartidorUpdate(data) {
    const errors = [];

    if (data.nombre !== undefined && (typeof data.nombre !== 'string' || data.nombre.trim().length < 2)) {
        errors.push('nombre must be at least 2 characters');
    }

    if (data.telefono !== undefined && typeof data.telefono !== 'string') {
        errors.push('telefono must be a string');
    }

    if (data.email !== undefined && (typeof data.email !== 'string' || !data.email.includes('@'))) {
        errors.push('email must be a valid email address');
    }

    if (data.vehiculo !== undefined && !['moto', 'bici', 'auto'].includes(data.vehiculo)) {
        errors.push('vehiculo must be one of: moto, bici, auto');
    }

    if (data.placa !== undefined && typeof data.placa !== 'string') {
        errors.push('placa must be a string');
    }

    if (data.zona !== undefined && typeof data.zona !== 'string') {
        errors.push('zona must be a string');
    }

    if (data.estado !== undefined && !['disponible', 'ocupado', 'offline'].includes(data.estado)) {
        errors.push('estado must be one of: disponible, ocupado, offline');
    }

    if (errors.length > 0) {
        throw AppError.validation('Invalid repartidor update data', { errors });
    }

    const result = {};
    if (data.nombre !== undefined) result.nombre = data.nombre.trim();
    if (data.telefono !== undefined) result.telefono = data.telefono.trim();
    if (data.email !== undefined) result.email = data.email.trim().toLowerCase();
    if (data.vehiculo !== undefined) result.vehiculo = data.vehiculo;
    if (data.placa !== undefined) result.placa = data.placa.trim();
    if (data.zona !== undefined) result.zona = data.zona.trim();
    if (data.estado !== undefined) result.estado = data.estado;

    return result;
}

/**
 * Transform repartidor to response format
 * @param {Object} repartidor - Repartidor object
 * @returns {RepartidorResponseDTO} Transformed repartidor
 */
export function toRepartidorResponse(repartidor) {
    if (!repartidor) return null;

    return {
        id: repartidor._id,
        nombre: repartidor.nombre,
        telefono: repartidor.telefono,
        email: repartidor.email,
        vehiculo: repartidor.vehiculo,
        placa: repartidor.placa,
        zona: repartidor.zona,
        estado: repartidor.estado,
        ubicacion: repartidor.ubicacion || null,
        createdAt: repartidor.createdAt,
        updatedAt: repartidor.updatedAt
    };
}

/**
 * Transform array of repartidores to response format
 * @param {Object[]} repartidores - Array of repartidor objects
 * @returns {RepartidorResponseDTO[]} Transformed repartidores
 */
export function toRepartidorResponseArray(repartidores) {
    return repartidores.map(toRepartidorResponse);
}

export default {
    validateLocationUpdate,
    validateRepartidorCreate,
    validateRepartidorUpdate,
    toRepartidorResponse,
    toRepartidorResponseArray
};
