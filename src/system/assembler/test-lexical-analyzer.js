/**
 * Lexical Analyzer Test Suite
 *
 * Comprehensive testing for the Phase 2 lexical analyzer component.
 * Tests token recognition, error handling, and system integration.
 *
 * Phase 2 Component: Assembler Testing
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

/**
 * Test case structure
 */
class TestCase {
    constructor(name, input, expectedTokens, description = '') {
        this.name = name;
        this.input = input;
        this.expectedTokens = expectedTokens;
        this.description = description;
    }
}

/**
 * Test result structure
 */
class TestResult {
    constructor(testCase, passed, actualTokens, error = null, executionTime = 0) {
        this.testCase = testCase;
        this.passed = passed;
        this.actualTokens = actualTokens;
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
            input: this.testCase.input,
            expected: this.testCase.expectedTokens.length,
            actual: this.actualTokens.length,
            passed: this.passed,
            executionTime: `${this.executionTime}ms`,
            error: this.error
        };
    }
}

/**
 * Lexical Analyzer Test Suite
 */
class LexicalAnalyzerTestSuite {
    constructor() {
        this.testCases = [];
        this.results = [];
        this.setupTestCases();
    }

    /**
     * Set up comprehensive test cases
     */
    setupTestCases() {
        // Basic instruction recognition
        this.testCases.push(new TestCase(
            "Basic LOAD instruction",
            "LOAD R0, 42",
            [
                { type: 'INSTRUCTION', text: 'LOAD', value: 0x01 },
                { type: 'REGISTER', text: 'R0', value: 0 },
                { type: 'SEPARATOR', text: ',', value: 44 },
                { type: 'IMMEDIATE', text: '42', value: 42 }
            ],
            "Test basic instruction with register and immediate value"
        ));

        // Label recognition
        this.testCases.push(new TestCase(
            "Label definition",
            "main:",
            [
                { type: 'LABEL', text: 'main', value: 'main' }
            ],
            "Test label definition with colon"
        ));

        // Directive recognition
        this.testCases.push(new TestCase(
            "Text directive",
            ".text",
            [
                { type: 'DIRECTIVE', text: '.text', value: '.text' }
            ],
            "Test assembler directive recognition"
        ));

        // Comment handling
        this.testCases.push(new TestCase(
            "Comment line",
            "; This is a comment",
            [
                { type: 'COMMENT', text: '; This is a comment' }
            ],
            "Test comment recognition and handling"
        ));

        // Hexadecimal numbers
        this.testCases.push(new TestCase(
            "Hexadecimal number",
            "0FFH",
            [
                { type: 'IMMEDIATE', text: '0FFH', value: 255, subtype: 'hex' }
            ],
            "Test hexadecimal number recognition"
        ));

        // Complex program
        this.testCases.push(new TestCase(
            "Complex program",
            `
; Sample program
.text
.global main

main:
    LOAD R0, 42          ; Load value
    ADD R0, R1           ; Add registers
    STORE [R2], R0       ; Store result
    JUMP end_label       ; Jump to end

data_section:
    .data
    my_var: .equ 100     ; Define constant

end_label:
    HALT                 ; End program
            `.trim(),
            [
                { type: 'COMMENT', text: '; Sample program' },
                { type: 'DIRECTIVE', text: '.text' },
                { type: 'DIRECTIVE', text: '.global' },
                { type: 'LABEL', text: 'main' },
                { type: 'INSTRUCTION', text: 'LOAD', value: 0x01 },
                { type: 'REGISTER', text: 'R0' },
                { type: 'IMMEDIATE', text: '42', value: 42 },
                { type: 'COMMENT', text: '; Load value' },
                { type: 'INSTRUCTION', text: 'ADD', value: 0x03 },
                { type: 'REGISTER', text: 'R0' },
                { type: 'REGISTER', text: 'R1' },
                { type: 'COMMENT', text: '; Add registers' },
                { type: 'INSTRUCTION', text: 'STORE', value: 0x02 },
                { type: 'REGISTER', text: 'R2' },
                { type: 'REGISTER', text: 'R0' },
                { type: 'COMMENT', text: '; Store result' },
                { type: 'INSTRUCTION', text: 'JUMP', value: 0x06 },
                { type: 'LABEL', text: 'end_label' },
                { type: 'COMMENT', text: '; Jump to end' },
                { type: 'LABEL', text: 'data_section' },
                { type: 'DIRECTIVE', text: '.data' },
                { type: 'LABEL', text: 'my_var' },
                { type: 'DIRECTIVE', text: '.equ' },
                { type: 'IMMEDIATE', text: '100', value: 100 },
                { type: 'COMMENT', text: '; Define constant' },
                { type: 'LABEL', text: 'end_label' },
                { type: 'INSTRUCTION', text: 'HALT', value: 0xFF },
                { type: 'COMMENT', text: '; End program' }
            ],
            "Test complex assembly program tokenization"
        ));

        // Error cases
        this.testCases.push(new TestCase(
            "Invalid character",
            "LOAD R0, @42",
            [
                { type: 'ERROR', value: '@' }
            ],
            "Test error detection for invalid characters"
        ));

        // Edge cases
        this.testCases.push(new TestCase(
            "Empty input",
            "",
            [],
            "Test handling of empty input"
        ));

        this.testCases.push(new TestCase(
            "Only whitespace",
            "   \t\n  ",
            [],
            "Test handling of whitespace-only input"
        ));
    }

