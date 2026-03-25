/**
 * Bototo - WhatsApp Bot with Reusable Conversation Trees
 * Main Entry Point
 * 
 * This is the main entry point for the Bototo WhatsApp bot.
 * It initializes all modules and starts the bot connection.
 */
import 'dotenv/config';
import pino from 'pino';
import config from './config/env.js';
import { connectDB, closeDB } from './database/db.js';
import BotClient from './bot/BotClient.js';
import { initializeConversationTrees } from './bot/handlers/messageHandler.js';

// Configure logger
const logger = pino({
    level: config.logging.level,
    transport: config.logging.level === 'debug' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname'
        }
    } : undefined
});

/**
 * Global error handlers
 */

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    console.error('\n❌ Uncaught Exception:', error.message);
    console.error(error.stack);
    await gracefulShutdown(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
    console.error('\n❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    await gracefulShutdown(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
    await gracefulShutdown(0);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Received SIGTERM, shutting down gracefully...');
    await gracefulShutdown(0);
});

/**
 * Graceful shutdown handler
 * @param {number} exitCode - Exit code
 */
async function gracefulShutdown(exitCode = 0) {
    console.log('\n🔄 Performing graceful shutdown...');
    
    try {
        // Close database connection
        await closeDB();
        console.log('✅ Database connection closed');
        
        // Give time for pending operations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
    }
    
    console.log('👋 Goodbye!\n');
    process.exit(exitCode);
}

/**
 * Display startup banner
 */
function displayBanner() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║   🤖  B O T O T O                                        ║');
    console.log('║                                                           ║');
    console.log('║   WhatsApp Bot with Reusable Conversation Trees          ║');
    console.log('║                                                           ║');
    console.log('║   Version: 1.0.0                                         ║');
    console.log('║   Baileys: 6.6.0                                         ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');
}

/**
 * Validate environment
 */
function validateEnvironment() {
    const errors = [];
    
    // Check MongoDB connection
    if (!process.env.MONGODB_URI) {
        console.warn('⚠️  MONGODB_URI not set. Using default: mongodb://localhost:27017/bototo');
    }
    
    // Check other important variables
    if (!process.env.SESSION_FOLDER) {
        console.warn('⚠️  SESSION_FOLDER not set. Using default: baileys_auth_info');
    }
    
    if (errors.length > 0) {
        console.error('\n❌ Environment validation failed:');
        errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }
    
    console.log('✅ Environment validated');
}

/**
 * Main application function
 */
async function main() {
    try {
        // Display banner
        displayBanner();
        
        // Validate environment
        validateEnvironment();
        
        // Connect to MongoDB
        console.log('\n📦 Initializing components...');
        await connectDB();
        
        // Initialize conversation trees
        console.log('🌳 Loading conversation trees...');
        initializeConversationTrees();
        
        // Connect to WhatsApp
        console.log('📱 Connecting to WhatsApp...\n');
        await BotClient.connect();
        
        console.log('✨ Bototo is ready to receive messages!');
        
    } catch (error) {
        console.error('\n❌ Fatal error starting bot:', error.message);
        
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        
        // Attempt graceful shutdown
        await gracefulShutdown(1);
    }
}

// Start the application
main();
