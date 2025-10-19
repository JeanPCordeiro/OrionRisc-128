/**
 * OrionRisc-128 Processor Tests
 *
 * Comprehensive test suite for the processor emulation.
 * Tests all instructions, addressing modes, and edge cases.
 */

import Processor from '../src/hardware/processor.js';
import Memory from '../src/hardware/memory.js';
import { TestFramework, DevelopmentTools } from '../tools/dev_tools.js';

class ProcessorTests {
    constructor() {
        this.processor = null;
        this.memory = null;
        this.testFramework = null;
        this.devTools = null;
    }

    /**
     * Initialize test environment
     */
    initialize() {
        this.memory = new Memory();
        this.processor = new Processor(this.memory);
        this.testFramework = new TestFramework(this.processor, this.memory);
        this.devTools = new DevelopmentTools();
        this.devTools.initialize(this.processor, this.memory);

        this.setupTests();
    }

    /**
     * Setup all test cases
     */
    setupTests() {
        this.testFramework.addTest('Processor Reset', this.testProcessorReset.bind(this));
        this.testFramework.addTest('Arithmetic Operations', this.testArithmeticOperations.bind(this));
        this.testFramework.addTest('Logical Operations', this.testLogicalOperations.bind(this));
        this.testFramework.addTest('Memory Operations', this.testMemoryOperations.bind(this));
        this.testFramework.addTest('Control Flow', this.testControlFlow.bind(this));
        this.testFramework.addTest('I/O Operations', this.testIOOperations.bind(this));
        this.testFramework.addTest('Flag Operations', this.testFlagOperations.bind(this));
        this.testFramework.addTest('Edge Cases', this.testEdgeCases.bind(this));
    }

    /**
     * Test processor reset functionality
     */
    testProcessorReset() {
        // Set some non-zero values
        this.processor.registers[1] = 0x1234;
        this.processor.registers[2] = 0x5678;
        this.processor.pc = 0x1000;
        this.processor.flags.carry = true;
        this.processor.flags.zero = true;

        // Reset processor
        this.processor.reset();

        // Verify all registers are zero
        for (let i = 0; i < 8; i++) {
            this.testFramework.assertEqual(this.processor.registers[i], 0, `Register R${i} should be 0 after reset`);
        }

        // Verify PC is reset
        this.testFramework.assertEqual(this.processor.pc, 0, 'PC should be 0 after reset');

        // Verify flags are reset
        this.testFramework.assertFalse(this.processor.flags.carry, 'Carry flag should be false after reset');
        this.testFramework.assertFalse(this.processor.flags.zero, 'Zero flag should be false after reset');
        this.testFramework.assertFalse(this.processor.flags.overflow, 'Overflow flag should be false after reset');
        this.testFramework.assertFalse(this.processor.flags.negative, 'Negative flag should be false after reset');
    }

    /**
     * Test arithmetic operations
     */
    testArithmeticOperations() {
        // Test ADD
        this.processor.reset();
        this.processor.registers[1] = 10;
        this.processor.executeInstruction(0x0081); // ADD R0, R1, 5 (but R0 is always 0)
        this.testFramework.assertEqual(this.processor.registers[0], 5, 'ADD result should be 5');

        // Test SUB
        this.processor.reset();
        this.processor.registers[1] = 20;
        this.processor.executeInstruction(0x0115); // SUB R0, R1, 5
        this.testFramework.assertEqual(this.processor.registers[0], 15, 'SUB result should be 15');

        // Test MUL
        this.processor.reset();
        this.processor.registers[1] = 6;
        this.processor.executeInstruction(0x0212); // MUL R0, R1, 7
        this.testFramework.assertEqual(this.processor.registers[0], 42, 'MUL result should be 42');

        // Test overflow in MUL
        this.processor.reset();
        this.processor.registers[1] = 0xFFFF;
        this.processor.executeInstruction(0x0212); // MUL R0, R1, 2
        this.testFramework.assertTrue(this.processor.flags.overflow, 'MUL should set overflow flag');

        // Test DIV
        this.processor.reset();
        this.processor.registers[1] = 42;
        this.processor.executeInstruction(0x0316); // DIV R0, R1, 6
        this.testFramework.assertEqual(this.processor.registers[0], 7, 'DIV result should be 7');

        // Test division by zero
        this.processor.reset();
        this.processor.registers[1] = 42;
        try {
            this.processor.executeInstruction(0x0310); // DIV R0, R1, 0
            this.testFramework.assertTrue(false, 'Division by zero should throw error');
        } catch (error) {
            this.testFramework.assertTrue(error.message.includes('Division by zero'), 'Should throw division by zero error');
        }
    }

