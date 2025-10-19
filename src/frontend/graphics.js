/**
 * OrionRisc-128 Graphics Display Component
 * Handles 640x200 monochrome graphics and text rendering
 */

class GraphicsDisplay {
    constructor() {
        this.canvas = document.getElementById('graphics-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Display properties
        this.WIDTH = 640;
        this.HEIGHT = 200;
        this.CHAR_WIDTH = 8;
        this.CHAR_HEIGHT = 8;
        this.COLS = Math.floor(this.WIDTH / this.CHAR_WIDTH);  // 80 columns
        this.ROWS = Math.floor(this.HEIGHT / this.CHAR_HEIGHT); // 25 rows

        // Graphics state
        this.frameBuffer = new Uint8Array(this.WIDTH * this.HEIGHT);
        this.textBuffer = new Array(this.ROWS).fill(null).map(() => new Array(this.COLS).fill(null).map(() => ({
            char: ' ',
            foreground: 1,
            background: 0
        })));

        // Rendering state
        this.isTextMode = true;
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorVisible = true;
        this.cursorBlink = true;

        // Colors (monochrome palette)
        this.colors = [
            '#000000', // Black
            '#00ff88'  // Bright green (amber alternative)
        ];

        this.initializeCanvas();
        this.loadCharacterROM();
        this.setupWebSocketHandlers();
        this.startRenderLoop();
    }

    /**
     * Initialize canvas properties and scaling
     */
    initializeCanvas() {
        // Set up high DPI rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = this.WIDTH * dpr;
        this.canvas.height = this.HEIGHT * dpr;

        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = this.WIDTH + 'px';
        this.canvas.style.height = this.HEIGHT + 'px';

        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;

        // Clear with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    }

    /**
     * Load character ROM for text rendering
     */
    loadCharacterROM() {
        this.charROM = {};

        // Generate simple 8x8 character bitmaps
        for (let i = 0; i < 256; i++) {
            this.charROM[i] = this.generateCharacterBitmap(i);
        }
    }

    /**
     * Generate 8x8 bitmap for a character
     */
    generateCharacterBitmap(charCode) {
        const bitmap = new Uint8Array(8 * 8);

        if (charCode >= 32 && charCode <= 126) {
            // Printable ASCII characters - simplified bitmap generation
            const char = String.fromCharCode(charCode);
            const pattern = this.getCharacterPattern(char);

            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    const bit = pattern[y] & (1 << (7 - x));
                    bitmap[y * 8 + x] = bit ? 1 : 0;
                }
            }
        } else if (charCode === 0) {
            // Null character - all zeros
            bitmap.fill(0);
        } else {
            // Default pattern for other characters
            for (let i = 0; i < 64; i++) {
                bitmap[i] = (i % 2) ^ ((i / 8) % 2) ? 1 : 0;
            }
        }

        return bitmap;
    }

    /**
     * Get character pattern for text rendering
     */
    getCharacterPattern(char) {
        const patterns = {
            ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
            '0': [0x3C, 0x42, 0x42, 0x42, 0x42, 0x42, 0x3C, 0x00],
            '1': [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00],
            '2': [0x3C, 0x42, 0x02, 0x0C, 0x30, 0x40, 0x7E, 0x00],
            '3': [0x3C, 0x42, 0x02, 0x1C, 0x02, 0x42, 0x3C, 0x00],
            '4': [0x04, 0x0C, 0x14, 0x24, 0x44, 0x7E, 0x04, 0x00],
            '5': [0x7E, 0x40, 0x7C, 0x02, 0x02, 0x42, 0x3C, 0x00],
            '6': [0x3C, 0x42, 0x40, 0x7C, 0x42, 0x42, 0x3C, 0x00],
            '7': [0x7E, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x00],
            '8': [0x3C, 0x42, 0x42, 0x3C, 0x42, 0x42, 0x3C, 0x00],
            '9': [0x3C, 0x42, 0x42, 0x3E, 0x02, 0x42, 0x3C, 0x00],
            'A': [0x3C, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x42, 0x00],
            'B': [0x7C, 0x42, 0x42, 0x7C, 0x42, 0x42, 0x7C, 0x00],
            'C': [0x3C, 0x42, 0x40, 0x40, 0x40, 0x42, 0x3C, 0x00],
            'D': [0x7C, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7C, 0x00],
            'E': [0x7E, 0x40, 0x40, 0x7C, 0x40, 0x40, 0x7E, 0x00],
            'F': [0x7E, 0x40, 0x40, 0x7C, 0x40, 0x40, 0x40, 0x00],
        };

        return patterns[char] || patterns['?'] || [0x3C, 0x42, 0x02, 0x04, 0x08, 0x10, 0x10, 0x00];
    }

