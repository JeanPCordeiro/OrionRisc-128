/**
 * Test Suite for Directive Processor
 *
 * This module provides comprehensive testing for the directive processor
 * component of the Phase 2 assembler, including unit tests, integration
 * tests, and error condition validation.
 *
 * Phase 2 Component: Directive Processor Testing
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

/**
 * Test Framework Class
 */
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = null;
    }

    /**
     * Add test case
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function
     * @param {string} category - Test category
     */
    addTest(name, testFunction, category = 'general') {
        this.tests.push({
            name,
            testFunction,
            category,
            status: 'pending'
        });
    }

    /**
     * Run all tests
     * @returns {Object} Test results
     */
    async runAllTests() {
        console.log('=== DIRECTIVE PROCESSOR TEST SUITE ===\n');

        let passed = 0;
        let failed = 0;
        let errors = [];

        for (const test of this.tests) {
            this.currentTest = test;
            try {
                console.log(`Running: ${test.name}`);
                await test.testFunction();
                test.status = 'passed';
                passed++;
                console.log(`✓ PASSED: ${test.name}\n`);
            } catch (error) {
                test.status = 'failed';
                failed++;
                errors.push({ test: test.name, error: error.message });
                console.log(`✗ FAILED: ${test.name} - ${error.message}\n`);
            }
        }

        console.log(`Test Results: ${passed} passed, ${failed} failed`);

        return {
            total: this.tests.length,
            passed,
            failed,
            errors,
            success: failed === 0
        };
    }

    /**
     * Assert equality
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} message - Error message
     */
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message} (expected ${expected}, got ${actual})`);
        }
    }

    /**
     * Assert truthiness
     * @param {*} value - Value to test
     * @param {string} message - Error message
     */
    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`Assertion failed: ${message} (expected true, got ${value})`);
        }
    }

    /**
     * Assert array equality
     * @param {Array} actual - Actual array
     * @param {Array} expected - Expected array
     * @param {string} message - Error message
     */
    assertArrayEqual(actual, expected, message = '') {
        if (actual.length !== expected.length) {
            throw new Error(`Array length mismatch: ${message} (expected ${expected.length}, got ${actual.length})`);
        }

        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                throw new Error(`Array element mismatch at index ${i}: ${message} (expected ${expected[i]}, got ${actual[i]})`);
            }
        }
    }
}

// ============================================================================
// MOCK OBJECTS
// ============================================================================

/**
 * Mock MMU for testing
 */
class MockMMU {
    constructor() {
        this.memory = new Map();
    }

    readByte(address) {
        return this.memory.get(address) || 0;
    }

    writeByte(address, value) {
        this.memory.set(address, value & 0xFF);
    }

    readWord(address) {
        const low = this.readByte(address);
        const high = this.readByte(address + 1);
        return (high << 8) | low;
    }

    writeWord(address, value) {
        this.writeByte(address, value & 0xFF);
        this.writeByte(address + 1, (value >> 8) & 0xFF);
    }
}

/**
 * Mock Symbol Table for testing
 */
class MockSymbolTable {
    constructor() {
        this.symbols = new Map();
    }

    addSymbol(name, type, value, scope = 1) {
        this.symbols.set(name, { type, value, scope });
        return true;
    }

    lookupSymbol(name) {
        return this.symbols.get(name) || null;
    }

    resolveSymbol(name) {
        const symbol = this.lookupSymbol(name);
        return symbol ? symbol.value : null;
    }
}

// ============================================================================
// TEST CASES
// ============================================================================

/**
 * Create test tokens for directive testing
 * @returns {Array} Test tokens
 */
function createTestTokens() {
    return [
        { type: 4, text: '.text', position: 0 },
        { type: 0, text: 'LOAD', position: 1 },
        { type: 4, text: '.data', position: 2 },
        { type: 4, text: '.equ', position: 3 },
        { type: 3, text: 'BUFFER_SIZE:', position: 4 },
        { type: 2, value: 256, position: 5 },
        { type: 4, text: '.global', position: 6 },
        { type: 3, text: 'main:', position: 7 },
        { type: 4, text: '.text', position: 8 }
    ];
}

/**
 * Test section management directives
 */
async function testSectionManagement() {
    const framework = new TestFramework();
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { DirectiveProcessor } = require('./directive-processor');
    const processor = new DirectiveProcessor(mmu, symbolTable);

    // Test .text directive
    const tokens = [
        { type: 4, text: '.text', position: 0 },
        { type: 4, text: '.data', position: 1 },
        { type: 4, text: '.text', position: 2 }
    ];

    const result = processor.processTokens(tokens);

    framework.assertTrue(result.success, 'Section processing should succeed');
    framework.assertEqual(result.directives.length, 3, 'Should process 3 directives');
    framework.assertEqual(processor.currentSection, 'text', 'Should end in text section');
    framework.assertEqual(processor.currentAddress, 0x1000, 'Should have correct text address');

    console.log('Section management test completed');
}

/**
 * Test symbol definition directives
 */
async function testSymbolDefinition() {
    const framework = new TestFramework();
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { DirectiveProcessor } = require('./directive-processor');
    const processor = new DirectiveProcessor(mmu, symbolTable);

    // Test .equ directive
    const tokens = [
        { type: 4, text: '.equ', position: 0 },
        { type: 3, text: 'BUFFER_SIZE:', position: 1 },
        { type: 2, value: 256, position: 2 }
    ];

    const result = processor.processTokens(tokens);

    framework.assertTrue(result.success, 'Symbol definition should succeed');
    framework.assertEqual(result.directives.length, 1, 'Should process 1 directive');
    framework.assertTrue(symbolTable.lookupSymbol('BUFFER_SIZE') !== null, 'Symbol should be in table');
    framework.assertEqual(symbolTable.resolveSymbol('BUFFER_SIZE'), 256, 'Symbol should have correct value');

    console.log('Symbol definition test completed');
}

/**
 * Test global symbol directives
 */
async function testGlobalSymbols() {
    const framework = new TestFramework();
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { DirectiveProcessor } = require('./directive-processor');
    const processor = new DirectiveProcessor(mmu, symbolTable);

    // First add a symbol
    symbolTable.addSymbol('main', 0x1, 0x1000, 0x1);

    // Test .global directive
    const tokens = [
        { type: 4, text: '.global', position: 0 },
        { type: 3, text: 'main:', position: 1 }
    ];

    const result = processor.processTokens(tokens);

    framework.assertTrue(result.success, 'Global symbol processing should succeed');
    framework.assertEqual(result.directives.length, 1, 'Should process 1 directive');

    const symbol = symbolTable.lookupSymbol('main');
    framework.assertTrue(symbol !== null, 'Symbol should exist');
    framework.assertEqual(symbol.scope, 0x2, 'Symbol should be marked as global');

    console.log('Global symbol test completed');
}

/**
 * Test directive error handling
 */
async function testDirectiveErrors() {
    const framework = new TestFramework();
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { DirectiveProcessor } = require('./directive-processor');
    const processor = new DirectiveProcessor(mmu, symbolTable);

    // Test invalid directive
    const tokens = [
        { type: 4, text: '.invalid', position: 0 }
    ];

    const result = processor.processTokens(tokens);

    framework.assertTrue(result.errors.length > 0, 'Should have errors for invalid directive');
    framework.assertEqual(result.errors[0].type, 'UNKNOWN_DIRECTIVE', 'Should have correct error type');

    console.log('Directive error handling test completed');
}

/**
 * Test directive integration
 */
async function testDirectiveIntegration() {
    const framework = new TestFramework();
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { DirectiveProcessor } = require('./directive-processor');
    const processor = new DirectiveProcessor(mmu, symbolTable);

    // Test complete directive sequence
    const tokens = [
        { type: 4, text: '.text', position: 0 },
        { type: 4, text: '.global', position: 1 },
        { type: 3, text: 'main:', position: 2 },
        { type: 4, text: '.data', position: 3 },
        { type: 4, text: '.equ', position: 4 },
        { type: 3, text: 'SIZE:', position: 5 },
        { type: 2, value: 100, position: 6 }
    ];

    const result = processor.processTokens(tokens);

    framework.assertTrue(result.success, 'Integration test should succeed');
    framework.assertEqual(result.directives.length, 4, 'Should process 4 directives');
    framework.assertEqual(processor.currentSection, 'data', 'Should end in data section');

    // Check symbols
    const mainSymbol = symbolTable.lookupSymbol('main');
    const sizeSymbol = symbolTable.lookupSymbol('SIZE');

    framework.assertTrue(mainSymbol !== null, 'Main symbol should exist');
    framework.assertTrue(sizeSymbol !== null, 'Size symbol should exist');
    framework.assertEqual(sizeSymbol.value, 100, 'Size should have correct value');

    console.log('Directive integration test completed');
}

/**
 * Test memory layout management
 */
async function testMemoryLayout() {
    const framework = new TestFramework();
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { DirectiveProcessor } = require('./directive-processor');
    const processor = new DirectiveProcessor(mmu, symbolTable);

    // Test section switching and address management
    const tokens = [
        { type: 4, text: '.text', position: 0 },
        { type: 4, text: '.data', position: 1 },
        { type: 4, text: '.text', position: 2 }
    ];

    processor.processTokens(tokens);

    const sectionInfo = processor.getSectionInfo();

    framework.assertEqual(sectionInfo.currentSection, 'text', 'Should be in text section');
    framework.assertEqual(sectionInfo.currentAddress, 0x1000, 'Should have correct address');
    framework.assertTrue(sectionInfo.sectionAddresses.text === 0x1000, 'Text section should have correct address');
    framework.assertTrue(sectionInfo.sectionAddresses.data === 0x9000, 'Data section should have correct address');

    console.log('Memory layout test completed');
}

// ============================================================================
// TEST RUNNER
// ============================================================================

/**
 * Run complete test suite
 * @returns {Object} Test results
 */
async function runCompleteTestSuite() {
    const framework = new TestFramework();

    // Add test cases
    framework.addTest('Section Management', testSectionManagement, 'unit');
    framework.addTest('Symbol Definition', testSymbolDefinition, 'unit');
    framework.addTest('Global Symbols', testGlobalSymbols, 'unit');
    framework.addTest('Error Handling', testDirectiveErrors, 'unit');
    framework.addTest('Integration', testDirectiveIntegration, 'integration');
    framework.addTest('Memory Layout', testMemoryLayout, 'unit');

    return await framework.runAllTests();
}

/**
 * Demonstrate directive processor functionality
 */
function demonstrateDirectiveProcessor() {
    console.log('=== DIRECTIVE PROCESSOR DEMONSTRATION ===');

    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { DirectiveProcessor } = require('./directive-processor');
    const processor = new DirectiveProcessor(mmu, symbolTable);

    const testProgram = `
