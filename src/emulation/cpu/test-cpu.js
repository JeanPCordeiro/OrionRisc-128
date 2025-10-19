/**
 * Unit Tests for RiscProcessor (CPU)
 * Tests all major functionality including instruction execution,
 * register operations, memory integration, and error handling
 */

const { RiscProcessor } = require('./index');
const MemoryManagementUnit = require('../memory/MemoryManagementUnit');

console.log('Starting RISC Processor Tests...\n');

// Test 1: CPU Initialization
function testInitialization() {
    console.log('=== Test 1: CPU Initialization ===');

    try {
        // Test MMU dependency
        let error;
        try {
            new RiscProcessor();
        } catch (e) {
            error = e;
        }
        if (!error || !error.message.includes('MemoryManagementUnit')) {
            throw new Error('CPU should require MMU instance');
        }

        // Test successful initialization
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);

        if (cpu.registers.length !== 16) {
            throw new Error(`Expected 16 registers, got ${cpu.registers.length}`);
        }

        if (cpu.programCounter !== 0x0000) {
            throw new Error(`Expected PC 0x0000, got 0x${cpu.programCounter.toString(16)}`);
        }

        if (cpu.isRunning !== false || cpu.isHalted !== false) {
            throw new Error('CPU should start in stopped, non-halted state');
        }

        console.log('✓ CPU initialization test passed');

    } catch (error) {
        console.error('✗ CPU initialization test failed:', error.message);
        return false;
    }

    return true;
}

// Test 2: Register Operations
function testRegisterOperations() {
    console.log('=== Test 2: Register Operations ===');

    try {
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);

        // Test setting and getting registers
        cpu.setRegister(0, 0x12345678);
        if (cpu.getRegister(0) !== 0x12345678) {
            throw new Error('Register set/get failed');
        }

        // Test register validation
        let error;
        try {
            cpu.setRegister(16, 0);
        } catch (e) {
            error = e;
        }
        if (!error || !error.message.includes('out of range')) {
            throw new Error('Should reject invalid register index');
        }

        try {
            cpu.setRegister(0, -1);
        } catch (e) {
            error = e;
        }
        if (!error || !error.message.includes('out of range')) {
            throw new Error('Should reject negative register value');
        }

        try {
            cpu.setRegister(0, 0x100000000);
        } catch (e) {
            error = e;
        }
        if (!error || !error.message.includes('out of range')) {
            throw new Error('Should reject register value > 0xFFFFFFFF');
        }

        console.log('✓ Register operations test passed');

    } catch (error) {
        console.error('✗ Register operations test failed:', error.message);
        return false;
    }

    return true;
}

// Test 3: Program Counter Operations
function testProgramCounter() {
    console.log('=== Test 3: Program Counter Operations ===');

    try {
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);

        // Test PC operations
        cpu.setProgramCounter(0x1000);
        if (cpu.getProgramCounter() !== 0x1000) {
            throw new Error('PC set/get failed');
        }

        // Test PC validation
        let error;
        try {
            cpu.setProgramCounter(-1);
        } catch (e) {
            error = e;
        }
        if (!error || !error.message.includes('out of range')) {
            throw new Error('Should reject negative PC address');
        }

        try {
            cpu.setProgramCounter(0x10000);
        } catch (e) {
            error = e;
        }
        if (!error || !error.message.includes('out of range')) {
            throw new Error('Should reject PC address > 0xFFFF');
        }

        console.log('✓ Program counter test passed');

    } catch (error) {
        console.error('✗ Program counter test failed:', error.message);
        return false;
    }

    return true;
}

// Test 4: CPU Reset
function testReset() {
    console.log('=== Test 4: CPU Reset ===');

    try {
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);

        // Set some state
        cpu.setRegister(0, 0x12345678);
        cpu.setProgramCounter(0x1000);
        cpu.isRunning = true;
        cpu.isHalted = true;

        // Reset
        cpu.reset();

        // Check reset state
        if (cpu.getRegister(0) !== 0x00000000) {
            throw new Error('Register not cleared on reset');
        }

        if (cpu.getProgramCounter() !== 0x0000) {
            throw new Error('PC not reset');
        }

        if (cpu.isRunning !== false || cpu.isHalted !== false) {
            throw new Error('CPU state not reset');
        }

        console.log('✓ CPU reset test passed');

    } catch (error) {
        console.error('✗ CPU reset test failed:', error.message);
        return false;
    }

    return true;
}

