/**
 * OrionRisc-128 Graphics Subsystem
 *
 * Provides 640x200 monochrome graphics with 80x25 text mode support.
 * Designed for browser-based rendering using HTML5 Canvas.
 */

class Graphics {
    constructor(canvasId = 'orion-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            // Create canvas if it doesn't exist
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.width = 640;
            this.canvas.height = 200;
            document.body.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = 640;
        this.height = 200;

        // Graphics modes
        this.MODE_GRAPHICS = 0;  // Pixel graphics mode
        this.MODE_TEXT = 1;      // Text mode (80x25)

        this.currentMode = this.MODE_GRAPHICS;

        // Text mode properties
        this.fontWidth = 8;      // Character width in pixels
        this.fontHeight = 8;     // Character height in pixels
        this.cols = 80;          // Text columns
        this.rows = 25;          // Text rows

        // Video memory (64KB for graphics + text)
        this.videoMemory = new Uint8Array(0x10000);

        // Character set (simplified ASCII)
        this.charset = this.createCharset();

        // Color palette (monochrome - black and white)
        this.palette = {
            0: '#000000',  // Black
            1: '#FFFFFF'   // White
        };

        // Framebuffer for pixel graphics
        this.framebuffer = new Uint8Array(this.width * this.height);

        // Text buffer for text mode
        this.textBuffer = new Array(this.rows);
        this.colorBuffer = new Array(this.rows);
        for (let i = 0; i < this.rows; i++) {
            this.textBuffer[i] = new Uint8Array(this.cols);
            this.colorBuffer[i] = new Uint8Array(this.cols);
        }

        // Cursor position
        this.cursorX = 0;
        this.cursorY = 0;

        // Initialize
        this.clear();
        this.render();
    }

    /**
     * Clear graphics screen
     */
    clear() {
        this.framebuffer.fill(0);
        this.clearTextMode();
        this.render();
    }

    /**
     * Clear text mode buffers
     */
    clearTextMode() {
        for (let y = 0; y < this.rows; y++) {
            this.textBuffer[y].fill(0x20);  // Space character
            this.colorBuffer[y].fill(0x07); // White on black
        }
        this.cursorX = 0;
        this.cursorY = 0;
    }

    /**
     * Set graphics mode
     * @param {number} mode - Graphics mode (MODE_GRAPHICS or MODE_TEXT)
     */
    setMode(mode) {
        if (mode === this.MODE_GRAPHICS || mode === this.MODE_TEXT) {
            this.currentMode = mode;
            this.render();
        }
    }

