/**
 * Integration Tests for Label and Symbol Resolution System
 *
 * This module provides comprehensive tests for the label and symbol resolution
 * functionality, including forward references, expression evaluation, and
 * error handling within the 128KB memory constraints.
 *
 * Phase 2 Component: Resolution System Tests
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

/**
 * Test Result Class
 */
class TestResult {
    constructor(testName) {
        this.testName = testName;
        this.passed = false;
        this.errors = [];
        this.warnings = [];
        this.executionTime = 0;
        this.startTime = 0;
        this.endTime = 0;
    }

    /**
     * Mark test as passed
     */
    pass() {
        this.passed = true;
        this.endTime = Date.now();
        this.executionTime = this.endTime - this.startTime;
    }

    /**
     * Mark test as failed with error
     */
    fail(error) {
        this.passed = false;
        this.errors.push(error);
        this.endTime = Date.now();
        this.executionTime = this.endTime - this.startTime;
    }

    /**
     * Add warning
     */
    addWarning(warning) {
        this.warnings.push(warning);
    }

    /**
     * Get test summary
     */
    getSummary() {
        return {
            testName: this.testName,
            passed: this.passed,
            executionTime: this.executionTime,
            errorCount: this.errors.length,
            warningCount: this.warnings.length
        };
    }
}

/**
 * Test Suite Class
 */
class TestSuite {
    constructor(suiteName) {
        this.suiteName = suiteName;
        this.tests = [];
        this.results = [];
    }

    /**
     * Add test to suite
     */
    addTest(testName, testFunction) {
        this.tests.push({ name: testName, fn: testFunction });
    }

    /**
     * Run all tests in suite
     */
    async runAllTests() {
        console.log(`\n=== Running Test Suite: ${this.suiteName} ===`);

        for (const test of this.tests) {
            const result = new TestResult(test.name);
            result.startTime = Date.now();

            try {
                await test.fn(result);
            } catch (error) {
                result.fail(`Test execution failed: ${error.message}`);
            }

            this.results.push(result);

            // Report individual test result
            if (result.passed) {
                console.log(`✓ ${test.name} (${result.executionTime}ms)`);
            } else {
                console.log(`✗ ${test.name} (${result.executionTime}ms)`);
                result.errors.forEach(error => console.log(`  Error: ${error}`));
            }
        }

        this.printSummary();
        return this.getSuiteResults();
    }

    /**
     * Print test suite summary
     */
    printSummary() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const totalTime = this.results.reduce((sum, r) => sum + r.executionTime, 0);

        console.log(`\n=== Test Suite Summary: ${this.suiteName} ===`);
        console.log(`Total Tests: ${this.results.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total Time: ${totalTime}ms`);
        console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    }

    /**
     * Get suite results
     */
    getSuiteResults() {
        return {
            suiteName: this.suiteName,
            totalTests: this.results.length,
            passedTests: this.results.filter(r => r.passed).length,
            failedTests: this.results.filter(r => !r.passed).length,
            totalTime: this.results.reduce((sum, r) => sum + r.executionTime, 0),
            results: this.results.map(r => r.getSummary())
        };
    }
}

// ============================================================================
// MOCK OBJECTS FOR TESTING
// ============================================================================

/**
 * Mock MMU for testing
 */
