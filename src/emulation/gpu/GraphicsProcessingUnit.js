/**
 * Graphics Processing Unit (GPU) - Main GPU class for OrionRisc-128
 *
 * Provides complete graphics emulation with 640x200 monochrome display,
 * 80x25 text mode, memory-mapped I/O interface, and real-time rendering
 * capabilities for integration with the frontend display system.
 */

const FrameBuffer = require('./frame-buffer');
const CharacterROM = require('./character-rom');
const GraphicsPrimitives = require('./graphics-primitives');
const TextModeEngine = require('./text-mode');

class GraphicsProcessingUnit {
    constructor() {
        // Initialize core components
        this.frameBuffer = new FrameBuffer();
        this.characterRom = new CharacterROM();
        this.graphicsPrimitives = new GraphicsPrimitives(this.frameBuffer);
        this.textModeEngine = new TextModeEngine(this.frameBuffer, this.characterRom);

        // GPU memory-mapped I/O registers
        this.registers = {
            // GPU Control Register (0x0000)
            GPU_CONTROL: 0x0000,
            // GPU Status Register (0x0004)
            GPU_STATUS: 0x0004,
            // Frame Buffer Start Address (0x0008)
            FRAME_BUFFER_START: 0x0008,
            // Frame Buffer End Address (0x000C)
            FRAME_BUFFER_END: 0x000C,
            // Current Scan Line (0x0010)
            SCAN_LINE: 0x0010,
            // Display Mode (0x0014)
            DISPLAY_MODE: 0x0014,
            // Cursor Position (0x0018)
            CURSOR_POSITION: 0x0018,
            // Text Mode Control (0x001C)
            TEXT_MODE_CONTROL: 0x001C,
            // Graphics Command (0x0020)
            GRAPHICS_COMMAND: 0x0020,
            // Command Parameter 0 (0x0024)
            COMMAND_PARAM0: 0x0024,
            // Command Parameter 1 (0x0028)
            COMMAND_PARAM1: 0x0028,
            // Command Parameter 2 (0x002C)
            COMMAND_PARAM2: 0x002C,
            // Command Parameter 3 (0x0030)
            COMMAND_PARAM3: 0x0030,
            // Palette Register 0 (0x0034)
            PALETTE_0: 0x0034,
            // Palette Register 1 (0x0038)
            PALETTE_1: 0x0038,
            // Border Color (0x003C)
            BORDER_COLOR: 0x003C,
            // Interrupt Control (0x0040)
            INTERRUPT_CONTROL: 0x0040,
            // Interrupt Status (0x0044)
            INTERRUPT_STATUS: 0x0044
        };

        // GPU state
        this.displayMode = 0; // 0 = graphics, 1 = text
        this.currentScanLine = 0;
        this.verticalBlank = false;
        this.horizontalBlank = false;

        // Command processing
        this.commandBuffer = [];
        this.currentCommand = null;
        this.commandParameters = new Uint32Array(4);

        // Performance tracking
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fps = 0;

        // Interrupt system
        this.interrupts = {
            VERTICAL_BLANK: 0x01,
            HORIZONTAL_BLANK: 0x02,
            COMMAND_COMPLETE: 0x04,
            FRAME_BUFFER_SWAP: 0x08
        };
        this.interruptEnable = 0;
        this.interruptStatus = 0;

        // Color palette (monochrome - for future expansion)
        this.palette = [false, true]; // 0 = dark, 1 = light
        this.borderColor = false;

        // Frame timing
        this.frameTime = 1000 / 60; // 60 FPS target
        this.lastFrameUpdate = Date.now();

        // WebSocket communication for real-time display
        this.websocket = null;
        this.frontendConnected = false;

        // Initialize GPU
        this.reset();
    }

    /**
     * Reset the GPU to initial state
     */
    reset() {
        this.displayMode = 0;
        this.currentScanLine = 0;
        this.verticalBlank = false;
        this.horizontalBlank = false;

        this.commandBuffer = [];
        this.currentCommand = null;
        this.commandParameters.fill(0);

        this.interruptEnable = 0;
        this.interruptStatus = 0;

        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        this.fps = 0;

        this.frameBuffer.clear();
        this.textModeEngine.clear();

        // Clear any pending interrupts
        this.interruptStatus = 0;
    }

