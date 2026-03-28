/**
 * Middleware Index - Main export for all middleware
 */

export {
    clerkAuthMiddleware,
    requireAuthMiddleware,
    optionalAuthMiddleware,
    isAuthenticated,
    hasRole
} from './clerkAuth.js';
