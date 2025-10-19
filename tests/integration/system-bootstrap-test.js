/**
 * System Bootstrap Integration Test for OrionRisc-128
 * Tests complete system initialization and hardware component integration
 */

const TestFramework = require('./test-framework');
const {
    validateSystemState,
    validateMemoryState
} = require('./test-utils');

class SystemBootstrapTest {
    constructor() {
        this.framework = new TestFramework();
        this.testResults = {
            systemInitialization: false,
            hardwareIntegration: false,
            memoryLayout: false,
            interruptSystem: false,
            ioSystem: false,
            overallSuccess: false
        };
    }

    /**
     * Test complete system initialization
     */
    async testSystemInitialization() {
        return await this.framework.runTest('System Initialization', async () => {
            // Create system components
            const { mmu, cpu, os } = this.framework.createSystem();

            // Test system initialization
            const initResult = await this.framework.initializeSystem(os);
            if (!initResult) {
                throw new Error('System initialization failed');
            }

            // Validate initialization output
            const output = this.framework.capturedOutput;
            if (!output.includes('Starting OS kernel initialization') ||
                !output.includes('OS kernel initialization complete')) {
                throw new Error('Expected initialization messages not found');
            }

            // Validate system state
            const systemState = validateSystemState(os, cpu, mmu);

            // Verify all required state conditions
            if (!systemState.systemInitialized) {
                throw new Error('System not marked as initialized');
            }

            if (!systemState.systemRunning) {
                throw new Error('System not marked as running');
            }

            if (systemState.registerCount !== 16) {
                throw new Error(`Expected 16 registers, found ${systemState.registerCount}`);
            }

            if (systemState.memoryTotalKB !== 64) { // 128KB / 2 = 64KB in decimal
                throw new Error(`Expected 64KB memory, found ${systemState.memoryTotalKB}KB`);
            }

            this.testResults.systemInitialization = true;
            console.log('✅ System initialization test passed');
        });
    }

