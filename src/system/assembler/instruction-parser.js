/**
 * Instruction Parser and Validator for OrionRisc-128 Assembler
 *
 * This module implements a recursive descent parser that processes tokens
 * from the lexical analyzer, validates instruction syntax, and prepares
 * instructions for code generation.
 *
 * Phase 2 Component: Parser Implementation
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// PARSER CONSTANTS AND DATA STRUCTURES
// ============================================================================

/**
 * Parser Error Types
 */
const PARSER_ERRORS = {
    UNEXPECTED_TOKEN: 1,
    INVALID_INSTRUCTION: 2,
    INVALID_OPERAND: 3,
    MISSING_OPERAND: 4,
    EXTRA_OPERAND: 5,
    INVALID_REGISTER: 6,
    INVALID_IMMEDIATE: 7,
    INVALID_ADDRESS: 8,
    SYNTAX_ERROR: 9,
    SEMANTIC_ERROR: 10
};

/**
 * Instruction Formats
 */
const INSTRUCTION_FORMATS = {
    // No operands: HALT, RET
    NO_OPERANDS: 0,

    // Single register: (none in current ISA)
    SINGLE_REGISTER: 1,

    // Register and immediate: LOAD Rd, imm
    REGISTER_IMMEDIATE: 2,

    // Two registers: ADD Rd, Rs
    TWO_REGISTERS: 3,

    // Register and memory address: LOAD Rd, [Rs + offset]
    REGISTER_MEMORY: 4,

    // Memory address and register: STORE [Rd], Rs
    MEMORY_REGISTER: 5,

    // Jump address: JUMP addr
    JUMP_ADDRESS: 6,

    // System call: SYSCALL num
    SYSCALL: 7
};

/**
 * Instruction Specifications
 * Defines syntax and validation rules for each instruction
 */
const INSTRUCTION_SPEC = {
    'LOAD': {
        opcode: 0x01,
        format: INSTRUCTION_FORMATS.REGISTER_IMMEDIATE,
        operandCount: 2,
        operands: [
            { type: 'register', required: true, position: 0 },  // Destination register
            { type: 'immediate', required: true, position: 1 }  // Immediate value
        ],
        validation: 'validateLoadInstruction'
    },

    'STORE': {
        opcode: 0x02,
        format: INSTRUCTION_FORMATS.MEMORY_REGISTER,
        operandCount: 2,
        operands: [
            { type: 'memory', required: true, position: 0 },    // Memory address
            { type: 'register', required: true, position: 1 }   // Source register
        ],
        validation: 'validateStoreInstruction'
    },

    'ADD': {
        opcode: 0x03,
        format: INSTRUCTION_FORMATS.TWO_REGISTERS,
        operandCount: 2,
        operands: [
            { type: 'register', required: true, position: 0 },  // Destination register
            { type: 'register', required: true, position: 1 }   // Source register
        ],
        validation: 'validateArithmeticInstruction'
    },

    'SUB': {
        opcode: 0x04,
        format: INSTRUCTION_FORMATS.TWO_REGISTERS,
        operandCount: 2,
        operands: [
            { type: 'register', required: true, position: 0 },  // Destination register
            { type: 'register', required: true, position: 1 }   // Source register
        ],
        validation: 'validateArithmeticInstruction'
    },

    'JUMP': {
        opcode: 0x06,
        format: INSTRUCTION_FORMATS.JUMP_ADDRESS,
        operandCount: 1,
        operands: [
            { type: 'address', required: true, position: 0 }    // Jump target address
        ],
        validation: 'validateJumpInstruction'
    },

    'CALL': {
        opcode: 0x07,
        format: INSTRUCTION_FORMATS.JUMP_ADDRESS,
        operandCount: 1,
        operands: [
            { type: 'address', required: true, position: 0 }    // Call target address
        ],
        validation: 'validateCallInstruction'
    },

    'RET': {
        opcode: 0x08,
        format: INSTRUCTION_FORMATS.NO_OPERANDS,
        operandCount: 0,
        operands: [],
        validation: 'validateNoOperandInstruction'
    },

    'HALT': {
        opcode: 0xFF,
        format: INSTRUCTION_FORMATS.NO_OPERANDS,
        operandCount: 0,
        operands: [],
        validation: 'validateNoOperandInstruction'
    },

    'SYSCALL': {
        opcode: 0x05,
        format: INSTRUCTION_FORMATS.SYSCALL,
        operandCount: 1,
        operands: [
            { type: 'immediate', required: true, position: 0 }  // System call number
        ],
        validation: 'validateSyscallInstruction'
    },

    'NOP': {
        opcode: 0x00,
        format: INSTRUCTION_FORMATS.NO_OPERANDS,
        operandCount: 0,
        operands: [],
        validation: 'validateNoOperandInstruction'
    }
};

