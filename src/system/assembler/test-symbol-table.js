/**
 * Symbol Table Test Suite
 *
 * Comprehensive testing for the Phase 2 symbol table management system.
 * Tests symbol storage, lookup, resolution, and integration with the assembler.
 *
 * Phase 2 Component: Symbol Table Testing
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

/**
 * Test case structure for symbol table tests
 */
class SymbolTableTestCase {
    constructor(name, setup, test, expected, description = '') {
        this.name = name;
        this.setup = setup;        // Setup function
        this.test = test;          // Test function
        this.expected = expected;  // Expected result
        this.description = description;
    }
}

/**
 * Test result structure
 */
class SymbolTableTestResult {
    constructor(testCase, passed, actual, error = null, executionTime = 0) {
        this.testCase = testCase;
        this.passed = passed;
        this.actual = actual;
        this.error = error;
        this.executionTime = executionTime;
    }

    /**
     * Get detailed test result description
     */
    getDetails() {
        return {
            name: this.testCase.name,
            description: this.testCase.description,
            passed: this.passed,
            expected: this.testCase.expected,
            actual: this.actual,
            error: this.error,
            executionTime: `${this.executionTime}ms`
        };
    }
}

/**
 * Symbol Table Test Suite
 */
class SymbolTableTestSuite {
    constructor() {
        this.testCases = [];
        this.results = [];
        this.setupTestCases();
    }