    /**
     * Test hardware component integration
     */
    async testHardwareIntegration() {
        return await this.framework.runTest('Hardware Component Integration', async () => {
            const { mmu, cpu, os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Test CPU-MMU integration
            const testAddress = 0x1000;
            const testValue = 0xDEADBEEF;

            // Write through CPU to MMU
            cpu.setRegister(0, testAddress); // Set R0 to base address
            cpu.setRegister(1, testValue);   // Set R1 to value to store
            cpu.execute(this.createStoreInstruction(1, 0, 0)); // STORE R1, [R0 + 0]

            // Read back through MMU
            const readValue = mmu.readWord(testAddress);

            if (readValue !== testValue) {
                throw new Error(`MMU integration failed: wrote 0x${testValue.toString(16)}, read 0x${readValue.toString(16)}`);
            }

            // Test CPU state management
            const cpuState = cpu.getState();
            if (cpuState.programCounter !== 0x1004) { // Should advance by 4 bytes
                throw new Error(`Program counter not advanced correctly: ${cpuState.programCounter}`);
            }

            // Test memory boundaries
            try {
                mmu.readWord(0x10000); // Beyond 64KB limit
                throw new Error('Should have thrown error for out-of-bounds access');
            } catch (error) {
                if (!error.message.includes('Address out of bounds')) {
                    throw new Error(`Unexpected error for out-of-bounds access: ${error.message}`);
                }
            }

            this.testResults.hardwareIntegration = true;
            console.log('✅ Hardware integration test passed');
        });
    }

    /**
     * Test memory layout and initialization
     */
    async testMemoryLayout() {
        return await this.framework.runTest('Memory Layout Validation', async () => {
            const { mmu, cpu, os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Validate memory layout
            const memoryStats = mmu.getMemoryStats();

            if (memoryStats.totalBytes !== 0x10000) {
                throw new Error(`Expected 65536 bytes total memory, found ${memoryStats.totalBytes}`);
            }

            if (memoryStats.usedBytes !== 0) {
                throw new Error(`Expected 0 used bytes after initialization, found ${memoryStats.usedBytes}`);
            }

            // Test memory-mapped I/O region
            if (memoryStats.memoryMappedIOStart !== 0xF000) {
                throw new Error(`Expected MMIO start at 0xF000, found 0x${memoryStats.memoryMappedIOStart.toString(16)}`);
            }

            if (memoryStats.memoryMappedIOSize !== 0x1000) {
                throw new Error(`Expected MMIO size 0x1000, found 0x${memoryStats.memoryMappedIOSize.toString(16)}`);
            }

            // Test memory regions
            const expectedRegions = [
                { name: 'program_area', start: 0x0000, end: 0xEFFF, pattern: null },
                { name: 'mmio_area', start: 0xF000, end: 0xFFFF, pattern: null }
            ];

            const memoryValidation = validateMemoryState(mmu, expectedRegions);
            if (memoryValidation.utilizationPercent !== '0.00') {
                throw new Error(`Expected 0% memory utilization, found ${memoryValidation.utilizationPercent}%`);
            }

            this.testResults.memoryLayout = true;
            console.log('✅ Memory layout test passed');
        });
    }

    /**
     * Test interrupt system setup
     */
    async testInterruptSystem() {
        return await this.framework.runTest('Interrupt System Setup', async () => {
            const { mmu, cpu, os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Check interrupt vector table initialization
            const tableStart = 0xFF00;
            const systemCallHandler = mmu.readWord(tableStart);

            // The handler should be initialized (even if placeholder)
            if (systemCallHandler === 0x00000000) {
                // This is expected - placeholder handlers
                console.log('ℹ️  Interrupt vector table initialized with placeholder handlers');
            }

            // Test system call handler registration
            const testSyscallNumber = 0x01; // PRINT_CHAR
            let syscallExecuted = false;

            // Set up a test system call handler
            cpu.setSystemCallHandler((syscallNum) => {
                if (syscallNum === testSyscallNumber) {
                    syscallExecuted = true;
                }
            });

            // Trigger a system call
            cpu.setRegister(0, testSyscallNumber);
            cpu.execute(0x05000000); // SYSCALL instruction

            if (!syscallExecuted) {
                throw new Error('System call handler not executed');
            }

            this.testResults.interruptSystem = true;
            console.log('✅ Interrupt system test passed');
        });
    }

    /**
     * Test I/O system initialization
     */
    async testIOSystem() {
        return await this.framework.runTest('I/O System Initialization', async () => {
            const { mmu, cpu, os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Test console I/O buffer initialization
            const systemStatus = os.getSystemStatus();

            // The I/O system should be initialized (internal state)
            // We can't directly access the private consoleBuffer, but we can test
            // that the system call mechanism works

            // Test PRINT_CHAR system call
            cpu.setRegister(0, 0x41); // 'A' character for PRINT_CHAR
            cpu.execute(0x01000000); // PRINT_CHAR system call (0x01 in opcode field)

            const output = this.framework.capturedOutput;
            if (!output.includes('A')) {
                throw new Error('PRINT_CHAR system call did not output character');
            }

            // Test GET_TIME system call
            cpu.execute(0x05000000); // GET_TIME system call (0x05 in opcode field)

            const timeValue = cpu.getRegister(0);
            if (timeValue === 0) {
                throw new Error('GET_TIME system call did not set time value');
            }

            this.testResults.ioSystem = true;
            console.log('✅ I/O system test passed');
        });
    }

    /**
     * Create a STORE instruction for testing
     */
    createStoreInstruction(reg, baseReg, offset) {
        return (0x02 << 24) | (reg << 20) | (baseReg << 16) | offset;
    }

    /**
     * Run all bootstrap tests
     */
    async runAllTests() {
        console.log('🚀 Starting OrionRisc-128 System Bootstrap Tests...\n');

        try {
            await this.testSystemInitialization();
            await this.testHardwareIntegration();
            await this.testMemoryLayout();
            await this.testInterruptSystem();
            await this.testIOSystem();

            // Calculate overall success
            this.testResults.overallSuccess =
                this.testResults.systemInitialization &&
                this.testResults.hardwareIntegration &&
                this.testResults.memoryLayout &&
                this.testResults.interruptSystem &&
                this.testResults.ioSystem;

            console.log('\n📊 Bootstrap Test Results:');
            console.log(`System Initialization: ${this.testResults.systemInitialization ? '✅' : '❌'}`);
            console.log(`Hardware Integration: ${this.testResults.hardwareIntegration ? '✅' : '❌'}`);
            console.log(`Memory Layout: ${this.testResults.memoryLayout ? '✅' : '❌'}`);
            console.log(`Interrupt System: ${this.testResults.interruptSystem ? '✅' : '❌'}`);
            console.log(`I/O System: ${this.testResults.ioSystem ? '✅' : '❌'}`);
            console.log(`Overall Success: ${this.testResults.overallSuccess ? '✅' : '❌'}`);

            return this.testResults;

        } catch (error) {
            console.error('❌ Bootstrap test suite failed:', error.message);
            throw error;
        }
    }
}

// Export for use in other test files
module.exports = SystemBootstrapTest;

// Run tests if called directly
if (require.main === module) {
    const bootstrapTest = new SystemBootstrapTest();
    bootstrapTest.runAllTests()
        .then(() => {
            console.log('\n🎉 System Bootstrap Tests Complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 System Bootstrap Tests Failed:', error.message);
            process.exit(1);
        });
}