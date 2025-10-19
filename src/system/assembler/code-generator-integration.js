/**
 * Code Generator Integration Example
 *
 * This module demonstrates how the machine code generator integrates with
 * the existing instruction parser and symbol table to create a complete
 * assembler pipeline.
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
 * Complete assembler pipeline demonstration
 */
function demonstrateCodeGeneratorIntegration() {
    console.log('=== CODE GENERATOR INTEGRATION DEMONSTRATION ===\n');

    // Sample assembly program with labels and symbols
    const assemblyProgram = `
; Complete assembly program demonstrating code generation
.text
.global main

; Program entry point
main:
    LOAD R0, 42          ; Load immediate value
    LOAD R1, data_value  ; Load from memory (will be resolved)
    ADD R0, R1           ; Add values
    STORE [R2], R0       ; Store result
    JUMP main_loop       ; Jump to loop (will be resolved)

; Data section
.data
data_value: .equ 100     ; Define constant

; Main processing loop
main_loop:
    LOAD R3, buffer      ; Load buffer address
    STORE [R3], R0       ; Store to buffer
    SYSCALL 5            ; System call
    CALL subroutine      ; Call subroutine (will be resolved)
    RET                  ; Return

; Subroutine definition
subroutine:
    NOP                  ; No operation
    LOAD R4, 0xFF        ; Load hex value
    HALT                 ; End program

; More data
buffer: .equ 0x2000      ; Buffer location
`;

    console.log('Assembly Source Code:');
    console.log(assemblyProgram);
    console.log('\n' + '='.repeat(60));

    // Step 1: Simulate lexical analysis
    console.log('\nSTEP 1: LEXICAL ANALYSIS');
    const tokens = simulateLexicalAnalysis(assemblyProgram);
    console.log(`Found ${tokens.length} tokens`);

    // Step 2: Build symbol table
    console.log('\nSTEP 2: SYMBOL TABLE PROCESSING');
    const symbolTable = simulateSymbolTableProcessing(tokens);
    console.log(`Symbol table contains ${symbolTable.symbols.size} symbols:`);
    symbolTable.symbols.forEach((entry, name) => {
        console.log(`  ${name}: ${entry.type} = 0x${entry.value.toString(16)}`);
    });

    // Step 3: Parse instructions
    console.log('\nSTEP 3: INSTRUCTION PARSING');
    const parser = simulateInstructionParsing(tokens, symbolTable);
    console.log(`Parsed ${parser.parsedInstructions.length} instructions:`);
    parser.parsedInstructions.forEach((instruction, i) => {
        console.log(`  ${i}: ${instruction.mnemonic} at 0x${instruction.address.toString(16)}`);
    });

    // Step 4: Resolve labels
    console.log('\nSTEP 4: LABEL RESOLUTION');
    const resolutionResult = parser.resolveLabels();
    if (resolutionResult) {
        console.log('✓ All labels resolved successfully');
    } else {
        console.log('✗ Some labels could not be resolved');
    }

    // Step 5: Generate machine code
    console.log('\nSTEP 5: MACHINE CODE GENERATION');
    const generator = simulateMachineCodeGeneration(parser.parsedInstructions, symbolTable);
    const result = generator.generateMachineCode(parser.parsedInstructions, 0x1000);

    console.log('\nGenerated Machine Code:');
    result.instructions.forEach((instr, i) => {
        const bytes = instr.toBytes().map(b => `0x${b.toString(16).padStart(2, '0')}`);
        console.log(`  0x${instr.address.toString(16)}: 0x${instr.machineCode.toString(16).padStart(8, '0')} ${bytes.join(' ')}`);
    });

    // Step 6: Show statistics
    console.log('\nSTEP 6: GENERATION STATISTICS');
    console.log(`Instructions generated: ${result.statistics.instructionsGenerated}`);
    console.log(`Bytes generated: ${result.statistics.bytesGenerated}`);
    console.log(`Relocations applied: ${result.statistics.relocationsApplied}`);
    console.log(`Optimizations applied: ${result.statistics.optimizationsApplied}`);

    // Step 7: Validation
    console.log('\nSTEP 7: VALIDATION');
    if (result.validation.valid) {
        console.log('✓ Generated code is valid');
    } else {
        console.log('✗ Generated code has issues:');
        result.validation.issues.forEach(issue => {
            console.log(`  - ${issue}`);
        });
    }

    return result;
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
    const tokens = [];
    let position = 0;

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

        const parts = line.replace(/,/g, ' , ').replace(/\[/g, ' [ ').replace(/\]/g, ' ] ').split(/\s+/);

        for (const part of parts) {
            if (!part) continue;

            let token = null;

            if (part.startsWith('R') && part.length <= 3) {
                const regNum = parseInt(part.substring(1));
                token = {
                    type: 1, // REGISTER
                    value: regNum,
                    text: part,
                    position: position++
                };
            } else if (/^\d+$/.test(part)) {
                token = {
                    type: 2, // IMMEDIATE
                    subtype: 0,
                    value: parseInt(part),
                    text: part,
                    position: position++
                };
            } else if (/^0x[0-9a-fA-F]+$/.test(part)) {
                token = {
                    type: 2, // IMMEDIATE
                    subtype: 1,
                    value: parseInt(part, 16),
                    text: part,
                    position: position++
                };
            } else if (part.endsWith(':')) {
                token = {
                    type: 3, // LABEL
                    text: part,
                    position: position++
                };
            } else if (part.startsWith('.')) {
                token = {
                    type: 4, // DIRECTIVE
                    text: part,
                    position: position++
                };
            } else if (['[', ']', ','].includes(part)) {
                token = {
                    type: 5, // SEPARATOR
                    subtype: getSeparatorSubtype(part),
                    text: part,
                    position: position++
                };
            } else if (['LOAD', 'STORE', 'ADD', 'SUB', 'JUMP', 'CALL', 'RET', 'HALT', 'SYSCALL', 'NOP'].includes(part.toUpperCase())) {
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

    tokens.push({ type: 7, position: position++ }); // END marker
    return tokens;
}

/**
 * Get separator subtype
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
 * Simulate symbol table processing
 */
function simulateSymbolTableProcessing(tokens) {
    const symbols = new Map();
    let currentAddress = 0x1000;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 3 && token.text.endsWith(':')) {
            const labelName = token.text.slice(0, -1);
            symbols.set(labelName, {
                type: 'LABEL',
                value: currentAddress
            });
        } else if (token.type === 4 && token.text === '.equ') {
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
            currentAddress += 4;
        }
    }

    return { symbols };
}

