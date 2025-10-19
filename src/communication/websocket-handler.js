/**
 * WebSocket Communication Layer for OrionRisc-128
 *
 * Handles real-time communication between frontend and backend emulation
 */

const WebSocket = require('ws');

class WebSocketHandler {
    constructor(server) {
        this.websocketServer = new WebSocket.Server({ server });
        this.clients = new Set();
        this.messageHandlers = new Map();

        this.setupWebSocketServer();
        console.log('WebSocket communication layer initialized');
    }

    /**
     * Set up WebSocket server event handlers
     */
    setupWebSocketServer() {
        this.websocketServer.on('connection', (ws, request) => {
            console.log(`New WebSocket connection from ${request.socket.remoteAddress}`);

            // Add client to our set
            this.clients.add(ws);

            // Set up message handler for this client
            ws.on('message', (message) => {
                this.handleMessage(ws, message);
            });

            // Handle client disconnection
            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.clients.delete(ws);
            });

            // Handle connection errors
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });

            // Send welcome message
            this.sendToClient(ws, {
                type: 'connection_established',
                data: { message: 'Connected to OrionRisc-128 emulation server' }
            });
        });
    }

    /**
     * Register a message handler for a specific message type
     * @param {string} messageType - Type of message to handle
     * @param {Function} handler - Handler function (ws, data) => void
     */
    registerHandler(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
        console.log(`Registered handler for message type: ${messageType}`);
    }

    /**
     * Handle incoming WebSocket messages
     * @param {WebSocket} ws - WebSocket connection
     * @param {Buffer} message - Raw message data
     */
    handleMessage(ws, message) {
        try {
            const messageData = JSON.parse(message.toString());
            const { type, data } = messageData;

            console.log(`Received message type: ${type}`);

            // Find and execute handler for this message type
            const handler = this.messageHandlers.get(type);
            if (handler) {
                handler(ws, data);
            } else {
                console.warn(`No handler registered for message type: ${type}`);
                this.sendToClient(ws, {
                    type: 'error',
                    data: { message: `Unknown message type: ${type}` }
                });
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            this.sendToClient(ws, {
                type: 'error',
                data: { message: 'Invalid message format' }
            });
        }
    }

    /**
     * Send a message to a specific client
     * @param {WebSocket} ws - Target WebSocket connection
     * @param {Object} message - Message object with type and data
     */
    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast a message to all connected clients
     * @param {Object} message - Message object with type and data
     */
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }

    /**
     * Send system state to all clients
     * @param {Object} systemState - Current system state
     */
    broadcastSystemState(systemState) {
        this.broadcast({
            type: 'system_state',
            data: systemState
        });
    }

    /**
     * Send GPU frame buffer update to all clients
     * @param {Object} frameData - Frame buffer data
     */
    broadcastFrameUpdate(frameData) {
        this.broadcast({
            type: 'frame_update',
            data: frameData
        });
    }

    /**
     * Send terminal output to all clients
     * @param {string} text - Terminal text output
     */
    broadcastTerminalOutput(text) {
        this.broadcast({
            type: 'terminal_output',
            data: { text }
        });
    }

    /**
     * Send error message to all clients
     * @param {string} error - Error message
     */
    broadcastError(error) {
        this.broadcast({
            type: 'error',
            data: { message: error }
        });
    }

    /**
     * Get number of connected clients
     * @returns {number} Number of active connections
     */
    getClientCount() {
        return this.clients.size;
    }

    /**
     * Close all client connections
     */
    closeAll() {
        this.clients.forEach(ws => {
            ws.close();
        });
        this.clients.clear();
    }
}

module.exports = WebSocketHandler;