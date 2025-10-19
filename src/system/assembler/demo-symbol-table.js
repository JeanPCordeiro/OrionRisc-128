/**
 * Symbol Table Demonstration
 *
 * Simple demonstration of the symbol table management system
 * for the OrionRisc-128 assembler Phase 2.
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// Import dependencies (these would be available in the actual system)
const { lexicalAnalysis, LEX_STATES, TOKEN_TYPES } = require('./state-machine');
const { processTokensForSymbols, SYMBOL_TYPES } = require('./symbol-table');

/**
 * Demonstrate symbol table functionality
 */
function demonstrateSymbolTable() {
    console.log('=== SYMBOL TABLE DEMONSTRATION ===');
    console.log('OrionRisc-128 Assembler Phase 2: Symbol Table Management\n');

    // Sample assembly program with labels and equates
    const assemblyCode = `
; OrionRisc-128 Assembly Program
.text
.global main

main:
    LOAD R0, 42              ; Load immediate value
    LOAD R1, [data_start]    ; Load from memory
    ADD R0, R1               ; Add registers
    STORE [result], R0       ; Store result
    JUMP end_program         ; Jump to end

; Data section
.data
data_start: .equ 0x1000      ; Memory location
buffer_size: .equ 256        ; Buffer size constant
result: .equ 0x2000          ; Result location

end_program:
    HALT                     ; End program
`;

    console.log('Sample Assembly Code:');
    console.log(assemblyCode);
    console.log('\n' + '='.repeat(50) + '\n');

    // Step 1: Lexical Analysis
    console.log('STEP 1: Lexical Analysis');
    console.log('Tokenizing assembly code...\n');

    const tokens = lexicalAnalysis(assemblyCode);
    console.log(`Found ${tokens.length - 1} tokens (excluding end marker):\n`);

    // Display some key tokens
    const keyTokens = tokens.slice(0, -1).filter(token =>
        token.type === 3 || token.type === 4 // Labels and directives only
    );

    keyTokens.forEach((token, index) => {
        const typeName = token.type === 3 ? 'LABEL' : 'DIRECTIVE';
        console.log(`  ${index + 1}. ${typeName}: "${token.text}"`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Step 2: Symbol Table Processing
    console.log('STEP 2: Symbol Table Processing');
    console.log('Building symbol table from tokens...\n');

    // Mock symbol table (would use real MMU in actual system)
    const MockMMU = {
        memory: new Array(0x10000).fill(0),
        readByte(addr) { return this.memory[addr] || 0; },
        readWord(addr) { return (this.memory[addr] || 0) | ((this.memory[addr + 1] || 0) << 8); },
        writeByte(addr, val) { this.memory[addr] = val & 0xFF; },
        writeWord(addr, val) {
            this.memory[addr] = val & 0xFF;
            this.memory[addr + 1] = (val >> 8) & 0xFF;
        }
    };

    const { SymbolTable } = require('./symbol-table');
    const symbolTable = new SymbolTable(MockMMU);

    // Process tokens for symbols
    const processResult = processTokensForSymbols(tokens, symbolTable, 0x0000);

    console.log(`Processing Results:`);
    console.log(`  Labels found: ${processResult.labelsFound}`);
    console.log(`  Equates found: ${processResult.equatesFound}`);
    console.log(`  Total symbols: ${processResult.symbolsAdded}`);

    if (processResult.errors.length > 0) {
        console.log(`  Errors: ${processResult.errors.length}`);
        processResult.errors.forEach(error => {
            console.log(`    - ${error.error} at position ${error.position}`);
        });
    }

    console.log('\nSymbol Table Contents:');
    const table = symbolTable.getSymbolTable();
    if (table.size > 0) {
        table.forEach((entry, name) => {
            const typeName = entry.type === 1 ? 'LABEL' : 'EQUATE';
            const scopeName = entry.scope === 2 ? 'GLOBAL' : 'LOCAL';
            console.log(`  ${name}:`);
            console.log(`    Type: ${typeName}`);
            console.log(`    Scope: ${scopeName}`);
            console.log(`    Value: 0x${entry.value.toString(16)} (${entry.value})`);
        });
    } else {
        console.log('  (No symbols found)');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Step 3: Symbol Resolution
    console.log('STEP 3: Symbol Resolution');
    console.log('Demonstrating symbol resolution for code generation:\n');

    const symbolsToResolve = ['main', 'data_start', 'buffer_size', 'result', 'end_program', 'nonexistent'];

    symbolsToResolve.forEach(symbolName => {
        const value = symbolTable.resolveSymbol(symbolName);
        if (value !== null) {
            console.log(`  ${symbolName} = 0x${value.toString(16)} (${value})`);
        } else {
            console.log(`  ${symbolName} = NOT FOUND`);
        }
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Step 4: Memory Layout
    console.log('STEP 4: Memory Layout');
    console.log('Symbol table memory usage:\n');

    const stats = symbolTable.getStatistics();
    console.log(`  Symbol count: ${stats.symbolCount}`);
    console.log(`  String storage used: ${stats.stringOffset} bytes`);
    console.log(`  Symbol data used: ${stats.dataOffset} bytes`);
    console.log(`  Hash buckets used: ${stats.bucketCount}`);
    console.log(`  Collisions: ${stats.collisionCount}`);

    console.log('\nMemory Regions Used:');
    console.log('  0x5000-0x5FFF: Hash table (256 buckets)');
    console.log('  0x6000-0x6FFF: Symbol data entries');
    console.log('  0x7000-0x7FFF: String storage');
    console.log('  0x8000-0x80FF: Metadata');

    console.log('\n' + '='.repeat(50) + '\n');

    // Step 5: Integration Summary
    console.log('STEP 5: Integration Summary');
    console.log('Symbol table system ready for Phase 2 assembler integration!\n');

    console.log('Features Implemented:');
    console.log('  ✓ Label storage and address tracking');
    console.log('  ✓ Equate handling (.equ directives)');
    console.log('  ✓ Symbol name validation');
    console.log('  ✓ Hash table for efficient lookup');
    console.log('  ✓ Memory management within 128KB system');
    console.log('  ✓ Integration with lexical analyzer');
    console.log('  ✓ Machine language compatibility');

    console.log('\nNext Steps:');
    console.log('  → Parser implementation (Phase 2B)');
    console.log('  → Code generation (Phase 2C)');
    console.log('  → Complete assembler (Phase 2D)');

    return {
        tokens,
        symbolTable,
        processResult,
        statistics: stats
    };
}

// Run demonstration if this file is executed directly
if (require.main === module) {
    demonstrateSymbolTable();
}

module.exports = {
    demonstrateSymbolTable
};