class MockMMU {
    constructor() {
        this.memory = new Map();
        this.nextAddress = 0x1000;
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

    allocate(size) {
        const address = this.nextAddress;
        this.nextAddress += size;
        return address;
    }

    reset() {
        this.memory.clear();
        this.nextAddress = 0x1000;
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
        this.symbols.set(name, { name, type, value, scope });
        return true;
    }

    resolveSymbol(name) {
        const symbol = this.symbols.get(name);
        return symbol ? symbol.value : null;
    }

    lookupSymbol(name) {
        return this.symbols.get(name) || null;
    }

    getSymbolTable() {
        return new Map(this.symbols);
    }

    initialize() {
        // Mock initialization
    }

    reset() {
        this.symbols.clear();
    }
}

/**
 * Create mock instruction for testing
 */
function createMockInstruction(mnemonic, operands, address = 0) {
    return {
        mnemonic: mnemonic,
        opcode: getOpcodeForMnemonic(mnemonic),
        operands: operands,
        address: address,
        size: 4,
        valid: true,
        errors: [],
        machineCode: 0,

        addError(error) {
            this.valid = false;
            this.errors.push(error);
        },

        isValid() {
            return this.valid && this.errors.length === 0;
        }
    };
}

/**
 * Get opcode for mnemonic (simplified mapping)
 */
function getOpcodeForMnemonic(mnemonic) {
    const opcodes = {
        'LOAD': 0x01,
        'STORE': 0x02,
        'ADD': 0x03,
        'SUB': 0x04,
        'JUMP': 0x06,
        'CALL': 0x07,
        'RET': 0x08,
        'HALT': 0xFF,
        'SYSCALL': 0x05,
        'NOP': 0x00
    };
    return opcodes[mnemonic] || 0x00;
}

// ============================================================================
// TEST CASES
// ============================================================================

/**
 * Test basic label resolution
 */
async function testBasicLabelResolution(result) {
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    // Add some symbols
    symbolTable.addSymbol('main', 1, 0x1000);
    symbolTable.addSymbol('data_buffer', 1, 0x2000);
    symbolTable.addSymbol('BUFFER_SIZE', 2, 256);

    const { LabelSymbolResolver } = require('./label-symbol-resolution');
    const resolver = new LabelSymbolResolver(mmu, symbolTable);

    // Create test instructions with label references
    const instructions = [
        createMockInstruction('JUMP', [{ type: 'address', value: 0, text: 'main', isLabel: true }], 0x1000),
        createMockInstruction('LOAD', [
            { type: 'register', value: 0, text: 'R0' },
            { type: 'immediate', value: 0, text: 'data_buffer', isLabel: true }
        ], 0x1004),
        createMockInstruction('LOAD', [
            { type: 'register', value: 0, text: 'R0' },
            { type: 'immediate', value: 0, text: 'BUFFER_SIZE', isLabel: true }
        ], 0x1008)
    ];

    resolver.initialize();

    // Process label references
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let j = 0; j < instruction.operands.length; j++) {
            const operand = instruction.operands[j];
            if (operand.type === 'address' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
            if (operand.type === 'immediate' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
        }
    }

    // Resolve relocations
    const resolveResult = resolver.resolveRelocations(instructions);

    if (!resolveResult) {
        result.fail('Failed to resolve basic labels');
        return;
    }

    // Check that labels were resolved correctly
    if (instructions[0].operands[0].value !== 0x1000) {
        result.fail(`JUMP label not resolved correctly: expected 0x1000, got 0x${instructions[0].operands[0].value.toString(16)}`);
        return;
    }

    if (instructions[1].operands[1].value !== 0x2000) {
        result.fail(`LOAD label not resolved correctly: expected 0x2000, got 0x${instructions[1].operands[1].value.toString(16)}`);
        return;
    }

    if (instructions[2].operands[1].value !== 256) {
        result.fail(`BUFFER_SIZE not resolved correctly: expected 256, got ${instructions[2].operands[1].value}`);
        return;
    }

    result.pass();
}

/**
 * Test forward reference handling
 */
async function testForwardReferenceHandling(result) {
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { LabelSymbolResolver } = require('./label-symbol-resolution');
    const resolver = new LabelSymbolResolver(mmu, symbolTable);

    // Create instructions with forward references (labels defined after use)
    const instructions = [
        createMockInstruction('JUMP', [{ type: 'address', value: 0, text: 'target_label', isLabel: true }], 0x1000),
        createMockInstruction('CALL', [{ type: 'address', value: 0, text: 'subroutine', isLabel: true }], 0x1004),
        createMockInstruction('LOAD', [
            { type: 'register', value: 0, text: 'R0' },
            { type: 'immediate', value: 0, text: 'some_constant', isLabel: true }
        ], 0x1008),
        createMockInstruction('NOP', [], 0x100C),  // target_label will be here
        createMockInstruction('NOP', [], 0x1010),  // subroutine will be here
        createMockInstruction('NOP', [], 0x1014)   // some_constant will be here
    ];

    resolver.initialize();

    // Process forward references
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let j = 0; j < instruction.operands.length; j++) {
            const operand = instruction.operands[j];
            if (operand.type === 'address' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
            if (operand.type === 'immediate' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
        }
    }

    // Now add the symbols that were referenced (simulating labels being defined later)
    symbolTable.addSymbol('target_label', 1, 0x100C);
    symbolTable.addSymbol('subroutine', 1, 0x1010);
    symbolTable.addSymbol('some_constant', 2, 42);

    // Resolve relocations
    const resolveResult = resolver.resolveRelocations(instructions);

    if (!resolveResult) {
        result.fail('Failed to resolve forward references');
        return;
    }

    // Check that forward references were resolved correctly
    if (instructions[0].operands[0].value !== 0x100C) {
        result.fail(`Forward reference target_label not resolved correctly: expected 0x100C, got 0x${instructions[0].operands[0].value.toString(16)}`);
        return;
    }

    if (instructions[1].operands[0].value !== 0x1010) {
        result.fail(`Forward reference subroutine not resolved correctly: expected 0x1010, got 0x${instructions[1].operands[0].value.toString(16)}`);
        return;
    }

    if (instructions[2].operands[1].value !== 42) {
        result.fail(`Forward reference some_constant not resolved correctly: expected 42, got ${instructions[2].operands[1].value}`);
        return;
    }

    result.pass();
}

/**
 * Test expression evaluation
 */
async function testExpressionEvaluation(result) {
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    // Add symbols for expressions
    symbolTable.addSymbol('BUFFER_SIZE', 2, 256);
    symbolTable.addSymbol('DATA_START', 2, 0x1000);
    symbolTable.addSymbol('OFFSET', 2, 16);

    const { LabelSymbolResolver } = require('./label-symbol-resolution');
    const resolver = new LabelSymbolResolver(mmu, symbolTable);

    // Create instructions with expressions
    const instructions = [
        createMockInstruction('LOAD', [
            { type: 'register', value: 0, text: 'R0' },
            { type: 'memory', baseRegister: 1, offset: 0, text: '[BUFFER_SIZE + 10]' }
        ], 0x1000),
        createMockInstruction('STORE', [
            { type: 'memory', baseRegister: 2, offset: 0, text: '[DATA_START + OFFSET]' },
            { type: 'register', value: 0, text: 'R0' }
        ], 0x1004),
        createMockInstruction('LOAD', [
            { type: 'register', value: 1, text: 'R1' },
            { type: 'memory', baseRegister: 3, offset: 0, text: '[BUFFER_SIZE * 2]' }
        ], 0x1008)
    ];

    resolver.initialize();

    // Process expressions
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let j = 0; j < instruction.operands.length; j++) {
            const operand = instruction.operands[j];
            if (operand.type === 'memory' && operand.text) {
                const exprMatch = operand.text.match(/\[([^\]]+)\]/);
                if (exprMatch) {
                    const expression = exprMatch[1];
                    resolver.processSymbolExpression(instruction, i, expression, j);
                }
            }
        }
    }

    // Check that expressions were evaluated correctly
    if (instructions[0].operands[1].value !== 266) { // 256 + 10
        result.fail(`Expression 'BUFFER_SIZE + 10' not evaluated correctly: expected 266, got ${instructions[0].operands[1].value}`);
        return;
    }

    if (instructions[1].operands[0].value !== 0x1010) { // 0x1000 + 16
        result.fail(`Expression 'DATA_START + OFFSET' not evaluated correctly: expected 0x1010, got 0x${instructions[1].operands[0].value.toString(16)}`);
        return;
    }

    if (instructions[2].operands[1].value !== 512) { // 256 * 2
        result.fail(`Expression 'BUFFER_SIZE * 2' not evaluated correctly: expected 512, got ${instructions[2].operands[1].value}`);
        return;
    }

    result.pass();
}

