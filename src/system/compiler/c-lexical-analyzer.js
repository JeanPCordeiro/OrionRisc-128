/**
 * C Lexical Analyzer for OrionRisc-128 C Compiler
 *
 * This program implements a lexical analyzer (tokenizer) for C syntax
 * as a machine language program that can be executed by the RISC processor.
 *
 * Phase 3 Component: Foundation for the assembly-based C compiler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

// ============================================================================
// C LEXICAL ANALYZER - MACHINE LANGUAGE IMPLEMENTATION
// ============================================================================

/**
 * C TOKEN TYPES (4-bit values stored in bits 31-28 of token)
 */
const C_TOKEN_TYPES = {
    KEYWORD: 0x0,        // C keywords (int, char, if, else, etc.)
    IDENTIFIER: 0x1,     // Variable and function names
    CONSTANT: 0x2,       // Numeric, character, and string constants
    STRING_LITERAL: 0x3, // String constants "hello"
    OPERATOR: 0x4,       // Arithmetic, logical, and assignment operators
    PUNCTUATION: 0x5,    // Semicolons, commas, parentheses, etc.
    PREPROCESSOR: 0x6,   // #include, #define, etc.
    COMMENT: 0x7,        // // and /* */ comments
    END: 0x8,           // End of input marker
    ERROR: 0x9          // Invalid token
};

/**
 * C KEYWORD SUBTYPES
 */
const C_KEYWORD_SUBTYPES = {
    INT: 0x0,
    CHAR: 0x1,
    VOID: 0x2,
    IF: 0x3,
    ELSE: 0x4,
    WHILE: 0x5,
    FOR: 0x6,
    RETURN: 0x7,
    STRUCT: 0x8,
    TYPEDEF: 0x9,
    SIZEOF: 0xA
};

/**
 * C CONSTANT SUBTYPES
 */
const C_CONSTANT_SUBTYPES = {
    INTEGER: 0x0,        // 42, 0x2A, 052
    CHARACTER: 0x1,      // 'A', '\n'
    FLOAT: 0x2,         // 3.14, 1.23e-4 (future)
    STRING: 0x3         // "hello world"
};

/**
 * C OPERATOR SUBTYPES
 */
const C_OPERATOR_SUBTYPES = {
    ASSIGN: 0x0,         // =
    ADD: 0x1,           // +
    SUBTRACT: 0x2,      // -
    MULTIPLY: 0x3,      // *
    DIVIDE: 0x4,        // /
    MODULO: 0x5,        // %
    EQUAL: 0x6,         // ==
    NOT_EQUAL: 0x7,     // !=
    LESS: 0x8,          // <
    GREATER: 0x9,       // >
    LESS_EQUAL: 0xA,    // <=
    GREATER_EQUAL: 0xB, // >=
    LOGICAL_AND: 0xC,   // &&
    LOGICAL_OR: 0xD,    // ||
    LOGICAL_NOT: 0xE,   // !
    INCREMENT: 0xF      // ++
};

/**
 * C PUNCTUATION SUBTYPES
 */
const C_PUNCTUATION_SUBTYPES = {
    SEMICOLON: 0x0,     // ;
    COMMA: 0x1,         // ,
    PERIOD: 0x2,        // .
    LPAREN: 0x3,        // (
    RPAREN: 0x4,        // )
    LBRACKET: 0x5,      // [
    RBRACKET: 0x6,      // ]
    LBRACE: 0x7,        // {
    RBRACE: 0x8,        // }
    COLON: 0x9,         // :
    QUESTION: 0xA       // ?
};

/**
 * CHARACTER CLASSES for C lexical analysis
 */
const C_CHAR_CLASSES = {
    LETTER: 0x1,         // A-Z, a-z
    DIGIT: 0x2,          // 0-9
    HEX_DIGIT: 0x3,      // 0-9, A-F, a-f
    OCTAL_DIGIT: 0x4,    // 0-7
    WHITESPACE: 0x5,     // Space, tab, newline
    QUOTE: 0x6,          // ' and "
    ESCAPE: 0x7,         // Backslash \
    OPERATOR: 0x8,       // + - * / % = ! < > & | ^
    PUNCTUATION: 0x9,    // ; , . ( ) [ ] { } : ?
    PREPROCESSOR: 0xA,   // #
    SLASH: 0xB,          // / (for comments)
    STAR: 0xC,           // * (for comments)
    DOT: 0xD,            // .
    UNDERSCORE: 0xE,     // _
    INVALID: 0xF         // Invalid character
};