.text
.global main
.equ BUFFER_SIZE 256
.data
.global data_buffer
.equ MAX_SIZE 1024
`;

    console.log('Processing test program:');
    console.log(testProgram);

    // Simulate token processing
    const tokens = [
        { type: 4, text: '.text', position: 0 },
        { type: 4, text: '.global', position: 1 },
        { type: 3, text: 'main:', position: 2 },
        { type: 4, text: '.equ', position: 3 },
        { type: 3, text: 'BUFFER_SIZE:', position: 4 },
        { type: 2, value: 256, position: 5 },
        { type: 4, text: '.data', position: 6 },
        { type: 4, text: '.global', position: 7 },
        { type: 3, text: 'data_buffer:', position: 8 },
        { type: 4, text: '.equ', position: 9 },
        { type: 3, text: 'MAX_SIZE:', position: 10 },
        { type: 2, value: 1024, position: 11 }
    ];

    const result = processor.processTokens(tokens);

    console.log(`\nProcessed ${result.directives.length} directives:`);
    result.directives.forEach((directive, i) => {
        console.log(`  ${i + 1}. ${directive.name} (${directive.type})`);
    });

    const sectionInfo = processor.getSectionInfo();
    console.log(`\nFinal state:`);
    console.log(`  Current section: ${sectionInfo.currentSection}`);
    console.log(`  Current address: 0x${sectionInfo.currentAddress.toString(16)}`);

    console.log(`\nSymbols defined:`);
    symbolTable.symbols.forEach((entry, name) => {
        console.log(`  ${name}: 0x${entry.value.toString(16)}`);
    });

    return result;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main test execution function
 */
async function main() {
    if (typeof window !== 'undefined') {
        // Browser environment
        console.log('Running directive processor tests in browser...');
        await runCompleteTestSuite();
    } else {
        // Node.js environment
        console.log('Running directive processor test suite...');

        const results = await runCompleteTestSuite();

        console.log(`\nTest suite completed: ${results.passed}/${results.total} tests passed`);

        if (results.success) {
            console.log('✓ All tests passed!');
            process.exit(0);
        } else {
            console.log('✗ Some tests failed');
            process.exit(1);
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TestFramework,
        MockMMU,
        MockSymbolTable,
        runCompleteTestSuite,
        demonstrateDirectiveProcessor,
        testSectionManagement,
        testSymbolDefinition,
        testGlobalSymbols,
        testDirectiveErrors,
        testDirectiveIntegration,
        testMemoryLayout,
        createTestTokens,
        main
    };
}

module.exports.runCompleteTestSuite = runCompleteTestSuite;