/**
 * Test error handling for undefined symbols
 */
async function testUndefinedSymbolHandling(result) {
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    // Don't add the referenced symbols

    const { LabelSymbolResolver } = require('./label-symbol-resolution');
    const resolver = new LabelSymbolResolver(mmu, symbolTable);

    // Create instructions with undefined symbol references
    const instructions = [
        createMockInstruction('JUMP', [{ type: 'address', value: 0, text: 'undefined_label', isLabel: true }], 0x1000),
        createMockInstruction('LOAD', [
            { type: 'register', value: 0, text: 'R0' },
            { type: 'immediate', value: 0, text: 'UNDEFINED_CONSTANT', isLabel: true }
        ], 0x1004)
    ];

    resolver.initialize();

    // Process undefined references
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let j = 0; j < instruction.operands.length; j++) {
            const operand = instruction.operands[j];
            if (operand.type === 'address' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
            if (operand.type === 'immediate' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
        }
    }

    // Try to resolve - should fail
    const resolveResult = resolver.resolveRelocations(instructions);

    if (resolveResult) {
        result.fail('Expected resolution to fail for undefined symbols');
        return;
    }

    // Check that appropriate errors were recorded
    const errors = resolver.getErrors();
    if (errors.length < 2) {
        result.fail(`Expected at least 2 errors for undefined symbols, got ${errors.length}`);
        return;
    }

    const hasUndefinedLabelError = errors.some(e => e.message.includes('undefined_label'));
    const hasUndefinedConstantError = errors.some(e => e.message.includes('UNDEFINED_CONSTANT'));

    if (!hasUndefinedLabelError || !hasUndefinedConstantError) {
        result.fail('Expected errors for both undefined symbols');
        return;
    }

    result.pass();
}