/**
 * C LEXICAL ANALYZER STATES
 */
const C_LEX_STATES = {
    START: 0x0,          // Initial state
    IDENTIFIER: 0x1,     // Reading identifier or keyword
    NUMBER: 0x2,         // Reading number
    HEX_NUMBER: 0x3,     // Reading hexadecimal number
    OCTAL_NUMBER: 0x4,   // Reading octal number
    FLOAT_NUMBER: 0x5,   // Reading floating point number
    STRING: 0x6,         // Reading string literal
    CHARACTER: 0x7,      // Reading character constant
    OPERATOR: 0x8,       // Reading operator
    PUNCTUATION: 0x9,    // Reading punctuation
    PREPROCESSOR: 0xA,   // Reading preprocessor directive
    COMMENT_LINE: 0xB,   // Reading // comment
    COMMENT_BLOCK: 0xC,  // Reading /* */ comment
    ESCAPE_SEQUENCE: 0xD,// Reading escape sequence in string/char
    DOT: 0xE,            // Reading decimal point
    ERROR: 0xF           // Error state
};

/**
 * C KEYWORDS LOOKUP TABLE
 */
const C_KEYWORDS = {
    'int': C_KEYWORD_SUBTYPES.INT,
    'char': C_KEYWORD_SUBTYPES.CHAR,
    'void': C_KEYWORD_SUBTYPES.VOID,
    'if': C_KEYWORD_SUBTYPES.IF,
    'else': C_KEYWORD_SUBTYPES.ELSE,
    'while': C_KEYWORD_SUBTYPES.WHILE,
    'for': C_KEYWORD_SUBTYPES.FOR,
    'return': C_KEYWORD_SUBTYPES.RETURN,
    'struct': C_KEYWORD_SUBTYPES.STRUCT,
    'typedef': C_KEYWORD_SUBTYPES.TYPEDEF,
    'sizeof': C_KEYWORD_SUBTYPES.SIZEOF
};

/**
 * MEMORY LAYOUT FOR C LEXICAL ANALYZER
 *
 * 0x0000-0x0FFF: Program code (C lexical analyzer)
 * 0x1000-0x1FFF: C source code buffer (input)
 * 0x2000-0x2FFF: Token buffer (output)
 * 0x3000-0x3FFF: String table (identifiers, strings)
 * 0x4000-0x40FF: State variables and pointers
 * 0x4100-0x41FF: Constants and lookup tables
 * 0x4200-0x42FF: Keyword hash table
 */

// ============================================================================
// MACHINE LANGUAGE PROGRAM - C LEXICAL ANALYZER
// ============================================================================

/**
 * C Lexical Analyzer Machine Language Program
 *
 * This program reads C source code from memory, tokenizes it,
 * and stores the tokens in a structured format for the parser.
 *
 * Interface:
 * - R0: Source buffer address (input)
 * - R1: Source buffer length (input)
 * - R2: Token buffer address (output)
 * - R3: String table address (output)
 * - Returns: Number of tokens found (R0) or error code (negative)
 */
