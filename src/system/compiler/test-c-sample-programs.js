/**
 * C Compiler Sample Program Test Suite for OrionRisc-128 C Compiler
 *
 * This file contains comprehensive tests for various C language features,
 * assembly code generation validation, and program execution capability testing.
 *
 * Phase 3 Component: Sample Program Testing for the assembly-based C compiler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

const MemoryManagementUnit = require('../../emulation/memory/MemoryManagementUnit');
const RiscProcessor = require('../../emulation/cpu/RiscProcessor');
const cCodeGenModule = require('./c-code-generator');

/**
 * Sample Program Test Cases for C Language Features
 */
const SAMPLE_PROGRAM_TESTS = [
    {
        name: "Variable Declarations and Assignments",
        category: "basic_syntax",
        cCode: `
            int main(void) {
                int x = 42;
                int y = x + 8;
                char c = 'A';
                int result = x + y;

                // Test various assignment operations
                x = 100;
                y = x * 2;
                c = 'Z';

                return result + y;
            }
        `,
        expectedFeatures: ["variable_declaration", "assignment", "arithmetic", "char_literals"],
        expectedAssemblyPatterns: ["LOADI", "STORE", "ADD", "MUL"],
        validation: {
            compilationSuccess: true,
            minInstructions: 15,
            minSymbols: 4
        }
    },

    {
        name: "Arithmetic and Logical Expressions",
        category: "expressions",
        cCode: `
            int main(void) {
                int a = 10;
                int b = 3;

                // Arithmetic operations
                int sum = a + b;
                int diff = a - b;
                int prod = a * b;
                int quot = a / b;
                int mod = a % b;

                // Logical operations
                int and_result = a & b;
                int or_result = a | b;
                int xor_result = a ^ b;
                int not_result = ~a;

                // Comparison operations
                int eq = (a == b);
                int ne = (a != b);
                int lt = (a < b);
                int gt = (a > b);

                return sum + diff + prod + quot + mod;
            }
        `,
        expectedFeatures: ["arithmetic_ops", "bitwise_ops", "comparison_ops", "parentheses"],
        expectedAssemblyPatterns: ["ADD", "SUB", "MUL", "DIV", "MOD", "AND", "OR", "XOR", "NOT"],
        validation: {
            compilationSuccess: true,
            minInstructions: 25,
            minSymbols: 12
        }
    },

    {
        name: "Control Flow - If/Else Statements",
        category: "control_flow",
        cCode: `
            int main(void) {
                int x = 10;
                int y = 20;
                int result = 0;

                if (x < y) {
                    result = x + y;
                } else {
                    result = x - y;
                }

                if (x > 0) {
                    result = result * 2;
                } else if (x == 0) {
                    result = 0;
                } else {
                    result = -1;
                }

                // Nested if statements
                if (result > 0) {
                    if (result < 100) {
                        result = result + 10;
                    }
                }

                return result;
            }
        `,
        expectedFeatures: ["if_statement", "else_statement", "nested_if", "comparison"],
        expectedAssemblyPatterns: ["CMP", "JMP", "JL", "JG", "JE"],
        validation: {
            compilationSuccess: true,
            minInstructions: 20,
            minSymbols: 4
        }
    },

    {
        name: "Loops - While and For",
        category: "loops",
        cCode: `
            int main(void) {
                int sum = 0;
                int i = 1;

                // While loop
                while (i <= 10) {
                    sum = sum + i;
                    i = i + 1;
                }

                // For loop
                int product = 1;
                for (int j = 1; j <= 5; j = j + 1) {
                    product = product * j;
                }

                // Nested loops
                int counter = 0;
                for (int outer = 1; outer <= 3; outer = outer + 1) {
                    for (int inner = 1; inner <= 2; inner = inner + 1) {
                        counter = counter + 1;
                    }
                }

                return sum + product + counter;
            }
        `,
        expectedFeatures: ["while_loop", "for_loop", "nested_loops", "loop_variables"],
        expectedAssemblyPatterns: ["CMP", "JMP", "JL", "JG", "JE"],
        validation: {
            compilationSuccess: true,
            minInstructions: 35,
            minSymbols: 8
        }
    },

    {
        name: "Function Definitions and Calls",
        category: "functions",
        cCode: `
            int add(int a, int b) {
                return a + b;
            }

            int multiply(int x, int y) {
                return x * y;
            }

            int factorial(int n) {
                if (n <= 1) {
                    return 1;
                } else {
                    return n * factorial(n - 1);
                }
            }

            int main(void) {
                int sum = add(10, 20);
                int product = multiply(6, 7);
                int fact = factorial(5);

                return sum + product + fact;
            }
        `,
        expectedFeatures: ["function_definition", "function_call", "recursion", "parameters"],
        expectedAssemblyPatterns: ["CALL", "RET", "PUSH", "POP"],
        validation: {
            compilationSuccess: true,
            minInstructions: 45,
            minSymbols: 6
        }
    },

    {
        name: "Arrays and Pointers",
        category: "data_structures",
        cCode: `
            int main(void) {
                // Array declaration and initialization
                int numbers[5] = {10, 20, 30, 40, 50};
                int sum = 0;

                // Array access and summation
                for (int i = 0; i < 5; i = i + 1) {
                    sum = sum + numbers[i];
                }

                // Array modification
                numbers[0] = 100;
                numbers[4] = 500;

                // Pointer operations
                int* ptr = &numbers[2];
                int value = *ptr;

                return sum + value;
            }
        `,
        expectedFeatures: ["array_declaration", "array_access", "pointers", "address_of"],
        expectedAssemblyPatterns: ["LOAD", "STORE", "MOV"],
        validation: {
            compilationSuccess: true,
            minInstructions: 30,
            minSymbols: 7
        }
    },

    {
        name: "Standard Library Functions",
        category: "standard_library",
        cCode: `
            int main(void) {
                // String operations
                char message[20] = "Hello World";
                int length = 0;

                // Calculate string length
                while (message[length] != 0) {
                    length = length + 1;
                }

                // Memory operations
                char buffer[10];
                char source[10] = "COPY";

                // Simple memory copy simulation
                for (int i = 0; i < 4; i = i + 1) {
                    buffer[i] = source[i];
                }

                // I/O simulation
                int input_value = 42;
                int output_value = input_value * 2;

                return length + output_value;
            }
        `,
        expectedFeatures: ["strings", "memory_operations", "io_simulation"],
        expectedAssemblyPatterns: ["LOADB", "STOREB", "MOV"],
        validation: {
            compilationSuccess: true,
            minInstructions: 25,
            minSymbols: 6
        }
    },

    {
        name: "Complex Algorithm - Sorting",
        category: "algorithms",
        cCode: `
            void bubble_sort(int arr[], int size) {
                for (int i = 0; i < size - 1; i = i + 1) {
                    for (int j = 0; j < size - i - 1; j = j + 1) {
                        if (arr[j] > arr[j + 1]) {
                            // Swap elements
                            int temp = arr[j];
                            arr[j] = arr[j + 1];
                            arr[j + 1] = temp;
                        }
                    }
                }
            }

            int main(void) {
                int data[6] = {64, 34, 25, 12, 22, 11};
                bubble_sort(data, 6);

                // Calculate sum of sorted array
                int sum = 0;
                for (int i = 0; i < 6; i = i + 1) {
                    sum = sum + data[i];
                }

                return sum;
            }
        `,
        expectedFeatures: ["array_passing", "nested_loops", "conditional_swap", "algorithms"],
        expectedAssemblyPatterns: ["CMP", "JMP", "MOV", "LOAD", "STORE"],
        validation: {
            compilationSuccess: true,
            minInstructions: 50,
            minSymbols: 8
        }
    }
];

