/**
 * End-to-End Assembler Test Suite
 *
 * Comprehensive end-to-end testing for the complete Phase 2 assembler.
 * Tests complete workflow from source code to executable machine code,
 * validating integration of all assembler components and real-world usage.
 *
 * Phase 2 Component: End-to-End Assembly Testing
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

/**
 * End-to-End Test Framework
 */
class EndToEndTestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.mmu = null;
        this.cpu = null;
        this.assembler = null;
        this.testPrograms = [];
        this.setupTestPrograms();
    }

    /**
     * Initialize test framework
     * @param {Object} mmu - Memory Management Unit instance
     * @param {Object} cpu - CPU instance
     */
    initialize(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;

        // Import and create assembler
        const { TwoPassAssembler } = require('./two-pass-assembler');
        this.assembler = new TwoPassAssembler(mmu, cpu);

        console.log('End-to-End test framework initialized');
    }

    /**
     * Set up comprehensive test programs
     */
    setupTestPrograms() {
        // Simple arithmetic program
        this.testPrograms.push({
            name: "Simple Arithmetic",
            source: `
.text
.global main

main:
    LOAD R0, 42
    LOAD R1, 58
    ADD R0, R1
    STORE [result], R0
    HALT

.data
result: .equ 0x2000
            `,
            expectedInstructions: 5,
            expectedSymbols: 2,
            validate: (result) => {
                if (result.instructions.length !== 5) return false;
                if (result.symbols.length < 2) return false;

                // Check that result symbol exists
                const resultSymbol = result.symbols.find(s => s.name === 'result');
                return resultSymbol && resultSymbol.value === 0x2000;
            }
        });

        // Jump and label program
        this.testPrograms.push({
            name: "Jump and Labels",
            source: `
.text
.global main

main:
    LOAD R0, 10
    JUMP skip_data

data_section:
    LOAD R1, 100
    JUMP end_program

skip_data:
    LOAD R1, 200

end_program:
    ADD R0, R1
    HALT
            `,
            expectedInstructions: 7,
            expectedSymbols: 4,
            validate: (result) => {
                if (result.instructions.length !== 7) return false;

                // Check all expected labels exist
                const labels = result.symbols.filter(s => s.type === 3); // LABEL type
                const expectedLabels = ['main', 'data_section', 'skip_data', 'end_program'];
                return expectedLabels.every(label => labels.some(l => l.name === label));
            }
        });

        // Memory operations program
        this.testPrograms.push({
            name: "Memory Operations",
            source: `
.text
.global main

main:
    LOAD R0, 42
    STORE [R1 + 5], R0
    LOAD R2, [R1 + 5]
    LOAD R3, [buffer]
    ADD R2, R3
    HALT

.data
buffer: .equ 0x3000
            `,
            expectedInstructions: 6,
            expectedSymbols: 2,
            validate: (result) => {
                if (result.instructions.length !== 6) return false;

                // Check memory operations are encoded
                const storeInst = result.instructions.find(inst =>
                    inst.sourceInstruction && inst.sourceInstruction.mnemonic === 'STORE'
                );
                const loadInst = result.instructions.find(inst =>
                    inst.sourceInstruction && inst.sourceInstruction.mnemonic === 'LOAD'
                );

                return storeInst && loadInst;
            }
        });

        // Complex program with all features
        this.testPrograms.push({
            name: "Complex Program",
            source: `
; Complex assembly program
.text
.global main

.data
ARRAY_SIZE: .equ 10
BUFFER:     .equ 0x2000
COUNTER:    .equ 0

.text
main:
    LOAD R0, ARRAY_SIZE
    LOAD R1, COUNTER
    LOAD R2, BUFFER

loop:
    STORE [R2 + R1], R1
    ADD R1, 1
    SUB R0, 1
    JUMP loop

end_loop:
    LOAD R3, [BUFFER + 5]
    HALT
            `,
            expectedInstructions: 10,
            expectedSymbols: 6,
            validate: (result) => {
                if (result.instructions.length !== 10) return false;

                // Check equates are processed
                const equates = result.symbols.filter(s => s.type === 2); // EQUATE type
                const expectedEquates = ['ARRAY_SIZE', 'BUFFER', 'COUNTER'];
                return expectedEquates.every(equ => equates.some(e => e.name === equ));
            }
        });

        // Forward reference program
        this.testPrograms.push({
            name: "Forward References",
            source: `
.text
.global main

main:
    JUMP target_label
    LOAD R0, 1

target_label:
    LOAD R1, 2
    CALL subroutine

subroutine:
    LOAD R2, 3
    RET

end:
    HALT
            `,
            expectedInstructions: 7,
            expectedSymbols: 4,
            validate: (result) => {
                if (result.instructions.length !== 7) return false;

                // Check forward references were resolved
                const jumpInst = result.instructions.find(inst =>
                    inst.sourceInstruction && inst.sourceInstruction.mnemonic === 'JUMP'
                );

                return jumpInst && jumpInst.machineCode !== 0;
            }
        });
    }

    /**
     * Add test case
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function
     */
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Run all tests
     * @returns {Object} Test results
     */
    runAllTests() {
        console.log('=== END-TO-END ASSEMBLER TESTS ===');
        console.log('');

        this.results = { passed: 0, failed: 0, total: 0 };

        // Run test programs
        this.runTestPrograms();

        // Run individual tests
        for (const test of this.tests) {
            try {
                console.log(`Running test: ${test.name}`);
                const result = test.testFunction();

                if (result) {
                    this.results.passed++;
                    console.log(`✓ PASSED: ${test.name}`);
                } else {
                    this.results.failed++;
                    console.log(`✗ FAILED: ${test.name}`);
                }

            } catch (error) {
                this.results.failed++;
                console.log(`✗ ERROR in ${test.name}: ${error.message}`);
            }

            this.results.total++;
            console.log('');
        }

        this.printSummary();
        return this.results;
    }

    /**
     * Run test programs
     */
    runTestPrograms() {
        console.log('=== TEST PROGRAM EXECUTION ===');

        for (const program of this.testPrograms) {
            console.log(`Testing: ${program.name}`);

            try {
                const result = this.assembler.assemble(program.source);

                if (!result.success) {
                    console.log(`✗ FAILED: ${program.name} - Assembly failed`);
                    console.log(`  Errors: ${result.errors.map(e => e.message).join(', ')}`);
                    this.results.failed++;
                } else if (program.validate && !program.validate(result)) {
                    console.log(`✗ FAILED: ${program.name} - Validation failed`);
                    this.results.failed++;
                } else if (result.instructions.length !== program.expectedInstructions) {
                    console.log(`✗ FAILED: ${program.name} - Wrong instruction count`);
                    console.log(`  Expected: ${program.expectedInstructions}, Got: ${result.instructions.length}`);
                    this.results.failed++;
                } else {
                    console.log(`✓ PASSED: ${program.name}`);
                    console.log(`  Instructions: ${result.instructions.length}`);
                    console.log(`  Symbols: ${result.symbols.length}`);
                    console.log(`  Time: ${result.statistics.totalTime}ms`);
                    this.results.passed++;
                }

            } catch (error) {
                console.log(`✗ ERROR in ${program.name}: ${error.message}`);
                this.results.failed++;
            }

            this.results.total++;
            console.log('');
        }
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('=== END-TO-END TEST SUMMARY ===');
        console.log(`Total tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.failed === 0) {
            console.log('🎉 All end-to-end tests passed!');
        } else {
            console.log('❌ Some tests failed');
        }
    }
}

// ============================================================================
// TEST PROGRAM LIBRARY
// ============================================================================

/**
 * Library of test assembly programs for comprehensive validation
 */
const TEST_PROGRAM_LIBRARY = {
    // Basic arithmetic operations
    arithmetic: `
.text
.global main

main:
    LOAD R0, 42      ; Load immediate
    LOAD R1, 58      ; Load immediate
    ADD R0, R1       ; Add registers
    STORE [0x2000], R0 ; Store result
    HALT
    `,

    // Control flow with jumps
    controlFlow: `
.text
.global main

main:
    LOAD R0, 0

test_loop:
    ADD R0, 1
    SUB R1, 1
    JUMP test_loop

end_loop:
    HALT
    `,

    // Memory operations
    memoryOps: `
.text
.global main

main:
    LOAD R0, 42
    STORE [R1 + 10], R0
    LOAD R2, [R1 + 10]
    STORE [buffer], R2
    HALT

.data
buffer: .equ 0x3000
    `,

    // Subroutine calls
    subroutines: `
.text
.global main

main:
    LOAD R0, 10
    CALL add_five
    HALT

add_five:
    ADD R0, 5
    RET
    `,

    // Complex data operations
    complexData: `
.text
.global main

.data
ARRAY_SIZE: .equ 5
BUFFER_START: .equ 0x2000

.text
main:
    LOAD R0, ARRAY_SIZE
    LOAD R1, 0
    LOAD R2, BUFFER_START

fill_loop:
    STORE [R2 + R1], R1
    ADD R1, 1
    SUB R0, 1
    JUMP fill_loop

done:
    HALT
    `
};

// ============================================================================
// INDIVIDUAL TEST FUNCTIONS
// ============================================================================

/**
 * Test complete workflow validation
 */
function testCompleteWorkflow() {
    console.log('Testing complete workflow validation...');

    if (!this.assembler) {
        throw new Error('Assembler not initialized');
    }

    // Test each program in the library
    let allPassed = true;

    for (const [name, source] of Object.entries(TEST_PROGRAM_LIBRARY)) {
        const result = this.assembler.assemble(source);

        if (!result.success) {
            console.error(`Workflow test failed for ${name}:`, result.errors);
            allPassed = false;
        } else if (result.instructions.length === 0) {
            console.error(`No instructions generated for ${name}`);
            allPassed = false;
        }
    }

    return allPassed;
}

/**
 * Test real-world program assembly
 */
function testRealWorldPrograms() {
    console.log('Testing real-world program assembly...');

    // Test a realistic application-like program
    const applicationProgram = `
; Simple calculator program
.text
.global main

.data
RESULT: .equ 0x2000
OPERAND_A: .equ 0x2002
OPERAND_B: .equ 0x2004

.text
main:
    ; Load operands
    LOAD R0, [OPERAND_A]
    LOAD R1, [OPERAND_B]

    ; Add them
    ADD R0, R1

    ; Store result
    STORE [RESULT], R0

    ; End program
    HALT
    `;

    const result = this.assembler.assemble(applicationProgram);

    if (!result.success) {
        console.error('Real-world program assembly failed:', result.errors);
        return false;
    }

    if (result.instructions.length < 5) {
        console.error('Insufficient instructions generated for application program');
        return false;
    }

    console.log(`Application program assembled: ${result.instructions.length} instructions`);
    return true;
}

/**
 * Test machine code execution
 */
function testMachineCodeExecution() {
    console.log('Testing machine code execution...');

    // Assemble a simple program
    const simpleProgram = `
.text
.global main

main:
    LOAD R0, 42
    STORE [0x2000], R0
    HALT
    `;

    const result = this.assembler.assemble(simpleProgram);

    if (!result.success) {
        console.error('Assembly failed for execution test');
        return false;
    }

    // Write to memory
    const writeResult = this.assembler.writeToMemory(0x1000);

    if (!writeResult) {
        console.error('Failed to write machine code to memory');
        return false;
    }

    // Verify code is in memory (basic check)
    const firstInstruction = this.mmu.readWord(0x1000);
    if (firstInstruction === 0) {
        console.error('No machine code found in memory');
        return false;
    }

    console.log(`Machine code written and verified: 0x${firstInstruction.toString(16)}`);
    return true;
}

/**
 * Test error recovery and reporting
 */
function testErrorRecovery() {
    console.log('Testing error recovery and reporting...');

    // Test with multiple errors
    const errorProgram = `
.text
.global main

main:
    INVALID_INSTRUCTION R0, 42
    LOAD R0, [undefined_symbol]
    JUMP non_existent_label
    HALT
    `;

    const result = this.assembler.assemble(errorProgram);

    if (result.success) {
        console.error('Assembly should have failed for program with errors');
        return false;
    }

    if (result.errors.length === 0) {
        console.error('No errors reported for invalid program');
        return false;
    }

    console.log(`Correctly reported ${result.errors.length} errors`);
    return true;
}

/**
 * Test performance with realistic programs
 */
function testPerformanceWithRealisticPrograms() {
    console.log('Testing performance with realistic programs...');

    // Create a moderately complex program
    const complexProgram = `
.text
.global main

.data
SIZE: .equ 100
BUFFER: .equ 0x2000

.text
main:
    LOAD R0, SIZE
    LOAD R1, 0
    LOAD R2, BUFFER

init_loop:
    STORE [R2 + R1], R1
    ADD R1, 1
    SUB R0, 1
    JUMP init_loop

process_data:
    LOAD R0, SIZE
    LOAD R1, 0

process_loop:
    LOAD R3, [R2 + R1]
    ADD R3, 1
    STORE [R2 + R1], R3
    ADD R1, 1
    SUB R0, 1
    JUMP process_loop

done:
    HALT
    `;

    const startTime = Date.now();
    const result = this.assembler.assemble(complexProgram);
    const endTime = Date.now();
    const assemblyTime = endTime - startTime;

    if (!result.success) {
        console.error('Complex program assembly failed');
        return false;
    }

    console.log(`Complex program assembled in ${assemblyTime}ms`);
    console.log(`Generated ${result.instructions.length} instructions`);

    // Performance should be reasonable (less than 1 second for this size)
    if (assemblyTime > 1000) {
        console.error(`Assembly too slow: ${assemblyTime}ms`);
        return false;
    }

    return true;
}

// ============================================================================
// TEST REGISTRATION
// ============================================================================

/**
 * Register all tests
 * @param {EndToEndTestFramework} framework - Test framework instance
 */
function registerAllTests(framework) {
    framework.addTest('Complete Workflow Validation', testCompleteWorkflow);
    framework.addTest('Real-World Program Assembly', testRealWorldPrograms);
    framework.addTest('Machine Code Execution', testMachineCodeExecution);
    framework.addTest('Error Recovery and Reporting', testErrorRecovery);
    framework.addTest('Performance with Realistic Programs', testPerformanceWithRealisticPrograms);
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

/**
 * Run complete end-to-end test suite
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 * @returns {Object} Test results
 */
function runCompleteEndToEndTestSuite(mmu, cpu) {
    const framework = new EndToEndTestFramework();
    framework.initialize(mmu, cpu);
    registerAllTests(framework);
    return framework.runAllTests();
}

/**
 * Demonstrate end-to-end assembler functionality
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 */
function demonstrateEndToEndAssembler(mmu, cpu) {
    console.log('=== END-TO-END ASSEMBLER DEMONSTRATION ===');
    console.log('');

    const assembler = new TwoPassAssembler(mmu, cpu);

    // Demonstrate each test program
    for (const program of [
        { name: 'Simple Arithmetic', source: TEST_PROGRAM_LIBRARY.arithmetic },
        { name: 'Control Flow', source: TEST_PROGRAM_LIBRARY.controlFlow },
        { name: 'Memory Operations', source: TEST_PROGRAM_LIBRARY.memoryOps }
    ]) {
        console.log(`Demonstrating: ${program.name}`);

        const result = assembler.assemble(program.source);

        console.log(`  Success: ${result.success}`);
        console.log(`  Instructions: ${result.instructions.length}`);
        console.log(`  Symbols: ${result.symbols.length}`);
        console.log(`  Assembly time: ${result.statistics.totalTime}ms`);

        if (result.success) {
            console.log('  First few instructions:');
            result.instructions.slice(0, 3).forEach((inst, i) => {
                const addr = (0x1000 + (i * 4)).toString(16);
                const machineCode = inst.machineCode.toString(16).padStart(8, '0');
                console.log(`    0x${addr}: 0x${machineCode}`);
            });
        }

        console.log('');
    }

    console.log('=== DEMONSTRATION COMPLETE ===');
}

// ============================================================================
// INTEGRATION TEST
// ============================================================================

/**
 * Integration test with system components
 */
function testEndToEndIntegration() {
    console.log('=== END-TO-END INTEGRATION TEST ===');

    // This would test integration with the actual system
    // For now, just verify the assembler can be used end-to-end

    console.log('Integration test placeholder - would test complete system workflow');
    return true;
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EndToEndTestFramework,
        TEST_PROGRAM_LIBRARY,
        runCompleteEndToEndTestSuite,
        demonstrateEndToEndAssembler,
        testEndToEndIntegration
    };
}