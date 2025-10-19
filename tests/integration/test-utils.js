/**
 * Test Utilities for OrionRisc-128 Integration Tests
 * Provides utilities for loading machine language programs and validating output
 */

const ArithmeticDemo = require('../../examples/machine-language/arithmetic-demo');
const MemoryDemo = require('../../examples/machine-language/memory-demo');
const IODemo = require('../../examples/machine-language/io-demo');
const CalculatorDemo = require('../../examples/machine-language/calculator-demo');

/**
 * Load a machine language demo program
 */
function loadDemoProgram(demoName) {
    switch (demoName.toLowerCase()) {
        case 'arithmetic':
        case 'arithmetic-demo':
            const arithmeticDemo = new ArithmeticDemo();
            return {
                name: 'Arithmetic Demo',
                data: arithmeticDemo.generateProgram(),
                info: arithmeticDemo.getProgramInfo(),
                expectedOutput: getExpectedArithmeticOutput()
            };

        case 'memory':
        case 'memory-demo':
            const memoryDemo = new MemoryDemo();
            return {
                name: 'Memory Demo',
                data: memoryDemo.generateProgram(),
                info: memoryDemo.getProgramInfo(),
                expectedOutput: getExpectedMemoryOutput()
            };

        case 'io':
        case 'io-demo':
            const ioDemo = new IODemo();
            return {
                name: 'I/O Demo',
                data: ioDemo.generateProgram(),
                info: ioDemo.getProgramInfo(),
                expectedOutput: getExpectedIOOutput()
            };

        case 'calculator':
        case 'calculator-demo':
            const calculatorDemo = new CalculatorDemo();
            return {
                name: 'Calculator Demo',
                data: calculatorDemo.generateProgram(),
                info: calculatorDemo.getProgramInfo(),
                expectedOutput: getExpectedCalculatorOutput()
            };

        default:
            throw new Error(`Unknown demo program: ${demoName}`);
    }
}

/**
 * Get expected output patterns for arithmetic demo
 */
function getExpectedArithmeticOutput() {
    return {
        programStart: /First number: 25/,
        secondNumber: /Second number: 17/,
        additionResult: /Addition result: 25 \+ 17 = 42/,
        subtractionResult: /Subtraction result: 42 - 25 = 17/,
        completion: /Arithmetic demo complete!/
    };
}

/**
 * Get expected output patterns for memory demo
 */
function getExpectedMemoryOutput() {
    return {
        programStart: /OrionRisc-128 Memory Operations Demo/,
        initialization: /Step 1: Initializing data in registers/,
        memoryStore: /Step 2: Storing data to memory locations/,
        memoryLoad: /Step 3: Loading data back from memory/,
        memoryArray: /Step 4: Memory array operations/,
        fibonacciArray: /Fibonacci array in memory:/,
        memoryManipulation: /Step 5: Memory manipulation/,
        memoryInspection: /Step 6: Memory region inspection/,
        completion: /Memory operations demo complete!/
    };
}

/**
 * Get expected output patterns for I/O demo
 */
function getExpectedIOOutput() {
    return {
        welcome: /Welcome to OrionRisc-128 I\/O Demo!/,
        menu: /I\/O Operations Menu:/,
        characterDemo: /1\. Character Output Demo/,
        characters: /Characters: A B C/,
        stringDemo: /2\. String Printing Demo/,
        helloWorld: /Hello, World!/,
        orionRisc: /OrionRisc-128 Rocks!/,
        asciiArt: /ASCII Art: \*\*\*/,
        interactiveDemo: /3\. Interactive Input Demo/,
        userInput: /Read: Y/,
        formattedDemo: /4\. Formatted Output Demo/,
        numbers: /Numbers: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9/,
        letters: /Letters: A, B, C, D, E/,
        specialChars: /Special Characters:/,
        systemTime: /System Time Demo:/,
        boxDrawing: /Box Drawing:/,
        completion: /Demo completed successfully!/,
        goodbye: /Thank you for using OrionRisc-128!/
    };
}

/**
 * Get expected output patterns for calculator demo
 */