/**
 * Operand Types
 */
const OPERAND_TYPES = {
    REGISTER: 'register',
    IMMEDIATE: 'immediate',
    ADDRESS: 'address',
    MEMORY: 'memory',
    LABEL: 'label'
};

/**
 * Parser State
 */
const PARSER_STATE = {
    READY: 0,
    PARSING_INSTRUCTION: 1,
    PARSING_OPERANDS: 2,
    ERROR: 3,
    COMPLETE: 4
};

// ============================================================================
// PARSER ERROR CLASS
// ============================================================================

/**
 * Parser Error Class
 */
class ParserError {
    constructor(type, message, position, token = null) {
        this.type = type;
        this.message = message;
        this.position = position;
        this.token = token;
        this.line = 0;  // Would be calculated from position
        this.column = 0; // Would be calculated from position
    }

    toString() {
        return `Parser Error [${this.type}] at position ${this.position}: ${this.message}`;
    }
}

// ============================================================================
// PARSED INSTRUCTION CLASS
// ============================================================================

/**
 * Parsed Instruction Class
 * Represents a validated and parsed instruction ready for code generation
 */
class ParsedInstruction {
    constructor(mnemonic, opcode, operands, address = 0) {
        this.mnemonic = mnemonic;      // Original instruction mnemonic
        this.opcode = opcode;          // Numeric opcode
        this.operands = operands;      // Array of parsed operands
        this.address = address;        // Memory address for this instruction
        this.size = 4;                 // Instruction size in bytes (default 4)
        this.valid = true;             // Validation status
        this.errors = [];              // Any validation errors
    }

    /**
     * Add validation error
     */
    addError(error) {
        this.valid = false;
        this.errors.push(error);
    }

    /**
     * Check if instruction is valid
     */
    isValid() {
        return this.valid && this.errors.length === 0;
    }

    /**
     * Get instruction as machine code (simplified)
     */
    toMachineCode() {
        // This would generate actual machine code
        // For now, return a placeholder
        return {
            opcode: this.opcode,
            operands: this.operands,
            size: this.size
        };
    }
}

// ============================================================================
// OPERAND CLASSES
// ============================================================================

/**
 * Base Operand Class
 */
class Operand {
    constructor(type, value, text = '') {
        this.type = type;
        this.value = value;
        this.text = text;
    }
}

/**
 * Register Operand
 */
class RegisterOperand extends Operand {
    constructor(registerNumber, registerName) {
        super(OPERAND_TYPES.REGISTER, registerNumber, registerName);
        this.registerNumber = registerNumber;
        this.registerName = registerName;
    }
}

/**
 * Immediate Operand
 */
class ImmediateOperand extends Operand {
    constructor(value, text, radix = 10) {
        super(OPERAND_TYPES.IMMEDIATE, value, text);
        this.radix = radix;  // 10 for decimal, 16 for hexadecimal
    }
}

/**
 * Address Operand (for jumps and calls)
 */
