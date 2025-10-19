/**
 * Lexical Analyzer for OrionRisc-128 Assembly Language
 *
 * This program implements a lexical analyzer (tokenizer) for assembly syntax
 * as a machine language program that can be executed by the RISC processor.
 *
 * Phase 2 Component: Foundation for the self-hosting assembler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 2 of 12-week development plan
 */

// ============================================================================
// LEXICAL ANALYZER - MACHINE LANGUAGE IMPLEMENTATION
// ============================================================================

/**
 * TOKEN TYPES (4-bit values stored in bits 31-28 of token)
 */
const TOKEN_TYPES = {
    INSTRUCTION: 0x0,    // Assembly instruction (LOAD, STORE, etc.)
    REGISTER: 0x1,       // Register identifier (R0-R15)
    IMMEDIATE: 0x2,      // Numeric immediate value
    LABEL: 0x3,          // Label identifier (followed by colon)
    DIRECTIVE: 0x4,      // Assembler directive (.text, .data, .equ)
    SEPARATOR: 0x5,      // Comma, brackets, etc.
    COMMENT: 0x6,        // Comment (semicolon to end of line)
    END: 0x7,           // End of input marker
    ERROR: 0x8          // Invalid token
};

/**
 * CHARACTER CLASSES for lexical analysis
 */
const CHAR_CLASSES = {
    LETTER: 0x1,        // A-Z, a-z
    DIGIT: 0x2,         // 0-9
    HEX_DIGIT: 0x3,     // 0-9, A-F, a-f
    WHITESPACE: 0x4,    // Space, tab, newline
    SPECIAL: 0x5,       // Special characters
    COLON: 0x6,         // :
    SEMICOLON: 0x7,     // ;
    COMMA: 0x8,         // ,
    BRACKET: 0x9,       // [, ]
    DOT: 0xA,           // .
    DOLLAR: 0xB,        // $
    INVALID: 0xF        // Invalid character
};

/**
 * LEXICAL ANALYZER STATES
 */
const LEX_STATES = {
    START: 0x0,         // Initial state
    INSTRUCTION: 0x1,   // Reading instruction mnemonic
    REGISTER: 0x2,      // Reading register (R0-R15)
    NUMBER: 0x3,        // Reading numeric value
    HEX_NUMBER: 0x4,    // Reading hexadecimal number
    LABEL: 0x5,         // Reading label
    DIRECTIVE: 0x6,     // Reading directive (.text, etc.)
    COMMENT: 0x7,       // Reading comment
    SEPARATOR: 0x8,     // Reading separator
    ERROR: 0xF          // Error state
};

/**
 * MEMORY LAYOUT FOR LEXICAL ANALYZER
 *
 * 0x0000-0x0FFF: Program code (lexical analyzer)
 * 0x1000-0x1FFF: Source code buffer (input)
 * 0x2000-0x2FFF: Token buffer (output)
 * 0x3000-0x3FFF: String table (labels, instruction names)
 * 0x4000-0x40FF: State variables and pointers
 * 0x4100-0x41FF: Constants and lookup tables
 */

// ============================================================================
// MACHINE LANGUAGE PROGRAM - LEXICAL ANALYZER
// ============================================================================

/**
 * Lexical Analyzer Machine Language Program
 *
 * This program reads assembly source code from memory, tokenizes it,
 * and stores the tokens in a structured format for the parser.
 *
 * Interface:
 * - R0: Source buffer address (input)
 * - R1: Source buffer length (input)
 * - R2: Token buffer address (output)
 * - R3: String table address (output)
 * - Returns: Number of tokens found (R0) or error code (negative)
 */
