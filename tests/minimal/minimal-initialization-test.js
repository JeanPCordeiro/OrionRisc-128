/**
 * Minimal Initialization Test for OrionRisc-128
 * Tests core MMU and CPU components without OS kernel
 * Focuses on byte order fixes and initialization sequence validation
 */

const RiscProcessor = require('../../src/emulation/cpu/RiscProcessor');
const MemoryManagementUnit = require('../../src/emulation/memory/MemoryManagementUnit');

class MinimalInitializationTest {
    constructor() {
        console.log('🧪 Starting Minimal Initialization Test...');
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    /**
     * Log test result
     */
    logTest(testName, passed, message = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`\n${status}: ${testName}`);
        if (message) {
            console.log(`   ${message}`);
        }

        this.testResults.tests.push({
            name: testName,
            passed: passed,
            message: message
        });

        if (passed) {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
        }
    }

    /**
     * Test 1: Basic component initialization
     */
    testInitialization() {
        console.log('\n🔧 Test 1: Basic Component Initialization');

        try {
            // Create MMU first
            console.log('   Creating MMU...');
            const mmu = new MemoryManagementUnit();

            // Verify MMU state
            console.log(`   MMU RAM size: ${mmu.RAM_SIZE} bytes`);
            console.log(`   MMU memory array length: ${mmu.memory.length}`);
            console.log(`   MMU DataView buffer size: ${mmu.dataView.byteLength}`);

            // Create CPU with MMU
            console.log('   Creating CPU with MMU...');
            const cpu = new RiscProcessor(mmu);

            // Verify CPU state
            console.log(`   CPU PC: 0x${cpu.getProgramCounter().toString(16)}`);
            console.log(`   CPU registers count: ${cpu.registers.length}`);
            console.log(`   CPU running: ${cpu.isRunning}`);
            console.log(`   CPU halted: ${cpu.isHalted}`);

            // Verify MMU is accessible from CPU
            console.log(`   CPU has MMU reference: ${cpu.mmu === mmu}`);

            this.logTest('Basic Initialization', true, 'MMU and CPU initialized successfully');
            return { mmu, cpu };

        } catch (error) {
            this.logTest('Basic Initialization', false, `Error: ${error.message}`);
            return null;
        }
    }

    /**
     * Test 2: Byte order validation
     */
    testByteOrder() {
        console.log('\n🔧 Test 2: Byte Order Validation');

        try {
            const mmu = new MemoryManagementUnit();

            // Test writing and reading a known 32-bit value
            const testAddress = 0x1000; // Word-aligned address
            const testValue = 0xDEADBEEF;

            console.log(`   Writing 0x${testValue.toString(16)} to address 0x${testAddress.toString(16)}`);

            // Write the value
            mmu.writeWord(testAddress, testValue);

            // Read it back
            const readValue = mmu.readWord(testAddress);

            console.log(`   Read back: 0x${readValue.toString(16)}`);

            // Verify the value matches
            if (readValue === testValue) {
                this.logTest('Byte Order Validation', true, `Write/read cycle successful: 0x${testValue.toString(16)}`);
                return true;
            } else {
                this.logTest('Byte Order Validation', false, `Value mismatch: wrote 0x${testValue.toString(16)}, read 0x${readValue.toString(16)}`);
                return false;
            }

        } catch (error) {
            this.logTest('Byte Order Validation', false, `Error: ${error.message}`);
            return false;
        }
    }