/**
 * Test relocation table management
 */
async function testRelocationTableManagement(result) {
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { LabelSymbolResolver } = require('./label-symbol-resolution');
    const resolver = new LabelSymbolResolver(mmu, symbolTable);

    // Create instructions that will need relocations
    const instructions = [
        createMockInstruction('JUMP', [{ type: 'address', value: 0, text: 'label1', isLabel: true }], 0x1000),
        createMockInstruction('CALL', [{ type: 'address', value: 0, text: 'label2', isLabel: true }], 0x1004),
        createMockInstruction('JUMP', [{ type: 'address', value: 0, text: 'label3', isLabel: true }], 0x1008)
    ];

    resolver.initialize();

    // Add relocations
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let j = 0; j < instruction.operands.length; j++) {
            const operand = instruction.operands[j];
            if (operand.type === 'address' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
        }
    }

    // Check relocation statistics
    const stats = resolver.getStatistics();
    if (stats.totalRelocations !== 3) {
        result.fail(`Expected 3 relocations, got ${stats.totalRelocations}`);
        return;
    }

    // Add symbols and resolve
    symbolTable.addSymbol('label1', 1, 0x1100);
    symbolTable.addSymbol('label2', 1, 0x1200);
    symbolTable.addSymbol('label3', 1, 0x1300);

    const resolveResult = resolver.resolveRelocations(instructions);

    if (!resolveResult) {
        result.fail('Failed to resolve relocations');
        return;
    }

    // Check final statistics
    const finalStats = resolver.getStatistics();
    if (finalStats.resolvedRelocations !== 3) {
        result.fail(`Expected 3 resolved relocations, got ${finalStats.resolvedRelocations}`);
        return;
    }

    if (finalStats.resolutionPasses === 0) {
        result.fail('Expected at least 1 resolution pass');
        return;
    }

    result.pass();
}

/**
 * Test cross-reference validation
 */
async function testCrossReferenceValidation(result) {
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    // Add some symbols but not others
    symbolTable.addSymbol('defined_label', 1, 0x1000);
    symbolTable.addSymbol('DEFINED_CONSTANT', 2, 42);
    // undefined_label and UNDEFINED_CONSTANT are not added

    const { LabelSymbolResolver } = require('./label-symbol-resolution');
    const resolver = new LabelSymbolResolver(mmu, symbolTable);

    // Create instructions with mix of defined and undefined references
    const instructions = [
        createMockInstruction('JUMP', [{ type: 'address', value: 0, text: 'defined_label', isLabel: true }], 0x1000),
        createMockInstruction('LOAD', [
            { type: 'register', value: 0, text: 'R0' },
            { type: 'immediate', value: 0, text: 'DEFINED_CONSTANT', isLabel: true }
        ], 0x1004),
        createMockInstruction('CALL', [{ type: 'address', value: 0, text: 'undefined_label', isLabel: true }], 0x1008),
        createMockInstruction('LOAD', [
            { type: 'register', value: 1, text: 'R1' },
            { type: 'immediate', value: 0, text: 'UNDEFINED_CONSTANT', isLabel: true }
        ], 0x100C)
    ];

    resolver.initialize();

    // Process all references
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let j = 0; j < instruction.operands.length; j++) {
            const operand = instruction.operands[j];
            if (operand.type === 'address' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
            if (operand.type === 'immediate' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
        }
    }

    // Resolve what we can
    resolver.resolveRelocations(instructions);

    // Validate references
    const validateResult = resolver.validateReferences(instructions);

    if (validateResult) {
        result.fail('Expected validation to fail with undefined symbols');
        return;
    }

    // Check that we have errors for undefined symbols
    const errors = resolver.getErrors();
    const undefinedErrors = errors.filter(e => e.type === 1); // UNDEFINED_SYMBOL

    if (undefinedErrors.length < 2) {
        result.fail(`Expected at least 2 undefined symbol errors, got ${undefinedErrors.length}`);
        return;
    }

    result.pass();
}

