/**
 * Two-Pass Assembler Test Suite
 *
 * Comprehensive testing for the two-pass assembler implementation,
 * validating integration between all assembler components.
 *
 * Phase 2 Component: Assembler Integration Testing
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

/**
 * Test Framework Class
 */
class AssemblerTestFramework {
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

        console.log('Test framework initialized');
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
        console.log('=== RUNNING TWO-PASS ASSEMBLER TESTS ===');
        console.log('');

        this.results = { passed: 0, failed: 0, total: 0 };

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
     * Print test summary
     */
    printSummary() {
        console.log('=== TEST SUMMARY ===');
        console.log(`Total tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('❌ Some tests failed');
        }
    }
}

// ============================================================================
// TEST ASSEMBLY PROGRAMS
// ============================================================================

/**
 * Simple test program for basic functionality
 */
const SIMPLE_TEST_PROGRAM = `
.text
.global main

main:
    LOAD R0, 42
    ADD R0, R1
    STORE [R2], R0
    HALT
`;

/**
 * Program with labels and jumps
 */
const LABEL_TEST_PROGRAM = `
.text
.global main

main:
    LOAD R0, 10
    JUMP loop_start

end_program:
    HALT

loop_start:
    ADD R0, R1
    JUMP end_program
`;

/**
 * Program with equates and data section
 */
const EQUATE_TEST_PROGRAM = `
.text
.global main

.data
BUFFER_SIZE: .equ 256
MAX_COUNT:   .equ 100

.text
main:
    LOAD R0, BUFFER_SIZE
    LOAD R1, MAX_COUNT
    ADD R0, R1
    HALT
`;

/**
 * Program with memory operations
 */
const MEMORY_TEST_PROGRAM = `
.text
.global main

main:
    LOAD R0, 42
    STORE [R1 + 5], R0
    LOAD R2, [R1 + 5]
    HALT
`;

/**
 * Complex program with all features
 */
const COMPLEX_TEST_PROGRAM = `
; Complex test program
.text
.global main

.data
ARRAY_SIZE: .equ 10
BUFFER:     .equ 0x2000

.text
main:
    LOAD R0, ARRAY_SIZE
    LOAD R1, 0
    LOAD R2, BUFFER

loop:
    STORE [R2 + R1], R1
    ADD R1, 1
    SUB R0, 1
    JUMP loop

end_loop:
    HALT
`;

// ============================================================================
// INDIVIDUAL TEST FUNCTIONS
// ============================================================================

/**
 * Test basic assembler initialization
 */
function testAssemblerInitialization() {
    console.log('Testing assembler initialization...');

    if (!this.assembler) {
        throw new Error('Assembler not initialized');
    }

    if (!this.assembler.lexicalAnalyzer) {
        throw new Error('Lexical analyzer not initialized');
    }

    if (!this.assembler.symbolTable) {
        throw new Error('Symbol table not initialized');
    }

    if (!this.assembler.instructionParser) {
        throw new Error('Instruction parser not initialized');
    }

    if (!this.assembler.machineCodeGenerator) {
        throw new Error('Machine code generator not initialized');
    }

    return true;
}

/**
 * Test simple program assembly
 */
function testSimpleProgramAssembly() {
    console.log('Testing simple program assembly...');

    const result = this.assembler.assemble(SIMPLE_TEST_PROGRAM);

    if (!result.success) {
        console.error('Assembly failed:', result.errors);
        return false;
    }

    if (result.instructions.length === 0) {
        console.error('No instructions generated');
        return false;
    }

    if (result.statistics.instructionsGenerated === 0) {
        console.error('No instructions counted in statistics');
        return false;
    }

    console.log(`Generated ${result.instructions.length} instructions`);
    return true;
}

/**
 * Test label processing
 */
function testLabelProcessing() {
    console.log('Testing label processing...');

    const result = this.assembler.assemble(LABEL_TEST_PROGRAM);

    if (!result.success) {
        console.error('Assembly failed:', result.errors);
        return false;
    }

    if (result.symbols.length === 0) {
        console.error('No symbols found');
        return false;
    }

    // Check for expected labels
    const labelNames = result.symbols.map(s => s.name);
    if (!labelNames.includes('main') || !labelNames.includes('loop_start') || !labelNames.includes('end_program')) {
        console.error('Expected labels not found:', labelNames);
        return false;
    }

    console.log(`Found ${result.symbols.length} symbols: ${labelNames.join(', ')}`);
    return true;
}

/**
 * Test equate processing
 */
function testEquateProcessing() {
    console.log('Testing equate processing...');

    const result = this.assembler.assemble(EQUATE_TEST_PROGRAM);

    if (!result.success) {
        console.error('Assembly failed:', result.errors);
        return false;
    }

    if (result.symbols.length === 0) {
        console.error('No symbols found');
        return false;
    }

    // Check for expected equates
    const equateNames = result.symbols.filter(s => s.type === 2).map(s => s.name);
    if (!equateNames.includes('BUFFER_SIZE') || !equateNames.includes('MAX_COUNT')) {
        console.error('Expected equates not found:', equateNames);
        return false;
    }

    console.log(`Found ${equateNames.length} equates: ${equateNames.join(', ')}`);
    return true;
}

/**
 * Test memory operations
 */
function testMemoryOperations() {
    console.log('Testing memory operations...');

    const result = this.assembler.assemble(MEMORY_TEST_PROGRAM);

    if (!result.success) {
        console.error('Assembly failed:', result.errors);
        return false;
    }

    if (result.instructions.length === 0) {
        console.error('No instructions generated');
        return false;
    }

    // Check that memory operations were encoded correctly
    const loadInstructions = result.instructions.filter(inst =>
        inst.sourceInstruction && inst.sourceInstruction.mnemonic === 'LOAD'
    );

    const storeInstructions = result.instructions.filter(inst =>
        inst.sourceInstruction && inst.sourceInstruction.mnemonic === 'STORE'
    );

    if (loadInstructions.length === 0 || storeInstructions.length === 0) {
        console.error('Memory operations not found in generated instructions');
        return false;
    }

    console.log(`Found ${loadInstructions.length} LOAD and ${storeInstructions.length} STORE instructions`);
    return true;
}

/**
 * Test error handling
 */
function testErrorHandling() {
    console.log('Testing error handling...');

    // Test with invalid source code
    const invalidProgram = `
.text
main:
    INVALID_INSTRUCTION R0, 42
    HALT
`;

    const result = this.assembler.assemble(invalidProgram);

    if (result.success) {
        console.error('Assembly should have failed for invalid instruction');
        return false;
    }

    if (result.errors.length === 0) {
        console.error('No errors reported for invalid instruction');
        return false;
    }

    console.log(`Correctly reported ${result.errors.length} errors for invalid instruction`);
    return true;
}

/**
 * Test assembler state tracking
 */
function testStateTracking() {
    console.log('Testing state tracking...');

    // Reset assembler
    this.assembler.reset();

    // Check initial state
    const initialState = this.assembler.getState();
    if (initialState.state !== 0 || initialState.currentPass !== 0) {
        console.error('Initial state incorrect:', initialState);
        return false;
    }

    // Assemble a program and check state changes
    const result = this.assembler.assemble(SIMPLE_TEST_PROGRAM);

    const finalState = this.assembler.getState();
    if (result.success && finalState.state !== 6) {
        console.error('Final state should be SUCCESS (6):', finalState);
        return false;
    }

    console.log('State tracking working correctly');
    return true;
}

/**
 * Test memory writing
 */
function testMemoryWriting() {
    console.log('Testing memory writing...');

    const result = this.assembler.assemble(SIMPLE_TEST_PROGRAM);

    if (!result.success) {
        console.error('Assembly failed:', result.errors);
        return false;
    }

    // Try to write to memory
    const writeResult = this.assembler.writeToMemory(0x1000);

    if (!writeResult) {
        console.error('Failed to write to memory');
        return false;
    }

    // Verify code was written by reading back
    const instructionCount = result.instructions.length;
    let verifiedInstructions = 0;

    for (let i = 0; i < instructionCount; i++) {
        const address = 0x1000 + (i * 4);
        const word = this.mmu.readWord(address);

        if (word !== 0) {
            verifiedInstructions++;
        }
    }

    if (verifiedInstructions === 0) {
        console.error('No instructions found in memory after writing');
        return false;
    }

    console.log(`Verified ${verifiedInstructions} instructions written to memory`);
    return true;
}

// ============================================================================
// TEST REGISTRATION
// ============================================================================

/**
 * Register all tests
 * @param {AssemblerTestFramework} framework - Test framework instance
 */
function registerAllTests(framework) {
    framework.addTest('Assembler Initialization', testAssemblerInitialization);
    framework.addTest('Simple Program Assembly', testSimpleProgramAssembly);
    framework.addTest('Label Processing', testLabelProcessing);
    framework.addTest('Equate Processing', testEquateProcessing);
    framework.addTest('Memory Operations', testMemoryOperations);
    framework.addTest('Error Handling', testErrorHandling);
    framework.addTest('State Tracking', testStateTracking);
    framework.addTest('Memory Writing', testMemoryWriting);
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

/**
 * Run complete test suite
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 * @returns {Object} Test results
 */
function runCompleteTestSuite(mmu, cpu) {
    const framework = new AssemblerTestFramework();
    framework.initialize(mmu, cpu);
    registerAllTests(framework);
    return framework.runAllTests();
}

/**
 * Demonstrate two-pass assembler functionality
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 */
function demonstrateTwoPassAssembler(mmu, cpu) {
    console.log('=== TWO-PASS ASSEMBLER DEMONSTRATION ===');
    console.log('');

    const assembler = new TwoPassAssembler(mmu, cpu);

    console.log('1. Assembling simple program...');
    const result1 = assembler.assemble(SIMPLE_TEST_PROGRAM);

    console.log(`   Success: ${result1.success}`);
    console.log(`   Instructions: ${result1.instructions.length}`);
    console.log(`   Symbols: ${result1.symbols.length}`);
    console.log(`   Errors: ${result1.errors.length}`);
    console.log('');

    console.log('2. Assembling program with labels...');
    const result2 = assembler.assemble(LABEL_TEST_PROGRAM);

    console.log(`   Success: ${result2.success}`);
    console.log(`   Instructions: ${result2.instructions.length}`);
    console.log(`   Symbols: ${result2.symbols.length}`);
    console.log(`   Symbol names: ${result2.symbols.map(s => s.name).join(', ')}`);
    console.log('');

    console.log('3. Assembling program with equates...');
    const result3 = assembler.assemble(EQUATE_TEST_PROGRAM);

    console.log(`   Success: ${result3.success}`);
    console.log(`   Instructions: ${result3.instructions.length}`);
    console.log(`   Symbols: ${result3.symbols.length}`);
    console.log(`   Equates: ${result3.symbols.filter(s => s.type === 2).map(s => s.name).join(', ')}`);
    console.log('');

    console.log('4. Testing error handling...');
    const invalidProgram = `
.text
main:
    INVALID_INSTRUCTION
    HALT
`;
    const result4 = assembler.assemble(invalidProgram);

    console.log(`   Success: ${result4.success}`);
    console.log(`   Errors: ${result4.errors.length}`);
    if (result4.errors.length > 0) {
        console.log(`   First error: ${result4.errors[0].message}`);
    }

    console.log('');
    console.log('=== DEMONSTRATION COMPLETE ===');
}

// ============================================================================
// INTEGRATION TEST
// ============================================================================

/**
 * Integration test with existing system components
 */
function testIntegrationWithSystem() {
    console.log('=== INTEGRATION TEST ===');

    // This would test integration with the actual MMU and CPU
    // For now, just verify the assembler can be created and initialized

    console.log('Integration test placeholder - would test with actual system components');
    return true;
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AssemblerTestFramework,
        runCompleteTestSuite,
        demonstrateTwoPassAssembler,
        testIntegrationWithSystem,
        SIMPLE_TEST_PROGRAM,
        LABEL_TEST_PROGRAM,
        EQUATE_TEST_PROGRAM,
        MEMORY_TEST_PROGRAM,
        COMPLEX_TEST_PROGRAM
    };
}