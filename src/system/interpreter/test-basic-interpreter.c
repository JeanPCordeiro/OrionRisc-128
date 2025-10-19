/**
 * OrionRisc-128 BASIC Interpreter Test Program
 * Tests the BASIC interpreter implementation
 */

#include "basic-interpreter.h"
#include <stdio.h>
#include <string.h>

int main() {
    BASICState state;
    int success;

    printf("OrionRisc-128 BASIC Interpreter Test\n");
    printf("=====================================\n\n");

    // Initialize the interpreter
    basic_init(&state);

    // Test 1: Simple variable assignment and arithmetic
    printf("Test 1: Variable assignment and arithmetic\n");
    printf("-----------------------------------------\n");

    success = basic_execute_line(&state, "LET A = 10");
    printf("LET A = 10: %s\n", success ? "OK" : "ERROR");

    success = basic_execute_line(&state, "LET B = 20");
    printf("LET B = 20: %s\n", success ? "OK" : "ERROR");

    success = basic_execute_line(&state, "LET C = A + B");
    printf("LET C = A + B: %s\n", success ? "OK" : "ERROR");

    printf("Variables after assignment:\n");
    basic_dump_variables(&state);
    printf("\n");

    // Test 2: PRINT statement
    printf("Test 2: PRINT statement\n");
    printf("----------------------\n");

    success = basic_execute_line(&state, "PRINT \"Hello, World!\"");
    printf("PRINT statement: %s\n", success ? "OK" : "ERROR");

    success = basic_execute_line(&state, "PRINT \"A = \"; A");
    printf("PRINT with variable: %s\n", success ? "OK" : "ERROR");
    printf("\n");

    // Test 3: Conditional statements
    printf("Test 3: Conditional statements\n");
    printf("-----------------------------\n");

    success = basic_execute_line(&state, "IF A < B THEN PRINT \"A is less than B\"");
    printf("IF statement: %s\n", success ? "OK" : "ERROR");

    success = basic_execute_line(&state, "IF A > B THEN PRINT \"A is greater than B\" ELSE PRINT \"A is not greater than B\"");
    printf("IF/ELSE statement: %s\n", success ? "OK" : "ERROR");
    printf("\n");

    // Test 4: Mathematical functions
    printf("Test 4: Mathematical functions\n");
    printf("-----------------------------\n");

    success = basic_execute_line(&state, "LET D = ABS(-5)");
    printf("ABS function: %s\n", success ? "OK" : "ERROR");

    success = basic_execute_line(&state, "LET E = SQR(16)");
    printf("SQR function: %s\n", success ? "OK" : "ERROR");

    printf("Variables after functions:\n");
    basic_dump_variables(&state);
    printf("\n");

    // Test 5: Array operations
    printf("Test 5: Array operations\n");
    printf("-----------------------\n");

    success = basic_execute_line(&state, "DIM ARR(5)");
    printf("DIM statement: %s\n", success ? "OK" : "ERROR");

    success = basic_execute_line(&state, "LET ARR(1) = 100");
    printf("Array assignment: %s\n", success ? "OK" : "ERROR");

    success = basic_execute_line(&state, "PRINT \"ARR(1) = \"; ARR(1)");
    printf("Array access: %s\n", success ? "OK" : "ERROR");
    printf("\n");

    // Test 6: Program loading and execution
    printf("Test 6: Program loading and execution\n");
    printf("------------------------------------\n");

    const char *testProgram =
        "10 PRINT \"Program test\"\n"
        "20 LET X = 5\n"
        "30 PRINT \"X = \"; X\n"
        "40 IF X = 5 THEN PRINT \"X equals 5\"\n"
        "50 END\n";

    success = basic_load_program(&state, testProgram);
    printf("Program loading: %s\n", success ? "OK" : "ERROR");

    if (success) {
        printf("Loaded program:\n");
        basic_dump_program(&state);
        printf("\n");

        printf("Program execution:\n");
        success = basic_run_program(&state);
        printf("Program execution: %s\n", success ? "OK" : "ERROR");
    }
    printf("\n");

    // Test 7: Error handling
    printf("Test 7: Error handling\n");
    printf("---------------------\n");

    success = basic_execute_line(&state, "LET Y = 10 / 0");
    printf("Division by zero: %s (expected error)\n", success ? "ERROR" : "OK");

    printf("Error state: %s\n", state.errorMessage);
    printf("\n");

    // Final state
    printf("Final interpreter state:\n");
    basic_dump_state(&state);

    printf("\nBASIC Interpreter Test Complete\n");
    return 0;
}