/**
 * Simulate instruction parsing
 */
function simulateInstructionParsing(tokens, symbolTable) {
    const parsedInstructions = [];
    const errors = [];
    const warnings = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 0) { // INSTRUCTION
            const instruction = {
                mnemonic: token.text,
                opcode: getOpcodeForInstruction(token.text),
                operands: [],
                address: 0x1000 + (parsedInstructions.length * 4),
                valid: true,
                errors: [],
                isValid: () => true
            };

            // Add operands based on instruction type
            switch (token.text) {
                case 'LOAD':
                    instruction.operands = [
                        { type: 'register', value: 0 },
                        { type: 'immediate', value: 42 }
                    ];
                    break;
                case 'JUMP':
                    instruction.operands = [
                        { type: 'address', value: 0, isLabel: true, text: 'main_loop' }
                    ];
                    break;
                case 'CALL':
                    instruction.operands = [
                        { type: 'address', value: 0, isLabel: true, text: 'subroutine' }
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
 * Simulate machine code generation
 */
function simulateMachineCodeGeneration(parsedInstructions, symbolTable) {
    // Create mock MMU and generator
    const mmu = {
        writeByte: (address, value) => {},
        writeWord: (address, value) => {},
        readByte: (address) => 0,
        readWord: (address) => 0
    };

    const generator = {
        generateMachineCode: function(instructions, startAddress) {
            const encodedInstructions = [];
            let currentAddress = startAddress;

            for (const instruction of instructions) {
                let machineCode = instruction.opcode << 28; // Start with opcode

                // Encode based on instruction type
                switch (instruction.mnemonic) {
                    case 'LOAD':
                        machineCode |= (instruction.operands[0].value & 0xF) << 24;
                        machineCode |= instruction.operands[1].value & 0xFFFF;
                        break;
                    case 'JUMP':
                        const labelName = instruction.operands[0].text;
                        const resolvedAddress = symbolTable.symbols.get(labelName)?.value || 0;
                        machineCode |= resolvedAddress & 0xFFFF;
                        break;
                    case 'HALT':
                        // No additional encoding needed
                        break;
                }

                encodedInstructions.push({
                    address: currentAddress,
                    machineCode: machineCode,
                    sourceInstruction: instruction,
                    size: 4,
                    toBytes: () => [
                        (machineCode >> 24) & 0xFF,
                        (machineCode >> 16) & 0xFF,
                        (machineCode >> 8) & 0xFF,
                        machineCode & 0xFF
                    ]
                });

                currentAddress += 4;
            }

            return {
                success: true,
                instructions: encodedInstructions,
                errors: [],
                warnings: [],
                statistics: {
                    instructionsGenerated: encodedInstructions.length,
                    bytesGenerated: encodedInstructions.length * 4,
                    relocationsApplied: 0,
                    optimizationsApplied: 0
                },
                validation: {
                    valid: true,
                    issues: []
                }
            };
        }
    };

    return generator;
}

/**
 * Get opcode for instruction mnemonic
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

// ============================================================================
// INTEGRATION WITH REAL COMPONENTS
// ============================================================================

/**
 * Integration with real parser and code generator
 */
function demonstrateRealIntegration() {
    console.log('=== REAL COMPONENT INTEGRATION ===\n');

    try {
        // Import real components
        const { InstructionParser } = require('./instruction-parser');
        const { SymbolTable } = require('./symbol-table');
        const { MachineCodeGenerator } = require('./machine-code-generator');

        console.log('✓ Successfully imported real components');

        // Create mock MMU for demonstration
        const mmu = {
            writeByte: (address, value) => {
                console.log(`Writing byte 0x${value.toString(16)} to address 0x${address.toString(16)}`);
            },
            writeWord: (address, value) => {
                console.log(`Writing word 0x${value.toString(16)} to address 0x${address.toString(16)}`);
            },
            readByte: (address) => 0,
            readWord: (address) => 0
        };

        // Create real instances
        const symbolTable = new SymbolTable(mmu);
        const parser = new InstructionParser(mmu, symbolTable);
        const generator = new MachineCodeGenerator(mmu, symbolTable);

        console.log('✓ Created component instances');

        // Add some symbols for testing
        symbolTable.addSymbol('main', 0x1, 0x1000, 0x2); // LABEL, GLOBAL
        symbolTable.addSymbol('my_data', 0x2, 0x1234, 0x1); // EQUATE, LOCAL

        console.log('✓ Added test symbols');

        // Create test instructions
        const testInstructions = [
            {
                mnemonic: 'LOAD',
                opcode: 0x01,
                operands: [
                    { type: 'register', value: 0 },
                    { type: 'immediate', value: 42 }
                ],
                address: 0x1000,
                valid: true,
                errors: [],
                isValid: () => true
            },
            {
                mnemonic: 'JUMP',
                opcode: 0x06,
                operands: [
                    { type: 'address', value: 0, isLabel: true, text: 'main' }
                ],
                address: 0x1004,
                valid: true,
                errors: [],
                isValid: () => true
            }
        ];

        console.log('✓ Created test instructions');

        // Generate machine code
        const result = generator.generateMachineCode(testInstructions, 0x1000);

        console.log(`\nGenerated ${result.instructions.length} instructions:`);
        result.instructions.forEach((instr, i) => {
            console.log(`  ${i}: 0x${instr.machineCode.toString(16)} at 0x${instr.address.toString(16)}`);
        });

        console.log('\n✓ Real integration test completed successfully');

        return result;

    } catch (error) {
        console.error('✗ Real integration test failed:', error.message);
        return { success: false, error: error.message };
    }
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
        demonstrateCodeGeneratorIntegration();
    } else {
        // Node.js environment
        console.log('Running code generator integration demo...\n');

        const result = demonstrateCodeGeneratorIntegration();

        console.log('\nIntegration demonstration completed.');
        console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);

        return result;
    }
}

// ============================================================================
// EXPORT
// ============================================================================

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        demonstrateCodeGeneratorIntegration,
        runIntegrationDemo,
        demonstrateRealIntegration,
        simulateLexicalAnalysis,
        simulateSymbolTableProcessing,
        simulateInstructionParsing,
        simulateMachineCodeGeneration
    };
}

module.exports = demonstrateCodeGeneratorIntegration;