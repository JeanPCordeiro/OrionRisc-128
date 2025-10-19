/**
 * Frame Buffer Tests - Comprehensive testing for frame buffer functionality
 */

const FrameBuffer = require('./frame-buffer');

function runFrameBufferTests() {
    console.log('Running Frame Buffer Tests...\n');

    const fb = new FrameBuffer();

    // Test 1: Basic pixel operations
    console.log('Test 1: Basic pixel operations');
    fb.setPixel(0, 0, true);
    fb.setPixel(10, 10, true);
    fb.setPixel(639, 199, true);

    if (fb.getPixel(0, 0) !== true) {
        console.error('ERROR: Pixel (0,0) should be set');
        return false;
    }
    if (fb.getPixel(10, 10) !== true) {
        console.error('ERROR: Pixel (10,10) should be set');
        return false;
    }
    if (fb.getPixel(639, 199) !== true) {
        console.error('ERROR: Pixel (639,199) should be set');
        return false;
    }
    console.log('✓ Basic pixel operations passed');

    // Test 2: Out of bounds handling
    console.log('Test 2: Out of bounds handling');
    fb.setPixel(-1, 0, true);
    fb.setPixel(0, -1, true);
    fb.setPixel(640, 200, true);

    if (fb.getPixel(-1, 0) !== false && fb.getPixel(0, -1) !== false && fb.getPixel(640, 200) !== false) {
        console.log('✓ Out of bounds handling passed');
    } else {
        console.error('ERROR: Out of bounds pixels should return false');
        return false;
    }

    // Test 3: Horizontal line drawing
    console.log('Test 3: Horizontal line drawing');
    fb.drawHorizontalLine(10, 50, 20, true);
    let allSet = true;
    for (let x = 10; x <= 50; x++) {
        if (!fb.getPixel(x, 20)) {
            allSet = false;
            break;
        }
    }
    if (allSet) {
        console.log('✓ Horizontal line drawing passed');
    } else {
        console.error('ERROR: Horizontal line not drawn correctly');
        return false;
    }

    // Test 4: Vertical line drawing
    console.log('Test 4: Vertical line drawing');
    fb.drawVerticalLine(30, 10, 40, true);
    allSet = true;
    for (let y = 10; y <= 40; y++) {
        if (!fb.getPixel(30, y)) {
            allSet = false;
            break;
        }
    }
    if (allSet) {
        console.log('✓ Vertical line drawing passed');
    } else {
        console.error('ERROR: Vertical line not drawn correctly');
        return false;
    }

    // Test 5: Rectangle filling
    console.log('Test 5: Rectangle filling');
    fb.fillRectangle(100, 100, 50, 30, true);
    allSet = true;
    for (let y = 100; y < 130; y++) {
        for (let x = 100; x < 150; x++) {
            if (!fb.getPixel(x, y)) {
                allSet = false;
                break;
            }
        }
        if (!allSet) break;
    }
    if (allSet) {
        console.log('✓ Rectangle filling passed');
    } else {
        console.error('ERROR: Rectangle not filled correctly');
        return false;
    }

    // Test 6: Frame buffer dimensions
    console.log('Test 6: Frame buffer dimensions');
    const dims = fb.getDimensions();
    if (dims.width === 640 && dims.height === 200 && dims.totalSize === 16000) {
        console.log('✓ Frame buffer dimensions passed');
    } else {
        console.error('ERROR: Incorrect frame buffer dimensions');
        return false;
    }

    // Test 7: Memory layout
    console.log('Test 7: Memory layout');
    const layout = fb.getMemoryLayout();
    if (layout.width === 640 && layout.height === 200 && layout.bytesPerRow === 80) {
        console.log('✓ Memory layout passed');
    } else {
        console.error('ERROR: Incorrect memory layout');
        return false;
    }

    // Test 8: Buffer swapping
    console.log('Test 8: Buffer swapping');
    fb.setPixel(5, 5, true);
    fb.swapBuffers();
    if (fb.getPixel(5, 5) === true) {
        console.log('✓ Buffer swapping passed');
    } else {
        console.error('ERROR: Buffer swap failed');
        return false;
    }

    // Test 9: Register access
    console.log('Test 9: Register access');
    const controlReg = fb.readRegister(0x0000);
    const statusReg = fb.readRegister(0x0004);
    fb.writeRegister(0x0014, 1); // Set display mode to text
    if (fb.readRegister(0x0014) === 1) {
        console.log('✓ Register access passed');
    } else {
        console.error('ERROR: Register access failed');
        return false;
    }

    // Test 10: Scrolling
    console.log('Test 10: Scrolling');
    fb.fillRectangle(0, 0, 640, 50, true);
    fb.scrollUp(10);
    if (fb.getPixel(0, 0) === false && fb.getPixel(0, 40) === true) {
        console.log('✓ Scrolling passed');
    } else {
        console.error('ERROR: Scrolling failed');
        return false;
    }

    console.log('\nAll Frame Buffer tests passed! ✓');
    return true;
}

module.exports = { runFrameBufferTests };