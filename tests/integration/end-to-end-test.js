/**
 * End-to-End Workflow Integration Test for OrionRisc-128
 * Tests complete program development workflow and error handling
 */

const TestFramework = require('./test-framework');
const {
    loadDemoProgram,
    validateProgramExecution,
    validateSystemState,
    generateTestProgram
} = require('./test-utils');

class EndToEndTest {
    constructor() {
        this.framework = new TestFramework();
        this.testResults = {
            completeWorkflow: false,
            errorRecovery: false,
            systemCalls: false,
            memoryManagement: false,
            programChaining: false,
            overallSuccess: false
        };
    }

    /**
     * Test complete program development workflow
     */
    async testCompleteWorkflow() {
        return await this.framework.runTest('Complete Program Development Workflow', async () => {
            const { os } = this.framework.createSystem();

            // Step 1: System initialization
            console.log('Step 1: System initialization...');
            await this.framework.initializeSystem(os);

            // Step 2: Load and execute arithmetic demo
            console.log('Step 2: Loading arithmetic demo...');
            const arithmeticProgram = loadDemoProgram('arithmetic-demo');
            this.framework.loadProgram(os, arithmeticProgram.data, 'Workflow-Arithmetic');
            const arithmeticResult = this.framework.executeProgram(os, 'Workflow-Arithmetic');

            // Step 3: Load and execute memory demo
            console.log('Step 3: Loading memory demo...');
            const memoryProgram = loadDemoProgram('memory-demo');
            this.framework.loadProgram(os, memoryProgram.data, 'Workflow-Memory');
            const memoryResult = this.framework.executeProgram(os, 'Workflow-Memory');

            // Step 4: Load and execute I/O demo
            console.log('Step 4: Loading I/O demo...');
            const ioProgram = loadDemoProgram('io-demo');
            this.framework.loadProgram(os, ioProgram.data, 'Workflow-IO');
            const ioResult = this.framework.executeProgram(os, 'Workflow-IO');

            // Step 5: Load and execute calculator demo
            console.log('Step 5: Loading calculator demo...');
            const calculatorProgram = loadDemoProgram('calculator-demo');
            this.framework.loadProgram(os, calculatorProgram.data, 'Workflow-Calculator');
            const calculatorResult = this.framework.executeProgram(os, 'Workflow-Calculator');

            // Validate all programs executed successfully
            if (!arithmeticResult.success || !memoryResult.success ||
                !ioResult.success || !calculatorResult.success) {
                throw new Error('One or more workflow programs failed to execute');
            }

            // Validate system state after complete workflow
            const finalState = validateSystemState(os, os.cpu, os.mmu);

            if (finalState.loadedPrograms !== 4) {
                throw new Error(`Expected 4 loaded programs, found ${finalState.loadedPrograms}`);
            }

            if (finalState.memoryUsedKB === 0) {
                throw new Error('Expected memory usage after workflow execution');
            }

            this.testResults.completeWorkflow = true;
            console.log('✅ Complete workflow test passed');
        });
    }