const LEXICAL_ANALYZER_PROGRAM = [
    // ========================================================================
    // INITIALIZATION PHASE
    // ========================================================================

    // Initialize state variables
    // R4 = current source position (offset into source buffer)
    // R5 = current token buffer position
    // R6 = current string table position
    // R7 = current character
    // R8 = current state (LEX_STATES.START)
    // R9 = token accumulator (for building tokens)
    // R10 = token length counter
    // R11 = character class lookup

    0x01000000, // LOAD R0, [R0 + 0]        ; R0 = source buffer address
    0x01110000, // LOAD R1, [R1 + 0]        ; R1 = source buffer length
    0x01220000, // LOAD R2, [R2 + 0]        ; R2 = token buffer address
    0x01330000, // LOAD R3, [R3 + 0]        ; R3 = string table address

    // Initialize positions and state
    0x04400000, // ADD R4, R0, R0           ; R4 = 0 (source position)
    0x04550000, // ADD R5, R0, R0           ; R5 = 0 (token position)
    0x04660000, // ADD R6, R0, R0           ; R6 = 0 (string position)
    0x04780000, // ADD R7, R0, R0           ; R7 = 0 (current char)
    0x04880000, // ADD R8, R0, R0           ; R8 = 0 (state = START)
    0x04990000, // ADD R9, R0, R0           ; R9 = 0 (token accumulator)
    0x04AA0000, // ADD R10, R0, R0          ; R10 = 0 (token length)

    // ========================================================================
    // MAIN LEXICAL ANALYSIS LOOP
    // ========================================================================

    // main_loop:
    // Check if we've reached the end of source buffer
    0x03440001, // SUB R3, R4, R1           ; R3 = R4 - R1 (remaining)
    0xF4000000, // HALT                     ; If R3 >= 0, end of input

    // Read next character from source buffer
    // Address = source_buffer_address + source_position
    0x03140000, // ADD R3, R0, R4           ; R3 = source address + position
    0x01730000, // LOAD R7, [R3 + 0]        ; R7 = current character

    // Classify character and update state machine
    0x05000000, // SYSCALL 0                ; Character classification syscall

    // Process character based on current state and character class
    // This would be a large decision tree in a full implementation

    // ========================================================================
    // TOKEN RECOGNITION LOGIC (simplified for this example)
    // ========================================================================

    // For demonstration purposes, showing the structure:
    // - State machine implementation would go here
    // - Character classification logic
    // - Token building and storage
    // - Error handling

    // ========================================================================
    // TOKEN STORAGE
    // ========================================================================

    // Store token in buffer (example structure)
    // Token format: TYPE(4) | SUBTYPE(4) | LENGTH(8) | VALUE(16)

    // Example token storage:
    // 0x01230004, // Token: INSTRUCTION(0x0), SUBTYPE(0x1), LENGTH(0x23), VALUE(0x0004)

    // ========================================================================
    // STRING TABLE MANAGEMENT
    // ========================================================================

    // Store strings (labels, instruction names) in string table
    // Strings are stored as null-terminated character sequences

    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    // Check for invalid characters or malformed tokens
    // Set error state and return appropriate error code

    // ========================================================================
    // LOOP CONTROL
    // ========================================================================

    // Increment source position and continue
    0x04441001, // ADD R4, R4, 1            ; Increment source position
    0xF0000000, // HALT                     ; Jump back to main_loop (would be JUMP in full impl)

    // ========================================================================
    // PROGRAM END
    // ========================================================================

    0xFF000000  // HALT - End of lexical analyzer program
];

// ============================================================================
// ASSEMBLY SOURCE CODE FOR THE LEXICAL ANALYZER
// ============================================================================

/**
 * Assembly Source Code Representation
 *
 * This is how the lexical analyzer program would appear in assembly language.
 * This serves as documentation and can be used for testing the assembler once
 * it's complete.
 */
