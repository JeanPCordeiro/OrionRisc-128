/**
 * Graphics Primitives - Low-level graphics functions for OrionRisc-128 GPU
 *
 * Provides pixel plotting, line drawing algorithms, and shape rendering
 * functions optimized for the 640x200 monochrome frame buffer.
 */

class GraphicsPrimitives {
    constructor(frameBuffer) {
        this.frameBuffer = frameBuffer;
        this.width = frameBuffer.getDimensions().width;
        this.height = frameBuffer.getDimensions().height;
    }

    /**
     * Plot a single pixel
     * @param {number} x - X coordinate (0-639)
     * @param {number} y - Y coordinate (0-199)
     * @param {boolean} value - Pixel value (true = lit, false = dark)
     */
    plotPixel(x, y, value) {
        this.frameBuffer.setPixel(x, y, value);
    }

    /**
     * Get pixel value
     * @param {number} x - X coordinate (0-639)
     * @param {number} y - Y coordinate (0-199)
     * @returns {boolean} Pixel value
     */
    getPixel(x, y) {
        return this.frameBuffer.getPixel(x, y);
    }

    /**
     * Draw a line using Bresenham's algorithm
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {boolean} value - Line color (true = lit, false = dark)
     */
    drawLine(x1, y1, x2, y2, value) {
        // Bresenham's line algorithm
        let x = Math.floor(x1);
        let y = Math.floor(y1);
        const xEnd = Math.floor(x2);
        const yEnd = Math.floor(y2);

        const dx = Math.abs(xEnd - x);
        const dy = Math.abs(yEnd - y);

        const sx = (x < xEnd) ? 1 : -1;
        const sy = (y < yEnd) ? 1 : -1;

        let err = dx - dy;
        let err2;

        while (true) {
            this.plotPixel(x, y, value);

            if (x === xEnd && y === yEnd) break;

            err2 = 2 * err;

            if (err2 > -dy) {
                err -= dy;
                x += sx;
            }

            if (err2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    /**
     * Draw a horizontal line
     * @param {number} x1 - Start X coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} value - Line color
     */
    drawHorizontalLine(x1, x2, y, value) {
        this.frameBuffer.drawHorizontalLine(x1, x2, y, value);
    }

    /**
     * Draw a vertical line
     * @param {number} x - X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} y2 - End Y coordinate
     * @param {boolean} value - Line color
     */
    drawVerticalLine(x, y1, y2, value) {
        this.frameBuffer.drawVerticalLine(x, y1, y2, value);
    }

    /**
     * Draw a rectangle outline
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {boolean} value - Line color
     */
    drawRectangle(x, y, width, height, value) {
        const x2 = x + width - 1;
        const y2 = y + height - 1;

        // Draw top and bottom lines
        this.drawHorizontalLine(x, x2, y, value);
        this.drawHorizontalLine(x, x2, y2, value);

        // Draw left and right lines (avoid corners as they're already drawn)
        if (height > 2) {
            this.drawVerticalLine(x, y + 1, y2 - 1, value);
            this.drawVerticalLine(x2, y + 1, y2 - 1, value);
        }
    }

    /**
     * Fill a rectangle with solid color
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {boolean} value - Fill color
     */
    fillRectangle(x, y, width, height, value) {
        this.frameBuffer.fillRectangle(x, y, width, height, value);
    }

    /**
     * Draw a circle using Bresenham's circle algorithm
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Circle radius
     * @param {boolean} value - Circle color
     */
    drawCircle(centerX, centerY, radius, value) {
        let x = 0;
        let y = radius;
        let d = 3 - 2 * radius;

        this.drawCirclePoints(centerX, centerY, x, y, value);

        while (y >= x) {
            x++;

            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }

            this.drawCirclePoints(centerX, centerY, x, y, value);
        }
    }

    /**
     * Helper function for circle drawing
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} x - X offset
     * @param {number} y - Y offset
     * @param {boolean} value - Color value
     */
    drawCirclePoints(cx, cy, x, y, value) {
        if (x === 0) {
            this.plotPixel(cx, cy + y, value);
            this.plotPixel(cx, cy - y, value);
            this.plotPixel(cx + y, cy, value);
            this.plotPixel(cx - y, cy, value);
        } else if (x === y) {
            this.plotPixel(cx + x, cy + y, value);
            this.plotPixel(cx - x, cy + y, value);
            this.plotPixel(cx + x, cy - y, value);
            this.plotPixel(cx - x, cy - y, value);
        } else if (x < y) {
            this.plotPixel(cx + x, cy + y, value);
            this.plotPixel(cx - x, cy + y, value);
            this.plotPixel(cx + x, cy - y, value);
            this.plotPixel(cx - x, cy - y, value);
            this.plotPixel(cx + y, cy + x, value);
            this.plotPixel(cx - y, cy + x, value);
            this.plotPixel(cx + y, cy - x, value);
            this.plotPixel(cx - y, cy - x, value);
        }
    }

    /**
     * Fill a circle with solid color
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Circle radius
     * @param {boolean} value - Fill color
     */
    fillCircle(centerX, centerY, radius, value) {
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                if (x * x + y * y <= radius * radius) {
                    this.plotPixel(centerX + x, centerY + y, value);
                }
            }
        }
    }