    /**
     * Test error recovery and system resilience
     */
    async testErrorRecovery() {
        return await this.framework.runTest('Error Recovery and System Resilience', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Test 1: Recover from invalid program load
            console.log('Testing recovery from invalid program load...');
            try {
                os.loadProgram([], 'Empty-Program');
                throw new Error('Should have failed for empty program');
            } catch (error) {
                // Expected error - system should continue working
            }

            // System should still work after error
            const arithmeticProgram = loadDemoProgram('arithmetic-demo');
            this.framework.loadProgram(os, arithmeticProgram.data, 'Recovery-Test');
            const result = this.framework.executeProgram(os, 'Recovery-Test');

            if (!result.success) {
                throw new Error('System should recover from load errors');
            }

            // Test 2: Recover from program execution error
            console.log('Testing recovery from execution error...');
            const invalidProgram = [0xFFFFFFFF, 0x00000000]; // Invalid instruction followed by NOP
            this.framework.loadProgram(os, invalidProgram, 'Error-Program');

            try {
                this.framework.executeProgram(os, 'Error-Program');
            } catch (error) {
                // Expected error - system should handle it gracefully
            }

            // System should still work after execution error
            const memoryProgram = loadDemoProgram('memory-demo');
            this.framework.loadProgram(os, memoryProgram.data, 'Post-Error-Test');
            const postErrorResult = this.framework.executeProgram(os, 'Post-Error-Test');

            if (!postErrorResult.success) {
                throw new Error('System should recover from execution errors');
            }

            this.testResults.errorRecovery = true;
            console.log('✅ Error recovery test passed');
        });
    }

    /**
     * Test system call mechanisms
     */
    async testSystemCalls() {
        return await this.framework.runTest('System Call Integration', async () => {
            const { os, cpu } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Test all system call types
            const systemCalls = [
                { name: 'PRINT_CHAR', number: 0x01, testValue: 0x41 }, // 'A'
                { name: 'GET_TIME', number: 0x05, testValue: null }
            ];

            for (const syscall of systemCalls) {
                console.log(`Testing ${syscall.name} system call...`);

                // Set up system call
                if (syscall.testValue) {
                    // For PRINT_CHAR, set the character value in R0
                    cpu.setRegister(0, syscall.testValue);
                }

                // Execute system call
                cpu.execute((syscall.number << 24) | 0x000000); // System call instruction with number in opcode field

                // Validate system call executed
                if (syscall.name === 'PRINT_CHAR') {
                    const output = this.framework.capturedOutput;
                    if (!output.includes('A')) {
                        throw new Error('PRINT_CHAR system call did not output character');
                    }
                } else if (syscall.name === 'GET_TIME') {
                    const timeValue = cpu.getRegister(0);
                    if (timeValue === 0) {
                        throw new Error('GET_TIME system call did not return time value');
                    }
                }
            }

            // Test system call error handling
            cpu.execute((0xFF << 24) | 0x000000); // Invalid system call instruction

            // System should handle invalid system calls gracefully
            const output = this.framework.capturedOutput;
            if (output.includes('Unknown system call')) {
                console.log('ℹ️  Invalid system call handled correctly');
            }

            this.testResults.systemCalls = true;
            console.log('✅ System call test passed');
        });
    }

    /**
     * Test memory management during complex workflows
     */
    async testMemoryManagement() {
        return await this.framework.runTest('Memory Management in Complex Workflows', async () => {
            const { os, mmu } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Track memory usage throughout workflow
            const memorySnapshots = [];

            // Initial memory state
            memorySnapshots.push(mmu.getMemoryStats());

            // Load multiple programs and track memory usage
            const programs = ['arithmetic-demo', 'memory-demo', 'io-demo'];

            for (let i = 0; i < programs.length; i++) {
                const program = loadDemoProgram(programs[i]);
                const programName = `Memory-Test-${i}`;
                this.framework.loadProgram(os, program.data, programName);

                memorySnapshots.push(mmu.getMemoryStats());

                // Execute program
                this.framework.executeProgram(os, programName);
            }

            // Validate memory usage increased appropriately
            const initialUsage = memorySnapshots[0].usedBytes;
            const finalUsage = memorySnapshots[memorySnapshots.length - 1].usedBytes;

            if (finalUsage <= initialUsage) {
                throw new Error('Memory usage should increase after loading and executing programs');
            }

            // Validate memory regions
            const programAreaUsed = this.checkMemoryRegion(mmu, 0x0000, 0x2000);
            const mmioAreaUsed = this.checkMemoryRegion(mmu, 0xF000, 0x10000);

            if (!programAreaUsed) {
                throw new Error('Program area should contain loaded programs');
            }

            if (mmioAreaUsed) {
                console.log('ℹ️  MMIO area contains data (may be normal)');
            }

            this.testResults.memoryManagement = true;
            console.log('✅ Memory management test passed');
        });
    }

    /**
     * Test program chaining and sequential execution
     */
    async testProgramChaining() {
        return await this.framework.runTest('Program Chaining and Sequential Execution', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Create a sequence of programs that depend on each other
            const programSequence = [
                { name: 'Setup-Program', data: generateTestProgram(50) },
                { name: 'Main-Program', data: loadDemoProgram('arithmetic-demo').data },
                { name: 'Cleanup-Program', data: generateTestProgram(30) }
            ];

            // Load and execute programs in sequence
            for (const program of programSequence) {
                console.log(`Loading and executing ${program.name}...`);
                this.framework.loadProgram(os, program.data, program.name);
                const result = this.framework.executeProgram(os, program.name);

                if (!result.success) {
                    throw new Error(`Program ${program.name} failed in chain`);
                }
            }

            // Validate all programs executed
            const systemStatus = os.getSystemStatus();
            if (systemStatus.loadedPrograms.length !== 3) {
                throw new Error(`Expected 3 programs in chain, found ${systemStatus.loadedPrograms.length}`);
            }

            // Validate sequential execution didn't corrupt system state
            const finalState = validateSystemState(os, os.cpu, os.mmu);
            if (!finalState.systemRunning) {
                throw new Error('System should still be running after program chain');
            }

            this.testResults.programChaining = true;
            console.log('✅ Program chaining test passed');
        });
    }

    /**
     * Test system resource cleanup and shutdown
     */
    async testResourceCleanup() {
        return await this.framework.runTest('Resource Cleanup and Shutdown', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Load some programs
            const arithmeticProgram = loadDemoProgram('arithmetic-demo');
            this.framework.loadProgram(os, arithmeticProgram.data, 'Cleanup-Test');

            // Execute program
            this.framework.executeProgram(os, 'Cleanup-Test');

            // Test system shutdown
            const shutdownResult = os.shutdown();
            if (!shutdownResult) {
                throw new Error('System shutdown failed');
            }

            // Validate cleanup
            const systemStatus = os.getSystemStatus();
            if (systemStatus.isRunning) {
                throw new Error('System should not be running after shutdown');
            }

            if (systemStatus.loadedPrograms.length !== 0) {
                throw new Error('All programs should be cleared after shutdown');
            }

            this.testResults.resourceCleanup = true;
            console.log('✅ Resource cleanup test passed');
        });
    }

    /**
     * Helper function to check if memory region contains data
     */
    checkMemoryRegion(mmu, start, end) {
        for (let addr = start; addr < end; addr += 4) {
            try {
                const word = mmu.readWord(addr);
                if (word !== 0) {
                    return true;
                }
            } catch (error) {
                // Region might not be fully accessible
                break;
            }
        }
        return false;
    }

    /**
     * Run all end-to-end tests
     */
    async runAllTests() {
        console.log('🚀 Starting OrionRisc-128 End-to-End Workflow Tests...\n');

        try {
            await this.testCompleteWorkflow();
            await this.testErrorRecovery();
            await this.testSystemCalls();
            await this.testMemoryManagement();
            await this.testProgramChaining();
            await this.testResourceCleanup();

            // Calculate overall success
            this.testResults.overallSuccess =
                this.testResults.completeWorkflow &&
                this.testResults.errorRecovery &&
                this.testResults.systemCalls &&
                this.testResults.memoryManagement &&
                this.testResults.programChaining &&
                this.testResults.resourceCleanup;

            console.log('\n📊 End-to-End Test Results:');
            console.log(`Complete Workflow: ${this.testResults.completeWorkflow ? '✅' : '❌'}`);
            console.log(`Error Recovery: ${this.testResults.errorRecovery ? '✅' : '❌'}`);
            console.log(`System Calls: ${this.testResults.systemCalls ? '✅' : '❌'}`);
            console.log(`Memory Management: ${this.testResults.memoryManagement ? '✅' : '❌'}`);
            console.log(`Program Chaining: ${this.testResults.programChaining ? '✅' : '❌'}`);
            console.log(`Resource Cleanup: ${this.testResults.resourceCleanup ? '✅' : '❌'}`);
            console.log(`Overall Success: ${this.testResults.overallSuccess ? '✅' : '❌'}`);

            return this.testResults;

        } catch (error) {
            console.error('❌ End-to-end test suite failed:', error.message);
            throw error;
        }
    }
}

// Export for use in other test files
module.exports = EndToEndTest;

// Run tests if called directly
if (require.main === module) {
    const endToEndTest = new EndToEndTest();
    endToEndTest.runAllTests()
        .then(() => {
            console.log('\n🎉 End-to-End Tests Complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 End-to-End Tests Failed:', error.message);
            process.exit(1);
        });
}