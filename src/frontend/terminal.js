/**
 * OrionRisc-128 Terminal Emulation Component
 * Handles BASIC interpreter interaction and text I/O
 */

class TerminalEmulator {
    constructor() {
        this.outputElement = document.getElementById('terminal-output');
        this.inputElement = document.getElementById('terminal-input');
        this.overlayElement = document.getElementById('terminal-overlay');
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentLine = '';
        this.isInputMode = false;

        this.CHARS_PER_LINE = 80;
        this.LINES_PER_SCREEN = 25;
        this.outputLines = [];

        this.initializeEventListeners();
        this.setupWebSocketHandlers();
    }

    /**
     * Initialize keyboard and focus event listeners
     */
    initializeEventListeners() {
        this.inputElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.inputElement.addEventListener('input', (e) => this.handleInput(e));

        // Focus management for the terminal area
        this.overlayElement.addEventListener('click', () => {
            this.focusInput();
        });

        // Handle paste events
        this.inputElement.addEventListener('paste', (e) => this.handlePaste(e));
    }

    /**
     * Set up WebSocket message handlers for terminal communication
     */
    setupWebSocketHandlers() {
        if (window.OrionRiscApp && window.OrionRiscApp.components.websocket) {
            const ws = window.OrionRiscApp.components.websocket;

            ws.addMessageHandler('terminal_output', (data) => {
                this.writeOutput(data.text);
            });

            ws.addMessageHandler('terminal_input_request', (data) => {
                this.requestInput(data.prompt || '');
            });

            ws.addMessageHandler('terminal_clear', () => {
                this.clearScreen();
            });

            ws.addMessageHandler('terminal_set_cursor', (data) => {
                this.setCursorPosition(data.x, data.y);
            });
        }
    }

    /**
     * Get WebSocket instance
     */
    getWebSocket() {
        return window.OrionRiscApp && window.OrionRiscApp.components.websocket;
    }

