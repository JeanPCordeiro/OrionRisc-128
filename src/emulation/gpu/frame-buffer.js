/**
 * Frame Buffer - 640x200 pixel memory management for OrionRisc-128 GPU
 *
 * Manages the 640x200 monochrome frame buffer with efficient memory layout,
 * double buffering support, and memory-mapped I/O interface.
 */

class FrameBuffer {
    constructor() {
        this.FRAME_WIDTH = 640;
        this.FRAME_HEIGHT = 200;
        this.FRAME_SIZE = this.FRAME_WIDTH * this.FRAME_HEIGHT;

        // Frame buffer memory - 640x200 pixels (1 bit per pixel)
        // Using 8 pixels per byte for memory efficiency
        this.BYTES_PER_ROW = Math.ceil(this.FRAME_WIDTH / 8);
        this.FRAME_BUFFER_SIZE = this.BYTES_PER_ROW * this.FRAME_HEIGHT;

        // Double buffering for smooth updates
        this.frontBuffer = new Uint8Array(this.FRAME_BUFFER_SIZE);
        this.backBuffer = new Uint8Array(this.FRAME_BUFFER_SIZE);
        this.activeBuffer = this.backBuffer;

        // Memory-mapped I/O registers
        this.registers = {
            // Control register
            GPU_CONTROL: 0x0000,
            // Status register
            GPU_STATUS: 0x0004,
            // Frame buffer start address
            FRAME_BUFFER_START: 0x0008,
            // Frame buffer end address
            FRAME_BUFFER_END: 0x000C,
            // Current scan line
            SCAN_LINE: 0x0010,
            // Display mode (0 = graphics, 1 = text)
            DISPLAY_MODE: 0x0014
        };

        // GPU states
        this.displayMode = 0; // 0 = graphics, 1 = text
        this.currentScanLine = 0;
        this.verticalBlank = false;

        // Initialize frame buffer
        this.clear();
    }

    /**
     * Clear the frame buffer to black
     */
    clear() {
        this.frontBuffer.fill(0);
        this.backBuffer.fill(0);
    }

    /**
     * Set a pixel in the frame buffer
     * @param {number} x - X coordinate (0-639)
     * @param {number} y - Y coordinate (0-199)
     * @param {boolean} value - Pixel value (true = lit, false = dark)
     */
    setPixel(x, y, value) {
        if (x < 0 || x >= this.FRAME_WIDTH || y < 0 || y >= this.FRAME_HEIGHT) {
            return; // Out of bounds
        }

        const byteIndex = y * this.BYTES_PER_ROW + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8); // MSB first

