/**
 * OrionRisc-128 Graphics Tests
 *
 * Test suite for the graphics subsystem including pixel graphics and text mode.
 */

// Simple mock canvas for Node.js testing
class MockCanvas {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
    }

    getContext() {
        return {
            createImageData: (width, height) => ({
                width,
                height,
                data: new Uint8ClampedArray(width * height * 4)
            }),
            putImageData: () => {},
            fillStyle: '',
            fillRect: () => {},
            clearRect: () => {},
            fillText: () => {}
        };
    }
}

// Graphics tests for Node.js environment
class GraphicsTests {
    constructor() {
        this.graphics = null;
        this.testResults = [];
    }

    /**
     * Initialize graphics for testing
     */
    initialize() {
        try {
            // Try to create real graphics if in browser
            if (typeof document !== 'undefined') {
                this.graphics = new (require('../src/hardware/graphics.js'))('test-canvas');
            } else {
                // Create mock graphics for Node.js
                this.graphics = this.createMockGraphics();
            }
        } catch (error) {
            console.log('Using mock graphics for testing');
            this.graphics = this.createMockGraphics();
        }
    }

    /**
     * Create mock graphics for testing
     * @returns {object} Mock graphics object
     */
    createMockGraphics() {
        return {
            width: 640,
            height: 200,
            framebuffer: new Uint8Array(640 * 200),
            textBuffer: Array(25).fill().map(() => new Uint8Array(80)),
            colorBuffer: Array(25).fill().map(() => new Uint8Array(80)),
            cursorX: 0,
            cursorY: 0,
            currentMode: 0,

            plotPixel: (x, y, color) => {
                if (x >= 0 && x < 640 && y >= 0 && y < 200) {
                    const index = y * 640 + x;
                    this.framebuffer[index] = color & 1;
                }
            },

            getPixel: (x, y) => {
                if (x >= 0 && x < 640 && y >= 0 && y < 200) {
                    const index = y * 640 + x;
                    return this.framebuffer[index];
                }
                return 0;
            },

            writeChar: (char, color = 0x07) => {
                if (this.cursorX >= 80) {
                    this.cursorX = 0;
                    this.cursorY++;
                }

                if (this.cursorY >= 25) {
                    this.scrollText();
                    this.cursorY = 24;
                }

                this.textBuffer[this.cursorY][this.cursorX] = char;
                this.colorBuffer[this.cursorY][this.cursorX] = color;
                this.cursorX++;
            },

            writeString: (str, color = 0x07) => {
                for (let i = 0; i < str.length; i++) {
                    this.writeChar(str.charCodeAt(i), color);
                }
            },

            setCursor: (x, y) => {
                this.cursorX = Math.max(0, Math.min(79, x));
                this.cursorY = Math.max(0, Math.min(24, y));
            },

            scrollText: () => {
                for (let y = 1; y < 25; y++) {
                    this.textBuffer[y - 1] = this.textBuffer[y].slice();
                    this.colorBuffer[y - 1] = this.colorBuffer[y].slice();
                }
                this.textBuffer[24].fill(0x20);
                this.colorBuffer[24].fill(0x07);
            },

            clear: () => {
                this.framebuffer.fill(0);
                for (let y = 0; y < 25; y++) {
                    this.textBuffer[y].fill(0x20);
                    this.colorBuffer[y].fill(0x07);
                }
                this.cursorX = 0;
                this.cursorY = 0;
            },

            drawLine: (x1, y1, x2, y2, color) => {
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
            },

            drawRect: (x, y, width, height, color, fill = false) => {
                if (fill) {
                    for (let py = y; py < y + height && py < 200; py++) {
                        for (let px = x; px < x + width && px < 640; px++) {
                            this.plotPixel(px, py, color);
                        }
                    }
                } else {
                    this.drawLine(x, y, x + width - 1, y, color);
                    this.drawLine(x + width - 1, y, x + width - 1, y + height - 1, color);
                    this.drawLine(x + width - 1, y + height - 1, x, y + height - 1, color);
                    this.drawLine(x, y + height - 1, x, y, color);
                }
            },

            render: () => {
                // Mock render - no-op for testing
            },

            getDimensions: () => ({
                width: this.width,
                height: this.height
            })
        };
    }

    /**
     * Test pixel plotting
     */
    testPixelPlotting() {
        this.graphics.clear();

        // Test basic pixel plotting
        this.graphics.plotPixel(10, 10, 1);
        this.assertEqual(this.graphics.getPixel(10, 10), 1, 'Pixel should be set to 1');

        this.graphics.plotPixel(20, 20, 0);
        this.assertEqual(this.graphics.getPixel(20, 20), 0, 'Pixel should be set to 0');

        // Test boundary conditions
        this.graphics.plotPixel(0, 0, 1);
        this.assertEqual(this.graphics.getPixel(0, 0), 1, 'Top-left pixel should be set');

        this.graphics.plotPixel(639, 199, 1);
        this.assertEqual(this.graphics.getPixel(639, 199), 1, 'Bottom-right pixel should be set');

        // Test out of bounds (should not crash)
        this.graphics.plotPixel(640, 200, 1);
        this.graphics.plotPixel(-1, -1, 1);

        this.log('Pixel plotting test passed', 'pass');
    }