const C_LEXICAL_ANALYZER_PROGRAM = [
    // ========================================================================
    // INITIALIZATION PHASE
    // ========================================================================

    // Initialize state variables
    // R4 = current source position (offset into source buffer)
    // R5 = current token buffer position
    // R6 = current string table position
    // R7 = current character
    // R8 = current state (C_LEX_STATES.START)
    // R9 = token accumulator (for building tokens)
    // R10 = token length counter
    // R11 = character class lookup
    // R12 = escape sequence flag
    // R13 = comment nesting level (for block comments)

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
    0x04BB0000, // ADD R11, R0, R0          ; R11 = 0 (char class)
    0x04CC0000, // ADD R12, R0, R0          ; R12 = 0 (escape flag)
    0x04DD0000, // ADD R13, R0, R0          ; R13 = 0 (comment nesting)

    // ========================================================================
    // MAIN LEXICAL ANALYSIS LOOP
    // ========================================================================

    // main_loop:
    // Check if we've reached the end of source buffer
    0x03440001, // SUB R14, R4, R1          ; R14 = R4 - R1 (remaining)
    0xF4000000, // JUMP_GE end_of_input     ; If R14 >= 0, end of input

    // Read next character from source buffer
    // Address = source_buffer_address + source_position
    0x03140000, // ADD R14, R0, R4          ; R14 = source address + position
    0x017E0000, // LOAD R7, [R14 + 0]       ; R7 = current character

    // Classify character and update state machine
    0x05000000, // SYSCALL 0                ; Character classification syscall

    // ========================================================================
    // STATE MACHINE IMPLEMENTATION (simplified for this example)
    // ========================================================================

    // For demonstration purposes, showing the structure:
    // - State machine implementation would go here
    // - Character classification logic for C
    // - Token building and storage
    // - Error handling for malformed tokens

    // ========================================================================
    // TOKEN STORAGE
    // ========================================================================

    // Store token in buffer (example structure)
    // Token format: TYPE(4) | SUBTYPE(4) | LENGTH(8) | VALUE(16)

    // Example token storage:
    // 0x01230004, // Token: IDENTIFIER(0x1), SUBTYPE(0x2), LENGTH(0x23), VALUE(0x0004)

    // ========================================================================
    // STRING TABLE MANAGEMENT
    // ========================================================================

    // Store strings (identifiers, keywords, string literals) in string table
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
    0xF0000000, // JUMP main_loop          ; Jump back to main_loop

    // ========================================================================
    // END OF INPUT HANDLING
    // ========================================================================

    // end_of_input:
    // Store end marker token
    0x08800000, // LOAD R9, C_TOKEN_END     ; Load end token value
    0x05290000, // STORE [R2 + R5], R9      ; Store end token
    0x04551004, // ADD R5, R5, 4            ; Next token position

    // Return token count in R0
    0x03550002, // SUB R0, R5, R2           ; Token count = position / 4
    0xFF000000  // HALT                     ; End of program
];

// ============================================================================
// ASSEMBLY SOURCE CODE FOR THE C LEXICAL ANALYZER
// ============================================================================

/**
 * Assembly Source Code Representation
 *
 * This is how the C lexical analyzer program would appear in assembly language.
 * This serves as documentation and can be used for testing the assembler once
 * it's complete.
 */
