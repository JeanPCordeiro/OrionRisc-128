/**
 * C Language Features Test Suite for OrionRisc-128 C Compiler
 *
 * This file contains comprehensive tests for specific C language constructs and features,
 * validating variable declarations, function definitions, control structures, and expressions.
 *
 * Phase 3 Component: C Language Feature Testing for the assembly-based C compiler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

const MemoryManagementUnit = require('../../emulation/memory/MemoryManagementUnit');
const RiscProcessor = require('../../emulation/cpu/RiscProcessor');
const CCompiler = require('./c-code-generator');

/**
 * C Language Feature Test Cases
 */
const C_LANGUAGE_FEATURE_TESTS = [
    // Variable Declaration Tests
    {
        category: "Variable Declarations",
        name: "Simple Variable Declaration",
        cCode: `
            int main(void) {
                int x;
                return 0;
            }
        `,
        expected: {
            success: true,
            symbols: 2, // main + x
            description: "Basic variable declaration without initialization"
        }
    },

    {
        category: "Variable Declarations",
        name: "Variable Declaration with Initialization",
        cCode: `
            int main(void) {
                int x = 42;
                char c = 'A';
                return x;
            }
        `,
        expected: {
            success: true,
            symbols: 3, // main + x + c
            types: 2, // int + char
            description: "Variable declarations with initialization"
        }
    },

    {
        category: "Variable Declarations",
        name: "Multiple Variable Declarations",
        cCode: `
            int main(void) {
                int a, b, c;
                a = 1;
                b = 2;
                c = 3;
                return a + b + c;
            }
        `,
        expected: {
            success: true,
            symbols: 4, // main + a + b + c
            description: "Multiple variable declarations in single statement"
        }
    },

    {
        category: "Variable Declarations",
        name: "Array Declaration",
        cCode: `
            int main(void) {
                int arr[10];
                arr[0] = 42;
                return arr[0];
            }
        `,
        expected: {
            success: true,
            symbols: 2, // main + arr
            description: "Array variable declaration and access"
        }
    },

    // Function Definition Tests
    {
        category: "Function Definitions",
        name: "Simple Function Definition",
        cCode: `
            int func(void) {
                return 42;
            }

            int main(void) {
                return func();
            }
        `,
        expected: {
            success: true,
            symbols: 3, // main + func + func's return
            description: "Simple function definition and call"
        }
    },

    {
        category: "Function Definitions",
        name: "Function with Parameters",
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
            symbols: 5, // main + add + a + b + result
            description: "Function definition with parameters"
        }
    },

    {
        category: "Function Definitions",
        name: "Void Function",
        cCode: `
            void print_message(void) {
                // Function body
            }

            int main(void) {
                print_message();
                return 0;
            }
        `,
        expected: {
            success: true,
            symbols: 2, // main + print_message
            types: 2, // int + void
            description: "Void function definition and call"
        }
    },

    // Control Structure Tests
    {
        category: "Control Structures",
        name: "If Statement",
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
            symbols: 2, // main + x
            description: "If/else conditional statement"
        }
    },

    {
        category: "Control Structures",
        name: "While Loop",
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
            symbols: 3, // main + i + sum
            description: "While loop with counter and accumulator"
        }
    },

    {
        category: "Control Structures",
        name: "For Loop",
        cCode: `
            int main(void) {
                int sum = 0;

                for (int i = 0; i < 5; i = i + 1) {
                    sum = sum + i;
                }

                return sum;
            }
        `,
        expected: {
            success: true,
            symbols: 3, // main + sum + i
            description: "For loop with initialization, condition, and increment"
        }
    },

    // Expression Tests
    {
        category: "Expressions",
        name: "Arithmetic Expressions",
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
            symbols: 4, // main + a + b + c
            description: "Complex arithmetic expressions with precedence"
        }
    },

    {
        category: "Expressions",
        name: "Comparison Expressions",
        cCode: `
            int main(void) {
                int a = 10;
                int b = 20;

                if (a < b && a != 0 || b > 0) {
                    return 1;
                } else {
                    return 0;
                }
            }
        `,
        expected: {
            success: true,
            symbols: 3, // main + a + b
            description: "Comparison and logical expressions"
        }
    },

    {
        category: "Expressions",
        name: "Unary Expressions",
        cCode: `
            int main(void) {
                int x = 10;
                int y = -x;
                int z = !0;

                return y + z;
            }
        `,
        expected: {
            success: true,
            symbols: 4, // main + x + y + z
            description: "Unary operators (negation, logical not)"
        }
    },

    // Type Tests
    {
        category: "Types",
        name: "Character Type",
        cCode: `
            int main(void) {
                char c = 'A';
                char d = 66;

                return c + d;
            }
        `,
        expected: {
            success: true,
            symbols: 3, // main + c + d
            types: 1, // char
            description: "Character type usage and operations"
        }
    },

    {
        category: "Types",
        name: "String Literals",
        cCode: `
            int main(void) {
                char* message = "Hello, World!";
                char* greeting = "Hi";

                return message[0] + greeting[1];
            }
        `,
        expected: {
            success: true,
            symbols: 3, // main + message + greeting
            types: 1, // char pointer
            description: "String literal handling"
        }
    },

    // Advanced Feature Tests
    {
        category: "Advanced Features",
        name: "Recursive Function",
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
            symbols: 3, // main + factorial + n
            description: "Recursive function calls"
        }
    },

    {
        category: "Advanced Features",
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
            symbols: 3, // main + global_counter + increment
            types: 2, // int + void
            description: "Global variable declarations and access"
        }
    },

    {
        category: "Advanced Features",
        name: "Local Variable Scoping",
        cCode: `
            int main(void) {
                int x = 10;

                {
                    int y = 20;
                    x = x + y;
                }

                // y is out of scope here
                return x;
            }
        `,
        expected: {
            success: true,
            symbols: 3, // main + x + y
            description: "Local variable scoping with blocks"
        }
    }
];

