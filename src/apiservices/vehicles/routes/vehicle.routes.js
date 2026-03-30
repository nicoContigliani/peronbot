/**
 * Vehicle Routes
 * API endpoints for vehicle management
 */

import { Router } from 'express';
import * as vehicleController from '@/apiservices/vehicles/controllers/vehicle.controller.js';
import { isAuthenticated } from '@/middleware/index.js';

const router = Router();

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     description: Create a new vehicle with placa, tipo, marca, modelo, color, and repartidor_id.
 *     tags: [Vehicles]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - tipo
 *               - marca
 *               - modelo
 *               - color
 *               - repartidor_id
 *             properties:
 *               placa:
 *                 type: string
 *                 example: ABC123
 *               tipo:
 *                 type: string
 *                 enum: [moto, auto, camioneta, bicicleta, camion, otro]
 *                 example: moto
 *               marca:
 *                 type: string
 *                 example: Honda
 *               modelo:
 *                 type: string
 *                 example: CB190R
 *               color:
 *                 type: string
 *                 example: Negro
 *               capacidad:
 *                 type: number
 *                 example: 50
 *               anio:
 *                 type: number
 *                 example: 2023
 *               repartidor_id:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               observaciones:
 *                 type: string
 *                 example: Vehículo en buen estado
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Vehicle placa already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', isAuthenticated, vehicleController.createVehicle);

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get vehicles with filters
 *     description: Get vehicles with pagination, filtering, and sorting.
 *     tags: [Vehicles]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: placa
 *         schema:
 *           type: string
 *         description: Filter by placa (partial match)
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [moto, auto, camioneta, bicicleta, camion, otro]
 *         description: Filter by vehicle type
 *       - in: query
 *         name: marca
 *         schema:
 *           type: string
 *         description: Filter by marca (partial match)
 *       - in: query
 *         name: modelo
 *         schema:
 *           type: string
 *         description: Filter by modelo (partial match)
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by color (partial match)
 *       - in: query
 *         name: repartidor_id
 *         schema:
 *           type: string
 *         description: Filter by repartidor ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (after)
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (before)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [placa, tipo, marca, modelo, color, createdAt, updatedAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VehicleResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', isAuthenticated, vehicleController.getVehicles);

/**
 * @swagger
 * /api/vehicles/stats:
 *   get:
 *     summary: Get vehicle statistics
 *     description: Get count of vehicles by type and repartidor.
 *     tags: [Vehicles]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     byType:
 *                       type: object
 *                       properties:
 *                         moto:
 *                           type: integer
 *                           example: 40
 *                         auto:
 *                           type: integer
 *                           example: 30
 *                         camioneta:
 *                           type: integer
 *                           example: 20
 *                         bicicleta:
 *                           type: integer
 *                           example: 10
 *                     byRepartidor:
 *                       type: object
 *                       properties:
 *                         507f1f77bcf86cd799439011:
 *                           type: integer
 *                           example: 2
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', isAuthenticated, vehicleController.getVehicleStats);

/**
 * @swagger
 * /api/vehicles/repartidor/{repartidorId}:
 *   get:
 *     summary: Get vehicles by repartidor ID
 *     description: Get all vehicles for a specific repartidor.
 *     tags: [Vehicles]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: repartidorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Repartidor ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of vehicles to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of vehicles to skip
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VehicleResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/repartidor/:repartidorId', isAuthenticated, vehicleController.getVehiclesByRepartidor);

/**
 * @swagger
 * /api/vehicles/tipo/{tipo}:
 *   get:
 *     summary: Get vehicles by type
 *     description: Get all vehicles for a specific type.
 *     tags: [Vehicles]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [moto, auto, camioneta, bicicleta, camion, otro]
 *         description: Vehicle type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of vehicles to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of vehicles to skip
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VehicleResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/tipo/:tipo', isAuthenticated, vehicleController.getVehiclesByType);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     description: Get a single vehicle by their ID.
 *     tags: [Vehicles]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VehicleResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', isAuthenticated, vehicleController.getVehicleById);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update vehicle by ID
 *     description: Update vehicle information.
 *     tags: [Vehicles]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               placa:
 *                 type: string
 *                 example: ABC123
 *               tipo:
 *                 type: string
 *                 enum: [moto, auto, camioneta, bicicleta, camion, otro]
 *                 example: moto
 *               marca:
 *                 type: string
 *                 example: Honda
 *               modelo:
 *                 type: string
 *                 example: CB190R
 *               color:
 *                 type: string
 *                 example: Negro
 *               capacidad:
 *                 type: number
 *                 example: 50
 *               anio:
 *                 type: number
 *                 example: 2023
 *               repartidor_id:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               observaciones:
 *                 type: string
 *                 example: Vehículo en buen estado
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VehicleResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', isAuthenticated, vehicleController.updateVehicle);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle by ID
 *     description: Delete a vehicle (soft delete by default, hard delete with query param).
 *     tags: [Vehicles]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *       - in: query
 *         name: hard
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: Whether to permanently delete vehicle
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Vehicle deactivated
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', isAuthenticated, vehicleController.deleteVehicle);

export default router;