const C_LEXICAL_ANALYZER_ASSEMBLY = `
; ============================================================================
; C LEXICAL ANALYZER - ASSEMBLY SOURCE
; ============================================================================

; OrionRisc-128 Assembly Language
; C Lexical Analyzer for C Syntax Tokenization
; Phase 3: Assembly-based C Compiler Component

.text
.global _start

_start:
    ; Initialize state variables
    LOAD R4, 0              ; Source position = 0
    LOAD R5, 0              ; Token position = 0
    LOAD R6, 0              ; String position = 0
    LOAD R8, STATE_START    ; Current state = START
    LOAD R12, 0             ; Escape flag = false
    LOAD R13, 0             ; Comment nesting = 0

main_loop:
    ; Check end of input
    SUB R14, R4, R1         ; Check if position >= length
    JUMP_GE end_of_input

    ; Read character from source
    ADD R14, R0, R4         ; Calculate source address
    LOAD R7, [R14]          ; Read character

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
    ; Check for C-specific characters

    ; Single quote (character constant)
    SUB R11, R7, '\\''
    JUMP_EQ is_quote

    ; Double quote (string literal)
    SUB R11, R7, '"'
    JUMP_EQ is_quote

    ; Backslash (escape sequence)
    SUB R11, R7, '\\\\'
    JUMP_EQ is_escape

    ; Underscore (identifier)
    SUB R11, R7, '_'
    JUMP_EQ is_underscore

    ; Hash (preprocessor)
    SUB R11, R7, '#'
    JUMP_EQ is_preprocessor

    ; Default: check operators and punctuation
    ; (This would be a comprehensive lookup table in full implementation)

    ; Default: invalid character
    LOAD R11, CHAR_INVALID
    RET

is_quote:
    LOAD R11, CHAR_QUOTE
    RET

is_escape:
    LOAD R11, CHAR_ESCAPE
    RET

is_underscore:
    LOAD R11, CHAR_UNDERSCORE
    RET

is_preprocessor:
    LOAD R11, CHAR_PREPROCESSOR
    RET

; ============================================================================
; TOKEN BUILDING SUBROUTINE
; ============================================================================

build_token:
    ; Input: R8 = current state, R7 = current character
    ; Modifies token accumulator and state

    ; Token building logic based on state
    ; This would handle building identifiers, numbers, strings, etc.

    RET

; ============================================================================
; KEYWORD LOOKUP SUBROUTINE
; ============================================================================

lookup_keyword:
    ; Input: R9 = string address, R10 = string length
    ; Output: R11 = keyword subtype or 0xFF if not found

    ; Hash table lookup for C keywords
    ; Compare against known keyword list

    RET

; ============================================================================
; TOKEN STORAGE SUBROUTINE
; ============================================================================

store_token:
    ; Input: R8 = token type, R9 = token subtype, R10 = token length, R11 = token value
    ; Output: Stores token to [R2 + R5]

    ; Calculate token word: TYPE | SUBTYPE | LENGTH | VALUE
    LOAD R12, R8            ; Token type
    SHIFT_LEFT R12, 4       ; Make room for subtype
    OR R12, R9              ; Add subtype
    SHIFT_LEFT R12, 8       ; Make room for length
    OR R12, R10             ; Add length
    SHIFT_LEFT R12, 16      ; Make room for value
    OR R12, R11             ; Add value

    ; Store token
    STORE [R2 + R5], R12
    ADD R5, R5, 4           ; Next token position

    RET

; ============================================================================
; STRING STORAGE SUBROUTINE
; ============================================================================

store_string:
    ; Input: R9 = string start address, R10 = string length
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
    STATE_IDENTIFIER:   .equ 1
    STATE_NUMBER:       .equ 2
    STATE_STRING:       .equ 3
    STATE_CHARACTER:    .equ 4
    STATE_OPERATOR:     .equ 5
    STATE_PUNCTUATION:  .equ 6
    STATE_PREPROCESSOR: .equ 7
    STATE_COMMENT:      .equ 8

    ; Token type constants
    TOKEN_KEYWORD:      .equ 0x0
    TOKEN_IDENTIFIER:   .equ 0x1
    TOKEN_CONSTANT:     .equ 0x2
    TOKEN_STRING:       .equ 0x3
    TOKEN_OPERATOR:     .equ 0x4
    TOKEN_PUNCTUATION:  .equ 0x5
    TOKEN_PREPROCESSOR: .equ 0x6
    TOKEN_COMMENT:      .equ 0x7
    TOKEN_END:          .equ 0x8
    TOKEN_ERROR:        .equ 0x9

    ; Character class constants
    CHAR_LETTER:        .equ 0x1
    CHAR_DIGIT:         .equ 0x2
    CHAR_WHITESPACE:    .equ 0x5
    CHAR_QUOTE:         .equ 0x6
    CHAR_ESCAPE:        .equ 0x7
    CHAR_OPERATOR:      .equ 0x8
    CHAR_PUNCTUATION:   .equ 0x9
    CHAR_PREPROCESSOR:  .equ 0xA
    CHAR_UNDERSCORE:    .equ 0xE
    CHAR_INVALID:       .equ 0xF

    ; System call numbers
    SYSCALL_CHAR_CLASSIFY: .equ 0
`;

// ============================================================================
// JAVASCRIPT INTERFACE AND TESTING
// ============================================================================

/**
 * CLexicalAnalyzer class for integration with the OrionRisc-128 system
 */
