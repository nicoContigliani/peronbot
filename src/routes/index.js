/**
 * Routes Index - Main export for all routes
 */

export { default as fileRoutes } from './fileRoutes.js';
export { default as sessionRoutes } from './sessionRoutes.js';
export { userRoutes } from '../apiservices/users/index.js';
export { roleRoutes } from '../apiservices/roles/index.js';
export { permissionRoutes } from '../apiservices/permissions/index.js';
export { productRoutes } from '../apiservices/products/index.js';
export { default as vehicleRoutes } from '../apiservices/vehicles/index.js';