    /**
     * Run all test cases
     * @returns {Array} Array of test results
     */
    runAllTests() {
        console.log('=== LEXICAL ANALYZER TEST SUITE ===');
        console.log(`Running ${this.testCases.length} test cases...\n`);

        this.results = [];

        for (const testCase of this.testCases) {
            const startTime = Date.now();

            try {
                const tokens = lexicalAnalysis(testCase.input);
                const endTime = Date.now();
                const executionTime = endTime - startTime;

                // Validate tokens (simplified validation)
                const passed = this.validateTokens(testCase, tokens);

                const result = new TestResult(testCase, passed, tokens, null, executionTime);
                this.results.push(result);

                this.displayTestResult(result);

            } catch (error) {
                const endTime = Date.now();
                const executionTime = endTime - startTime;

                const result = new TestResult(testCase, false, [], error.message, executionTime);
                this.results.push(result);

                this.displayTestResult(result);
            }
        }

        this.displaySummary();
        return this.results;
    }

    /**
     * Validate tokens against expected results
     * @param {TestCase} testCase - Test case to validate
     * @param {Array} tokens - Actual tokens produced
     * @returns {boolean} True if tokens match expectations
     */
    validateTokens(testCase, tokens) {
        // Remove end marker for comparison
        const actualTokens = tokens.slice(0, -1);

        if (actualTokens.length !== testCase.expectedTokens.length) {
            return false;
        }

        // For now, do basic validation
        // In a full implementation, this would do detailed token comparison
        for (let i = 0; i < actualTokens.length; i++) {
            const actual = actualTokens[i];
            const expected = testCase.expectedTokens[i];

            if (actual.type !== this.getTokenTypeNumber(expected.type)) {
                return false;
            }

            // Additional validation based on token type
            if (expected.text && actual.text !== expected.text) {
                return false;
            }

            if (expected.value !== undefined && actual.value !== expected.value) {
                return false;
            }
        }

        return true;
    }

    /**
     * Convert token type name to number
     * @param {string} typeName - Token type name
     * @returns {number} Token type number
     */
    getTokenTypeNumber(typeName) {
        const typeMap = {
            'INSTRUCTION': TOKEN_TYPES.INSTRUCTION,
            'REGISTER': TOKEN_TYPES.REGISTER,
            'IMMEDIATE': TOKEN_TYPES.IMMEDIATE,
            'LABEL': TOKEN_TYPES.LABEL,
            'DIRECTIVE': TOKEN_TYPES.DIRECTIVE,
            'SEPARATOR': TOKEN_TYPES.SEPARATOR,
            'COMMENT': TOKEN_TYPES.COMMENT,
            'END': TOKEN_TYPES.END,
            'ERROR': TOKEN_TYPES.ERROR
        };

        return typeMap[typeName] || 0xF;
    }