    /**
     * Plot a pixel on the graphics screen
     * @param {number} x - X coordinate (0-639)
     * @param {number} y - Y coordinate (0-199)
     * @param {number} color - Color (0 or 1)
     */
    plotPixel(x, y, color) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const index = y * this.width + x;
            this.framebuffer[index] = color & 1;
        }
    }

    /**
     * Get pixel color
     * @param {number} x - X coordinate (0-639)
     * @param {number} y - Y coordinate (0-199)
     * @returns {number} Pixel color (0 or 1)
     */
    getPixel(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const index = y * this.width + x;
            return this.framebuffer[index];
        }
        return 0;
    }

    /**
     * Draw a line using Bresenham's algorithm
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {number} color - Line color
     */
    drawLine(x1, y1, x2, y2, color) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = (x1 < x2) ? 1 : -1;
        const sy = (y1 < y2) ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (true) {
            this.plotPixel(x, y, color);

            if (x === x2 && y === y2) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    /**
     * Draw a rectangle
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} color - Fill color
     * @param {boolean} fill - Whether to fill the rectangle
     */
    drawRect(x, y, width, height, color, fill = false) {
        if (fill) {
            for (let py = y; py < y + height && py < this.height; py++) {
                for (let px = x; px < x + width && px < this.width; px++) {
                    this.plotPixel(px, py, color);
                }
            }
        } else {
            // Draw outline
            this.drawLine(x, y, x + width - 1, y, color);                    // Top
            this.drawLine(x + width - 1, y, x + width - 1, y + height - 1, color); // Right
            this.drawLine(x + width - 1, y + height - 1, x, y + height - 1, color); // Bottom
            this.drawLine(x, y + height - 1, x, y, color);                  // Left
        }
    }

    /**
     * Draw a circle using Bresenham's algorithm
     * @param {number} cx - Center X coordinate
     * @param {number} cy - Center Y coordinate
     * @param {number} radius - Circle radius
     * @param {number} color - Circle color
     */
    drawCircle(cx, cy, radius, color) {
        let x = 0;
        let y = radius;
        let d = 3 - 2 * radius;

        while (x <= y) {
            this.plotPixel(cx + x, cy + y, color);
            this.plotPixel(cx - x, cy + y, color);
            this.plotPixel(cx + x, cy - y, color);
            this.plotPixel(cx - x, cy - y, color);
            this.plotPixel(cx + y, cy + x, color);
            this.plotPixel(cx - y, cy + x, color);
            this.plotPixel(cx + y, cy - x, color);
            this.plotPixel(cx - y, cy - x, color);

            x++;
            if (d < 0) {
                d = d + 4 * x + 6;
            } else {
                d = d + 4 * (x - y) + 10;
                y--;
            }
        }
    }

    /**
     * Text mode operations
     */

    /**
     * Write a character at cursor position
     * @param {number} char - ASCII character code
     * @param {number} color - Color attribute (foreground/background)
     */
    writeChar(char, color = 0x07) {
        if (this.cursorX >= this.cols) {
            this.cursorX = 0;
            this.cursorY++;
        }

        if (this.cursorY >= this.rows) {
            this.scrollText();
            this.cursorY = this.rows - 1;
        }

        this.textBuffer[this.cursorY][this.cursorX] = char;
        this.colorBuffer[this.cursorY][this.cursorX] = color;

        this.cursorX++;
    }

    /**
     * Write a string at cursor position
     * @param {string} str - String to write
     * @param {number} color - Color attribute
     */
    writeString(str, color = 0x07) {
        for (let i = 0; i < str.length; i++) {
            this.writeChar(str.charCodeAt(i), color);
        }
    }

    /**
     * Set cursor position
     * @param {number} x - Column (0-79)
     * @param {number} y - Row (0-24)
     */
    setCursor(x, y) {
        this.cursorX = Math.max(0, Math.min(this.cols - 1, x));
        this.cursorY = Math.max(0, Math.min(this.rows - 1, y));
    }

    /**
     * Get cursor position
     * @returns {object} Cursor position {x, y}
     */
    getCursor() {
        return { x: this.cursorX, y: this.cursorY };
    }

    /**
     * Scroll text up by one line
     */
    scrollText() {
        // Move all lines up
        for (let y = 1; y < this.rows; y++) {
            this.textBuffer[y - 1] = this.textBuffer[y].slice();
            this.colorBuffer[y - 1] = this.colorBuffer[y].slice();
        }

        // Clear bottom line
        this.textBuffer[this.rows - 1].fill(0x20);
        this.colorBuffer[this.rows - 1].fill(0x07);
    }

    /**
     * Clear a rectangular area in text mode
     * @param {number} x - Start column
     * @param {number} y - Start row
     * @param {number} width - Width in columns
     * @param {number} height - Height in rows
     */
    clearTextArea(x, y, width, height) {
        const endX = Math.min(this.cols, x + width);
        const endY = Math.min(this.rows, y + height);

        for (let row = y; row < endY; row++) {
            for (let col = x; col < endX; col++) {
                this.textBuffer[row][col] = 0x20;  // Space
                this.colorBuffer[row][col] = 0x07; // White on black
            }
        }
    }

    /**
     * Create a simple 8x8 character set
     * @returns {object} Character bitmap data
     */
    createCharset() {
        const charset = {};

        // Space character (empty)
        charset[0x20] = new Uint8Array(8);

        // Basic ASCII characters (simplified)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

        for (let i = 0; i < chars.length; i++) {
            charset[0x41 + i] = this.createCharBitmap(chars[i]);
        }

        // Default bitmap for unknown characters
        charset['default'] = new Uint8Array(8).fill(0xFF);

        return charset;
    }

    /**
     * Create a simple bitmap for a character
     * @param {string} char - Character to create bitmap for
     * @returns {Uint8Array} 8x8 bitmap
     */
    createCharBitmap(char) {
        // Simple pattern generation based on character code
        const bitmap = new Uint8Array(8);
        const code = char.charCodeAt(0);

        for (let y = 0; y < 8; y++) {
            let pattern = 0;

            // Generate a simple pattern based on character and row
            for (let x = 0; x < 8; x++) {
                const bit = ((code * (y + 1) + x) * 7) % 13 > 6 ? 1 : 0;
                pattern = (pattern << 1) | bit;
            }

            bitmap[y] = pattern;
        }

        return bitmap;
    }

    /**
     * Get character bitmap
     * @param {number} charCode - Character code
     * @returns {Uint8Array} Character bitmap
     */
    getCharBitmap(charCode) {
        return this.charset[charCode] || this.charset['default'];
    }

    /**
     * Render the current display
     */
    render() {
        if (this.currentMode === this.MODE_GRAPHICS) {
            this.renderGraphics();
        } else {
            this.renderText();
        }
    }

    /**
     * Render graphics mode
     */
    renderGraphics() {
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const index = y * this.width + x;
                const pixelIndex = (y * this.width + x) * 4;

                const color = this.framebuffer[index];
                const rgb = this.palette[color];

                data[pixelIndex] = color * 255;     // Red
                data[pixelIndex + 1] = color * 255; // Green
                data[pixelIndex + 2] = color * 255; // Blue
                data[pixelIndex + 3] = 255;         // Alpha
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Render text mode
     */
    renderText() {
        // Clear canvas
        this.ctx.fillStyle = this.palette[0];
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Render text characters
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const charCode = this.textBuffer[y][x];
                const colorAttr = this.colorBuffer[y][x];
                const fgColor = colorAttr & 0x0F;
                const bgColor = (colorAttr >> 4) & 0x0F;

                this.renderChar(x, y, charCode, fgColor, bgColor);
            }
        }

        // Render cursor
        if (Math.floor(Date.now() / 500) % 2) { // Blink every 500ms
            this.renderCursor();
        }
    }

    /**
     * Render a single character
     * @param {number} x - Column
     * @param {number} y - Row
     * @param {number} charCode - Character code
     * @param {number} fgColor - Foreground color
     * @param {number} bgColor - Background color
     */
    renderChar(x, y, charCode, fgColor, bgColor) {
        const bitmap = this.getCharBitmap(charCode);
        const px = x * this.fontWidth;
        const py = y * this.fontHeight;

        // Draw background
        this.ctx.fillStyle = this.palette[bgColor & 1];
        this.ctx.fillRect(px, py, this.fontWidth, this.fontHeight);

        // Draw character
        this.ctx.fillStyle = this.palette[fgColor & 1];

        for (let cy = 0; cy < this.fontHeight; cy++) {
            for (let cx = 0; cx < this.fontWidth; cx++) {
                const bit = (bitmap[cy] >> (7 - cx)) & 1;
                if (bit) {
                    this.ctx.fillRect(px + cx, py + cy, 1, 1);
                }
            }
        }
    }

    /**
     * Render cursor
     */
    renderCursor() {
        const px = this.cursorX * this.fontWidth;
        const py = this.cursorY * this.fontHeight;

        this.ctx.fillStyle = this.palette[1];
        this.ctx.fillRect(px, py + this.fontHeight - 1, this.fontWidth, 1);
    }

    /**
     * I/O interface for processor
     */

    /**
     * Write to graphics I/O register
     * @param {number} reg - Register number
     * @param {number} value - Value to write
     */
    writeRegister(reg, value) {
        switch (reg) {
            case 0x00: // Graphics mode control
                this.setMode(value & 1);
                break;

            case 0x01: // Cursor X position
                this.cursorX = value % this.cols;
                break;

            case 0x02: // Cursor Y position
                this.cursorY = value % this.rows;
                break;

            case 0x03: // Character write
                this.writeChar(value & 0xFF);
                break;

            case 0x10: // Pixel X (low byte)
                this.pixelX = value;
                break;

            case 0x11: // Pixel X (high byte) + Y
                this.pixelX = (this.pixelX & 0xFF) | ((value & 0xF) << 8);
                this.pixelY = (value >> 4) & 0xFF;
                break;

            case 0x12: // Pixel color and plot
                const color = value & 1;
                this.plotPixel(this.pixelX, this.pixelY, color);
                break;

            default:
                // Unknown register
                break;
        }
    }

    /**
     * Read from graphics I/O register
     * @param {number} reg - Register number
     * @returns {number} Register value
     */
    readRegister(reg) {
        switch (reg) {
            case 0x00: // Current mode
                return this.currentMode;

            case 0x01: // Cursor X
                return this.cursorX;

            case 0x02: // Cursor Y
                return this.cursorY;

            case 0x10: // Pixel X (low byte)
                return this.pixelX & 0xFF;

            case 0x11: // Pixel X (high byte) and Y
                return ((this.pixelX >> 8) & 0xF) | ((this.pixelY & 0xFF) << 4);

            default:
                return 0;
        }
    }

    /**
     * Get display dimensions
     * @returns {object} Width and height
     */
    getDimensions() {
        return { width: this.width, height: this.height };
    }

    /**
     * Resize the canvas (for different scaling)
     * @param {number} scale - Scale factor
     */
    resize(scale = 1) {
        this.canvas.width = this.width * scale;
        this.canvas.height = this.height * scale;
        this.ctx.imageSmoothingEnabled = false;
        this.render();
    }

    /**
     * Take a screenshot of current display
     * @returns {string} Data URL of screenshot
     */
    screenshot() {
        return this.canvas.toDataURL('image/png');
    }
}

module.exports = Graphics;