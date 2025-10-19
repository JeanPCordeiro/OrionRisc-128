/**
 * Text Mode Engine - 80x25 character display emulation for OrionRisc-128 GPU
 *
 * Manages character and attribute memory for 80x25 text mode display,
 * handles text scrolling, cursor positioning, and color attributes.
 */

class TextModeEngine {
    constructor(frameBuffer, characterRom) {
        this.frameBuffer = frameBuffer;
        this.characterRom = characterRom;

        // Text mode dimensions
        this.COLS = 80;
        this.ROWS = 25;
        this.CHAR_WIDTH = 8;
        this.CHAR_HEIGHT = 8;

        // Screen dimensions in pixels
        this.SCREEN_WIDTH = this.COLS * this.CHAR_WIDTH;
        this.SCREEN_HEIGHT = this.ROWS * this.CHAR_HEIGHT;

        // Character memory - stores character codes for each position
        this.characterMemory = new Uint8Array(this.COLS * this.ROWS);

        // Attribute memory - stores color and style attributes
        this.attributeMemory = new Uint8Array(this.COLS * this.ROWS);

        // Cursor state
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorVisible = true;
        this.cursorBlink = true;

        // Text mode colors (monochrome - true = lit, false = dark)
        this.colors = {
            BLACK: false,
            WHITE: true,
            AMBER: true,  // Can be treated as white in monochrome
            GREEN: true   // Can be treated as white in monochrome
        };

        // Default color palette
        this.foregroundColor = this.colors.WHITE;
        this.backgroundColor = this.colors.BLACK;

        // Scrolling region
        this.scrollTop = 0;
        this.scrollBottom = this.ROWS - 1;

        // Tab stops (every 8 columns)
        this.tabStops = new Array(this.COLS).fill(false);
        for (let i = 0; i < this.COLS; i += 8) {
            this.tabStops[i] = true;
        }

        // Initialize with empty screen
        this.clear();
    }

    /**
     * Clear the entire screen
     * @param {number} charCode - Character to fill with (default: space)
     * @param {number} attributes - Attributes to fill with (default: normal)
     */
    clear(charCode = 32, attributes = 0) {
        this.characterMemory.fill(charCode);
        this.attributeMemory.fill(attributes);
        this.cursorX = 0;
        this.cursorY = 0;
    }

