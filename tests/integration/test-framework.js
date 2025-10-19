/**
 * Integration Test Framework for OrionRisc-128
 * Provides testing infrastructure for system integration, program execution, and performance validation
 */

const RiscProcessor = require('../../src/emulation/cpu/RiscProcessor');
const MemoryManagementUnit = require('../../src/emulation/memory/MemoryManagementUnit');
const OperatingSystemKernel = require('../../src/system/os/OperatingSystemKernel');

class TestFramework {
    constructor() {
        this.testResults = [];
        this.originalStdoutWrite = process.stdout.write;
        this.capturedOutput = '';
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Set up test environment and capture console output
     */
    setup() {
        // Capture console output
        this.capturedOutput = '';
        process.stdout.write = (data) => {
            this.capturedOutput += data;
        };

        this.startTime = process.hrtime.bigint();
    }

    /**
     * Clean up test environment and restore console output
     */
    teardown() {
        this.endTime = process.hrtime.bigint();
        process.stdout.write = this.originalStdoutWrite;
    }

    /**
     * Create a fresh system instance for testing
     */
    createSystem() {
        const mmu = new MemoryManagementUnit();
        const cpu = new RiscProcessor(mmu);
        const os = new OperatingSystemKernel(cpu, mmu);

        return { mmu, cpu, os };
    }

    /**
     * Initialize system and validate bootstrap process
     */
    async initializeSystem(os) {
        const initResult = os.initialize();
        if (!initResult) {
            throw new Error('System initialization failed');
        }

        // Validate system state after initialization
        const systemStatus = os.getSystemStatus();
        if (!systemStatus.isInitialized || !systemStatus.isRunning) {
            throw new Error('System not properly initialized');
        }

        return systemStatus;
    }

    /**
     * Load a machine language program into the system
     */
    loadProgram(os, programData, programName, startAddress = null) {
        const loadResult = os.loadProgram(programData, programName, startAddress);
        if (!loadResult) {
            throw new Error(`Failed to load program: ${programName}`);
        }

        // Validate program was loaded
        const systemStatus = os.getSystemStatus();
        const loadedProgram = systemStatus.loadedPrograms.find(p => p.name === programName);
        if (!loadedProgram) {
            throw new Error(`Program not found in loaded programs: ${programName}`);
        }

        return loadedProgram;
    }

    /**
     * Execute a loaded program and capture results
     */
    executeProgram(os, programName, entryPoint = null) {
        const executionResult = os.executeProgram(programName, entryPoint);
        if (!executionResult) {
            throw new Error(`Failed to execute program: ${programName}`);
        }

        return {
            success: true,
            output: this.capturedOutput,
            executionTime: this.getExecutionTime()
        };
    }

    /**
     * Get execution time in nanoseconds
     */
    getExecutionTime() {
        if (this.startTime && this.endTime) {
            return Number(this.endTime - this.startTime);
        }
        return 0;
    }

    /**
     * Validate program output against expected patterns
     */
    validateOutput(output, expectedPatterns) {
        const results = {};

        for (const [patternName, pattern] of Object.entries(expectedPatterns)) {
            if (typeof pattern === 'string') {
                results[patternName] = output.includes(pattern);
            } else if (pattern instanceof RegExp) {
                results[patternName] = pattern.test(output);
            } else if (typeof pattern === 'function') {
                results[patternName] = pattern(output);
            }
        }

        return results;
    }

    /**
     * Measure system performance metrics
     */
    measurePerformance(os, cpu, mmu, testDuration = 1000000000) { // 1 second in nanoseconds
        const startTime = process.hrtime.bigint();
        const startCycles = cpu.getState().programCounter;

        // Let the system run for the test duration
        const initialRunning = cpu.isRunning;
        cpu.isRunning = true;

        let cycles = 0;
        const maxCycles = 1000000; // Safety limit

        while (cpu.isRunning && cycles < maxCycles) {
            if (!cpu.step()) {
                break;
            }
            cycles++;

            // Check if we've run long enough
            if (Number(process.hrtime.bigint() - startTime) >= testDuration) {
                break;
            }
        }

        cpu.isRunning = initialRunning;
        const endTime = process.hrtime.bigint();

        const actualDuration = Number(endTime - startTime);
        const cyclesPerSecond = cycles / (actualDuration / 1000000000);

        return {
            cyclesExecuted: cycles,
            durationNanoseconds: actualDuration,
            cyclesPerSecond: cyclesPerSecond,
            targetMHz: 1.0,
            achievedMHz: cyclesPerSecond / 1000000,
            performanceRatio: cyclesPerSecond / 1000000
        };
    }

    /**
     * Run a complete test case
     */
    async runTest(testName, testFunction) {
        const testResult = {
            name: testName,
            success: false,
            error: null,
            output: '',
            executionTime: 0,
            startTime: new Date().toISOString()
        };

        try {
            this.setup();

            await testFunction();

            testResult.success = true;
            testResult.output = this.capturedOutput;
            testResult.executionTime = this.getExecutionTime();

        } catch (error) {
            testResult.error = error.message;
            testResult.output = this.capturedOutput;
        } finally {
            this.teardown();
            testResult.endTime = new Date().toISOString();
        }

        this.testResults.push(testResult);
        return testResult;
    }

    /**
     * Generate test report
     */
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.success).length;
        const failedTests = totalTests - passedTests;

        let report = '\n' + '='.repeat(80) + '\n';
        report += 'ORIONRISC-128 INTEGRATION TEST REPORT\n';
        report += '='.repeat(80) + '\n\n';

        report += `Test Summary:\n`;
        report += `  Total Tests: ${totalTests}\n`;
        report += `  Passed: ${passedTests}\n`;
        report += `  Failed: ${failedTests}\n`;
        report += `  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;

        if (failedTests > 0) {
            report += 'Failed Tests:\n';
            this.testResults.filter(t => !t.success).forEach(test => {
                report += `  ❌ ${test.name}: ${test.error}\n`;
            });
            report += '\n';
        }

        report += 'Test Details:\n';
        this.testResults.forEach(test => {
            const status = test.success ? '✅' : '❌';
            report += `${status} ${test.name}\n`;
            report += `   Duration: ${(test.executionTime / 1000000).toFixed(2)}ms\n`;
            if (test.error) {
                report += `   Error: ${test.error}\n`;
            }
            if (test.output) {
                const outputLines = test.output.split('\n').slice(0, 5);
                report += `   Output: ${outputLines.join(' ').substring(0, 100)}${test.output.length > 100 ? '...' : ''}\n`;
            }
        });

        report += '\n' + '='.repeat(80) + '\n';

        return report;
    }

    /**
     * Reset test results for a new test run
     */
    reset() {
        this.testResults = [];
    }
}

module.exports = TestFramework;