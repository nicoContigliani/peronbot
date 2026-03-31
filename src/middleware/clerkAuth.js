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
 * Now optional - passes through without requiring authentication
 */
export const clerkAuthMiddleware = (req, res, next) => {
    // Clerk authentication is now optional
    // Just pass through without checking authentication
    next();
};

/**
 * Require authentication middleware
 * Now optional - passes through without requiring authentication
 */
export const requireAuthMiddleware = (req, res, next) => {
    // Clerk authentication is now optional
    // Just pass through without checking authentication
    next();
};

/**
 * Optional authentication middleware
 * Now optional - passes through without requiring authentication
 */
export const optionalAuthMiddleware = (req, res, next) => {
    // Clerk authentication is now optional
    // Just pass through without checking authentication
    next();
};

/**
 * Custom middleware to check if user is authenticated
 * Now optional - passes through without requiring authentication
 */
export const isAuthenticated = (req, res, next) => {
    // Clerk authentication is now optional
    // Just pass through without checking authentication
    next();
};

/**
 * Custom middleware to check if user has specific role
 * Now optional - passes through without requiring authentication
 * @param {string|Array} roles - Required role(s)
 */
export const hasRole = (roles) => {
    return (req, res, next) => {
        // Clerk authentication is now optional
        // Just pass through without checking roles
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
