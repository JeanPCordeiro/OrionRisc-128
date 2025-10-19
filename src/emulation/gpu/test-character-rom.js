/**
 * Character ROM Tests - Comprehensive testing for character rendering
 */

const CharacterROM = require('./character-rom');
const FrameBuffer = require('./frame-buffer');

function runCharacterROMTests() {
    console.log('Running Character ROM Tests...\n');

    const charRom = new CharacterROM();
    const fb = new FrameBuffer();

    // Test 1: Character bitmap retrieval
    console.log('Test 1: Character bitmap retrieval');
    const spaceBitmap = charRom.getCharacterBitmap(32); // Space
    const aBitmap = charRom.getCharacterBitmap(65); // 'A'

    if (spaceBitmap.length === 8 && aBitmap.length === 8) {
        console.log('✓ Character bitmap retrieval passed');
    } else {
        console.error('ERROR: Character bitmap should be 8 bytes');
        return false;
    }

    // Test 2: Space character rendering
    console.log('Test 2: Space character rendering');
    charRom.renderCharacter(fb, 0, 0, 32, true, false, 0); // Space with white foreground
    let allClear = true;
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (fb.getPixel(x, y)) {
                allClear = false;
                break;
            }
        }
        if (!allClear) break;
    }
    if (allClear) {
        console.log('✓ Space character rendering passed');
    } else {
        console.error('ERROR: Space character should render as all clear');
        return false;
    }

    // Test 3: Letter A rendering
    console.log('Test 3: Letter A rendering');
    fb.clear();
    charRom.renderCharacter(fb, 0, 0, 65, true, false, 0); // 'A' with white foreground

    // Check that A pattern is rendered (simplified check)
    const topRow = fb.getPixel(2, 0) || fb.getPixel(3, 0) || fb.getPixel(4, 0) || fb.getPixel(5, 0);
    const middleRow = fb.getPixel(0, 3) || fb.getPixel(7, 3);
    const crossBar = fb.getPixel(1, 2) || fb.getPixel(2, 2) || fb.getPixel(3, 2) ||
                     fb.getPixel(4, 2) || fb.getPixel(5, 2) || fb.getPixel(6, 2);

    if (topRow && middleRow && crossBar) {
        console.log('✓ Letter A rendering passed');
    } else {
        console.error('ERROR: Letter A pattern not rendered correctly');
        return false;
    }

    // Test 4: Character attributes - reverse
    console.log('Test 4: Character attributes - reverse');
    fb.clear();
    charRom.renderCharacter(fb, 0, 0, 65, true, false, charRom.attributes.REVERSE);

    // With reverse attribute, background should be set where foreground was
    const backgroundPixel = fb.getPixel(0, 0); // Should be true (foreground became background)
    if (backgroundPixel) {
        console.log('✓ Character reverse attribute passed');
    } else {
        console.error('ERROR: Character reverse attribute not working');
        return false;
    }

    // Test 5: Character attributes - underline
    console.log('Test 5: Character attributes - underline');
    fb.clear();
    charRom.renderCharacter(fb, 0, 0, 65, true, false, charRom.attributes.UNDERLINE);

    // Check underline on bottom row
    let underlinePresent = false;
    for (let x = 0; x < 8; x++) {
        if (fb.getPixel(x, 7)) {
            underlinePresent = true;
            break;
        }
    }
    if (underlinePresent) {
        console.log('✓ Character underline attribute passed');
    } else {
        console.error('ERROR: Character underline attribute not working');
        return false;
    }

    // Test 6: Extended character set
    console.log('Test 6: Extended character set');
    const blockBitmap = charRom.getCharacterBitmap(127); // Block character
    let hasPixels = false;
    for (let i = 0; i < 8; i++) {
        if (blockBitmap[i] !== 0) {
            hasPixels = true;
            break;
        }
    }
    if (hasPixels) {
        console.log('✓ Extended character set passed');
    } else {
        console.error('ERROR: Extended characters not accessible');
        return false;
    }

    // Test 7: Character bounds checking
    console.log('Test 7: Character bounds checking');
    fb.clear();

    // Try to render outside bounds (should not crash)
    try {
        charRom.renderCharacter(fb, 635, 195, 65, true, false, 0);
        console.log('✓ Character bounds checking passed');
    } catch (error) {
        console.error('ERROR: Character rendering should handle bounds gracefully');
        return false;
    }

    // Test 8: Color combinations
    console.log('Test 8: Color combinations');
    fb.clear();

    // Test different foreground/background combinations
    charRom.renderCharacter(fb, 0, 0, 66, true, false, 0); // 'B' white on black
    charRom.renderCharacter(fb, 10, 0, 67, false, true, 0); // 'C' black on white

    const whitePixel = fb.getPixel(1, 1); // Should be white (foreground)
    const blackPixel = fb.getPixel(0, 0); // Should be black (background)

    if (whitePixel !== blackPixel) {
        console.log('✓ Color combinations passed');
    } else {
        console.error('ERROR: Color combinations not working correctly');
        return false;
    }

    // Test 9: Character ROM constants
    console.log('Test 9: Character ROM constants');
    if (charRom.CHAR_WIDTH === 8 && charRom.CHAR_HEIGHT === 8) {
        console.log('✓ Character ROM constants passed');
    } else {
        console.error('ERROR: Character ROM constants incorrect');
        return false;
    }

    // Test 10: Font data integrity
    console.log('Test 10: Font data integrity');
    const fontData = charRom.fontData;
    if (fontData && fontData.length === 256 * 8) {
        console.log('✓ Font data integrity passed');
    } else {
        console.error('ERROR: Font data corrupted or incomplete');
        return false;
    }

    console.log('\nAll Character ROM tests passed! ✓');
    return true;
}

module.exports = { runCharacterROMTests };