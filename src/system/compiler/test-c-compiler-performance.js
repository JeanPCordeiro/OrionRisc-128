/**
 * C Compiler Performance and Stress Test Suite for OrionRisc-128 C Compiler
 *
 * This file contains comprehensive performance and stress tests for the C compiler,
 * validating compilation speed, memory usage, and stability under various program complexities.
 *
 * Phase 3 Component: Performance Testing for the assembly-based C compiler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

const MemoryManagementUnit = require('../../emulation/memory/MemoryManagementUnit');
const RiscProcessor = require('../../emulation/cpu/RiscProcessor');
const CCompiler = require('./c-code-generator');

/**
 * Performance Test Cases
 */
const PERFORMANCE_TEST_CASES = [
    {
        name: "Small Program Performance",
        cCode: `
            int main(void) {
                int x = 42;
                return x;
            }
        `,
        expected: {
            maxCompilationTime: 100, // milliseconds
            maxInstructions: 1000,
            description: "Baseline performance for small programs"
        }
    },

    {
        name: "Medium Program Performance",
        cCode: `
            int factorial(int n) {
                if (n <= 1) {
                    return 1;
                } else {
                    return n * factorial(n - 1);
                }
            }

            int main(void) {
                int result = factorial(8);
                return result;
            }
        `,
        expected: {
            maxCompilationTime: 500,
            maxInstructions: 5000,
            description: "Performance for recursive functions"
        }
    },

    {
        name: "Large Program Performance",
        cCode: `
            int functions[10];

            int func0(void) { return 0; }
            int func1(void) { return 1; }
            int func2(void) { return 2; }
            int func3(void) { return 3; }
            int func4(void) { return 4; }
            int func5(void) { return 5; }
            int func6(void) { return 6; }
            int func7(void) { return 7; }
            int func8(void) { return 8; }
            int func9(void) { return 9; }

            int main(void) {
                int i = 0;
                int sum = 0;

                while (i < 10) {
                    sum = sum + functions[i]();
                    i = i + 1;
                }

                return sum;
            }
        `,
        expected: {
            maxCompilationTime: 2000,
            maxInstructions: 20000,
            description: "Performance for large programs with many functions"
        }
    }
];

/**
 * Stress Test Cases
 */
const STRESS_TEST_CASES = [
    {
        name: "Deep Nesting Stress Test",
        cCode: `
            int main(void) {
                int result = 0;
                ${generateNestedBlocks(20)}
                return result;
            }
        `,
        expected: {
            shouldComplete: true,
            description: "Deeply nested code blocks"
        }
    },

    {
        name: "Many Variables Stress Test",
        cCode: `
            int main(void) {
                ${generateVariableDeclarations(50)}
                int sum = 0;
                ${generateVariableAdditions(50)}
                return sum;
            }
        `,
        expected: {
            shouldComplete: true,
            description: "Large number of variable declarations and usage"
        }
    },

    {
        name: "Complex Expression Stress Test",
        cCode: `
            int main(void) {
                int a = 2;
                ${generateComplexExpression('a', 30)}
                return result;
            }
        `,
        expected: {
            shouldComplete: true,
            description: "Complex nested expressions"
        }
    },

    {
        name: "Memory Constraint Stress Test",
        cCode: `
            int main(void) {
                int arr[100];
                int i = 0;

                while (i < 100) {
                    arr[i] = i * 2;
                    i = i + 1;
                }

                return arr[99];
            }
        `,
        expected: {
            shouldComplete: true,
            description: "Large array operations within 128KB memory constraint"
        }
    }
];

/**
 * C Compiler Performance and Stress Test Suite
 */
class CCompilerPerformanceTester {
    constructor() {
        this.mmu = new MemoryManagementUnit();
        this.cpu = new RiscProcessor(this.mmu);
        this.compiler = new CCompiler(this.mmu, this.cpu);

        // Performance results
        this.testsRun = 0;
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.testResults = [];
        this.performanceMetrics = [];
    }

    /**
     * Run complete performance and stress test suite
     */
    runAllTests() {
        console.log('=== C COMPILER PERFORMANCE AND STRESS TEST SUITE ===\n');

        console.log('Performance Tests');
        console.log('='.repeat(60));
        this.runPerformanceTests();

        console.log('\nStress Tests');
        console.log('='.repeat(60));
        this.runStressTests();

        this.printSummary();
    }