    /**
     * Set up comprehensive test cases
     */
    setupTestCases() {
        // Basic symbol addition test
        this.testCases.push(new SymbolTableTestCase(
            "Add label symbol",
            () => ({ symbolTable: new SymbolTable({}) }),
            (context) => {
                const result = context.symbolTable.addSymbol("main", SYMBOL_TYPES.LABEL, 0x1000);
                return {
                    added: result,
                    lookup: context.symbolTable.lookupSymbol("main"),
                    resolve: context.symbolTable.resolveSymbol("main")
                };
            },
            {
                added: true,
                lookup: { name: "main", type: SYMBOL_TYPES.LABEL, value: 0x1000 },
                resolve: 0x1000
            },
            "Test basic label symbol addition and lookup"
        ));

        // Equate symbol test
        this.testCases.push(new SymbolTableTestCase(
            "Add equate symbol",
            () => ({ symbolTable: new SymbolTable({}) }),
            (context) => {
                const result = context.symbolTable.addSymbol("BUFFER_SIZE", SYMBOL_TYPES.EQUATE, 256);
                return {
                    added: result,
                    lookup: context.symbolTable.lookupSymbol("BUFFER_SIZE"),
                    resolve: context.symbolTable.resolveSymbol("BUFFER_SIZE")
                };
            },
            {
                added: true,
                lookup: { name: "BUFFER_SIZE", type: SYMBOL_TYPES.EQUATE, value: 256 },
                resolve: 256
            },
            "Test equate symbol addition and resolution"
        ));

        // Symbol redefinition test
        this.testCases.push(new SymbolTableTestCase(
            "Redefine symbol",
            () => ({ symbolTable: new SymbolTable({}) }),
            (context) => {
                context.symbolTable.addSymbol("counter", SYMBOL_TYPES.LABEL, 0x2000);
                const result = context.symbolTable.addSymbol("counter", SYMBOL_TYPES.LABEL, 0x3000);
                return {
                    redefined: result,
                    finalValue: context.symbolTable.resolveSymbol("counter")
                };
            },
            {
                redefined: true,
                finalValue: 0x3000
            },
            "Test symbol redefinition behavior"
        ));

        // Invalid symbol name test
        this.testCases.push(new SymbolTableTestCase(
            "Invalid symbol name",
            () => ({ symbolTable: new SymbolTable({}) }),
            (context) => {
                const result1 = context.symbolTable.addSymbol("", SYMBOL_TYPES.LABEL, 0x1000);
                const result2 = context.symbolTable.addSymbol("123invalid", SYMBOL_TYPES.LABEL, 0x1000);
                const result3 = context.symbolTable.addSymbol("valid_name", SYMBOL_TYPES.LABEL, 0x1000);
                return {
                    emptyName: result1,
                    invalidStart: result2,
                    validName: result3
                };
            },
            {
                emptyName: false,
                invalidStart: false,
                validName: true
            },
            "Test validation of symbol names"
        ));

        // Symbol not found test
        this.testCases.push(new SymbolTableTestCase(
            "Symbol not found",
            () => ({ symbolTable: new SymbolTable({}) }),
            (context) => {
                const lookup = context.symbolTable.lookupSymbol("nonexistent");
                const resolve = context.symbolTable.resolveSymbol("nonexistent");
                return {
                    lookup: lookup,
                    resolve: resolve
                };
            },
            {
                lookup: null,
                resolve: null
            },
            "Test behavior when symbol is not found"
        ));

        // Multiple symbols test
        this.testCases.push(new SymbolTableTestCase(
            "Multiple symbols",
            () => ({ symbolTable: new SymbolTable({}) }),
            (context) => {
                context.symbolTable.addSymbol("label1", SYMBOL_TYPES.LABEL, 0x1000);
                context.symbolTable.addSymbol("label2", SYMBOL_TYPES.LABEL, 0x2000);
                context.symbolTable.addSymbol("const1", SYMBOL_TYPES.EQUATE, 42);
                context.symbolTable.addSymbol("const2", SYMBOL_TYPES.EQUATE, 100);

                const table = context.symbolTable.getSymbolTable();
                return {
                    symbolCount: table.size,
                    label1Value: context.symbolTable.resolveSymbol("label1"),
                    label2Value: context.symbolTable.resolveSymbol("label2"),
                    const1Value: context.symbolTable.resolveSymbol("const1"),
                    const2Value: context.symbolTable.resolveSymbol("const2")
                };
            },
            {
                symbolCount: 4,
                label1Value: 0x1000,
                label2Value: 0x2000,
                const1Value: 42,
                const2Value: 100
            },
            "Test handling of multiple symbols"
        ));

        // Symbol name validation tests
        this.testCases.push(new SymbolTableTestCase(
            "Symbol name validation",
            () => ({ symbolTable: new SymbolTable({}) }),
            (context) => {
                const testNames = [
                    "valid_name",
                    "ValidName",
                    "name123",
                    "name_underscore",
                    "_underscore_start",
                    "123invalid",      // Invalid: starts with digit
                    "invalid-name",    // Invalid: contains hyphen
                    "invalid.name",    // Invalid: contains dot
                    "",                // Invalid: empty
                    "long_name"        // Test name for validation
                ];

                const results = {};
                testNames.forEach(name => {
                    results[name] = context.symbolTable.isValidSymbolName(name);
                });

                return results;
            },
            {
                "valid_name": true,
                "ValidName": true,
                "name123": true,
                "name_underscore": true,
                "_underscore_start": true,
                "123invalid": false,
                "invalid-name": false,
                "invalid.name": false,
                "": false,
                "long_name": false
            },
            "Test comprehensive symbol name validation"
        ));

        // Hash collision simulation test
        this.testCases.push(new SymbolTableTestCase(
            "Hash collision handling",
            () => ({ symbolTable: new SymbolTable({}) }),
            (context) => {
                // Create symbols that might have hash collisions
                const collisionNames = ["Aa", "BB", "aA", "Bb", "AA", "bb"];
                let addedCount = 0;

                collisionNames.forEach(name => {
                    if (context.symbolTable.addSymbol(name, SYMBOL_TYPES.LABEL, addedCount * 0x100)) {
                        addedCount++;
                    }
                });

                return {
                    addedCount: addedCount,
                    totalSymbols: context.symbolTable.getSymbolTable().size
                };
            },
            {
                addedCount: 6,
                totalSymbols: 6
            },
            "Test hash collision handling with similar symbol names"
        ));
    }

    /**
     * Run all test cases
     * @returns {Array} Array of test results
     */
    runAllTests() {
        console.log('=== SYMBOL TABLE TEST SUITE ===');
        console.log(`Running ${this.testCases.length} test cases...\n`);

        this.results = [];

        for (const testCase of this.testCases) {
            const startTime = Date.now();

            try {
                // Setup test context
                const context = testCase.setup();

                // Run test
                const actual = testCase.test(context);
                const endTime = Date.now();
                const executionTime = endTime - startTime;

                // Validate result
                const passed = this.validateResult(testCase.expected, actual);

                const result = new SymbolTableTestResult(testCase, passed, actual, null, executionTime);
                this.results.push(result);

                this.displayTestResult(result);

            } catch (error) {
                const endTime = Date.now();
                const executionTime = endTime - startTime;

                const result = new SymbolTableTestResult(testCase, false, null, error.message, executionTime);
                this.results.push(result);

                this.displayTestResult(result);
            }
        }

        this.displaySummary();
        return this.results;
    }

