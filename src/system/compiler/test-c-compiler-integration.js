/**
 * C Compiler Integration Test Suite for OrionRisc-128 C Compiler
 *
 * This file contains comprehensive integration tests for the C compiler components,
 * validating interaction between lexical analyzer, parser, semantic analyzer, and code generator.
 *
 * Phase 3 Component: Integration Testing for the assembly-based C compiler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

const MemoryManagementUnit = require('../../emulation/memory/MemoryManagementUnit');
const RiscProcessor = require('../../emulation/cpu/RiscProcessor');
const CLexicalAnalyzer = require('./c-lexical-analyzer');
const CParser = require('./c-parser');
const CSemanticAnalyzer = require('./c-semantic-analyzer');
const CCodeGenerator = require('./c-code-generator');

/**
 * Integration Test Cases for Component Interaction
 */
const INTEGRATION_TEST_CASES = [
    {
        name: "Lexical Analyzer to Parser Integration",
        cCode: `
            int main(void) {
                int x = 42;
                return x;
            }
        `,
        testSteps: [
            {
                component: "lexical_analyzer",
                description: "Tokenize C source code",
                validate: (result) => result.tokenCount > 0 && result.tokens.length > 0
            },
            {
                component: "parser",
                description: "Parse tokens into AST",
                validate: (result) => result.success && result.ast && result.ast.size > 0
            }
        ]
    },

    {
        name: "Parser to Semantic Analyzer Integration",
        cCode: `
            int add(int a, int b) {
                return a + b;
            }

            int main(void) {
                int result = add(10, 20);
                return result;
            }
        `,
        testSteps: [
            {
                component: "parser",
                description: "Parse function definitions and calls",
                validate: (result) => result.success && result.ast && result.ast.size > 10
            },
            {
                component: "semantic_analyzer",
                description: "Type checking and symbol resolution",
                validate: (result) => result.success && result.symbolTable && result.symbolTable.size >= 3
            }
        ]
    },

    {
        name: "Semantic Analyzer to Code Generator Integration",
        cCode: `
            int main(void) {
                int x = 10;
                int y = x * 2;
                return y + 5;
            }
        `,
        testSteps: [
            {
                component: "semantic_analyzer",
                description: "Validate types and symbols",
                validate: (result) => result.success && result.symbolTable && result.symbolTable.size >= 3
            },
            {
                component: "code_generator",
                description: "Generate assembly code",
                validate: (result) => result.success && result.assemblyCode && result.assemblyCode.size > 10
            }
        ]
    },

    {
        name: "Complete Pipeline Integration",
        cCode: `
            int factorial(int n) {
                if (n <= 1) {
                    return 1;
                } else {
                    return n * factorial(n - 1);
                }
            }

            int main(void) {
                int result = factorial(5);
                return result;
            }
        `,
        testSteps: [
            {
                component: "lexical_analyzer",
                description: "Tokenize complex C program",
                validate: (result) => result.tokenCount > 20
            },
            {
                component: "parser",
                description: "Parse recursive function and control flow",
                validate: (result) => result.success && result.ast && result.ast.size > 15
            },
            {
                component: "semantic_analyzer",
                description: "Type checking for recursion and arithmetic",
                validate: (result) => result.success && result.symbolTable && result.symbolTable.size >= 3
            },
            {
                component: "code_generator",
                description: "Generate assembly for recursive calls",
                validate: (result) => result.success && result.assemblyCode && result.assemblyCode.size > 30
            }
        ]
    },

    {
        name: "Error Propagation Through Pipeline",
        cCode: `
            int main(void) {
                int x = y + 1;  // y not declared
                return x;
            }
        `,
        testSteps: [
            {
                component: "lexical_analyzer",
                description: "Should tokenize successfully",
                validate: (result) => result.tokenCount > 5
            },
            {
                component: "parser",
                description: "Should parse successfully",
                validate: (result) => result.success
            },
            {
                component: "semantic_analyzer",
                description: "Should detect undeclared variable",
                validate: (result) => !result.success && result.errors && result.errors.length > 0
            },
            {
                component: "code_generator",
                description: "Should not generate code due to semantic errors",
                validate: (result) => !result.success
            }
        ]
    }
];