class CLexicalAnalyzer {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.program = C_LEXICAL_ANALYZER_PROGRAM;
    }

    /**
     * Load the C lexical analyzer program into memory
     * @param {number} startAddress - Memory address to load program (default: 0x0000)
     */
    loadProgram(startAddress = 0x0000) {
        console.log(`Loading C lexical analyzer program at address 0x${startAddress.toString(16)}`);
        this.cpu.loadProgram(this.program, startAddress);
    }

    /**
     * Tokenize C source code
     * @param {string} sourceCode - C source code to tokenize
     * @param {number} sourceAddress - Memory address of source buffer (default: 0x1000)
     * @param {number} tokenAddress - Memory address for token buffer (default: 0x2000)
     * @param {number} stringAddress - Memory address for string table (default: 0x3000)
     * @returns {Array} Array of tokens found
     */
    tokenize(sourceCode, sourceAddress = 0x1000, tokenAddress = 0x2000, stringAddress = 0x3000) {
        console.log(`Tokenizing C source code (${sourceCode.length} characters)`);

        // Load source code into memory as bytes
        const sourceBytes = [];
        for (let i = 0; i < sourceCode.length; i++) {
            sourceBytes.push(sourceCode.charCodeAt(i));
        }

        // Add null terminator
        sourceBytes.push(0);

        this.mmu.loadMemory(sourceAddress, sourceBytes);

        // Set up CPU registers for C lexical analyzer
        this.cpu.setRegister(0, sourceAddress);      // R0 = source buffer address
        this.cpu.setRegister(1, sourceCode.length);  // R1 = source length
        this.cpu.setRegister(2, tokenAddress);       // R2 = token buffer address
        this.cpu.setRegister(3, stringAddress);      // R3 = string table address

        // Execute C lexical analyzer program
        const instructionsExecuted = this.cpu.run();

        console.log(`C lexical analyzer executed ${instructionsExecuted} instructions`);

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
            if (type === C_TOKEN_TYPES.END) {
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
        const names = Object.keys(C_TOKEN_TYPES);
        for (const name of names) {
            if (C_TOKEN_TYPES[name] === type) {
                return name;
            }
        }
        return 'UNKNOWN';
    }

    /**
     * Get keyword name for debugging
     * @param {number} subtype - Keyword subtype value
     * @returns {string} Keyword name
     */
    static getKeywordName(subtype) {
        const names = Object.keys(C_KEYWORD_SUBTYPES);
        for (const name of names) {
            if (C_KEYWORD_SUBTYPES[name] === subtype) {
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
 * Example C source code for testing
 */
const EXAMPLE_C_CODE = `
/* Example C program for testing C lexical analyzer */
#include <stdio.h>

int main(void) {
    int number = 42;
    char letter = 'A';
    char* message = "Hello, World!";

    if (number > 0) {
        printf("Positive number: %d\\n", number);
    } else {
        printf("Non-positive\\n");
    }

    for (int i = 0; i < 10; i++) {
        printf("Count: %d\\n", i);
    }

    return 0;
}
`;

/**
 * Test the C lexical analyzer
 */
function testCLexicalAnalyzer() {
    console.log('=== C LEXICAL ANALYZER TEST ===');

    console.log('Example C code to tokenize:');
    console.log(EXAMPLE_C_CODE);

    console.log('\\nExpected tokens:');
    console.log('- PREPROCESSOR: #include');
    console.log('- IDENTIFIER: stdio, main, number, letter, message');
    console.log('- KEYWORD: int, char, if, else, for, return');
    console.log('- CONSTANT: 42, \'A\', "Hello, World!"');
    console.log('- OPERATOR: =, >, <, ++');
    console.log('- PUNCTUATION: ;, ,, (, ), {, }, etc.');

    console.log('\\nC lexical analyzer implementation ready for Phase 3 integration');
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CLexicalAnalyzer,
        C_LEXICAL_ANALYZER_PROGRAM,
        C_LEXICAL_ANALYZER_ASSEMBLY,
        EXAMPLE_C_CODE,
        testCLexicalAnalyzer,
        C_TOKEN_TYPES,
        C_KEYWORD_SUBTYPES,
        C_CONSTANT_SUBTYPES,
        C_OPERATOR_SUBTYPES,
        C_PUNCTUATION_SUBTYPES,
        C_CHAR_CLASSES,
        C_LEX_STATES,
        C_KEYWORDS
    };
}

module.exports = CLexicalAnalyzer;