/**
 * Test complex expression evaluation
 */
async function testComplexExpressions(result) {
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    // Add symbols for complex expressions
    symbolTable.addSymbol('BASE_ADDR', 2, 0x1000);
    symbolTable.addSymbol('SIZE', 2, 256);
    symbolTable.addSymbol('INDEX', 2, 10);
    symbolTable.addSymbol('SCALE', 2, 4);

    const { LabelSymbolResolver } = require('./label-symbol-resolution');
    const resolver = new LabelSymbolResolver(mmu, symbolTable);

    // Create instructions with complex expressions
    const instructions = [
        createMockInstruction('LOAD', [
            { type: 'register', value: 0, text: 'R0' },
            { type: 'memory', baseRegister: 1, offset: 0, text: '[BASE_ADDR + SIZE * INDEX]' }
        ], 0x1000),
        createMockInstruction('STORE', [
            { type: 'memory', baseRegister: 2, offset: 0, text: '[BASE_ADDR + INDEX * SCALE + 8]' },
            { type: 'register', value: 0, text: 'R0' }
        ], 0x1004)
    ];

    resolver.initialize();

    // Process complex expressions
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let j = 0; j < instruction.operands.length; j++) {
            const operand = instruction.operands[j];
            if (operand.type === 'memory' && operand.text) {
                const exprMatch = operand.text.match(/\[([^\]]+)\]/);
                if (exprMatch) {
                    const expression = exprMatch[1];
                    const success = resolver.processSymbolExpression(instruction, i, expression, j);
                    if (!success) {
                        result.fail(`Failed to process expression '${expression}': ${resolver.getErrors().map(e => e.message).join(', ')}`);
                        return;
                    }
                }
            }
        }
    }

    // Check that complex expressions were evaluated correctly
    // BASE_ADDR + SIZE * INDEX = 0x1000 + 256 * 10 = 0x1000 + 2560 = 0x1A00 (6656 in decimal)
    const expected1 = 0x1000 + (256 * 10); // 0x1A00 = 6656
    if (instructions[0].operands[1].value !== expected1) {
        result.fail(`Complex expression 'BASE_ADDR + SIZE * INDEX' not evaluated correctly: expected ${expected1} (0x${expected1.toString(16)}), got ${instructions[0].operands[1].value || 0}`);
        return;
    }

    // BASE_ADDR + INDEX * SCALE + 8 = 0x1000 + 10 * 4 + 8 = 0x1000 + 40 + 8 = 0x1048 (4168 in decimal)
    const expected2 = 0x1000 + (10 * 4) + 8; // 0x1048 = 4168
    if (instructions[1].operands[0].value !== expected2) {
        result.fail(`Complex expression 'BASE_ADDR + INDEX * SCALE + 8' not evaluated correctly: expected ${expected2} (0x${expected2.toString(16)}), got ${instructions[1].operands[0].value || 0}`);
        return;
    }

    result.pass();
}

/**
 * Test memory constraints and overflow handling
 */
async function testMemoryConstraints(result) {
    const mmu = new MockMMU();
    const symbolTable = new MockSymbolTable();

    const { LabelSymbolResolver } = require('./label-symbol-resolution');
    const resolver = new LabelSymbolResolver(mmu, symbolTable);

    // Create a large number of instructions with relocations to test memory constraints
    const instructions = [];
    for (let i = 0; i < 100; i++) {
        instructions.push(createMockInstruction('JUMP', [
            { type: 'address', value: 0, text: `label_${i}`, isLabel: true }
        ], 0x1000 + (i * 4)));
    }

    resolver.initialize();

    // Process all references
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let j = 0; j < instruction.operands.length; j++) {
            const operand = instruction.operands[j];
            if (operand.type === 'address' && operand.isLabel) {
                resolver.processLabelReference(instruction, i, operand.text, j);
            }
        }
    }

    // Add all the symbols
    for (let i = 0; i < 100; i++) {
        symbolTable.addSymbol(`label_${i}`, 1, 0x2000 + (i * 4));
    }

    // Resolve relocations
    const resolveResult = resolver.resolveRelocations(instructions);

    if (!resolveResult) {
        result.fail('Failed to resolve relocations under memory constraints');
        return;
    }

    // Check statistics
    const stats = resolver.getStatistics();
    if (stats.totalRelocations !== 100) {
        result.fail(`Expected 100 relocations, got ${stats.totalRelocations}`);
        return;
    }

    if (stats.resolvedRelocations !== 100) {
        result.fail(`Expected 100 resolved relocations, got ${stats.resolvedRelocations}`);
        return;
    }

    result.pass();
}