    /**
     * Display test result
     * @param {TestResult} result - Test result to display
     */
    displayTestResult(result) {
        const status = result.passed ? '✓ PASS' : '✗ FAIL';
        const time = result.executionTime > 0 ? ` (${result.executionTime}ms)` : '';

        console.log(`${status} ${result.testCase.name}${time}`);

        if (!result.passed) {
            if (result.error) {
                console.log(`  Error: ${result.error}`);
            } else {
                console.log(`  Expected: ${result.testCase.expectedTokens.length} tokens`);
                console.log(`  Actual: ${result.actualTokens.length} tokens`);
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
 * Integration test with the OrionRisc-128 system
 */
class SystemIntegrationTest {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.analyzer = new LexicalAnalyzer(mmu, cpu);
    }

    /**
     * Test lexical analyzer integration with system
     * @param {string} sourceCode - Assembly source code to test
     * @returns {Object} Integration test results
     */
    async testIntegration(sourceCode) {
        console.log('=== SYSTEM INTEGRATION TEST ===');

        try {
            // Load lexical analyzer program
            this.analyzer.loadProgram(0x0000);

            // Tokenize source code
            const result = this.analyzer.tokenize(sourceCode, 0x1000, 0x2000, 0x3000);

            console.log(`Tokenization completed:`);
            console.log(`  Tokens found: ${result.tokenCount}`);
            console.log(`  Token buffer: 0x2000`);
            console.log(`  String table: 0x3000`);

            // Verify tokens in memory
            const tokensInMemory = this.analyzer.readTokens(0x2000);

            console.log(`Tokens in memory: ${tokensInMemory.length}`);

            // Display first few tokens
            for (let i = 0; i < Math.min(5, tokensInMemory.length); i++) {
                const token = tokensInMemory[i];
                const typeName = LexicalAnalyzer.getTokenTypeName(token.type);
                console.log(`  Token ${i}: ${typeName} (value: 0x${token.value.toString(16)}, length: ${token.length})`);
            }

            return {
                success: true,
                tokenCount: result.tokenCount,
                tokensInMemory: tokensInMemory.length,
                memoryUsage: this.mmu.getMemoryStats()
            };

        } catch (error) {
            console.error(`Integration test failed: ${error.message}`);

            return {
                success: false,
                error: error.message,
                memoryUsage: this.mmu.getMemoryStats()
            };
        }
    }
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

/**
 * Performance test for lexical analyzer
 */
class PerformanceTest {
    constructor() {
        this.testSizes = [100, 1000, 10000];  // Characters
    }

    /**
     * Generate test source code of specified size
     * @param {number} size - Approximate size in characters
     * @returns {string} Generated source code
     */
    generateTestCode(size) {
        const instructions = ['LOAD', 'STORE', 'ADD', 'SUB', 'JUMP', 'CALL', 'RET', 'HALT', 'SYSCALL'];
        const registers = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15'];

        let code = '';

        while (code.length < size) {
            // Add random instruction
            const instr = instructions[Math.floor(Math.random() * instructions.length)];
            const reg1 = registers[Math.floor(Math.random() * registers.length)];
            const reg2 = registers[Math.floor(Math.random() * registers.length)];
            const num = Math.floor(Math.random() * 256);

            code += `${instr} ${reg1}, ${num}\n`;

            // Occasionally add labels and directives
            if (Math.random() < 0.1) {
                code += `label_${Math.floor(Math.random() * 1000)}:\n`;
            }

            if (Math.random() < 0.05) {
                code += '.text\n';
            }

            // Add comments occasionally
            if (Math.random() < 0.2) {
                code += `; Comment ${Math.floor(Math.random() * 100)}\n`;
            }
        }

        return code.substring(0, size);
    }

    /**
     * Run performance tests
     * @returns {Array} Performance test results
     */
    runPerformanceTests() {
        console.log('=== PERFORMANCE TESTS ===');

        const results = [];

        for (const size of this.testSizes) {
            console.log(`Testing with ${size} characters...`);

            const testCode = this.generateTestCode(size);
            const startTime = Date.now();

            try {
                const tokens = lexicalAnalysis(testCode);
                const endTime = Date.now();
                const executionTime = endTime - startTime;

                const result = {
                    size: size,
                    characters: testCode.length,
                    tokens: tokens.length,
                    time: executionTime,
                    tokensPerSecond: (tokens.length / executionTime) * 1000,
                    charPerSecond: (testCode.length / executionTime) * 1000
                };

                results.push(result);

                console.log(`  Time: ${executionTime}ms`);
                console.log(`  Tokens: ${tokens.length}`);
                console.log(`  Performance: ${result.tokensPerSecond.toFixed(0)} tokens/sec`);

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
 * Run complete test suite
 */
function runCompleteTestSuite() {
    console.log('ORIONRISC-128 LEXICAL ANALYZER - COMPLETE TEST SUITE');
    console.log('==================================================\n');

    // Unit tests
    const unitTests = new LexicalAnalyzerTestSuite();
    unitTests.runAllTests();

    // Performance tests
    const perfTests = new PerformanceTest();
    const perfResults = perfTests.runPerformanceTests();

    console.log('\n=== PERFORMANCE SUMMARY ===');
    perfResults.forEach(result => {
        if (!result.error) {
            console.log(`${result.size} chars: ${result.tokens} tokens in ${result.time}ms (${result.tokensPerSecond.toFixed(0)} tokens/sec)`);
        }
    });

    return {
        unitTests: unitTests.getDetailedReport(),
        performanceTests: perfResults
    };
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example usage and demonstration
 */
function demonstrateLexicalAnalyzer() {
    console.log('=== LEXICAL ANALYZER DEMONSTRATION ===');

    const sampleCode = `
; OrionRisc-128 Assembly Program
.text
.global main

main:
    LOAD R0, 42          ; Load immediate value
    LOAD R1, [R2 + 10]   ; Load from memory
    ADD R0, R1           ; Add registers
    STORE [R3], R0       ; Store result
    JUMP end_label       ; Jump to label

end_label:
    HALT                 ; End program
    `;

    console.log('Sample assembly code:');
    console.log(sampleCode);

    console.log('Tokenization result:');
    const tokens = lexicalAnalysis(sampleCode);

    tokens.slice(0, -1).forEach((token, index) => {  // Skip end marker
        const typeName = Object.keys(TOKEN_TYPES).find(key => TOKEN_TYPES[key] === token.type);
        console.log(`${index.toString().padStart(2)}: ${typeName} | "${token.text || ''}" | ${token.value || ''}`);
    });

    return tokens;
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TestCase,
        TestResult,
        LexicalAnalyzerTestSuite,
        SystemIntegrationTest,
        PerformanceTest,
        runCompleteTestSuite,
        demonstrateLexicalAnalyzer
    };
}

module.exports = {
    runCompleteTestSuite,
    demonstrateLexicalAnalyzer
};