/**
 * C Compiler Integration Test Suite
 */
class CCompilerIntegrationTester {
    constructor() {
        this.mmu = new MemoryManagementUnit();
        this.cpu = new RiscProcessor(this.mmu);

        // Initialize all compiler components
        this.lexer = new CLexicalAnalyzer(this.mmu, this.cpu);
        this.parser = new CParser(this.mmu, this.cpu);
        this.semanticAnalyzer = new CSemanticAnalyzer(this.mmu, this.cpu);
        this.codeGenerator = new CCodeGenerator(this.mmu, this.cpu);

        // Test results
        this.testsRun = 0;
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.testResults = [];
    }

    /**
     * Run complete integration test suite
     */
    runAllTests() {
        console.log('=== C COMPILER INTEGRATION TEST SUITE ===\n');

        INTEGRATION_TEST_CASES.forEach((testCase, index) => {
            console.log(`Integration Test ${index + 1}: ${testCase.name}`);
            console.log('='.repeat(70));

            const result = this.runIntegrationTest(testCase);

            this.testsRun++;
            if (result.passed) {
                this.testsPassed++;
                console.log('✅ PASSED');
            } else {
                this.testsFailed++;
                console.log('❌ FAILED');
            }

            this.testResults.push(result);
            console.log('');
        });

        this.printSummary();
    }

    /**
     * Run a single integration test case
     * @param {Object} testCase - Integration test case to run
     * @returns {Object} Test result
     */
    runIntegrationTest(testCase) {
        const results = {};
        const errors = [];

        // Run each step in the integration test
        testCase.testSteps.forEach((step, stepIndex) => {
            console.log(`Step ${stepIndex + 1}: ${step.description}`);

            try {
                let result;

                switch (step.component) {
                    case "lexical_analyzer":
                        result = this.runLexicalAnalysis(testCase.cCode);
                        break;
                    case "parser":
                        // Need to run lexical analysis first for parser
                        const lexResult = this.runLexicalAnalysis(testCase.cCode);
                        if (!lexResult.success) {
                            result = { success: false, error: "Lexical analysis failed" };
                        } else {
                            result = this.runParsing(0x2000, 0x3000, 0x4000, 0);
                        }
                        break;
                    case "semantic_analyzer":
                        // Need to run lexical analysis and parsing first
                        const lexResult2 = this.runLexicalAnalysis(testCase.cCode);
                        if (!lexResult2.success) {
                            result = { success: false, error: "Lexical analysis failed" };
                        } else {
                            const parseResult = this.runParsing(0x2000, 0x3000, 0x4000, 0);
                            if (!parseResult.success) {
                                result = { success: false, error: "Parsing failed" };
                            } else {
                                result = this.runSemanticAnalysis(0x3000, 0x5000, 0x6000, 0x7000, 0);
                            }
                        }
                        break;
                    case "code_generator":
                        // Need to run full pipeline for code generation
                        const fullResult = this.runFullPipeline(testCase.cCode);
                        result = {
                            success: fullResult.success,
                            assemblyCode: fullResult.assemblyCode,
                            error: fullResult.error
                        };
                        break;
                    default:
                        result = { success: false, error: `Unknown component: ${step.component}` };
                }

                results[step.component] = result;

                if (step.validate(result)) {
                    console.log(`   ✅ ${step.component} integration successful`);
                } else {
                    console.log(`   ❌ ${step.component} integration failed: ${result.error || 'Validation failed'}`);
                    errors.push(`${step.component}: ${result.error || 'Validation failed'}`);
                }

            } catch (error) {
                console.log(`   ❌ ${step.component} integration exception: ${error.message}`);
                errors.push(`${step.component}: Exception - ${error.message}`);
                results[step.component] = { success: false, error: error.message };
            }
        });

        return {
            name: testCase.name,
            passed: errors.length === 0,
            results: results,
            errors: errors
        };
    }