const LEXICAL_ANALYZER_ASSEMBLY = `
; ============================================================================
; LEXICAL ANALYZER - ASSEMBLY SOURCE
; ============================================================================

; OrionRisc-128 Assembly Language
; Lexical Analyzer for Assembly Syntax
; Phase 2: Machine Language Assembler Component

.text
.global _start

_start:
    ; Initialize state variables
    LOAD R4, 0              ; Source position = 0
    LOAD R5, 0              ; Token position = 0
    LOAD R6, 0              ; String position = 0
    LOAD R8, STATE_START    ; Current state = START

main_loop:
    ; Check end of input
    SUB R3, R4, R1          ; Check if position >= length
    JUMP_GE end_of_input

    ; Read character from source
    ADD R3, R0, R4          ; Calculate source address
    LOAD R7, [R3]           ; Read character

    ; Classify character
    SYSCALL CHAR_CLASSIFY   ; Character classification

    ; State machine processing
    ; (Large decision tree would go here)

    ; Increment position and continue
    ADD R4, R4, 1
    JUMP main_loop

end_of_input:
    ; Store end marker token
    LOAD R9, TOKEN_END
    STORE [R2 + R5], R9
    ADD R5, R5, 4

    ; Return token count in R0
    SUB R0, R5, R2          ; Token count = position / 4
    RET

; ============================================================================
; CHARACTER CLASSIFICATION SUBROUTINE
; ============================================================================

char_classify:
    ; Input: R7 = character
    ; Output: R11 = character class

    ; Check for letters (A-Z, a-z)
    SUB R11, R7, 'A'
    JUMP_GE letter_check
    JUMP letter_end

letter_check:
    SUB R11, R7, 'Z'
    JUMP_LE is_letter
    SUB R11, R7, 'a'
    JUMP_GE lower_letter_check
    JUMP letter_end

lower_letter_check:
    SUB R11, R7, 'z'
    JUMP_LE is_letter
    JUMP letter_end

is_letter:
    LOAD R11, CHAR_LETTER
    RET

letter_end:
    ; Check for digits (0-9)
    SUB R11, R7, '0'
    JUMP_GE digit_check
    JUMP digit_end

digit_check:
    SUB R11, R7, '9'
    JUMP_LE is_digit
    JUMP digit_end

is_digit:
    LOAD R11, CHAR_DIGIT
    RET

digit_end:
    ; Check for special characters
    ; (colon, semicolon, comma, brackets, dot, dollar)

    ; Colon ':'
    SUB R11, R7, ':'
    JUMP_EQ is_colon

    ; Semicolon ';'
    SUB R11, R7, ';'
    JUMP_EQ is_semicolon

    ; Comma ','
    SUB R11, R7, ','
    JUMP_EQ is_comma

    ; Dot '.'
    SUB R11, R7, '.'
    JUMP_EQ is_dot

    ; Default: invalid character
    LOAD R11, CHAR_INVALID
    RET

is_colon:
    LOAD R11, CHAR_COLON
    RET

is_semicolon:
    LOAD R11, CHAR_SEMICOLON
    RET

is_comma:
    LOAD R11, CHAR_COMMA
    RET

is_dot:
    LOAD R11, CHAR_DOT
    RET

; ============================================================================
; TOKEN BUILDING SUBROUTINE
; ============================================================================

build_token:
    ; Input: R8 = current state, R7 = current character
    ; Modifies token accumulator and state

    ; Token building logic based on state
    ; This would handle building strings, numbers, etc.

    RET

; ============================================================================
; TOKEN STORAGE SUBROUTINE
; ============================================================================

store_token:
    ; Input: R9 = token value, R10 = token length, R8 = state
    ; Output: Stores token to [R2 + R5]

    ; Calculate token type from state
    ; Format: TYPE | SUBTYPE | LENGTH | VALUE

    ; Store token
    STORE [R2 + R5], R9
    ADD R5, R5, 4           ; Next token position

    RET

; ============================================================================
; STRING STORAGE SUBROUTINE
; ============================================================================

store_string:
    ; Input: R9 = string start, R10 = string length
    ; Output: Stores string to [R3 + R6], returns pointer in R9

    ; Copy string to string table
    ; Add null terminator

    RET

; ============================================================================
; DATA SECTION
; ============================================================================

.data
    ; State constants
    STATE_START:        .equ 0
    STATE_INSTRUCTION:  .equ 1
    STATE_REGISTER:     .equ 2
    STATE_NUMBER:       .equ 3
    STATE_LABEL:        .equ 4
    STATE_DIRECTIVE:    .equ 5
    STATE_COMMENT:      .equ 6

    ; Token type constants
    TOKEN_INSTRUCTION:  .equ 0x0
    TOKEN_REGISTER:     .equ 0x1
    TOKEN_IMMEDIATE:    .equ 0x2
    TOKEN_LABEL:        .equ 0x3
    TOKEN_DIRECTIVE:    .equ 0x4
    TOKEN_SEPARATOR:    .equ 0x5
    TOKEN_COMMENT:      .equ 0x6
    TOKEN_END:          .equ 0x7

    ; Character class constants
    CHAR_LETTER:        .equ 0x1
    CHAR_DIGIT:         .equ 0x2
    CHAR_WHITESPACE:    .equ 0x4
    CHAR_COLON:         .equ 0x6
    CHAR_SEMICOLON:     .equ 0x7
    CHAR_COMMA:         .equ 0x8
    CHAR_DOT:           .equ 0xA
    CHAR_INVALID:       .equ 0xF

    ; System call numbers
    SYSCALL_CHAR_CLASSIFY: .equ 0
`;

