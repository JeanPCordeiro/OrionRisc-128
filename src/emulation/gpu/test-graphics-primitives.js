/**
 * Graphics Primitives Tests - Comprehensive testing for graphics functions
 */

const GraphicsPrimitives = require('./graphics-primitives');
const FrameBuffer = require('./frame-buffer');

function runGraphicsPrimitivesTests() {
    console.log('Running Graphics Primitives Tests...\n');

    const fb = new FrameBuffer();
    const gp = new GraphicsPrimitives(fb);

    // Test 1: Pixel plotting
    console.log('Test 1: Pixel plotting');
    gp.plotPixel(100, 100, true);
    gp.plotPixel(101, 101, true);
    gp.plotPixel(102, 102, true);

    if (gp.getPixel(100, 100) && gp.getPixel(101, 101) && gp.getPixel(102, 102)) {
        console.log('✓ Pixel plotting passed');
    } else {
        console.error('ERROR: Pixel plotting failed');
        return false;
    }

    // Test 2: Line drawing (Bresenham algorithm)
    console.log('Test 2: Line drawing');
    fb.clear();
    gp.drawLine(0, 0, 50, 50, true);

    // Check that line pixels are set
    let linePixelsSet = 0;
    for (let i = 0; i <= 50; i++) {
        if (gp.getPixel(i, i)) {
            linePixelsSet++;
        }
    }

    if (linePixelsSet >= 45) { // Allow some tolerance for anti-aliasing
        console.log('✓ Line drawing passed');
    } else {
        console.error('ERROR: Line drawing failed - not enough pixels set');
        return false;
    }

    // Test 3: Horizontal line
    console.log('Test 3: Horizontal line');
    fb.clear();
    gp.drawHorizontalLine(10, 60, 20, true);

    let horizontalPixelsSet = 0;
    for (let x = 10; x <= 60; x++) {
        if (gp.getPixel(x, 20)) {
            horizontalPixelsSet++;
        }
    }

    if (horizontalPixelsSet === 51) {
        console.log('✓ Horizontal line passed');
    } else {
        console.error('ERROR: Horizontal line failed');
        return false;
    }

    // Test 4: Vertical line
    console.log('Test 4: Vertical line');
    fb.clear();
    gp.drawVerticalLine(30, 10, 40, true);

    let verticalPixelsSet = 0;
    for (let y = 10; y <= 40; y++) {
        if (gp.getPixel(30, y)) {
            verticalPixelsSet++;
        }
    }

    if (verticalPixelsSet === 31) {
        console.log('✓ Vertical line passed');
    } else {
        console.error('ERROR: Vertical line failed');
        return false;
    }

    // Test 5: Rectangle outline
    console.log('Test 5: Rectangle outline');
    fb.clear();
    gp.drawRectangle(50, 50, 30, 20, true);

    // Check corners and edges
    const corners = [
        [50, 50], [79, 50], [50, 69], [79, 69]
    ];

    let cornersSet = 0;
    corners.forEach(([x, y]) => {
        if (gp.getPixel(x, y)) cornersSet++;
    });

    if (cornersSet === 4) {
        console.log('✓ Rectangle outline passed');
    } else {
        console.error('ERROR: Rectangle outline failed');
        return false;
    }

    // Test 6: Rectangle filling
    console.log('Test 6: Rectangle filling');
    fb.clear();
    gp.fillRectangle(100, 100, 20, 15, true);

    let filledPixels = 0;
    for (let y = 100; y < 115; y++) {
        for (let x = 100; x < 120; x++) {
            if (gp.getPixel(x, y)) {
                filledPixels++;
            }
        }
    }

    if (filledPixels === 300) { // 20 * 15
        console.log('✓ Rectangle filling passed');
    } else {
        console.error('ERROR: Rectangle filling failed');
        return false;
    }

    // Test 7: Circle drawing
    console.log('Test 7: Circle drawing');
    fb.clear();
    gp.drawCircle(150, 150, 10, true);

    // Check that circle pixels are set (approximate check)
    let circlePixelsSet = 0;
    for (let y = 140; y <= 160; y++) {
        for (let x = 140; x <= 160; x++) {
            if (gp.getPixel(x, y)) {
                circlePixelsSet++;
            }
        }
    }

    if (circlePixelsSet >= 30 && circlePixelsSet <= 70) { // Circle should have roughly this many pixels
        console.log('✓ Circle drawing passed');
    } else {
        console.error('ERROR: Circle drawing failed');
        return false;
    }

    // Test 8: Circle filling
    console.log('Test 8: Circle filling');
    fb.clear();
    gp.fillCircle(200, 100, 8, true);

    let filledCirclePixels = 0;
    for (let y = 92; y <= 108; y++) {
        for (let x = 192; x <= 208; x++) {
            if (gp.getPixel(x, y)) {
                filledCirclePixels++;
            }
        }
    }

    if (filledCirclePixels >= 40) { // Filled circle should have many pixels
        console.log('✓ Circle filling passed');
    } else {
        console.error('ERROR: Circle filling failed');
        return false;
    }

    // Test 9: Triangle drawing
    console.log('Test 9: Triangle drawing');
    fb.clear();
    gp.drawTriangle(250, 150, 270, 180, 290, 150, true);

    // Check triangle vertices
    const vertices = [[250, 150], [270, 180], [290, 150]];
    let verticesSet = 0;
    vertices.forEach(([x, y]) => {
        if (gp.getPixel(x, y)) verticesSet++;
    });

    if (verticesSet === 3) {
        console.log('✓ Triangle drawing passed');
    } else {
        console.error('ERROR: Triangle drawing failed');
        return false;
    }

    // Test 10: Triangle filling
    console.log('Test 10: Triangle filling');
    fb.clear();
    gp.fillTriangle(300, 100, 320, 130, 340, 100, true);

    let trianglePixels = 0;
    for (let y = 100; y <= 130; y++) {
        for (let x = 300; x <= 340; x++) {
            if (gp.getPixel(x, y)) {
                trianglePixels++;
            }
        }
    }

    if (trianglePixels >= 200) { // Filled triangle should have many pixels
        console.log('✓ Triangle filling passed');
    } else {
        console.error('ERROR: Triangle filling failed');
        return false;
    }

    // Test 11: Region copying
    console.log('Test 11: Region copying');
    fb.clear();
    gp.fillRectangle(0, 0, 20, 20, true);
    gp.copyRegion(0, 0, 50, 50, 20, 20);

    let copiedPixels = 0;
    for (let y = 50; y < 70; y++) {
        for (let x = 50; x < 70; x++) {
            if (gp.getPixel(x, y)) {
                copiedPixels++;
            }
        }
    }

    if (copiedPixels >= 300) { // Should copy most of the rectangle
        console.log('✓ Region copying passed');
    } else {
        console.error('ERROR: Region copying failed');
        return false;
    }

    // Test 12: Screen clearing
    console.log('Test 12: Screen clearing');
    gp.fillRectangle(0, 0, 640, 200, true);
    gp.clearScreen(false);

    let anyPixelsSet = false;
    for (let y = 0; y < 200; y += 20) {
        for (let x = 0; x < 640; x += 80) {
            if (gp.getPixel(x, y)) {
                anyPixelsSet = true;
                break;
            }
        }
        if (anyPixelsSet) break;
    }

    if (!anyPixelsSet) {
        console.log('✓ Screen clearing passed');
    } else {
        console.error('ERROR: Screen clearing failed');
        return false;
    }

    // Test 13: Capabilities reporting
    console.log('Test 13: Capabilities reporting');
    const caps = gp.getCapabilities();
    if (caps.width === 640 && caps.height === 200 && caps.supportsCircles && caps.colorDepth === 1) {
        console.log('✓ Capabilities reporting passed');
    } else {
        console.error('ERROR: Capabilities reporting incorrect');
        return false;
    }

    // Test 14: Ellipse drawing
    console.log('Test 14: Ellipse drawing');
    fb.clear();
    gp.drawEllipse(400, 150, 15, 10, true);

    let ellipsePixels = 0;
    for (let y = 140; y <= 160; y++) {
        for (let x = 385; x <= 415; x++) {
            if (gp.getPixel(x, y)) {
                ellipsePixels++;
            }
        }
    }

    if (ellipsePixels >= 20 && ellipsePixels <= 60) {
        console.log('✓ Ellipse drawing passed');
    } else {
        console.error('ERROR: Ellipse drawing failed');
        return false;
    }

    // Test 15: Bitmap drawing
    console.log('Test 15: Bitmap drawing');
    fb.clear();
    const testBitmap = new Uint8Array([0x81, 0x42, 0x24, 0x18, 0x18, 0x24, 0x42, 0x81]); // X pattern
    gp.drawBitmap(500, 100, testBitmap, 8, 8, false, false);

    let bitmapPixels = 0;
    for (let y = 100; y < 108; y++) {
        for (let x = 500; x < 508; x++) {
            if (gp.getPixel(x, y)) {
                bitmapPixels++;
            }
        }
    }

    if (bitmapPixels >= 8 && bitmapPixels <= 20) { // X pattern should have some pixels set
        console.log('✓ Bitmap drawing passed');
    } else {
        console.error('ERROR: Bitmap drawing failed');
        return false;
    }

    console.log('\nAll Graphics Primitives tests passed! ✓');
    return true;
}

module.exports = { runGraphicsPrimitivesTests };