/**
 * Integration Example for OrionRisc-128 Assembler Components
 *
 * This module demonstrates how the lexical analyzer, symbol table, and
 * instruction parser work together as a complete assembler pipeline.
 *
 * Phase 2 Component: Integration Example
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// INTEGRATION EXAMPLE
// ============================================================================

/**
 * Complete assembler pipeline integration
 */
function demonstrateAssemblerIntegration() {
    console.log('=== ASSEMBLER INTEGRATION DEMONSTRATION ===\n');

    // Sample assembly program
    const assemblyProgram = `
; Simple assembly program demonstrating all features
.text
.global main

main:
    LOAD R0, 42          ; Load immediate value
    LOAD R1, [R2]        ; Load from memory
    ADD R0, R1           ; Add two registers
    STORE [R3 + 10], R0  ; Store to memory with offset
    JUMP main_loop       ; Jump to label

data_section:
    .data
    my_var: .equ 100     ; Define constant
    buffer: .equ 0x1000  ; Memory buffer

main_loop:
    SYSCALL 5            ; System call
    CALL subroutine      ; Call subroutine
    RET                  ; Return

subroutine:
    NOP                  ; No operation
    HALT                 ; End program
`;

    console.log('Assembly Source Code:');
    console.log(assemblyProgram);
    console.log('\n' + '='.repeat(50));

    // Step 1: Lexical Analysis
    console.log('\nSTEP 1: LEXICAL ANALYSIS');
    console.log('Tokenizing source code...');

    // This would use the actual lexical analyzer
    // For demonstration, we'll simulate the process
    const tokens = simulateLexicalAnalysis(assemblyProgram);

    console.log(`Found ${tokens.length} tokens:`);
    tokens.forEach((token, i) => {
        console.log(`  ${i}: ${getTokenTypeName(token.type)} ${token.text || token.value}`);
    });

    // Step 2: Directive Processing
    console.log('\nSTEP 2: DIRECTIVE PROCESSING');
    console.log('Processing assembler directives...');

    const directiveProcessor = simulateDirectiveProcessing(tokens);

    console.log(`Processed ${directiveProcessor.directives.length} directives:`);
    directiveProcessor.directives.forEach((directive, i) => {
        console.log(`  ${i}: ${directive.name} -> ${directive.type}`);
    });

    // Step 3: Symbol Table Processing
    console.log('\nSTEP 3: SYMBOL TABLE PROCESSING');
    console.log('Building symbol table...');

    const symbolTable = simulateSymbolTableProcessing(tokens, directiveProcessor);

    console.log(`Symbol table contains ${symbolTable.symbols.size} symbols:`);
    symbolTable.symbols.forEach((entry, name) => {
        console.log(`  ${name}: ${entry.type} = 0x${entry.value.toString(16)}`);
    });

    // Step 4: Instruction Parsing
    console.log('\nSTEP 4: INSTRUCTION PARSING');
    console.log('Parsing instructions...');

    const parser = simulateInstructionParsing(tokens, symbolTable, directiveProcessor);

    console.log(`Parsed ${parser.parsedInstructions.length} instructions:`);
    parser.parsedInstructions.forEach((instruction, i) => {
        console.log(`  ${i}: ${instruction.mnemonic} at 0x${instruction.address.toString(16)}`);
        instruction.operands.forEach((operand, j) => {
            console.log(`    Operand ${j}: ${operand.type} = ${operand.value}`);
        });
    });

    // Step 5: Label Resolution
    console.log('\nSTEP 5: LABEL RESOLUTION');
    console.log('Resolving label references...');

    const resolutionResult = parser.resolveLabels();

    if (resolutionResult) {
        console.log('All labels resolved successfully');
    } else {
        console.log('Some labels could not be resolved');
        parser.errors.forEach(error => {
            console.log(`  Error: ${error.message}`);
        });
    }

    // Step 6: Final Results
    console.log('\nSTEP 6: FINAL RESULTS');
    console.log(`Total instructions: ${parser.parsedInstructions.length}`);
    console.log(`Total errors: ${parser.errors.length}`);
    console.log(`Total warnings: ${parser.warnings.length}`);

    if (parser.errors.length === 0) {
        console.log('✓ Assembly completed successfully');
    } else {
        console.log('✗ Assembly failed with errors');
    }

    return {
        success: parser.errors.length === 0,
        instructions: parser.parsedInstructions,
        errors: parser.errors,
        warnings: parser.warnings
    };
}

// ============================================================================
// SIMULATION FUNCTIONS
// ============================================================================

/**
 * Simulate lexical analysis process
 * @param {string} sourceCode - Assembly source code
 * @returns {Array} Simulated tokens
 */
