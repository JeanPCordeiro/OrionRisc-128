/**
 * OrionRisc-128 Frontend Main Application
 * Coordinates all frontend components and manages the overall user interface
 */

class OrionRiscFrontend {
    constructor() {
        this.isInitialized = false;
        this.components = {};

        this.initialize();
    }

    /**
     * Initialize the entire frontend application
     */
    async initialize() {
        try {
            console.log('Initializing OrionRisc-128 Frontend...');

            // Initialize components in dependency order
            await this.initializeComponents();

            // Set up global error handling
            this.setupErrorHandling();

            // Set up window resize handling
            this.setupResizeHandling();

            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Set up startup animation
            this.setupStartupAnimation();

            this.isInitialized = true;
            console.log('OrionRisc-128 Frontend initialized successfully');

            // Show welcome message
            this.showWelcomeMessage();

        } catch (error) {
            console.error('Failed to initialize frontend:', error);
            this.showError('Failed to initialize OrionRisc-128 frontend');
        }
    }

    /**
     * Initialize all frontend components
     */
    async initializeComponents() {
        // 1. WebSocket communication (must be first)
        console.log('Initializing WebSocket communication...');
        this.components.websocket = new EmulationWebSocket();

        // Set up event listener for when WebSocket connection is established
        await new Promise((resolve) => {
            const handleConnectionEstablished = () => {
                this.components.websocket.removeEventListener('connectionEstablished', handleConnectionEstablished);
                resolve();
            };
            this.components.websocket.addEventListener('connectionEstablished', handleConnectionEstablished);
        });

        // 2. Graphics display
        console.log('Initializing graphics display...');
        this.components.graphics = new GraphicsDisplay();

        // 3. Terminal emulator
        console.log('Initializing terminal emulator...');
        this.components.terminal = new TerminalEmulator();

        // 4. Control panel
        console.log('Initializing control panel...');
        this.components.controls = new ControlPanel();

        // 5. File browser
        console.log('Initializing file browser...');
        this.components.filebrowser = new FileBrowser();

        // Set up WebSocket handlers for all components now that WebSocket is ready
        console.log('Setting up WebSocket handlers...');
        this.components.graphics.setupWebSocketHandlers();
        this.components.terminal.setupWebSocketHandlers();
        this.components.controls.setupWebSocketHandlers();
        this.components.filebrowser.setupWebSocketHandlers();

        console.log('All components initialized');
    }


    /**
     * Set up global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('An unexpected error occurred');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('An unexpected error occurred');
        });
    }

    /**
     * Set up window resize handling
     */
    setupResizeHandling() {
        let resizeTimeout;

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.components.graphics) {
                    this.components.graphics.resize();
                }
                console.log('Window resized, graphics updated');
            }, 250);
        });
    }

    /**
     * Set up global keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+I for developer tools (if needed)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                // Ignore - let browser handle
                return;
            }

            // Ctrl+Shift+R for system reset
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                if (this.components.controls) {
                    this.components.controls.resetSystem();
                }
            }

            // Ctrl+Shift+P for power toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                if (this.components.controls) {
                    this.components.controls.togglePower();
                }
            }

            // Ctrl+Shift+D for debug panel
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                if (this.components.controls) {
                    this.components.controls.toggleDebugPanel();
                }
            }
        });
    }

    /**
     * Set up startup animation
     */
    setupStartupAnimation() {
        const computerFrame = document.querySelector('.computer-frame');
        if (computerFrame) {
            computerFrame.classList.add('starting');

            setTimeout(() => {
                computerFrame.classList.remove('starting');
            }, 2000);
        }
    }

    /**
     * Show welcome message in terminal
     */
    showWelcomeMessage() {
        if (this.components.terminal) {
            this.components.terminal.writeOutput(
                '\n' +
                '╔══════════════════════════════════════════════════════════════╗\n' +
                '║                   Welcome to OrionRisc-128                  ║\n' +
                '║                    1980s Computer System                     ║\n' +
                '║                                                              ║\n' +
                '║  System Features:                                            ║\n' +
                '║  • RISC Processor with 16 registers                          ║\n' +
                '║  • 128KB RAM with memory-mapped I/O                         ║\n' +
                '║  • 640x200 monochrome graphics display                       ║\n' +
                '║  • Two 360KB floppy disk drives                             ║\n' +
                '║  • BASIC interpreter for programming                         ║\n' +
                '║                                                              ║\n' +
                '║  Getting Started:                                            ║\n' +
                '║  • Type BASIC commands in the terminal                       ║\n' +
                '║  • Use POWER button to turn system on/off                    ║\n' +
                '║  • Mount disk images using the file browser                 ║\n' +
                '║  • Load programs from disk using LOAD button                ║\n' +
                '║                                                              ║\n' +
                '║  Keyboard Shortcuts:                                         ║\n' +
                '║  • Ctrl+Shift+P: Power toggle                                ║\n' +
                '║  • Ctrl+Shift+R: System reset                                ║\n' +
                '║  • Ctrl+Shift+D: Toggle debug panel                          ║\n' +
                '║                                                              ║\n' +
                '╚══════════════════════════════════════════════════════════════╝\n' +
                '\n> '
            );
        }
    }

    /**
     * Show error message to user
     */
    showError(message) {
        if (this.components.terminal) {
            this.components.terminal.writeOutput(`\n[ERROR] ${message}\n> `);
        } else {
            alert(`OrionRisc-128 Error: ${message}`);
        }
    }

    /**
     * Show info message to user
     */
    showInfo(message) {
        if (this.components.terminal) {
            this.components.terminal.writeOutput(`\n[INFO] ${message}\n> `);
        } else {
            console.info(`OrionRisc-128: ${message}`);
        }
    }

    /**
     * Get application state for debugging
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            components: Object.keys(this.components),
            websocketConnected: this.components.websocket ?
                this.components.websocket.isConnected : false,
            graphicsReady: this.components.graphics ?
                this.components.graphics.getState() : null,
            terminalReady: this.components.terminal ?
                this.components.terminal.getState() : null,
            controlsReady: this.components.controls ?
                this.components.controls.getState() : null,
            filebrowserReady: this.components.filebrowser ?
                this.components.filebrowser.getState() : null
        };
    }

    /**
     * Take system snapshot for debugging
     */
    takeSnapshot() {
        const snapshot = {
            timestamp: new Date().toISOString(),
            frontendState: this.getState(),
            connectionStats: this.components.websocket ?
                this.components.websocket.getConnectionStats() : null
        };

        if (this.components.controls) {
            snapshot.systemSnapshot = this.components.controls.takeSnapshot();
        }

        console.log('Frontend Snapshot:', snapshot);
        return snapshot;
    }

    /**
     * Shutdown the application
     */
    shutdown() {
        console.log('Shutting down OrionRisc-128 Frontend...');

        if (this.components.websocket) {
            this.components.websocket.disconnect();
        }

        this.isInitialized = false;
        console.log('Frontend shutdown complete');
    }
}

// Global application instance
let orionRiscApp;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting OrionRisc-128 Frontend...');
    orionRiscApp = new OrionRiscFrontend();

    // Make app globally accessible for debugging
    window.OrionRiscApp = orionRiscApp;
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (orionRiscApp) {
        orionRiscApp.shutdown();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrionRiscFrontend;
}