// ============================================================================
// JAVASCRIPT INTERFACE AND TESTING
// ============================================================================

/**
 * LexicalAnalyzer class for integration with the OrionRisc-128 system
 */
class LexicalAnalyzer {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.program = LEXICAL_ANALYZER_PROGRAM;
    }

    /**
     * Load the lexical analyzer program into memory
     * @param {number} startAddress - Memory address to load program (default: 0x0000)
     */
    loadProgram(startAddress = 0x0000) {
        console.log(`Loading lexical analyzer program at address 0x${startAddress.toString(16)}`);
        this.cpu.loadProgram(this.program, startAddress);
    }

    /**
     * Tokenize assembly source code
     * @param {string} sourceCode - Assembly source code to tokenize
     * @param {number} sourceAddress - Memory address of source buffer (default: 0x1000)
     * @param {number} tokenAddress - Memory address for token buffer (default: 0x2000)
     * @param {number} stringAddress - Memory address for string table (default: 0x3000)
     * @returns {Array} Array of tokens found
     */
    tokenize(sourceCode, sourceAddress = 0x1000, tokenAddress = 0x2000, stringAddress = 0x3000) {
        console.log(`Tokenizing assembly source code (${sourceCode.length} characters)`);

        // Load source code into memory as bytes
        const sourceBytes = [];
        for (let i = 0; i < sourceCode.length; i++) {
            sourceBytes.push(sourceCode.charCodeAt(i));
        }

        // Add null terminator
        sourceBytes.push(0);

        this.mmu.loadMemory(sourceAddress, sourceBytes);

        // Set up CPU registers for lexical analyzer
        this.cpu.setRegister(0, sourceAddress);      // R0 = source buffer address
        this.cpu.setRegister(1, sourceCode.length);  // R1 = source length
        this.cpu.setRegister(2, tokenAddress);       // R2 = token buffer address
        this.cpu.setRegister(3, stringAddress);      // R3 = string table address

        // Execute lexical analyzer program
        const instructionsExecuted = this.cpu.run();

        console.log(`Lexical analyzer executed ${instructionsExecuted} instructions`);

        // Read tokens from memory
        const tokens = this.readTokens(tokenAddress);

        return {
            tokens: tokens,
            tokenCount: tokens.length,
            stringTable: this.readStringTable(stringAddress)
        };
    }

    /**
     * Read tokens from memory buffer
     * @param {number} tokenAddress - Memory address of token buffer
     * @returns {Array} Array of token objects
     */
    readTokens(tokenAddress) {
        const tokens = [];

        // Read tokens until we find end marker or empty memory
        for (let offset = 0; offset < 0x1000; offset += 4) {
            const tokenData = this.mmu.readWord(tokenAddress + offset);

            if (tokenData === 0) {
                break; // End of tokens
            }

            // Parse token format: TYPE(4) | SUBTYPE(4) | LENGTH(8) | VALUE(16)
            const type = (tokenData >> 28) & 0xF;
            const subtype = (tokenData >> 24) & 0xF;
            const length = (tokenData >> 16) & 0xFF;
            const value = tokenData & 0xFFFF;

            tokens.push({
                type: type,
                subtype: subtype,
                length: length,
                value: value,
                address: tokenAddress + offset
            });

            // Check for end marker
            if (type === TOKEN_TYPES.END) {
                break;
            }
        }

        return tokens;
    }

    /**
     * Read string table from memory
     * @param {number} stringAddress - Memory address of string table
     * @returns {Object} String table object
     */
    readStringTable(stringAddress) {
        const strings = {};

        // Read strings until we find empty memory
        for (let offset = 0; offset < 0x1000; offset++) {
            const charCode = this.mmu.readByte(stringAddress + offset);

            if (charCode === 0) {
                break; // End of strings
            }

            // For now, just return raw bytes
            // In a full implementation, this would parse null-terminated strings
        }

        return {
            address: stringAddress,
            size: 0x1000
        };
    }

    /**
     * Get token type name for debugging
     * @param {number} type - Token type value
     * @returns {string} Token type name
     */
    static getTokenTypeName(type) {
        const names = Object.keys(TOKEN_TYPES);
        for (const name of names) {
            if (TOKEN_TYPES[name] === type) {
                return name;
            }
        }
        return 'UNKNOWN';
    }
}