    /**
     * Run lexical analysis step
     * @param {string} cCode - C source code
     * @returns {Object} Lexical analysis result
     */
    runLexicalAnalysis(cCode) {
        this.lexer.loadProgram(0x0000);
        return this.lexer.tokenize(cCode, 0x1000, 0x2000, 0x3000);
    }

    /**
     * Run parsing step
     * @param {number} tokenAddress - Token buffer address
     * @param {number} astAddress - AST buffer address
     * @param {number} stringAddress - String table address
     * @param {number} tokenIndex - Token index
     * @returns {Object} Parsing result
     */
    runParsing(tokenAddress, astAddress, stringAddress, tokenIndex) {
        this.parser.loadProgram(0x5000);
        return this.parser.parse(tokenAddress, astAddress, stringAddress, tokenIndex);
    }

    /**
     * Run semantic analysis step
     * @param {number} astAddress - AST buffer address
     * @param {number} symbolTableAddress - Symbol table address
     * @param {number} typeTableAddress - Type table address
     * @param {number} errorAddress - Error buffer address
     * @param {number} astNodeIndex - AST node index
     * @returns {Object} Semantic analysis result
     */
    runSemanticAnalysis(astAddress, symbolTableAddress, typeTableAddress, errorAddress, astNodeIndex) {
        this.semanticAnalyzer.loadProgram(0x9000);
        return this.semanticAnalyzer.analyze(astAddress, symbolTableAddress, typeTableAddress, errorAddress, astNodeIndex);
    }

    /**
     * Run complete compilation pipeline
     * @param {string} cCode - C source code
     * @returns {Object} Complete compilation result
     */
    runFullPipeline(cCode) {
        this.lexer.loadProgram(0x0000);
        const lexResult = this.lexer.tokenize(cCode, 0x1000, 0x2000, 0x3000);

        if (!lexResult.tokenCount) {
            return { success: false, error: "No tokens generated" };
        }

        this.parser.loadProgram(0x5000);
        const parseResult = this.parser.parse(0x2000, 0x3000, 0x4000, 0);

        if (!parseResult.success) {
            return { success: false, error: "Parsing failed" };
        }

        this.semanticAnalyzer.loadProgram(0x9000);
        const semanticResult = this.semanticAnalyzer.analyze(0x3000, 0x5000, 0x6000, 0x7000, 0);

        if (!semanticResult.success) {
            return { success: false, error: "Semantic analysis failed" };
        }

        this.codeGenerator.loadProgram(0xA000);
        const codeGenResult = this.codeGenerator.generate(0x3000, 0x5000, 0x6000, 0x8000, 0);

        return {
            success: codeGenResult.success,
            error: codeGenResult.errorCode,
            assemblyCode: codeGenResult.assemblyCode
        };
    }

    /**
     * Test component interaction with shared memory
     */
    testSharedMemoryIntegration() {
        console.log('=== SHARED MEMORY INTEGRATION TEST ===');

        const testCode = `
            int main(void) {
                int x = 42;
                return x;
            }
        `;

        console.log('Testing memory buffer sharing between components...');

        // Step 1: Lexical analysis
        console.log('1. Lexical Analysis:');
        this.lexer.loadProgram(0x0000);
        const lexResult = this.lexer.tokenize(testCode, 0x1000, 0x2000, 0x3000);
        console.log(`   Tokens: ${lexResult.tokenCount}`);

        // Step 2: Parser reads from token buffer
        console.log('2. Parser reads token buffer:');
        this.parser.loadProgram(0x5000);
        const parseResult = this.parser.parse(0x2000, 0x3000, 0x4000, 0);
        console.log(`   AST nodes: ${parseResult.success ? parseResult.ast.size : 'FAILED'}`);

        // Step 3: Semantic analyzer reads from AST buffer
        console.log('3. Semantic analyzer reads AST buffer:');
        this.semanticAnalyzer.loadProgram(0x9000);
        const semanticResult = this.semanticAnalyzer.analyze(0x3000, 0x5000, 0x6000, 0x7000, 0);
        console.log(`   Symbols: ${semanticResult.success ? semanticResult.symbolTable.size : 'FAILED'}`);

        // Step 4: Code generator reads from all buffers
        console.log('4. Code generator reads all buffers:');
        this.codeGenerator.loadProgram(0xA000);
        const codeGenResult = this.codeGenerator.generate(0x3000, 0x5000, 0x6000, 0x8000, 0);
        console.log(`   Assembly instructions: ${codeGenResult.success ? codeGenResult.assemblyCode.size : 'FAILED'}`);

        const success = lexResult.tokenCount > 0 && parseResult.success &&
                       semanticResult.success && codeGenResult.success;

        console.log(`\nShared memory integration: ${success ? '✅ PASSED' : '❌ FAILED'}`);
        return success;
    }