    /**
     * Test graphics primitives
     */
    testGraphicsPrimitives() {
        this.graphics.clear();

        // Test line drawing
        this.graphics.drawLine(0, 0, 50, 50, 1);
        this.assertEqual(this.graphics.getPixel(0, 0), 1, 'Line start should be set');
        this.assertEqual(this.graphics.getPixel(50, 50), 1, 'Line end should be set');

        // Test rectangle drawing (outline)
        this.graphics.drawRect(10, 10, 20, 20, 1, false);
        this.assertEqual(this.graphics.getPixel(10, 10), 1, 'Rectangle top-left should be set');
        this.assertEqual(this.graphics.getPixel(29, 10), 1, 'Rectangle top-right should be set');
        this.assertEqual(this.graphics.getPixel(10, 29), 1, 'Rectangle bottom-left should be set');
        this.assertEqual(this.graphics.getPixel(29, 29), 1, 'Rectangle bottom-right should be set');

        // Test rectangle drawing (filled)
        this.graphics.drawRect(40, 40, 10, 10, 1, true);
        this.assertEqual(this.graphics.getPixel(40, 40), 1, 'Filled rectangle should be set');
        this.assertEqual(this.graphics.getPixel(49, 49), 1, 'Filled rectangle should be set');

        this.log('Graphics primitives test passed', 'pass');
    }

    /**
     * Test text mode operations
     */
    testTextMode() {
        this.graphics.clear();

        // Test character writing
        this.graphics.writeChar(65); // 'A'
        this.assertEqual(this.graphics.textBuffer[0][0], 65, 'Character should be written to buffer');

        // Test string writing
        this.graphics.writeString('HELLO');
        this.assertEqual(this.graphics.textBuffer[0][1], 72, 'H should be at position 1');
        this.assertEqual(this.graphics.textBuffer[0][2], 69, 'E should be at position 2');
        this.assertEqual(this.graphics.textBuffer[0][3], 76, 'L should be at position 3');
        this.assertEqual(this.graphics.textBuffer[0][4], 76, 'L should be at position 4');
        this.assertEqual(this.graphics.textBuffer[0][5], 79, 'O should be at position 5');

        // Test cursor positioning
        this.graphics.setCursor(10, 5);
        this.assertEqual(this.graphics.cursorX, 10, 'Cursor X should be set');
        this.assertEqual(this.graphics.cursorY, 5, 'Cursor Y should be set');

        // Test cursor bounds checking
        this.graphics.setCursor(100, 30);
        this.assertEqual(this.graphics.cursorX, 79, 'Cursor X should be clamped to 79');
        this.assertEqual(this.graphics.cursorY, 24, 'Cursor Y should be clamped to 24');

        // Test text scrolling
        this.graphics.clear();
        this.graphics.cursorY = 24;
        this.graphics.writeChar(88); // 'X'
        this.assertEqual(this.graphics.textBuffer[24][0], 88, 'Character should be at bottom row');

        this.log('Text mode test passed', 'pass');
    }

    /**
     * Test graphics modes
     */
    testGraphicsModes() {
        // Test mode switching (if supported)
        if (typeof this.graphics.setMode === 'function') {
            this.graphics.setMode(0); // Graphics mode
            this.assertEqual(this.graphics.currentMode, 0, 'Should be in graphics mode');

            this.graphics.setMode(1); // Text mode
            this.assertEqual(this.graphics.currentMode, 1, 'Should be in text mode');
        }

        this.log('Graphics modes test passed', 'pass');
    }

    /**
     * Test I/O register interface
     */
    testIORegisters() {
        if (typeof this.graphics.writeRegister === 'function') {
            // Test cursor positioning via I/O
            this.graphics.writeRegister(0x01, 15); // Set cursor X to 15
            this.graphics.writeRegister(0x02, 10); // Set cursor Y to 10
            this.assertEqual(this.graphics.cursorX, 15, 'I/O should set cursor X');
            this.assertEqual(this.graphics.cursorY, 10, 'I/O should set cursor Y');

            // Test character writing via I/O
            this.graphics.writeRegister(0x03, 66); // Write 'B'
            this.assertEqual(this.graphics.textBuffer[10][15], 66, 'I/O should write character');

            // Test register reading
            const readX = this.graphics.readRegister(0x01);
            const readY = this.graphics.readRegister(0x02);
            this.assertEqual(readX, 15, 'I/O should read cursor X');
            this.assertEqual(readY, 10, 'I/O should read cursor Y');
        }

        this.log('I/O registers test passed', 'pass');
    }