    /**
     * Validate test result against expected value
     * @param {any} expected - Expected result
     * @param {any} actual - Actual result
     * @returns {boolean} True if results match
     */
    validateResult(expected, actual) {
        if (expected === null || expected === undefined) {
            return actual === expected;
        }

        if (typeof expected === 'object' && expected !== null) {
            for (const key in expected) {
                if (expected.hasOwnProperty(key)) {
                    if (!this.compareValues(expected[key], actual[key])) {
                        return false;
                    }
                }
            }
            return true;
        }

        return this.compareValues(expected, actual);
    }

    /**
     * Compare two values for equality (with special handling for objects)
     * @param {any} expected - Expected value
     * @param {any} actual - Actual value
     * @returns {boolean} True if values match
     */
    compareValues(expected, actual) {
        if (expected === null || expected === undefined) {
            return actual === expected;
        }

        if (typeof expected === 'object' && expected !== null) {
            if (typeof actual !== 'object' || actual === null) {
                return false;
            }

            // Compare symbol entry objects
            if (expected.name !== undefined) {
                return expected.name === actual.name &&
                       expected.type === actual.type &&
                       expected.value === actual.value;
            }

            // Compare generic objects
            for (const key in expected) {
                if (expected.hasOwnProperty(key)) {
                    if (!(key in actual) || !this.compareValues(expected[key], actual[key])) {
                        return false;
                    }
                }
            }
            return true;
        }

        return expected === actual;
    }

    /**
     * Display test result
     * @param {SymbolTableTestResult} result - Test result to display
     */
    displayTestResult(result) {
        const status = result.passed ? '✓ PASS' : '✗ FAIL';
        const time = result.executionTime > 0 ? ` (${result.executionTime}ms)` : '';

        console.log(`${status} ${result.testCase.name}${time}`);

        if (!result.passed) {
            if (result.error) {
                console.log(`  Error: ${result.error}`);
            } else {
                console.log(`  Expected:`, result.testCase.expected);
                console.log(`  Actual:`, result.actual);
            }
        }

        console.log('');
    }

    /**
     * Display test suite summary
     */
    displaySummary() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;

