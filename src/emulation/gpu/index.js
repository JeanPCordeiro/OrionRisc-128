/**
 * GPU Module - Graphics Processing Unit for OrionRisc-128
 *
 * Exports all GPU components and provides a unified interface
 * for graphics emulation functionality.
 */

const GraphicsProcessingUnit = require('./GraphicsProcessingUnit');
const FrameBuffer = require('./frame-buffer');
const CharacterROM = require('./character-rom');
const GraphicsPrimitives = require('./graphics-primitives');
const TextModeEngine = require('./text-mode');

module.exports = {
    /**
     * Main GPU class - complete graphics processing unit
     */
    GraphicsProcessingUnit,

    /**
     * Individual GPU components for direct access
     */
    FrameBuffer,
    CharacterROM,
    GraphicsPrimitives,
    TextModeEngine,

    /**
     * GPU constants and configuration
     */
    CONSTANTS: {
        // Display dimensions
        FRAME_WIDTH: 640,
        FRAME_HEIGHT: 200,
        SCREEN_COLS: 80,
        SCREEN_ROWS: 25,

        // Character dimensions
        CHAR_WIDTH: 8,
        CHAR_HEIGHT: 8,

        // Memory layout
        BYTES_PER_ROW: 80, // 640 / 8
        FRAME_BUFFER_SIZE: 16000, // 640 * 200 / 8

        // Register addresses
        REGISTERS: {
            GPU_CONTROL: 0x0000,
            GPU_STATUS: 0x0004,
            FRAME_BUFFER_START: 0x0008,
            FRAME_BUFFER_END: 0x000C,
            SCAN_LINE: 0x0010,
            DISPLAY_MODE: 0x0014,
            CURSOR_POSITION: 0x0018,
            TEXT_MODE_CONTROL: 0x001C,
            GRAPHICS_COMMAND: 0x0020,
            COMMAND_PARAM0: 0x0024,
            COMMAND_PARAM1: 0x0028,
            COMMAND_PARAM2: 0x002C,
            COMMAND_PARAM3: 0x0030,
            PALETTE_0: 0x0034,
            PALETTE_1: 0x0038,
            BORDER_COLOR: 0x003C,
            INTERRUPT_CONTROL: 0x0040,
            INTERRUPT_STATUS: 0x0044
        },

        // Graphics commands
        COMMANDS: {
            NO_OP: 0x00,
            CLEAR_SCREEN: 0x01,
            SWAP_BUFFERS: 0x02,
            SET_PIXEL: 0x03,
            DRAW_LINE: 0x04,
            DRAW_RECTANGLE: 0x05,
            FILL_RECTANGLE: 0x06,
            DRAW_CIRCLE: 0x07,
            FILL_CIRCLE: 0x08,
            COPY_REGION: 0x09,
            TEXT_WRITE_CHAR: 0x0A,
            TEXT_SET_CURSOR: 0x0B,
            TEXT_CLEAR_SCREEN: 0x0C,
            TEXT_SCROLL_UP: 0x0D,
            TEXT_SCROLL_DOWN: 0x0E
        },

        // Display modes
        DISPLAY_MODES: {
            GRAPHICS: 0,
            TEXT: 1
        },

        // Character attributes
        ATTRIBUTES: {
            NORMAL: 0x00,
            BOLD: 0x01,
            REVERSE: 0x02,
            UNDERLINE: 0x04,
            BLINK: 0x08
        },

        // Colors (monochrome)
        COLORS: {
            BLACK: false,
            WHITE: true,
            AMBER: true,
            GREEN: true
        },

        // Interrupts
        INTERRUPTS: {
            VERTICAL_BLANK: 0x01,
            HORIZONTAL_BLANK: 0x02,
            COMMAND_COMPLETE: 0x04,
            FRAME_BUFFER_SWAP: 0x08
        }
    },

    /**
     * Create a new GPU instance with default configuration
     * @returns {GraphicsProcessingUnit} New GPU instance
     */
    createGPU() {
        return new GraphicsProcessingUnit();
    },

    /**
     * Create GPU components individually for custom configurations
     * @param {Object} config - Configuration options
     * @returns {Object} GPU components object
     */
    createComponents(config = {}) {
        const frameBuffer = new FrameBuffer();
        const characterRom = new CharacterROM();
        const graphicsPrimitives = new GraphicsPrimitives(frameBuffer);
        const textModeEngine = new TextModeEngine(frameBuffer, characterRom);

        return {
            frameBuffer,
            characterRom,
            graphicsPrimitives,
            textModeEngine,
            gpu: new GraphicsProcessingUnit()
        };
    },

    /**
     * Utility functions for GPU operations
     */
    UTILS: {
        /**
         * Convert pixel coordinates to byte/bit position in frame buffer
         * @param {number} x - X coordinate (0-639)
         * @param {number} y - Y coordinate (0-199)
         * @returns {Object} Byte index and bit mask
         */
        pixelToAddress(x, y) {
            const bytesPerRow = Math.ceil(640 / 8);
            const byteIndex = y * bytesPerRow + Math.floor(x / 8);
            const bitIndex = 7 - (x % 8);
            const bitMask = 1 << bitIndex;

            return {
                byteIndex,
                bitIndex,
                bitMask,
                address: byteIndex
            };
        },

        /**
         * Convert character position to pixel coordinates
         * @param {number} col - Column (0-79)
         * @param {number} row - Row (0-24)
         * @returns {Object} Pixel coordinates
         */
        charToPixel(col, row) {
            return {
                x: col * 8,
                y: row * 8
            };
        },

        /**
         * Convert pixel coordinates to character position
         * @param {number} x - Pixel X coordinate
         * @param {number} y - Pixel Y coordinate
         * @returns {Object} Character coordinates
         */
        pixelToChar(x, y) {
            return {
                col: Math.floor(x / 8),
                row: Math.floor(y / 8)
            };
        },

        /**
         * Validate coordinates are within bounds
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @returns {boolean} True if coordinates are valid
         */
        isValidCoordinate(x, y) {
            return x >= 0 && x < 640 && y >= 0 && y < 200;
        },

        /**
         * Validate character position is within bounds
         * @param {number} col - Column
         * @param {number} row - Row
         * @returns {boolean} True if position is valid
         */
        isValidCharPosition(col, row) {
            return col >= 0 && col < 80 && row >= 0 && row < 25;
        }
    }
};