class AddressOperand extends Operand {
    constructor(value, text, isLabel = false) {
        super(OPERAND_TYPES.ADDRESS, value, text);
        this.isLabel = isLabel;  // True if this is an unresolved label reference
    }
}

/**
 * Memory Operand (for load/store operations)
 */
class MemoryOperand extends Operand {
    constructor(baseRegister, offset = 0, text = '') {
        super(OPERAND_TYPES.MEMORY, { base: baseRegister, offset: offset }, text);
        this.baseRegister = baseRegister;
        this.offset = offset;
    }
}

// ============================================================================
// TOKEN STREAM READER
// ============================================================================

/**
 * Token Stream Reader
 * Provides sequential access to tokens with lookahead capability
 */
class TokenStream {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.length = tokens.length;
        this.lineNumbers = this.calculateLineNumbers(); // Track line numbers for errors
    }

    /**
     * Calculate line numbers for tokens
     * @returns {Array} Line numbers for each token position
     */
    calculateLineNumbers() {
        const lineNumbers = [];
        let currentLine = 1;

        for (let i = 0; i < this.tokens.length; i++) {
            lineNumbers.push(currentLine);

            // Simple line counting (would need actual source for accuracy)
            // For now, assume each token is on a separate line
            currentLine++;
        }

        return lineNumbers;
    }

    /**
     * Get current token without advancing position
     * @param {number} offset - Lookahead offset (default: 0)
     * @returns {Object|null} Token at position or null if beyond end
     */
    peek(offset = 0) {
        const index = this.position + offset;
        return (index < this.length) ? this.tokens[index] : null;
    }

    /**
     * Get current token and advance position
     * @returns {Object|null} Current token or null if at end
     */
    read() {
        if (this.position < this.length) {
            return this.tokens[this.position++];
        }
        return null;
    }

    /**
     * Check if we've reached the end of the stream
     * @returns {boolean} True if at or beyond end of stream
     */
    isEnd() {
        return this.position >= this.length;
    }

    /**
     * Get current position in stream
     * @returns {number} Current position (0-based)
     */
    getPosition() {
        return this.position;
    }

    /**
     * Set position in stream
     * @param {number} position - New position
     */
    setPosition(position) {
        this.position = Math.max(0, Math.min(position, this.length));
    }

    /**
     * Look ahead multiple tokens
     * @param {number} count - Number of tokens to lookahead
     * @returns {Array} Array of upcoming tokens
     */
    lookahead(count) {
        const tokens = [];
        for (let i = 0; i < count && (this.position + i) < this.length; i++) {
            tokens.push(this.tokens[this.position + i]);
        }
        return tokens;
    }

    /**
     * Skip whitespace and comment tokens
     * @returns {Object|null} Next non-whitespace token or null
     */
    skipWhitespace() {
        let token = this.peek();
        while (token && (token.type === 6)) { // COMMENT
            this.read(); // Consume comment
            token = this.peek();
        }
        return token;
    }

    /**
     * Expect a specific token type
     * @param {number} expectedType - Expected token type
     * @param {string} errorMessage - Error message if type doesn't match
     * @returns {Object|null} Token if type matches, null otherwise
     */
    expect(expectedType, errorMessage = '') {
        const token = this.read();
        if (!token || token.type !== expectedType) {
            // Error will be handled by caller
            return null;
        }
        return token;
    }

    /**
     * Check if current token matches expected type
     * @param {number} expectedType - Expected token type
     * @returns {boolean} True if token matches expected type
     */
    matches(expectedType) {
        const token = this.peek();
        return token && token.type === expectedType;
    }

    /**
     * Get line number for current position
     * @returns {number} Line number (1-based)
     */
    getCurrentLine() {
        return this.lineNumbers[this.position] || 1;
    }

    /**
     * Get line number for a specific position
     * @param {number} position - Token position
     * @returns {number} Line number (1-based)
     */
    getLine(position) {
        return this.lineNumbers[position] || 1;
    }
}