    /**
     * Clear a rectangular region
     * @param {number} startX - Start column
     * @param {number} startY - Start row
     * @param {number} endX - End column
     * @param {number} endY - End row
     * @param {number} charCode - Character to fill with
     * @param {number} attributes - Attributes to fill with
     */
    clearRegion(startX, startY, endX, endY, charCode = 32, attributes = 0) {
        const startCol = Math.max(0, Math.min(startX, this.COLS - 1));
        const startRow = Math.max(0, Math.min(startY, this.ROWS - 1));
        const endCol = Math.max(0, Math.min(endX, this.COLS - 1));
        const endRow = Math.max(0, Math.min(endY, this.ROWS - 1));

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const index = row * this.COLS + col;
                this.characterMemory[index] = charCode;
                this.attributeMemory[index] = attributes;
            }
        }
    }

    /**
     * Write a character at current cursor position
     * @param {number} charCode - Character code to write
     * @param {number} attributes - Character attributes
     */
    writeCharacter(charCode, attributes = 0) {
        if (this.cursorX >= this.COLS) {
            this.cursorX = 0;
            this.cursorY++;
        }

        if (this.cursorY >= this.ROWS) {
            this.scrollUp();
            this.cursorY = this.ROWS - 1;
        }

        const index = this.cursorY * this.COLS + this.cursorX;
        this.characterMemory[index] = charCode;
        this.attributeMemory[index] = attributes;

        this.cursorX++;
    }

    /**
     * Write a string of characters
     * @param {string} text - Text to write
     * @param {number} attributes - Character attributes
     */
    writeString(text, attributes = 0) {
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            this.writeCharacter(charCode, attributes);
        }
    }

    /**
     * Write a character with automatic handling of control characters
     * @param {number} charCode - Character code to write
     * @param {number} attributes - Character attributes
     */
    putCharacter(charCode, attributes = 0) {
        switch (charCode) {
            case 8: // Backspace
                this.cursorLeft();
                this.writeCharacter(32, attributes); // Write space
                this.cursorLeft();
                break;

            case 9: // Tab
                this.tab();
                break;

            case 10: // Line feed
                this.lineFeed();
                break;

            case 13: // Carriage return
                this.carriageReturn();
                break;

            case 12: // Form feed (clear screen)
                this.clear();
                break;

            default:
                if (charCode >= 32) { // Printable character
                    this.writeCharacter(charCode, attributes);
                }
                break;
        }
    }

    /**
     * Move cursor left
     * @param {number} count - Number of positions to move
     */
    cursorLeft(count = 1) {
        this.cursorX = Math.max(0, this.cursorX - count);
    }

    /**
     * Move cursor right
     * @param {number} count - Number of positions to move
     */
    cursorRight(count = 1) {
        this.cursorX = Math.min(this.COLS - 1, this.cursorX + count);
    }

    /**
     * Move cursor up
     * @param {number} count - Number of positions to move
     */
    cursorUp(count = 1) {
        this.cursorY = Math.max(0, this.cursorY - count);
    }

    /**
     * Move cursor down
     * @param {number} count - Number of positions to move
     */
    cursorDown(count = 1) {
        this.cursorY = Math.min(this.ROWS - 1, this.cursorY + count);
    }

    /**
     * Set cursor position
     * @param {number} x - Column position
     * @param {number} y - Row position
     */
    setCursorPosition(x, y) {
        this.cursorX = Math.max(0, Math.min(this.COLS - 1, x));
        this.cursorY = Math.max(0, Math.min(this.ROWS - 1, y));
    }

    /**
     * Get cursor position
     * @returns {Object} Cursor position {x, y}
     */
    getCursorPosition() {
        return { x: this.cursorX, y: this.cursorY };
    }

    /**
     * Move to tab stop
     */
    tab() {
        let newX = this.cursorX + 1;
        while (newX < this.COLS && !this.tabStops[newX]) {
            newX++;
        }
        this.cursorX = Math.min(this.COLS - 1, newX);
    }

    /**
     * Carriage return (move to start of line)
     */
    carriageReturn() {
        this.cursorX = 0;
    }

    /**
     * Line feed (move down one line)
     */
    lineFeed() {
        this.cursorY++;
        if (this.cursorY > this.scrollBottom) {
            this.scrollUp();
            this.cursorY = this.scrollBottom;
        }
    }

    /**
     * Scroll the display up by one or more lines
     * @param {number} lines - Number of lines to scroll (default: 1)
     */
    scrollUp(lines = 1) {
        const startRow = this.scrollTop;
        const endRow = this.scrollBottom - lines + 1;

        // Move character and attribute data up
        for (let row = startRow; row < endRow; row++) {
            const srcIndex = (row + lines) * this.COLS;
            const destIndex = row * this.COLS;

            for (let col = 0; col < this.COLS; col++) {
                this.characterMemory[destIndex + col] = this.characterMemory[srcIndex + col];
                this.attributeMemory[destIndex + col] = this.attributeMemory[srcIndex + col];
            }
        }

        // Clear the bottom lines
        const clearStartRow = this.scrollBottom - lines + 1;
        for (let row = clearStartRow; row <= this.scrollBottom; row++) {
            const index = row * this.COLS;
            this.characterMemory.fill(32, index, index + this.COLS); // Space
            this.attributeMemory.fill(0, index, index + this.COLS);  // Normal attributes
        }
    }

    /**
     * Scroll the display down by one or more lines
     * @param {number} lines - Number of lines to scroll (default: 1)
     */
    scrollDown(lines = 1) {
        const startRow = this.scrollBottom;
        const endRow = this.scrollTop + lines - 1;

        // Move character and attribute data down
        for (let row = startRow; row > endRow; row--) {
            const srcIndex = (row - lines) * this.COLS;
            const destIndex = row * this.COLS;

            for (let col = 0; col < this.COLS; col++) {
                this.characterMemory[destIndex + col] = this.characterMemory[srcIndex + col];
                this.attributeMemory[destIndex + col] = this.attributeMemory[srcIndex + col];
            }
        }

        // Clear the top lines
        const clearEndRow = this.scrollTop + lines - 1;
        for (let row = this.scrollTop; row <= clearEndRow; row++) {
            const index = row * this.COLS;
            this.characterMemory.fill(32, index, index + this.COLS); // Space
            this.attributeMemory.fill(0, index, index + this.COLS);  // Normal attributes
        }
    }

    /**
     * Set scrolling region
     * @param {number} top - Top row of scrolling region
     * @param {number} bottom - Bottom row of scrolling region
     */
    setScrollRegion(top, bottom) {
        this.scrollTop = Math.max(0, Math.min(top, this.ROWS - 1));
        this.scrollBottom = Math.max(this.scrollTop, Math.min(bottom, this.ROWS - 1));
    }

    /**
     * Insert lines at current cursor position
     * @param {number} lines - Number of lines to insert
     */
    insertLines(lines = 1) {
        const startRow = this.cursorY;
        const endRow = this.scrollBottom - lines + 1;

        // Move lines down
        for (let row = endRow; row >= startRow; row--) {
            const srcIndex = (row - lines) * this.COLS;
            const destIndex = row * this.COLS;

            if (row - lines >= this.scrollTop) {
                for (let col = 0; col < this.COLS; col++) {
                    this.characterMemory[destIndex + col] = this.characterMemory[srcIndex + col];
                    this.attributeMemory[destIndex + col] = this.attributeMemory[srcIndex + col];
                }
            }
        }

        // Clear the inserted lines
        for (let row = startRow; row < startRow + lines && row <= this.scrollBottom; row++) {
            const index = row * this.COLS;
            this.characterMemory.fill(32, index, index + this.COLS);
            this.attributeMemory.fill(0, index, index + this.COLS);
        }
    }

    /**
     * Delete lines at current cursor position
     * @param {number} lines - Number of lines to delete
     */
    deleteLines(lines = 1) {
        const startRow = this.cursorY;
        const endRow = this.scrollBottom - lines + 1;

        // Move lines up
        for (let row = startRow; row < endRow; row++) {
            const srcIndex = (row + lines) * this.COLS;
            const destIndex = row * this.COLS;

            if (row + lines <= this.scrollBottom) {
                for (let col = 0; col < this.COLS; col++) {
                    this.characterMemory[destIndex + col] = this.characterMemory[srcIndex + col];
                    this.attributeMemory[destIndex + col] = this.attributeMemory[srcIndex + col];
                }
            }
        }

        // Clear the bottom lines
        for (let row = this.scrollBottom - lines + 1; row <= this.scrollBottom; row++) {
            const index = row * this.COLS;
            this.characterMemory.fill(32, index, index + this.COLS);
            this.attributeMemory.fill(0, index, index + this.COLS);
        }
    }

    /**
     * Insert characters at current cursor position
     * @param {number} count - Number of characters to insert
     */
    insertCharacters(count = 1) {
        const row = this.cursorY;
        const startCol = this.cursorX;

        // Move characters right
        for (let col = this.COLS - 1; col >= startCol + count; col--) {
            const srcIndex = row * this.COLS + (col - count);
            const destIndex = row * this.COLS + col;

            if (col - count >= 0) {
                this.characterMemory[destIndex] = this.characterMemory[srcIndex];
                this.attributeMemory[destIndex] = this.attributeMemory[srcIndex];
            }
        }

        // Clear the inserted positions
        for (let col = startCol; col < startCol + count && col < this.COLS; col++) {
            const index = row * this.COLS + col;
            this.characterMemory[index] = 32; // Space
            this.attributeMemory[index] = 0;  // Normal attributes
        }
    }

    /**
     * Delete characters at current cursor position
     * @param {number} count - Number of characters to delete
     */
    deleteCharacters(count = 1) {
        const row = this.cursorY;
        const startCol = this.cursorX;

        // Move characters left
        for (let col = startCol; col < this.COLS - count; col++) {
            const srcIndex = row * this.COLS + (col + count);
            const destIndex = row * this.COLS + col;

            this.characterMemory[destIndex] = this.characterMemory[srcIndex];
            this.attributeMemory[destIndex] = this.attributeMemory[srcIndex];
        }

        // Clear the end of the line
        for (let col = this.COLS - count; col < this.COLS; col++) {
            const index = row * this.COLS + col;
            this.characterMemory[index] = 32; // Space
            this.attributeMemory[index] = 0;  // Normal attributes
        }
    }

    /**
     * Render the text mode display to the frame buffer
     */
    render() {
        // Render all characters
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const index = row * this.COLS + col;
                const charCode = this.characterMemory[index];
                const attributes = this.attributeMemory[index];

                // Extract colors from attributes (simplified for monochrome)
                const foreground = (attributes & 0x08) ? this.backgroundColor : this.foregroundColor;
                const background = (attributes & 0x08) ? this.foregroundColor : this.backgroundColor;

                const x = col * this.CHAR_WIDTH;
                const y = row * this.CHAR_HEIGHT;

                this.characterRom.renderCharacter(
                    this.frameBuffer,
                    x, y,
                    charCode,
                    foreground,
                    background,
                    attributes
                );
            }
        }

        // Render cursor if visible
        if (this.cursorVisible && this.cursorBlink) {
            this.renderCursor();
        }
    }

    /**
     * Render the cursor at current position
     */
    renderCursor() {
        const x = this.cursorX * this.CHAR_WIDTH;
        const y = this.cursorY * this.CHAR_HEIGHT;

        // Draw cursor as inverted character cell
        for (let row = 0; row < this.CHAR_HEIGHT; row++) {
            for (let col = 0; col < this.CHAR_WIDTH; col++) {
                const pixelX = x + col;
                const pixelY = y + row;

                // Get current pixel value
                const currentPixel = this.frameBuffer.getPixel(pixelX, pixelY);

                // Invert the pixel
                this.frameBuffer.setPixel(pixelX, pixelY, !currentPixel);
            }
        }
    }

    /**
     * Toggle cursor blink state
     */
    toggleCursorBlink() {
        this.cursorBlink = !this.cursorBlink;
    }

    /**
     * Set cursor visibility
     * @param {boolean} visible - Whether cursor should be visible
     */
    setCursorVisible(visible) {
        this.cursorVisible = visible;
    }

    /**
     * Get character at specified position
     * @param {number} x - Column position
     * @param {number} y - Row position
     * @returns {number} Character code at position
     */
    getCharacterAt(x, y) {
        if (x >= 0 && x < this.COLS && y >= 0 && y < this.ROWS) {
            const index = y * this.COLS + x;
            return this.characterMemory[index];
        }
        return 0;
    }

    /**
     * Get attributes at specified position
     * @param {number} x - Column position
     * @param {number} y - Row position
     * @returns {number} Attributes at position
     */
    getAttributesAt(x, y) {
        if (x >= 0 && x < this.COLS && y >= 0 && y < this.ROWS) {
            const index = y * this.COLS + x;
            return this.attributeMemory[index];
        }
        return 0;
    }

    /**
     * Set character and attributes at specified position
     * @param {number} x - Column position
     * @param {number} y - Row position
     * @param {number} charCode - Character code
     * @param {number} attributes - Character attributes
     */
    setCharacterAt(x, y, charCode, attributes = 0) {
        if (x >= 0 && x < this.COLS && y >= 0 && y < this.ROWS) {
            const index = y * this.COLS + x;
            this.characterMemory[index] = charCode;
            this.attributeMemory[index] = attributes;
        }
    }

    /**
     * Get text mode dimensions
     * @returns {Object} Dimensions object
     */
    getDimensions() {
        return {
            cols: this.COLS,
            rows: this.ROWS,
            charWidth: this.CHAR_WIDTH,
            charHeight: this.CHAR_HEIGHT,
            screenWidth: this.SCREEN_WIDTH,
            screenHeight: this.SCREEN_HEIGHT
        };
    }

    /**
     * Save cursor position
     * @returns {Object} Saved cursor state
     */
    saveCursor() {
        return {
            x: this.cursorX,
            y: this.cursorY,
            visible: this.cursorVisible,
            blink: this.cursorBlink
        };
    }

    /**
     * Restore cursor position
     * @param {Object} state - Saved cursor state
     */
    restoreCursor(state) {
        this.cursorX = state.x || 0;
        this.cursorY = state.y || 0;
        this.cursorVisible = state.visible !== false;
        this.cursorBlink = state.blink !== false;
    }
}

module.exports = TextModeEngine;