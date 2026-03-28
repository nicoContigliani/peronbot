/**
 * WhatsApp Session Manager
 * Utility to manage WhatsApp authentication sessions
 */

import fs from 'fs/promises';
import path from 'path';

const SESSION_FOLDER = 'baileys_auth_info';

/**
 * @typedef {Object} SessionStatus
 * @property {boolean} exists - Whether session folder exists
 * @property {number} fileCount - Number of files in session folder
 * @property {string[]} files - List of session files
 */

/**
 * Check if WhatsApp session exists
 * @returns {Promise<SessionStatus>} Session status
 */
export async function checkSessionStatus() {
    try {
        const sessionPath = path.resolve(SESSION_FOLDER);
        const files = await fs.readdir(sessionPath);
        
        return {
            exists: true,
            fileCount: files.length,
            files: files
        };
    } catch (error) {
        return {
            exists: false,
            fileCount: 0,
            files: []
        };
    }
}

/**
 * Clear WhatsApp session (delete all session files)
 * This will force a new QR code on next connection
 * @returns {Promise<{success: boolean, message: string}>} Result
 */
export async function clearSession() {
    try {
        const sessionPath = path.resolve(SESSION_FOLDER);
        
        // Check if folder exists
        try {
            await fs.access(sessionPath);
        } catch {
            return {
                success: true,
                message: 'No session folder found. Nothing to clear.'
            };
        }

        // Get all files in the session folder
        const files = await fs.readdir(sessionPath);
        
        // Delete each file
        for (const file of files) {
            const filePath = path.join(sessionPath, file);
            await fs.unlink(filePath);
        }

        console.log(`✅ Session cleared: ${files.length} files deleted`);
        
        return {
            success: true,
            message: `Session cleared successfully. ${files.length} files deleted.`
        };
    } catch (error) {
        console.error('❌ Error clearing session:', error);
        return {
            success: false,
            message: `Error clearing session: ${error.message}`
        };
    }
}

/**
 * Clear specific session file
 * @param {string} filename - Name of the file to delete
 * @returns {Promise<{success: boolean, message: string}>} Result
 */
export async function clearSessionFile(filename) {
    try {
        const sessionPath = path.resolve(SESSION_FOLDER);
        const filePath = path.join(sessionPath, filename);
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return {
                success: false,
                message: `File ${filename} not found in session folder.`
            };
        }

        // Delete the file
        await fs.unlink(filePath);
        
        console.log(`✅ Session file deleted: ${filename}`);
        
        return {
            success: true,
            message: `File ${filename} deleted successfully.`
        };
    } catch (error) {
        console.error('❌ Error deleting session file:', error);
        return {
            success: false,
            message: `Error deleting file: ${error.message}`
        };
    }
}

/**
 * Clear all session files except credentials
 * Useful for forcing new QR while keeping auth state
 * @returns {Promise<{success: boolean, message: string}>} Result
 */
export async function clearSessionKeepCredentials() {
    try {
        const sessionPath = path.resolve(SESSION_FOLDER);
        
        // Check if folder exists
        try {
            await fs.access(sessionPath);
        } catch {
            return {
                success: true,
                message: 'No session folder found. Nothing to clear.'
            };
        }

        // Get all files in the session folder
        const files = await fs.readdir(sessionPath);
        
        // Keep only credentials file
        const filesToDelete = files.filter(file => file !== 'creds.json');
        
        // Delete each file except credentials
        for (const file of filesToDelete) {
            const filePath = path.join(sessionPath, file);
            await fs.unlink(filePath);
        }

        console.log(`✅ Session cleared (kept credentials): ${filesToDelete.length} files deleted`);
        
        return {
            success: true,
            message: `Session cleared (kept credentials). ${filesToDelete.length} files deleted.`
        };
    } catch (error) {
        console.error('❌ Error clearing session:', error);
        return {
            success: false,
            message: `Error clearing session: ${error.message}`
        };
    }
}

/**
 * Get session folder path
 * @returns {string} Session folder path
 */
export function getSessionPath() {
    return path.resolve(SESSION_FOLDER);
}

export default {
    checkSessionStatus,
    clearSession,
    clearSessionFile,
    clearSessionKeepCredentials,
    getSessionPath
};
