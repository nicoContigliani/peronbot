/**
 * File Routes - API endpoints for file processing
 * Handles file upload, transformation, and Supabase integration
 */

import { Router } from 'express';
import multer from 'multer';
import {
    parseFile,
    processFile,
    uploadToSupabase,
    downloadFromSupabase,
    listSupabaseFiles,
    deleteFromSupabase
} from '@/services/fileProcessor/index.js';
import { isAuthenticated } from '@/middleware/index.js';
import pino from 'pino';
import config from '@/config/env.js';

const logger = pino({ level: config.logging.level });
const router = Router();

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/json',
            'image/png',
            'image/jpeg',
            'image/gif'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.mimetype}`), false);
        }
    }
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload and process a file
 *     description: Upload a file (Excel/CSV) and transform it to JSON. Optionally upload to Supabase Storage.
 *     tags: [Files]
 *     security:
 *       - ClerkAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: query
 *         name: uploadToStorage
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: Whether to upload file to Supabase Storage
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           default: 'files'
 *         description: Supabase storage bucket name
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (xlsx, xls, csv, pdf, doc, docx, txt, json, png, jpg, gif)
 *     responses:
 *       200:
 *         description: File processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       400:
 *         description: No file provided
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
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }

        const { uploadToStorage = 'false', bucket = 'files' } = req.query;
        const shouldUpload = uploadToStorage === 'true';

        logger.info(`Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

        const result = await processFile(req.file.buffer, req.file.originalname, {
            uploadToStorage: shouldUpload,
            bucket: bucket
        });

        res.json({
            success: true,
            message: 'File processed successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error in /upload:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/files/parse:
 *   post:
 *     summary: Parse a file
 *     description: Parse a file (Excel/CSV) and transform it to JSON without uploading to Supabase.
 *     tags: [Files]
 *     security:
 *       - ClerkAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to parse (xlsx, xls, csv)
 *     responses:
 *       200:
 *         description: File parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParseResponse'
 *       400:
 *         description: No file provided
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
router.post('/parse', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }

        logger.info(`Parsing file: ${req.file.originalname}`);

        const result = parseFile(req.file.buffer, req.file.originalname);

        res.json({
            success: true,
            message: 'File parsed successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error in /parse:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/files/list:
 *   get:
 *     summary: List files in Supabase Storage
 *     description: List all files in a Supabase Storage bucket.
 *     tags: [Files]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           default: 'files'
 *         description: Supabase storage bucket name
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *           default: ''
 *         description: Folder prefix to filter files
 *     responses:
 *       200:
 *         description: Files listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileListResponse'
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
router.get('/list', isAuthenticated, async (req, res) => {
    try {
        const { bucket = 'files', prefix = '' } = req.query;

        const files = await listSupabaseFiles(bucket, prefix);

        res.json({
            success: true,
            data: files
        });
    } catch (error) {
        logger.error('Error in /list:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/files/download/{filename}:
 *   get:
 *     summary: Download a file from Supabase Storage
 *     description: Download a file from Supabase Storage by filename.
 *     tags: [Files]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the file to download
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           default: 'files'
 *         description: Supabase storage bucket name
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
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
router.get('/download/:filename', isAuthenticated, async (req, res) => {
    try {
        const { filename } = req.params;
        const { bucket = 'files' } = req.query;

        const buffer = await downloadFromSupabase(filename, bucket);

        // Determine content type based on extension
        const extension = filename.split('.').pop().toLowerCase();
        const contentTypes = {
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'csv': 'text/csv',
            'pdf': 'application/pdf',
            'json': 'application/json',
            'txt': 'text/plain',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif'
        };

        res.set({
            'Content-Type': contentTypes[extension] || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`
        });

        res.send(buffer);
    } catch (error) {
        logger.error('Error in /download:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/files/{filename}:
 *   delete:
 *     summary: Delete a file from Supabase Storage
 *     description: Delete a file from Supabase Storage by filename.
 *     tags: [Files]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the file to delete
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           default: 'files'
 *         description: Supabase storage bucket name
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteResponse'
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
router.delete('/:filename', isAuthenticated, async (req, res) => {
    try {
        const { filename } = req.params;
        const { bucket = 'files' } = req.query;

        const result = await deleteFromSupabase(filename, bucket);

        res.json({
            success: true,
            message: 'File deleted successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error in /delete:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/files/batch:
 *   post:
 *     summary: Process multiple files at once
 *     description: Upload and process multiple files (up to 10) in a single request.
 *     tags: [Files]
 *     security:
 *       - ClerkAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: query
 *         name: uploadToStorage
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: Whether to upload files to Supabase Storage
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           default: 'files'
 *         description: Supabase storage bucket name
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (up to 10 files)
 *     responses:
 *       200:
 *         description: Files processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchUploadResponse'
 *       400:
 *         description: No files provided
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
router.post('/batch', isAuthenticated, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files provided'
            });
        }

        const { uploadToStorage = 'false', bucket = 'files' } = req.query;
        const shouldUpload = uploadToStorage === 'true';

        logger.info(`Processing ${req.files.length} files in batch`);

        const results = await Promise.all(
            req.files.map(file =>
                processFile(file.buffer, file.originalname, {
                    uploadToStorage: shouldUpload,
                    bucket: bucket
                })
            )
        );

        res.json({
            success: true,
            message: `Processed ${results.length} files successfully`,
            data: results
        });
    } catch (error) {
        logger.error('Error in /batch:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
