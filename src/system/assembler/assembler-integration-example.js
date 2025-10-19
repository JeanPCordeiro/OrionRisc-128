/**
 * Two-Pass Assembler Integration Example
 *
 * This example demonstrates how to integrate the two-pass assembler
 * with the existing OrionRisc-128 system components (MMU, CPU, etc.).
 *
 * Phase 2 Component: Assembler Integration Example
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// INTEGRATION EXAMPLE
// ============================================================================

/**
 * Complete integration example showing how to use the two-pass assembler
 * with the existing OrionRisc-128 system components.
 */
class AssemblerIntegrationExample {
    constructor() {
        this.mmu = null;
        this.cpu = null;
        this.assembler = null;
        this.initialized = false;
    }

    /**
     * Initialize the integration example
     * @param {Object} mmuInstance - Memory Management Unit instance
     * @param {Object} cpuInstance - CPU instance
     */
    initialize(mmuInstance, cpuInstance) {
        console.log('Initializing assembler integration example...');

        this.mmu = mmuInstance;
        this.cpu = cpuInstance;

        // Import and create assembler
        const { TwoPassAssembler } = require('./two-pass-assembler');
        this.assembler = new TwoPassAssembler(this.mmu, this.cpu);

        this.initialized = true;
        console.log('Integration example initialized successfully');
    }

    /**
     * Example 1: Simple assembly and execution
     */
    example1_SimpleAssembly() {
        console.log('=== EXAMPLE 1: Simple Assembly and Execution ===');

        const sourceCode = `
.text
.global main

main:
    LOAD R0, 42          ; Load 42 into R0
    ADD R0, R1           ; Add R1 to R0
    STORE [R2], R0       ; Store result to memory
    HALT                 ; End program
`;

        console.log('Assembling simple program...');
        const result = this.assembler.assemble(sourceCode, 0x1000);

        console.log(`Assembly result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Instructions generated: ${result.instructions.length}`);
        console.log(`Symbols found: ${result.symbols.length}`);
        console.log(`Errors: ${result.errors.length}`);

        if (result.success) {
            console.log('Writing program to memory...');
            this.assembler.writeToMemory(0x1000);

            console.log('Program ready for execution at address 0x1000');
        }

        return result;
    }

    /**
     * Example 2: Assembly with labels and jumps
     */
    example2_LabelsAndJumps() {
        console.log('=== EXAMPLE 2: Labels and Jumps ===');

        const sourceCode = `
.text
.global main

main:
    LOAD R0, 10          ; Initialize counter
    JUMP loop_start      ; Jump to loop

end_program:
    HALT                 ; End of program

loop_start:
    ADD R0, 1            ; Increment counter
    JUMP end_program     ; Exit loop
`;

        console.log('Assembling program with labels...');
        const result = this.assembler.assemble(sourceCode, 0x1000);

        console.log(`Assembly result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Instructions: ${result.instructions.length}`);
        console.log(`Symbols: ${result.symbols.length}`);

        if (result.symbols.length > 0) {
            console.log('Symbols found:');
            result.symbols.forEach(symbol => {
                console.log(`  ${symbol.name}: 0x${symbol.value.toString(16)} (type: ${symbol.type})`);
            });
        }

        return result;
    }

    /**
     * Example 3: Assembly with equates and data
     */
    example3_EquatesAndData() {
        console.log('=== EXAMPLE 3: Equates and Data ===');

        const sourceCode = `
.data
BUFFER_SIZE: .equ 256
MAX_COUNT:   .equ 100
BASE_ADDR:   .equ 0x2000

.text
.global main

main:
    LOAD R0, BUFFER_SIZE    ; Load buffer size
    LOAD R1, MAX_COUNT      ; Load maximum count
    LOAD R2, BASE_ADDR      ; Load base address
    ADD R0, R1              ; Calculate total
    STORE [R2], R0          ; Store result
    HALT
`;

        console.log('Assembling program with equates...');
        const result = this.assembler.assemble(sourceCode, 0x1000);

        console.log(`Assembly result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Instructions: ${result.instructions.length}`);
        console.log(`Symbols: ${result.symbols.length}`);

        if (result.symbols.length > 0) {
            console.log('Symbols found:');
            result.symbols.forEach(symbol => {
                const typeName = symbol.type === 1 ? 'LABEL' : symbol.type === 2 ? 'EQUATE' : 'OTHER';
                console.log(`  ${symbol.name}: 0x${symbol.value.toString(16)} (${typeName})`);
            });
        }

        return result;
    }