    /**
     * Test logical operations
     */
    testLogicalOperations() {
        // Test AND
        this.processor.reset();
        this.processor.registers[1] = 0x0F0F;
        this.processor.executeInstruction(0x041F); // AND R0, R1, 0x0F
        this.testFramework.assertEqual(this.processor.registers[0], 0x0F, 'AND result should be 0x0F');

        // Test OR
        this.processor.reset();
        this.processor.registers[1] = 0x0F0F;
        this.processor.executeInstruction(0x051F0); // OR R0, R1, 0xF0
        this.testFramework.assertEqual(this.processor.registers[0], 0x0FFF, 'OR result should be 0x0FFF');

        // Test XOR
        this.processor.reset();
        this.processor.registers[1] = 0x0FF0;
        this.processor.executeInstruction(0x061F0F); // XOR R0, R1, 0x0F
        this.testFramework.assertEqual(this.processor.registers[0], 0x0FFF, 'XOR result should be 0x0FFF');

        // Test NOT
        this.processor.reset();
        this.processor.registers[1] = 0x0FF0;
        this.processor.executeInstruction(0x0710); // NOT R0, R1
        this.testFramework.assertEqual(this.processor.registers[0], 0xF00F, 'NOT result should be 0xF00F');
    }

    /**
     * Test memory operations
     */
    testMemoryOperations() {
        // Test LDI (Load Immediate)
        this.processor.reset();
        this.processor.executeInstruction(0x0A02A); // LDI R0, 42
        this.testFramework.assertEqual(this.processor.registers[0], 42, 'LDI should load 42');

        // Test LDA (Load Address)
        this.processor.reset();
        this.processor.executeInstruction(0x0B1AA); // LDA R1, 0x2A
        this.testFramework.assertEqual(this.processor.registers[1], 0x2A, 'LDA should load 0x2A');

        // Test ST (Store) and LD (Load)
        this.processor.reset();
        this.processor.registers[1] = 0x1234;
        this.processor.registers[0] = 0x100; // Base address
        this.processor.executeInstruction(0x0901); // ST [R0+1], R1 (store at 0x101)
        this.processor.executeInstruction(0x0802); // LD R2, [R0+1] (load from 0x101)
        this.testFramework.assertEqual(this.processor.registers[2], 0x1234, 'LD/ST should work correctly');

        // Test sign extension in LDI
        this.processor.reset();
        this.processor.executeInstruction(0x0A23F); // LDI R0, 0x3F (should be positive)
        this.testFramework.assertEqual(this.processor.registers[0], 0x003F, 'LDI positive should not sign extend');

        this.processor.reset();
        this.processor.executeInstruction(0x0A220); // LDI R0, 0x20 (should be negative)
        this.testFramework.assertEqual(this.processor.registers[0], 0xFFE0, 'LDI negative should sign extend');
    }