// ============================================================================
// TEST RUNNER
// ============================================================================

/**
 * Run complete test suite for label and symbol resolution
 */
async function runCompleteTestSuite() {
    console.log('Starting Label and Symbol Resolution Test Suite...\n');

    const suite = new TestSuite('Label and Symbol Resolution Tests');

    // Add all test cases
    suite.addTest('Basic Label Resolution', testBasicLabelResolution);
    suite.addTest('Forward Reference Handling', testForwardReferenceHandling);
    suite.addTest('Expression Evaluation', testExpressionEvaluation);
    suite.addTest('Undefined Symbol Handling', testUndefinedSymbolHandling);
    suite.addTest('Relocation Table Management', testRelocationTableManagement);
    suite.addTest('Cross-Reference Validation', testCrossReferenceValidation);
    suite.addTest('Complex Expressions', testComplexExpressions);
    suite.addTest('Memory Constraints', testMemoryConstraints);

    // Run all tests
    const results = await suite.runAllTests();

    console.log('\n=== Final Test Summary ===');
    console.log(`Suite: ${results.suiteName}`);
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: ${results.passedTests}`);
    console.log(`Failed: ${results.failedTests}`);
    console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Execution Time: ${results.totalTime}ms`);

    return results;
}

/**
 * Demonstrate label and symbol resolution with example code
 */
function demonstrateLabelSymbolResolution() {
    console.log('\n=== LABEL AND SYMBOL RESOLUTION DEMONSTRATION ===');

    console.log('This demonstrates the key features of the label and symbol resolution system:');
    console.log('1. Forward reference handling - labels used before definition');
    console.log('2. Expression evaluation - symbols in arithmetic expressions');
    console.log('3. Relocation management - tracking and resolving address references');
    console.log('4. Cross-reference validation - ensuring all symbols are defined');
    console.log('5. Error reporting - clear messages for resolution failures');

    console.log('\nExample assembly code with label and symbol resolution:');
    console.log(`
; Forward references (labels used before definition)
    JUMP main_entry        ; Forward reference
    CALL subroutine        ; Forward reference

main:
    LOAD R0, [BUFFER_START]        ; Symbol reference
    LOAD R1, [BUFFER_SIZE + 10]    ; Expression with symbol
    ADD R0, R1
    STORE [RESULT], R0

main_entry:
    LOAD R2, 42
    JUMP end_label         ; Forward reference

subroutine:
    LOAD R3, [BUFFER_SIZE * 2]     ; Complex expression
    RET

.data
    BUFFER_START: .equ 0x1000
    BUFFER_SIZE: .equ 256
    RESULT: .equ 0x2000

end_label:
    HALT
`);

    console.log('Resolution process:');
    console.log('1. Pass 1: Collect all symbol references and forward references');
    console.log('2. Pass 2: Resolve symbols as they become defined');
    console.log('3. Pass 3: Apply relocations to generate final machine code');
    console.log('4. Pass 4: Validate all references are resolved');

    console.log('\nLabel and symbol resolution system ready for integration!');
}

// ============================================================================
// EXPORT AND RUNNER
// ============================================================================

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TestResult,
        TestSuite,
        MockMMU,
        MockSymbolTable,
        runCompleteTestSuite,
        demonstrateLabelSymbolResolution,
        createMockInstruction,
        getOpcodeForMnemonic
    };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined' && module === require.main) {
    // Node.js environment - run tests
    runCompleteTestSuite().then(results => {
        console.log('\nTest execution completed.');
        process.exit(results.failedTests > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports.runCompleteTestSuite = runCompleteTestSuite;