// Test 5: Instruction Execution
function testInstructionExecution() {
    console.log('=== Test 5: Instruction Execution ===');

    try {
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);

        // Test NOP instruction
        const nopResult = cpu.execute(0x00000000); // NOP
        if (!nopResult) {
            throw new Error('NOP should return true');
        }

        // Test ADD instruction
        cpu.setRegister(0, 10);
        cpu.setRegister(1, 20);
        cpu.execute(0x03010100); // ADD R0, R1 (opcode 0x03, reg1=0, reg2=1, immediate=0x0100)
        if (cpu.getRegister(0) !== 30) {
            throw new Error(`ADD failed: expected 30, got ${cpu.getRegister(0)}`);
        }

        // Test SUB instruction
        cpu.setRegister(0, 50);
        cpu.setRegister(1, 20);
        cpu.execute(0x04010100); // SUB R0, R1 (opcode 0x04, reg1=0, reg2=1, immediate=0x0100)
        if (cpu.getRegister(0) !== 30) {
            throw new Error(`SUB failed: expected 30, got ${cpu.getRegister(0)}`);
        }

        // Test LOAD instruction
        const testMmu = new MemoryManagementUnit(); // Fresh MMU for this test
        const testCpu = new RiscProcessor(testMmu); // Fresh CPU for this test
        testMmu.writeWord(0x1000, 0xDEADBEEF); // Use word-aligned address
        console.log(`Debug: Before setRegister, register_1_value=${testCpu.getRegister(1).toString(16)}`);
        testCpu.setRegister(1, 0x0000); // Base address in register 1 (we'll use immediate offset)
        console.log(`Debug: After setRegister, register_1_value=${testCpu.getRegister(1).toString(16)}`);
        const loadInstruction = 0x01011000; // LOAD R0, [R1 + 0x1000]
        const opcode = (loadInstruction >> 24) & 0xFF;
        const reg1 = (loadInstruction >> 20) & 0x0F;
        const reg2 = (loadInstruction >> 16) & 0x0F;
        const immediate = loadInstruction & 0xFFFF;
        console.log(`Debug LOAD: opcode=${opcode}, reg1=${reg1}, reg2=${reg2}, immediate=${immediate}`);
        testCpu.execute(loadInstruction);
        if (testCpu.getRegister(0) !== 0xDEADBEEF) {
            console.log(`Debug: reg2=${reg2}, immediate=${immediate}, register_1_value=${testCpu.getRegister(1)}, register_1_hex=0x${testCpu.getRegister(1).toString(16)}, calculated_address=${(testCpu.getRegister(1) + 0x1000) & 0xFFFF}`);
            console.log(`Debug: testMmu.readWord(0x1000)=${testMmu.readWord(0x1000).toString(16)}`);
            throw new Error(`LOAD failed: expected 0xDEADBEEF, got 0x${testCpu.getRegister(0).toString(16)}`);
        }

        // Test STORE instruction
        testCpu.setRegister(0, 0xCAFEBABE);
        testCpu.setRegister(1, 0x0000); // Base address in register 1
        testCpu.execute(0x02011000); // STORE R0, [R1 + 0x1000] (opcode 0x02, reg1=0, reg2=1, immediate=0x1000)
        if (testMmu.readWord(0x1000) !== 0xCAFEBABE) {
            throw new Error(`STORE failed: expected 0xCAFEBABE, got 0x${testMmu.readWord(0x1000).toString(16)}`);
        }

        // Test HALT instruction
        const haltResult = cpu.execute(0xFF000000); // HALT
        if (haltResult) {
            throw new Error('HALT should return false');
        }
        if (!cpu.isHalted) {
            throw new Error('CPU should be halted after HALT instruction');
        }

        console.log('✓ Instruction execution test passed');

    } catch (error) {
        console.error('✗ Instruction execution test failed:', error.message);
        return false;
    }

    return true;
}

