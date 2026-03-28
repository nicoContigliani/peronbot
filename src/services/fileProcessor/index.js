/**
 * File Processor Module - Main Export
 * Provides file transformation and Supabase integration
 */

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
} from './fileProcessor.js';