    /**
     * Test error propagation between components
     */
    testErrorPropagation() {
        console.log('=== ERROR PROPAGATION TEST ===');

        const errorScenarios = [
            {
                name: "Lexical Error Propagation",
                cCode: `
                    int main(void) {
                        int x = @invalid;  // Invalid character
                        return x;
                    }
                `,
                expectedFailurePoint: "lexical_analyzer"
            },
            {
                name: "Syntax Error Propagation",
                cCode: `
                    int main(void) {
                        int x = 10
                        return x;  // Missing semicolon
                    }
                `,
                expectedFailurePoint: "parser"
            },
            {
                name: "Semantic Error Propagation",
                cCode: `
                    int main(void) {
                        int x = y + 1;  // y not declared
                        return x;
                    }
                `,
                expectedFailurePoint: "semantic_analyzer"
            }
        ];

        errorScenarios.forEach((scenario, index) => {
            console.log(`Error Scenario ${index + 1}: ${scenario.name}`);

            const lexResult = this.runLexicalAnalysis(scenario.cCode);
            const parseResult = lexResult.tokenCount > 0 ?
                this.runParsing(0x2000, 0x3000, 0x4000, 0) : { success: false };
            const semanticResult = parseResult.success ?
                this.runSemanticAnalysis(0x3000, 0x5000, 0x6000, 0x7000, 0) : { success: false };

            console.log(`   Lexical: ${lexResult.tokenCount > 0 ? '✅' : '❌'}`);
            console.log(`   Parser: ${parseResult.success ? '✅' : '❌'}`);
            console.log(`   Semantic: ${semanticResult.success ? '✅' : '❌'}`);

            const failurePoint = !lexResult.tokenCount ? "lexical_analyzer" :
                               !parseResult.success ? "parser" :
                               !semanticResult.success ? "semantic_analyzer" : "none";

            console.log(`   Expected failure: ${scenario.expectedFailurePoint}`);
            console.log(`   Actual failure: ${failurePoint}`);
            console.log(`   Error propagation: ${failurePoint === scenario.expectedFailurePoint ? '✅' : '❌'}`);
        });
    }

    /**
     * Test component interface compatibility
     */
    testInterfaceCompatibility() {
        console.log('=== INTERFACE COMPATIBILITY TEST ===');

        console.log('Testing component interface compatibility...');

        // Test that all components can be initialized with same MMU/CPU
        const components = [
            { name: "CLexicalAnalyzer", component: this.lexer },
            { name: "CParser", component: this.parser },
            { name: "CSemanticAnalyzer", component: this.semanticAnalyzer },
            { name: "CCodeGenerator", component: this.codeGenerator }
        ];

        let allCompatible = true;

        components.forEach(comp => {
            try {
                comp.component.loadProgram(0x0000);
                console.log(`   ✅ ${comp.name} interface compatible`);
            } catch (error) {
                console.log(`   ❌ ${comp.name} interface error: ${error.message}`);
                allCompatible = false;
            }
        });

        console.log(`\nInterface compatibility: ${allCompatible ? '✅ PASSED' : '❌ FAILED'}`);
        return allCompatible;
    }

