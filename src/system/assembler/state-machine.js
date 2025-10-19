/**
 * Finite State Machine for Lexical Analysis
 *
 * This module implements the core finite state machine for tokenizing
 * assembly language source code. It handles character classification,
 * state transitions, and token recognition.
 *
 * Phase 2 Component: Lexical Analyzer State Machine
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// CHARACTER CLASSIFICATION
// ============================================================================

/**
 * Character classification function (for machine language implementation)
 * @param {number} char - Character code (0-255)
 * @returns {number} Character class constant
 */
function classifyCharacter(char) {
    // Letters (A-Z, a-z)
    if ((char >= 65 && char <= 90) || (char >= 97 && char <= 122)) {
        return CHAR_CLASSES.LETTER;
    }

    // Digits (0-9)
    if (char >= 48 && char <= 57) {
        return CHAR_CLASSES.DIGIT;
    }

    // Whitespace (space, tab, newline, carriage return)
    if (char === 32 || char === 9 || char === 10 || char === 13) {
        return CHAR_CLASSES.WHITESPACE;
    }

    // Special characters
    switch (char) {
        case 58: return CHAR_CLASSES.COLON;      // ':'
        case 59: return CHAR_CLASSES.SEMICOLON;  // ';'
        case 44: return CHAR_CLASSES.COMMA;      // ','
        case 91: return CHAR_CLASSES.BRACKET;    // '['
        case 93: return CHAR_CLASSES.BRACKET;    // ']'
        case 46: return CHAR_CLASSES.DOT;        // '.'
        case 36: return CHAR_CLASSES.DOLLAR;     // '$'
        default: return CHAR_CLASSES.INVALID;
    }
}

/**
 * Check if character is valid hexadecimal digit
 * @param {number} char - Character code
 * @returns {boolean} True if valid hex digit
 */
function isHexDigit(char) {
    return (char >= 48 && char <= 57) ||    // 0-9
           (char >= 65 && char <= 70) ||    // A-F
           (char >= 97 && char <= 102);     // a-f
}

/**
 * Check if character can start an identifier (label or instruction)
 * @param {number} char - Character code
 * @returns {boolean} True if valid identifier start
 */
function isIdentifierStart(char) {
    return (char >= 65 && char <= 90) || (char >= 97 && char <= 122);
}

/**
 * Check if character can continue an identifier
 * @param {number} char - Character code
 * @returns {boolean} True if valid identifier continuation
 */
function isIdentifierChar(char) {
    return (char >= 65 && char <= 90) ||    // A-Z
           (char >= 97 && char <= 122) ||   // a-z
           (char >= 48 && char <= 57) ||    // 0-9
           (char === 95);                   // underscore
}

// ============================================================================
// STATE MACHINE IMPLEMENTATION
// ============================================================================

/**
 * Lexical analysis state machine
 * @param {string} sourceCode - Assembly source code to tokenize
 * @returns {Array} Array of tokens
 */
function lexicalAnalysis(sourceCode) {
    const tokens = [];
    let position = 0;
    let currentState = LEX_STATES.START;
    let tokenStart = 0;
    let tokenLength = 0;

    // Main analysis loop
    while (position < sourceCode.length) {
        const char = sourceCode.charCodeAt(position);
        const charClass = classifyCharacter(char);

        // Handle state transitions
        const nextState = getNextState(currentState, charClass, char);

        if (nextState !== currentState) {
            // State changed - process any completed token
            if (currentState !== LEX_STATES.START && tokenLength > 0) {
                const token = processToken(sourceCode, tokenStart, tokenLength, currentState);
                if (token) {
                    tokens.push(token);
                }
            }

            // Start new token if not staying in START state
            if (nextState !== LEX_STATES.START) {
                tokenStart = position;
                tokenLength = 0;
            } else {
                tokenStart = 0;
                tokenLength = 0;
            }

            currentState = nextState;
        }

        // Count characters in current token
        if (currentState !== LEX_STATES.START && currentState !== LEX_STATES.COMMENT) {
            tokenLength++;
        }

        position++;
    }

    // Process final token if any
    if (currentState !== LEX_STATES.START && tokenLength > 0) {
        const token = processToken(sourceCode, tokenStart, tokenLength, currentState);
        if (token) {
            tokens.push(token);
        }
    }

    // Add end marker
    tokens.push({
        type: TOKEN_TYPES.END,
        value: 0,
        text: '',
        position: position
    });

    return tokens;
}