    /**
     * Example 4: Error handling demonstration
     */
    example4_ErrorHandling() {
        console.log('=== EXAMPLE 4: Error Handling ===');

        const invalidSourceCode = `
.text
.global main

main:
    INVALID_INSTRUCTION R0, 42    ; This is not a valid instruction
    LOAD R0, 42                   ; This is valid
    HALT
`;

        console.log('Assembling program with errors...');
        const result = this.assembler.assemble(invalidSourceCode, 0x1000);

        console.log(`Assembly result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Errors found: ${result.errors.length}`);

        if (result.errors.length > 0) {
            console.log('Errors reported:');
            result.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.message}`);
            });
        }

        return result;
    }

    /**
     * Example 5: Complete workflow with state tracking
     */
    example5_CompleteWorkflow() {
        console.log('=== EXAMPLE 5: Complete Workflow ===');

        const sourceCode = `
.text
.global main

.data
ARRAY_SIZE: .equ 5

.text
main:
    LOAD R0, ARRAY_SIZE
    LOAD R1, 0

loop:
    ADD R1, R0
    SUB R0, 1
    JUMP loop

end:
    HALT
`;

        console.log('Step 1: Initial state');
        console.log('  State:', this.assembler.getState());

        console.log('Step 2: Starting assembly...');
        const result = this.assembler.assemble(sourceCode, 0x1000);

        console.log('Step 3: Assembly complete');
        console.log('  Final state:', this.assembler.getState());
        console.log('  Result:', result.success ? 'SUCCESS' : 'FAILED');

        if (result.success) {
            console.log('Step 4: Writing to memory...');
            this.assembler.writeToMemory(0x1000);

            console.log('Step 5: Program statistics');
            console.log(`  Instructions: ${result.statistics.instructionsGenerated}`);
            console.log(`  Symbols: ${result.statistics.symbolsFound}`);
            console.log(`  Bytes: ${result.statistics.bytesGenerated}`);
            console.log(`  Assembly time: ${result.statistics.totalTime}ms`);
        }

        return result;
    }

    /**
     * Example 6: Performance testing
     */
    example6_PerformanceTesting() {
        console.log('=== EXAMPLE 6: Performance Testing ===');

        // Create a larger program for performance testing
        let largeProgram = `
.text
.global main

.data
SIZE: .equ 100

.text
main:
    LOAD R0, SIZE
    LOAD R1, 0
    LOAD R2, 0x2000

loop:
    STORE [R2 + R1], R1
    ADD R1, 1
    SUB R0, 1
    JUMP loop

end:
    HALT
`;

        // Duplicate the loop to make it larger
        for (let i = 0; i < 10; i++) {
            largeProgram += `
loop${i}:
    ADD R1, 1
    SUB R0, 1
    JUMP end

`;
        }

        console.log('Assembling large program...');
        const startTime = Date.now();

        const result = this.assembler.assemble(largeProgram, 0x1000);

        const endTime = Date.now();
        const assemblyTime = endTime - startTime;

        console.log(`Assembly completed in ${assemblyTime}ms`);
        console.log(`Instructions: ${result.instructions.length}`);
        console.log(`Symbols: ${result.symbols.length}`);
        console.log(`Performance: ${result.instructions.length / assemblyTime * 1000} instructions/second`);

        return result;
    }

    /**
     * Run all examples
     */
    runAllExamples() {
        console.log('=== RUNNING ALL INTEGRATION EXAMPLES ===');
        console.log('');

        if (!this.initialized) {
            console.error('Integration example not initialized');
            return;
        }

        try {
            this.example1_SimpleAssembly();
            console.log('');

            this.example2_LabelsAndJumps();
            console.log('');

            this.example3_EquatesAndData();
            console.log('');

            this.example4_ErrorHandling();
            console.log('');

            this.example5_CompleteWorkflow();
            console.log('');

            this.example6_PerformanceTesting();
            console.log('');

            console.log('=== ALL EXAMPLES COMPLETE ===');

        } catch (error) {
            console.error('Error running examples:', error);
        }
    }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Usage example function
 */
function demonstrateAssemblerIntegration() {
    console.log('Two-Pass Assembler Integration Example');
    console.log('=====================================');
    console.log('');

    console.log('This example shows how to integrate the two-pass assembler');
    console.log('with the existing OrionRisc-128 system components.');
    console.log('');

    console.log('To use in your code:');
    console.log('');
    console.log('// 1. Create system components');
    console.log('const mmu = new MemoryManagementUnit();');
    console.log('const cpu = new RiscProcessor(mmu);');
    console.log('');
    console.log('// 2. Create assembler');
    console.log('const { TwoPassAssembler } = require("./two-pass-assembler");');
    console.log('const assembler = new TwoPassAssembler(mmu, cpu);');
    console.log('');
    console.log('// 3. Assemble source code');
    console.log('const sourceCode = ".text\\n.global main\\nmain:\\nLOAD R0, 42\\nHALT";');
    console.log('const result = assembler.assemble(sourceCode, 0x1000);');
    console.log('');
    console.log('// 4. Check results');
    console.log('if (result.success) {');
    console.log('    assembler.writeToMemory(0x1000);');
    console.log('    console.log("Assembly successful!");');
    console.log('} else {');
    console.log('    console.log("Assembly failed:", result.errors);');
    console.log('}');
    console.log('');

    console.log('The assembler integrates seamlessly with existing components');
    console.log('and provides comprehensive error reporting and state tracking.');
}

// ============================================================================
// INTEGRATION TEST
// ============================================================================

/**
 * Test integration with actual system components
 * @param {Object} mmuInstance - MMU instance
 * @param {Object} cpuInstance - CPU instance
 */
function testIntegration(mmuInstance, cpuInstance) {
    console.log('=== INTEGRATION TEST ===');

    const example = new AssemblerIntegrationExample();
    example.initialize(mmuInstance, cpuInstance);

    console.log('Running integration examples...');
    example.runAllExamples();

    console.log('Integration test complete');
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AssemblerIntegrationExample,
        demonstrateAssemblerIntegration,
        testIntegration
    };
}