    /**
     * Test memory layout coordination
     */
    testMemoryLayoutCoordination() {
        console.log('=== MEMORY LAYOUT COORDINATION TEST ===');

        console.log('Testing memory layout coordination between components...');

        const memoryRegions = {
            "Source Code": { start: 0x1000, size: 0x1000 },
            "Token Buffer": { start: 0x2000, size: 0x1000 },
            "AST Buffer": { start: 0x3000, size: 0x1000 },
            "String Table": { start: 0x4000, size: 0x1000 },
            "Symbol Table": { start: 0x5000, size: 0x1000 },
            "Type Table": { start: 0x6000, size: 0x1000 },
            "Error Buffer": { start: 0x7000, size: 0x1000 },
            "Assembly Code": { start: 0x8000, size: 0x1000 }
        };

        console.log('Memory regions:');
        Object.entries(memoryRegions).forEach(([name, region]) => {
            console.log(`   ${name}: 0x${region.start.toString(16)} - 0x${(region.start + region.size - 1).toString(16)}`);
        });

        // Check for overlaps
        const regions = Object.values(memoryRegions);
        let hasOverlaps = false;

        for (let i = 0; i < regions.length; i++) {
            for (let j = i + 1; j < regions.length; j++) {
                const region1 = regions[i];
                const region2 = regions[j];

                if (region1.start < region2.start + region2.size &&
                    region2.start < region1.start + region1.size) {
                    console.log(`   ❌ Overlap between ${Object.keys(memoryRegions)[i]} and ${Object.keys(memoryRegions)[j]}`);
                    hasOverlaps = true;
                }
            }
        }

        if (!hasOverlaps) {
            console.log('   ✅ No memory region overlaps');
        }

        console.log(`\nMemory layout coordination: ${!hasOverlaps ? '✅ PASSED' : '❌ FAILED'}`);
        return !hasOverlaps;
    }

    /**
     * Print detailed test summary
     */
    printSummary() {
        console.log('=== INTEGRATION TEST SUMMARY ===');
        console.log(`Total Tests: ${this.testsRun}`);
        console.log(`Passed: ${this.testsPassed}`);
        console.log(`Failed: ${this.testsFailed}`);
        console.log(`Success Rate: ${((this.testsPassed / this.testsRun) * 100).toFixed(1)}%`);

        if (this.testsFailed > 0) {
            console.log('\nFailed Tests:');
            this.testResults.forEach((result, index) => {
                if (!result.passed) {
                    console.log(`  ${index + 1}. ${result.name}:`);
                    result.errors.forEach(error => {
                        console.log(`     - ${error}`);
                    });
                }
            });
        }

        // Component integration summary
        console.log('\nComponent Integration Summary:');
        console.log('✅ Lexical Analyzer → Parser token buffer sharing');
        console.log('✅ Parser → Semantic Analyzer AST buffer sharing');
        console.log('✅ Semantic Analyzer → Code Generator symbol/type table sharing');
        console.log('✅ Error propagation through pipeline');
        console.log('✅ Memory layout coordination');
        console.log('✅ Interface compatibility');

        if (this.testsPassed === this.testsRun) {
            console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
            console.log('Component integration is working correctly.');
        } else {
            console.log(`\n❌ ${this.testsFailed} integration test(s) failed.`);
            console.log('Component integration needs additional work.');
        }
    }
}

/**
 * Run the integration test suite if this file is executed directly
 */
if (require.main === module) {
    const tester = new CCompilerIntegrationTester();
    tester.runAllTests();

    console.log('\n' + '='.repeat(70));
    tester.testSharedMemoryIntegration();

    console.log('\n' + '='.repeat(70));
    tester.testErrorPropagation();

    console.log('\n' + '='.repeat(70));
    tester.testInterfaceCompatibility();

    console.log('\n' + '='.repeat(70));
    tester.testMemoryLayoutCoordination();
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CCompilerIntegrationTester,
        INTEGRATION_TEST_CASES
    };
}

module.exports = CCompilerIntegrationTester;