#!/usr/bin/env node

/**
 * Clear WhatsApp Session CLI
 * Run this script to clear the WhatsApp session and force a new QR code
 * 
 * Usage:
 *   node clearSession.js          - Clear all session files
 *   node clearSession.js --keep   - Keep credentials, clear other files
 *   node clearSession.js --status - Check session status
 */

import { clearSession, clearSessionKeepCredentials, checkSessionStatus } from './sessionManager.js';

async function main() {
    const args = process.argv.slice(2);
    
    // Show status
    if (args.includes('--status') || args.includes('-s')) {
        console.log('\n📊 Checking WhatsApp session status...\n');
        const status = await checkSessionStatus();
        
        if (status.exists) {
            console.log(`✅ Session folder exists`);
            console.log(`📁 Files: ${status.fileCount}`);
            console.log(`📄 File list:`);
            status.files.forEach(file => console.log(`   - ${file}`));
        } else {
            console.log('❌ No session folder found');
        }
        console.log('');
        return;
    }
    
    // Clear session
    console.log('\n🗑️  Clearing WhatsApp session...\n');
    
    let result;
    if (args.includes('--keep') || args.includes('-k')) {
        console.log('ℹ️  Keeping credentials file...');
        result = await clearSessionKeepCredentials();
    } else {
        result = await clearSession();
    }
    
    if (result.success) {
        console.log(`\n✅ ${result.message}`);
        console.log('\n💡 Next time you start the bot, a new QR code will be generated.\n');
    } else {
        console.error(`\n❌ ${result.message}\n`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