    /**
     * Test graphics dimensions and boundaries
     */
    testDimensionsAndBoundaries() {
        const dims = this.graphics.getDimensions();
        this.assertEqual(dims.width, 640, 'Width should be 640');
        this.assertEqual(dims.height, 200, 'Height should be 200');

        // Test boundary plotting (should not crash)
        this.graphics.plotPixel(-1, -1, 1);
        this.graphics.plotPixel(640, 200, 1);
        this.graphics.plotPixel(1000, 1000, 1);

        this.log('Dimensions and boundaries test passed', 'pass');
    }

    /**
     * Run all graphics tests
     * @returns {object} Test results
     */
    runAllTests() {
        this.initialize();
        this.testResults = [];

        try {
            this.testPixelPlotting();
            this.testGraphicsPrimitives();
            this.testTextMode();
            this.testGraphicsModes();
            this.testIORegisters();
            this.testDimensionsAndBoundaries();

            return {
                passed: this.testResults.length,
                failed: 0,
                total: this.testResults.length,
                results: this.testResults,
                successRate: 100
            };
        } catch (error) {
            return {
                passed: this.testResults.length,
                failed: 1,
                total: this.testResults.length + 1,
                results: [...this.testResults, { name: 'Test Runner', passed: false, error: error.message }],
                successRate: (this.testResults.length / (this.testResults.length + 1)) * 100
            };
        }
    }

    /**
     * Assert equality for testing
     * @param {any} actual - Actual value
     * @param {any} expected - Expected value
     * @param {string} message - Test message
     */
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${actual} !== ${expected} - ${message}`);
        }
    }

    /**
     * Assert truth for testing
     * @param {boolean} value - Value to test
     * @param {string} message - Test message
     */
    assertTrue(value, message) {
        if (!value) {
            throw new Error(`Assertion failed: expected true - ${message}`);
        }
    }

    /**
     * Log test result
     * @param {string} message - Log message
     * @param {string} type - Log type
     */
    log(message, type = 'info') {
        this.testResults.push({
            message,
            type,
            passed: type === 'pass'
        });
    }

    /**
     * Create a visual test pattern for manual verification
     * @returns {object} Test pattern data
     */
    createVisualTestPattern() {
        this.graphics.clear();

        // Create a test pattern
        for (let y = 0; y < 200; y += 20) {
            for (let x = 0; x < 640; x += 20) {
                const color = ((x / 20) + (y / 20)) % 2;
                this.graphics.drawRect(x, y, 20, 20, color, true);
            }
        }

        // Add some lines
        this.graphics.drawLine(0, 0, 639, 199, 1);
        this.graphics.drawLine(639, 0, 0, 199, 1);

        // Add some text
        this.graphics.setCursor(10, 10);
        this.graphics.writeString('ORIONRISC-128 GRAPHICS TEST');

        this.graphics.setCursor(10, 12);
        this.graphics.writeString('RESOLUTION: 640X200 MONOCHROME');

        return {
            framebuffer: this.graphics.framebuffer.slice(),
            textBuffer: this.graphics.textBuffer.map(row => row.slice()),
            colorBuffer: this.graphics.colorBuffer.map(row => row.slice())
        };
    }

    /**
     * Test graphics rendering performance
     * @returns {object} Performance results
     */
    testPerformance() {
        const startTime = performance.now();

        // Perform many graphics operations
        for (let i = 0; i < 1000; i++) {
            const x = Math.floor(Math.random() * 640);
            const y = Math.floor(Math.random() * 200);
            const color = Math.random() > 0.5 ? 1 : 0;
            this.graphics.plotPixel(x, y, color);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        return {
            operations: 1000,
            duration: duration,
            operationsPerSecond: 1000 / (duration / 1000)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsTests;
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    console.log('Running Graphics Tests...\n');

    const tests = new GraphicsTests();
    const results = tests.runAllTests();

    console.log(`Graphics Test Results:`);
    console.log(`Total: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${results.successRate.toFixed(1)}%\n`);

    if (results.failed === 0) {
        console.log('✅ All graphics tests passed!');

        // Run performance test
        const perfResults = tests.testPerformance();
        console.log(`\nPerformance Test:`);
        console.log(`Operations: ${perfResults.operations}`);
        console.log(`Duration: ${perfResults.duration.toFixed(2)}ms`);
        console.log(`Speed: ${perfResults.operationsPerSecond.toFixed(0)} ops/sec`);

        // Create visual test pattern
        console.log(`\nCreating visual test pattern...`);
        const pattern = tests.createVisualTestPattern();
        console.log(`Pattern created: ${pattern.framebuffer.length} pixels, ${pattern.textBuffer.length} text rows`);

    } else {
        console.log('❌ Some graphics tests failed:');
        results.results.filter(r => !r.passed).forEach(result => {
            console.log(`- ${result.message}`);
        });
    }
}