function getExpectedCalculatorOutput() {
    return {
        welcome: /OrionRisc-128 Interactive Calculator/,
        menu: /Calculator Menu:/,
        operations: /1\. Addition \(\+\)/,
        demoCalculation: /Demo Calculation:/,
        firstNumber: /Enter first number \(0-9\): 7/,
        operation: /Choose operation \(1-4\): 1/,
        secondNumber: /Enter second number \(0-9\): 3/,
        result: /Result: 7 \+ 3 = 10/,
        multiplicationDemo: /Another Demo: 8 \* 4 = 32/,
        divisionDemo: /Division Demo: 15 \/ 3 = 5/,
        continuePrompt: /Another calculation\? \(Y\/N\): N/,
        goodbye: /Thank you for using the calculator!/
    };
}

/**
 * Validate program execution results
 */
function validateProgramExecution(output, expectedPatterns) {
    const results = {};

    for (const [patternName, pattern] of Object.entries(expectedPatterns)) {
        if (typeof pattern === 'string') {
            results[patternName] = output.includes(pattern);
        } else if (pattern instanceof RegExp) {
            results[patternName] = pattern.test(output);
        }
    }

    // Calculate overall success rate
    const totalPatterns = Object.keys(expectedPatterns).length;
    const passedPatterns = Object.values(results).filter(r => r === true).length;
    const successRate = (passedPatterns / totalPatterns) * 100;

    return {
        patternResults: results,
        totalPatterns,
        passedPatterns,
        successRate,
        allPatternsPassed: passedPatterns === totalPatterns
    };
}

/**
 * Performance validation utilities
 */
function validatePerformanceMetrics(performanceData, targetMHz = 1.0) {
    const achievedMHz = performanceData.achievedMHz;
    const performanceRatio = performanceData.performanceRatio;

    return {
        targetMHz,
        achievedMHz,
        performanceRatio,
        meetsTarget: achievedMHz >= targetMHz,
        efficiency: (achievedMHz / targetMHz) * 100
    };
}

/**
 * Memory validation utilities
 */
function validateMemoryState(mmu, expectedRegions = []) {
    const results = {};
    const memoryStats = mmu.getMemoryStats();

    // Check overall memory utilization
    results.totalMemoryKB = memoryStats.totalBytes / 1024;
    results.usedMemoryKB = memoryStats.usedBytes / 1024;
    results.utilizationPercent = memoryStats.utilizationPercent;

    // Check specific memory regions if provided
    for (const region of expectedRegions) {
        const regionName = region.name;
        const startAddr = region.start;
        const endAddr = region.end;
        const expectedPattern = region.pattern;

        let regionMatches = true;
        for (let addr = startAddr; addr < endAddr; addr += 4) {
            const word = mmu.readWord(addr);
            if (expectedPattern && !expectedPattern(word, addr)) {
                regionMatches = false;
                break;
            }
        }

        results[`${regionName}_valid`] = regionMatches;
    }

    return results;
}

/**
 * System state validation utilities
 */
function validateSystemState(os, cpu, mmu) {
    const systemStatus = os.getSystemStatus();
    const cpuState = cpu.getState();
    const memoryStats = mmu.getMemoryStats();

    return {
        systemInitialized: systemStatus.isInitialized,
        systemRunning: systemStatus.isRunning,
        cpuRunning: cpuState.isRunning,
        cpuHalted: cpuState.isHalted,
        programCounter: cpuState.programCounter,
        registerCount: cpuState.registers.length,
        loadedPrograms: systemStatus.loadedPrograms.length,
        memoryTotalKB: memoryStats.totalBytes / 1024,
        memoryUsedKB: memoryStats.usedBytes / 1024,
        memoryUtilization: memoryStats.utilizationPercent
    };
}

/**
 * Test data generators
 */
function generateTestProgram(instructionCount = 100) {
    const program = [];

    // Add some basic instructions for testing
    for (let i = 0; i < instructionCount; i++) {
        // Mix of different instruction types
        const instructionType = i % 4;

        switch (instructionType) {
            case 0: // LOAD
                program.push(0x01000000 | (i % 256)); // LOAD R0, [R0 + i]
                break;
            case 1: // ADD
                program.push(0x03010000); // ADD R1, R0
                break;
            case 2: // STORE
                program.push(0x02000000 | (i % 256)); // STORE R0, [R0 + i]
                break;
            case 3: // NOP
                program.push(0x00000000); // NOP
                break;
        }
    }

    return program;
}

module.exports = {
    loadDemoProgram,
    getExpectedArithmeticOutput,
    getExpectedMemoryOutput,
    getExpectedIOOutput,
    getExpectedCalculatorOutput,
    validateProgramExecution,
    validatePerformanceMetrics,
    validateMemoryState,
    validateSystemState,
    generateTestProgram
};