    /**
     * Set up WebSocket handlers for graphics communication
     */
    setupWebSocketHandlers() {
        if (window.OrionRiscApp && window.OrionRiscApp.components.websocket) {
            const ws = window.OrionRiscApp.components.websocket;

            ws.addMessageHandler('gpu_pixel', (data) => {
                this.setPixel(data.x, data.y, data.color);
            });

            ws.addMessageHandler('gpu_character', (data) => {
                this.drawCharacter(data.x, data.y, data.char, data.foreground, data.background);
            });

            ws.addMessageHandler('gpu_clear', (data) => {
                this.clearScreen(data.color || 0);
            });

            ws.addMessageHandler('gpu_text_mode', (data) => {
                this.setTextMode(data.enabled);
            });

            ws.addMessageHandler('gpu_cursor', (data) => {
                this.setCursor(data.x, data.y, data.visible);
            });

            ws.addMessageHandler('gpu_frame', (data) => {
                this.updateFrameBuffer(data.frameBuffer);
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
        console.log('Graphics display connected to server');
        // Request initial graphics state or perform any connection-time initialization
        const ws = this.getWebSocket();
        if (ws && ws.isConnected) {
            // Request current graphics state from server
            ws.send({
                type: 'gpu_request_state'
            });
        }
    }

    /**
     * Main render loop
     */
    startRenderLoop() {
        const render = () => {
            this.render();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    /**
     * Render the graphics display
     */
    render() {
        if (this.isTextMode) {
            this.renderTextMode();
        } else {
            this.renderGraphicsMode();
        }
    }

    /**
     * Render in text mode
     */
    renderTextMode() {
        this.ctx.fillStyle = this.colors[0];
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Render text buffer
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                const cell = this.textBuffer[y][x];
                if (cell) {
                    this.renderCharacter(x, y, cell.char, cell.foreground, cell.background);
                }
            }
        }

        // Render cursor
        if (this.cursorVisible && this.cursorBlink) {
            this.renderCursor();
        }
    }

    /**
     * Render in graphics mode
     */
    renderGraphicsMode() {
        // Create image data from frame buffer
        const imageData = this.ctx.createImageData(this.WIDTH, this.HEIGHT);
        const data = imageData.data;

        for (let i = 0; i < this.frameBuffer.length; i++) {
            const pixel = this.frameBuffer[i];
            const color = this.colors[pixel] || this.colors[0];

            // Convert hex color to RGB
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            data[i * 4] = r;     // Red
            data[i * 4 + 1] = g; // Green
            data[i * 4 + 2] = b; // Blue
            data[i * 4 + 3] = 255; // Alpha
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Render a single character at position
     */
    renderCharacter(x, y, char, foreground, background) {
        const charCode = char.charCodeAt(0);
        const bitmap = this.charROM[charCode];

        if (!bitmap) return;

        const startX = x * this.CHAR_WIDTH;
        const startY = y * this.CHAR_HEIGHT;

        // Draw background
        if (background !== 0) {
            this.ctx.fillStyle = this.colors[background];
            this.ctx.fillRect(startX, startY, this.CHAR_WIDTH, this.CHAR_HEIGHT);
        }

        // Draw character
        this.ctx.fillStyle = this.colors[foreground];
        for (let py = 0; py < this.CHAR_HEIGHT; py++) {
            for (let px = 0; px < this.CHAR_WIDTH; px++) {
                if (bitmap[py * this.CHAR_WIDTH + px]) {
                    this.ctx.fillRect(startX + px, startY + py, 1, 1);
                }
            }
        }
    }

    /**
     * Render cursor
     */
    renderCursor() {
        const startX = this.cursorX * this.CHAR_WIDTH;
        const startY = this.cursorY * this.CHAR_HEIGHT;

        this.ctx.fillStyle = this.colors[1];
        this.ctx.fillRect(startX, startY + this.CHAR_HEIGHT - 1, this.CHAR_WIDTH, 1);
    }

    /**
     * Set individual pixel
     */
    setPixel(x, y, color) {
        if (x >= 0 && x < this.WIDTH && y >= 0 && y < this.HEIGHT) {
            const index = y * this.WIDTH + x;
            this.frameBuffer[index] = color;

            // Update canvas immediately for this pixel
            this.ctx.fillStyle = this.colors[color] || this.colors[0];
            this.ctx.fillRect(x, y, 1, 1);
        }
    }

    /**
     * Draw character at position
     */
    drawCharacter(x, y, char, foreground = 1, background = 0) {
        if (x >= 0 && x < this.COLS && y >= 0 && y < this.ROWS) {
            this.textBuffer[y][x] = {
                char: char,
                foreground: foreground,
                background: background
            };

            this.renderCharacter(x, y, char, foreground, background);
        }
    }

    /**
     * Clear screen
     */
    clearScreen(color = 0) {
        this.frameBuffer.fill(color);
        this.textBuffer = new Array(this.ROWS).fill(null).map(() => new Array(this.COLS).fill(null).map(() => ({
            char: ' ',
            foreground: 1,
            background: 0
        })));

        this.ctx.fillStyle = this.colors[color];
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    }

    /**
     * Set text mode
     */
    setTextMode(enabled) {
        this.isTextMode = enabled;
        if (enabled) {
            this.renderTextMode();
        }
    }

    /**
     * Set cursor position and visibility
     */
    setCursor(x, y, visible = true) {
        this.cursorX = Math.max(0, Math.min(this.COLS - 1, x));
        this.cursorY = Math.max(0, Math.min(this.ROWS - 1, y));
        this.cursorVisible = visible;
    }

    /**
     * Update entire frame buffer
     */
    updateFrameBuffer(frameBuffer) {
        if (frameBuffer && frameBuffer.length === this.frameBuffer.length) {
            this.frameBuffer = new Uint8Array(frameBuffer);
        }
    }

    /**
     * Draw line (for graphics mode)
     */
    drawLine(x1, y1, x2, y2, color = 1) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = (x1 < x2) ? 1 : -1;
        const sy = (y1 < y2) ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (true) {
            this.setPixel(x, y, color);

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
     * Draw rectangle (for graphics mode)
     */
    drawRectangle(x, y, width, height, color = 1, filled = false) {
        if (filled) {
            for (let py = y; py < y + height && py < this.HEIGHT; py++) {
                for (let px = x; px < x + width && px < this.WIDTH; px++) {
                    this.setPixel(px, py, color);
                }
            }
        } else {
            // Draw outline
            this.drawLine(x, y, x + width, y, color);
            this.drawLine(x + width, y, x + width, y + height, color);
            this.drawLine(x + width, y + height, x, y + height, color);
            this.drawLine(x, y + height, x, y, color);
        }
    }

    /**
     * Draw circle (for graphics mode)
     */
    drawCircle(cx, cy, radius, color = 1, filled = false) {
        let x = radius;
        let y = 0;
        let err = 0;

        while (x >= y) {
            if (filled) {
                this.drawLine(cx - x, cy + y, cx + x, cy + y, color);
                this.drawLine(cx - y, cy + x, cx + y, cy + x, color);
                this.drawLine(cx - x, cy - y, cx + x, cy - y, color);
                this.drawLine(cx - y, cy - x, cx + y, cy - x, color);
            } else {
                this.setPixel(cx + x, cy + y, color);
                this.setPixel(cx - x, cy + y, color);
                this.setPixel(cx + y, cy + x, color);
                this.setPixel(cx - y, cy + x, color);
                this.setPixel(cx + x, cy - y, color);
                this.setPixel(cx - x, cy - y, color);
                this.setPixel(cx + y, cy - x, color);
                this.setPixel(cx - y, cy - x, color);
            }

            y += 1;
            err += 1 + 2 * y;
            if (2 * (err - x) + 1 > 0) {
                x -= 1;
                err += 1 - 2 * x;
            }
        }
    }

    /**
     * Get graphics state for debugging
     */
    getState() {
        return {
            isTextMode: this.isTextMode,
            cursorX: this.cursorX,
            cursorY: this.cursorY,
            cursorVisible: this.cursorVisible,
            frameBufferSize: this.frameBuffer.length,
            textBufferSize: this.textBuffer.length
        };
    }

    /**
     * Take screenshot of current display
     */
    takeScreenshot() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Resize display (for responsive design)
     */
    resize() {
        this.initializeCanvas();
        this.render();
    }
}

// Export for use in other modules
window.GraphicsDisplay = GraphicsDisplay;