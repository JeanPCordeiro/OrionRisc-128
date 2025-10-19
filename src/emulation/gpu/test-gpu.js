/**
 * GPU Integration Tests - Comprehensive testing for complete GPU functionality
 */

const GraphicsProcessingUnit = require('./GraphicsProcessingUnit');

function runGPUTests() {
    console.log('Running GPU Integration Tests...\n');

    const gpu = new GraphicsProcessingUnit();

    // Test 1: GPU initialization
    console.log('Test 1: GPU initialization');
    const status = gpu.getStatus();
    if (status.displayMode === 0 && status.currentScanLine === 0 && !status.verticalBlank) {
        console.log('✓ GPU initialization passed');
    } else {
        console.error('ERROR: GPU initialization failed');
        return false;
    }

    // Test 2: Register access
    console.log('Test 2: Register access');
    gpu.writeRegister(0x0014, 1); // Set display mode to text
    if (gpu.readRegister(0x0014) === 1) {
        console.log('✓ Register access passed');
    } else {
        console.error('ERROR: Register access failed');
        return false;
    }

    // Test 3: Graphics command execution
    console.log('Test 3: Graphics command execution');
    gpu.writeRegister(0x0024, 100); // Set X coordinate
    gpu.writeRegister(0x0028, 100); // Set Y coordinate
    gpu.writeRegister(0x002C, 1);   // Set value
    gpu.writeRegister(0x0020, 0x03); // Execute SET_PIXEL command

    const pixelSet = gpu.getFrameBuffer().getPixel(100, 100);
    if (pixelSet) {
        console.log('✓ Graphics command execution passed');
    } else {
        console.error('ERROR: Graphics command execution failed');
        return false;
    }

    // Test 4: Text mode commands
    console.log('Test 4: Text mode commands');
    gpu.writeRegister(0x0024, 65);  // 'A'
    gpu.writeRegister(0x0028, 0);   // Attributes
    gpu.writeRegister(0x0020, 0x0A); // Execute TEXT_WRITE_CHAR command

    const charWritten = gpu.getTextModeEngine().getCharacterAt(0, 0);
    if (charWritten === 65) {
        console.log('✓ Text mode commands passed');
    } else {
        console.error('ERROR: Text mode commands failed');
        return false;
    }

    // Test 5: Frame buffer access
    console.log('Test 5: Frame buffer access');
    const fb = gpu.getFrameBuffer();
    fb.setPixel(50, 50, true);

    if (fb.getPixel(50, 50)) {
        console.log('✓ Frame buffer access passed');
    } else {
        console.error('ERROR: Frame buffer access failed');
        return false;
    }

    // Test 6: Component integration
    console.log('Test 6: Component integration');
    const gp = gpu.getGraphicsPrimitives();
    const tm = gpu.getTextModeEngine();
    const cr = gpu.getCharacterROM();

    if (gp && tm && cr) {
        console.log('✓ Component integration passed');
    } else {
        console.error('ERROR: Component integration failed');
        return false;
    }

    // Test 7: Memory-mapped I/O integration
    console.log('Test 7: Memory-mapped I/O integration');
    // Write to frame buffer through memory-mapped I/O
    gpu.writeRegister(0x0100, 0xFF); // Set some pixels in frame buffer area

    const memValue = gpu.readRegister(0x0100);
    if (memValue === 0xFF) {
        console.log('✓ Memory-mapped I/O integration passed');
    } else {
        console.error('ERROR: Memory-mapped I/O integration failed');
        return false;
    }

    // Test 8: GPU reset
    console.log('Test 8: GPU reset');
    gpu.reset();
    const resetStatus = gpu.getStatus();

    if (resetStatus.displayMode === 0 && resetStatus.currentScanLine === 0) {
        console.log('✓ GPU reset passed');
    } else {
        console.error('ERROR: GPU reset failed');
        return false;
    }

    // Test 9: Performance mode
    console.log('Test 9: Performance mode');
    gpu.setPerformanceMode(true);
    // Performance mode should not throw errors
    console.log('✓ Performance mode passed');

    // Test 10: Interrupt handling
    console.log('Test 10: Interrupt handling');
    gpu.writeRegister(0x0040, 0xFF); // Enable all interrupts
    gpu.writeRegister(0x0044, 0x00); // Clear interrupt status

    if (gpu.readRegister(0x0040) === 0xFF && gpu.readRegister(0x0044) === 0x00) {
        console.log('✓ Interrupt handling passed');
    } else {
        console.error('ERROR: Interrupt handling failed');
        return false;
    }

    // Test 11: Frame update simulation
    console.log('Test 11: Frame update simulation');
    const initialFrameCount = gpu.getStatus().frameCount;
    gpu.updateFrame();

    if (gpu.getStatus().frameCount >= initialFrameCount) {
        console.log('✓ Frame update simulation passed');
    } else {
        console.error('ERROR: Frame update simulation failed');
        return false;
    }

    // Test 12: Command parameter handling
    console.log('Test 12: Command parameter handling');
    gpu.writeRegister(0x0024, 0x1234); // Param 0
    gpu.writeRegister(0x0028, 0x5678); // Param 1
    gpu.writeRegister(0x002C, 0x9ABC); // Param 2
    gpu.writeRegister(0x0030, 0xDEF0); // Param 3

    if (gpu.readRegister(0x0024) === 0x1234 &&
        gpu.readRegister(0x0028) === 0x5678 &&
        gpu.readRegister(0x002C) === 0x9ABC &&
        gpu.readRegister(0x0030) === 0xDEF0) {
        console.log('✓ Command parameter handling passed');
    } else {
        console.error('ERROR: Command parameter handling failed');
        return false;
    }

    // Test 13: Palette handling
    console.log('Test 13: Palette handling');
    gpu.writeRegister(0x0034, 1); // Set palette 0
    gpu.writeRegister(0x0038, 0); // Clear palette 1
    gpu.writeRegister(0x003C, 1); // Set border color

    if (gpu.readRegister(0x0034) === 1 &&
        gpu.readRegister(0x0038) === 0 &&
        gpu.readRegister(0x003C) === 1) {
        console.log('✓ Palette handling passed');
    } else {
        console.error('ERROR: Palette handling failed');
        return false;
    }

    // Test 14: Text mode cursor control
    console.log('Test 14: Text mode cursor control');
    gpu.writeRegister(0x0018, 0x050A); // Set cursor to (10, 5)
    gpu.writeRegister(0x001C, 0x01);   // Enable cursor

    const cursorPos = gpu.getTextModeEngine().getCursorPosition();
    if (cursorPos.x === 10 && cursorPos.y === 5) {
        console.log('✓ Text mode cursor control passed');
    } else {
        console.error('ERROR: Text mode cursor control failed');
        return false;
    }

    // Test 15: Graphics primitives integration
    console.log('Test 15: Graphics primitives integration');
    const primitives = gpu.getGraphicsPrimitives();
    primitives.drawLine(200, 100, 250, 150, true);

    const linePixel = gpu.getFrameBuffer().getPixel(225, 125);
    if (linePixel) {
        console.log('✓ Graphics primitives integration passed');
    } else {
        console.error('ERROR: Graphics primitives integration failed');
        return false;
    }

    console.log('\nAll GPU integration tests passed! ✓');
    return true;
}

module.exports = { runGPUTests };