    /**
     * Read from GPU memory-mapped I/O register
     * @param {number} address - Register address
     * @returns {number} Register value
     */
    readRegister(address) {
        // Handle frame buffer reads
        if (address >= 0x0000 && address < this.frameBuffer.FRAME_BUFFER_SIZE) {
            return this.frameBuffer.getFrontBuffer()[address];
        }

        // Handle register reads
        switch (address) {
            case this.registers.GPU_CONTROL:
                return (this.displayMode << 1) | (this.verticalBlank ? 1 : 0);

            case this.registers.GPU_STATUS:
                return (this.currentScanLine << 8) | (this.verticalBlank ? 0x01 : 0x00) |
                       (this.horizontalBlank ? 0x02 : 0x00) | ((this.interruptStatus & 0xFF) << 16);

            case this.registers.FRAME_BUFFER_START:
                return 0x0000;

            case this.registers.FRAME_BUFFER_END:
                return this.frameBuffer.FRAME_BUFFER_SIZE - 1;

            case this.registers.SCAN_LINE:
                return this.currentScanLine;

            case this.registers.DISPLAY_MODE:
                return this.displayMode;

            case this.registers.CURSOR_POSITION:
                const cursorPos = this.textModeEngine.getCursorPosition();
                return (cursorPos.y << 8) | cursorPos.x;

            case this.registers.TEXT_MODE_CONTROL:
                return (this.textModeEngine.cursorVisible ? 0x01 : 0x00) |
                       (this.textModeEngine.cursorBlink ? 0x02 : 0x00);

            case this.registers.GRAPHICS_COMMAND:
                return this.currentCommand || 0;

            case this.registers.COMMAND_PARAM0:
                return this.commandParameters[0];

            case this.registers.COMMAND_PARAM1:
                return this.commandParameters[1];

            case this.registers.COMMAND_PARAM2:
                return this.commandParameters[2];

            case this.registers.COMMAND_PARAM3:
                return this.commandParameters[3];

            case this.registers.PALETTE_0:
                return this.palette[0] ? 1 : 0;

            case this.registers.PALETTE_1:
                return this.palette[1] ? 1 : 0;

            case this.registers.BORDER_COLOR:
                return this.borderColor ? 1 : 0;

            case this.registers.INTERRUPT_CONTROL:
                return this.interruptEnable;

            case this.registers.INTERRUPT_STATUS:
                return this.interruptStatus;

            default:
                return 0;
        }
    }

    /**
     * Write to GPU memory-mapped I/O register
     * @param {number} address - Register address
     * @param {number} value - Value to write
     */
    writeRegister(address, value) {
        // Handle frame buffer writes
        if (address >= 0x0000 && address < this.frameBuffer.FRAME_BUFFER_SIZE) {
            this.frameBuffer.getBackBuffer()[address] = value & 0xFF;
            return;
        }

        // Handle register writes
        switch (address) {
            case this.registers.GPU_CONTROL:
                this.displayMode = (value >> 1) & 0x01;
                this.verticalBlank = (value & 0x01) !== 0;
                break;

            case this.registers.DISPLAY_MODE:
                this.displayMode = value & 0x01;
                break;

            case this.registers.CURSOR_POSITION:
                const x = value & 0xFF;
                const y = (value >> 8) & 0xFF;
                this.textModeEngine.setCursorPosition(x, y);
                break;

            case this.registers.TEXT_MODE_CONTROL:
                this.textModeEngine.setCursorVisible((value & 0x01) !== 0);
                // Cursor blink control could be added here
                break;

            case this.registers.GRAPHICS_COMMAND:
                this.executeGraphicsCommand(value);
                break;

            case this.registers.COMMAND_PARAM0:
                this.commandParameters[0] = value;
                break;

            case this.registers.COMMAND_PARAM1:
                this.commandParameters[1] = value;
                break;

            case this.registers.COMMAND_PARAM2:
                this.commandParameters[2] = value;
                break;

            case this.registers.COMMAND_PARAM3:
                this.commandParameters[3] = value;
                break;

            case this.registers.PALETTE_0:
                this.palette[0] = (value & 0x01) !== 0;
                break;

            case this.registers.PALETTE_1:
                this.palette[1] = (value & 0x01) !== 0;
                break;

            case this.registers.BORDER_COLOR:
                this.borderColor = (value & 0x01) !== 0;
                break;

            case this.registers.INTERRUPT_CONTROL:
                this.interruptEnable = value & 0xFF;
                break;

            case this.registers.INTERRUPT_STATUS:
                // Writing to status register clears interrupts
                this.interruptStatus &= ~(value & 0xFF);
                break;
        }
    }