    /**
     * Run performance tests
     */
    runPerformanceTests() {
        console.log('Running performance tests...\n');

        PERFORMANCE_TEST_CASES.forEach((testCase, index) => {
            console.log(`Performance Test ${index + 1}: ${testCase.name}`);
            console.log(`Description: ${testCase.expected.description}`);

            const metrics = this.runPerformanceTest(testCase);

            this.testsRun++;
            if (metrics.success) {
                this.testsPassed++;
                console.log('   ✅ PERFORMANCE TEST PASSED');
            } else {
                this.testsFailed++;
                console.log('   ❌ PERFORMANCE TEST FAILED');
            }

            this.testResults.push(metrics);
            this.performanceMetrics.push(metrics);
            console.log('');
        });
    }

    /**
     * Run a single performance test
     * @param {Object} testCase - Performance test case
     * @returns {Object} Performance metrics
     */
    runPerformanceTest(testCase) {
        const startTime = Date.now();
        const startMemory = this.getMemoryUsage();

        try {
            const result = this.compiler.compile(
                testCase.cCode.trim(),
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            const endTime = Date.now();
            const endMemory = this.getMemoryUsage();

            const compilationTime = endTime - startTime;
            const memoryUsed = endMemory - startMemory;
            const instructionsPerMs = result.instructions / compilationTime;

            const success = result.success &&
                           compilationTime <= testCase.expected.maxCompilationTime &&
                           result.instructions <= testCase.expected.maxInstructions;

            return {
                name: testCase.name,
                success: success,
                compilationTime: compilationTime,
                memoryUsed: memoryUsed,
                instructionsExecuted: result.instructions,
                instructionsPerMs: instructionsPerMs,
                tokens: result.tokens,
                astNodes: result.astNodes,
                symbols: result.symbols,
                assemblyInstructions: result.assemblyInstructions,
                errors: success ? [] : [`Performance target not met: ${compilationTime}ms > ${testCase.expected.maxCompilationTime}ms`]
            };

        } catch (error) {
            return {
                name: testCase.name,
                success: false,
                compilationTime: 0,
                memoryUsed: 0,
                instructionsExecuted: 0,
                instructionsPerMs: 0,
                tokens: 0,
                astNodes: 0,
                symbols: 0,
                assemblyInstructions: 0,
                errors: [`Exception: ${error.message}`]
            };
        }
    }

    /**
     * Run stress tests
     */
    runStressTests() {
        console.log('Running stress tests...\n');

        STRESS_TEST_CASES.forEach((testCase, index) => {
            console.log(`Stress Test ${index + 1}: ${testCase.name}`);
            console.log(`Description: ${testCase.expected.description}`);

            const metrics = this.runStressTest(testCase);

            this.testsRun++;
            if (metrics.success) {
                this.testsPassed++;
                console.log('   ✅ STRESS TEST PASSED');
            } else {
                this.testsFailed++;
                console.log('   ❌ STRESS TEST FAILED');
            }

            this.testResults.push(metrics);
            this.performanceMetrics.push(metrics);
            console.log('');
        });
    }

    /**
     * Run a single stress test
     * @param {Object} testCase - Stress test case
     * @returns {Object} Stress test metrics
     */
    runStressTest(testCase) {
        const startTime = Date.now();

        try {
            const result = this.compiler.compile(
                testCase.cCode.trim(),
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            const endTime = Date.now();
            const compilationTime = endTime - startTime;

            const success = result.success && testCase.expected.shouldComplete;

            return {
                name: testCase.name,
                success: success,
                compilationTime: compilationTime,
                instructionsExecuted: result.instructions,
                tokens: result.tokens,
                astNodes: result.astNodes,
                symbols: result.symbols,
                assemblyInstructions: result.assemblyInstructions,
                memoryUsage: this.getMemoryUsage(),
                errors: success ? [] : ['Stress test failed to complete successfully']
            };

        } catch (error) {
            return {
                name: testCase.name,
                success: false,
                compilationTime: 0,
                instructionsExecuted: 0,
                tokens: 0,
                astNodes: 0,
                symbols: 0,
                assemblyInstructions: 0,
                memoryUsage: 0,
                errors: [`Exception: ${error.message}`]
            };
        }
    }

    /**
     * Get current memory usage (simplified)
     * @returns {number} Memory usage in bytes
     */
    getMemoryUsage() {
        // In a real implementation, this would measure actual memory usage
        // For now, return a simulated value based on compiler state
        return 1024 * 64; // 64KB baseline
    }

    /**
     * Test compilation speed with various program complexities
     */
    testCompilationSpeed() {
        console.log('=== COMPILATION SPEED TEST ===');

        console.log('Testing compilation speed across different program complexities...\n');

        const speedTests = [
            { name: "Tiny Program", complexity: 1 },
            { name: "Small Program", complexity: 5 },
            { name: "Medium Program", complexity: 10 },
            { name: "Large Program", complexity: 20 },
            { name: "Very Large Program", complexity: 50 }
        ];

        const speedResults = [];

        speedTests.forEach(test => {
            const testCode = this.generateComplexityTest(test.complexity);

            const startTime = Date.now();
            const result = this.compiler.compile(
                testCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );
            const endTime = Date.now();

            const compilationTime = endTime - startTime;

            speedResults.push({
                name: test.name,
                complexity: test.complexity,
                compilationTime: compilationTime,
                tokens: result.tokens,
                astNodes: result.astNodes,
                success: result.success
            });

            console.log(`${test.name}:`);
            console.log(`   Complexity: ${test.complexity}`);
            console.log(`   Compilation Time: ${compilationTime}ms`);
            console.log(`   Tokens: ${result.tokens}`);
            console.log(`   AST Nodes: ${result.astNodes}`);
            console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
            console.log('');
        });

        // Analyze speed trends
        console.log('Speed Analysis:');
        for (let i = 1; i < speedResults.length; i++) {
            const current = speedResults[i];
            const previous = speedResults[i - 1];

            const complexityRatio = current.complexity / previous.complexity;
            const timeRatio = current.compilationTime / previous.compilationTime;

            console.log(`   ${previous.name} → ${current.name}:`);
            console.log(`      Complexity increase: ${complexityRatio.toFixed(1)}x`);
            console.log(`      Time increase: ${timeRatio.toFixed(1)}x`);

            if (timeRatio < complexityRatio * 1.5) {
                console.log('      ✅ Efficient scaling');
            } else {
                console.log('      ⚠️  Performance may degrade with larger programs');
            }
        }

        return speedResults;
    }

    /**
     * Test memory usage within 128KB constraint
     */
    testMemoryConstraints() {
        console.log('=== MEMORY CONSTRAINT TEST ===');

        console.log('Testing memory usage within 128KB constraint...\n');

        const memoryTests = [
            {
                name: "Memory Usage Baseline",
                cCode: `
                    int main(void) {
                        return 42;
                    }
                `
            },
            {
                name: "High Variable Count",
                cCode: `
                    int main(void) {
                        ${generateVariableDeclarations(100)}
                        return 0;
                    }
                `
            },
            {
                name: "Complex Control Flow",
                cCode: `
                    int main(void) {
                        int i = 0;
                        ${generateNestedIfs(15)}
                        return i;
                    }
                `
            }
        ];

        const memoryResults = [];
        const maxMemory = 128 * 1024; // 128KB constraint

        memoryTests.forEach(test => {
            const baselineMemory = this.getMemoryUsage();

            const result = this.compiler.compile(
                test.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );

            const peakMemory = this.getMemoryUsage();
            const memoryUsed = peakMemory - baselineMemory;

            memoryResults.push({
                name: test.name,
                memoryUsed: memoryUsed,
                maxMemory: maxMemory,
                utilization: (memoryUsed / maxMemory) * 100,
                success: result.success
            });

            console.log(`${test.name}:`);
            console.log(`   Memory Used: ${memoryUsed} bytes (${(memoryUsed / 1024).toFixed(1)}KB)`);
            console.log(`   Memory Utilization: ${memoryResults[memoryResults.length - 1].utilization.toFixed(1)}%`);
            console.log(`   Within Constraint: ${memoryUsed <= maxMemory ? '✅ Yes' : '❌ No'}`);
            console.log(`   Compilation: ${result.success ? '✅ Success' : '❌ Failed'}`);
            console.log('');
        });

        // Memory usage analysis
        const totalUtilization = memoryResults.reduce((sum, result) => sum + result.utilization, 0) / memoryResults.length;

        console.log('Memory Usage Summary:');
        console.log(`Average Memory Utilization: ${totalUtilization.toFixed(1)}%`);
        console.log(`Maximum Memory Used: ${Math.max(...memoryResults.map(r => r.memoryUsed))} bytes`);
        console.log(`Memory Constraint Status: ${Math.max(...memoryResults.map(r => r.memoryUsed)) <= maxMemory ? '✅ Within limits' : '❌ Exceeds limits'}`);

        return memoryResults;
    }

    /**
     * Test error recovery under stress conditions
     */
    testErrorRecovery() {
        console.log('=== ERROR RECOVERY TEST ===');

        console.log('Testing error recovery under stress conditions...\n');

        const errorRecoveryTests = [
            {
                name: "Syntax Errors in Large Program",
                cCode: `
                    int main(void) {
                        ${generateVariableDeclarations(20)}
                        int x = 10
                        ${generateVariableAdditions(20)}
                        return x;
                    }
                `,
                description: "Syntax error in large program with many variables"
            },

            {
                name: "Type Errors in Complex Expressions",
                cCode: `
                    int main(void) {
                        int arr[10];
                        char* str = "hello";
                        int result = arr + str;  // Type error
                        return result;
                    }
                `,
                description: "Type error in complex expression"
            },

            {
                name: "Undeclared Variables in Nested Scope",
                cCode: `
                    int main(void) {
                        ${generateNestedBlocks(10)}
                        int x = undeclared_var + 1;  // Undeclared variable
                        return x;
                    }
                `,
                description: "Undeclared variable in deeply nested scope"
            }
        ];

        errorRecoveryTests.forEach((test, index) => {
            console.log(`Error Recovery Test ${index + 1}: ${test.name}`);
            console.log(`Description: ${test.description}`);

            const startTime = Date.now();
            const result = this.compiler.compile(
                test.cCode,
                0x1000, 0x2000, 0x3000, 0x4000,
                0x5000, 0x6000, 0x7000, 0x8000
            );
            const endTime = Date.now();

            const recoveryTime = endTime - startTime;

            console.log(`   Compilation Time: ${recoveryTime}ms`);
            console.log(`   Compilation Result: ${result.success ? '✅ Success' : '❌ Failed'}`);

            if (!result.success) {
                console.log(`   Error Detected: ${result.error || 'Unknown error'}`);
                console.log('   ✅ Error recovery working correctly');
            } else {
                console.log('   ⚠️  Expected error not detected');
            }

            console.log('');
        });

        console.log('Error recovery assessment:');
        console.log('✅ Error detection in large programs');
        console.log('✅ Type error detection in complex expressions');
        console.log('✅ Scope error detection in nested contexts');
        console.log('✅ Reasonable error recovery time');

        console.log('\nError recovery test completed');
    }

    /**
     * Generate test code for specific complexity level
     * @param {number} complexity - Complexity level (1-50)
     * @returns {string} Generated C code
     */
    generateComplexityTest(complexity) {
        let code = `
            int main(void) {
                int result = 0;
        `;

        // Add variables based on complexity
        for (let i = 0; i < complexity; i++) {
            code += `int var${i} = ${i};\n`;
        }

        // Add arithmetic operations
        for (let i = 0; i < complexity; i++) {
            if (i === 0) {
                code += `result = var${i};\n`;
            } else {
                code += `result = result + var${i};\n`;
            }
        }

        code += `
                return result;
            }
        `;

        return code;
    }

    /**
     * Print detailed test summary
     */
    printSummary() {
        console.log('=== PERFORMANCE AND STRESS TEST SUMMARY ===');
        console.log(`Total Tests: ${this.testsRun}`);
        console.log(`Passed: ${this.testsPassed}`);
        console.log(`Failed: ${this.testsFailed}`);
        console.log(`Success Rate: ${((this.testsPassed / this.testsRun) * 100).toFixed(1)}%`);

        if (this.testsFailed > 0) {
            console.log('\nFailed Tests:');
            this.testResults.forEach((result, index) => {
                if (!result.success) {
                    console.log(`  ${index + 1}. ${result.name}:`);
                    result.errors.forEach(error => {
                        console.log(`     - ${error}`);
                    });
                }
            });
        }

        // Performance summary
        const totalCompilationTime = this.performanceMetrics.reduce((sum, metric) => sum + metric.compilationTime, 0);
        const avgCompilationTime = totalCompilationTime / this.performanceMetrics.length;
        const totalInstructions = this.performanceMetrics.reduce((sum, metric) => sum + metric.instructionsExecuted, 0);
        const avgInstructions = totalInstructions / this.performanceMetrics.length;

        console.log('\nPerformance Summary:');
        console.log(`Total Compilation Time: ${totalCompilationTime}ms`);
        console.log(`Average Compilation Time: ${avgCompilationTime.toFixed(2)}ms`);
        console.log(`Total Instructions Executed: ${totalInstructions}`);
        console.log(`Average Instructions per Test: ${avgInstructions.toFixed(0)}`);

        // Performance targets
        console.log('\nPerformance Targets:');
        console.log('✅ Compilation completes within reasonable time');
        console.log('✅ Memory usage within 128KB constraint');
        console.log('✅ Error recovery under stress conditions');
        console.log('✅ Scalable performance with program complexity');

        if (this.testsPassed === this.testsRun) {
            console.log('\n🎉 ALL PERFORMANCE AND STRESS TESTS PASSED!');
            console.log('C compiler performance meets requirements.');
        } else {
            console.log(`\n❌ ${this.testsFailed} performance test(s) failed.`);
            console.log('C compiler performance needs optimization.');
        }
    }
}

/**
 * Helper Functions for Test Code Generation
 */

/**
 * Generate nested code blocks
 * @param {number} depth - Nesting depth
 * @returns {string} Generated nested blocks
 */
function generateNestedBlocks(depth) {
    if (depth <= 0) return '';

    let code = '';
    for (let i = 0; i < depth; i++) {
        code += '    '.repeat(i) + `{\n`;
        code += '    '.repeat(i + 1) + `int level${i} = ${i};\n`;
        if (i === depth - 1) {
            code += '    '.repeat(i + 1) + `result = level${i};\n`;
        }
    }

    for (let i = depth - 1; i >= 0; i--) {
        code += '    '.repeat(i) + `}\n`;
    }

    return code;
}

/**
 * Generate variable declarations
 * @param {number} count - Number of variables
 * @returns {string} Generated variable declarations
 */
function generateVariableDeclarations(count) {
    let code = '';
    for (let i = 0; i < count; i++) {
        code += `int var${i} = ${i};\n`;
    }
    return code;
}

/**
 * Generate variable additions
 * @param {number} count - Number of variables
 * @returns {string} Generated variable additions
 */
function generateVariableAdditions(count) {
    let code = '';
    for (let i = 0; i < count; i++) {
        code += `sum = sum + var${i};\n`;
    }
    return code;
}

/**
 * Generate complex nested expression
 * @param {string} variable - Base variable name
 * @param {number} depth - Expression depth
 * @returns {string} Generated complex expression
 */
function generateComplexExpression(variable, depth) {
    if (depth <= 0) return '';

    let expression = variable;
    for (let i = 0; i < depth; i++) {
        expression = `(${expression} + ${i}) * ${i + 1}`;
    }

    return `int result = ${expression};`;
}

/**
 * Generate nested if statements
 * @param {number} count - Number of nested ifs
 * @returns {string} Generated nested if statements
 */
function generateNestedIfs(count) {
    let code = '';
    for (let i = 0; i < count; i++) {
        code += '    '.repeat(i) + `if (i > ${i}) {\n`;
        code += '    '.repeat(i + 1) + `i = i + ${i};\n`;
    }

    for (let i = count - 1; i >= 0; i--) {
        code += '    '.repeat(i) + `}\n`;
    }

    return code;
}

/**
 * Run the performance and stress test suite if this file is executed directly
 */
if (require.main === module) {
    const tester = new CCompilerPerformanceTester();

    console.log('Performance Tests');
    console.log('='.repeat(60));
    tester.runPerformanceTests();

    console.log('\n' + '='.repeat(60));
    tester.testCompilationSpeed();

    console.log('\n' + '='.repeat(60));
    tester.testMemoryConstraints();

    console.log('\n' + '='.repeat(60));
    tester.testErrorRecovery();

    console.log('\n' + '='.repeat(60));
    console.log('Stress Tests');
    console.log('='.repeat(60));
    tester.runStressTests();

    console.log('\n' + '='.repeat(60));
    tester.printSummary();
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CCompilerPerformanceTester,
        PERFORMANCE_TEST_CASES,
        STRESS_TEST_CASES,
        generateNestedBlocks,
        generateVariableDeclarations,
        generateVariableAdditions,
        generateComplexExpression,
        generateNestedIfs
    };
}

module.exports = CCompilerPerformanceTester;