    /**
     * Draw a triangle outline
     * @param {number} x1 - Vertex 1 X
     * @param {number} y1 - Vertex 1 Y
     * @param {number} x2 - Vertex 2 X
     * @param {number} y2 - Vertex 2 Y
     * @param {number} x3 - Vertex 3 X
     * @param {number} y3 - Vertex 3 Y
     * @param {boolean} value - Line color
     */
    drawTriangle(x1, y1, x2, y2, x3, y3, value) {
        this.drawLine(x1, y1, x2, y2, value);
        this.drawLine(x2, y2, x3, y3, value);
        this.drawLine(x3, y3, x1, y1, value);
    }

    /**
     * Fill a triangle with solid color using barycentric coordinates
     * @param {number} x1 - Vertex 1 X
     * @param {number} y1 - Vertex 1 Y
     * @param {number} x2 - Vertex 2 X
     * @param {number} y2 - Vertex 2 Y
     * @param {number} x3 - Vertex 3 X
     * @param {number} y3 - Vertex 3 Y
     * @param {boolean} value - Fill color
     */
    fillTriangle(x1, y1, x2, y2, x3, y3, value) {
        // Find bounding box
        const minX = Math.min(x1, x2, x3);
        const maxX = Math.max(x1, x2, x3);
        const minY = Math.min(y1, y2, y3);
        const maxY = Math.max(y1, y2, y3);

        // Triangle area for barycentric coordinates
        const area = this.triangleArea(x1, y1, x2, y2, x3, y3);

        // Fill pixels within bounding box
        for (let y = Math.max(0, minY); y <= Math.min(this.height - 1, maxY); y++) {
            for (let x = Math.max(0, minX); x <= Math.min(this.width - 1, maxX); x++) {
                // Calculate barycentric coordinates
                const alpha = this.triangleArea(x2, y2, x3, y3, x, y) / area;
                const beta = this.triangleArea(x3, y3, x1, y1, x, y) / area;
                const gamma = this.triangleArea(x1, y1, x2, y2, x, y) / area;

                // Check if point is inside triangle
                if (alpha >= 0 && beta >= 0 && gamma >= 0 &&
                    Math.abs(alpha + beta + gamma - 1) < 1e-6) {
                    this.plotPixel(x, y, value);
                }
            }
        }
    }

    /**
     * Calculate triangle area using cross product
     * @param {number} x1 - Point 1 X
     * @param {number} y1 - Point 1 Y
     * @param {number} x2 - Point 2 X
     * @param {number} y2 - Point 2 Y
     * @param {number} x3 - Point 3 X
     * @param {number} y3 - Point 3 Y
     * @returns {number} Triangle area
     */
    triangleArea(x1, y1, x2, y2, x3, y3) {
        return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
    }