    /**
     * Test 3: Simple program execution
     */
    testSimpleProgram() {
        console.log('\n🔧 Test 3: Simple Program Execution');

        try {
            const mmu = new MemoryManagementUnit();
            const cpu = new RiscProcessor(mmu);

            // Create a simple program: LOAD R1, [R0 + 0x1000] then ADD R1, R0
            const program = [
                0x01101000, // LOAD R1, [R0 + 0x1000] - Load value from 0x1000 into R1
                0x03010000, // ADD R1, R0 - Add R0 to R1 (R1 = R1 + R0)
                0xFF000000  // HALT
            ];

            console.log('   Loading program:');
            console.log(`     0x${program[0].toString(16)} - LOAD R1, [R0 + 0x1000]`);
            console.log(`     0x${program[1].toString(16)} - ADD R1, R0`);
            console.log(`     0x${program[2].toString(16)} - HALT`);

            // Load program into memory
            cpu.loadProgram(program, 0x0000);

            // Set up test data in memory
            const testData = 0x0000002A; // 42 in decimal
            mmu.writeWord(0x1000, testData);

            console.log(`   Test data at 0x1000: 0x${testData.toString(16)} (${testData})`);

            // Verify initial state
            console.log(`   Initial PC: 0x${cpu.getProgramCounter().toString(16)}`);
            console.log(`   Initial R0: 0x${cpu.getRegister(0).toString(16)}`);
            console.log(`   Initial R1: 0x${cpu.getRegister(1).toString(16)}`);

            // Execute the program
            console.log('\n   Executing program...');
            const steps = cpu.run(10); // Run up to 10 steps

            console.log(`   Steps executed: ${steps}`);
            console.log(`   Final PC: 0x${cpu.getProgramCounter().toString(16)}`);
            console.log(`   Final R0: 0x${cpu.getRegister(0).toString(16)}`);
            console.log(`   Final R1: 0x${cpu.getRegister(1).toString(16)}`);
            console.log(`   CPU halted: ${cpu.isHalted}`);

            // Verify results
            const expectedR1 = testData; // R1 should contain the loaded value
            const actualR1 = cpu.getRegister(1);

            if (actualR1 === expectedR1) {
                this.logTest('Simple Program Execution', true, `R1 contains correct value: 0x${actualR1.toString(16)}`);
            } else {
                this.logTest('Simple Program Execution', false, `R1 value incorrect: expected 0x${expectedR1.toString(16)}, got 0x${actualR1.toString(16)}`);
            }

        } catch (error) {
            this.logTest('Simple Program Execution', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test 4: Memory access validation
     */
    testMemoryAccess() {
        console.log('\n🔧 Test 4: Memory Access Validation');

        try {
            const mmu = new MemoryManagementUnit();
            const cpu = new RiscProcessor(mmu);

            // Test various memory operations
            const testAddress = 0x2000;

            // Test byte write/read
            console.log('   Testing byte operations...');
            mmu.writeByte(testAddress, 0xAB);
            const byteValue = mmu.readByte(testAddress);

            if (byteValue === 0xAB) {
                console.log(`   ✅ Byte read/write: 0x${byteValue.toString(16)}`);
            } else {
                throw new Error(`Byte operation failed: wrote 0xAB, read 0x${byteValue.toString(16)}`);
            }

            // Test word write/read
            console.log('   Testing word operations...');
            mmu.writeWord(testAddress + 4, 0x12345678);
            const wordValue = mmu.readWord(testAddress + 4);

            if (wordValue === 0x12345678) {
                console.log(`   ✅ Word read/write: 0x${wordValue.toString(16)}`);
            } else {
                throw new Error(`Word operation failed: wrote 0x12345678, read 0x${wordValue.toString(16)}`);
            }

            // Test memory bounds
            console.log('   Testing memory bounds...');
            try {
                mmu.readByte(0x10000); // Should fail
                throw new Error('Memory bounds check failed');
            } catch (error) {
                if (error.message.includes('Address out of bounds')) {
                    console.log('   ✅ Memory bounds checking works');
                } else {
                    throw error;
                }
            }

            this.logTest('Memory Access Validation', true, 'All memory operations working correctly');

        } catch (error) {
            this.logTest('Memory Access Validation', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test 5: PC corruption detection
     */
    testPCCorruptionDetection() {
        console.log('\n🔧 Test 5: PC Corruption Detection');

        try {
            const mmu = new MemoryManagementUnit();
            const cpu = new RiscProcessor(mmu);

            // Test that CPU detects when PC points to character data
            console.log('   Testing PC corruption detection...');

            // Write character 'A' (0x41) to memory location 0x44 (word-aligned)
            mmu.writeByte(0x44, 0x41); // Write 'A' as MSB of a word

            // Manually set PC to 0x44 (this should trigger corruption detection)
            cpu.setProgramCounter(0x44);

            console.log(`   Set PC to 0x44 (potential corruption)`);

            // Try to execute - this should detect corruption
            const instruction = mmu.readWord(0x44);
            console.log(`   Instruction at PC: 0x${instruction.toString(16)}`);

            // The CPU should detect this as corruption in the step() method
            const result = cpu.step();

            if (!result && cpu.isHalted) {
                console.log('   ✅ PC corruption properly detected and handled');
                this.logTest('PC Corruption Detection', true, 'CPU correctly detects and handles PC corruption');
            } else {
                this.logTest('PC Corruption Detection', false, 'PC corruption detection may not be working');
            }

        } catch (error) {
            this.logTest('PC Corruption Detection', false, `Error: ${error.message}`);
        }
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Running Minimal Initialization Test Suite');
        console.log('=' .repeat(60));

        // Run individual tests
        this.testInitialization();
        this.testByteOrder();
        this.testSimpleProgram();
        this.testMemoryAccess();
        this.testPCCorruptionDetection();

        // Print summary
        console.log('\n' + '=' .repeat(60));
        console.log('TEST SUMMARY');
        console.log('=' .repeat(60));
        console.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

        if (this.testResults.failed === 0) {
            console.log('\n🎉 All tests passed! Core initialization is working correctly.');
            return true;
        } else {
            console.log('\n⚠️  Some tests failed. Check the output above for details.');
            return false;
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new MinimalInitializationTest();

    test.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('\n💥 Test suite failed:', error.message);
        process.exit(1);
    });
}

module.exports = MinimalInitializationTest;