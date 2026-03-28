/**
 * Clerk Authentication Middleware
 * Protects API endpoints using Clerk authentication
 */

import { clerkMiddleware, requireAuth } from '@clerk/express';
import pino from 'pino';
import config from '@/config/env.js';

const logger = pino({ level: config.logging.level });

/**
 * Clerk middleware for Express
 * Adds Clerk authentication to the request object
 */
export const clerkAuthMiddleware = clerkMiddleware();

/**
 * Require authentication middleware
 * Protects routes that require user authentication
 */
export const requireAuthMiddleware = requireAuth();

/**
 * Optional authentication middleware
 * Adds user info if authenticated, but doesn't require it
 */
export const optionalAuthMiddleware = clerkMiddleware({
    debug: false,
    requireAuth: false
});

/**
 * Custom middleware to check if user is authenticated
 * Returns 401 if not authenticated
 */
export const isAuthenticated = (req, res, next) => {
    const auth = req.auth;
    
    if (!auth || !auth.userId) {
        logger.warn('Unauthorized access attempt');
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'You must be logged in to access this resource'
        });
    }
    
    logger.info(`Authenticated user: ${auth.userId}`);
    next();
};

/**
 * Custom middleware to check if user has specific role
 * @param {string|Array} roles - Required role(s)
 */
export const hasRole = (roles) => {
    return (req, res, next) => {
        const auth = req.auth;
        
        if (!auth || !auth.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        // Check if user has required role
        const userRoles = auth.sessionClaims?.metadata?.roles || [];
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        
        const hasRequiredRole = requiredRoles.some(role => 
            userRoles.includes(role)
        );
        
        if (!hasRequiredRole) {
            logger.warn(`User ${auth.userId} lacks required role: ${requiredRoles.join(', ')}`);
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `You need one of these roles: ${requiredRoles.join(', ')}`
            });
        }
        
        next();
    };
};

export default {
    clerkAuthMiddleware,
    requireAuthMiddleware,
    optionalAuthMiddleware,
    isAuthenticated,
    hasRole
};