/**
 * C Language Features Test Suite
 */
class CLanguageFeaturesTester {
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
     * Run complete C language features test suite
     */
    runAllTests() {
        console.log('=== C LANGUAGE FEATURES TEST SUITE ===\n');

        const categories = {};

        C_LANGUAGE_FEATURE_TESTS.forEach((testCase, index) => {
            // Group tests by category
            if (!categories[testCase.category]) {
                categories[testCase.category] = [];
            }
            categories[testCase.category].push(testCase);
        });

        // Run tests by category
        Object.entries(categories).forEach(([category, tests]) => {
            console.log(`${category} Tests`);
            console.log('='.repeat(60));

            tests.forEach((testCase, index) => {
                console.log(`Test ${index + 1}: ${testCase.name}`);

                const result = this.runFeatureTest(testCase);

                this.testsRun++;
                if (result.passed) {
                    this.testsPassed++;
                    console.log('   ✅ PASSED');
                } else {
                    this.testsFailed++;
                    console.log('   ❌ FAILED');
                }

                this.testResults.push(result);
            });

            console.log('');
        });

        this.printSummary();
    }

    /**
     * Run a single C language feature test
     * @param {Object} testCase - Feature test case to run
     * @returns {Object} Test result
     */
    runFeatureTest(testCase) {
        try {
            const result = this.compiler.compile(
                testCase.cCode.trim(),
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            // Validate against expected results
            const validation = this.validateFeatureTest(result, testCase.expected);

            return {
                name: testCase.name,
                category: testCase.category,
                passed: validation.valid,
                result: result,
                expected: testCase.expected,
                errors: validation.errors,
                description: testCase.expected.description
            };

        } catch (error) {
            return {
                name: testCase.name,
                category: testCase.category,
                passed: false,
                result: null,
                expected: testCase.expected,
                errors: [`Exception: ${error.message}`],
                description: testCase.expected.description
            };
        }
    }

    /**
     * Validate feature test result
     * @param {Object} result - Compilation result
     * @param {Object} expected - Expected values
     * @returns {Object} Validation result
     */
    validateFeatureTest(result, expected) {
        const errors = [];

        // Check compilation success
        if (result.success !== expected.success) {
            errors.push(`Expected success=${expected.success}, got success=${result.success}`);
        }

        // Check symbol count (allow some tolerance)
        if (result.symbols !== undefined) {
            const symbolTolerance = Math.max(1, Math.floor(expected.symbols * 0.2));
            const symbolMin = expected.symbols - symbolTolerance;
            const symbolMax = expected.symbols + symbolTolerance;

            if (result.symbols < symbolMin || result.symbols > symbolMax) {
                errors.push(`Expected symbols=${expected.symbols} (±${symbolTolerance}), got symbols=${result.symbols}`);
            }
        }

        // Check type count (exact match expected)
        if (result.types !== undefined && result.types !== expected.types) {
            errors.push(`Expected types=${expected.types}, got types=${result.types}`);
        }

        // Check that compilation produces reasonable output
        if (result.success) {
            if (!result.tokens || result.tokens === 0) {
                errors.push('No tokens generated for valid C code');
            }

            if (!result.astNodes || result.astNodes === 0) {
                errors.push('No AST nodes generated for valid C code');
            }

            if (!result.assemblyInstructions || result.assemblyInstructions === 0) {
                errors.push('No assembly instructions generated for valid C code');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Test specific C language constructs in detail
     */
    testDetailedConstructs() {
        console.log('=== DETAILED CONSTRUCT TESTS ===');

        const detailedTests = [
            {
                name: "Complex Control Flow Nesting",
                cCode: `
                    int main(void) {
                        int i = 0;
                        int sum = 0;

                        while (i < 10) {
                            if (i % 2 == 0) {
                                sum = sum + i;
                            } else {
                                if (i % 3 == 0) {
                                    sum = sum + i * 2;
                                }
                            }
                            i = i + 1;
                        }

                        return sum;
                    }
                `,
                description: "Nested if/else within while loop"
            },

            {
                name: "Function Pointer Simulation",
                cCode: `
                    int add(int a, int b) { return a + b; }
                    int multiply(int a, int b) { return a * b; }

                    int main(void) {
                        int (*operation)(int, int);

                        operation = &add;
                        int result1 = operation(10, 20);

                        operation = &multiply;
                        int result2 = operation(10, 20);

                        return result1 + result2;
                    }
                `,
                description: "Function pointer usage simulation"
            },

            {
                name: "Struct-like Data Handling",
                cCode: `
                    int main(void) {
                        // Simulate struct-like behavior with arrays
                        int person[3];  // name_ptr, age, active

                        person[1] = 25;    // age
                        person[2] = 1;     // active

                        if (person[2] == 1) {
                            return person[1];
                        } else {
                            return 0;
                        }
                    }
                `,
                description: "Struct-like data handling with arrays"
            }
        ];

        detailedTests.forEach((test, index) => {
            console.log(`Detailed Test ${index + 1}: ${test.name}`);
            console.log(`Description: ${test.description}`);

            const result = this.compiler.compile(
                test.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            if (result.success) {
                console.log(`   ✅ Compilation successful`);
                console.log(`      Tokens: ${result.tokens}`);
                console.log(`      AST Nodes: ${result.astNodes}`);
                console.log(`      Symbols: ${result.symbols}`);
                console.log(`      Assembly Instructions: ${result.assemblyInstructions}`);
            } else {
                console.log(`   ❌ Compilation failed: ${result.error}`);
            }

            console.log('');
        });
    }

    /**
     * Test C language edge cases and boundary conditions
     */
    testEdgeCases() {
        console.log('=== EDGE CASES AND BOUNDARY TESTS ===');

        const edgeCases = [
            {
                name: "Empty Function",
                cCode: `
                    void empty_func(void) {
                        // Empty function body
                    }

                    int main(void) {
                        empty_func();
                        return 0;
                    }
                `,
                description: "Function with empty body"
            },

            {
                name: "Single Expression Function",
                cCode: `
                    int single_expr(void) {
                        return 42;
                    }

                    int main(void) {
                        return single_expr();
                    }
                `,
                description: "Function with single return expression"
            },

            {
                name: "Maximum Identifier Length",
                cCode: `
                    int very_long_variable_name_that_should_be_handled = 42;

                    int main(void) {
                        int another_very_long_variable_name_for_testing = very_long_variable_name_that_should_be_handled;
                        return another_very_long_variable_name_for_testing;
                    }
                `,
                description: "Long identifier names"
            },

            {
                name: "Complex Nested Expressions",
                cCode: `
                    int main(void) {
                        int a = 2;
                        int b = 3;
                        int c = 4;

                        // Complex nested expression
                        int result = ((a * b) + c) / (a - 1) * (b + c);

                        return result;
                    }
                `,
                description: "Complex nested arithmetic expressions"
            }
        ];

        edgeCases.forEach((test, index) => {
            console.log(`Edge Case ${index + 1}: ${test.name}`);
            console.log(`Description: ${test.description}`);

            const result = this.compiler.compile(
                test.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            if (result.success) {
                console.log(`   ✅ Edge case handled successfully`);
                console.log(`      Tokens: ${result.tokens}`);
                console.log(`      AST Nodes: ${result.astNodes}`);
                console.log(`      Symbols: ${result.symbols}`);
            } else {
                console.log(`   ❌ Edge case failed: ${result.error}`);
            }

            console.log('');
        });
    }

    /**
     * Test C language feature combinations
     */
    testFeatureCombinations() {
        console.log('=== FEATURE COMBINATION TESTS ===');

        const combinationTests = [
            {
                name: "Functions + Arrays + Control Flow",
                cCode: `
                    int process_array(int arr[5]) {
                        int sum = 0;
                        int i = 0;

                        while (i < 5) {
                            if (arr[i] > 0) {
                                sum = sum + arr[i];
                            }
                            i = i + 1;
                        }

                        return sum;
                    }

                    int main(void) {
                        int data[5];
                        data[0] = 1;
                        data[1] = -2;
                        data[2] = 3;
                        data[3] = -4;
                        data[4] = 5;

                        int result = process_array(data);
                        return result;
                    }
                `,
                description: "Functions with array parameters and complex control flow"
            },

            {
                name: "Recursion + Global Variables + Local Variables",
                cCode: `
                    int call_count = 0;

                    int recursive_func(int n) {
                        call_count = call_count + 1;

                        if (n <= 1) {
                            return 1;
                        } else {
                            int local_result = recursive_func(n - 1);
                            return n * local_result;
                        }
                    }

                    int main(void) {
                        int result = recursive_func(4);
                        return call_count;  // Should be 4 calls
                    }
                `,
                description: "Recursive functions with global and local variables"
            }
        ];

        combinationTests.forEach((test, index) => {
            console.log(`Combination Test ${index + 1}: ${test.name}`);
            console.log(`Description: ${test.description}`);

            const result = this.compiler.compile(
                test.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            if (result.success) {
                console.log(`   ✅ Feature combination successful`);
                console.log(`      Tokens: ${result.tokens}`);
                console.log(`      AST Nodes: ${result.astNodes}`);
                console.log(`      Symbols: ${result.symbols}`);
                console.log(`      Assembly Instructions: ${result.assemblyInstructions}`);
            } else {
                console.log(`   ❌ Feature combination failed: ${result.error}`);
            }

            console.log('');
        });
    }

    /**
     * Print detailed test summary
     */
    printSummary() {
        console.log('=== C LANGUAGE FEATURES TEST SUMMARY ===');
        console.log(`Total Tests: ${this.testsRun}`);
        console.log(`Passed: ${this.testsPassed}`);
        console.log(`Failed: ${this.testsFailed}`);
        console.log(`Success Rate: ${((this.testsPassed / this.testsRun) * 100).toFixed(1)}%`);

        if (this.testsFailed > 0) {
            console.log('\nFailed Tests:');
            this.testResults.forEach((result, index) => {
                if (!result.passed) {
                    console.log(`  ${index + 1}. ${result.category}: ${result.name}`);
                    result.errors.forEach(error => {
                        console.log(`     - ${error}`);
                    });
                }
            });
        }

        // Feature coverage summary
        console.log('\nC Language Feature Coverage:');
        console.log('✅ Variable declarations (simple, initialized, multiple)');
        console.log('✅ Array declarations and access');
        console.log('✅ Function definitions (with/without parameters, void)');
        console.log('✅ Function calls and parameter passing');
        console.log('✅ Control structures (if/else, while, for)');
        console.log('✅ Arithmetic expressions (complex precedence)');
        console.log('✅ Comparison and logical expressions');
        console.log('✅ Unary expressions (negation, logical not)');
        console.log('✅ Character and string literals');
        console.log('✅ Global and local variable scoping');
        console.log('✅ Recursive function calls');
        console.log('✅ Type system (int, char, pointers)');

        if (this.testsPassed === this.testsRun) {
            console.log('\n🎉 ALL C LANGUAGE FEATURE TESTS PASSED!');
            console.log('C language feature support is comprehensive.');
        } else {
            console.log(`\n❌ ${this.testsFailed} C language feature test(s) failed.`);
            console.log('Some C language features need additional work.');
        }
    }
}

/**
 * Run the C language features test suite if this file is executed directly
 */
if (require.main === module) {
    const tester = new CLanguageFeaturesTester();
    tester.runAllTests();

    console.log('\n' + '='.repeat(70));
    tester.testDetailedConstructs();

    console.log('\n' + '='.repeat(70));
    tester.testEdgeCases();

    console.log('\n' + '='.repeat(70));
    tester.testFeatureCombinations();
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CLanguageFeaturesTester,
        C_LANGUAGE_FEATURE_TESTS
    };
}

module.exports = CLanguageFeaturesTester;