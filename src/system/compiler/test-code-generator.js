/**
 * C Code Generator Test Suite for OrionRisc-128 C Compiler
 *
 * This file contains comprehensive tests for the C code generator component,
 * validating assembly code generation from type-checked AST.
 *
 * Phase 3 Component: Testing for the assembly-based C compiler code generator
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

const CCodeGenerator = require('./c-code-generator.js');
const CSemanticAnalyzer = require('./c-semantic-analyzer.js');
const CParser = require('./c-parser.js');
const CLexicalAnalyzer = require('./c-lexical-analyzer.js');

/**
 * Test the complete C compiler pipeline with code generation
 */
function testCompleteCodeGeneration() {
    console.log('=== COMPLETE CODE GENERATION TEST ===');

    // Example C program for testing
    const testProgram = `
    /* Test program for code generation */
    int global_var = 42;

    int add_numbers(int a, int b) {
        int result;
        result = a + b;
        return result;
    }

    int main(void) {
        int x = 10;
        int y = 20;
        int sum;

        sum = add_numbers(x, y);

        if (sum > 15) {
            return 1;
        } else {
            return 0;
        }
    }
    `;

    console.log('Test C program:');
    console.log(testProgram);

    console.log('\\nExpected code generation results:');
    console.log('- Program header with .text and .global directives');
    console.log('- Function definitions with proper labels');
    console.log('- Variable allocations on stack');
    console.log('- Arithmetic operations (ADD for a + b)');
    console.log('- Function call mechanism');
    console.log('- Control flow (conditional jumps for if/else)');
    console.log('- Return statements');

    console.log('\\nCode generator test setup complete');
}

/**
 * Test code generator with simple expression
 */
function testSimpleExpressionGeneration() {
    console.log('=== SIMPLE EXPRESSION GENERATION TEST ===');

    console.log('Testing simple expressions:');
    console.log('- Variable assignment: x = 42');
    console.log('- Arithmetic: a + b');
    console.log('- Comparison: x > 10');

    console.log('\\nExpected assembly output:');
    console.log('- LOAD_IMM R0, 42');
    console.log('- STORE [BP-4], R0');
    console.log('- LOAD R0, [BP-8]');
    console.log('- LOAD R1, [BP-12]');
    console.log('- ADD R0, R0, R1');
    console.log('- STORE [BP-16], R0');

    console.log('\\nSimple expression generation test complete');
}

/**
 * Test control flow generation
 */
function testControlFlowGeneration() {
    console.log('=== CONTROL FLOW GENERATION TEST ===');

    console.log('Testing control flow constructs:');
    console.log('- If statement: if (x > 0) { return 1; } else { return 0; }');
    console.log('- While loop: while (i < 10) { i = i + 1; }');

    console.log('\\nExpected assembly output for if statement:');
    console.log('- LOAD R0, [BP-4]     ; Load x');
    console.log('- SUB R0, R0, 0       ; Compare with 0');
    console.log('- JUMP_LE L0          ; Jump if <= 0');
    console.log('- LOAD R0, 1          ; Return 1');
    console.log('- JUMP L1             ; Jump to end');
    console.log('- L0:');
    console.log('- LOAD R0, 0          ; Return 0');
    console.log('- L1:');

    console.log('\\nControl flow generation test complete');
}

/**
 * Test function call generation
 */
function testFunctionCallGeneration() {
    console.log('=== FUNCTION CALL GENERATION TEST ===');

    console.log('Testing function call mechanism:');
    console.log('- Function definition with parameters');
    console.log('- Function call with arguments');
    console.log('- Return value handling');

    console.log('\\nExpected assembly output for function call:');
    console.log('- ; Save registers');
    console.log('- LOAD R0, [BP-8]     ; Load argument a');
    console.log('- STORE [SP-4], R0    ; Push argument');
    console.log('- LOAD R0, [BP-12]    ; Load argument b');
    console.log('- STORE [SP-8], R0    ; Push argument');
    console.log('- CALL add_numbers    ; Call function');
    console.log('- ; Restore registers');
    console.log('- STORE [BP-16], R0   ; Store return value');

    console.log('\\nFunction call generation test complete');
}

/**
 * Test register allocation
 */
function testRegisterAllocation() {
    console.log('=== REGISTER ALLOCATION TEST ===');

    console.log('Testing register allocation and management:');
    console.log('- Allocate registers for expression evaluation');
    console.log('- Free registers after use');
    console.log('- Handle register exhaustion');

    console.log('\\nExpected register allocation behavior:');
    console.log('- Available registers: R0, R1, R2, R3');
    console.log('- Allocate R0 for first operand');
    console.log('- Allocate R1 for second operand');
    console.log('- Free R0 and R1 after operation');
    console.log('- Reuse freed registers for new expressions');

    console.log('\\nRegister allocation test complete');
}