        if (value) {
            this.activeBuffer[byteIndex] |= (1 << bitIndex);
        } else {
            this.activeBuffer[byteIndex] &= ~(1 << bitIndex);
        }
    }

    /**
     * Get a pixel value from the frame buffer
     * @param {number} x - X coordinate (0-639)
     * @param {number} y - Y coordinate (0-199)
     * @returns {boolean} Pixel value (true = lit, false = dark)
     */
    getPixel(x, y) {
        if (x < 0 || x >= this.FRAME_WIDTH || y < 0 || y >= this.FRAME_HEIGHT) {
            return false; // Out of bounds
        }

        const byteIndex = y * this.BYTES_PER_ROW + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);

        return (this.activeBuffer[byteIndex] & (1 << bitIndex)) !== 0;
    }

    /**
     * Draw a horizontal line
     * @param {number} x1 - Start X coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} value - Line value
     */
    drawHorizontalLine(x1, x2, y, value) {
        const startX = Math.max(0, Math.min(x1, x2));
        const endX = Math.min(this.FRAME_WIDTH - 1, Math.max(x1, x2));

        for (let x = startX; x <= endX; x++) {
            this.setPixel(x, y, value);
        }
    }

    /**
     * Draw a vertical line
     * @param {number} x - X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} y2 - End Y coordinate
     * @param {boolean} value - Line value
     */
    drawVerticalLine(x, y1, y2, value) {
        const startY = Math.max(0, Math.min(y1, y2));
        const endY = Math.min(this.FRAME_HEIGHT - 1, Math.max(y1, y2));

        for (let y = startY; y <= endY; y++) {
            this.setPixel(x, y, value);
        }
    }

    /**
     * Fill a rectangle
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {boolean} value - Fill value
     */
    fillRectangle(x, y, width, height, value) {
        const startX = Math.max(0, x);
        const startY = Math.max(0, y);
        const endX = Math.min(this.FRAME_WIDTH - 1, x + width - 1);
        const endY = Math.min(this.FRAME_HEIGHT - 1, y + height - 1);

        for (let row = startY; row <= endY; row++) {
            for (let col = startX; col <= endX; col++) {
                this.setPixel(col, row, value);
            }
        }
    }

    /**
     * Copy a rectangular region from source to destination
     * @param {number} srcX - Source X coordinate
     * @param {number} srcY - Source Y coordinate
     * @param {number} destX - Destination X coordinate
     * @param {number} destY - Destination Y coordinate
     * @param {number} width - Region width
     * @param {number} height - Region height
     */
    copyRegion(srcX, srcY, destX, destY, width, height) {
        // For simplicity, implement as pixel-by-pixel copy
        // In a real implementation, this would use optimized memory operations
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPixelX = srcX + x;
                const srcPixelY = srcY + y;
                const destPixelX = destX + x;
                const destPixelY = destY + y;

                if (srcPixelX >= 0 && srcPixelX < this.FRAME_WIDTH &&
                    srcPixelY >= 0 && srcPixelY < this.FRAME_HEIGHT &&
                    destPixelX >= 0 && destPixelX < this.FRAME_WIDTH &&
                    destPixelY >= 0 && destPixelY < this.FRAME_HEIGHT) {

                    const pixelValue = this.getPixel(srcPixelX, srcPixelY);
                    this.setPixel(destPixelX, destPixelY, pixelValue);
                }
            }
        }
    }

    /**
     * Scroll the frame buffer up by specified number of lines
     * @param {number} lines - Number of lines to scroll
     */
    scrollUp(lines) {
        const scrollBytes = lines * this.BYTES_PER_ROW;

        // Move data up in the buffer
        for (let i = 0; i < this.FRAME_BUFFER_SIZE - scrollBytes; i++) {
            this.activeBuffer[i] = this.activeBuffer[i + scrollBytes];
        }

        // Clear the bottom lines
        for (let i = this.FRAME_BUFFER_SIZE - scrollBytes; i < this.FRAME_BUFFER_SIZE; i++) {
            this.activeBuffer[i] = 0;
        }
    }

    /**
     * Scroll the frame buffer down by specified number of lines
     * @param {number} lines - Number of lines to scroll
     */
    scrollDown(lines) {
        const scrollBytes = lines * this.BYTES_PER_ROW;

        // Move data down in the buffer
        for (let i = this.FRAME_BUFFER_SIZE - 1; i >= scrollBytes; i--) {
            this.activeBuffer[i] = this.activeBuffer[i - scrollBytes];
        }

        // Clear the top lines
        for (let i = 0; i < scrollBytes; i++) {
            this.activeBuffer[i] = 0;
        }
    }

    /**
     * Swap front and back buffers for double buffering
     */
    swapBuffers() {
        // Copy back buffer to front buffer
        this.frontBuffer.set(this.backBuffer);

        // Update active buffer pointer
        this.activeBuffer = this.backBuffer;
    }

    /**
     * Get the current front buffer for display
     * @returns {Uint8Array} Front buffer data
     */
    getFrontBuffer() {
        return this.frontBuffer;
    }

    /**
     * Get the current back buffer for rendering
     * @returns {Uint8Array} Back buffer data
     */
    getBackBuffer() {
        return this.backBuffer;
    }

    /**
     * Set the active buffer (for rendering operations)
     * @param {Uint8Array} buffer - Buffer to set as active
     */
    setActiveBuffer(buffer) {
        this.activeBuffer = buffer;
    }

    /**
     * Read from memory-mapped I/O register
     * @param {number} address - Register address
     * @returns {number} Register value
     */
    readRegister(address) {
        switch (address) {
            case this.registers.GPU_CONTROL:
                return (this.displayMode << 1) | (this.verticalBlank ? 1 : 0);
            case this.registers.GPU_STATUS:
                return (this.currentScanLine << 8) | (this.verticalBlank ? 0x01 : 0x00);
            case this.registers.FRAME_BUFFER_START:
                return 0x0000; // Frame buffer starts at address 0 in GPU memory space
            case this.registers.FRAME_BUFFER_END:
                return this.FRAME_BUFFER_SIZE - 1;
            case this.registers.SCAN_LINE:
                return this.currentScanLine;
            case this.registers.DISPLAY_MODE:
                return this.displayMode;
            default:
                return 0;
        }
    }

    /**
     * Write to memory-mapped I/O register
     * @param {number} address - Register address
     * @param {number} value - Value to write
     */
    writeRegister(address, value) {
        switch (address) {
            case this.registers.GPU_CONTROL:
                this.displayMode = (value >> 1) & 0x01;
                this.verticalBlank = (value & 0x01) !== 0;
                break;
            case this.registers.DISPLAY_MODE:
                this.displayMode = value & 0x01;
                break;
        }
    }

    /**
     * Update scan line (called by GPU during vertical refresh)
     * @param {number} scanLine - Current scan line (0-199)
     */
    updateScanLine(scanLine) {
        this.currentScanLine = scanLine;
        this.verticalBlank = (scanLine >= this.FRAME_HEIGHT);
    }

    /**
     * Get frame buffer dimensions
     * @returns {Object} Width and height
     */
    getDimensions() {
        return {
            width: this.FRAME_WIDTH,
            height: this.FRAME_HEIGHT,
            bytesPerRow: this.BYTES_PER_ROW,
            totalSize: this.FRAME_BUFFER_SIZE
        };
    }

    /**
     * Get memory layout information
     * @returns {Object} Memory layout details
     */
    getMemoryLayout() {
        return {
            width: this.FRAME_WIDTH,
            height: this.FRAME_HEIGHT,
            bytesPerRow: this.BYTES_PER_ROW,
            totalBytes: this.FRAME_BUFFER_SIZE,
            bitsPerPixel: 1,
            pixelsPerByte: 8
        };
    }
}

module.exports = FrameBuffer;