// Test 6: Step Execution
function testStepExecution() {
    console.log('=== Test 6: Step Execution ===');

    try {
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);

        // Load a simple program
        const program = [
            0x01011000, // LOAD R0, [R1 + 0x1000]
            0x03010100, // ADD R0, R1
            0xFF000000  // HALT
        ];

        cpu.loadProgram(program, 0x0000);

        // Set up data
        mmu.writeWord(0x1000, 42); // Data for LOAD (word-aligned)
        cpu.setRegister(1, 0x0000); // Base register (address will be 0x0000 + 0x1000 = 0x1000)

        // Execute first step (LOAD)
        const step1Result = cpu.step();
        if (!step1Result) {
            throw new Error('First step should succeed');
        }
        if (cpu.getRegister(0) !== 42) {
            throw new Error(`LOAD step failed: expected 42, got ${cpu.getRegister(0)}`);
        }
        if (cpu.getProgramCounter() !== 0x0004) {
            throw new Error(`PC should advance to 0x0004, got 0x${cpu.getProgramCounter().toString(16)}`);
        }

        // Execute second step (ADD)
        cpu.setRegister(1, 8); // Value to add (42 + 8 = 50)
        const step2Result = cpu.step();
        if (!step2Result) {
            throw new Error('Second step should succeed');
        }
        if (cpu.getRegister(0) !== 50) {
            throw new Error(`ADD step failed: expected 50, got ${cpu.getRegister(0)}`);
        }
        if (cpu.getProgramCounter() !== 0x0008) {
            throw new Error(`PC should advance to 0x0008, got 0x${cpu.getProgramCounter().toString(16)}`);
        }

        // Execute third step (HALT)
        const step3Result = cpu.step();
        if (step3Result) {
            throw new Error('HALT step should return false');
        }
        if (!cpu.isHalted) {
            throw new Error('CPU should be halted after HALT step');
        }

        console.log('✓ Step execution test passed');

    } catch (error) {
        console.error('✗ Step execution test failed:', error.message);
        return false;
    }

    return true;
}

// Test 7: Program Loading
function testProgramLoading() {
    console.log('=== Test 7: Program Loading ===');

    try {
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);

        // Test program loading
        const program = [
            0x01010000, // LOAD R0, [R1 + 0]
            0x03000100, // ADD R0, R1
            0x02020000  // STORE R0, [R2 + 0]
        ];

        cpu.loadProgram(program, 0x1000);

        if (cpu.getProgramCounter() !== 0x1000) {
            throw new Error(`PC should be set to 0x1000, got 0x${cpu.getProgramCounter().toString(16)}`);
        }

        // Verify program in memory
        if (mmu.readWord(0x1000) !== 0x01010000) {
            throw new Error('First instruction not loaded correctly');
        }
        if (mmu.readWord(0x1004) !== 0x03000100) {
            throw new Error('Second instruction not loaded correctly');
        }
        if (mmu.readWord(0x1008) !== 0x02020000) {
            throw new Error('Third instruction not loaded correctly');
        }

        // Test invalid program
        let error;
        try {
            cpu.loadProgram('not an array');
        } catch (e) {
            error = e;
        }
        if (!error || !error.message.includes('must be an array')) {
            throw new Error('Should reject non-array program');
        }

        console.log('✓ Program loading test passed');

    } catch (error) {
        console.error('✗ Program loading test failed:', error.message);
        return false;
    }

    return true;
}

// Test 8: Error Handling
function testErrorHandling() {
    console.log('=== Test 8: Error Handling ===');

    try {
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);

        // Test invalid instruction
        cpu.isHalted = false; // Reset halt state
        const invalidResult = cpu.execute(0x99000000); // Invalid opcode
        if (invalidResult) {
            throw new Error('Invalid instruction should return false');
        }
        if (!cpu.isHalted) {
            throw new Error('CPU should be halted after invalid instruction');
        }

        // Reset for next test
        cpu.reset();
        cpu.isHalted = false;

        // Test memory access error (LOAD from unaligned address)
        cpu.setRegister(1, 0x0001); // Unaligned address (not divisible by 4)
        const memoryErrorResult = cpu.execute(0x01010000); // LOAD R0, [R1 + 0]
        if (memoryErrorResult) {
            throw new Error('Unaligned memory access should return false');
        }
        if (!cpu.isHalted) {
            throw new Error('CPU should be halted after unaligned memory access');
        }

        console.log('✓ Error handling test passed');

    } catch (error) {
        console.error('✗ Error handling test failed:', error.message);
        return false;
    }

    return true;
}

// Run all tests
function runAllTests() {
    const tests = [
        testInitialization,
        testRegisterOperations,
        testProgramCounter,
        testReset,
        testInstructionExecution,
        testStepExecution,
        testProgramLoading,
        testErrorHandling
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        if (test()) {
            passed++;
        } else {
            failed++;
        }
    }

    console.log(`\n=== Test Results ===`);
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! RISC Processor is ready for integration.');
        return true;
    } else {
        console.log(`\n❌ ${failed} test(s) failed. Please review and fix issues before proceeding.`);
        return false;
    }
}

// Execute all tests
runAllTests();