    /**
     * Test control flow operations
     */
    testControlFlow() {
        // Test JMP
        this.processor.reset();
        this.processor.pc = 0x100;
        this.processor.executeInstruction(0x0C0AA); // JMP 0x2A
        this.testFramework.assertEqual(this.processor.pc, 0x2A, 'JMP should set PC to 0x2A');

        // Test JZ (jump if zero)
        this.processor.reset();
        this.processor.pc = 0x100;
        this.processor.flags.zero = true;
        this.processor.executeInstruction(0x0D0AA); // JZ R0, 0x2A
        this.testFramework.assertEqual(this.processor.pc, 0x2A, 'JZ should jump when zero flag is set');

        this.processor.reset();
        this.processor.pc = 0x100;
        this.processor.flags.zero = false;
        this.processor.executeInstruction(0x0D0AA); // JZ R0, 0x2A
        this.testFramework.assertEqual(this.processor.pc, 0x102, 'JZ should not jump when zero flag is clear');

        // Test JNZ (jump if not zero)
        this.processor.reset();
        this.processor.pc = 0x100;
        this.processor.flags.zero = false;
        this.processor.executeInstruction(0x0E0AA); // JNZ R0, 0x2A
        this.testFramework.assertEqual(this.processor.pc, 0x2A, 'JNZ should jump when zero flag is clear');

        this.processor.reset();
        this.processor.pc = 0x100;
        this.processor.flags.zero = true;
        this.processor.executeInstruction(0x0E0AA); // JNZ R0, 0x2A
        this.testFramework.assertEqual(this.processor.pc, 0x102, 'JNZ should not jump when zero flag is set');

        // Test CALL
        this.processor.reset();
        this.processor.pc = 0x100;
        this.processor.registers[1] = 0x200;
        this.processor.executeInstruction(0x0F10); // CALL R1
        this.testFramework.assertEqual(this.processor.pc, 0x200, 'CALL should set PC to target address');
        this.testFramework.assertEqual(this.processor.registers[3], 0x102, 'CALL should save return address in R3');
    }

    /**
     * Test I/O operations
     */
    testIOOperations() {
        // Test IN (Input)
        this.processor.reset();
        this.processor.executeInstruction(0x10001); // IN R0, 1 (timer)
        this.testFramework.assertTrue(this.processor.registers[0] >= 0, 'IN should return non-negative value');

        // Test OUT (Output)
        this.processor.reset();
        this.processor.registers[1] = 0x41; // 'A'
        this.processor.executeInstruction(0x11100); // OUT 0, R1 (console)
        // Output is logged to console, so we just verify it doesn't crash

        // Test HALT
        this.processor.reset();
        this.processor.executeInstruction(0x12000); // HALT
        this.testFramework.assertTrue(this.processor.halted, 'HALT should set halted flag');

        // Test NOP
        this.processor.reset();
        const cyclesBefore = this.processor.cycles;
        this.processor.executeInstruction(0x13000); // NOP
        this.testFramework.assertEqual(this.processor.cycles, cyclesBefore + 1, 'NOP should increment cycles');
    }

    /**
     * Test flag operations
     */
    testFlagOperations() {
        // Test zero flag
        this.processor.reset();
        this.processor.executeInstruction(0x0A200); // LDI R0, 0
        this.testFramework.assertTrue(this.processor.flags.zero, 'Loading 0 should set zero flag');
        this.testFramework.assertFalse(this.processor.flags.negative, 'Loading 0 should not set negative flag');

        // Test negative flag
        this.processor.reset();
        this.processor.executeInstruction(0x0A23F); // LDI R0, -1 (sign extended)
        this.testFramework.assertTrue(this.processor.flags.negative, 'Loading negative value should set negative flag');

        // Test carry flag in addition
        this.processor.reset();
        this.processor.registers[1] = 0xFFFF;
        this.processor.executeInstruction(0x0011); // ADD R0, R1, 1
        this.testFramework.assertTrue(this.processor.flags.carry, 'Addition overflow should set carry flag');
    }

    /**
     * Test edge cases and error conditions
     */
    testEdgeCases() {
        // Test register R0 behavior (always reads as 0)
        this.processor.reset();
        this.processor.registers[0] = 0x1234; // Try to write to R0
        this.testFramework.assertEqual(this.processor.registers[0], 0, 'R0 should always read as 0');

        // Test invalid opcode handling
        this.processor.reset();
        try {
            this.processor.executeInstruction(0xF000); // Invalid opcode
            this.testFramework.assertTrue(false, 'Invalid opcode should throw error');
        } catch (error) {
            this.testFramework.assertTrue(error.message.includes('Unknown opcode'), 'Should throw unknown opcode error');
        }

        // Test memory boundary access
        this.processor.reset();
        this.processor.registers[0] = 0x1FFFF; // Maximum address
        this.processor.registers[1] = 0x1234;
        this.processor.executeInstruction(0x0900); // ST [R0+0], R1
        this.testFramework.assertEqual(this.memory.readWord(0x1FFFF), 0x1234, 'Should handle maximum address correctly');

        // Test memory wraparound (address masking)
        this.processor.reset();
        this.processor.registers[0] = 0x20000; // One past maximum
        this.processor.registers[1] = 0x5678;
        this.processor.executeInstruction(0x0900); // ST [R0+0], R1
        this.testFramework.assertEqual(this.memory.readWord(0x0000), 0x5678, 'Should wrap around address correctly');
    }