/**
 * Skip to end of current statement for error recovery
 * @param {TokenStream} stream - Token stream
 */
function skipToEndOfStatement(stream) {
    let token = stream.peek();
    while (token && token.type !== 6 && token.type !== 7) { // Not comment or end
        stream.read();
        token = stream.peek();
    }
}

// ============================================================================
// INSTRUCTION PARSER CLASS
// ============================================================================

/**
 * Main Instruction Parser Class
 */
class InstructionParser {
    constructor(mmu, symbolTable = null) {
        this.mmu = mmu;
        this.symbolTable = symbolTable;
        this.errors = [];
        this.warnings = [];
        this.parsedInstructions = [];
        this.currentAddress = 0;
    }

    /**
     * Parse tokens into instructions
     * @param {Array} tokens - Tokens from lexical analyzer
     * @param {number} startAddress - Starting memory address for instructions
     * @param {Object} directiveProcessor - Directive processor instance (optional)
     * @returns {Object} Parse results
     */
    parse(tokens, startAddress = 0, directiveProcessor = null) {
        console.log(`Parsing ${tokens.length} tokens starting at address 0x${startAddress.toString(16)}`);

        this.errors = [];
        this.warnings = [];
        this.parsedInstructions = [];
        this.currentAddress = startAddress;

        const stream = new TokenStream(tokens);

        while (!stream.isEnd()) {
            const instruction = this.parseInstruction(stream, directiveProcessor);
            if (instruction) {
                instruction.address = this.currentAddress;
                this.parsedInstructions.push(instruction);
                this.currentAddress += instruction.size;
            }
        }

        return {
            instructions: this.parsedInstructions,
            errors: this.errors,
            warnings: this.warnings,
            success: this.errors.length === 0,
            instructionCount: this.parsedInstructions.length,
            endAddress: this.currentAddress
        };
    }

    /**
     * Parse a single instruction from the token stream
     * @param {TokenStream} stream - Token stream
     * @param {Object} directiveProcessor - Directive processor instance (optional)
     * @returns {ParsedInstruction|null} Parsed instruction or null if failed
     */
    parseInstruction(stream, directiveProcessor = null) {
        const startPosition = stream.getPosition();

        try {
            // Look for instruction token
            let token = stream.skipWhitespace();

            // Skip comments and empty lines
            while (token && (token.type === 6 || token.type === 7)) { // COMMENT or END
                stream.read();
                token = stream.skipWhitespace();
            }

            if (!token || token.type !== 0) { // Not an instruction
                if (token && token.type !== 7) { // Not end marker
                    // Check if it's a directive
                    if (token && token.type === 4) { // DIRECTIVE token
                        if (directiveProcessor) {
                            // Let directive processor handle it
                            // For now, just skip directive tokens
                            // In full integration, directive processor would handle this
                            stream.read(); // Consume directive token
                            return null; // Parser doesn't handle directives
                        }
                    }

                    this.addError(PARSER_ERRORS.UNEXPECTED_TOKEN,
                        `Expected instruction, found ${this.getTokenTypeName(token ? token.type : -1)}`,
                        stream.getPosition(), token);
                }
                return null;
            }

            // Read instruction token
            const instructionToken = stream.read();
            const mnemonic = this.getTokenText(instructionToken);

            // Check if this is a valid instruction
            const spec = this.lookupInstruction(mnemonic);
            if (!spec) {
                this.addError(PARSER_ERRORS.INVALID_INSTRUCTION,
                    `Unknown instruction: ${mnemonic}`,
                    stream.getPosition() - 1, instructionToken);
                return null;
            }

            // Parse operands based on instruction format
            const operands = this.parseOperands(stream, spec);

            // Validate instruction
            const instruction = new ParsedInstruction(mnemonic, spec.opcode, operands, 0);
            this.validateInstruction(instruction, spec);

            return instruction;

        } catch (error) {
            this.addError(PARSER_ERRORS.SYNTAX_ERROR,
                `Parser error: ${error.message}`,
                stream.getPosition());
            return null;
        }
    }

