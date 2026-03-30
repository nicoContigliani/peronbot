/**
 * Vehicle DTO (Data Transfer Object)
 * Handles validation and transformation of vehicle data
 */

/**
 * Validate create vehicle data
 * @param {Object} data - Vehicle data to validate
 * @returns {Object} Validation result with valid flag and errors
 */
export function validateCreateVehicle(data) {
    const errors = [];
    
    if (!data.placa || typeof data.placa !== 'string' || data.placa.trim().length < 3) {
        errors.push('Placa is required and must be at least 3 characters');
    }
    
    if (!data.tipo || typeof data.tipo !== 'string') {
        errors.push('Tipo is required');
    } else {
        const validTypes = ['moto', 'auto', 'camioneta', 'bicicleta', 'camion', 'otro'];
        if (!validTypes.includes(data.tipo.toLowerCase())) {
            errors.push(`Tipo must be one of: ${validTypes.join(', ')}`);
        }
    }
    
    if (!data.marca || typeof data.marca !== 'string' || data.marca.trim().length < 2) {
        errors.push('Marca is required and must be at least 2 characters');
    }
    
    if (!data.modelo || typeof data.modelo !== 'string' || data.modelo.trim().length < 1) {
        errors.push('Modelo is required');
    }
    
    if (!data.color || typeof data.color !== 'string' || data.color.trim().length < 2) {
        errors.push('Color is required and must be at least 2 characters');
    }
    
    if (data.capacidad !== undefined && (typeof data.capacidad !== 'number' || data.capacidad < 0)) {
        errors.push('Capacidad must be a non-negative number');
    }
    
    if (!data.repartidor_id || typeof data.repartidor_id !== 'string') {
        errors.push('Repartidor ID is required');
    }
    
    if (data.anio !== undefined && (typeof data.anio !== 'number' || data.anio < 1900 || data.anio > new Date().getFullYear() + 1)) {
        errors.push('Anio must be a valid year');
    }
    
    if (data.observaciones !== undefined && typeof data.observaciones !== 'string') {
        errors.push('Observaciones must be a string');
    }
    
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
        errors.push('isActive must be a boolean');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate update vehicle data
 * @param {Object} data - Vehicle data to validate
 * @returns {Object} Validation result with valid flag and errors
 */
export function validateUpdateVehicle(data) {
    const errors = [];
    
    if (data.placa !== undefined) {
        if (typeof data.placa !== 'string' || data.placa.trim().length < 3) {
            errors.push('Placa must be at least 3 characters');
        }
    }
    
    if (data.tipo !== undefined) {
        if (typeof data.tipo !== 'string') {
            errors.push('Tipo must be a string');
        } else {
            const validTypes = ['moto', 'auto', 'camioneta', 'bicicleta', 'camion', 'otro'];
            if (!validTypes.includes(data.tipo.toLowerCase())) {
                errors.push(`Tipo must be one of: ${validTypes.join(', ')}`);
            }
        }
    }
    
    if (data.marca !== undefined) {
        if (typeof data.marca !== 'string' || data.marca.trim().length < 2) {
            errors.push('Marca must be at least 2 characters');
        }
    }
    
    if (data.modelo !== undefined) {
        if (typeof data.modelo !== 'string' || data.modelo.trim().length < 1) {
            errors.push('Modelo must be at least 1 character');
        }
    }
    
    if (data.color !== undefined) {
        if (typeof data.color !== 'string' || data.color.trim().length < 2) {
            errors.push('Color must be at least 2 characters');
        }
    }
    
    if (data.capacidad !== undefined) {
        if (typeof data.capacidad !== 'number' || data.capacidad < 0) {
            errors.push('Capacidad must be a non-negative number');
        }
    }
    
    if (data.repartidor_id !== undefined) {
        if (typeof data.repartidor_id !== 'string') {
            errors.push('Repartidor ID must be a string');
        }
    }
    
    if (data.anio !== undefined) {
        if (typeof data.anio !== 'number' || data.anio < 1900 || data.anio > new Date().getFullYear() + 1) {
            errors.push('Anio must be a valid year');
        }
    }
    
    if (data.observaciones !== undefined && typeof data.observaciones !== 'string') {
        errors.push('Observaciones must be a string');
    }
    
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
        errors.push('isActive must be a boolean');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate vehicle filter
 * @param {Object} data - Filter data to validate
 * @returns {Object} Validation result with valid flag and sanitized data
 */
export function validateVehicleFilter(data) {
    const errors = [];
    const sanitized = {};
    
    if (data.placa !== undefined) {
        if (typeof data.placa === 'string') {
            sanitized.placa = data.placa.trim();
        } else {
            errors.push('Placa must be a string');
        }
    }
    
    if (data.tipo !== undefined) {
        if (typeof data.tipo === 'string') {
            const validTypes = ['moto', 'auto', 'camioneta', 'bicicleta', 'camion', 'otro'];
            if (validTypes.includes(data.tipo.toLowerCase())) {
                sanitized.tipo = data.tipo.toLowerCase();
            } else {
                errors.push(`Tipo must be one of: ${validTypes.join(', ')}`);
            }
        } else {
            errors.push('Tipo must be a string');
        }
    }
    
    if (data.marca !== undefined) {
        if (typeof data.marca === 'string') {
            sanitized.marca = data.marca.trim();
        } else {
            errors.push('Marca must be a string');
        }
    }
    
    if (data.modelo !== undefined) {
        if (typeof data.modelo === 'string') {
            sanitized.modelo = data.modelo.trim();
        } else {
            errors.push('Modelo must be a string');
        }
    }
    
    if (data.color !== undefined) {
        if (typeof data.color === 'string') {
            sanitized.color = data.color.trim();
        } else {
            errors.push('Color must be a string');
        }
    }
    
    if (data.repartidor_id !== undefined) {
        if (typeof data.repartidor_id === 'string') {
            sanitized.repartidor_id = data.repartidor_id.trim();
        } else {
            errors.push('Repartidor ID must be a string');
        }
    }
    
    if (data.isActive !== undefined) {
        if (data.isActive === 'true' || data.isActive === true) {
            sanitized.isActive = true;
        } else if (data.isActive === 'false' || data.isActive === false) {
            sanitized.isActive = false;
        } else {
            errors.push('isActive must be a boolean');
        }
    }
    
    if (data.createdAfter !== undefined) {
        const date = new Date(data.createdAfter);
        if (!isNaN(date.getTime())) {
            sanitized.createdAfter = date;
        } else {
            errors.push('createdAfter must be a valid date');
        }
    }
    
    if (data.createdBefore !== undefined) {
        const date = new Date(data.createdBefore);
        if (!isNaN(date.getTime())) {
            sanitized.createdBefore = date;
        } else {
            errors.push('createdBefore must be a valid date');
        }
    }
    
    if (data.page !== undefined) {
        const page = parseInt(data.page);
        if (!isNaN(page) && page > 0) {
            sanitized.page = page;
        } else {
            errors.push('Page must be a positive integer');
        }
    }
    
    if (data.limit !== undefined) {
        const limit = parseInt(data.limit);
        if (!isNaN(limit) && limit > 0 && limit <= 100) {
            sanitized.limit = limit;
        } else {
            errors.push('Limit must be a positive integer up to 100');
        }
    }
    
    if (data.sortBy !== undefined) {
        const allowedFields = ['placa', 'tipo', 'marca', 'modelo', 'color', 'createdAt', 'updatedAt'];
        if (allowedFields.includes(data.sortBy)) {
            sanitized.sortBy = data.sortBy;
        } else {
            errors.push(`sortBy must be one of: ${allowedFields.join(', ')}`);
        }
    }
    
    if (data.sortOrder !== undefined) {
        if (['asc', 'desc'].includes(data.sortOrder)) {
            sanitized.sortOrder = data.sortOrder;
        } else {
            errors.push('sortOrder must be asc or desc');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Transform vehicle to response format
 * @param {Object} vehicle - Vehicle object
 * @returns {Object} Transformed vehicle
 */
export function toVehicleResponse(vehicle) {
    if (!vehicle) return null;
    
    return {
        id: vehicle._id,
        placa: vehicle.placa,
        tipo: vehicle.tipo,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        color: vehicle.color,
        capacidad: vehicle.capacidad || 0,
        anio: vehicle.anio,
        repartidor_id: vehicle.repartidor_id,
        observaciones: vehicle.observaciones,
        isActive: vehicle.isActive,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt
    };
}

/**
 * Transform array of vehicles to response format
 * @param {Object[]} vehicles - Array of vehicle objects
 * @returns {Object[]} Transformed vehicles
 */
export function toVehicleResponseArray(vehicles) {
    return vehicles.map(toVehicleResponse);
}

export default {
    validateCreateVehicle,
    validateUpdateVehicle,
    validateVehicleFilter,
    toVehicleResponse,
    toVehicleResponseArray
};