/**
 * Get next state based on current state and character class
 * @param {number} currentState - Current lexical state
 * @param {number} charClass - Character class
 * @param {number} char - Actual character code
 * @returns {number} Next state
 */
function getNextState(currentState, charClass, char) {
    switch (currentState) {
        case LEX_STATES.START:
            if (charClass === CHAR_CLASSES.LETTER) {
                return LEX_STATES.INSTRUCTION;  // Could be instruction or label
            }
            if (charClass === CHAR_CLASSES.DIGIT) {
                return LEX_STATES.NUMBER;
            }
            if (charClass === CHAR_CLASSES.DOT) {
                return LEX_STATES.DIRECTIVE;
            }
            if (charClass === CHAR_CLASSES.SEMICOLON) {
                return LEX_STATES.COMMENT;
            }
            if (charClass === CHAR_CLASSES.WHITESPACE) {
                return LEX_STATES.START;  // Stay in start for whitespace
            }
            if (charClass === CHAR_CLASSES.COLON) {
                return LEX_STATES.SEPARATOR;
            }
            if (charClass === CHAR_CLASSES.COMMA) {
                return LEX_STATES.SEPARATOR;
            }
            if (charClass === CHAR_CLASSES.BRACKET) {
                return LEX_STATES.SEPARATOR;
            }
            if (charClass === CHAR_CLASSES.INVALID) {
                return LEX_STATES.ERROR;
            }
            break;

        case LEX_STATES.INSTRUCTION:
            if (isIdentifierChar(char)) {
                return LEX_STATES.INSTRUCTION;  // Continue building instruction/label
            }
            if (charClass === CHAR_CLASSES.COLON) {
                return LEX_STATES.LABEL;  // This was a label
            }
            if (charClass === CHAR_CLASSES.WHITESPACE) {
                return LEX_STATES.START;  // End of instruction/label
            }
            break;

        case LEX_STATES.NUMBER:
            if (charClass === CHAR_CLASSES.DIGIT) {
                return LEX_STATES.NUMBER;  // Continue building number
            }
            if (char === 72 || char === 104) {  // 'H' or 'h' for hexadecimal
                return LEX_STATES.HEX_NUMBER;
            }
            if (charClass === CHAR_CLASSES.WHITESPACE) {
                return LEX_STATES.START;  // End of number
            }
            break;

        case LEX_STATES.HEX_NUMBER:
            if (isHexDigit(char)) {
                return LEX_STATES.HEX_NUMBER;  // Continue building hex number
            }
            if (charClass === CHAR_CLASSES.WHITESPACE) {
                return LEX_STATES.START;  // End of hex number
            }
            break;

        case LEX_STATES.DIRECTIVE:
            if (isIdentifierChar(char)) {
                return LEX_STATES.DIRECTIVE;  // Continue building directive
            }
            if (charClass === CHAR_CLASSES.WHITESPACE) {
                return LEX_STATES.START;  // End of directive
            }
            break;

        case LEX_STATES.COMMENT:
            if (charClass === CHAR_CLASSES.WHITESPACE && char === 10) {  // Newline
                return LEX_STATES.START;  // End of comment
            }
            return LEX_STATES.COMMENT;  // Stay in comment

        case LEX_STATES.SEPARATOR:
            return LEX_STATES.START;  // Separators are single characters

        case LEX_STATES.ERROR:
            return LEX_STATES.ERROR;  // Stay in error state
    }

    return LEX_STATES.ERROR;  // Invalid transition
}

/**
 * Process a completed token
 * @param {string} sourceCode - Source code string
 * @param {number} start - Start position of token
 * @param {number} length - Length of token
 * @param {number} state - Final state of token
 * @returns {Object|null} Token object or null if invalid
 */