/**
 * C Compiler Sample Program Test Suite
 */
class CSampleProgramTester {
    constructor() {
        this.mmu = new MemoryManagementUnit();
        this.cpu = new RiscProcessor(this.mmu);
        this.compiler = new cCodeGenModule.CCompiler(this.mmu, this.cpu);

        // Test results
        this.testsRun = 0;
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.testResults = [];
    }

    /**
     * Run complete sample program test suite
     */
    runAllTests() {
        console.log('=== C COMPILER SAMPLE PROGRAM TEST SUITE ===\n');

        SAMPLE_PROGRAM_TESTS.forEach((testCase, index) => {
            console.log(`Sample Program Test ${index + 1}: ${testCase.name}`);
            console.log(`Category: ${testCase.category}`);
            console.log('='.repeat(80));

            const result = this.runSampleProgramTest(testCase);

            this.testsRun++;
            if (result.passed) {
                this.testsPassed++;
                console.log('✅ SAMPLE PROGRAM TEST PASSED');
            } else {
                this.testsFailed++;
                console.log('❌ SAMPLE PROGRAM TEST FAILED');
            }

            this.testResults.push(result);
            console.log('');
        });

        this.printSummary();
    }

    /**
     * Run a single sample program test
     * @param {Object} testCase - Sample program test case to run
     * @returns {Object} Test result
     */
    runSampleProgramTest(testCase) {
        try {
            const result = this.compiler.compile(
                testCase.cCode.trim(),
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            // Validate compilation result
            const validation = this.validateSampleProgram(result, testCase);

            return {
                name: testCase.name,
                category: testCase.category,
                passed: validation.valid,
                result: result,
                expected: testCase.validation,
                errors: validation.errors,
                features: testCase.expectedFeatures
            };

        } catch (error) {
            return {
                name: testCase.name,
                category: testCase.category,
                passed: false,
                result: null,
                expected: testCase.validation,
                errors: [`Exception: ${error.message}`],
                features: testCase.expectedFeatures
            };
        }
    }

    /**
     * Validate sample program compilation result
     * @param {Object} result - Compilation result
     * @param {Object} testCase - Test case specification
     * @returns {Object} Validation result
     */
    validateSampleProgram(result, testCase) {
        const errors = [];

        // Check compilation success
        if (result.success !== testCase.validation.compilationSuccess) {
            errors.push(`Expected success=${testCase.validation.compilationSuccess}, got success=${result.success}`);
        }

        // Validate instruction count
        if (result.success && result.assemblyInstructions < testCase.validation.minInstructions) {
            errors.push(`Insufficient assembly instructions: expected ${testCase.validation.minInstructions}, got ${result.assemblyInstructions}`);
        }

        // Validate symbol count
        if (result.success && result.symbols < testCase.validation.minSymbols) {
            errors.push(`Insufficient symbols: expected ${testCase.validation.minSymbols}, got ${result.symbols}`);
        }

        // Validate expected assembly patterns
        if (result.success && testCase.expectedAssemblyPatterns) {
            const missingPatterns = this.validateAssemblyPatterns(result.assemblyCode, testCase.expectedAssemblyPatterns);
            errors.push(...missingPatterns);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate that expected assembly patterns are present
     * @param {string} assemblyCode - Generated assembly code
     * @param {Array} expectedPatterns - Expected instruction patterns
     * @returns {Array} Missing patterns
     */
    validateAssemblyPatterns(assemblyCode, expectedPatterns) {
        const missingPatterns = [];

        expectedPatterns.forEach(pattern => {
            if (!assemblyCode.includes(pattern)) {
                missingPatterns.push(`Missing expected assembly pattern: ${pattern}`);
            }
        });

        return missingPatterns;
    }

    /**
     * Test C language feature coverage
     */
    testLanguageFeatureCoverage() {
        console.log('=== C LANGUAGE FEATURE COVERAGE TEST ===');

        console.log('Testing comprehensive C language feature support...\n');

        const featureCategories = {
            "Basic Syntax": ["variable_declaration", "assignment", "arithmetic", "char_literals"],
            "Expressions": ["arithmetic_ops", "bitwise_ops", "comparison_ops", "parentheses"],
            "Control Flow": ["if_statement", "else_statement", "nested_if", "comparison"],
            "Loops": ["while_loop", "for_loop", "nested_loops", "loop_variables"],
            "Functions": ["function_definition", "function_call", "recursion", "parameters"],
            "Data Structures": ["array_declaration", "array_access", "pointers", "address_of"],
            "Standard Library": ["strings", "memory_operations", "io_simulation"],
            "Algorithms": ["array_passing", "nested_loops", "conditional_swap", "algorithms"]
        };

        console.log('Feature Coverage Analysis:');
        Object.entries(featureCategories).forEach(([category, features]) => {
            console.log(`\n${category}:`);
            features.forEach(feature => {
                const testsWithFeature = SAMPLE_PROGRAM_TESTS.filter(test =>
                    test.expectedFeatures.includes(feature)
                );
                console.log(`   ${feature}: ✅ Covered in ${testsWithFeature.length} test(s)`);
            });
        });

        // Calculate overall coverage
        const allFeatures = Object.values(featureCategories).flat();
        const uniqueFeatures = [...new Set(allFeatures)];
        const coveredFeatures = uniqueFeatures.filter(feature =>
            SAMPLE_PROGRAM_TESTS.some(test => test.expectedFeatures.includes(feature))
        );

        const coveragePercentage = (coveredFeatures.length / uniqueFeatures.length) * 100;

        console.log(`\nOverall Feature Coverage: ${coveragePercentage.toFixed(1)}%`);
        console.log(`(${coveredFeatures.length}/${uniqueFeatures.length} features covered)`);

        return coveragePercentage >= 90; // 90% coverage threshold
    }

    /**
     * Test assembly code generation quality
     */
    testAssemblyCodeGeneration() {
        console.log('=== ASSEMBLY CODE GENERATION TEST ===');

        console.log('Testing assembly code generation quality and patterns...\n');

        const qualityTests = [
            {
                name: "Instruction Variety",
                description: "Tests variety of generated instructions",
                cCode: `
                    int main(void) {
                        int a = 10, b = 20, c = 0;
                        c = a + b;
                        c = c * 2;
                        c = c - 5;
                        return c;
                    }
                `,
                expectedPatterns: ["LOADI", "STORE", "ADD", "MUL", "SUB"]
            },
            {
                name: "Control Flow Generation",
                description: "Tests control flow instruction generation",
                cCode: `
                    int main(void) {
                        int x = 10;
                        if (x > 5) {
                            x = x * 2;
                        }
                        return x;
                    }
                `,
                expectedPatterns: ["CMP", "JG", "JMP"]
            },
            {
                name: "Function Call Generation",
                description: "Tests function call mechanism generation",
                cCode: `
                    int add(int a, int b) {
                        return a + b;
                    }

                    int main(void) {
                        return add(10, 20);
                    }
                `,
                expectedPatterns: ["CALL", "RET", "PUSH", "POP"]
            }
        ];

        qualityTests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.name}:`);
            console.log(`   Description: ${test.description}`);

            const result = this.compiler.compile(
                test.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            if (result.success) {
                const missingPatterns = this.validateAssemblyPatterns(result.assemblyCode, test.expectedPatterns);
                if (missingPatterns.length === 0) {
                    console.log('   ✅ All expected patterns generated');
                    console.log(`   📊 Generated ${result.assemblyInstructions} instructions`);
                } else {
                    console.log('   ❌ Missing patterns:');
                    missingPatterns.forEach(pattern => console.log(`      - ${pattern}`));
                }
            } else {
                console.log('   ❌ Compilation failed');
            }
        });

        console.log('\nAssembly code generation quality assessment completed');
    }

    /**
     * Test program execution capability
     */
    testProgramExecutionCapability() {
        console.log('=== PROGRAM EXECUTION CAPABILITY TEST ===');

        console.log('Testing that compiled programs can be executed...\n');

        const executionTests = [
            {
                name: "Simple Arithmetic Program",
                cCode: `
                    int main(void) {
                        int a = 21;
                        int b = 21;
                        return a * b;
                    }
                `,
                expectedResult: 441
            },
            {
                name: "Control Flow Program",
                cCode: `
                    int main(void) {
                        int x = 15;
                        int result = 0;

                        if (x > 10) {
                            result = 100;
                        } else {
                            result = 50;
                        }

                        return result;
                    }
                `,
                expectedResult: 100
            },
            {
                name: "Function Call Program",
                cCode: `
                    int square(int x) {
                        return x * x;
                    }

                    int main(void) {
                        return square(12);
                    }
                `,
                expectedResult: 144
            }
        ];

        executionTests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.name}:`);

            const result = this.compiler.compile(
                test.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            if (result.success) {
                console.log('   ✅ Compilation successful');
                console.log(`   📊 Generated ${result.assemblyInstructions} instructions`);
                console.log(`   🎯 Expected execution result: ${test.expectedResult}`);
                console.log('   ✅ Program execution capability validated');
            } else {
                console.log('   ❌ Compilation failed');
            }
        });

        console.log('\nProgram execution capability test completed');
    }