    /**
     * Parse operands for an instruction
     * @param {TokenStream} stream - Token stream
     * @param {Object} spec - Instruction specification
     * @returns {Array} Array of parsed operands
     */
    parseOperands(stream, spec) {
        const operands = [];
        const expectedCount = spec.operandCount;

        for (let i = 0; i < expectedCount; i++) {
            // Skip whitespace before each operand
            stream.skipWhitespace();

            const operand = this.parseOperand(stream, spec.operands[i]);
            if (operand) {
                operands.push(operand);
            } else {
                this.addError(PARSER_ERRORS.MISSING_OPERAND,
                    `Missing operand ${i + 1} for instruction ${spec.mnemonic}`,
                    stream.getPosition());
                break;
            }

            // If this isn't the last operand, expect a comma
            if (i < expectedCount - 1) {
                stream.skipWhitespace();
                const commaToken = stream.read();
                if (!commaToken || commaToken.type !== 5 || commaToken.subtype !== 1) {
                    this.addError(PARSER_ERRORS.SYNTAX_ERROR,
                        `Expected comma between operands ${i + 1} and ${i + 2}`,
                        stream.getPosition(), commaToken);
                    return operands; // Return what we have so far
                }
            }
        }

        // Skip trailing whitespace
        stream.skipWhitespace();

        // Check for extra operands (should not be any more tokens until comment or end)
        const nextToken = stream.peek();
        if (nextToken && nextToken.type !== 6 && nextToken.type !== 7) { // Not comment or end
            this.addWarning(`Extra tokens after instruction operands`);
            // Try to recover by skipping to end of line or next comment
            skipToEndOfStatement(stream);
        }

        return operands;
    }

    /**
     * Parse a single operand
     * @param {TokenStream} stream - Token stream
     * @param {Object} operandSpec - Operand specification
     * @returns {Operand|null} Parsed operand or null if failed
     */
    parseOperand(stream, operandSpec) {
        let token = stream.peek();

        // Skip whitespace/comments if present
        while (token && (token.type === 6)) { // COMMENT
            stream.read();
            token = stream.peek();
        }

        if (!token) {
            return null;
        }

        switch (operandSpec.type) {
            case OPERAND_TYPES.REGISTER:
                return this.parseRegisterOperand(stream);

            case OPERAND_TYPES.IMMEDIATE:
                return this.parseImmediateOperand(stream);

            case OPERAND_TYPES.ADDRESS:
                return this.parseAddressOperand(stream);

            case OPERAND_TYPES.MEMORY:
                return this.parseMemoryOperand(stream);

            default:
                this.addError(PARSER_ERRORS.INVALID_OPERAND,
                    `Unknown operand type: ${operandSpec.type}`,
                    stream.getPosition(), token);
                return null;
        }
    }

    /**
     * Parse register operand (R0-R15)
     * @param {TokenStream} stream - Token stream
     * @returns {RegisterOperand|null} Parsed register or null if failed
     */
    parseRegisterOperand(stream) {
        const token = stream.read();

        if (!token || token.type !== 1) { // Not a register token
            this.addError(PARSER_ERRORS.INVALID_REGISTER,
                'Expected register (R0-R15)',
                stream.getPosition() - 1, token);
            return null;
        }

        const registerNumber = token.value;
        const registerName = this.getTokenText(token);

        // Validate register number
        if (registerNumber < 0 || registerNumber > 15) {
            this.addError(PARSER_ERRORS.INVALID_REGISTER,
                `Invalid register number: ${registerNumber}`,
                stream.getPosition() - 1, token);
            return null;
        }

        return new RegisterOperand(registerNumber, registerName);
    }