    /**
     * Run all processor tests
     * @returns {object} Test results
     */
    runAllTests() {
        this.initialize();
        return this.testFramework.runAllTests();
    }

    /**
     * Run a specific test
     * @param {string} testName - Name of test to run
     * @returns {object} Test result
     */
    runSpecificTest(testName) {
        this.initialize();

        const test = this.testFramework.tests.find(t => t.name === testName);
        if (!test) {
            throw new Error(`Test '${testName}' not found`);
        }

        return this.testFramework.runTest(test);
    }

    /**
     * Create a comprehensive test program
     * @returns {string} Assembly code for comprehensive test
     */
    createComprehensiveTest() {
        return `
            ; Comprehensive Processor Test Program
            .org 0x0000

            ; Test arithmetic operations
            LDI R1, 10
            LDI R2, 20
            ADD R3, R1, 5      ; R3 = 15
            SUB R4, R2, 3      ; R4 = 17
            MUL R5, R1, 3      ; R5 = 30

            ; Test memory operations
            LDI R6, 0x42
            ST [R0+0x100], R6  ; Store 0x42 at 0x100
            LD R7, [R0+0x100]  ; Load from 0x100 into R7

            ; Test logical operations
            LDI R1, 0x0F0F
            LDI R2, 0x00FF
            AND R3, R1, R2     ; R3 = 0x000F
            OR R4, R1, R2      ; R4 = 0x0FFF
            XOR R5, R1, R2     ; R5 = 0x0FF0
            NOT R6, R1         ; R6 = 0xF0F0

            ; Test control flow
            LDI R1, 0
        loop:
            ADD R1, R1, 1
            JZ R1, end
            JMP loop
        end:

            ; Test I/O
            IN R2, 1           ; Read timer
            LDI R3, 65         ; 'A'
            OUT 0, R3          ; Output 'A'

            ; Final result in R1 (should be 5)
            HALT
        `;
    }

    /**
     * Test the comprehensive program
     * @returns {object} Test result
     */
    testComprehensiveProgram() {
        this.initialize();

        const program = this.createComprehensiveTest();
        const machineCode = this.devTools.assemble(program);

        // Load and run the program
        this.memory.loadProgram(machineCode);
        this.processor.reset();
        this.processor.pc = 0;

        // Run until halt
        let cycles = 0;
        const maxCycles = 1000;

        while (!this.processor.halted && cycles < maxCycles) {
            this.processor.step();
            cycles++;
        }

        // Verify final state
        this.testFramework.assertEqual(this.processor.registers[1], 5, 'Final result should be 5');
        this.testFramework.assertTrue(this.processor.halted, 'Processor should be halted');
        this.testFramework.assertTrue(cycles < maxCycles, 'Program should complete within cycle limit');

        return {
            name: 'Comprehensive Program Test',
            passed: true,
            cycles: cycles,
            finalRegisters: Array.from(this.processor.registers)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProcessorTests;
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    const tests = new ProcessorTests();
    const results = tests.runAllTests();

    console.log('Processor Test Results:');
    console.log(`Total: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${results.successRate.toFixed(1)}%`);

    if (results.failed > 0) {
        console.log('\nFailed Tests:');
        results.results.filter(r => !r.passed).forEach(result => {
            console.log(`- ${result.name}: ${result.error}`);
        });
    }

    // Run comprehensive test
    try {
        const comprehensiveResult = tests.testComprehensiveProgram();
        console.log(`\nComprehensive Test: ${comprehensiveResult.passed ? 'PASSED' : 'FAILED'}`);
        console.log(`Cycles: ${comprehensiveResult.cycles}`);
    } catch (error) {
        console.log(`\nComprehensive Test: FAILED - ${error.message}`);
    }
}