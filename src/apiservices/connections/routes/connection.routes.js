/**
 * Connection Routes
 * API endpoints for connection management with Swagger documentation
 */

import { Router } from 'express';
import * as connectionController from '../controllers/connection.controller.js';
import { isAuthenticated } from '@/middleware/index.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ConnectionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           example: WhatsApp Business
 *         provider:
 *           type: string
 *           enum: [baileys, business-api]
 *           example: baileys
 *         phoneNumber:
 *           type: string
 *           example: +1234567890
 *         webhookUrl:
 *           type: string
 *           example: https://example.com/webhook
 *         status:
 *           type: string
 *           enum: [connected, disconnected, connecting, error]
 *           example: connected
 *         isActive:
 *           type: boolean
 *           example: true
 *         metadata:
 *           type: object
 *           example: { "key": "value" }
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ConnectionStatsResponse:
 *       type: object
 *       properties:
 *         connected:
 *           type: integer
 *           example: 5
 *         disconnected:
 *           type: integer
 *           example: 10
 *         connecting:
 *           type: integer
 *           example: 2
 *         error:
 *           type: integer
 *           example: 1
 *         total:
 *           type: integer
 *           example: 18
 */

/**
 * @swagger
 * /api/connections:
 *   post:
 *     summary: Create a new connection
 *     description: Create a new WhatsApp connection configuration.
 *     tags: [Connections]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - provider
 *             properties:
 *               name:
 *                 type: string
 *                 example: WhatsApp Business
 *                 description: Connection name
 *               provider:
 *                 type: string
 *                 enum: [baileys, business-api]
 *                 example: baileys
 *                 description: WhatsApp provider type
 *               phoneNumber:
 *                 type: string
 *                 example: +1234567890
 *                 description: Phone number for business API
 *               webhookUrl:
 *                 type: string
 *                 example: https://example.com/webhook
 *                 description: Webhook URL for business API
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: Whether connection is active
 *               metadata:
 *                 type: object
 *                 example: { "key": "value" }
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Connection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ConnectionResponse'
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
 *         description: Connection name already exists
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
router.post('/', isAuthenticated, connectionController.createConnection);

/**
 * @swagger
 * /api/connections:
 *   get:
 *     summary: Get connections with filters
 *     description: Get connections with pagination, filtering, and sorting.
 *     tags: [Connections]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (partial match)
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [baileys, business-api]
 *         description: Filter by provider type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [connected, disconnected, connecting, error]
 *         description: Filter by connection status
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
 *           enum: [name, provider, status, createdAt, updatedAt]
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
 *         description: Connections retrieved successfully
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
 *                     $ref: '#/components/schemas/ConnectionResponse'
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
router.get('/', isAuthenticated, connectionController.getConnections);

/**
 * @swagger
 * /api/connections/stats:
 *   get:
 *     summary: Get connection statistics
 *     description: Get count of connections by status.
 *     tags: [Connections]
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
 *                   $ref: '#/components/schemas/ConnectionStatsResponse'
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
router.get('/stats', isAuthenticated, connectionController.getConnectionStats);

/**
 * @swagger
 * /api/connections/{id}:
 *   get:
 *     summary: Get connection by ID
 *     description: Get a single connection by its ID.
 *     tags: [Connections]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Connection ID
 *     responses:
 *       200:
 *         description: Connection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ConnectionResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Connection not found
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
router.get('/:id', isAuthenticated, connectionController.getConnectionById);

/**
 * @swagger
 * /api/connections/{id}:
 *   put:
 *     summary: Update connection by ID
 *     description: Update connection information.
 *     tags: [Connections]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Connection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: WhatsApp Business
 *                 description: Connection name
 *               provider:
 *                 type: string
 *                 enum: [baileys, business-api]
 *                 example: baileys
 *                 description: WhatsApp provider type
 *               phoneNumber:
 *                 type: string
 *                 example: +1234567890
 *                 description: Phone number for business API
 *               webhookUrl:
 *                 type: string
 *                 example: https://example.com/webhook
 *                 description: Webhook URL for business API
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: Whether connection is active
 *               metadata:
 *                 type: object
 *                 example: { "key": "value" }
 *                 description: Additional metadata
 *     responses:
 *       200:
 *         description: Connection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ConnectionResponse'
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
 *         description: Connection not found
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
router.put('/:id', isAuthenticated, connectionController.updateConnection);

/**
 * @swagger
 * /api/connections/{id}/status:
 *   patch:
 *     summary: Update connection status
 *     description: Update the status of a connection.
 *     tags: [Connections]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Connection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [connected, disconnected, connecting, error]
 *                 example: connected
 *                 description: New connection status
 *     responses:
 *       200:
 *         description: Connection status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ConnectionResponse'
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
 *         description: Connection not found
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
router.patch('/:id/status', isAuthenticated, connectionController.updateConnectionStatus);

/**
 * @swagger
 * /api/connections/{id}:
 *   delete:
 *     summary: Delete connection by ID
 *     description: Delete a connection (soft delete by default, hard delete with query param).
 *     tags: [Connections]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Connection ID
 *       - in: query
 *         name: hard
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: Whether to permanently delete connection
 *     responses:
 *       200:
 *         description: Connection deleted successfully
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
 *                   example: Connection deactivated
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Connection not found
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
router.delete('/:id', isAuthenticated, connectionController.deleteConnection);

export default router;