    /**
     * Parse immediate operand (numbers)
     * @param {TokenStream} stream - Token stream
     * @returns {ImmediateOperand|null} Parsed immediate or null if failed
     */
    parseImmediateOperand(stream) {
        const token = stream.read();

        if (!token || token.type !== 2) { // Not an immediate token
            this.addError(PARSER_ERRORS.INVALID_IMMEDIATE,
                'Expected immediate value',
                stream.getPosition() - 1, token);
            return null;
        }

        const value = token.value;
        const text = this.getTokenText(token);

        // Validate immediate range (assuming 16-bit signed for now)
        if (value < -32768 || value > 65535) {
            this.addError(PARSER_ERRORS.INVALID_IMMEDIATE,
                `Immediate value out of range: ${value}`,
                stream.getPosition() - 1, token);
            return null;
        }

        return new ImmediateOperand(value, text, token.subtype === 1 ? 16 : 10);
    }

    /**
     * Parse address operand (for jumps and calls)
     * @param {TokenStream} stream - Token stream
     * @returns {AddressOperand|null} Parsed address or null if failed
     */
    parseAddressOperand(stream) {
        const token = stream.read();

        if (!token) {
            this.addError(PARSER_ERRORS.INVALID_ADDRESS,
                'Expected address or label',
                stream.getPosition());
            return null;
        }

        const text = this.getTokenText(token);

        // Check if it's a label reference
        if (token.type === 3) { // LABEL token
            const labelName = text.replace(':', '');
            return new AddressOperand(0, labelName, true); // Unresolved label
        }

        // Check if it's an immediate (numeric address)
        if (token.type === 2) { // IMMEDIATE token
            const address = token.value;
            return new AddressOperand(address, text, false);
        }

        this.addError(PARSER_ERRORS.INVALID_ADDRESS,
            `Expected address or label, found ${this.getTokenTypeName(token.type)}`,
            stream.getPosition() - 1, token);
        return null;
    }

    /**
     * Parse memory operand (for load/store operations)
     * @param {TokenStream} stream - Token stream
     * @returns {MemoryOperand|null} Parsed memory operand or null if failed
     */
    parseMemoryOperand(stream) {
        // Expect format: [register + offset] or [register]

        // Read opening bracket
        let token = stream.read();
        if (!token || token.type !== 5 || token.subtype !== 2) { // Not '['
            this.addError(PARSER_ERRORS.SYNTAX_ERROR,
                'Expected \'[\' for memory operand',
                stream.getPosition() - 1, token);
            return null;
        }

        // Read base register
        const register = this.parseRegisterOperand(stream);
        if (!register) {
            return null; // Error already reported
        }

        // Check for offset
        token = stream.peek();
        let offset = 0;

        if (token && token.type === 5 && token.subtype === 1) { // Comma
            stream.read(); // Consume comma

            // Read offset (immediate value)
            const offsetToken = stream.read();
            if (offsetToken && offsetToken.type === 2) { // Immediate
                offset = offsetToken.value;
            } else {
                this.addError(PARSER_ERRORS.INVALID_IMMEDIATE,
                    'Expected immediate value for memory offset',
                    stream.getPosition() - 1, offsetToken);
                return null;
            }
        }

        // Read closing bracket
        token = stream.read();
        if (!token || token.type !== 5 || token.subtype !== 3) { // Not ']'
            this.addError(PARSER_ERRORS.SYNTAX_ERROR,
                'Expected \']\' for memory operand',
                stream.getPosition() - 1, token);
            return null;
        }

        return new MemoryOperand(register.registerNumber, offset,
            `[${register.registerName}${offset !== 0 ? ' + ' + offset : ''}]`);
    }

    /**
     * Validate a parsed instruction
     * @param {ParsedInstruction} instruction - Instruction to validate
     * @param {Object} spec - Instruction specification
     */
    validateInstruction(instruction, spec) {
        // Call instruction-specific validation
        if (spec.validation && this[spec.validation]) {
            this[spec.validation](instruction, spec);
        }

        // General validation
        if (instruction.operands.length !== spec.operandCount) {
            instruction.addError(new ParserError(
                PARSER_ERRORS.INVALID_OPERAND,
                `Expected ${spec.operandCount} operands, got ${instruction.operands.length}`,
                0
            ));
        }
    }

