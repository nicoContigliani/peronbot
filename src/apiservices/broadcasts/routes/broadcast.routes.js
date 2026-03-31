/**
 * Broadcast Routes
 * API endpoints for broadcast management with Swagger documentation
 */

import { Router } from 'express';
import * as broadcastController from '../controllers/broadcast.controller.js';
import { isAuthenticated } from '@/middleware/index.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BroadcastRequest:
 *       type: object
 *       required:
 *         - userId
 *         - companyName
 *         - message
 *         - shift
 *         - deliveryPerson
 *         - clients
 *       properties:
 *         userId:
 *           type: string
 *           example: user_123
 *           description: User ID from Next.js
 *         companyName:
 *           type: string
 *           example: Delivery
 *           description: Company name
 *         message:
 *           type: string
 *           example: El repartidor Juan pasará en la mañana
 *           description: Message to send to clients
 *         shift:
 *           type: string
 *           enum: [morning, afternoon]
 *           example: morning
 *           description: Delivery shift
 *         deliveryPerson:
 *           type: object
 *           required:
 *             - name
 *             - phone
 *           properties:
 *             name:
 *               type: string
 *               example: Juan Pérez
 *               description: Delivery person name
 *             phone:
 *               type: string
 *               example: +5491112345678
 *               description: Delivery person phone number
 *         clients:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: María García
 *                 description: Client name
 *               phone:
 *                 type: string
 *                 example: +5491198765432
 *                 description: Client phone number
 *               address:
 *                 type: string
 *                 example: Av. Corrientes 1234
 *                 description: Client address
 *     BroadcastResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: broadcast-1234567890-abc123
 *         userId:
 *           type: string
 *           example: user_123
 *         companyName:
 *           type: string
 *           example: Delivery
 *         message:
 *           type: string
 *           example: El repartidor Juan pasará en la mañana
 *         shift:
 *           type: string
 *           enum: [morning, afternoon]
 *           example: morning
 *         deliveryPerson:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Juan Pérez
 *             phone:
 *               type: string
 *               example: +5491112345678
 *         totalClients:
 *           type: integer
 *           example: 50
 *         sent:
 *           type: integer
 *           example: 48
 *         failed:
 *           type: integer
 *           example: 2
 *         results:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: +5491198765432
 *               name:
 *                 type: string
 *                 example: María García
 *               status:
 *                 type: string
 *                 enum: [sent, error]
 *                 example: sent
 *               messageId:
 *                 type: string
 *                 example: msg_123456
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: +5491111111111
 *               name:
 *                 type: string
 *                 example: Error Client
 *               status:
 *                 type: string
 *                 enum: [error]
 *                 example: error
 *               error:
 *                 type: string
 *                 example: Invalid phone number
 *         status:
 *           type: string
 *           enum: [completed, partial]
 *           example: completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/broadcasts:
 *   post:
 *     summary: Send broadcast messages
 *     description: Send WhatsApp messages to multiple clients for delivery notifications.
 *     tags: [Broadcasts]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BroadcastRequest'
 *     responses:
 *       201:
 *         description: Broadcast sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BroadcastResponse'
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
 *       503:
 *         description: WhatsApp bot not connected
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
router.post('/', isAuthenticated, broadcastController.sendBroadcast);

/**
 * @swagger
 * /api/broadcasts/{id}:
 *   get:
 *     summary: Get broadcast status
 *     description: Get the status of a broadcast by ID.
 *     tags: [Broadcasts]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     responses:
 *       200:
 *         description: Broadcast status retrieved successfully
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
 *                     id:
 *                       type: string
 *                       example: broadcast-1234567890-abc123
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, partial, error]
 *                       example: completed
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Broadcast not found
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
router.get('/:id', isAuthenticated, broadcastController.getBroadcastStatus);

export default router;