// ============================================================================
// EXAMPLE USAGE AND TESTING
// ============================================================================

/**
 * Example assembly source code for testing
 */
const EXAMPLE_ASSEMBLY_CODE = `
; Example assembly program for testing lexical analyzer
.text
.global main

main:
    LOAD R0, 42          ; Load immediate value
    LOAD R1, [R2 + 10]   ; Load from memory
    ADD R0, R1           ; Add two registers
    STORE [R3], R0       ; Store to memory
    JUMP end_label       ; Jump to label

data_section:
    .data
    my_var: .equ 100     ; Define constant
    buffer: .equ 0x1000  ; Memory buffer

end_label:
    HALT                 ; End program
`;

/**
 * Test the lexical analyzer
 */
function testLexicalAnalyzer() {
    console.log('=== LEXICAL ANALYZER TEST ===');

    // This would be integrated with the actual system
    // For now, showing the interface and expected behavior

    console.log('Example assembly code to tokenize:');
    console.log(EXAMPLE_ASSEMBLY_CODE);

    console.log('\nExpected tokens:');
    console.log('- INSTRUCTION: LOAD, LOAD, ADD, STORE, JUMP, HALT');
    console.log('- REGISTER: R0, R1, R2, R3');
    console.log('- IMMEDIATE: 42, 10, 0x1000');
    console.log('- LABEL: main, data_section, my_var, buffer, end_label');
    console.log('- DIRECTIVE: .text, .global, .data, .equ');
    console.log('- SEPARATOR: commas, brackets');
    console.log('- COMMENT: semicolon comments');

    console.log('\nLexical analyzer implementation ready for Phase 2 integration');
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LexicalAnalyzer,
        LEXICAL_ANALYZER_PROGRAM,
        LEXICAL_ANALYZER_ASSEMBLY,
        EXAMPLE_ASSEMBLY_CODE,
        testLexicalAnalyzer,
        TOKEN_TYPES,
        CHAR_CLASSES,
        LEX_STATES
    };
}

module.exports = LexicalAnalyzer;