function processToken(sourceCode, start, length, state) {
    const text = sourceCode.substr(start, length);

    switch (state) {
        case LEX_STATES.INSTRUCTION:
            return classifyInstruction(text);

        case LEX_STATES.NUMBER:
            return {
                type: TOKEN_TYPES.IMMEDIATE,
                subtype: 0,  // Decimal
                value: parseInt(text, 10),
                text: text,
                position: start
            };

        case LEX_STATES.HEX_NUMBER:
            return {
                type: TOKEN_TYPES.IMMEDIATE,
                subtype: 1,  // Hexadecimal
                value: parseInt(text.slice(0, -1), 16),  // Remove 'H' suffix
                text: text,
                position: start
            };

        case LEX_STATES.LABEL:
            return {
                type: TOKEN_TYPES.LABEL,
                subtype: 0,
                value: text.slice(0, -1),  // Remove colon
                text: text,
                position: start
            };

        case LEX_STATES.DIRECTIVE:
            return {
                type: TOKEN_TYPES.DIRECTIVE,
                subtype: 0,
                value: text,
                text: text,
                position: start
            };

        case LEX_STATES.SEPARATOR:
            return {
                type: TOKEN_TYPES.SEPARATOR,
                subtype: classifySeparator(text),
                value: text.charCodeAt(0),
                text: text,
                position: start
            };

        case LEX_STATES.COMMENT:
            return {
                type: TOKEN_TYPES.COMMENT,
                subtype: 0,
                value: text,
                text: text,
                position: start
            };

        default:
            return null;
    }
}

/**
 * Classify instruction mnemonic
 * @param {string} text - Instruction text
 * @returns {Object|null} Instruction token or null if invalid
 */
function classifyInstruction(text) {
    // Standard OrionRisc-128 instructions
    const instructions = {
        'LOAD': { opcode: 0x01, subtype: 0 },
        'STORE': { opcode: 0x02, subtype: 0 },
        'ADD': { opcode: 0x03, subtype: 0 },
        'SUB': { opcode: 0x04, subtype: 0 },
        'JUMP': { opcode: 0x06, subtype: 0 },
        'CALL': { opcode: 0x07, subtype: 0 },
        'RET': { opcode: 0x08, subtype: 0 },
        'HALT': { opcode: 0xFF, subtype: 0 },
        'SYSCALL': { opcode: 0x05, subtype: 0 },
        'NOP': { opcode: 0x00, subtype: 0 }
    };

    const upperText = text.toUpperCase();
    if (instructions.hasOwnProperty(upperText)) {
        return {
            type: TOKEN_TYPES.INSTRUCTION,
            subtype: instructions[upperText].subtype,
            value: instructions[upperText].opcode,
            text: text,
            position: 0  // Would be set by caller
        };
    }

    return null;  // Not a valid instruction
}

/**
 * Classify separator character
 * @param {string} text - Separator text
 * @returns {number} Separator subtype
 */
function classifySeparator(text) {
    switch (text) {
        case ',': return 1;  // Comma
        case '[': return 2;  // Left bracket
        case ']': return 3;  // Right bracket
        case ':': return 4;  // Colon
        default: return 0;   // Unknown separator
    }
}

// ============================================================================
// MACHINE LANGUAGE IMPLEMENTATION HELPERS
// ============================================================================

/**
 * Generate machine language instructions for character classification
 * @param {number} charClassTableAddress - Memory address of character class table
 * @returns {Array} Machine language instructions for character classification
 */
function generateCharacterClassificationCode(charClassTableAddress) {
    const code = [];

    // Character classification subroutine
    // Input: R7 = character
    // Output: R11 = character class

    // Create lookup table in memory for character classes
    // This would be loaded at charClassTableAddress

    // Main classification logic:
    // 1. Check ranges for letters, digits
    // 2. Check specific characters
    // 3. Return appropriate class

    return code;
}

/**
 * Generate machine language instructions for state machine
 * @param {number} stateTableAddress - Memory address for state transition table
 * @returns {Array} Machine language instructions for state machine
 */
function generateStateMachineCode(stateTableAddress) {
    const code = [];

    // State machine implementation:
    // 1. Load current state from memory
    // 2. Load character class
    // 3. Calculate state table offset: state * num_classes + class
    // 4. Load next state from table
    // 5. Store next state back to memory
    // 6. Handle token processing based on state change

    return code;
}

/**
 * Generate machine language instructions for token processing
 * @returns {Array} Machine language instructions for token handling
 */
