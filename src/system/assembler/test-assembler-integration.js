/**
 * Assembler Component Integration Test Suite
 *
 * Comprehensive testing of component interactions within the Phase 2 assembler.
 * Tests integration between lexical analyzer, parser, symbol table, code generator,
 * and label resolution system to ensure all components work together correctly.
 *
 * Phase 2 Component: Component Integration Testing
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

/**
 * Component Integration Test Framework
 */
class IntegrationTestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.mmu = null;
        this.cpu = null;
        this.assembler = null;
        this.components = {};
    }

    /**
     * Initialize test framework
     * @param {Object} mmu - Memory Management Unit instance
     * @param {Object} cpu - CPU instance
     */
    initialize(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;

        // Import and create assembler
        const { TwoPassAssembler } = require('./two-pass-assembler');
        this.assembler = new TwoPassAssembler(mmu, cpu);

        // Initialize individual components for testing
        this.initializeComponents();

        console.log('Integration test framework initialized');
    }

    /**
     * Initialize individual components for testing
     */
    initializeComponents() {
        console.log('Initializing individual components for testing...');

        // Import required modules
        const { LexicalAnalyzer } = require('./lexical-analyzer');
        const { SymbolTable } = require('./symbol-table');
        const { InstructionParser } = require('./instruction-parser');
        const { MachineCodeGenerator } = require('./machine-code-generator');
        const { LabelSymbolResolver } = require('./label-symbol-resolution');

        // Initialize components
        this.components.lexicalAnalyzer = new LexicalAnalyzer(this.mmu, this.cpu);
        this.components.symbolTable = new SymbolTable(this.mmu);
        this.components.instructionParser = new InstructionParser(this.mmu, this.components.symbolTable);
        this.components.machineCodeGenerator = new MachineCodeGenerator(this.mmu, this.components.symbolTable);
        this.components.labelSymbolResolver = new LabelSymbolResolver(this.mmu, this.components.symbolTable);

        console.log('All components initialized for integration testing');
    }

    /**
     * Add test case
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function
     */
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Run all tests
     * @returns {Object} Test results
     */
    runAllTests() {
        console.log('=== ASSEMBLER COMPONENT INTEGRATION TESTS ===');
        console.log('');

        this.results = { passed: 0, failed: 0, total: 0 };

        for (const test of this.tests) {
            try {
                console.log(`Running test: ${test.name}`);
                const result = test.testFunction();

                if (result) {
                    this.results.passed++;
                    console.log(`✓ PASSED: ${test.name}`);
                } else {
                    this.results.failed++;
                    console.log(`✗ FAILED: ${test.name}`);
                }

            } catch (error) {
                this.results.failed++;
                console.log(`✗ ERROR in ${test.name}: ${error.message}`);
            }

            this.results.total++;
            console.log('');
        }

        this.printSummary();
        return this.results;
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('=== INTEGRATION TEST SUMMARY ===');
        console.log(`Total tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.failed === 0) {
            console.log('🎉 All integration tests passed!');
        } else {
            console.log('❌ Some integration tests failed');
        }
    }
}

// ============================================================================
// INTEGRATION TEST PROGRAMS
// ============================================================================

/**
 * Test programs for component integration
 */
const INTEGRATION_TEST_PROGRAMS = {
    // Lexical analysis integration
    lexicalIntegration: `
.text
.global main

main:
    LOAD R0, 42
    ADD R0, R1
    HALT
    `,

    // Symbol table integration
    symbolIntegration: `
.text
.global main

.data
BUFFER: .equ 0x2000
SIZE: .equ 256

.text
main:
    LOAD R0, BUFFER
    LOAD R1, SIZE
    HALT
    `,

    // Parser integration
    parserIntegration: `
.text
.global main

main:
    LOAD R0, 42
    STORE [R1 + 5], R0
    LOAD R2, [R1 + 5]
    HALT
    `,

    // Code generator integration
    codeGenIntegration: `
.text
.global main

main:
    LOAD R0, 10
    LOAD R1, 20
    ADD R0, R1
    HALT
    `,

    // Label resolution integration
    labelResolutionIntegration: `
.text
.global main

main:
    JUMP target
    LOAD R0, 1

target:
    LOAD R1, 2
    HALT
    `
};

// ============================================================================
// INDIVIDUAL TEST FUNCTIONS
// ============================================================================

/**
 * Test lexical analyzer integration
 */
function testLexicalAnalyzerIntegration() {
    console.log('Testing lexical analyzer integration...');

    const { LexicalAnalyzer } = require('./lexical-analyzer');
    const analyzer = new LexicalAnalyzer(this.mmu, this.cpu);

    try {
        // Load lexical analyzer program
        analyzer.loadProgram(0x0000);

        // Test tokenization
        const result = analyzer.tokenize(
            INTEGRATION_TEST_PROGRAMS.lexicalIntegration,
            0x1000,
            0x2000,
            0x3000
        );

        if (result.errors && result.errors.length > 0) {
            console.error('Lexical analysis errors:', result.errors);
            return false;
        }

        if (result.tokenCount === 0) {
            console.error('No tokens generated');
            return false;
        }

        console.log(`Lexical analyzer generated ${result.tokenCount} tokens`);
        return true;

    } catch (error) {
        console.error('Lexical analyzer integration test failed:', error.message);
        return false;
    }
}

/**
 * Test symbol table integration
 */
function testSymbolTableIntegration() {
    console.log('Testing symbol table integration...');

    try {
        // Initialize symbol table
        this.components.symbolTable.initialize();

        // Test symbol processing
        const { processTokensForSymbols } = require('./symbol-table');

        // First need tokens from lexical analyzer
        const { LexicalAnalyzer } = require('./lexical-analyzer');
        const analyzer = new LexicalAnalyzer(this.mmu, this.cpu);
        analyzer.loadProgram(0x0000);

        const lexResult = analyzer.tokenize(
            INTEGRATION_TEST_PROGRAMS.symbolIntegration,
            0x1000,
            0x2000,
            0x3000
        );

        if (!lexResult.tokens || lexResult.tokens.length === 0) {
            console.error('No tokens for symbol table test');
            return false;
        }

        // Process tokens for symbols
        const processResult = processTokensForSymbols(
            lexResult.tokens,
            this.components.symbolTable,
            0x1000
        );

        if (processResult.errors && processResult.errors.length > 0) {
            console.error('Symbol processing errors:', processResult.errors);
            return false;
        }

        // Check that symbols were found
        const symbolTable = this.components.symbolTable.getSymbolTable();
        if (symbolTable.size === 0) {
            console.error('No symbols added to symbol table');
            return false;
        }

        console.log(`Symbol table integration: ${symbolTable.size} symbols processed`);
        return true;

    } catch (error) {
        console.error('Symbol table integration test failed:', error.message);
        return false;
    }
}

/**
 * Test instruction parser integration
 */
function testInstructionParserIntegration() {
    console.log('Testing instruction parser integration...');

    try {
        // Get tokens from lexical analyzer
        const { LexicalAnalyzer } = require('./lexical-analyzer');
        const analyzer = new LexicalAnalyzer(this.mmu, this.cpu);
        analyzer.loadProgram(0x0000);

        const lexResult = analyzer.tokenize(
            INTEGRATION_TEST_PROGRAMS.parserIntegration,
            0x1000,
            0x2000,
            0x3000
        );

        if (!lexResult.tokens || lexResult.tokens.length === 0) {
            console.error('No tokens for parser test');
            return false;
        }

        // Parse instructions
        const parseResult = this.components.instructionParser.parse(
            lexResult.tokens,
            0x1000
        );

        if (parseResult.errors && parseResult.errors.length > 0) {
            console.error('Parser errors:', parseResult.errors);
            return false;
        }

        if (!parseResult.instructions || parseResult.instructions.length === 0) {
            console.error('No instructions parsed');
            return false;
        }

        console.log(`Parser integration: ${parseResult.instructions.length} instructions parsed`);
        return true;

    } catch (error) {
        console.error('Instruction parser integration test failed:', error.message);
        return false;
    }
}

/**
 * Test machine code generator integration
 */
function testMachineCodeGeneratorIntegration() {
    console.log('Testing machine code generator integration...');

    try {
        // Get parsed instructions
        const { LexicalAnalyzer } = require('./lexical-analyzer');
        const analyzer = new LexicalAnalyzer(this.mmu, this.cpu);
        analyzer.loadProgram(0x0000);

        const lexResult = analyzer.tokenize(
            INTEGRATION_TEST_PROGRAMS.codeGenIntegration,
            0x1000,
            0x2000,
            0x3000
        );

        if (!lexResult.tokens || lexResult.tokens.length === 0) {
            console.error('No tokens for code generation test');
            return false;
        }

        // Parse instructions first
        const parseResult = this.components.instructionParser.parse(
            lexResult.tokens,
            0x1000
        );

        if (!parseResult.instructions || parseResult.instructions.length === 0) {
            console.error('No instructions for code generation');
            return false;
        }

        // Generate machine code
        const codeGenResult = this.components.machineCodeGenerator.generateMachineCode(
            parseResult.instructions,
            0x1000
        );

        if (codeGenResult.errors && codeGenResult.errors.length > 0) {
            console.error('Code generation errors:', codeGenResult.errors);
            return false;
        }

        if (!codeGenResult.instructions || codeGenResult.instructions.length === 0) {
            console.error('No machine code generated');
            return false;
        }

        console.log(`Code generator integration: ${codeGenResult.instructions.length} instructions encoded`);
        return true;

    } catch (error) {
        console.error('Machine code generator integration test failed:', error.message);
        return false;
    }
}

/**
 * Test label resolution integration
 */
function testLabelResolutionIntegration() {
    console.log('Testing label resolution integration...');

    try {
        // Get parsed instructions with labels
        const { LexicalAnalyzer } = require('./lexical-analyzer');
        const analyzer = new LexicalAnalyzer(this.mmu, this.cpu);
        analyzer.loadProgram(0x0000);

        const lexResult = analyzer.tokenize(
            INTEGRATION_TEST_PROGRAMS.labelResolutionIntegration,
            0x1000,
            0x2000,
            0x3000
        );

        if (!lexResult.tokens || lexResult.tokens.length === 0) {
            console.error('No tokens for label resolution test');
            return false;
        }

        // Parse instructions
        const parseResult = this.components.instructionParser.parse(
            lexResult.tokens,
            0x1000
        );

        if (!parseResult.instructions || parseResult.instructions.length === 0) {
            console.error('No instructions for label resolution');
            return false;
        }

        // Process label references
        const { processAllReferences } = require('./label-symbol-resolution');
        const resolveResult = processAllReferences(parseResult.instructions, this.components.labelSymbolResolver);

        if (!resolveResult) {
            console.error('Label resolution failed');
            return false;
        }

        // Check that forward references were resolved
        const stats = this.components.labelSymbolResolver.getStatistics();
        if (stats.errors > 0) {
            console.error(`Label resolution errors: ${stats.errors}`);
            return false;
        }

        console.log(`Label resolution integration: ${stats.resolvedRelocations} relocations resolved`);
        return true;

    } catch (error) {
        console.error('Label resolution integration test failed:', error.message);
        return false;
    }
}

/**
 * Test complete component pipeline
 */
function testCompleteComponentPipeline() {
    console.log('Testing complete component pipeline...');

    try {
        // Test the complete pipeline: lexical analysis → parsing → symbol resolution → code generation

        // Step 1: Lexical analysis
        const { LexicalAnalyzer } = require('./lexical-analyzer');
        const analyzer = new LexicalAnalyzer(this.mmu, this.cpu);
        analyzer.loadProgram(0x0000);

        const lexResult = analyzer.tokenize(
            INTEGRATION_TEST_PROGRAMS.symbolIntegration,
            0x1000,
            0x2000,
            0x3000
        );

        if (!lexResult.tokens || lexResult.tokens.length === 0) {
            console.error('Pipeline test failed at lexical analysis');
            return false;
        }

        // Step 2: Symbol table building
        const { processTokensForSymbols } = require('./symbol-table');
        this.components.symbolTable.initialize();

        const symbolResult = processTokensForSymbols(
            lexResult.tokens,
            this.components.symbolTable,
            0x1000
        );

        if (symbolResult.errors && symbolResult.errors.length > 0) {
            console.error('Pipeline test failed at symbol table building');
            return false;
        }

        // Step 3: Instruction parsing
        const parseResult = this.components.instructionParser.parse(
            lexResult.tokens,
            0x1000
        );

        if (!parseResult.instructions || parseResult.instructions.length === 0) {
            console.error('Pipeline test failed at instruction parsing');
            return false;
        }

        // Step 4: Label resolution
        const { processAllReferences } = require('./label-symbol-resolution');
        const resolveResult = processAllReferences(parseResult.instructions, this.components.labelSymbolResolver);

        if (!resolveResult) {
            console.error('Pipeline test failed at label resolution');
            return false;
        }

        // Step 5: Code generation
        const codeGenResult = this.components.machineCodeGenerator.generateMachineCode(
            parseResult.instructions,
            0x1000
        );

        if (!codeGenResult.instructions || codeGenResult.instructions.length === 0) {
            console.error('Pipeline test failed at code generation');
            return false;
        }

        console.log('Complete component pipeline test successful');
        console.log(`  Tokens: ${lexResult.tokenCount}`);
        console.log(`  Symbols: ${this.components.symbolTable.getSymbolTable().size}`);
        console.log(`  Instructions: ${parseResult.instructions.length}`);
        console.log(`  Machine code: ${codeGenResult.instructions.length} words`);

        return true;

    } catch (error) {
        console.error('Complete pipeline test failed:', error.message);
        return false;
    }
}

/**
 * Test component error coordination
 */
function testComponentErrorCoordination() {
    console.log('Testing component error coordination...');

    // Test with a program that will cause errors in multiple components
    const errorProgram = `
.text
.global main

main:
    INVALID_INSTRUCTION R0, 42
    LOAD R0, [undefined_symbol]
    JUMP
    HALT
    `;

    try {
        const result = this.assembler.assemble(errorProgram);

        if (result.success) {
            console.error('Assembly should have failed for error coordination test');
            return false;
        }

        // Check that errors from multiple components are collected
        if (result.errors.length === 0) {
            console.error('No errors collected for error coordination test');
            return false;
        }

        console.log(`Error coordination: ${result.errors.length} errors collected from multiple components`);
        return true;

    } catch (error) {
        console.error('Error coordination test failed:', error.message);
        return false;
    }
}

/**
 * Test memory layout coordination
 */
function testMemoryLayoutCoordination() {
    console.log('Testing memory layout coordination...');

    try {
        // Test that all components use the correct memory regions
        const { ASSEMBLER_MEMORY_LAYOUT } = require('./two-pass-assembler');

        // Verify memory layout constants are accessible
        if (!ASSEMBLER_MEMORY_LAYOUT.PROGRAM_CODE) {
            console.error('Memory layout constants not accessible');
            return false;
        }

        // Test memory region validation
        const regions = [
            ASSEMBLER_MEMORY_LAYOUT.SOURCE_BUFFER,
            ASSEMBLER_MEMORY_LAYOUT.TOKEN_BUFFER,
            ASSEMBLER_MEMORY_LAYOUT.STRING_TABLE,
            ASSEMBLER_MEMORY_LAYOUT.SYMBOL_HASH,
            ASSEMBLER_MEMORY_LAYOUT.MACHINE_CODE
        ];

        for (const region of regions) {
            if (region.start >= region.end) {
                console.error(`Invalid memory region: ${JSON.stringify(region)}`);
                return false;
            }
        }

        console.log('Memory layout coordination validated');
        return true;

    } catch (error) {
        console.error('Memory layout coordination test failed:', error.message);
        return false;
    }
}

/**
 * Test component state management
 */
function testComponentStateManagement() {
    console.log('Testing component state management...');

    try {
        // Test that component states are properly managed
        const initialState = this.assembler.getState();

        if (initialState.state !== 0) { // READY state
            console.error('Initial assembler state incorrect');
            return false;
        }

        // Assemble a program and check state changes
        const result = this.assembler.assemble(INTEGRATION_TEST_PROGRAMS.lexicalIntegration);

        const finalState = this.assembler.getState();

        if (result.success && finalState.state !== 6) { // SUCCESS state
            console.error('Final assembler state should be SUCCESS');
            return false;
        }

        // Test component reset
        this.assembler.reset();
        const resetState = this.assembler.getState();

        if (resetState.state !== 0) {
            console.error('Assembler state not reset correctly');
            return false;
        }

        console.log('Component state management working correctly');
        return true;

    } catch (error) {
        console.error('Component state management test failed:', error.message);
        return false;
    }
}

// ============================================================================
// TEST REGISTRATION
// ============================================================================

/**
 * Register all tests
 * @param {IntegrationTestFramework} framework - Test framework instance
 */
function registerAllTests(framework) {
    framework.addTest('Lexical Analyzer Integration', testLexicalAnalyzerIntegration);
    framework.addTest('Symbol Table Integration', testSymbolTableIntegration);
    framework.addTest('Instruction Parser Integration', testInstructionParserIntegration);
    framework.addTest('Machine Code Generator Integration', testMachineCodeGeneratorIntegration);
    framework.addTest('Label Resolution Integration', testLabelResolutionIntegration);
    framework.addTest('Complete Component Pipeline', testCompleteComponentPipeline);
    framework.addTest('Component Error Coordination', testComponentErrorCoordination);
    framework.addTest('Memory Layout Coordination', testMemoryLayoutCoordination);
    framework.addTest('Component State Management', testComponentStateManagement);
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

/**
 * Run complete integration test suite
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 * @returns {Object} Test results
 */
function runCompleteIntegrationTestSuite(mmu, cpu) {
    const framework = new IntegrationTestFramework();
    framework.initialize(mmu, cpu);
    registerAllTests(framework);
    return framework.runAllTests();
}

/**
 * Demonstrate component integration
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 */
function demonstrateComponentIntegration(mmu, cpu) {
    console.log('=== COMPONENT INTEGRATION DEMONSTRATION ===');
    console.log('');

    const framework = new IntegrationTestFramework();
    framework.initialize(mmu, cpu);

    console.log('1. Testing individual component integration...');

    // Test each component
    const tests = [
        { name: 'Lexical Analyzer', test: testLexicalAnalyzerIntegration },
        { name: 'Symbol Table', test: testSymbolTableIntegration },
        { name: 'Instruction Parser', test: testInstructionParserIntegration },
        { name: 'Machine Code Generator', test: testMachineCodeGeneratorIntegration },
        { name: 'Label Resolution', test: testLabelResolutionIntegration }
    ];

    for (const componentTest of tests) {
        console.log(`   Testing ${componentTest.name}...`);

        try {
            const result = componentTest.test.call(framework);
            console.log(`   ${result ? '✓' : '✗'} ${componentTest.name} integration ${result ? 'successful' : 'failed'}`);
        } catch (error) {
            console.log(`   ✗ ${componentTest.name} integration error: ${error.message}`);
        }
    }

    console.log('');
    console.log('2. Testing complete pipeline...');

    try {
        const pipelineResult = testCompleteComponentPipeline.call(framework);
        console.log(`   ${pipelineResult ? '✓' : '✗'} Complete pipeline ${pipelineResult ? 'successful' : 'failed'}`);
    } catch (error) {
        console.log(`   ✗ Pipeline error: ${error.message}`);
    }

    console.log('');
    console.log('=== DEMONSTRATION COMPLETE ===');
}

// ============================================================================
// INTEGRATION TEST
// ============================================================================

/**
 * Integration test with system components
 */
function testIntegrationWithSystem() {
    console.log('=== SYSTEM INTEGRATION TEST ===');

    // This would test integration with the actual MMU and CPU
    // For now, just verify the components can be created and initialized

    console.log('System integration test placeholder - would test with actual system components');
    return true;
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        IntegrationTestFramework,
        INTEGRATION_TEST_PROGRAMS,
        runCompleteIntegrationTestSuite,
        demonstrateComponentIntegration,
        testIntegrationWithSystem
    };
}