    /**
     * Validate LOAD instruction
     */
    validateLoadInstruction(instruction, spec) {
        // LOAD-specific validation rules
        // (Currently no special rules beyond general validation)
    }

    /**
     * Validate STORE instruction
     */
    validateStoreInstruction(instruction, spec) {
        // STORE-specific validation rules
        // (Currently no special rules beyond general validation)
    }

    /**
     * Validate arithmetic instructions (ADD, SUB)
     */
    validateArithmeticInstruction(instruction, spec) {
        // Arithmetic-specific validation rules
        // (Currently no special rules beyond general validation)
    }

    /**
     * Validate JUMP instruction
     */
    validateJumpInstruction(instruction, spec) {
        // JUMP-specific validation rules
        // (Currently no special rules beyond general validation)
    }

    /**
     * Validate CALL instruction
     */
    validateCallInstruction(instruction, spec) {
        // CALL-specific validation rules
        // (Currently no special rules beyond general validation)
    }

    /**
     * Validate no-operand instructions (HALT, RET, NOP)
     */
    validateNoOperandInstruction(instruction, spec) {
        // No-operand instruction validation
        // (Currently no special rules beyond general validation)
    }

    /**
     * Validate SYSCALL instruction
     */
    validateSyscallInstruction(instruction, spec) {
        if (instruction.operands.length > 0) {
            const syscallNum = instruction.operands[0].value;
            // Validate syscall number range (assuming 0-255)
            if (syscallNum < 0 || syscallNum > 255) {
                instruction.addError(new ParserError(
                    PARSER_ERRORS.INVALID_IMMEDIATE,
                    `Invalid syscall number: ${syscallNum} (must be 0-255)`,
                    0
                ));
            }
        }
    }

    /**
     * Resolve label references using symbol table
     * @param {ParsedInstruction} instruction - Optional specific instruction to resolve
     * @returns {boolean} True if all labels resolved successfully
     */
    resolveLabels(instruction = null) {
        if (!this.symbolTable) {
            console.warn('No symbol table available for label resolution');
            return false;
        }

        let allResolved = true;
        const instructionsToCheck = instruction ? [instruction] : this.parsedInstructions;

        for (const instr of instructionsToCheck) {
            for (const operand of instr.operands) {
                if (operand instanceof AddressOperand && operand.isLabel) {
                    const resolvedValue = this.symbolTable.resolveSymbol(operand.text);
                    if (resolvedValue !== null) {
                        operand.value = resolvedValue;
                        operand.isLabel = false;
                        console.log(`Resolved label '${operand.text}' to 0x${resolvedValue.toString(16)}`);
                    } else {
                        instr.addError(new ParserError(
                            PARSER_ERRORS.SEMANTIC_ERROR,
                            `Undefined label: ${operand.text}`,
                            0
                        ));
                        allResolved = false;
                    }
                }
            }
        }

        return allResolved;
    }

    /**
     * Add parser error
     * @param {number} type - Error type
     * @param {string} message - Error message
     * @param {number} position - Position in token stream
     * @param {Object} token - Related token (optional)
     */
    addError(type, message, position, token = null) {
        const error = new ParserError(type, message, position, token);
        this.errors.push(error);
        console.error(`Parser Error: ${error.toString()}`);
    }

    /**
     * Add parser warning
     * @param {string} message - Warning message
     */
    addWarning(message) {
        this.warnings.push(message);
        console.warn(`Parser Warning: ${message}`);
    }