function simulateLexicalAnalysis(sourceCode) {
    // This simulates what the lexical analyzer would produce
    // In a real implementation, this would use the LexicalAnalyzer class

    const tokens = [];
    let position = 0;

    // Simple tokenization for demonstration
    const lines = sourceCode.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum].trim();

        if (!line || line.startsWith(';')) {
            if (line.startsWith(';')) {
                tokens.push({
                    type: 6, // COMMENT
                    text: line,
                    position: position++
                });
            }
            continue;
        }

        // Simple parsing for demonstration
        const parts = line.replace(/,/g, ' , ').replace(/\[/g, ' [ ').replace(/\]/g, ' ] ').split(/\s+/);

        for (const part of parts) {
            if (!part) continue;

            let token = null;

            if (part.startsWith('R') && part.length <= 3) {
                // Register
                const regNum = parseInt(part.substring(1));
                token = {
                    type: 1, // REGISTER
                    value: regNum,
                    text: part,
                    position: position++
                };
            } else if (/^\d+$/.test(part)) {
                // Decimal number
                token = {
                    type: 2, // IMMEDIATE
                    subtype: 0,
                    value: parseInt(part),
                    text: part,
                    position: position++
                };
            } else if (/^0x[0-9a-fA-F]+$/.test(part)) {
                // Hex number
                token = {
                    type: 2, // IMMEDIATE
                    subtype: 1,
                    value: parseInt(part, 16),
                    text: part,
                    position: position++
                };
            } else if (part.endsWith(':')) {
                // Label
                token = {
                    type: 3, // LABEL
                    text: part,
                    position: position++
                };
            } else if (part.startsWith('.')) {
                // Directive
                token = {
                    type: 4, // DIRECTIVE
                    text: part,
                    position: position++
                };
            } else if (['[', ']', ','].includes(part)) {
                // Separator
                token = {
                    type: 5, // SEPARATOR
                    subtype: getSeparatorSubtype(part),
                    text: part,
                    position: position++
                };
            } else if (['LOAD', 'STORE', 'ADD', 'SUB', 'JUMP', 'CALL', 'RET', 'HALT', 'SYSCALL', 'NOP'].includes(part.toUpperCase())) {
                // Instruction
                token = {
                    type: 0, // INSTRUCTION
                    text: part.toUpperCase(),
                    position: position++
                };
            }

            if (token) {
                tokens.push(token);
            }
        }
    }

    // Add end marker
    tokens.push({
        type: 7, // END
        position: position++
    });

    return tokens;
}

/**
 * Get separator subtype
 * @param {string} separator - Separator character
 * @returns {number} Subtype value
 */
function getSeparatorSubtype(separator) {
    switch (separator) {
        case ',': return 1;
        case '[': return 2;
        case ']': return 3;
        case ':': return 4;
        default: return 0;
    }
}

/**
 * Simulate directive processing
 * @param {Array} tokens - Tokens from lexical analysis
 * @returns {Object} Simulated directive processor
 */
function simulateDirectiveProcessing(tokens) {
    const directives = [];
    let currentSection = 'text';
    let currentAddress = 0x1000;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 4) { // DIRECTIVE
            const directive = {
                name: token.text,
                type: classifyDirective(token.text),
                operands: [],
                position: token.position,
                processed: false
            };

            // Parse operands based on directive type
            switch (directive.type) {
                case 'section':
                    if (token.text === '.text') {
                        currentSection = 'text';
                        currentAddress = 0x1000;
                    } else if (token.text === '.data') {
                        currentSection = 'data';
                        currentAddress = 0x9000;
                    }
                    break;

                case 'symbol_def':
                    // .equ symbol value
                    if (i + 2 < tokens.length) {
                        const nameToken = tokens[i + 1];
                        const valueToken = tokens[i + 2];

                        if (nameToken && nameToken.text && valueToken && valueToken.type === 2) {
                            directive.operands = [nameToken.text.replace(':', ''), valueToken.value];
                        }
                    }
                    break;

                case 'global_decl':
                    // .global symbol
                    if (i + 1 < tokens.length) {
                        const nameToken = tokens[i + 1];
                        if (nameToken && nameToken.text) {
                            directive.operands = [nameToken.text.replace(':', '')];
                        }
                    }
                    break;
            }

            directive.processed = true;
            directives.push(directive);
        }
    }

    return {
        directives,
        currentSection,
        currentAddress,
        getSectionInfo: () => ({
            currentSection,
            currentAddress,
            sectionAddresses: { text: 0x1000, data: 0x9000 },
            sectionSizes: { text: 0, data: 0 }
        })
    };
}

/**
 * Classify directive by name
 * @param {string} name - Directive name
 * @returns {string} Directive type
 */
