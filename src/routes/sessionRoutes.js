/**
 * Session Routes - API endpoints for session management
 * Handles WhatsApp session status and clearing
 */

import { Router } from 'express';
import { checkSessionStatus, clearSession, clearSessionKeepCredentials } from '@/../sessionManager.js';
import { isAuthenticated } from '@/middleware/index.js';
import pino from 'pino';
import config from '@/config/env.js';

const logger = pino({ level: config.logging.level });
const router = Router();

/**
 * @swagger
 * /api/session/status:
 *   get:
 *     summary: Get WhatsApp session status
 *     description: Check if WhatsApp session exists and list session files.
 *     tags: [Session]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
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
 *                     exists:
 *                       type: boolean
 *                       example: true
 *                     fileCount:
 *                       type: integer
 *                       example: 15
 *                     files:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["creds.json", "session-123.json"]
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
router.get('/status', isAuthenticated, async (req, res) => {
    try {
        const status = await checkSessionStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('Error getting session status:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/session/clear:
 *   post:
 *     summary: Clear WhatsApp session
 *     description: Delete all WhatsApp session files to force a new QR code on next connection.
 *     tags: [Session]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: keepCredentials
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: Whether to keep credentials file
 *     responses:
 *       200:
 *         description: Session cleared successfully
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
 *                   example: Session cleared successfully. 15 files deleted.
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
router.post('/clear', isAuthenticated, async (req, res) => {
    try {
        const { keepCredentials = 'false' } = req.query;
        
        let result;
        if (keepCredentials === 'true') {
            result = await clearSessionKeepCredentials();
        } else {
            result = await clearSession();
        }
        
        res.json(result);
    } catch (error) {
        logger.error('Error clearing session:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
