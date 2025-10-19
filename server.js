/**
 * OrionRisc-128 Emulation Server
 *
 * Main Express.js server with WebSocket support for the complete
 * OrionRisc-128 computer system emulation.
 */

const express = require('express');
const http = require('http');
const path = require('path');
const WebSocketHandler = require('./src/communication/websocket-handler');
const EmulationLayer = require('./src/emulation');
const { createOSKernel, initializeSystem, SystemControl } = require('./src/system/os');

class OrionRisc128Server {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);

        // Initialize hardware emulation
        this.emulation = new EmulationLayer();

        // Initialize WebSocket communication
        this.websocket = new WebSocketHandler(this.server);

        // System state
        this.isRunning = false;
        this.emulationLoop = null;

        this.setupExpress();
        this.setupWebSocketHandlers();
        this.setupAPIEndpoints();
        this.setupShutdownHandlers();

        console.log('OrionRisc-128 server initialized');
    }

    /**
     * Configure Express.js middleware and static file serving
     */
    setupExpress() {
        // Serve static files from frontend directory
        this.app.use(express.static(path.join(__dirname, 'src/frontend')));

        // Parse JSON bodies
        this.app.use(express.json());

        // Serve main HTML file for root requests
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'src/frontend/index.html'));
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                emulation: {
                    isRunning: this.isRunning,
                    clients: this.websocket.getClientCount()
                }
            });
        });

        console.log('Express.js configuration complete');
    }

    /**
     * Set up WebSocket message handlers
     */
    setupWebSocketHandlers() {
        // System control messages
        this.websocket.registerHandler('system_start', (ws, data) => {
            this.startEmulation();
            this.websocket.broadcast({ type: 'system_started', data: { status: 'running' } });
        });

        this.websocket.registerHandler('system_stop', (ws, data) => {
            this.stopEmulation();
            this.websocket.broadcast({ type: 'system_stopped', data: { status: 'stopped' } });
        });

        this.websocket.registerHandler('system_reset', (ws, data) => {
            this.resetSystem();
            this.websocket.broadcast({ type: 'system_reset', data: { status: 'reset' } });
        });

        this.websocket.registerHandler('get_system_state', (ws, data) => {
            const state = this.getSystemState();
            this.websocket.sendToClient(ws, { type: 'system_state', data: state });
        });

        // Frontend initialization messages
        this.websocket.registerHandler('handshake', (ws, data) => {
            console.log('Frontend handshake received:', data);
            // Send welcome response
            this.websocket.sendToClient(ws, {
                type: 'handshake_response',
                data: { status: 'connected', server: 'OrionRisc-128' }
            });
        });

        this.websocket.registerHandler('request_initial_state', (ws, data) => {
            const state = this.getSystemState();
            this.websocket.sendToClient(ws, {
                type: 'initial_state',
                data: state
            });
        });

        this.websocket.registerHandler('system_power', (ws, data) => {
            const { state } = data;
            console.log(`System power ${state ? 'ON' : 'OFF'}`);

            if (state) {
                this.startEmulation();
            } else {
                this.stopEmulation();
            }

            this.websocket.broadcast({
                type: 'system_power',
                data: { state }
            });
        });

        // Program execution messages
        this.websocket.registerHandler('load_program', async (ws, data) => {
            try {
                const { programData, programName, startAddress } = data;

                if (programData && programData.length > 0) {
                    this.emulation.loadProgram(programData, startAddress || 0x0000);

                    this.websocket.broadcast({
                        type: 'program_loaded',
                        data: {
                            programName,
                            size: programData.length,
                            startAddress: startAddress || 0x0000
                        }
                    });
                } else {
                    throw new Error('Invalid program data');
                }
            } catch (error) {
                this.websocket.sendToClient(ws, {
                    type: 'error',
                    data: { message: `Failed to load program: ${error.message}` }
                });
            }
        });

        this.websocket.registerHandler('execute_program', async (ws, data) => {
            try {
                const { programName } = data;

                if (this.emulation.cpu.isRunning) {
                    throw new Error('Emulation is already running');
                }

                // Start emulation loop
                this.startEmulation();

                this.websocket.broadcast({
                    type: 'program_executing',
                    data: { programName, status: 'running' }
                });

            } catch (error) {
                this.websocket.sendToClient(ws, {
                    type: 'error',
                    data: { message: `Failed to execute program: ${error.message}` }
                });
            }
        });

        // File system messages
        this.websocket.registerHandler('mount_disk', async (ws, data) => {
            try {
                console.log('Mount disk request received:', { drive: data.drive, filename: data.filename, dataSize: data.data ? data.data.length : 0 });

                const { drive, filename, data: diskData } = data;

                if (!drive || !filename || !diskData) {
                    throw new Error('Drive, filename, and disk data are required');
                }

                // Create a temporary file path for the disk image
                const tempDir = path.join(__dirname, 'temp');
                const fs = require('fs').promises;

                // Ensure temp directory exists
                try {
                    await fs.mkdir(tempDir, { recursive: true });
                } catch (e) {
                    // Directory might already exist
                }

                const tempPath = path.join(tempDir, `disk_${Date.now()}_${filename}`);

                // Write the binary data to a temporary file
                const buffer = Buffer.from(diskData);
                console.log(`Writing ${buffer.length} bytes to temporary file: ${tempPath}`);
                await fs.writeFile(tempPath, buffer);

                // Mount the disk using the temporary file path
                console.log(`Attempting to mount disk: ${tempPath} to drive ${drive}`);
                const mounted = await this.emulation.mountDisk(drive, tempPath);

                if (mounted) {
                    console.log(`✅ Successfully mounted ${filename} to drive ${drive}`);
                    this.websocket.broadcast({
                        type: 'disk_mounted',
                        data: {
                            drive,
                            imageName: filename,
                            status: 'mounted',
                            tempPath: tempPath
                        }
                    });
                } else {
                    // Clean up temp file on failure
                    try {
                        await fs.unlink(tempPath);
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    throw new Error('Failed to mount disk');
                }

            } catch (error) {
                console.error('❌ Disk mount error:', error.message);
                this.websocket.sendToClient(ws, {
                    type: 'error',
                    data: { message: `Failed to mount disk: ${error.message}` }
                });
            }
        });

        this.websocket.registerHandler('list_files', async (ws, data) => {
            try {
                const { drive } = data || { drive: 'A:' };
                const files = this.emulation.listFiles(drive);

                this.websocket.sendToClient(ws, {
                    type: 'file_list',
                    data: { drive, files }
                });

            } catch (error) {
                this.websocket.sendToClient(ws, {
                    type: 'error',
                    data: { message: `Failed to list files: ${error.message}` }
                });
            }
        });

        this.websocket.registerHandler('load_file', async (ws, data) => {
            try {
                const { drive, filename, maxLength } = data;

                if (!filename) {
                    throw new Error('Filename is required');
                }

                const fileData = this.emulation.readFile(drive || 'A:', filename, maxLength || 8192);

                if (fileData) {
                    this.websocket.sendToClient(ws, {
                        type: 'file_loaded',
                        data: {
                            filename,
                            size: fileData.length,
                            data: Array.from(fileData)
                        }
                    });
                } else {
                    throw new Error('File not found or could not be read');
                }

            } catch (error) {
                this.websocket.sendToClient(ws, {
                    type: 'error',
                    data: { message: `Failed to load file: ${error.message}` }
                });
            }
        });

        console.log('WebSocket message handlers registered');
    }

    /**
     * Set up REST API endpoints
     */
    setupAPIEndpoints() {
        // System control endpoints
        this.app.post('/api/system/start', (req, res) => {
            try {
                this.startEmulation();
                res.json({ status: 'started' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/system/stop', (req, res) => {
            try {
                this.stopEmulation();
                res.json({ status: 'stopped' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/system/reset', (req, res) => {
            try {
                this.resetSystem();
                res.json({ status: 'reset' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/system/state', (req, res) => {
            try {
                const state = this.getSystemState();
                res.json(state);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Program management endpoints
        this.app.post('/api/programs/load', (req, res) => {
            try {
                const { programData, programName, startAddress } = req.body;

                if (!programData || !Array.isArray(programData)) {
                    return res.status(400).json({ error: 'Program data array is required' });
                }

                this.emulation.loadProgram(programData, startAddress || 0x0000);

                res.json({
                    status: 'loaded',
                    programName,
                    size: programData.length,
                    startAddress: startAddress || 0x0000
                });

            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/programs/execute', (req, res) => {
            try {
                if (this.emulation.cpu.isRunning) {
                    return res.status(400).json({ error: 'Emulation is already running' });
                }

                this.startEmulation();
                res.json({ status: 'executing' });

            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // File system endpoints
        this.app.post('/api/files/mount', async (req, res) => {
            try {
                const { drive, imagePath } = req.body;

                if (!drive || !imagePath) {
                    return res.status(400).json({ error: 'Drive and image path are required' });
                }

                const mounted = await this.emulation.mountDisk(drive, imagePath);

                if (mounted) {
                    res.json({ status: 'mounted', drive, imagePath });
                } else {
                    res.status(500).json({ error: 'Failed to mount disk' });
                }

            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/files/list/:drive', (req, res) => {
            try {
                const drive = req.params.drive || 'A:';
                const files = this.emulation.listFiles(drive);
                res.json({ drive, files });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Also handle the case without drive parameter
        this.app.get('/api/files/list', (req, res) => {
            try {
                const drive = 'A:';
                const files = this.emulation.listFiles(drive);
                res.json({ drive, files });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/files/read/:drive/:filename', (req, res) => {
            try {
                const { drive, filename } = req.params;
                const maxLength = parseInt(req.query.maxLength) || 8192;

                const fileData = this.emulation.readFile(drive, filename, maxLength);

                if (fileData) {
                    res.json({
                        filename,
                        size: fileData.length,
                        data: Array.from(fileData)
                    });
                } else {
                    res.status(404).json({ error: 'File not found' });
                }

            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        console.log('API endpoints configured');
    }

    /**
     * Set up graceful shutdown handlers
     */
    setupShutdownHandlers() {
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully...');
            this.shutdown();
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully...');
            this.shutdown();
        });

        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.shutdown();
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.shutdown();
        });
    }

    /**
     * Start the emulation loop
     */
    startEmulation() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        // Main emulation loop
        this.emulationLoop = setInterval(() => {
            try {
                // Execute emulation cycles
                const cycles = this.emulation.run(1000); // Run 1000 cycles per iteration

                // Broadcast system state periodically
                if (cycles > 0) {
                    const state = this.getSystemState();
                    this.websocket.broadcastSystemState(state);
                }

                // Check if emulation should stop
                if (this.emulation.cpu.isHalted || !this.emulation.cpu.isRunning) {
                    this.stopEmulation();
                }

            } catch (error) {
                console.error('Error in emulation loop:', error);
                this.stopEmulation();
            }
        }, 16); // ~60 FPS

        console.log('Emulation started');
    }

    /**
     * Stop the emulation loop
     */
    stopEmulation() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        if (this.emulationLoop) {
            clearInterval(this.emulationLoop);
            this.emulationLoop = null;
        }

        console.log('Emulation stopped');
    }

    /**
     * Reset the entire system
     */
    resetSystem() {
        this.stopEmulation();

        // Reset all components
        this.emulation.reset();

        console.log('System reset complete');
    }

    /**
     * Get complete system state
     */
    getSystemState() {
        return {
            emulation: this.emulation.getState(),
            components: this.emulation.getComponents(),
            server: {
                isRunning: this.isRunning,
                clients: this.websocket.getClientCount(),
                uptime: process.uptime()
            }
        };
    }

    /**
     * Start the server
     */
    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server.listen(this.port, () => {
                    console.log(`OrionRisc-128 server running on port ${this.port}`);
                    console.log(`Frontend available at: http://localhost:${this.port}`);
                    console.log(`API available at: http://localhost:${this.port}/api`);
                    resolve();
                });

                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        console.error(`Port ${this.port} is already in use`);
                    } else {
                        console.error('Server error:', error);
                    }
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Shutdown the server gracefully
     */
    shutdown() {
        console.log('Shutting down OrionRisc-128 server...');

        // Stop emulation
        this.stopEmulation();

        // Close WebSocket connections
        this.websocket.closeAll();

        // Close server
        this.server.close(() => {
            console.log('Server shutdown complete');
            process.exit(0);
        });

        // Force exit after 5 seconds
        setTimeout(() => {
            console.log('Forced shutdown after timeout');
            process.exit(1);
        }, 5000);
    }
}

// Create and start server if this file is run directly
if (require.main === module) {
    const server = new OrionRisc128Server();

    // Start server
    server.start().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

    // Handle shutdown signals
    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down...');
        server.shutdown();
    });

    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down...');
        server.shutdown();
    });
}

module.exports = OrionRisc128Server;