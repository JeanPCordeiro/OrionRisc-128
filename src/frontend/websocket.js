/**
 * OrionRisc-128 WebSocket Communication Layer
 * Handles real-time communication between frontend and backend emulation server
 */

class EmulationWebSocket {
    constructor(serverUrl = null) {
        this.serverUrl = serverUrl || this.getDefaultServerUrl();
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.messageHandlers = new Map();
        this.messageQueue = [];
        this.eventHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.heartbeatInterval = null;
        this.lastHeartbeat = null;

        this.connectionStatusElement = document.getElementById('connection-status');

        this.connect();
        this.setupHeartbeat();
    }

    /**
     * Get default server URL based on current location
     */
    getDefaultServerUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws`;
    }

    /**
     * Connect to the emulation server
     */
    connect() {
        if (this.isConnecting || this.isConnected) return;

        this.isConnecting = true;
        this.updateConnectionStatus('connecting');

        try {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.onopen = (event) => this.handleOpen(event);
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = (event) => this.handleClose(event);
            this.ws.onerror = (event) => this.handleError(event);

        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket connection open
     */
    handleOpen(event) {
        console.log('Connected to emulation server');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        this.updateConnectionStatus('connected');
        this.processMessageQueue();
        this.sendHandshake();

        // Initialize all components
        this.initializeComponents();
    }

    /**
     * Handle WebSocket messages
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.routeMessage(message);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket connection close
     */
    handleClose(event) {
        console.log('Disconnected from emulation server:', event.code, event.reason);
        this.isConnected = false;
        this.isConnecting = false;

        this.updateConnectionStatus('disconnected');

        if (event.code !== 1000) { // Not a normal closure
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket errors
     */
    handleError(event) {
        console.error('WebSocket error:', event);
        this.isConnecting = false;
    }

    /**
     * Route incoming messages to appropriate handlers
     */
    routeMessage(message) {
        const { type, data } = message;

        // Update heartbeat timestamp
        if (type !== 'heartbeat') {
            this.lastHeartbeat = Date.now();
        }

        // Route to specific handlers
        if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in message handler for ${type}:`, error);
                }
            });
        }

        // Route to component-specific handlers
        this.routeToComponents(type, data);
    }

    /**
     * Route messages to specific frontend components
     */
    routeToComponents(type, data) {
        switch (type) {
            case 'terminal_output':
            case 'terminal_input_request':
            case 'terminal_clear':
            case 'terminal_set_cursor':
                if (window.TerminalEmulator) {
                    window.TerminalEmulator.handleWebSocketMessage(type, data);
                }
                break;

            case 'gpu_pixel':
            case 'gpu_character':
            case 'gpu_clear':
            case 'gpu_text_mode':
            case 'gpu_cursor':
            case 'gpu_frame':
                if (window.GraphicsDisplay) {
                    window.GraphicsDisplay.handleWebSocketMessage(type, data);
                }
                break;

            case 'system_status':
            case 'cpu_status':
            case 'memory_status':
            case 'disk_status':
            case 'debug_info':
                if (window.ControlPanel) {
                    window.ControlPanel.handleWebSocketMessage(type, data);
                }
                break;

            case 'disk_mounted':
            case 'disk_ejected':
            case 'disk_files':
            case 'file_loaded':
            case 'file_saved':
                if (window.FileBrowser) {
                    window.FileBrowser.handleWebSocketMessage(type, data);
                }
                break;
        }
    }

    /**
     * Send message to server
     */
    send(message) {
        const fullMessage = {
            type: message.type || 'unknown',
            data: message,
            timestamp: Date.now()
        };

        if (this.isConnected) {
            try {
                // Handle binary data (ArrayBuffer) by converting to array
                if (fullMessage.data.data && fullMessage.data.data instanceof ArrayBuffer) {
                    fullMessage.data.data = Array.from(new Uint8Array(fullMessage.data.data));
                }

                this.ws.send(JSON.stringify(fullMessage));
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
                this.messageQueue.push(fullMessage);
            }
        } else {
            this.messageQueue.push(fullMessage);

            // Auto-reconnect if not already connecting
            if (!this.isConnecting) {
                this.connect();
            }
        }
    }

    /**
     * Add message handler for specific message types
     */
    addMessageHandler(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type).push(handler);
    }

    /**
     * Remove message handler
     */
    removeMessageHandler(type, handler) {
        if (this.messageHandlers.has(type)) {
            const handlers = this.messageHandlers.get(type);
            const index = handlers.indexOf(handler);
            if (index >= 0) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Add event handler for WebSocket events
     */
    addEventListener(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remove event handler
     */
    removeEventListener(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index >= 0) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to all registered handlers
     */
    emit(event, data = null) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Send handshake message to server
     */
    sendHandshake() {
        this.send({
            type: 'handshake',
            client: 'frontend',
            version: '1.0.0',
            capabilities: [
                'terminal',
                'graphics',
                'controls',
                'filebrowser'
            ]
        });
    }

    /**
     * Initialize all frontend components
     */
    initializeComponents() {
        // Request initial state from server
        this.send({ type: 'request_initial_state' });

        // Emit connection established event for main application to handle
        this.emit('connectionEstablished');
    }

    /**
     * Process queued messages after reconnection
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send queued message:', error);
                break;
            }
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            this.updateConnectionStatus('failed');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Update connection status display
     */
    updateConnectionStatus(status) {
        if (this.connectionStatusElement) {
            this.connectionStatusElement.className = `connection-status ${status}`;

            switch (status) {
                case 'connected':
                    this.connectionStatusElement.textContent = 'Connected to emulation server';
                    break;
                case 'connecting':
                    this.connectionStatusElement.textContent = 'Connecting to emulation server...';
                    break;
                case 'disconnected':
                    this.connectionStatusElement.textContent = 'Disconnected from emulation server';
                    break;
                case 'failed':
                    this.connectionStatusElement.textContent = 'Connection failed - check server';
                    break;
            }
        }
    }

    /**
     * Set up heartbeat mechanism
     */
    setupHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                const now = Date.now();
                const timeSinceLastHeartbeat = now - this.lastHeartbeat;

                // Send heartbeat if no activity for 30 seconds
                if (timeSinceLastHeartbeat > 30000) {
                    this.send({ type: 'heartbeat' });
                }

                // Disconnect if no response for 60 seconds
                if (timeSinceLastHeartbeat > 60000) {
                    console.log('Heartbeat timeout - disconnecting');
                    this.ws.close();
                }
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Send heartbeat message
     */
    sendHeartbeat() {
        this.send({ type: 'heartbeat' });
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }

    /**
     * Get connection statistics
     */
    getConnectionStats() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            lastHeartbeat: this.lastHeartbeat,
            serverUrl: this.serverUrl
        };
    }

    /**
     * Test connection with ping/pong
     */
    ping() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Not connected'));
                return;
            }

            const startTime = Date.now();
            const timeout = setTimeout(() => {
                reject(new Error('Ping timeout'));
            }, 5000);

            const handler = (data) => {
                clearTimeout(timeout);
                this.removeMessageHandler('pong', handler);
                resolve(Date.now() - startTime);
            };

            this.addMessageHandler('pong', handler);
            this.send({ type: 'ping' });
        });
    }
}

// Export for use in other modules
window.EmulationWebSocket = EmulationWebSocket;