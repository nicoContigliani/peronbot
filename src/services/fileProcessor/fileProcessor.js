/**
 * File Processor Module
 * Handles transformation of Excel and CSV files to JSON
 * Integrates with Supabase for file storage
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import config from '@/config/env.js';
import pino from 'pino';

const logger = pino({ level: config.logging.level });

// Initialize Supabase client
let supabase = null;

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client instance
 */
function getSupabaseClient() {
    if (!supabase) {
        if (!config.supabase.url || !config.supabase.key) {
            throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env');
        }
        supabase = createClient(config.supabase.url, config.supabase.key);
        logger.info('Supabase client initialized');
    }
    return supabase;
}

/**
 * Parse Excel file buffer to JSON
 * @param {Buffer} buffer - Excel file buffer
 * @param {Object} options - Parsing options
 * @returns {Object} Parsed data with sheets
 */
function parseExcel(buffer, options = {}) {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer', ...options });
        const result = {};

        // Process each sheet
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            result[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
                header: options.header || 1,
                defval: options.defval || '',
                blankrows: options.blankrows || false
            });
        });

        logger.info(`Excel file parsed successfully: ${workbook.SheetNames.length} sheet(s)`);
        return {
            success: true,
            sheets: workbook.SheetNames,
            data: result
        };
    } catch (error) {
        logger.error('Error parsing Excel file:', error.message);
        throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
}

/**
 * Parse CSV file buffer to JSON
 * @param {Buffer} buffer - CSV file buffer
 * @param {Object} options - Parsing options
 * @returns {Object} Parsed data
 */
function parseCSV(buffer, options = {}) {
    try {
        const content = buffer.toString('utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim());

        if (lines.length === 0) {
            return {
                success: true,
                data: []
            };
        }

        // Detect delimiter (comma, semicolon, tab)
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes('\t')) delimiter = '\t';

        // Parse header
        const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }

        logger.info(`CSV file parsed successfully: ${data.length} rows`);
        return {
            success: true,
            headers: headers,
            data: data
        };
    } catch (error) {
        logger.error('Error parsing CSV file:', error.message);
        throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
}

/**
 * Parse file based on extension
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {Object} options - Parsing options
 * @returns {Object} Parsed data
 */
function parseFile(buffer, filename, options = {}) {
    const extension = filename.split('.').pop().toLowerCase();

    switch (extension) {
        case 'xlsx':
        case 'xls':
            return parseExcel(buffer, options);
        case 'csv':
            return parseCSV(buffer, options);
        default:
            throw new Error(`Unsupported file format: .${extension}. Supported formats: .xlsx, .xls, .csv`);
    }
}

/**
 * Upload file to Supabase Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} bucket - Storage bucket name (default: 'files')
 * @returns {Object} Upload result with public URL
 */
async function uploadToSupabase(buffer, filename, bucket = 'files') {
    try {
        const client = getSupabaseClient();

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}_${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await client.storage
            .from(bucket)
            .upload(uniqueFilename, buffer, {
                contentType: getContentType(filename),
                upsert: false
            });

        if (error) {
            throw new Error(`Supabase upload error: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = client.storage
            .from(bucket)
            .getPublicUrl(uniqueFilename);

        logger.info(`File uploaded to Supabase: ${uniqueFilename}`);
        return {
            success: true,
            path: data.path,
            publicUrl: urlData.publicUrl,
            filename: uniqueFilename
        };
    } catch (error) {
        logger.error('Error uploading to Supabase:', error.message);
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }
}

/**
 * Download file from Supabase Storage
 * @param {string} path - File path in Supabase
 * @param {string} bucket - Storage bucket name (default: 'files')
 * @returns {Buffer} File buffer
 */
async function downloadFromSupabase(path, bucket = 'files') {
    try {
        const client = getSupabaseClient();

        const { data, error } = await client.storage
            .from(bucket)
            .download(path);

        if (error) {
            throw new Error(`Supabase download error: ${error.message}`);
        }

        logger.info(`File downloaded from Supabase: ${path}`);
        return Buffer.from(await data.arrayBuffer());
    } catch (error) {
        logger.error('Error downloading from Supabase:', error.message);
        throw new Error(`Failed to download from Supabase: ${error.message}`);
    }
}

/**
 * List files in Supabase Storage bucket
 * @param {string} bucket - Storage bucket name (default: 'files')
 * @param {string} prefix - Folder prefix (optional)
 * @returns {Array} List of files
 */
async function listSupabaseFiles(bucket = 'files', prefix = '') {
    try {
        const client = getSupabaseClient();

        const { data, error } = await client.storage
            .from(bucket)
            .list(prefix);

        if (error) {
            throw new Error(`Supabase list error: ${error.message}`);
        }

        logger.info(`Listed ${data.length} files from Supabase`);
        return data;
    } catch (error) {
        logger.error('Error listing Supabase files:', error.message);
        throw new Error(`Failed to list Supabase files: ${error.message}`);
    }
}

/**
 * Delete file from Supabase Storage
 * @param {string} path - File path in Supabase
 * @param {string} bucket - Storage bucket name (default: 'files')
 * @returns {Object} Delete result
 */
async function deleteFromSupabase(path, bucket = 'files') {
    try {
        const client = getSupabaseClient();

        const { data, error } = await client.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            throw new Error(`Supabase delete error: ${error.message}`);
        }

        logger.info(`File deleted from Supabase: ${path}`);
        return {
            success: true,
            deleted: data
        };
    } catch (error) {
        logger.error('Error deleting from Supabase:', error.message);
        throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
}

/**
 * Get content type based on file extension
 * @param {string} filename - Filename
 * @returns {string} MIME type
 */
function getContentType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const contentTypes = {
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'csv': 'text/csv',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif'
    };
    return contentTypes[extension] || 'application/octet-stream';
}

/**
 * Process file: parse and optionally upload to Supabase
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {Object} options - Processing options
 * @returns {Object} Processing result
 */
async function processFile(buffer, filename, options = {}) {
    const { uploadToStorage = false, bucket = 'files', parseOptions = {} } = options;

    try {
        // Parse file
        const parseResult = parseFile(buffer, filename, parseOptions);

        // Upload to Supabase if requested
        let uploadResult = null;
        if (uploadToStorage) {
            uploadResult = await uploadToSupabase(buffer, filename, bucket);
        }

        return {
            success: true,
            filename: filename,
            parsed: parseResult,
            uploaded: uploadResult
        };
    } catch (error) {
        logger.error('Error processing file:', error.message);
        throw error;
    }
}

export {
    parseExcel,
    parseCSV,
    parseFile,
    uploadToSupabase,
    downloadFromSupabase,
    listSupabaseFiles,
    deleteFromSupabase,
    processFile,
    getSupabaseClient
};