function classifyDirective(name) {
    const directiveName = name.substring(1).toLowerCase();

    switch (directiveName) {
        case 'text':
        case 'data':
        case 'bss':
            return 'section';
        case 'equ':
            return 'symbol_def';
        case 'global':
        case 'globl':
            return 'global_decl';
        default:
            return 'unknown';
    }
}

/**
 * Simulate symbol table processing
 * @param {Array} tokens - Tokens from lexical analysis
 * @param {Object} directiveProcessor - Directive processor instance
 * @returns {Object} Simulated symbol table
 */
function simulateSymbolTableProcessing(tokens, directiveProcessor) {
    const symbols = new Map();
    let currentAddress = 0x1000; // Starting address

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 3 && token.text.endsWith(':')) {
            // Label definition
            const labelName = token.text.slice(0, -1);
            symbols.set(labelName, {
                type: 'LABEL',
                value: currentAddress
            });
        } else if (token.type === 4 && token.text === '.equ') {
            // Equate definition
            if (i + 2 < tokens.length) {
                const nameToken = tokens[i + 1];
                const valueToken = tokens[i + 2];

                if (nameToken && nameToken.text && valueToken && valueToken.type === 2) {
                    const equateName = nameToken.text.replace(':', '');
                    symbols.set(equateName, {
                        type: 'EQUATE',
                        value: valueToken.value
                    });
                }
            }
        } else if (token.type === 0) {
            // Instruction - advance address
            currentAddress += 4;
        }
    }

    return { symbols };
}

/**
 * Simulate instruction parsing
 * @param {Array} tokens - Tokens to parse
 * @param {Object} symbolTable - Symbol table for resolution
 * @param {Object} directiveProcessor - Directive processor instance
 * @returns {Object} Simulated parser
 */
function simulateInstructionParsing(tokens, symbolTable, directiveProcessor) {
    // This would use the actual InstructionParser class
    // For demonstration, we'll simulate the process

    const parsedInstructions = [];
    const errors = [];
    const warnings = [];

    // Simple simulation of parsing
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 0) { // INSTRUCTION
            const instruction = {
                mnemonic: token.text,
                opcode: getOpcodeForInstruction(token.text),
                operands: [],
                address: 0x1000 + (parsedInstructions.length * 4),
                valid: true,
                errors: []
            };

            // Add some mock operands based on instruction type
            switch (token.text) {
                case 'LOAD':
                    instruction.operands = [
                        { type: 'register', value: 0 },
                        { type: 'immediate', value: 42 }
                    ];
                    break;
                case 'ADD':
                    instruction.operands = [
                        { type: 'register', value: 0 },
                        { type: 'register', value: 1 }
                    ];
                    break;
                case 'JUMP':
                    instruction.operands = [
                        { type: 'address', value: 0x1000, isLabel: true, text: 'main' }
                    ];
                    break;
                case 'HALT':
                    // No operands
                    break;
            }

            parsedInstructions.push(instruction);
        }
    }

    return {
        parsedInstructions,
        errors,
        warnings,
        resolveLabels: () => {
            // Simulate label resolution
            return true;
        }
    };
}

/**
 * Get opcode for instruction mnemonic
 * @param {string} mnemonic - Instruction mnemonic
 * @returns {number} Opcode value
 */
function getOpcodeForInstruction(mnemonic) {
    const opcodes = {
        'LOAD': 0x01,
        'STORE': 0x02,
        'ADD': 0x03,
        'SUB': 0x04,
        'JUMP': 0x06,
        'CALL': 0x07,
        'RET': 0x08,
        'HALT': 0xFF,
        'SYSCALL': 0x05,
        'NOP': 0x00
    };

    return opcodes[mnemonic] || 0;
}

/**
 * Get token type name for display
 * @param {number} type - Token type number
 * @returns {string} Token type name
 */
function getTokenTypeName(type) {
    const names = ['INSTRUCTION', 'REGISTER', 'IMMEDIATE', 'LABEL',
                  'DIRECTIVE', 'SEPARATOR', 'COMMENT', 'END', 'ERROR'];
    return names[type] || 'UNKNOWN';
}

// ============================================================================
// MAIN DEMONSTRATION
// ============================================================================

/**
 * Run the integration demonstration
 */
function runIntegrationDemo() {
    if (typeof window !== 'undefined') {
        // Browser environment
        demonstrateAssemblerIntegration();
    } else {
        // Node.js environment
        const result = demonstrateAssemblerIntegration();

        console.log('\nIntegration demonstration completed.');
        console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);

        return result;
    }
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        demonstrateAssemblerIntegration,
        runIntegrationDemo,
        simulateLexicalAnalysis,
        simulateSymbolTableProcessing,
        simulateInstructionParsing
    };
}

module.exports = demonstrateAssemblerIntegration;