    /**
     * Draw an ellipse using Bresenham's ellipse algorithm
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radiusX - Horizontal radius
     * @param {number} radiusY - Vertical radius
     * @param {boolean} value - Ellipse color
     */
    drawEllipse(centerX, centerY, radiusX, radiusY, value) {
        let x = 0;
        let y = radiusY;

        // Decision parameters
        let d1 = (radiusY * radiusY) - (radiusX * radiusX * radiusY) + (0.25 * radiusX * radiusX);
        let dx = 2 * radiusY * radiusY * x;
        let dy = 2 * radiusX * radiusX * y;

        // Region 1
        while (dx < dy) {
            this.plotPixel(centerX + x, centerY + y, value);
            this.plotPixel(centerX - x, centerY + y, value);
            this.plotPixel(centerX + x, centerY - y, value);
            this.plotPixel(centerX - x, centerY - y, value);

            if (d1 < 0) {
                x++;
                dx = dx + (2 * radiusY * radiusY);
                d1 = d1 + dx + (radiusY * radiusY);
            } else {
                x++;
                y--;
                dx = dx + (2 * radiusY * radiusY);
                dy = dy - (2 * radiusX * radiusX);
                d1 = d1 + dx - dy + (radiusY * radiusY);
            }
        }

        // Region 2
        let d2 = ((radiusY * radiusY) * ((x + 0.5) * (x + 0.5))) +
                 ((radiusX * radiusX) * ((y - 1) * (y - 1))) -
                 (radiusX * radiusX * radiusY * radiusY);

        while (y >= 0) {
            this.plotPixel(centerX + x, centerY + y, value);
            this.plotPixel(centerX - x, centerY + y, value);
            this.plotPixel(centerX + x, centerY - y, value);
            this.plotPixel(centerX - x, centerY - y, value);

            if (d2 > 0) {
                y--;
                dy = dy - (2 * radiusX * radiusX);
                d2 = d2 + (radiusX * radiusX) - dy;
            } else {
                y--;
                x++;
                dx = dx + (2 * radiusY * radiusY);
                dy = dy - (2 * radiusX * radiusX);
                d2 = d2 + dx - dy + (radiusX * radiusX);
            }
        }
    }

    /**
     * Copy a rectangular region from one location to another
     * @param {number} srcX - Source X coordinate
     * @param {number} srcY - Source Y coordinate
     * @param {number} destX - Destination X coordinate
     * @param {number} destY - Destination Y coordinate
     * @param {number} width - Region width
     * @param {number} height - Region height
     */
    copyRegion(srcX, srcY, destX, destY, width, height) {
        this.frameBuffer.copyRegion(srcX, srcY, destX, destY, width, height);
    }

    /**
     * Draw a bitmap/sprite at specified location
     * @param {number} x - Destination X coordinate
     * @param {number} y - Destination Y coordinate
     * @param {Uint8Array} bitmap - Bitmap data (8 bytes for 8x8 sprite)
     * @param {number} width - Bitmap width in pixels
     * @param {number} height - Bitmap height in pixels
     * @param {boolean} transparent - Whether to skip background pixels
     * @param {boolean} transparentColor - Color to treat as transparent
     */
    drawBitmap(x, y, bitmap, width, height, transparent = false, transparentColor = false) {
        for (let row = 0; row < height && row < 8; row++) {
            for (let col = 0; col < width && col < 8; col++) {
                const byteIndex = row;
                const bitIndex = 7 - col;

                if (bitmap[byteIndex] !== undefined) {
                    const pixel = (bitmap[byteIndex] & (1 << bitIndex)) !== 0;

                    if (!transparent || pixel !== transparentColor) {
                        this.plotPixel(x + col, y + row, pixel);
                    }
                }
            }
        }
    }

    /**
     * Clear the screen with specified color
     * @param {boolean} value - Clear color (true = lit, false = dark)
     */
    clearScreen(value) {
        this.fillRectangle(0, 0, this.width, this.height, value);
    }

    /**
     * Draw a character using the character ROM
     * @param {Object} characterRom - Character ROM instance
     * @param {number} x - X position (top-left corner)
     * @param {number} y - Y position (top-left corner)
     * @param {number} charCode - Character code (0-255)
     * @param {boolean} foreground - Foreground color
     * @param {boolean} background - Background color
     * @param {number} attributes - Character attributes
     */
    drawCharacter(characterRom, x, y, charCode, foreground, background, attributes = 0) {
        characterRom.renderCharacter(this.frameBuffer, x, y, charCode, foreground, background, attributes);
    }

    /**
     * Get graphics capabilities
     * @returns {Object} Graphics capabilities object
     */
    getCapabilities() {
        return {
            width: this.width,
            height: this.height,
            maxLineWidth: 1, // Monochrome
            supportsCircles: true,
            supportsEllipses: true,
            supportsTriangles: true,
            supportsBitmaps: true,
            supportsTransparency: true,
            colorDepth: 1 // Monochrome
        };
    }
}

module.exports = GraphicsPrimitives;