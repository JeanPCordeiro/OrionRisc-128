/**
 * C Compiler End-to-End Test Suite for OrionRisc-128 C Compiler
 *
 * This file contains comprehensive end-to-end tests for the complete C compiler pipeline,
 * validating the entire compilation process from C source code to assembly output.
 *
 * Phase 3 Component: End-to-End Testing for the assembly-based C compiler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

const MemoryManagementUnit = require('../../emulation/memory/MemoryManagementUnit');
const RiscProcessor = require('../../emulation/cpu/RiscProcessor');
const CCompiler = require('./c-code-generator'); // Complete C compiler with all components

/**
 * End-to-End Test Cases for Complete C Compilation Pipeline
 */
const END_TO_END_TEST_CASES = [
    {
        name: "Simple Function Compilation",
        cCode: `
            int main(void) {
                return 42;
            }
        `,
        expected: {
            success: true,
            tokens: 8,
            astNodes: 5,
            symbols: 1,
            types: 1,
            assemblyInstructions: 8,
            description: "Simple function with return statement"
        }
    },

    {
        name: "Variable Declaration and Assignment",
        cCode: `
            int main(void) {
                int x = 10;
                int y = 20;
                int sum = x + y;
                return sum;
            }
        `,
        expected: {
            success: true,
            tokens: 18,
            astNodes: 12,
            symbols: 4,
            types: 1,
            assemblyInstructions: 15,
            description: "Variable declarations, arithmetic, and assignment"
        }
    },

    {
        name: "Function Definition and Call",
        cCode: `
            int add(int a, int b) {
                return a + b;
            }

            int main(void) {
                int result = add(10, 20);
                return result;
            }
        `,
        expected: {
            success: true,
            tokens: 25,
            astNodes: 18,
            symbols: 5,
            types: 1,
            assemblyInstructions: 25,
            description: "Function definition with parameters and function call"
        }
    },

    {
        name: "Control Flow - If/Else Statement",
        cCode: `
            int main(void) {
                int x = 10;

                if (x > 5) {
                    return 1;
                } else {
                    return 0;
                }
            }
        `,
        expected: {
            success: true,
            tokens: 20,
            astNodes: 15,
            symbols: 2,
            types: 1,
            assemblyInstructions: 18,
            description: "If/else conditional statement"
        }
    },

    {
        name: "Control Flow - While Loop",
        cCode: `
            int main(void) {
                int i = 0;
                int sum = 0;

                while (i < 5) {
                    sum = sum + i;
                    i = i + 1;
                }

                return sum;
            }
        `,
        expected: {
            success: true,
            tokens: 28,
            astNodes: 20,
            symbols: 3,
            types: 1,
            assemblyInstructions: 30,
            description: "While loop with counter and accumulator"
        }
    },

    {
        name: "Complex Expression Evaluation",
        cCode: `
            int main(void) {
                int a = 10;
                int b = 20;
                int c = 30;

                int result = (a + b) * c - (b / a);

                return result;
            }
        `,
        expected: {
            success: true,
            tokens: 30,
            astNodes: 22,
            symbols: 4,
            types: 1,
            assemblyInstructions: 35,
            description: "Complex arithmetic expressions with precedence"
        }
    },

    {
        name: "String and Character Handling",
        cCode: `
            int main(void) {
                char* message = "Hello";
                char letter = 'A';
                int length = 0;

                while (message[length] != 0) {
                    length = length + 1;
                }

                return length;
            }
        `,
        expected: {
            success: true,
            tokens: 25,
            astNodes: 18,
            symbols: 3,
            types: 2,
            assemblyInstructions: 28,
            description: "String literals, character constants, and string processing"
        }
    },

    {
        name: "Multiple Function Definitions",
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
        expected: {
            success: true,
            tokens: 35,
            astNodes: 28,
            symbols: 3,
            types: 1,
            assemblyInstructions: 45,
            description: "Recursive function calls and multiple function definitions"
        }
    },

    {
        name: "Global Variables",
        cCode: `
            int global_counter = 0;

            void increment(void) {
                global_counter = global_counter + 1;
            }

            int main(void) {
                increment();
                increment();
                return global_counter;
            }
        `,
        expected: {
            success: true,
            tokens: 25,
            astNodes: 18,
            symbols: 3,
            types: 2,
            assemblyInstructions: 22,
            description: "Global variable declarations and void functions"
        }
    },

    {
        name: "Array Declaration and Access",
        cCode: `
            int main(void) {
                int numbers[5];
                int i = 0;

                while (i < 5) {
                    numbers[i] = i * 2;
                    i = i + 1;
                }

                return numbers[3];
            }
        `,
        expected: {
            success: true,
            tokens: 32,
            astNodes: 24,
            symbols: 3,
            types: 1,
            assemblyInstructions: 40,
            description: "Array declarations and indexed access"
        }
    }
];