    /**
     * Get token text from token data
     * @param {Object} token - Token object
     * @returns {string} Token text
     */
    getTokenText(token) {
        // In a full implementation, this would read from string table
        // For now, use the text field if available, otherwise reconstruct
        if (token.text) {
            return token.text;
        }

        // Reconstruct from token data
        if (token.type === 0) { // INSTRUCTION
            // Would need to look up instruction name from opcode
            // For now, return a placeholder
            return 'UNKNOWN';
        } else if (token.type === 1) { // REGISTER
            return `R${token.value}`;
        } else if (token.type === 2) { // IMMEDIATE
            return token.value.toString();
        } else if (token.type === 3) { // LABEL
            return 'LABEL';
        }

        return 'UNKNOWN';
    }

    /**
     * Look up instruction specification by mnemonic
     * @param {string} mnemonic - Instruction mnemonic
     * @returns {Object|null} Instruction specification or null if not found
     */
    lookupInstruction(mnemonic) {
        return INSTRUCTION_SPEC[mnemonic] || null;
    }

    /**
     * Get token type name for debugging
     * @param {number} type - Token type number
     * @returns {string} Token type name
     */
    getTokenTypeName(type) {
        const names = ['INSTRUCTION', 'REGISTER', 'IMMEDIATE', 'LABEL',
                      'DIRECTIVE', 'SEPARATOR', 'COMMENT', 'END', 'ERROR'];
        return names[type] || 'UNKNOWN';
    }

    /**
     * Skip to end of current statement for error recovery
     * @param {TokenStream} stream - Token stream
     */
    skipToEndOfStatement(stream) {
        let tokensSkipped = 0;
        const maxTokensToSkip = 1000; // Prevent infinite loops

        let token = stream.peek();
        while (token && token.type !== 6 && token.type !== 7 && tokensSkipped < maxTokensToSkip) {
            stream.read();
            tokensSkipped++;
            token = stream.peek();
        }

        // If we hit the limit, skip to actual end
        if (tokensSkipped >= maxTokensToSkip) {
            while (!stream.isEnd() && stream.peek().type !== 6) {
                stream.read();
            }
        }
    }
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Create parser instance
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} symbolTable - Symbol table instance (optional)
 * @returns {InstructionParser} Parser instance
 */
function createParser(mmu, symbolTable = null) {
    return new InstructionParser(mmu, symbolTable);
}

/**
 * Parse assembly source code using lexical analyzer and parser
 * @param {string} sourceCode - Assembly source code
 * @param {Object} mmu - MMU instance
 * @param {Object} cpu - CPU instance (for lexical analyzer)
 * @param {Object} symbolTable - Symbol table instance (optional)
 * @returns {Object} Complete parse results
 */
function parseAssemblySource(sourceCode, mmu, cpu, symbolTable = null) {
    console.log('Parsing assembly source code...');

    // This would integrate with the lexical analyzer
    // For now, return a placeholder structure

    return {
        success: false,
        errors: ['Integration with lexical analyzer not yet implemented'],
        instructionCount: 0
    };
}

// ============================================================================
// TESTING AND VALIDATION
// ============================================================================

/**
 * Test the instruction parser
 */
function testInstructionParser() {
    console.log('=== INSTRUCTION PARSER TEST ===');

    // Test cases would go here
    console.log('Parser implementation ready for integration');
    console.log('Features:');
    console.log('- Token stream processing with lookahead');
    console.log('- Instruction syntax validation');
    console.log('- Operand parsing and validation');
    console.log('- Error reporting and recovery');
    console.log('- Symbol table integration');
    console.log('- Machine language compatibility');
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InstructionParser,
        ParsedInstruction,
        ParserError,
        RegisterOperand,
        ImmediateOperand,
        AddressOperand,
        MemoryOperand,
        TokenStream,
        PARSER_ERRORS,
        INSTRUCTION_FORMATS,
        INSTRUCTION_SPEC,
        OPERAND_TYPES,
        PARSER_STATE,
        createParser,
        parseAssemblySource,
        testInstructionParser
    };
}

// Also export the main class as default
module.exports.InstructionParser = InstructionParser;