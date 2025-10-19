#!/usr/bin/env node

/**
 * OrionRisc-128 System Startup Script
 *
 * Simple script to start the complete OrionRisc-128 system
 */

const OrionRisc128Server = require('./server');

async function startSystem() {
    console.log('🚀 Starting OrionRisc-128 Computer System...');
    console.log('=====================================');

    try {
        // Create server instance
        const server = new OrionRisc128Server(3000);

        // Start the server
        await server.start();

        console.log('✅ OrionRisc-128 system is now running!');
        console.log('');
        console.log('🌐 Access the system at: http://localhost:3000');
        console.log('📡 WebSocket API available for real-time communication');
        console.log('🔧 REST API available at: http://localhost:3000/api');
        console.log('');
        console.log('Press Ctrl+C to stop the system');

    } catch (error) {
        console.error('❌ Failed to start OrionRisc-128 system:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down OrionRisc-128 system...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down OrionRisc-128 system...');
    process.exit(0);
});

// Start the system
startSystem();