function generateTokenProcessingCode() {
    const code = [];

    // Token processing logic:
    // 1. Check if state changed
    // 2. If so, process completed token
    // 3. Start new token if needed
    // 4. Update token accumulator

    return code;
}

// ============================================================================
// TOKEN OUTPUT FORMAT
// ============================================================================

/**
 * Pack token data into 32-bit format for memory storage
 * @param {number} type - Token type (4 bits)
 * @param {number} subtype - Token subtype (4 bits)
 * @param {number} length - Token length (8 bits)
 * @param {number} value - Token value (16 bits)
 * @returns {number} Packed 32-bit token data
 */
function packToken(type, subtype, length, value) {
    return ((type & 0xF) << 28) |
           ((subtype & 0xF) << 24) |
           ((length & 0xFF) << 16) |
           (value & 0xFFFF);
}

/**
 * Unpack token data from 32-bit format
 * @param {number} packedToken - Packed token data
 * @returns {Object} Unpacked token object
 */
function unpackToken(packedToken) {
    return {
        type: (packedToken >> 28) & 0xF,
        subtype: (packedToken >> 24) & 0xF,
        length: (packedToken >> 16) & 0xFF,
        value: packedToken & 0xFFFF
    };
}

// ============================================================================
// TESTING AND VALIDATION
// ============================================================================

/**
 * Test the lexical analyzer with sample assembly code
 * @returns {Array} Test results
 */
function testLexicalAnalyzer() {
    const testCases = [
        {
            name: "Simple instruction",
            input: "LOAD R0, 42",
            expectedTokens: 3  // LOAD, R0, 42
        },
        {
            name: "Label definition",
            input: "main:",
            expectedTokens: 1  // main label
        },
        {
            name: "Directive",
            input: ".text",
            expectedTokens: 1  // .text directive
        },
        {
            name: "Comment",
            input: "; This is a comment",
            expectedTokens: 1  // comment token
        },
        {
            name: "Hexadecimal number",
            input: "0FFH",
            expectedTokens: 1  // hex number token
        }
    ];

    const results = [];

    for (const testCase of testCases) {
        try {
            const tokens = lexicalAnalysis(testCase.input);

            results.push({
                name: testCase.name,
                input: testCase.input,
                expected: testCase.expectedTokens,
                actual: tokens.length - 1,  // Subtract end marker
                passed: tokens.length - 1 === testCase.expectedTokens,
                tokens: tokens
            });

            console.log(`Test: ${testCase.name}`);
            console.log(`  Input: "${testCase.input}"`);
            console.log(`  Expected: ${testCase.expectedTokens} tokens`);
            console.log(`  Actual: ${tokens.length - 1} tokens`);
            console.log(`  Tokens:`, tokens.slice(0, -1).map(t => `${TOKEN_TYPES[t.type]}:${t.text || t.value}`));

        } catch (error) {
            results.push({
                name: testCase.name,
                input: testCase.input,
                error: error.message,
                passed: false
            });
        }
    }

    return results;
}

// ============================================================================
// INTEGRATION WITH MACHINE LANGUAGE PROGRAM
// ============================================================================

/**
 * Generate complete machine language program for lexical analysis
 * @param {number} baseAddress - Base memory address for program
 * @returns {Array} Complete machine language program
 */
function generateCompleteLexicalAnalyzerProgram(baseAddress = 0x0000) {
    const program = [];

    // Program would include:
    // 1. Initialization code
    // 2. Main analysis loop
    // 3. Character classification subroutine
    // 4. State machine subroutine
    // 5. Token processing subroutine
    // 6. String handling subroutine
    // 7. Error handling

    // For now, return placeholder program
    // LEXICAL_ANALYZER_PROGRAM would be imported from lexical-analyzer.js in the actual system
    return [];
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        classifyCharacter,
        isHexDigit,
        isIdentifierStart,
        isIdentifierChar,
        lexicalAnalysis,
        getNextState,
        processToken,
        classifyInstruction,
        classifySeparator,
        packToken,
        unpackToken,
        testLexicalAnalyzer,
        generateCompleteLexicalAnalyzerProgram,
        LEX_STATES,
        CHAR_CLASSES,
        TOKEN_TYPES
    };
}

module.exports = {
    lexicalAnalysis,
    testLexicalAnalyzer,
    classifyCharacter,
    packToken,
    unpackToken
};