    /**
     * Handle WebSocket connection establishment
     */
    onConnected() {
        console.log('Terminal emulator connected to server');
        // Request initial terminal state or perform any connection-time initialization
        const ws = this.getWebSocket();
        if (ws && ws.isConnected) {
            // Request current terminal state from server
            ws.send({
                type: 'terminal_request_state'
            });
        }
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.processCommand();
                break;

            case 'Backspace':
                e.preventDefault();
                this.handleBackspace();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(1);
                break;

            case 'ArrowLeft':
                e.preventDefault();
                this.moveCursor(-1);
                break;

            case 'ArrowRight':
                e.preventDefault();
                this.moveCursor(1);
                break;

            case 'Home':
                e.preventDefault();
                this.moveCursorToStart();
                break;

            case 'End':
                e.preventDefault();
                this.moveCursorToEnd();
                break;

            case 'Tab':
                e.preventDefault();
                this.handleTab();
                break;

            case 'Escape':
                e.preventDefault();
                this.handleEscape();
                break;
        }
    }

    /**
     * Handle text input changes
     */
    handleInput(e) {
        this.currentLine = this.inputElement.value;
        this.updateDisplay();

        // Send typing indicator to backend if connected
        const ws = this.getWebSocket();
        if (ws && ws.isConnected) {
            ws.send({
                type: 'terminal_typing',
                text: this.currentLine
            });
        }
    }

    /**
     * Handle paste events
     */
    handlePaste(e) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const cleanText = pastedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        this.insertText(cleanText);
    }

    /**
     * Process entered command
     */
    processCommand() {
        const command = this.currentLine.trim();

        if (command) {
            // Add to history
            this.commandHistory.unshift(command);
            if (this.commandHistory.length > 100) {
                this.commandHistory.pop();
            }

            // Send to backend
            const ws = this.getWebSocket();
            if (ws && ws.isConnected) {
                ws.send({
                    type: 'terminal_input',
                    text: command + '\n'
                });
            } else {
                // Fallback for local testing
                this.writeOutput(command);
                this.writeOutput('> ' + this.executeLocalCommand(command));
            }
        }

        this.currentLine = '';
        this.inputElement.value = '';
        this.historyIndex = -1;
        this.updateDisplay();
    }

    /**
     * Handle backspace key
     */
    handleBackspace() {
        if (this.currentLine.length > 0) {
            this.currentLine = this.currentLine.slice(0, -1);
            this.inputElement.value = this.currentLine;
            this.updateDisplay();
        }
    }

    /**
     * Navigate command history
     */
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        this.historyIndex += direction;

        if (this.historyIndex < -1) {
            this.historyIndex = -1;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length - 1;
        }

        if (this.historyIndex === -1) {
            this.inputElement.value = this.currentLine;
        } else {
            this.inputElement.value = this.commandHistory[this.historyIndex];
            this.currentLine = this.commandHistory[this.historyIndex];
        }

        this.updateDisplay();
    }

    /**
     * Move cursor within input line
     */
    moveCursor(direction) {
        const input = this.inputElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        if (direction < 0 && start > 0) {
            input.setSelectionRange(start + direction, start + direction);
        } else if (direction > 0 && end < this.currentLine.length) {
            input.setSelectionRange(start + direction, start + direction);
        }
    }

    /**
     * Move cursor to start of line
     */
    moveCursorToStart() {
        this.inputElement.setSelectionRange(0, 0);
    }

    /**
     * Move cursor to end of line
     */
    moveCursorToEnd() {
        const length = this.currentLine.length;
        this.inputElement.setSelectionRange(length, length);
    }

    /**
     * Handle tab key (could be used for auto-completion)
     */
    handleTab() {
        // For now, just insert spaces
        this.insertText('    ');
    }

    /**
     * Handle escape key
     */
    handleEscape() {
        this.currentLine = '';
        this.inputElement.value = '';
        this.updateDisplay();
    }

    /**
     * Insert text at cursor position
     */
    insertText(text) {
        const input = this.inputElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        this.currentLine = this.currentLine.slice(0, start) + text + this.currentLine.slice(end);
        this.inputElement.value = this.currentLine;

        // Position cursor after inserted text
        input.setSelectionRange(start + text.length, start + text.length);
        this.updateDisplay();
    }

    /**
     * Write output to terminal
     */
    writeOutput(text) {
        // Split text into lines and add to output
        const lines = text.split('\n');

        for (const line of lines) {
            this.outputLines.push(line);

            // Keep only the last N lines to prevent memory issues
            if (this.outputLines.length > this.LINES_PER_SCREEN * 2) {
                this.outputLines = this.outputLines.slice(-this.LINES_PER_SCREEN);
            }
        }

        this.updateDisplay();
    }

    /**
     * Request input from user
     */
    requestInput(promptText = '') {
        if (promptText) {
            this.writeOutput(promptText);
        }
        this.isInputMode = true;
        this.focusInput();
    }

    /**
     * Clear the terminal screen
     */
    clearScreen() {
        this.outputLines = [];
        this.outputElement.textContent = '';
        this.isInputMode = false;
    }

    /**
     * Set cursor position (for advanced terminal control)
     */
    setCursorPosition(x, y) {
        // Implementation for cursor positioning if needed
        console.log(`Cursor position: ${x}, ${y}`);
    }

    /**
     * Update the terminal display
     */
    updateDisplay() {
        // Update output display
        const visibleLines = this.outputLines.slice(-this.LINES_PER_SCREEN);
        this.outputElement.textContent = visibleLines.join('\n');

        // Update input display
        this.inputElement.value = this.currentLine;

        // Scroll to bottom
        this.overlayElement.scrollTop = this.overlayElement.scrollHeight;
    }

    /**
     * Focus the input element
     */
    focusInput() {
        this.inputElement.focus();
    }

    /**
     * Execute local commands for testing when backend is not available
     */
    executeLocalCommand(command) {
        const cmd = command.toLowerCase().trim();

        switch (cmd) {
            case 'help':
                return 'Available commands: HELP, CLS, ECHO, DATE, TIME';

            case 'cls':
            case 'clear':
                this.clearScreen();
                return '';

            case 'date':
                return new Date().toLocaleDateString();

            case 'time':
                return new Date().toLocaleTimeString();

            case 'echo':
                return 'Echo command - please provide text to echo';

            default:
                if (cmd.startsWith('echo ')) {
                    return cmd.substring(5);
                }
                return `Unknown command: ${command}`;
        }
    }

    /**
     * Get terminal state for debugging
     */
    getState() {
        return {
            outputLines: this.outputLines.length,
            currentLine: this.currentLine,
            historySize: this.commandHistory.length,
            isInputMode: this.isInputMode
        };
    }

    /**
     * Load terminal state from saved data
     */
    loadState(state) {
        if (state.outputLines) {
            this.outputLines = state.outputLines;
            this.updateDisplay();
        }
    }
}

// Export for use in other modules
window.TerminalEmulator = TerminalEmulator;