    /**
     * Execute a graphics command
     * @param {number} command - Command code
     */
    executeGraphicsCommand(command) {
        this.currentCommand = command;

        switch (command) {
            case 0x00: // No operation
                break;

            case 0x01: // Clear screen
                this.frameBuffer.clear();
                break;

            case 0x02: // Swap buffers
                this.frameBuffer.swapBuffers();
                this.setInterrupt(this.interrupts.FRAME_BUFFER_SWAP);
                break;

            case 0x03: // Set pixel
                this.graphicsPrimitives.plotPixel(
                    this.commandParameters[0], // x
                    this.commandParameters[1], // y
                    (this.commandParameters[2] & 0x01) !== 0 // value
                );
                break;

            case 0x04: // Draw line
                this.graphicsPrimitives.drawLine(
                    this.commandParameters[0], // x1
                    this.commandParameters[1], // y1
                    this.commandParameters[2], // x2
                    this.commandParameters[3], // y2
                    (this.commandParameters[4] & 0x01) !== 0 // value
                );
                break;

            case 0x05: // Draw rectangle
                this.graphicsPrimitives.drawRectangle(
                    this.commandParameters[0], // x
                    this.commandParameters[1], // y
                    this.commandParameters[2], // width
                    this.commandParameters[3], // height
                    (this.commandParameters[4] & 0x01) !== 0 // value
                );
                break;

            case 0x06: // Fill rectangle
                this.graphicsPrimitives.fillRectangle(
                    this.commandParameters[0], // x
                    this.commandParameters[1], // y
                    this.commandParameters[2], // width
                    this.commandParameters[3], // height
                    (this.commandParameters[4] & 0x01) !== 0 // value
                );
                break;

            case 0x07: // Draw circle
                this.graphicsPrimitives.drawCircle(
                    this.commandParameters[0], // centerX
                    this.commandParameters[1], // centerY
                    this.commandParameters[2], // radius
                    (this.commandParameters[3] & 0x01) !== 0 // value
                );
                break;

            case 0x08: // Fill circle
                this.graphicsPrimitives.fillCircle(
                    this.commandParameters[0], // centerX
                    this.commandParameters[1], // centerY
                    this.commandParameters[2], // radius
                    (this.commandParameters[3] & 0x01) !== 0 // value
                );
                break;

            case 0x09: // Copy region
                this.graphicsPrimitives.copyRegion(
                    this.commandParameters[0], // srcX
                    this.commandParameters[1], // srcY
                    this.commandParameters[2], // destX
                    this.commandParameters[3], // destY
                    this.commandParameters[4], // width
                    this.commandParameters[5]  // height
                );
                break;

            case 0x0A: // Text mode - write character
                this.textModeEngine.putCharacter(
                    this.commandParameters[0] & 0xFF, // charCode
                    this.commandParameters[1] & 0xFF  // attributes
                );
                break;

            case 0x0B: // Text mode - set cursor position
                this.textModeEngine.setCursorPosition(
                    this.commandParameters[0] & 0xFF, // x
                    this.commandParameters[1] & 0xFF  // y
                );
                break;

            case 0x0C: // Text mode - clear screen
                this.textModeEngine.clear(
                    this.commandParameters[0] & 0xFF, // charCode
                    this.commandParameters[1] & 0xFF  // attributes
                );
                break;

            case 0x0D: // Text mode - scroll up
                this.textModeEngine.scrollUp(this.commandParameters[0] & 0xFF);
                break;

            case 0x0E: // Text mode - scroll down
                this.textModeEngine.scrollDown(this.commandParameters[0] & 0xFF);
                break;

            default:
                // Unknown command
                break;
        }

        // Signal command completion
        this.setInterrupt(this.interrupts.COMMAND_COMPLETE);
        this.currentCommand = null;
    }

    /**
     * Set interrupt status
     * @param {number} interrupt - Interrupt flag(s) to set
     */
    setInterrupt(interrupt) {
        this.interruptStatus |= interrupt;

        // Trigger CPU interrupt if enabled
        if (this.interruptEnable & interrupt) {
            // This would trigger a CPU interrupt in a real implementation
            // For now, we'll just set the status flag
        }
    }