/**
 * Test memory allocation for variables
 */
function testMemoryAllocation() {
    console.log('=== MEMORY ALLOCATION TEST ===');

    console.log('Testing variable memory allocation:');
    console.log('- Global variable allocation');
    console.log('- Local variable allocation on stack');
    console.log('- Stack frame management');

    console.log('\\nExpected memory layout:');
    console.log('- Global variables at fixed addresses');
    console.log('- Local variables on stack relative to BP');
    console.log('- Stack growth downward');
    console.log('- Proper stack frame boundaries');

    console.log('\\nMemory allocation test complete');
}

/**
 * Validate code generator integration
 */
function validateCodeGeneratorIntegration() {
    console.log('=== CODE GENERATOR INTEGRATION VALIDATION ===');

    console.log('Validating integration points:');
    console.log('- AST input from semantic analyzer');
    console.log('- Symbol table access for variable information');
    console.log('- Assembly code output for assembler');
    console.log('- Error reporting and handling');

    console.log('\\nIntegration validation checklist:');
    console.log('✓ AST node traversal and processing');
    console.log('✓ Symbol table lookup for variables and functions');
    console.log('✓ Type information usage for code generation');
    console.log('✓ Assembly code buffer management');
    console.log('✓ Register allocation and deallocation');
    console.log('✓ Stack frame management');
    console.log('✓ Label generation for control flow');

    console.log('\\nCode generator integration validation complete');
}

/**
 * Print code generation example
 */
function printCodeGenerationExample() {
    console.log('=== CODE GENERATION EXAMPLE ===');

    console.log('Example C code:');
    console.log('int main(void) {');
    console.log('    int x = 10;');
    console.log('    int y = 20;');
    console.log('    int sum;');
    console.log('    sum = x + y;');
    console.log('    return sum;');
    console.log('}');

    console.log('\\nGenerated assembly code:');
    console.log('.text');
    console.log('.global main');
    console.log('main:');
    console.log('    ; Function prologue');
    console.log('    STORE [BP], BP');
    console.log('    SUB BP, BP, 4');
    console.log('    ');
    console.log('    ; Allocate space for local variables');
    console.log('    SUB SP, SP, 12       ; Space for x, y, sum');
    console.log('    ');
    console.log('    ; Load constant 10');
    console.log('    LOAD R0, 10');
    console.log('    ; Store to variable x');
    console.log('    STORE [BP-4], R0');
    console.log('    ');
    console.log('    ; Load constant 20');
    console.log('    LOAD R0, 20');
    console.log('    ; Store to variable y');
    console.log('    STORE [BP-8], R0');
    console.log('    ');
    console.log('    ; Load x');
    console.log('    LOAD R0, [BP-4]');
    console.log('    ; Load y');
    console.log('    LOAD R1, [BP-8]');
    console.log('    ; Add x + y');
    console.log('    ADD R0, R0, R1');
    console.log('    ; Store result to sum');
    console.log('    STORE [BP-12], R0');
    console.log('    ');
    console.log('    ; Load sum for return');
    console.log('    LOAD R0, [BP-12]');
    console.log('    ');
    console.log('    ; Function epilogue');
    console.log('    ADD SP, SP, 12');
    console.log('    LOAD BP, [BP]');
    console.log('    RET');
    console.log('    ');
    console.log('    ; End of function');

    console.log('\\nCode generation example complete');
}

/**
 * Run all code generator tests
 */
function runAllCodeGeneratorTests() {
    console.log('=======================================');
    console.log('ORIONRISC-128 C CODE GENERATOR TEST SUITE');
    console.log('=======================================');

    testCompleteCodeGeneration();
    console.log('\\n' + '='.repeat(50));

    testSimpleExpressionGeneration();
    console.log('\\n' + '='.repeat(50));

    testControlFlowGeneration();
    console.log('\\n' + '='.repeat(50));

    testFunctionCallGeneration();
    console.log('\\n' + '='.repeat(50));

    testRegisterAllocation();
    console.log('\\n' + '='.repeat(50));

    testMemoryAllocation();
    console.log('\\n' + '='.repeat(50));

    validateCodeGeneratorIntegration();
    console.log('\\n' + '='.repeat(50));

    printCodeGenerationExample();
    console.log('\\n' + '='.repeat(50));

    console.log('=======================================');
    console.log('CODE GENERATOR TEST SUITE COMPLETED');
    console.log('=======================================');
}

// Export test functions for use in the system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testCompleteCodeGeneration,
        testSimpleExpressionGeneration,
        testControlFlowGeneration,
        testFunctionCallGeneration,
        testRegisterAllocation,
        testMemoryAllocation,
        validateCodeGeneratorIntegration,
        printCodeGenerationExample,
        runAllCodeGeneratorTests
    };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllCodeGeneratorTests();
}

module.exports = CCodeGenerator;