/**
 * Text Mode Engine Tests - Comprehensive testing for text mode functionality
 */

const TextModeEngine = require('./text-mode');
const FrameBuffer = require('./frame-buffer');
const CharacterROM = require('./character-rom');

function runTextModeEngineTests() {
    console.log('Running Text Mode Engine Tests...\n');

    const fb = new FrameBuffer();
    const charRom = new CharacterROM();
    const textMode = new TextModeEngine(fb, charRom);

    // Test 1: Basic text writing
    console.log('Test 1: Basic text writing');
    textMode.writeString("Hello", 0);

    // Check that characters were written to character memory
    if (textMode.getCharacterAt(0, 0) === 72 && // 'H'
        textMode.getCharacterAt(1, 0) === 101 && // 'e'
        textMode.getCharacterAt(2, 0) === 108 && // 'l'
        textMode.getCharacterAt(3, 0) === 108 && // 'l'
        textMode.getCharacterAt(4, 0) === 111) { // 'o'
        console.log('✓ Basic text writing passed');
    } else {
        console.error('ERROR: Basic text writing failed');
        return false;
    }

    // Test 2: Cursor positioning
    console.log('Test 2: Cursor positioning');
    textMode.setCursorPosition(10, 5);
    const cursorPos = textMode.getCursorPosition();
    if (cursorPos.x === 10 && cursorPos.y === 5) {
        console.log('✓ Cursor positioning passed');
    } else {
        console.error('ERROR: Cursor positioning failed');
        return false;
    }

    // Test 3: Screen clearing
    console.log('Test 3: Screen clearing');
    textMode.clear(65, 0); // Fill with 'A's
    textMode.setCursorPosition(0, 0);

    // Check that screen is filled with 'A's
    let allAs = true;
    for (let col = 0; col < 10; col++) {
        if (textMode.getCharacterAt(col, 0) !== 65) {
            allAs = false;
            break;
        }
    }

    if (allAs && textMode.getCursorPosition().x === 0 && textMode.getCursorPosition().y === 0) {
        console.log('✓ Screen clearing passed');
    } else {
        console.error('ERROR: Screen clearing failed');
        return false;
    }

    // Test 4: Line feed and carriage return
    console.log('Test 4: Line feed and carriage return');
    textMode.setCursorPosition(0, 0);
    textMode.putCharacter(13); // CR
    textMode.putCharacter(72); // 'H'
    textMode.putCharacter(10); // LF
    textMode.putCharacter(87); // 'W'

    if (textMode.getCharacterAt(0, 0) === 72 && // 'H' at (0,0)
        textMode.getCharacterAt(0, 1) === 87 && // 'W' at (0,1)
        textMode.getCursorPosition().x === 1 && textMode.getCursorPosition().y === 1) {
        console.log('✓ Line feed and carriage return passed');
    } else {
        console.error('ERROR: Line feed and carriage return failed');
        return false;
    }

    // Test 5: Scrolling
    console.log('Test 5: Scrolling');
    textMode.clear(88, 0); // Fill with 'X's
    textMode.scrollUp(5);

    // Check that top rows are cleared and bottom rows still have X's
    if (textMode.getCharacterAt(0, 0) === 32 && // Space (cleared)
        textMode.getCharacterAt(0, 20) === 88) { // 'X' (scrolled up)
        console.log('✓ Scrolling passed');
    } else {
        console.error('ERROR: Scrolling failed');
        return false;
    }

    // Test 6: Tab stops
    console.log('Test 6: Tab stops');
    textMode.setCursorPosition(0, 0);
    textMode.tab();

    if (textMode.getCursorPosition().x === 8) { // Should jump to first tab stop
        console.log('✓ Tab stops passed');
    } else {
        console.error('ERROR: Tab stops failed');
        return false;
    }

    // Test 7: Backspace handling
    console.log('Test 7: Backspace handling');
    textMode.setCursorPosition(5, 5);
    textMode.putCharacter(72); // 'H'
    textMode.putCharacter(8);  // Backspace

    if (textMode.getCharacterAt(5, 5) === 32) { // Should be space now
        console.log('✓ Backspace handling passed');
    } else {
        console.error('ERROR: Backspace handling failed');
        return false;
    }

    // Test 8: Text mode dimensions
    console.log('Test 8: Text mode dimensions');
    const dims = textMode.getDimensions();
    if (dims.cols === 80 && dims.rows === 25 && dims.screenWidth === 640 && dims.screenHeight === 200) {
        console.log('✓ Text mode dimensions passed');
    } else {
        console.error('ERROR: Text mode dimensions incorrect');
        return false;
    }

    // Test 9: Character insertion
    console.log('Test 9: Character insertion');
    textMode.clear(32, 0);
    textMode.setCursorPosition(5, 5);
    textMode.writeString("Hello", 0);
    textMode.setCursorPosition(7, 5);
    textMode.insertCharacters(3);

    // Check that characters were shifted
    if (textMode.getCharacterAt(5, 5) === 72 && // 'H' still there
        textMode.getCharacterAt(10, 5) === 32) { // Inserted spaces
        console.log('✓ Character insertion passed');
    } else {
        console.error('ERROR: Character insertion failed');
        return false;
    }

    // Test 10: Character deletion
    console.log('Test 10: Character deletion');
    textMode.setCursorPosition(5, 5);
    textMode.writeString("Hello", 0);
    textMode.setCursorPosition(7, 5);
    textMode.deleteCharacters(2);

    // Check that characters were deleted and remaining shifted
    if (textMode.getCharacterAt(5, 5) === 72 && // 'H' still there
        textMode.getCharacterAt(7, 5) === 111 && // 'o' moved left
        textMode.getCharacterAt(9, 5) === 32) { // End cleared
        console.log('✓ Character deletion passed');
    } else {
        console.error('ERROR: Character deletion failed');
        return false;
    }

    // Test 11: Line insertion
    console.log('Test 11: Line insertion');
    textMode.clear(88, 0); // Fill with 'X's
    textMode.setCursorPosition(0, 5);
    textMode.insertLines(3);

    // Check that lines were inserted
    if (textMode.getCharacterAt(0, 5) === 32 && // Inserted line (space)
        textMode.getCharacterAt(0, 8) === 88) { // Original line moved down
        console.log('✓ Line insertion passed');
    } else {
        console.error('ERROR: Line insertion failed');
        return false;
    }

    // Test 12: Line deletion
    console.log('Test 12: Line deletion');
    textMode.clear(88, 0); // Fill with 'X's
    textMode.setCursorPosition(0, 5);
    textMode.deleteLines(2);

    // Check that lines were deleted
    if (textMode.getCharacterAt(0, 5) === 88 && // Original line moved up
        textMode.getCharacterAt(0, 23) === 88) { // Bottom lines still have X's
        console.log('✓ Line deletion passed');
    } else {
        console.error('ERROR: Line deletion failed');
        return false;
    }

    // Test 13: Scrolling region
    console.log('Test 13: Scrolling region');
    textMode.setScrollRegion(5, 15);
    textMode.setCursorPosition(0, 10);
    textMode.writeString("Test", 0);

    // Write beyond scrolling region
    for (let i = 0; i < 20; i++) {
        textMode.putCharacter(88); // 'X'
    }

    // Check that scrolling region was respected
    if (textMode.getCharacterAt(0, 5) === 32 && // Above region should be unchanged
        textMode.getCharacterAt(0, 10) !== 32) { // Inside region should have content
        console.log('✓ Scrolling region passed');
    } else {
        console.error('ERROR: Scrolling region failed');
        return false;
    }

    // Test 14: Cursor state management
    console.log('Test 14: Cursor state management');
    textMode.setCursorVisible(false);
    textMode.setCursorPosition(10, 10);

    const savedCursor = textMode.saveCursor();
    textMode.setCursorPosition(20, 20);
    textMode.restoreCursor(savedCursor);

    if (textMode.getCursorPosition().x === 10 && textMode.getCursorPosition().y === 10) {
        console.log('✓ Cursor state management passed');
    } else {
        console.error('ERROR: Cursor state management failed');
        return false;
    }

    // Test 15: Text rendering
    console.log('Test 15: Text rendering');
    fb.clear();
    textMode.clear(32, 0);
    textMode.setCursorPosition(0, 0);
    textMode.writeString("ABC", 0);
    textMode.render();

    // Check that text was rendered to frame buffer
    // Look for pixels in the character areas (simplified check)
    const charArea1 = fb.getPixel(2, 2); // Should have some pixels set for 'A'
    const charArea2 = fb.getPixel(10, 2); // Should have some pixels set for 'B'

    if (charArea1 || charArea2) {
        console.log('✓ Text rendering passed');
    } else {
        console.error('ERROR: Text rendering failed');
        return false;
    }

    console.log('\nAll Text Mode Engine tests passed! ✓');
    return true;
}

module.exports = { runTextModeEngineTests };