    /**
     * Update GPU state for next frame
     */
    updateFrame() {
        const now = Date.now();

        // Update scan line (simulate CRT timing)
        this.currentScanLine++;
        if (this.currentScanLine >= this.frameBuffer.FRAME_HEIGHT) {
            this.currentScanLine = 0;
            this.verticalBlank = true;

            // Signal vertical blank interrupt
            this.setInterrupt(this.interrupts.VERTICAL_BLANK);

            // Update frame rate calculation
            this.frameCount++;
            if (this.frameCount % 60 === 0) {
                this.fps = 1000 / ((now - this.lastFrameTime) / 60);
                this.lastFrameTime = now;
            }
        } else if (this.currentScanLine === 0) {
            this.verticalBlank = false;
        }

        // Simulate horizontal blanking (every 640 pixels)
        this.horizontalBlank = false; // Simplified for emulation

        // Render current display mode
        this.render();

        // Send frame buffer to frontend if connected
        if (this.frontendConnected && this.websocket) {
            this.sendFrameBufferToFrontend();
        }
    }

    /**
     * Render the current display to the frame buffer
     */
    render() {
        if (this.displayMode === 0) {
            // Graphics mode - frame buffer is already updated by commands
            // Could add border rendering here if needed
        } else {
            // Text mode - render text to frame buffer
            this.textModeEngine.render();
        }
    }

    /**
     * Send current frame buffer to frontend via WebSocket
     */
    sendFrameBufferToFrontend() {
        if (!this.websocket || !this.frontendConnected) return;

        try {
            const frameData = {
                type: 'frame_update',
                frameBuffer: Array.from(this.frameBuffer.getFrontBuffer()),
                displayMode: this.displayMode,
                scanLine: this.currentScanLine,
                timestamp: Date.now()
            };

            this.websocket.send(JSON.stringify(frameData));
        } catch (error) {
            console.error('Error sending frame buffer to frontend:', error);
            this.frontendConnected = false;
        }
    }

    /**
     * Connect to frontend WebSocket
     * @param {WebSocket} websocket - WebSocket connection
     */
    connectToFrontend(websocket) {
        this.websocket = websocket;
        this.frontendConnected = true;

        websocket.on('message', (data) => {
            this.handleFrontendMessage(JSON.parse(data));
        });

        websocket.on('close', () => {
            this.frontendConnected = false;
        });

        // Send initial frame buffer
        this.sendFrameBufferToFrontend();
    }

    /**
     * Handle messages from frontend
     * @param {Object} message - Message from frontend
     */
    handleFrontendMessage(message) {
        switch (message.type) {
            case 'frame_ack':
                // Frontend acknowledged frame receipt
                break;

            case 'resize':
                // Handle display resize if needed
                break;

            case 'key_event':
                // Handle keyboard input for text mode
                if (this.displayMode === 1) {
                    this.textModeEngine.putCharacter(message.keyCode, message.attributes || 0);
                }
                break;

            default:
                // Unknown message type
                break;
        }
    }

    /**
     * Get GPU capabilities and status
     * @returns {Object} GPU status object
     */
    getStatus() {
        return {
            displayMode: this.displayMode,
            currentScanLine: this.currentScanLine,
            verticalBlank: this.verticalBlank,
            horizontalBlank: this.horizontalBlank,
            frameCount: this.frameCount,
            fps: this.fps,
            interruptEnable: this.interruptEnable,
            interruptStatus: this.interruptStatus,
            frontendConnected: this.frontendConnected,
            dimensions: this.frameBuffer.getDimensions()
        };
    }

    /**
     * Get frame buffer for direct access
     * @returns {FrameBuffer} Frame buffer instance
     */
    getFrameBuffer() {
        return this.frameBuffer;
    }

    /**
     * Get text mode engine for direct access
     * @returns {TextModeEngine} Text mode engine instance
     */
    getTextModeEngine() {
        return this.textModeEngine;
    }

    /**
     * Get graphics primitives for direct access
     * @returns {GraphicsPrimitives} Graphics primitives instance
     */
    getGraphicsPrimitives() {
        return this.graphicsPrimitives;
    }

    /**
     * Get character ROM for direct access
     * @returns {CharacterROM} Character ROM instance
     */
    getCharacterROM() {
        return this.characterRom;
    }

    /**
     * Performance optimization - reduce rendering frequency if needed
     * @param {boolean} enabled - Whether to enable performance mode
     */
    setPerformanceMode(enabled) {
        this.performanceMode = enabled;
        if (enabled) {
            this.frameTime = 1000 / 30; // 30 FPS for better performance
        } else {
            this.frameTime = 1000 / 60; // 60 FPS for smooth display
        }
    }
}

module.exports = GraphicsProcessingUnit;