        console.log('=== TEST SUMMARY ===');
        console.log(`Total: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\nFailed Tests:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`  - ${result.testCase.name}`);
            });
        }
    }

    /**
     * Get detailed test report
     * @returns {Object} Detailed test report
     */
    getDetailedReport() {
        return {
            summary: {
                total: this.results.length,
                passed: this.results.filter(r => r.passed).length,
                failed: this.results.filter(r => !r.passed).length,
                successRate: (this.results.filter(r => r.passed).length / this.results.length) * 100
            },
            results: this.results.map(r => r.getDetails())
        };
    }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

/**
 * Integration test with lexical analyzer output
 */
class SymbolTableIntegrationTest {
    constructor() {
        this.testCases = [];
        this.setupIntegrationTestCases();
    }

    /**
     * Set up integration test cases
     */
    setupIntegrationTestCases() {
        // Assembly code with labels and equates
        this.testCases.push({
            name: "Assembly program with labels",
            assemblyCode: `
; Test program with labels
.text
.global main

main:
    LOAD R0, 42
    JUMP loop

loop:
    ADD R0, 1
    STORE [counter], R0
    JUMP loop

.data
counter: .equ 0x1000
buffer_size: .equ 256

end:
    HALT
            `,
            expectedSymbols: {
                "main": { type: SYMBOL_TYPES.LABEL, value: 0x0000 },
                "loop": { type: SYMBOL_TYPES.LABEL, value: 0x0008 },
                "counter": { type: SYMBOL_TYPES.EQUATE, value: 0x1000 },
                "buffer_size": { type: SYMBOL_TYPES.EQUATE, value: 256 },
                "end": { type: SYMBOL_TYPES.LABEL, value: 0x0020 }
            }
        });

        // Forward reference test
        this.testCases.push({
            name: "Forward references",
            assemblyCode: `
.text
.global start

start:
    JUMP target
    LOAD R0, 1

target:
    LOAD R1, 2
    HALT
            `,
            expectedSymbols: {
                "start": { type: SYMBOL_TYPES.LABEL, value: 0x0000 },
                "target": { type: SYMBOL_TYPES.LABEL, value: 0x000C }
            }
        });
    }

    /**
     * Run integration tests
     * @returns {Array} Integration test results
     */
    runIntegrationTests() {
        console.log('=== INTEGRATION TESTS ===');

        const results = [];

        for (const testCase of this.testCases) {
            console.log(`Running: ${testCase.name}`);

            try {
                // Tokenize assembly code
                const tokens = lexicalAnalysis(testCase.assemblyCode);

                // Create symbol table
                const symbolTable = new SymbolTable({});

                // Process tokens for symbols
                const currentAddress = 0x0000; // Starting address
                const processResult = processTokensForSymbols(tokens, symbolTable, currentAddress);

                // Validate results
                let passed = true;
                const errors = [];

                for (const symbolName in testCase.expectedSymbols) {
                    const expected = testCase.expectedSymbols[symbolName];
                    const actual = symbolTable.lookupSymbol(symbolName);

                    if (!actual) {
                        passed = false;
                        errors.push(`Symbol ${symbolName} not found`);
                    } else if (actual.type !== expected.type || actual.value !== expected.value) {
                        passed = false;
                        errors.push(`Symbol ${symbolName}: expected {type:${expected.type}, value:${expected.value}}, got {type:${actual.type}, value:${actual.value}}`);
                    }
                }

                results.push({
                    name: testCase.name,
                    passed: passed,
                    symbolsFound: processResult.symbolsAdded,
                    labelsFound: processResult.labelsFound,
                    equatesFound: processResult.equatesFound,
                    errors: errors
                });

                if (passed) {
                    console.log(`  ✓ PASS (${processResult.symbolsAdded} symbols)`);
                } else {
                    console.log(`  ✗ FAIL`);
                    errors.forEach(error => console.log(`    ${error}`));
                }

            } catch (error) {
                console.log(`  ✗ ERROR: ${error.message}`);
                results.push({
                    name: testCase.name,
                    passed: false,
                    error: error.message
                });
            }

            console.log('');
        }

        return results;
    }
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

/**
 * Performance test for symbol table operations
 */
class SymbolTablePerformanceTest {
    constructor() {
        this.testSizes = [100, 500, 1000, 2000];
    }

    /**
     * Generate test symbols for performance testing
     * @param {number} count - Number of symbols to generate
     * @returns {Array} Array of test symbols
     */
    generateTestSymbols(count) {
        const symbols = [];
        const types = [SYMBOL_TYPES.LABEL, SYMBOL_TYPES.EQUATE];

        for (let i = 0; i < count; i++) {
            const type = types[i % types.length];
            const name = `symbol_${i}`;
            const value = i * 4; // Simulate address progression

            symbols.push({ name, type, value });
        }

        return symbols;
    }

    /**
     * Run performance tests
     * @returns {Array} Performance test results
     */
    runPerformanceTests() {
        console.log('=== PERFORMANCE TESTS ===');

        const results = [];

        for (const size of this.testSizes) {
            console.log(`Testing with ${size} symbols...`);

            const testSymbols = this.generateTestSymbols(size);
            const symbolTable = new SymbolTable({});
            const startTime = Date.now();

            try {
                // Add all symbols
                let addedCount = 0;
                for (const symbol of testSymbols) {
                    if (symbolTable.addSymbol(symbol.name, symbol.type, symbol.value)) {
                        addedCount++;
                    }
                }

                // Perform lookups
                let lookupCount = 0;
                for (const symbol of testSymbols) {
                    if (symbolTable.lookupSymbol(symbol.name)) {
                        lookupCount++;
                    }
                }

                const endTime = Date.now();
                const executionTime = endTime - startTime;

                const result = {
                    size: size,
                    symbolsAdded: addedCount,
                    lookupsPerformed: lookupCount,
                    time: executionTime,
                    addPerSecond: (addedCount / executionTime) * 1000,
                    lookupPerSecond: (lookupCount / executionTime) * 1000
                };

                results.push(result);

                console.log(`  Added: ${addedCount}/${size} symbols`);
                console.log(`  Lookups: ${lookupCount}/${size}`);
                console.log(`  Time: ${executionTime}ms`);
                console.log(`  Performance: ${result.addPerSecond.toFixed(0)} adds/sec, ${result.lookupPerSecond.toFixed(0)} lookups/sec`);

            } catch (error) {
                console.error(`  Error: ${error.message}`);

                results.push({
                    size: size,
                    error: error.message,
                    time: Date.now() - startTime
                });
            }
        }

        return results;
    }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

/**
 * Run complete symbol table test suite
 */
function runCompleteSymbolTableTestSuite() {
    console.log('ORIONRISC-128 SYMBOL TABLE - COMPLETE TEST SUITE');
    console.log('===============================================\n');

    // Unit tests
    const unitTests = new SymbolTableTestSuite();
    unitTests.runAllTests();

    // Integration tests
    const integrationTests = new SymbolTableIntegrationTest();
    const integrationResults = integrationTests.runIntegrationTests();

    // Performance tests
    const perfTests = new SymbolTablePerformanceTest();
    const perfResults = perfTests.runPerformanceTests();

    console.log('\n=== INTEGRATION SUMMARY ===');
    const integrationPassed = integrationResults.filter(r => r.passed).length;
    const integrationTotal = integrationResults.length;
    console.log(`Integration Tests: ${integrationPassed}/${integrationTotal} passed`);

    console.log('\n=== PERFORMANCE SUMMARY ===');
    perfResults.forEach(result => {
        if (!result.error) {
            console.log(`${result.size} symbols: ${result.time}ms (${result.addPerSecond.toFixed(0)} adds/sec)`);
        }
    });

    return {
        unitTests: unitTests.getDetailedReport(),
        integrationTests: integrationResults,
        performanceTests: perfResults
    };
}

/**
 * Demonstrate symbol table functionality
 */
function demonstrateSymbolTable() {
    console.log('=== SYMBOL TABLE DEMONSTRATION ===');

    const symbolTable = new SymbolTable({});

    // Demonstrate basic functionality
    console.log('Adding symbols...');

    symbolTable.addSymbol('main', SYMBOL_TYPES.LABEL, 0x0000, SYMBOL_SCOPES.GLOBAL);
    symbolTable.addSymbol('data_start', SYMBOL_TYPES.LABEL, 0x1000, SYMBOL_SCOPES.LOCAL);
    symbolTable.addSymbol('BUFFER_SIZE', SYMBOL_TYPES.EQUATE, 256, SYMBOL_SCOPES.GLOBAL);
    symbolTable.addSymbol('STACK_SIZE', SYMBOL_TYPES.EQUATE, 1024, SYMBOL_SCOPES.LOCAL);

    console.log('\nSymbol table contents:');
    const table = symbolTable.getSymbolTable();
    table.forEach((entry, name) => {
        console.log(`  ${name}: type=${entry.type}, scope=${entry.scope}, value=0x${entry.value.toString(16)}`);
    });

    console.log('\nSymbol resolution:');
    console.log(`  main = 0x${symbolTable.resolveSymbol('main').toString(16)}`);
    console.log(`  BUFFER_SIZE = ${symbolTable.resolveSymbol('BUFFER_SIZE')}`);
    console.log(`  nonexistent = ${symbolTable.resolveSymbol('nonexistent')}`);

    console.log('\nSymbol table statistics:');
    const stats = symbolTable.getStatistics();
    console.log(`  Symbols: ${stats.symbolCount}`);
    console.log(`  String storage used: ${stats.stringOffset} bytes`);
    console.log(`  Data storage used: ${stats.dataOffset} bytes`);

    return symbolTable;
}

// ============================================================================
// MOCK DEPENDENCIES FOR TESTING
// ============================================================================

// Mock MMU for testing (simplified implementation)
class MockMMU {
    constructor() {
        this.memory = new Array(0x10000).fill(0); // 64KB memory
    }

    readByte(address) {
        return this.memory[address] || 0;
    }

    readWord(address) {
        return (this.memory[address] || 0) | ((this.memory[address + 1] || 0) << 8);
    }

    writeByte(address, value) {
        this.memory[address] = value & 0xFF;
    }

    writeWord(address, value) {
        this.memory[address] = value & 0xFF;
        this.memory[address + 1] = (value >> 8) & 0xFF;
    }

    loadMemory(address, data) {
        for (let i = 0; i < data.length; i++) {
            this.memory[address + i] = data[i];
        }
    }

    getMemoryStats() {
        return {
            total: this.memory.length,
            used: this.memory.filter(x => x !== 0).length
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SymbolTableTestCase,
        SymbolTableTestResult,
        SymbolTableTestSuite,
        SymbolTableIntegrationTest,
        SymbolTablePerformanceTest,
        runCompleteSymbolTableTestSuite,
        demonstrateSymbolTable,
        MockMMU
    };
}

module.exports = {
    runCompleteSymbolTableTestSuite,
    demonstrateSymbolTable
};