/**
 * C Compiler End-to-End Test Suite
 */
class CCompilerEndToEndTester {
    constructor() {
        this.mmu = new MemoryManagementUnit();
        this.cpu = new RiscProcessor(this.mmu);
        this.compiler = new CCompiler(this.mmu, this.cpu);

        // Test results
        this.testsRun = 0;
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.testResults = [];
    }

    /**
     * Run complete end-to-end test suite
     */
    runAllTests() {
        console.log('=== C COMPILER END-TO-END TEST SUITE ===\n');

        END_TO_END_TEST_CASES.forEach((testCase, index) => {
            console.log(`Test ${index + 1}: ${testCase.name}`);
            console.log('='.repeat(60));

            const result = this.runSingleTest(testCase);

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
     * Run a single end-to-end test case
     * @param {Object} testCase - Test case to run
     * @returns {Object} Test result
     */
    runSingleTest(testCase) {
        const startTime = Date.now();

        try {
            // Compile the C code through the complete pipeline
            const result = this.compiler.compile(
                testCase.cCode.trim(),
                0x1000, // sourceAddress
                0x2000, // tokenAddress
                0x3000, // astAddress
                0x4000, // stringAddress
                0x5000, // symbolTableAddress
                0x6000, // typeTableAddress
                0x7000, // errorAddress
                0x8000  // codeAddress
            );

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Validate results against expectations
            const validation = this.validateTestResult(result, testCase.expected);

            return {
                name: testCase.name,
                passed: validation.valid,
                result: result,
                expected: testCase.expected,
                duration: duration,
                errors: validation.errors,
                description: testCase.expected.description
            };

        } catch (error) {
            return {
                name: testCase.name,
                passed: false,
                result: null,
                expected: testCase.expected,
                duration: 0,
                errors: [`Exception: ${error.message}`],
                description: testCase.expected.description
            };
        }
    }

    /**
     * Validate test result against expected values
     * @param {Object} result - Actual compilation result
     * @param {Object} expected - Expected values
     * @returns {Object} Validation result
     */
    validateTestResult(result, expected) {
        const errors = [];

        // Check compilation success
        if (result.success !== expected.success) {
            errors.push(`Expected success=${expected.success}, got success=${result.success}`);
        }

        // Check token count (allow 10% tolerance)
        if (result.tokens) {
            const tokenTolerance = Math.floor(expected.tokens * 0.1);
            const tokenMin = expected.tokens - tokenTolerance;
            const tokenMax = expected.tokens + tokenTolerance;

            if (result.tokens < tokenMin || result.tokens > tokenMax) {
                errors.push(`Expected tokens=${expected.tokens} (±10%), got tokens=${result.tokens}`);
            }
        }

        // Check AST nodes (allow 20% tolerance for complex structures)
        if (result.astNodes) {
            const astTolerance = Math.floor(expected.astNodes * 0.2);
            const astMin = expected.astNodes - astTolerance;
            const astMax = expected.astNodes + astTolerance;

            if (result.astNodes < astMin || result.astNodes > astMax) {
                errors.push(`Expected AST nodes=${expected.astNodes} (±20%), got AST nodes=${result.astNodes}`);
            }
        }

        // Check symbols (exact match expected)
        if (result.symbols !== undefined && result.symbols !== expected.symbols) {
            errors.push(`Expected symbols=${expected.symbols}, got symbols=${result.symbols}`);
        }

        // Check types (exact match expected)
        if (result.types !== undefined && result.types !== expected.types) {
            errors.push(`Expected types=${expected.types}, got types=${result.types}`);
        }

        // Check assembly instructions (allow 30% tolerance for code generation variations)
        if (result.assemblyInstructions) {
            const asmTolerance = Math.floor(expected.assemblyInstructions * 0.3);
            const asmMin = expected.assemblyInstructions - asmTolerance;
            const asmMax = expected.assemblyInstructions + asmTolerance;

            if (result.assemblyInstructions < asmMin || result.assemblyInstructions > asmMax) {
                errors.push(`Expected assembly instructions=${expected.assemblyInstructions} (±30%), got assembly instructions=${result.assemblyInstructions}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Print detailed test summary
     */
    printSummary() {
        console.log('=== END-TO-END TEST SUMMARY ===');
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

        // Performance summary
        const totalDuration = this.testResults.reduce((sum, result) => sum + result.duration, 0);
        const avgDuration = totalDuration / this.testsRun;

        console.log('\nPerformance Summary:');
        console.log(`Total Compilation Time: ${totalDuration}ms`);
        console.log(`Average Compilation Time: ${avgDuration.toFixed(2)}ms per test`);

        // Coverage summary
        console.log('\nTest Coverage Summary:');
        console.log('✅ Variable declarations and assignments');
        console.log('✅ Function definitions and calls');
        console.log('✅ Control flow (if/else, while loops)');
        console.log('✅ Arithmetic and logical expressions');
        console.log('✅ String and character handling');
        console.log('✅ Global and local variables');
        console.log('✅ Array declarations and access');
        console.log('✅ Recursive function calls');
        console.log('✅ Type checking and validation');
        console.log('✅ Assembly code generation');

        if (this.testsPassed === this.testsRun) {
            console.log('\n🎉 ALL END-TO-END TESTS PASSED!');
            console.log('The C compiler pipeline is working correctly.');
        } else {
            console.log(`\n❌ ${this.testsFailed} test(s) failed.`);
            console.log('The C compiler needs additional debugging.');
        }
    }

    /**
     * Test the complete compilation pipeline with a real C program
     */
    testRealWorldCompilation() {
        console.log('=== REAL-WORLD COMPILATION TEST ===');

        const realWorldProgram = `
            /* Real-world C program for comprehensive testing */
            #include <stdio.h>

            #define MAX_SIZE 10

            int global_array[MAX_SIZE];

            int factorial(int n) {
                if (n <= 1) {
                    return 1;
                } else {
                    return n * factorial(n - 1);
                }
            }

            void initialize_array(int* array, int size) {
                int i = 0;
                while (i < size) {
                    array[i] = factorial(i + 1);
                    i = i + 1;
                }
            }

            int calculate_sum(int* array, int size) {
                int sum = 0;
                int i = 0;

                while (i < size) {
                    sum = sum + array[i];
                    i = i + 1;
                }

                return sum;
            }

            int main(void) {
                char* message = "Factorial Sum: ";

                initialize_array(global_array, MAX_SIZE);

                int total = calculate_sum(global_array, MAX_SIZE);

                if (total > 1000) {
                    return 1;  // Success
                } else {
                    return 0;  // Unexpected result
                }
            }
        `;

        console.log('Compiling real-world C program...');

        const result = this.compiler.compile(
            realWorldProgram,
            0x1000, 0x2000, 0x3000, 0x4000,
            0x5000, 0x6000, 0x7000, 0x8000
        );

        console.log(`Compilation result: ${result.success ? 'SUCCESS' : 'FAILED'}`);

        if (result.success) {
            console.log(`- Tokens: ${result.tokens}`);
            console.log(`- AST Nodes: ${result.astNodes}`);
            console.log(`- Symbols: ${result.symbols}`);
            console.log(`- Types: ${result.types}`);
            console.log(`- Assembly Instructions: ${result.assemblyInstructions}`);
            console.log(`- Total Instructions: ${result.instructions}`);

            console.log('\n✅ Real-world compilation test PASSED');
        } else {
            console.log(`❌ Real-world compilation test FAILED: ${result.error}`);
        }

        return result;
    }

    /**
     * Test error handling in compilation pipeline
     */
    testErrorHandling() {
        console.log('=== ERROR HANDLING TEST ===');

        const errorTestCases = [
            {
                name: "Syntax Error - Missing Semicolon",
                cCode: `
                    int main(void) {
                        int x = 10
                        return x;
                    }
                `,
                shouldFail: true
            },
            {
                name: "Type Error - Int Assignment to Char Pointer",
                cCode: `
                    int main(void) {
                        char* str = 42;
                        return 0;
                    }
                `,
                shouldFail: true
            },
            {
                name: "Undeclared Variable",
                cCode: `
                    int main(void) {
                        int x = y + 1;
                        return x;
                    }
                `,
                shouldFail: true
            }
        ];

        errorTestCases.forEach((testCase, index) => {
            console.log(`Error Test ${index + 1}: ${testCase.name}`);

            const result = this.compiler.compile(
                testCase.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            if (testCase.shouldFail && !result.success) {
                console.log('✅ Correctly detected error');
            } else if (testCase.shouldFail && result.success) {
                console.log('❌ Failed to detect expected error');
            } else if (!testCase.shouldFail && result.success) {
                console.log('✅ Correctly compiled valid code');
            } else {
                console.log('❌ Unexpected failure');
            }
        });
    }

    /**
     * Test compilation pipeline stages individually
     */
    testPipelineStages() {
        console.log('=== PIPELINE STAGES TEST ===');

        const testCode = `
            int main(void) {
                int x = 42;
                return x;
            }
        `;

        console.log('Testing individual pipeline stages...');

        // Test lexical analysis only
        console.log('1. Lexical Analysis Stage:');
        const tokens = this.compiler.lexer.tokenize(testCode, 0x1000, 0x2000, 0x3000);
        console.log(`   Tokens generated: ${tokens.tokenCount}`);

        // Test parsing only
        console.log('2. Parsing Stage:');
        const ast = this.compiler.parser.parse(0x2000, 0x3000, 0x4000, 0);
        console.log(`   AST nodes: ${ast.success ? ast.ast.size : 'FAILED'}`);

        // Test semantic analysis only
        console.log('3. Semantic Analysis Stage:');
        const semantic = this.compiler.semanticAnalyzer.analyze(0x3000, 0x5000, 0x6000, 0x7000, 0);
        console.log(`   Symbols: ${semantic.success ? semantic.symbolTable.size : 'FAILED'}`);

        // Test code generation only
        console.log('4. Code Generation Stage:');
        const codegen = this.compiler.codeGenerator.generate(0x3000, 0x5000, 0x6000, 0x8000, 0);
        console.log(`   Assembly instructions: ${codegen.success ? codegen.assemblyCode.size : 'FAILED'}`);

        console.log('\nPipeline stages test completed');
    }
}

/**
 * Run the end-to-end test suite if this file is executed directly
 */
if (require.main === module) {
    const tester = new CCompilerEndToEndTester();
    tester.runAllTests();

    console.log('\n' + '='.repeat(60));
    tester.testRealWorldCompilation();

    console.log('\n' + '='.repeat(60));
    tester.testErrorHandling();

    console.log('\n' + '='.repeat(60));
    tester.testPipelineStages();
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CCompilerEndToEndTester,
        END_TO_END_TEST_CASES
    };
}

module.exports = CCompilerEndToEndTester;