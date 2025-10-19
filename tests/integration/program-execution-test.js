/**
 * Program Execution Integration Test for OrionRisc-128
 * Tests loading and executing machine language programs
 */

const TestFramework = require('./test-framework');
const {
    loadDemoProgram,
    validateProgramExecution,
    validateSystemState
} = require('./test-utils');

class ProgramExecutionTest {
    constructor() {
        this.framework = new TestFramework();
        this.testResults = {
            arithmeticDemo: false,
            memoryDemo: false,
            ioDemo: false,
            calculatorDemo: false,
            overallSuccess: false
        };
    }

    /**
     * Test arithmetic demo program execution
     */
    async testArithmeticDemo() {
        return await this.framework.runTest('Arithmetic Demo Execution', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Load arithmetic demo program
            const arithmeticProgram = loadDemoProgram('arithmetic-demo');
            const loadedProgram = this.framework.loadProgram(os, arithmeticProgram.data, arithmeticProgram.name);

            // Execute program
            const executionResult = this.framework.executeProgram(os, arithmeticProgram.name);

            if (!executionResult.success) {
                throw new Error('Arithmetic demo execution failed');
            }

            // Validate output
            const output = executionResult.output;
            const validation = validateProgramExecution(output, arithmeticProgram.expectedOutput);

            if (!validation.allPatternsPassed) {
                const failedPatterns = Object.entries(validation.patternResults)
                    .filter(([_, passed]) => !passed)
                    .map(([pattern, _]) => pattern);

                throw new Error(`Arithmetic demo validation failed for patterns: ${failedPatterns.join(', ')}`);
            }

            // Validate program executed expected number of instructions
            const systemStatus = os.getSystemStatus();
            const cpuState = systemStatus.cpuState;

            if (cpuState.isRunning) {
                throw new Error('Program should have completed execution');
            }

            this.testResults.arithmeticDemo = true;
            console.log(`✅ Arithmetic demo executed successfully (${arithmeticProgram.info.instructionCount} instructions)`);
        });
    }

    /**
     * Test memory demo program execution
     */
    async testMemoryDemo() {
        return await this.framework.runTest('Memory Demo Execution', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Load memory demo program
            const memoryProgram = loadDemoProgram('memory-demo');
            const loadedProgram = this.framework.loadProgram(os, memoryProgram.data, memoryProgram.name);

            // Execute program
            const executionResult = this.framework.executeProgram(os, memoryProgram.name);

            if (!executionResult.success) {
                throw new Error('Memory demo execution failed');
            }

            // Validate output
            const output = executionResult.output;
            const validation = validateProgramExecution(output, memoryProgram.expectedOutput);

            if (!validation.allPatternsPassed) {
                const failedPatterns = Object.entries(validation.patternResults)
                    .filter(([_, passed]) => !passed)
                    .map(([pattern, _]) => pattern);

                throw new Error(`Memory demo validation failed for patterns: ${failedPatterns.join(', ')}`);
            }

            // Validate memory was used during execution
            const systemStatus = os.getSystemStatus();
            const memoryStats = systemStatus.memoryStats;

            if (memoryStats.usedBytes === 0) {
                throw new Error('Memory demo should have used some memory');
            }

            this.testResults.memoryDemo = true;
            console.log(`✅ Memory demo executed successfully (${memoryProgram.info.instructionCount} instructions)`);
        });
    }

    /**
     * Test I/O demo program execution
     */
    async testIODemo() {
        return await this.framework.runTest('I/O Demo Execution', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Load I/O demo program
            const ioProgram = loadDemoProgram('io-demo');
            const loadedProgram = this.framework.loadProgram(os, ioProgram.data, ioProgram.name);

            // Execute program
            const executionResult = this.framework.executeProgram(os, ioProgram.name);

            if (!executionResult.success) {
                throw new Error('I/O demo execution failed');
            }

            // Validate output
            const output = executionResult.output;
            const validation = validateProgramExecution(output, ioProgram.expectedOutput);

            if (!validation.allPatternsPassed) {
                const failedPatterns = Object.entries(validation.patternResults)
                    .filter(([_, passed]) => !passed)
                    .map(([pattern, _]) => pattern);

                throw new Error(`I/O demo validation failed for patterns: ${failedPatterns.join(', ')}`);
            }

            // Validate I/O operations occurred
            if (output.length === 0) {
                throw new Error('I/O demo should have produced output');
            }

            this.testResults.ioDemo = true;
            console.log(`✅ I/O demo executed successfully (${ioProgram.info.instructionCount} instructions)`);
        });
    }

    /**
     * Test calculator demo program execution
     */
    async testCalculatorDemo() {
        return await this.framework.runTest('Calculator Demo Execution', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Load calculator demo program
            const calculatorProgram = loadDemoProgram('calculator-demo');
            const loadedProgram = this.framework.loadProgram(os, calculatorProgram.data, calculatorProgram.name);

            // Execute program
            const executionResult = this.framework.executeProgram(os, calculatorProgram.name);

            if (!executionResult.success) {
                throw new Error('Calculator demo execution failed');
            }

            // Validate output
            const output = executionResult.output;
            const validation = validateProgramExecution(output, calculatorProgram.expectedOutput);

            if (!validation.allPatternsPassed) {
                const failedPatterns = Object.entries(validation.patternResults)
                    .filter(([_, passed]) => !passed)
                    .map(([pattern, _]) => pattern);

                throw new Error(`Calculator demo validation failed for patterns: ${failedPatterns.join(', ')}`);
            }

            // Validate calculations were performed
            if (!output.includes('7 + 3 = 10') ||
                !output.includes('8 * 4 = 32') ||
                !output.includes('15 / 3 = 5')) {
                throw new Error('Calculator demo did not perform expected calculations');
            }

            this.testResults.calculatorDemo = true;
            console.log(`✅ Calculator demo executed successfully (${calculatorProgram.info.instructionCount} instructions)`);
        });
    }

    /**
     * Test program loading with different memory addresses
     */
    async testProgramLoading() {
        return await this.framework.runTest('Program Loading at Different Addresses', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Load arithmetic demo at default address
            const arithmeticProgram = loadDemoProgram('arithmetic-demo');
            const defaultLoad = this.framework.loadProgram(os, arithmeticProgram.data, 'Arithmetic-Default');

            if (defaultLoad.startAddress !== 0x0000) {
                throw new Error(`Expected default load address 0x0000, got 0x${defaultLoad.startAddress.toString(16)}`);
            }

            // Load memory demo at custom address
            const memoryProgram = loadDemoProgram('memory-demo');
            const customAddress = 0x2000;
            const customLoad = this.framework.loadProgram(os, memoryProgram.data, 'Memory-Custom', customAddress);

            if (customLoad.startAddress !== customAddress) {
                throw new Error(`Expected custom load address 0x${customAddress.toString(16)}, got 0x${customLoad.startAddress.toString(16)}`);
            }

            // Execute both programs
            this.framework.executeProgram(os, 'Arithmetic-Default');
            this.framework.executeProgram(os, 'Memory-Custom');

            // Validate both programs executed successfully
            const systemStatus = os.getSystemStatus();
            const loadedPrograms = systemStatus.loadedPrograms;

            if (loadedPrograms.length !== 2) {
                throw new Error(`Expected 2 loaded programs, found ${loadedPrograms.length}`);
            }

            this.testResults.programLoading = true;
            console.log('✅ Program loading test passed');
        });
    }

    /**
     * Test error handling during program execution
     */
    async testErrorHandling() {
        return await this.framework.runTest('Program Execution Error Handling', async () => {
            const { os } = this.framework.createSystem();

            // Initialize system
            await this.framework.initializeSystem(os);

            // Test loading invalid program data
            try {
                os.loadProgram(null, 'Invalid-Program');
                throw new Error('Should have thrown error for null program data');
            } catch (error) {
                if (!error.message.includes('Invalid program data')) {
                    throw new Error(`Unexpected error for invalid program: ${error.message}`);
                }
            }

            // Test executing non-existent program
            try {
                os.executeProgram('NonExistent-Program');
                throw new Error('Should have thrown error for non-existent program');
            } catch (error) {
                if (!error.message.includes('not found')) {
                    throw new Error(`Unexpected error for non-existent program: ${error.message}`);
                }
            }

            // Test loading program that's too large
            const oversizedProgram = new Array(0x10000).fill(0); // Larger than available memory
            try {
                os.loadProgram(oversizedProgram, 'Oversized-Program');
                throw new Error('Should have thrown error for oversized program');
            } catch (error) {
                if (!error.message.includes('too large') && !error.message.includes('Insufficient memory')) {
                    throw new Error(`Unexpected error for oversized program: ${error.message}`);
                }
            }

            this.testResults.errorHandling = true;
            console.log('✅ Error handling test passed');
        });
    }

    /**
     * Run all program execution tests
     */
    async runAllTests() {
        console.log('🚀 Starting OrionRisc-128 Program Execution Tests...\n');

        try {
            await this.testArithmeticDemo();
            await this.testMemoryDemo();
            await this.testIODemo();
            await this.testCalculatorDemo();
            await this.testProgramLoading();
            await this.testErrorHandling();

            // Calculate overall success
            this.testResults.overallSuccess =
                this.testResults.arithmeticDemo &&
                this.testResults.memoryDemo &&
                this.testResults.ioDemo &&
                this.testResults.calculatorDemo &&
                this.testResults.programLoading &&
                this.testResults.errorHandling;

            console.log('\n📊 Program Execution Test Results:');
            console.log(`Arithmetic Demo: ${this.testResults.arithmeticDemo ? '✅' : '❌'}`);
            console.log(`Memory Demo: ${this.testResults.memoryDemo ? '✅' : '❌'}`);
            console.log(`I/O Demo: ${this.testResults.ioDemo ? '✅' : '❌'}`);
            console.log(`Calculator Demo: ${this.testResults.calculatorDemo ? '✅' : '❌'}`);
            console.log(`Program Loading: ${this.testResults.programLoading ? '✅' : '❌'}`);
            console.log(`Error Handling: ${this.testResults.errorHandling ? '✅' : '❌'}`);
            console.log(`Overall Success: ${this.testResults.overallSuccess ? '✅' : '❌'}`);

            return this.testResults;

        } catch (error) {
            console.error('❌ Program execution test suite failed:', error.message);
            throw error;
        }
    }
}

// Export for use in other test files
module.exports = ProgramExecutionTest;

// Run tests if called directly
if (require.main === module) {
    const executionTest = new ProgramExecutionTest();
    executionTest.runAllTests()
        .then(() => {
            console.log('\n🎉 Program Execution Tests Complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Program Execution Tests Failed:', error.message);
            process.exit(1);
        });
}