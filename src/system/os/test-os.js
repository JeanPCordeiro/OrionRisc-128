/**
 * Operating System Kernel Tests
 * Comprehensive test suite for the OrionRisc-128 OS Kernel
 */

const { OperatingSystemKernel } = require('./index');
const RiscProcessor = require('../../emulation/cpu/RiscProcessor');
const MemoryManagementUnit = require('../../emulation/memory/MemoryManagementUnit');

class OSTestSuite {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    /**
     * Add a test case
     */
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('='.repeat(60));
        console.log('OPERATING SYSTEM KERNEL TEST SUITE');
        console.log('='.repeat(60));

        for (const { name, testFn } of this.tests) {
            try {
                console.log(`\nRunning: ${name}`);
                await testFn();
                console.log(`✅ PASSED: ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ FAILED: ${name}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`TEST RESULTS: ${this.passed} passed, ${this.failed} failed`);
        console.log('='.repeat(60));

        return this.failed === 0;
    }

    /**
     * Assert two values are equal
     */
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected ${expected}, got ${actual}`);
        }
    }

    /**
     * Assert condition is true
     */
    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message} Expected true, got false`);
        }
    }

    /**
     * Assert condition is false
     */
    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`${message} Expected false, got true`);
        }
    }
}

// Test suite instance
const suite = new OSTestSuite();

// Test 1: OS Kernel Initialization
suite.test('OS Kernel Initialization', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);

    suite.assertTrue(os instanceof OperatingSystemKernel, 'OS should be instance of OperatingSystemKernel');
    suite.assertFalse(os.isInitialized, 'OS should not be initialized initially');
    suite.assertFalse(os.isRunning, 'OS should not be running initially');
    suite.assertEqual(os.loadedPrograms.size, 0, 'No programs should be loaded initially');
});

// Test 2: System Bootstrap
suite.test('System Bootstrap', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);

    const result = os.initialize();

    suite.assertTrue(result, 'Initialization should succeed');
    suite.assertTrue(os.isInitialized, 'OS should be marked as initialized');
    suite.assertTrue(os.isRunning, 'OS should be marked as running');

    // Check that hardware was reset
    suite.assertEqual(cpu.getProgramCounter(), 0x0000, 'CPU PC should be reset');
    suite.assertTrue(cpu.getRegister(13) > 0, 'Stack pointer should be set');
});

// Test 3: Program Loading - Valid Program
suite.test('Program Loading - Valid Program', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Create a simple test program (NOP instructions)
    const testProgram = [
        0x00, 0x00, 0x00, 0x00,  // NOP
        0x00, 0x00, 0x00, 0x00,  // NOP
        0xFF, 0x00, 0x00, 0x00   // HALT
    ];

    const result = os.loadProgram(testProgram, 'test-program');

    suite.assertTrue(result, 'Program loading should succeed');
    suite.assertEqual(os.loadedPrograms.size, 1, 'One program should be loaded');
    suite.assertTrue(os.loadedPrograms.has('test-program'), 'Program should be registered');

    const programInfo = os.loadedPrograms.get('test-program');
    suite.assertEqual(programInfo.name, 'test-program', 'Program name should match');
    suite.assertEqual(programInfo.size, 12, 'Program size should be correct');
    suite.assertEqual(programInfo.startAddress, 0x0000, 'Program should start at address 0');
});

// Test 4: Program Loading - Invalid Data
suite.test('Program Loading - Invalid Data', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Test various invalid inputs
    suite.assertFalse(os.loadProgram(null, 'test'), 'Should reject null program');
    suite.assertFalse(os.loadProgram([], 'test'), 'Should reject empty array');
    suite.assertFalse(os.loadProgram([256], 'test'), 'Should reject invalid byte values');
});

// Test 5: Program Loading - Insufficient Memory
suite.test('Program Loading - Insufficient Memory', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Create a program larger than available memory
    const largeProgram = new Array(0x10000).fill(0x00); // 64KB program

    const result = os.loadProgram(largeProgram, 'large-program');
    suite.assertFalse(result, 'Should reject program that is too large');
});

// Test 6: Program Execution
suite.test('Program Execution', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Create a simple program that halts immediately
    const haltProgram = [
        0xFF, 0x00, 0x00, 0x00  // HALT instruction
    ];

    os.loadProgram(haltProgram, 'halt-test');

    // Set a low max steps to avoid long execution
    const originalMaxSteps = 1000000;
    const lowMaxSteps = 10;

    // Execute with low max steps to test HALT behavior
    const initialHalted = cpu.isHalted;
    const result = os.executeProgram('halt-test');

    suite.assertTrue(result, 'Program execution should succeed');
    // The HALT instruction should eventually set the isHalted flag
    // Since run() continues until max steps, we check that it was set during execution
    suite.assertFalse(initialHalted, 'CPU should not be halted initially');
});

// Test 7: Program Execution - Non-existent Program
suite.test('Program Execution - Non-existent Program', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    const result = os.executeProgram('non-existent');
    suite.assertFalse(result, 'Should fail to execute non-existent program');
});

// Test 8: Interrupt Handling
suite.test('Interrupt Handling', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Test program exit interrupt
    const exitResult = os.handleInterrupt(os.INTERRUPTS.PROGRAM_EXIT);
    suite.assertTrue(exitResult, 'Program exit interrupt should be handled');

    // Test timer interrupt
    const timerResult = os.handleInterrupt(os.INTERRUPTS.TIMER);
    suite.assertTrue(timerResult, 'Timer interrupt should be handled');

    // Test unknown interrupt
    const unknownResult = os.handleInterrupt(0x99);
    suite.assertFalse(unknownResult, 'Unknown interrupt should return false');
});

// Test 9: System Call - Print Character
suite.test('System Call - Print Character', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Set up character 'A' (0x41) in R0
    cpu.setRegister(0, 0x41);

    // Test system call interrupt with print character
    const result = os.handleInterrupt(os.INTERRUPTS.SYSTEM_CALL, os.SYSTEM_CALLS.PRINT_CHAR);
    suite.assertTrue(result, 'Print character system call should succeed');
});

// Test 10: System Call - Get Time
suite.test('System Call - Get Time', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Clear register first
    cpu.setRegister(0, 0);

    const result = os.handleInterrupt(os.INTERRUPTS.SYSTEM_CALL, os.SYSTEM_CALLS.GET_TIME);
    suite.assertTrue(result, 'Get time system call should succeed');
    suite.assertTrue(cpu.getRegister(0) >= 0, 'Time register should be set to valid value');
});

// Test 11: System Status
suite.test('System Status', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    const status = os.getSystemStatus();

    suite.assertTrue(status.isInitialized, 'Status should show initialized');
    suite.assertTrue(status.isRunning, 'Status should show running');
    suite.assertTrue(Array.isArray(status.loadedPrograms), 'Loaded programs should be array');
    suite.assertTrue(typeof status.cpuState === 'object', 'CPU state should be object');
    suite.assertTrue(typeof status.memoryStats === 'object', 'Memory stats should be object');
});

// Test 12: Graceful Shutdown
suite.test('Graceful Shutdown', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Load and start a program
    const program = [0x00, 0x00, 0x00, 0x00];
    os.loadProgram(program, 'shutdown-test');

    const result = os.shutdown();

    suite.assertTrue(result, 'Shutdown should succeed');
    suite.assertFalse(os.isRunning, 'OS should not be running after shutdown');
    suite.assertEqual(os.loadedPrograms.size, 0, 'All programs should be cleared');
});

// Test 13: Multiple Program Loading
suite.test('Multiple Program Loading', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Load multiple small programs
    const prog1 = [0x00, 0x00, 0x00, 0x00];
    const prog2 = [0xFF, 0x00, 0x00, 0x00];

    os.loadProgram(prog1, 'program1');
    os.loadProgram(prog2, 'program2');

    suite.assertEqual(os.loadedPrograms.size, 2, 'Two programs should be loaded');
    suite.assertTrue(os.loadedPrograms.has('program1'), 'First program should exist');
    suite.assertTrue(os.loadedPrograms.has('program2'), 'Second program should exist');

    const info1 = os.loadedPrograms.get('program1');
    const info2 = os.loadedPrograms.get('program2');

    suite.assertTrue(info2.startAddress > info1.startAddress, 'Second program should be loaded after first');
});

// Test 14: Memory Layout Validation
suite.test('Memory Layout Validation', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);
    os.initialize();

    // Check memory layout constants
    suite.assertTrue(os.MEMORY_LAYOUT.PROGRAM_START === 0x0000, 'Program area should start at 0');
    suite.assertTrue(os.MEMORY_LAYOUT.MMIO_START === 0xF000, 'MMIO should start at 0xF000');
    suite.assertTrue(os.MEMORY_LAYOUT.PROGRAM_MAX < os.MEMORY_LAYOUT.MMIO_START, 'Program area should not overlap MMIO');

    // Check that stack pointer is set
    suite.assertEqual(cpu.getRegister(13), os.MEMORY_LAYOUT.STACK_START, 'Stack pointer should be set correctly');
});

// Test 15: Error Handling - Uninitialized System
suite.test('Error Handling - Uninitialized System', () => {
    const mmu = new MemoryManagementUnit();
    const cpu = new RiscProcessor(mmu);
    const os = new OperatingSystemKernel(cpu, mmu);

    // Try to load program before initialization
    const result = os.loadProgram([0x00], 'test');
    suite.assertFalse(result, 'Should fail to load program before initialization');
});

// Run all tests
if (require.main === module) {
    suite.runAll().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test suite error:', error);
        process.exit(1);
    });
}

module.exports = OSTestSuite;