/**
 * AppError - Custom error class for application errors
 * Provides structured error handling with error codes and types
 */

export class AppError extends Error {
    /**
     * @param {string} message - Human-readable error message
     * @param {string} code - Error code for programmatic handling
     * @param {string} type - Error type (VALIDATION, NOT_FOUND, DATABASE, CONFLICT, etc.)
     * @param {Object} [details] - Additional error details
     */
    constructor(message, code, type, details = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.type = type;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        // Maintains proper stack trace in V8 engines
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }

    /**
     * Convert error to JSON format
     * @returns {Object} JSON representation of error
     */
    toJSON() {
        return {
            success: false,
            error: {
                name: this.name,
                message: this.message,
                code: this.code,
                type: this.type,
                details: this.details,
                timestamp: this.timestamp
            }
        };
    }

    /**
     * Create validation error
     * @param {string} message - Error message
     * @param {Object} [details] - Validation details
     * @returns {AppError}
     */
    static validation(message, details = {}) {
        return new AppError(message, 'VALIDATION_ERROR', 'VALIDATION', details);
    }

    /**
     * Create not found error
     * @param {string} message - Error message
     * @param {Object} [details] - Not found details
     * @returns {AppError}
     */
    static notFound(message, details = {}) {
        return new AppError(message, 'NOT_FOUND', 'NOT_FOUND', details);
    }

    /**
     * Create database error
     * @param {string} message - Error message
     * @param {Object} [details] - Database error details
     * @returns {AppError}
     */
    static database(message, details = {}) {
        return new AppError(message, 'DATABASE_ERROR', 'DATABASE', details);
    }

    /**
     * Create conflict error
     * @param {string} message - Error message
     * @param {Object} [details] - Conflict details
     * @returns {AppError}
     */
    static conflict(message, details = {}) {
        return new AppError(message, 'CONFLICT', 'CONFLICT', details);
    }

    /**
     * Create unauthorized error
     * @param {string} message - Error message
     * @param {Object} [details] - Unauthorized details
     * @returns {AppError}
     */
    static unauthorized(message, details = {}) {
        return new AppError(message, 'UNAUTHORIZED', 'UNAUTHORIZED', details);
    }

    /**
     * Create forbidden error
     * @param {string} message - Error message
     * @param {Object} [details] - Forbidden details
     * @returns {AppError}
     */
    static forbidden(message, details = {}) {
        return new AppError(message, 'FORBIDDEN', 'FORBIDDEN', details);
    }
}

export default AppError;