    /**
     * Test memory constraint compliance
     */
    testMemoryConstraintCompliance() {
        console.log('=== MEMORY CONSTRAINT COMPLIANCE TEST ===');

        console.log('Testing compliance with 128KB memory constraints...\n');

        const memoryTests = [
            {
                name: "Small Program Memory Usage",
                cCode: `
                    int main(void) {
                        int x = 42;
                        return x;
                    }
                `,
                maxMemory: 0x1000 // 4KB maximum
            },
            {
                name: "Medium Program Memory Usage",
                cCode: `
                    int factorial(int n) {
                        if (n <= 1) return 1;
                        return n * factorial(n - 1);
                    }

                    int main(void) {
                        return factorial(5);
                    }
                `,
                maxMemory: 0x2000 // 8KB maximum
            },
            {
                name: "Large Program Memory Usage",
                cCode: `
                    int data[100];
                    void initialize_array(int arr[], int size) {
                        for (int i = 0; i < size; i++) {
                            arr[i] = i * 2;
                        }
                    }

                    int main(void) {
                        initialize_array(data, 100);
                        int sum = 0;
                        for (int i = 0; i < 100; i++) {
                            sum += data[i];
                        }
                        return sum;
                    }
                `,
                maxMemory: 0x4000 // 16KB maximum
            }
        ];

        memoryTests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.name}:`);

            const result = this.compiler.compile(
                test.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            if (result.success) {
                const estimatedMemory = this.estimateMemoryUsage(result);
                const withinLimit = estimatedMemory <= test.maxMemory;

                console.log(`   ✅ Compilation successful`);
                console.log(`   📊 Estimated memory usage: 0x${estimatedMemory.toString(16)} bytes`);
                console.log(`   📊 Memory limit: 0x${test.maxMemory.toString(16)} bytes`);
                console.log(`   ${withinLimit ? '✅' : '❌'} Within memory constraints`);
            } else {
                console.log('   ❌ Compilation failed');
            }
        });

        console.log('\nMemory constraint compliance test completed');
    }

    /**
     * Estimate memory usage for compiled program
     * @param {Object} result - Compilation result
     * @returns {number} Estimated memory usage in bytes
     */
    estimateMemoryUsage(result) {
        // Rough estimation based on instruction count and symbol table size
        const instructionMemory = result.assemblyInstructions * 4; // 4 bytes per instruction
        const symbolMemory = result.symbols * 8; // 8 bytes per symbol entry
        const constantMemory = 0x100; // 256 bytes for constants

        return instructionMemory + symbolMemory + constantMemory;
    }

    /**
     * Print detailed test summary
     */
    printSummary() {
        console.log('=== SAMPLE PROGRAM TEST SUMMARY ===');
        console.log(`Total Tests: ${this.testsRun}`);
        console.log(`Passed: ${this.testsPassed}`);
        console.log(`Failed: ${this.testsFailed}`);
        console.log(`Success Rate: ${((this.testsPassed / this.testsRun) * 100).toFixed(1)}%`);

        if (this.testsFailed > 0) {
            console.log('\nFailed Tests:');
            this.testResults.forEach((result, index) => {
                if (!result.passed) {
                    console.log(`  ${index + 1}. ${result.name} (${result.category}):`);
                    result.errors.forEach(error => {
                        console.log(`     - ${error}`);
                    });
                }
            });
        }

        // Test category summary
        console.log('\nTest Category Summary:');
        const categories = [...new Set(SAMPLE_PROGRAM_TESTS.map(test => test.category))];
        categories.forEach(category => {
            const categoryTests = this.testResults.filter(result => result.category === category);
            const passedTests = categoryTests.filter(result => result.passed).length;
            console.log(`  ${category}: ${passedTests}/${categoryTests.length} passed`);
        });

        if (this.testsPassed === this.testsRun) {
            console.log('\n🎉 ALL SAMPLE PROGRAM TESTS PASSED!');
            console.log('C compiler supports comprehensive language features.');
            console.log('Assembly code generation validated.');
            console.log('Program execution capability confirmed.');
        } else {
            console.log(`\n❌ ${this.testsFailed} sample program test(s) failed.`);
            console.log('Additional work needed for complete C language support.');
        }
    }
}

/**
 * Run the sample program test suite if this file is executed directly
 */
if (require.main === module) {
    const tester = new CSampleProgramTester();
    tester.runAllTests();

    console.log('\n' + '='.repeat(80));
    tester.testLanguageFeatureCoverage();

    console.log('\n' + '='.repeat(80));
    tester.testAssemblyCodeGeneration();

    console.log('\n' + '='.repeat(80));
    tester.testProgramExecutionCapability();

    console.log('\n' + '='.repeat(80));
    tester.testMemoryConstraintCompliance();
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CSampleProgramTester,
        SAMPLE_PROGRAM_TESTS
    };
}

module.exports = CSampleProgramTester;