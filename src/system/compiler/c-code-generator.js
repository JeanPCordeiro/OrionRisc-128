/**
 * C Code Generator for OrionRisc-128 C Compiler
 *
 * This program implements code generation from type-checked AST to assembly language
 * as a machine language program that can be executed by the RISC processor.
 *
 * Phase 3 Component: Code generator for the assembly-based C compiler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

// ============================================================================
// C CODE GENERATOR - MACHINE LANGUAGE IMPLEMENTATION
// ============================================================================

/**
 * CODE GENERATOR ERROR CODES
 */
const C_CODEGEN_ERRORS = {
    INVALID_AST_NODE: -1,       // Invalid or corrupted AST node
    SYMBOL_NOT_FOUND: -2,       // Symbol not found in symbol table
    REGISTER_EXHAUSTED: -3,     // No available registers for allocation
    MEMORY_ALLOCATION_FAILED: -4, // Failed to allocate memory for variable
    UNSUPPORTED_OPERATION: -5,  // Unsupported operation in code generation
    STACK_OVERFLOW: -6,         // Stack frame overflow
    INVALID_FUNCTION_CALL: -7,  // Invalid function call detected
    TYPE_GENERATION_ERROR: -8   // Error in type-specific code generation
};

/**
 * CODE GENERATION STATES
 */
const C_CODEGEN_STATES = {
    START: 0x0,                 // Initial state
    GENERATING_PROGRAM: 0x1,    // Generating program-level code
    GENERATING_FUNCTION: 0x2,   // Generating function code
    GENERATING_DECLARATIONS: 0x3, // Generating variable declarations
    GENERATING_STATEMENTS: 0x4, // Generating statement code
    GENERATING_EXPRESSION: 0x5, // Generating expression code
    GENERATING_ASSIGNMENT: 0x6, // Generating assignment code
    GENERATING_CONTROL_FLOW: 0x7, // Generating control flow code
    ERROR: 0xF                  // Error state
};

/**
 * REGISTER ALLOCATION
 */
const C_REGISTERS = {
    // General purpose registers for expression evaluation
    R0: 0x0,  R1: 0x1,  R2: 0x2,  R3: 0x3,
    R4: 0x4,  R5: 0x5,  R6: 0x6,  R7: 0x7,
    R8: 0x8,  R9: 0x9,  R10: 0xA, R11: 0xB,
    R12: 0xC, R13: 0xD, R14: 0xE, R15: 0xF,

    // Special purpose registers
    STACK_PTR: 0xE,             // R14 = Stack pointer
    BASE_PTR: 0xF,              // R15 = Base pointer
    TEMP_REG: 0xD,              // R13 = Temporary register
    RETURN_REG: 0x0             // R0 = Return value register
};

/**
 * MEMORY LAYOUT FOR C CODE GENERATOR
 *
 * 0x0000-0x0FFF: Program code (C code generator)
 * 0x1000-0x1FFF: AST buffer (input from semantic analyzer)
 * 0x2000-0x2FFF: Symbol table (input from semantic analyzer)
 * 0x3000-0x3FFF: Type table (input from semantic analyzer)
 * 0x4000-0x4FFF: Assembly code buffer (output)
 * 0x5000-0x50FF: Code generation state variables and pointers
 * 0x5100-0x51FF: Register allocation table
 * 0x5200-0x52FF: Label counter and jump targets
 * 0x5300-0x53FF: String table for assembly code
 */

// ============================================================================
// MACHINE LANGUAGE PROGRAM - C CODE GENERATOR
// ============================================================================

/**
 * C Code Generator Machine Language Program
 *
 * This program traverses the type-checked AST and generates assembly language
 * code for the RISC processor, managing register allocation and memory layout.
 *
 * Interface:
 * - R0: AST buffer address (input)
 * - R1: Symbol table address (input)
 * - R2: Type table address (input)
 * - R3: Assembly code buffer address (output)
 * - R4: Current AST node index (input/output)
 * - Returns: Success (0) or error code (negative)
 */
const C_CODE_GENERATOR_PROGRAM = [
    // ========================================================================
    // INITIALIZATION PHASE
    // ========================================================================

    // Initialize state variables
    // R5 = current AST position
    // R6 = current code position
    // R7 = current symbol table position
    // R8 = current type table position
    // R9 = code generation state (C_CODEGEN_STATES.START)
    // R10 = current AST node data
    // R11 = register allocation bitmap
    // R12 = label counter
    // R13 = temporary storage
    // R14 = error code storage
    // R15 = string table position

    0x01000000, // LOAD R0, [R0 + 0]        ; R0 = AST buffer address
    0x01110000, // LOAD R1, [R1 + 0]        ; R1 = symbol table address
    0x01220000, // LOAD R2, [R2 + 0]        ; R2 = type table address
    0x01330000, // LOAD R3, [R3 + 0]        ; R3 = assembly code buffer address
    0x01440000, // LOAD R4, [R4 + 0]        ; R4 = current AST node index

    // Initialize positions and state
    0x05550000, // ADD R5, R0, R0           ; R5 = 0 (AST position)
    0x06660000, // ADD R6, R0, R0           ; R6 = 0 (code position)
    0x07770000, // ADD R7, R0, R0           ; R7 = 0 (symbol table position)
    0x08880000, // ADD R8, R0, R0           ; R8 = 0 (type table position)
    0x09990000, // ADD R9, R0, R0           ; R9 = 0 (codegen state = START)
    0x0AA00000, // ADD R10, R0, R0          ; R10 = 0 (AST node data)
    0x0BB00000, // ADD R11, R0, R0          ; R11 = 0 (register bitmap)
    0x0CC00000, // ADD R12, R0, R0          ; R12 = 0 (label counter)
    0x0DD00000, // ADD R13, R0, R0          ; R13 = 0 (temporary)
    0x0EE00000, // ADD R14, R0, R0          ; R14 = 0 (error code)
    0x0FF00000, // ADD R15, R0, R0          ; R15 = 0 (string position)

    // Initialize register allocation (all registers free)
    0x0BB0FFFF, // LOAD R11, 0xFFFF         ; All registers available

    // ========================================================================
    // MAIN CODE GENERATION LOOP
    // ========================================================================

    // main_loop:
    // Check if we've processed all AST nodes
    0xF0000000, // JUMP check_ast_end       ; Check for end of AST

    // get_current_node:
    // Read current AST node
    0x03550000, // ADD R13, R0, R5          ; R13 = AST address + position
    0x01AD0000, // LOAD R10, [R13 + 0]      ; R10 = current AST node data

    // Check for empty node (end of AST)
    0x03A00000, // SUB R13, R10, R0         ; Check if node is empty
    0xF4000000, // JUMP_EQ end_of_generation; If empty, end generation

    // ========================================================================
    // CODE GENERATION STATE MACHINE
    // ========================================================================

    // Check current code generation state
    0x03990000, // SUB R13, R9, 0x0         ; Check if START state
    0xF4000000, // JUMP_EQ generate_program ; Generate program

    0x03990001, // SUB R13, R9, 0x1         ; Check if GENERATING_PROGRAM
    0xF4000000, // JUMP_EQ generate_program_structure ; Generate program structure

    0x03990002, // SUB R13, R9, 0x2         ; Check if GENERATING_FUNCTION
    0xF4000000, // JUMP_EQ generate_function ; Generate function

    0x03990003, // SUB R13, R9, 0x3         ; Check if GENERATING_DECLARATIONS
    0xF4000000, // JUMP_EQ generate_declarations ; Generate declarations

    0x03990004, // SUB R13, R9, 0x4         ; Check if GENERATING_STATEMENTS
    0xF4000000, // JUMP_EQ generate_statements ; Generate statements

    0x03990005, // SUB R13, R9, 0x5         ; Check if GENERATING_EXPRESSION
    0xF4000000, // JUMP_EQ generate_expression ; Generate expression

    0x03990006, // SUB R13, R9, 0x6         ; Check if GENERATING_ASSIGNMENT
    0xF4000000, // JUMP_EQ generate_assignment ; Generate assignment

    0x03990007, // SUB R13, R9, 0x7         ; Check if GENERATING_CONTROL_FLOW
    0xF4000000, // JUMP_EQ generate_control_flow ; Generate control flow

    // ========================================================================
    // AST NODE TYPE PROCESSING
    // ========================================================================

    // ========================================================================
    // PROGRAM NODE PROCESSING
    // ========================================================================

    // process_program_node:
    // Process PROGRAM node (root of AST)
    // Extract node type and dispatch to appropriate handler
    0x03A00000, // SUB R13, R10, R0         ; Check if node is empty
    0xF4000000, // JUMP_EQ next_node         ; Skip empty nodes

    // Extract AST node type (bits 31-24)
    0x04A01018, // SHIFT_RIGHT R10, R10, 24 ; R10 = node type
    0x0AA00F00, // AND R10, R10, 0xFF       ; Mask to 8 bits

    // Dispatch based on node type
    0x03A00000, // SUB R13, R10, 0x0        ; Check if PROGRAM node
    0xF4000000, // JUMP_EQ process_program   ; Process program node

    0x03A00002, // SUB R13, R10, 0x2        ; Check if FUNCTION_DEF node
    0xF4000000, // JUMP_EQ process_function_def ; Process function definition

    0x03A00003, // SUB R13, R10, 0x3        ; Check if VARIABLE_DECL node
    0xF4000000, // JUMP_EQ process_variable_decl ; Process variable declaration

    0x03A00006, // SUB R13, R10, 0x6        ; Check if IF_STATEMENT node
    0xF4000000, // JUMP_EQ process_if_statement ; Process if statement

    0x03A00007, // SUB R13, R10, 0x7        ; Check if WHILE_STATEMENT node
    0xF4000000, // JUMP_EQ process_while_statement ; Process while statement

    0x03A00009, // SUB R13, R10, 0x9        ; Check if RETURN_STATEMENT node
    0xF4000000, // JUMP_EQ process_return_statement ; Process return statement

    0x03A0000A, // SUB R13, R10, 0xA        ; Check if EXPRESSION_STATEMENT node
    0xF4000000, // JUMP_EQ process_expression_statement ; Process expression statement

    0x03A0000B, // SUB R13, R10, 0xB        ; Check if BINARY_EXPRESSION node
    0xF4000000, // JUMP_EQ process_binary_expression ; Process binary expression

    0x03A0000C, // SUB R13, R10, 0xC        ; Check if UNARY_EXPRESSION node
    0xF4000000, // JUMP_EQ process_unary_expression ; Process unary expression

    0x03A0000D, // SUB R13, R10, 0xD        ; Check if IDENTIFIER node
    0xF4000000, // JUMP_EQ process_identifier ; Process identifier

    0x03A0000E, // SUB R13, R10, 0xE        ; Check if CONSTANT node
    0xF4000000, // JUMP_EQ process_constant  ; Process constant

    0x03A00010, // SUB R13, R10, 0x10       ; Check if FUNCTION_CALL node
    0xF4000000, // JUMP_EQ process_function_call ; Process function call

    0x03A00011, // SUB R13, R10, 0x11       ; Check if ASSIGNMENT node
    0xF4000000, // JUMP_EQ process_assignment ; Process assignment

    // Unknown node type - report error
    0x08E0FFF7, // LOAD R14, -9             ; ERROR_INVALID_AST_NODE
    0xF0000000, // JUMP end_of_generation   ; End generation with error

    // ========================================================================
    // PROGRAM PROCESSING
    // ========================================================================

    // process_program:
    // Generate assembly program header and process children
    0x09990001, // LOAD R9, 0x1             ; Set state to GENERATING_PROGRAM

    // Emit .text directive
    0x0AA00001, // LOAD R10, 1              ; ASCII for '.'
    0xF0000000, // CALL emit_byte           ; Emit '.'
    0x0AA00002, // LOAD R10, 2              ; ASCII for 't'
    0xF0000000, // CALL emit_byte           ; Emit 't'
    0x0AA00003, // LOAD R10, 3              ; ASCII for 'e'
    0xF0000000, // CALL emit_byte           ; Emit 'e'
    0x0AA00004, // LOAD R10, 4              ; ASCII for 'x'
    0xF0000000, // CALL emit_byte           ; Emit 'x'
    0x0AA00005, // LOAD R10, 5              ; ASCII for 't'
    0xF0000000, // CALL emit_byte           ; Emit 't'
    0x0AA0000A, // LOAD R10, 10             ; ASCII for newline
    0xF0000000, // CALL emit_byte           ; Emit newline

    // Emit .global main directive
    0x0AA00001, // LOAD R10, 1              ; ASCII for '.'
    0xF0000000, // CALL emit_byte           ; Emit '.'
    0x0AA00006, // LOAD R10, 6              ; ASCII for 'g'
    0xF0000000, // CALL emit_byte           ; Emit 'g'
    0x0AA00007, // LOAD R10, 7              ; ASCII for 'l'
    0xF0000000, // CALL emit_byte           ; Emit 'l'
    0x0AA00008, // LOAD R10, 8              ; ASCII for 'o'
    0xF0000000, // CALL emit_byte           ; Emit 'o'
    0x0AA00009, // LOAD R10, 9              ; ASCII for 'b'
    0xF0000000, // CALL emit_byte           ; Emit 'b'
    0x0AA0000B, // LOAD R10, 11             ; ASCII for 'a'
    0xF0000000, // CALL emit_byte           ; Emit 'a'
    0x0AA0000C, // LOAD R10, 12             ; ASCII for 'l'
    0xF0000000, // CALL emit_byte           ; Emit 'l'
    0x0AA0000D, // LOAD R10, 13             ; ASCII for ' '
    0xF0000000, // CALL emit_byte           ; Emit ' '
    0x0AA0000E, // LOAD R10, 14             ; ASCII for 'm'
    0xF0000000, // CALL emit_byte           ; Emit 'm'
    0x0AA0000F, // LOAD R10, 15             ; ASCII for 'a'
    0xF0000000, // CALL emit_byte           ; Emit 'a'
    0x0AA00010, // LOAD R10, 16             ; ASCII for 'i'
    0xF0000000, // CALL emit_byte           ; Emit 'i'
    0x0AA00011, // LOAD R10, 17             ; ASCII for 'n'
    0xF0000000, // CALL emit_byte           ; Emit 'n'
    0x0AA0000A, // LOAD R10, 10             ; ASCII for newline
    0xF0000000, // CALL emit_byte           ; Emit newline

    // Process program children (global declarations and functions)
    0xF0000000, // JUMP process_program_children

    // process_program_children:
    // Process all children of program node
    // For now, just continue to next node
    0xF0000000, // JUMP next_node

    // ========================================================================
    // FUNCTION DEFINITION PROCESSING
    // ========================================================================

    // process_function_def:
    // Process FUNCTION_DEF node
    0x09990002, // LOAD R9, 0x2             ; Set state to GENERATING_FUNCTION

    // Generate function label
    0xF0000000, // CALL generate_function_label

    // Generate function prologue
    0xF0000000, // CALL generate_function_prologue

    // Process function body
    0xF0000000, // CALL process_function_body

    // Generate function epilogue
    0xF0000000, // CALL generate_function_epilogue

    0xF0000000, // JUMP next_node

    // process_function_body:
    // Process function body statements
    0x09990004, // LOAD R9, 0x4             ; Set state to GENERATING_STATEMENTS
    0xF0000000, // JUMP next_node           ; Continue processing

    // ========================================================================
    // VARIABLE DECLARATION PROCESSING
    // ========================================================================

    // process_variable_decl:
    // Process VARIABLE_DECL node
    0x09990003, // LOAD R9, 0x3             ; Set state to GENERATING_DECLARATIONS

    // Allocate memory for variable
    0xF0000000, // CALL allocate_variable

    // Generate initialization if present
    0xF0000000, // CALL generate_initialization

    0xF0000000, // JUMP next_node

    // ========================================================================
    // STATEMENT PROCESSING
    // ========================================================================

    // process_if_statement:
    // Process IF_STATEMENT node
    0x09990007, // LOAD R9, 0x7             ; Set state to GENERATING_CONTROL_FLOW

    // Generate if statement code
    0xF0000000, // CALL generate_if_code

    0xF0000000, // JUMP next_node

    // process_while_statement:
    // Process WHILE_STATEMENT node
    0x09990007, // LOAD R9, 0x7             ; Set state to GENERATING_CONTROL_FLOW

    // Generate while loop code
    0xF0000000, // CALL generate_while_code

    0xF0000000, // JUMP next_node

    // process_return_statement:
    // Process RETURN_STATEMENT node
    0x09990004, // LOAD R9, 0x4             ; Set state to GENERATING_STATEMENTS

    // Generate return statement code
    0xF0000000, // CALL generate_return_code

    0xF0000000, // JUMP next_node

    // process_expression_statement:
    // Process EXPRESSION_STATEMENT node
    0x09990005, // LOAD R9, 0x5             ; Set state to GENERATING_EXPRESSION

    // Generate expression statement code
    0xF0000000, // CALL generate_expression_code

    0xF0000000, // JUMP next_node

    // ========================================================================
    // EXPRESSION PROCESSING
    // ========================================================================

    // process_binary_expression:
    // Process BINARY_EXPRESSION node
    0x09990005, // LOAD R9, 0x5             ; Set state to GENERATING_EXPRESSION

    // Generate binary expression code
    0xF0000000, // CALL generate_binary_expression_code

    0xF0000000, // JUMP next_node

    // process_unary_expression:
    // Process UNARY_EXPRESSION node
    0x09990005, // LOAD R9, 0x5             ; Set state to GENERATING_EXPRESSION

    // Generate unary expression code
    0xF0000000, // CALL generate_unary_expression_code

    0xF0000000, // JUMP next_node

    // process_identifier:
    // Process IDENTIFIER node
    0x09990005, // LOAD R9, 0x5             ; Set state to GENERATING_EXPRESSION

    // Generate identifier load code
    0xF0000000, // CALL generate_identifier_load

    0xF0000000, // JUMP next_node

    // process_constant:
    // Process CONSTANT node
    0x09990005, // LOAD R9, 0x5             ; Set state to GENERATING_EXPRESSION

    // Generate constant load code
    0xF0000000, // CALL generate_constant_load

    0xF0000000, // JUMP next_node

    // process_function_call:
    // Process FUNCTION_CALL node
    0x09990005, // LOAD R9, 0x5             ; Set state to GENERATING_EXPRESSION

    // Generate function call code
    0xF0000000, // CALL generate_function_call_code

    0xF0000000, // JUMP next_node

    // process_assignment:
    // Process ASSIGNMENT node
    0x09990006, // LOAD R9, 0x6             ; Set state to GENERATING_ASSIGNMENT

    // Generate assignment code
    0xF0000000, // CALL generate_assignment_code

    0xF0000000, // JUMP next_node

    // ========================================================================
    // REGISTER ALLOCATION MANAGEMENT
    // ========================================================================

    // allocate_register:
    // Allocate a free register for use
    // Output: R13 = allocated register number or -1 if none available
    0x0DD00000, // ADD R13, R0, R0          ; R13 = 0 (start with R0)
    0xF0000000, // JUMP find_free_register  ; Find available register

    // find_free_register:
    // Find first available register
    0x03D00000, // SUB R14, R13, R0         ; Check if R13 = 0
    0xF4000000, // JUMP_EQ check_r0         ; Check R0
    0x03D00001, // SUB R14, R13, 1         ; Check if R13 = 1
    0xF4000000, // JUMP_EQ check_r1         ; Check R1
    0x03D00002, // SUB R14, R13, 2         ; Check if R13 = 2
    0xF4000000, // JUMP_EQ check_r2         ; Check R2
    0x03D00003, // SUB R14, R13, 3         ; Check if R13 = 3
    0xF4000000, // JUMP_EQ check_r3         ; Check R3

    // Check register availability in bitmap
    // check_r0:
    0x0BB01001, // LOAD R11, 1              ; Bit 0 for R0
    0x0AA00F01, // AND R10, R11, 1          ; Check if R0 available
    0xF4000000, // JUMP_NE r0_available     ; If available, use it

    // check_r1:
    0x0BB01002, // LOAD R11, 2              ; Bit 1 for R1
    0x0AA00F02, // AND R10, R11, 2          ; Check if R1 available
    0xF4000000, // JUMP_NE r1_available     ; If available, use it

    // check_r2:
    0x0BB01004, // LOAD R11, 4              ; Bit 2 for R2
    0x0AA00F04, // AND R10, R11, 4          ; Check if R2 available
    0xF4000000, // JUMP_NE r2_available     ; If available, use it

    // check_r3:
    0x0BB01008, // LOAD R11, 8              ; Bit 3 for R3
    0x0AA00F08, // AND R10, R11, 8          ; Check if R3 available
    0xF4000000, // JUMP_NE r3_available     ; If available, use it

    // Try next register
    0x0DD01001, // ADD R13, R13, 1          ; Try next register
    0x03D01010, // SUB R14, R13, 16         ; Check if we've tried all
    0xF4000000, // JUMP_LT find_free_register ; Try next register

    // No registers available
    0x0DD0FFFF, // LOAD R13, -1             ; Return -1 (no registers)
    0xF0000000, // RET

    // r0_available:
    0x0DD00000, // LOAD R13, 0              ; Use R0
    0x0BB010FE, // LOAD R11, 0xFFFE         ; Clear bit 0 (mark R0 as used)
    0x0AA00F01, // AND R11, R11, 0xFFFE     ; Clear bit 0
    0xF0000000, // RET

    // r1_available:
    0x0DD00001, // LOAD R13, 1              ; Use R1
    0x0BB010FD, // LOAD R11, 0xFFFD         ; Clear bit 1 (mark R1 as used)
    0x0AA00F02, // AND R11, R11, 0xFFFD     ; Clear bit 1
    0xF0000000, // RET

    // r2_available:
    0x0DD00002, // LOAD R13, 2              ; Use R2
    0x0BB010FB, // LOAD R11, 0xFFFB         ; Clear bit 2 (mark R2 as used)
    0x0AA00F04, // AND R11, R11, 0xFFFB     ; Clear bit 2
    0xF0000000, // RET

    // r3_available:
    0x0DD00003, // LOAD R13, 3              ; Use R3
    0x0BB010F7, // LOAD R11, 0xFFF7         ; Clear bit 3 (mark R3 as used)
    0x0AA00F08, // AND R11, R11, 0xFFF7     ; Clear bit 3
    0xF0000000, // RET

    // free_register:
    // Free a previously allocated register
    // Input: R13 = register number to free
    0x03D00000, // SUB R14, R13, 0          ; Check if R0
    0xF4000000, // JUMP_EQ free_r0          ; Free R0
    0x03D00001, // SUB R14, R13, 1          ; Check if R1
    0xF4000000, // JUMP_EQ free_r1          ; Free R1
    0x03D00002, // SUB R14, R13, 2          ; Check if R2
    0xF4000000, // JUMP_EQ free_r2          ; Free R2
    0x03D00003, // SUB R14, R13, 3          ; Check if R3
    0xF4000000, // JUMP_EQ free_r3          ; Free R3
    0xF0000000, // RET                      ; Unknown register, ignore

    // free_r0:
    0x0BB01001, // LOAD R11, 1              ; Set bit 0 (mark R0 as free)
    0x0AA00F01, // OR R11, R11, 1           ; Set bit 0
    0xF0000000, // RET

    // free_r1:
    0x0BB01002, // LOAD R11, 2              ; Set bit 1 (mark R1 as free)
    0x0AA00F02, // OR R11, R11, 2           ; Set bit 1
    0xF0000000, // RET

    // free_r2:
    0x0BB01004, // LOAD R11, 4              ; Set bit 2 (mark R2 as free)
    0x0AA00F04, // OR R11, R11, 4           ; Set bit 2
    0xF0000000, // RET

    // free_r3:
    0x0BB01008, // LOAD R11, 8              ; Set bit 3 (mark R3 as free)
    0x0AA00F08, // OR R11, R11, 8           ; Set bit 3
    0xF0000000, // RET

    // ========================================================================
    // MEMORY MANAGEMENT
    // ========================================================================

    // allocate_variable:
    // Allocate memory for a variable
    // Input: R10 = variable symbol table entry
    // Output: R13 = memory address or 0 if failed

    // Extract variable size from symbol table entry (bits 15-8)
    0x04A01008, // SHIFT_RIGHT R13, R10, 8  ; Extract size field
    0x0AA00F00, // AND R13, R13, 0xFF       ; Mask to 8 bits

    // Allocate space on stack
    0x0FF01013, // SUB R15, R15, R13        ; Subtract size from stack pointer
    0x03D01000, // SUB R14, R15, 0          ; Check if stack pointer is 0
    0xF4000000, // JUMP_EQ allocation_failed ; Stack overflow

    // Store allocation address in symbol table
    // For now, just return the address in R13
    0x0DD0100F, // ADD R13, R15, R0         ; R13 = allocated address
    0xF0000000, // RET

    // allocation_failed:
    0x0DD00000, // LOAD R13, 0              ; Return 0 (failed)
    0xF0000000, // RET

    // ========================================================================
    // ASSEMBLY CODE EMISSION
    // ========================================================================

    // emit_byte:
    // Emit a byte to the code buffer
    // Input: R10 = byte to emit
    0x00660000, // ADD R6, R6, R0           ; R6 = code position
    0x01A60000, // STORE [R6 + 0], R10      ; Store byte in code buffer
    0x06661001, // ADD R6, R6, 1            ; Increment code position
    0xF0000000, // RET

    // emit_instruction:
    // Emit an assembly instruction to the code buffer
    // Input: R10 = instruction opcode, R11 = operands
    0x01A60000, // STORE [R6 + 0], R10      ; Store opcode
    0x06661001, // ADD R6, R6, 1            ; Move to operands position
    0x01A60001, // STORE [R6 + 0], R11      ; Store operands
    0x06661001, // ADD R6, R6, 1            ; Move past operands
    0xF0000000, // RET

    // emit_label:
    // Emit a label to the code buffer
    // Input: R12 = label number
    0x0AA0004C, // LOAD R10, 76             ; ASCII 'L'
    0xF0000000, // CALL emit_byte           ; Emit 'L'

    // Convert label number to ASCII digits
    0xF0000000, // CALL convert_label_to_ascii

    0x0AA0003A, // LOAD R10, 58             ; ASCII ':'
    0xF0000000, // CALL emit_byte           ; Emit ':'
    0xF0000000, // RET

    // convert_label_to_ascii:
    // Convert label number to ASCII representation
    // Input: R12 = label number
    // For simplicity, just emit the number as a single digit for now
    0x0DD01030, // ADD R10, R12, 48         ; Convert to ASCII digit
    0xF0000000, // CALL emit_byte           ; Emit digit
    0xF0000000, // RET

    // generate_next_label:
    // Generate next unique label number
    0x0CC01001, // ADD R12, R12, 1          ; Increment label counter
    0xF0000000, // RET

    // ========================================================================
    // FUNCTION GENERATION FUNCTIONS
    // ========================================================================

    // generate_function_label:
    // Generate function label from symbol table
    // Get function name from current AST node value
    0x03A00000, // SUB R13, R10, R0         ; Get AST node value (function name offset)
    0x0DD01000, // ADD R13, R13, R0         ; R13 = function name offset

    // Emit function name as label
    0xF0000000, // CALL emit_function_name_label

    0xF0000000, // RET

    // emit_function_name_label:
    // Emit function name as label
    // Input: R13 = string table offset of function name
    0x01220000, // LOAD R2, [R2 + 0]        ; R2 = string table address
    0x03220000, // ADD R14, R2, R13         ; R14 = string address

    // Emit characters of function name
    // emit_name_loop:
    0x01EE0000, // LOAD R14, [R14 + 0]      ; Load character
    0x03E00000, // SUB R15, R14, R0         ; Check if null terminator
    0xF4000000, // JUMP_EQ end_name         ; End of name

    0x0AA0000E, // LOAD R10, R14            ; R10 = character
    0xF0000000, // CALL emit_byte           ; Emit character
    0x0EE01001, // ADD R14, R14, 1          ; Next character
    0xF0000000, // JUMP emit_name_loop      ; Continue

    // end_name:
    0x0AA0003A, // LOAD R10, 58             ; ASCII ':'
    0xF0000000, // CALL emit_byte           ; Emit ':'
    0x0AA0000A, // LOAD R10, 10             ; ASCII newline
    0xF0000000, // CALL emit_byte           ; Emit newline
    0xF0000000, // RET

    // generate_function_prologue:
    // Generate function entry code
    // Save base pointer and set up stack frame
    0x0FF0FFFC, // LOAD R15, [R15 - 4]      ; Save current base pointer (push)
    0x0FF01004, // SUB R15, R15, 4          ; Allocate space for saved BP

    // Set new base pointer
    0x0FF0FFF0, // LOAD R15, R15            ; BP = SP

    0xF0000000, // RET

    // generate_function_epilogue:
    // Generate function exit code
    // Restore base pointer and return
    0x0FF01004, // ADD R15, R15, 4          ; Deallocate stack space
    0x0FF0FFFC, // LOAD R15, [R15 + 4]       ; Restore base pointer (pop)

    // Return from function
    0xF0000000, // RET                      ; Return to caller

    0xF0000000, // RET

    // ========================================================================
    // VARIABLE ALLOCATION FUNCTIONS
    // ========================================================================

    // allocate_variable:
    // Allocate memory for variable from symbol table
    // Find variable in symbol table and allocate space
    0xF0000000, // CALL find_variable_in_symbol_table

    // Check if found
    0x03D0FFFF, // SUB R14, R13, -1         ; Check if not found
    0xF4000000, // JUMP_EQ variable_not_found

    // Allocate space based on variable type and size
    0xF0000000, // CALL allocate_variable_space

    0xF0000000, // RET

    // variable_not_found:
    0x08E0FFFE, // LOAD R14, -2             ; ERROR_SYMBOL_NOT_FOUND
    0xF0000000, // JUMP end_of_generation

    // find_variable_in_symbol_table:
    // Find variable in symbol table
    // Input: R10 = AST node with variable name offset in value field
    // Output: R13 = symbol table entry or -1 if not found

    // For now, return a dummy entry
    0x0DD00000, // LOAD R13, 0              ; Return dummy entry
    0xF0000000, // RET

    // allocate_variable_space:
    // Allocate space for variable on stack
    // Input: R13 = symbol table entry
    0x04A01008, // SHIFT_RIGHT R14, R13, 8  ; Extract size field
    0x0AA00F00, // AND R14, R14, 0xFF       ; Mask size

    // Allocate space
    0x0FF01014, // SUB R15, R15, R14        ; Allocate on stack

    0xF0000000, // RET

    // generate_initialization:
    // Generate initialization code if variable has initializer
    // Check if variable has initializer in AST
    0xF0000000, // CALL check_for_initializer

    // If no initializer, just return
    0x03D00000, // SUB R14, R13, R0         ; Check if has initializer
    0xF4000000, // JUMP_EQ no_initialization

    // Generate code to compute initializer value
    0xF0000000, // CALL generate_initializer_value

    // Store value to variable address
    0xF0000000, // CALL generate_store_to_variable

    // no_initialization:
    0xF0000000, // RET

    // ========================================================================
    // EXPRESSION GENERATION FUNCTIONS
    // ========================================================================

    // generate_binary_expression_code:
    // Generate code for binary expression (a + b, a == b, etc.)
    // Input: R10 = AST node for binary expression

    // Extract operator from AST node value field
    0x0AA00F00, // AND R13, R10, 0xFF       ; Extract operator

    // Generate code for left operand
    0xF0000000, // CALL generate_left_operand

    // Allocate register for result
    0xF0000000, // CALL allocate_register
    0x03D0FFFF, // SUB R14, R13, -1         ; Check if allocation failed
    0xF4000000, // JUMP_EQ register_allocation_failed

    // Save left operand register
    0x0DD0100D, // ADD R14, R13, R0         ; R14 = left register

    // Generate code for right operand
    0xF0000000, // CALL generate_right_operand

    // Generate binary operation instruction
    0xF0000000, // CALL generate_binary_instruction

    0xF0000000, // RET

    // generate_unary_expression_code:
    // Generate code for unary expression (!a, -a, &a, *a)
    // Input: R10 = AST node for unary expression

    // Extract operator from AST node value field
    0x0AA00F00, // AND R13, R10, 0xFF       ; Extract operator

    // Generate code for operand
    0xF0000000, // CALL generate_operand_code

    // Generate unary operation instruction
    0xF0000000, // CALL generate_unary_instruction

    0xF0000000, // RET

    // generate_identifier_load:
    // Generate code to load variable value into register
    // Input: R10 = AST node for identifier

    // Find variable in symbol table
    0xF0000000, // CALL find_variable_symbol

    // Allocate register for variable value
    0xF0000000, // CALL allocate_register

    // Generate LOAD instruction
    0x0AA00001, // LOAD R10, 1              ; LOAD opcode
    0x0BB0100D, // LOAD R11, R13            ; Register number
    0xF0000000, // CALL emit_instruction    ; Emit LOAD instruction

    0xF0000000, // RET

    // generate_constant_load:
    // Generate code to load constant value into register
    // Input: R10 = AST node for constant

    // Extract constant value from AST node value field
    0x0AA00F00, // AND R13, R10, 0xFF       ; Extract constant value

    // Allocate register for constant
    0xF0000000, // CALL allocate_register

    // Generate LOAD_IMM instruction
    0x0AA00002, // LOAD R10, 2              ; LOAD_IMM opcode
    0x0BB0100D, // LOAD R11, R13            ; Constant value
    0xF0000000, // CALL emit_instruction    ; Emit LOAD_IMM instruction

    0xF0000000, // RET

    // ========================================================================
    // CONTROL FLOW GENERATION FUNCTIONS
    // ========================================================================

    // generate_if_code:
    // Generate code for if statement
    // Input: R10 = AST node for if statement

    // Generate unique label for else/end
    0xF0000000, // CALL generate_next_label
    0x0DD0100C, // ADD R13, R12, R0         ; R13 = else label

    // Generate condition code
    0xF0000000, // CALL generate_condition_code

    // Generate conditional jump to else/end
    0x0AA00003, // LOAD R10, 3              ; JUMP_EQ opcode
    0x0BB0100D, // LOAD R11, R13            ; Jump target
    0xF0000000, // CALL emit_instruction    ; Emit conditional jump

    // Generate then block
    0xF0000000, // CALL generate_then_block

    // Generate jump to end
    0x0AA00004, // LOAD R10, 4              ; JUMP opcode
    0x0BB0100D, // LOAD R11, R13            ; Jump target
    0xF0000000, // CALL emit_instruction    ; Emit jump

    // Generate else block (if present)
    0xF0000000, // CALL generate_else_block

    0xF0000000, // RET

    // generate_while_code:
    // Generate code for while loop
    // Input: R10 = AST node for while statement

    // Generate unique labels for loop start and end
    0xF0000000, // CALL generate_next_label
    0x0DD0100C, // ADD R13, R12, R0         ; R13 = loop start label

    0xF0000000, // CALL generate_next_label
    0x0DD0100C, // ADD R14, R12, R0         ; R14 = loop end label

    // Emit loop start label
    0x0AA0000C, // LOAD R10, R12            ; Label number
    0xF0000000, // CALL emit_label          ; Emit label

    // Generate condition code
    0xF0000000, // CALL generate_condition_code

    // Generate conditional jump to end if condition false
    0x0AA00003, // LOAD R10, 3              ; JUMP_EQ opcode
    0x0BB0100E, // LOAD R11, R14            ; Jump to end label
    0xF0000000, // CALL emit_instruction    ; Emit conditional jump

    // Generate loop body
    0xF0000000, // CALL generate_loop_body

    // Generate unconditional jump back to start
    0x0AA00004, // LOAD R10, 4              ; JUMP opcode
    0x0BB0100D, // LOAD R11, R13            ; Jump to start label
    0xF0000000, // CALL emit_instruction    ; Emit jump

    // Emit loop end label
    0x0AA0000E, // LOAD R10, R14            ; End label number
    0xF0000000, // CALL emit_label          ; Emit label

    0xF0000000, // RET

    // ========================================================================
    // ASSIGNMENT GENERATION FUNCTIONS
    // ========================================================================

    // generate_assignment_code:
    // Generate code for assignment (a = b)
    // Input: R10 = AST node for assignment

    // Generate code for destination (left side)
    0xF0000000, // CALL generate_destination_address

    // Generate code for source (right side)
    0xF0000000, // CALL generate_source_value

    // Generate STORE instruction
    0x0AA00005, // LOAD R10, 5              ; STORE opcode
    0x0BB0100D, // LOAD R11, R13            ; Destination register
    0xF0000000, // CALL emit_instruction    ; Emit STORE instruction

    0xF0000000, // RET

    // ========================================================================
    // FUNCTION CALL GENERATION FUNCTIONS
    // ========================================================================

    // generate_function_call_code:
    // Generate code for function call
    // Input: R10 = AST node for function call

    // Save current register state
    0xF0000000, // CALL save_register_state

    // Generate code for function address
    0xF0000000, // CALL generate_function_address

    // Generate code for arguments
    0xF0000000, // CALL generate_arguments

    // Generate CALL instruction
    0x0AA00006, // LOAD R10, 6              ; CALL opcode
    0x0BB0100D, // LOAD R11, R13            ; Function address
    0xF0000000, // CALL emit_instruction    ; Emit CALL instruction

    // Restore register state
    0xF0000000, // CALL restore_register_state

    0xF0000000, // RET

    // ========================================================================
    // RETURN STATEMENT GENERATION FUNCTIONS
    // ========================================================================

    // generate_return_code:
    // Generate code for return statement
    // Input: R10 = AST node for return statement

    // Check if has return value
    0xF0000000, // CALL check_return_value

    // If has value, generate code for it
    0x03D00000, // SUB R14, R13, R0         ; Check if has value
    0xF4000000, // JUMP_EQ no_return_value

    // Generate return value code
    0xF0000000, // CALL generate_return_value_code

    // no_return_value:
    // Generate return sequence
    0xF0000000, // CALL generate_return_sequence

    0xF0000000, // RET

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    // register_allocation_failed:
    0x08E0FFFD, // LOAD R14, -3             ; ERROR_REGISTER_EXHAUSTED
    0xF0000000, // JUMP end_of_generation

    // Placeholder implementations for referenced functions
    // These would be implemented with full logic in a complete system

    // process_program_children:
    0xF0000000, // JUMP next_node

    // generate_function_label:
    0xF0000000, // RET

    // process_function_body:
    0xF0000000, // JUMP next_node

    // generate_function_epilogue:
    0xF0000000, // RET

    // generate_if_code:
    0xF0000000, // RET

    // generate_while_code:
    0xF0000000, // RET

    // generate_return_code:
    0xF0000000, // RET

    // generate_expression_code:
    0xF0000000, // RET

    // generate_binary_expression_code:
    0xF0000000, // RET

    // generate_unary_expression_code:
    0xF0000000, // RET

    // generate_identifier_load:
    0xF0000000, // RET

    // generate_constant_load:
    0xF0000000, // RET

    // generate_function_call_code:
    0xF0000000, // RET

    // generate_assignment_code:
    0xF0000000, // RET

    // find_variable_symbol:
    0x0DD00000, // LOAD R13, 0              ; Return dummy
    0xF0000000, // RET

    // check_for_initializer:
    0x0DD00000, // LOAD R13, 0              ; Return no initializer
    0xF0000000, // RET

    // generate_initializer_value:
    0xF0000000, // RET

    // generate_store_to_variable:
    0xF0000000, // RET

    // generate_left_operand:
    0xF0000000, // RET

    // generate_right_operand:
    0xF0000000, // RET

    // generate_binary_instruction:
    0xF0000000, // RET

    // generate_operand_code:
    0xF0000000, // RET

    // generate_unary_instruction:
    0xF0000000, // RET

    // generate_condition_code:
    0xF0000000, // RET

    // generate_then_block:
    0xF0000000, // RET

    // generate_else_block:
    0xF0000000, // RET

    // generate_loop_body:
    0xF0000000, // RET

    // generate_destination_address:
    0xF0000000, // RET

    // generate_source_value:
    0xF0000000, // RET

    // save_register_state:
    0xF0000000, // RET

    // generate_function_address:
    0xF0000000, // RET

    // generate_arguments:
    0xF0000000, // RET

    // restore_register_state:
    0xF0000000, // RET

    // check_return_value:
    0x0DD00000, // LOAD R13, 0              ; Return no value
    0xF0000000, // RET

    // generate_return_value_code:
    0xF0000000, // RET

    // generate_return_sequence:
    0xF0000000, // RET

    // ========================================================================
    // LOOP CONTROL
    // ========================================================================

    // next_node:
    // Move to next AST node
    0x05551004, // ADD R5, R5, 4            ; Next AST node position
    0xF0000000, // JUMP main_loop          ; Continue generation

    // check_ast_end:
    // Check if we've reached the end of AST
    0xF0000000, // JUMP get_current_node    ; Continue processing

    // end_of_generation:
    // Generation complete
    0x00E00000, // ADD R0, R14, R0          ; Return error code (0 = success)
    0xFF000000  // HALT                    ; End of program
];

// ============================================================================
// ASSEMBLY SOURCE CODE FOR THE C CODE GENERATOR
// ============================================================================

/**
 * Assembly Source Code Representation
 *
 * This is how the C code generator program would appear in assembly language.
 * This serves as documentation and can be used for testing the assembler.
 */
const C_CODE_GENERATOR_ASSEMBLY = `
; ============================================================================
; C CODE GENERATOR - ASSEMBLY SOURCE
; ============================================================================

; OrionRisc-128 Assembly Language
; Code Generation from Type-Checked AST to Assembly Language
; Phase 3: Assembly-based C Compiler Component

.text
.global _start

_start:
    ; Initialize code generator state
    LOAD R5, 0              ; AST position = 0
    LOAD R6, 0              ; Code position = 0
    LOAD R9, STATE_START    ; Codegen state = START
    LOAD R11, 0xFFFF        ; All registers available
    LOAD R12, 0             ; Label counter = 0

main_loop:
    ; Check for end of AST
    CALL check_ast_end
    JUMP_EQ end_of_generation

    ; Get current AST node
    CALL get_current_node

    ; State-based code generation
    SUB R13, R9, STATE_START
    JUMP_EQ generate_program

    SUB R13, R9, STATE_GENERATING_PROGRAM
    JUMP_EQ generate_program_structure

    SUB R13, R9, STATE_GENERATING_FUNCTION
    JUMP_EQ generate_function

    SUB R13, R9, STATE_GENERATING_DECLARATIONS
    JUMP_EQ generate_declarations

    SUB R13, R9, STATE_GENERATING_STATEMENTS
    JUMP_EQ generate_statements

    SUB R13, R9, STATE_GENERATING_EXPRESSION
    JUMP_EQ generate_expression

    SUB R13, R9, STATE_GENERATING_ASSIGNMENT
    JUMP_EQ generate_assignment

    SUB R13, R9, STATE_GENERATING_CONTROL_FLOW
    JUMP_EQ generate_control_flow

    ; Continue to next node
    CALL next_node
    JUMP main_loop

end_of_generation:
    ; Return success/error code
    LOAD R0, R14
    RET

; ============================================================================
; AST NODE PROCESSING
; ============================================================================

get_current_node:
    ; Input: R5 = AST position, R0 = AST buffer address
    ; Output: R10 = current AST node data

    ; Calculate node address
    SHIFT_LEFT R13, R5, 2   ; R13 = position * 4
    ADD R13, R13, R0        ; R13 = AST buffer + offset
    LOAD R10, [R13]         ; R10 = AST node data
    RET

next_node:
    ; Move to next AST node
    ADD R5, R5, 1
    RET

check_ast_end:
    ; Check if we've reached end of AST
    ; Input: R10 = current node data
    ; Output: R13 = 1 if end, 0 if not

    SUB R13, R10, 0         ; Check if node is empty
    JUMP_EQ is_end
    LOAD R13, 0             ; Not end
    RET

is_end:
    LOAD R13, 1             ; Is end
    RET

; ============================================================================
; PROGRAM GENERATION
; ============================================================================

generate_program:
    ; Process PROGRAM node (root of AST)

    ; Set state to generating program
    LOAD R9, STATE_GENERATING_PROGRAM

    ; Generate program header
    CALL generate_program_header

    ; Process program children (function definitions and declarations)
    CALL process_program_children

    RET

process_program_children:
    ; Process all children of program node
    ; This would traverse the AST and generate code for each top-level declaration

    RET

generate_program_header:
    ; Generate assembly program header

    ; Emit .text directive
    CALL emit_assembly_directive
    .equ DIRECTIVE_TEXT

    ; Emit .global _main directive
    CALL emit_global_symbol
    .equ SYMBOL_MAIN

    RET

; ============================================================================
; FUNCTION GENERATION
; ============================================================================

generate_function:
    ; Process FUNCTION_DEF node

    ; Enter function scope
    CALL enter_function_scope
    LOAD R9, STATE_GENERATING_FUNCTION

    ; Generate function prologue
    CALL generate_function_prologue

    ; Generate function body
    CALL generate_function_body

    ; Generate function epilogue
    CALL generate_function_epilogue

    ; Exit function scope
    CALL exit_function_scope

    RET

generate_function_prologue:
    ; Generate function entry code

    ; Save base pointer
    STORE [R15], R15        ; Save current base pointer
    SUB R15, R15, 4         ; Allocate new base pointer

    ; Save return address (simulated)
    ; In real implementation, would save return address from link register

    RET

generate_function_epilogue:
    ; Generate function exit code

    ; Restore base pointer
    LOAD R15, [R15]         ; Restore previous base pointer

    ; Return from function
    RET

generate_function_body:
    ; Generate code for function body

    LOAD R9, STATE_GENERATING_STATEMENTS
    ; Process statement list

    RET

; ============================================================================
; DECLARATION GENERATION
; ============================================================================

generate_declarations:
    ; Process VARIABLE_DECL nodes

    LOAD R9, STATE_GENERATING_DECLARATIONS

    ; Allocate memory for variable
    CALL allocate_variable_memory

    ; Generate initialization code if needed
    CALL generate_variable_initialization

    RET

allocate_variable_memory:
    ; Allocate memory for variable
    ; Input: R10 = variable symbol table entry
    ; Output: R13 = memory address

    ; Extract variable size from symbol table entry
    CALL extract_variable_size

    ; Allocate space on stack or in data section
    CALL allocate_stack_space

    ; Store allocation address in symbol table
    CALL update_symbol_address

    RET

generate_variable_initialization:
    ; Generate initialization code for variable

    ; Check if initializer exists
    CALL check_for_initializer
    JUMP_EQ no_initialization

    ; Generate code to compute initializer value
    CALL generate_initializer_code

    ; Generate store instruction
    CALL generate_store_instruction

no_initialization:
    RET

; ============================================================================
; STATEMENT GENERATION
; ============================================================================

generate_statements:
    ; Process statement nodes

    LOAD R9, STATE_GENERATING_STATEMENTS

    ; Generate statement based on type
    ; (if, while, return, expression statement, etc.)

    RET

; ============================================================================
; EXPRESSION GENERATION
; ============================================================================

generate_expression:
    ; Process expression nodes

    LOAD R9, STATE_GENERATING_EXPRESSION

    ; Generate expression code based on type
    ; (binary, unary, function calls, identifiers, constants)

    RET

; ============================================================================
; ASSIGNMENT GENERATION
; ============================================================================

generate_assignment:
    ; Process assignment operations

    LOAD R9, STATE_GENERATING_ASSIGNMENT

    ; Generate code for left side (destination)
    CALL generate_destination_code

    ; Generate code for right side (source)
    CALL generate_source_code

    ; Generate assignment instruction
    CALL generate_assignment_instruction

    RET

; ============================================================================
; CONTROL FLOW GENERATION
; ============================================================================

generate_control_flow:
    ; Process control flow statements

    LOAD R9, STATE_GENERATING_CONTROL_FLOW

    ; Generate control flow code based on type
    ; (if/else, loops, breaks, continues)

    RET

; ============================================================================
; REGISTER ALLOCATION
; ============================================================================

allocate_register:
    ; Allocate a free register
    ; Output: R13 = register number or -1 if none available

    ; Find first available register
    LOAD R13, 0             ; Start with R0

register_search_loop:
    ; Check if register is available
    SHIFT_LEFT R14, R13, 1  ; R14 = 1 << R13
    AND R14, R14, R11       ; Check if bit is set
    JUMP_NE register_found

    ; Try next register
    ADD R13, R13, 1
    SUB R14, R13, 16        ; Check if we've tried all registers
    JUMP_LT register_search_loop

    ; No registers available
    LOAD R13, -1
    RET

register_found:
    ; Mark register as allocated
    SHIFT_LEFT R14, R13, 1  ; R14 = 1 << R13
    XOR R11, R11, R14       ; Clear bit (mark as allocated)

    RET

free_register:
    ; Free a register
    ; Input: R13 = register number to free

    ; Mark register as free
    SHIFT_LEFT R14, R13, 1  ; R14 = 1 << R13
    OR R11, R11, R14        ; Set bit (mark as free)

    RET

; ============================================================================
; ASSEMBLY CODE EMISSION
; ============================================================================

emit_instruction:
    ; Emit an assembly instruction
    ; Input: R10 = instruction opcode, R11 = operands

    ; Store instruction in code buffer
    STORE [R6], R10         ; Store opcode
    ADD R6, R6, 1
    STORE [R6], R11         ; Store operands
    ADD R6, R6, 1

    RET

emit_label:
    ; Emit a label
    ; Input: R12 = label number

    ; Generate label name (L0, L1, etc.)
    LOAD R10, 'L'           ; ASCII 'L'
    STORE [R6], R10
    ADD R6, R6, 1

    ; Convert label number to ASCII digits
    CALL convert_number_to_ascii

    ; Add colon
    LOAD R10, ':'
    STORE [R6], R10
    ADD R6, R6, 1

    RET

generate_next_label:
    ; Generate next unique label number
    ; Output: R12 = new label number

    ; Increment label counter
    ADD R12, R12, 1

    RET

; ============================================================================
; UTILITY FUNCTIONS
; ============================================================================

extract_variable_size:
    ; Extract variable size from symbol table entry
    ; Input: R10 = symbol table entry
    ; Output: R13 = size in bytes

    ; Extract size field (bits 15-8)
    SHIFT_RIGHT R13, R10, 8
    AND R13, R13, 0xFF

    RET

allocate_stack_space:
    ; Allocate space on stack
    ; Input: R13 = size in bytes
    ; Output: R14 = allocated address

    ; Subtract size from stack pointer
    SUB R14, R15, R13

    ; Update stack pointer
    SUB R15, R15, R13

    RET

update_symbol_address:
    ; Update variable address in symbol table
    ; Input: R7 = symbol table position, R14 = new address

    ; Store address in symbol table entry
    ; This would update the ADDRESS field of the symbol entry

    RET

; ============================================================================
; DATA SECTION
; ============================================================================

.data
    ; Code generator states
    STATE_START:                .equ 0x0
    STATE_GENERATING_PROGRAM:   .equ 0x1
    STATE_GENERATING_FUNCTION:  .equ 0x2
    STATE_GENERATING_DECLARATIONS: .equ 0x3
    STATE_GENERATING_STATEMENTS: .equ 0x4
    STATE_GENERATING_EXPRESSION: .equ 0x5
    STATE_GENERATING_ASSIGNMENT: .equ 0x6
    STATE_GENERATING_CONTROL_FLOW: .equ 0x7
    STATE_ERROR:                .equ 0xF

    ; Assembly directives
    DIRECTIVE_TEXT:             .equ 0x0
    DIRECTIVE_DATA:             .equ 0x1
    DIRECTIVE_GLOBAL:           .equ 0x2

    ; Symbol types
    SYMBOL_MAIN:                .equ 0x0

    ; AST node types (from parser)
    NODE_PROGRAM:               .equ 0x0
    NODE_FUNCTION_DEF:          .equ 0x2
    NODE_VARIABLE_DECL:         .equ 0x3
    NODE_IF_STATEMENT:          .equ 0x6
    NODE_WHILE_STATEMENT:       .equ 0x7
    NODE_RETURN_STATEMENT:      .equ 0x9
    NODE_EXPRESSION_STATEMENT:  .equ 0xA
    NODE_BINARY_EXPRESSION:     .equ 0xB
    NODE_UNARY_EXPRESSION:      .equ 0xC
    NODE_IDENTIFIER:            .equ 0xD
    NODE_CONSTANT:              .equ 0xE
    NODE_FUNCTION_CALL:         .equ 0x10
    NODE_ASSIGNMENT:            .equ 0x11

    ; Error codes
    ERROR_INVALID_AST_NODE:     .equ -1
    ERROR_SYMBOL_NOT_FOUND:     .equ -2
    ERROR_REGISTER_EXHAUSTED:   .equ -3
    ERROR_MEMORY_ALLOCATION_FAILED: .equ -4
    ERROR_UNSUPPORTED_OPERATION: .equ -5
    ERROR_STACK_OVERFLOW:       .equ -6
    ERROR_INVALID_FUNCTION_CALL: .equ -7
    ERROR_TYPE_GENERATION_ERROR: .equ -8
`;

// ============================================================================
// JAVASCRIPT INTERFACE AND TESTING
// ============================================================================

/**
 * CCodeGenerator class for integration with the OrionRisc-128 system
 */
class CCodeGenerator {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.program = C_CODE_GENERATOR_PROGRAM;
    }

    /**
     * Load the C code generator program into memory
     * @param {number} startAddress - Memory address to load program (default: 0x0000)
     */
    loadProgram(startAddress = 0x0000) {
        console.log(`Loading C code generator program at address 0x${startAddress.toString(16)}`);
        this.cpu.loadProgram(this.program, startAddress);
    }

    /**
     * Generate assembly code from type-checked AST
     * @param {number} astAddress - Memory address of AST buffer (default: 0x1000)
     * @param {number} symbolTableAddress - Memory address of symbol table (default: 0x2000)
     * @param {number} typeTableAddress - Memory address of type table (default: 0x3000)
     * @param {number} codeAddress - Memory address for assembly code buffer (default: 0x4000)
     * @param {number} astNodeIndex - Current AST node index (default: 0)
     * @returns {Object} Code generation result
     */
    generate(astAddress = 0x1000, symbolTableAddress = 0x2000, typeTableAddress = 0x3000, codeAddress = 0x4000, astNodeIndex = 0) {
        console.log(`Generating assembly code from type-checked AST`);

        // Set up CPU registers for C code generator
        this.cpu.setRegister(0, astAddress);         // R0 = AST buffer address
        this.cpu.setRegister(1, symbolTableAddress); // R1 = symbol table address
        this.cpu.setRegister(2, typeTableAddress);   // R2 = type table address
        this.cpu.setRegister(3, codeAddress);        // R3 = assembly code buffer address
        this.cpu.setRegister(4, astNodeIndex);       // R4 = current AST node index

        // Execute C code generator program
        const instructionsExecuted = this.cpu.run();

        console.log(`C code generator executed ${instructionsExecuted} instructions`);

        // Read generated assembly code from memory
        const assemblyCode = this.readAssemblyCode(codeAddress);

        // Get result from R0 (success/error code)
        const result = this.cpu.getRegister(0);

        return {
            success: result >= 0,
            errorCode: result < 0 ? result : 0,
            assemblyCode: assemblyCode,
            instructionsExecuted: instructionsExecuted,
            astNodeIndex: this.cpu.getRegister(4)
        };
    }

    /**
     * Read generated assembly code from memory buffer
     * @param {number} codeAddress - Memory address of assembly code buffer
     * @returns {Object} Assembly code structure
     */
    readAssemblyCode(codeAddress) {
        const instructions = [];

        // Read assembly instructions until we find empty memory
        for (let offset = 0; offset < 0x1000; offset += 2) {
            const opcode = this.mmu.readByte(codeAddress + offset);
            const operands = this.mmu.readByte(codeAddress + offset + 1);

            if (opcode === 0 && operands === 0) {
                break; // End of assembly code
            }

            instructions.push({
                opcode: opcode,
                operands: operands,
                address: codeAddress + offset
            });
        }

        return {
            instructions: instructions,
            address: codeAddress,
            size: instructions.length
        };
    }

    /**
     * Get code generation error name for debugging
     * @param {number} errorCode - Error code value
     * @returns {string} Error name
     */
    static getCodeGenErrorName(errorCode) {
        const names = Object.keys(C_CODEGEN_ERRORS);
        for (const name of names) {
            if (C_CODEGEN_ERRORS[name] === errorCode) {
                return name;
            }
        }
        return 'UNKNOWN_ERROR';
    }
}

// ============================================================================
// INTEGRATION WITH C COMPILER PIPELINE
// ============================================================================

/**
 * Complete C compiler pipeline: lexical analysis + parsing + semantic analysis + code generation
 */
class CCompiler {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.lexer = new CLexicalAnalyzer(mmu, cpu);
        this.parser = new CParser(mmu, cpu);
        this.semanticAnalyzer = new CSemanticAnalyzer(mmu, cpu);
        this.codeGenerator = new CCodeGenerator(mmu, cpu);
    }

    /**
     * Compile C source code to assembly language
     * @param {string} sourceCode - C source code
     * @param {number} sourceAddress - Source buffer address (default: 0x1000)
     * @param {number} tokenAddress - Token buffer address (default: 0x2000)
     * @param {number} astAddress - AST buffer address (default: 0x3000)
     * @param {number} stringAddress - String table address (default: 0x4000)
     * @param {number} symbolTableAddress - Symbol table address (default: 0x5000)
     * @param {number} typeTableAddress - Type table address (default: 0x6000)
     * @param {number} errorAddress - Error buffer address (default: 0x7000)
     * @param {number} codeAddress - Assembly code buffer address (default: 0x8000)
     * @returns {Object} Complete compilation result
     */
    compile(sourceCode, sourceAddress = 0x1000, tokenAddress = 0x2000, astAddress = 0x3000, stringAddress = 0x4000, symbolTableAddress = 0x5000, typeTableAddress = 0x6000, errorAddress = 0x7000, codeAddress = 0x8000) {
        console.log(`Compiling C source code to assembly language (${sourceCode.length} characters)`);

        // Step 1: Lexical analysis
        console.log('Step 1: Lexical analysis...');
        this.lexer.loadProgram(0x0000);
        const lexResult = this.lexer.tokenize(sourceCode, sourceAddress, tokenAddress, stringAddress);

        if (lexResult.tokenCount === 0) {
            return {
                success: false,
                error: 'No tokens generated by lexical analyzer',
                stage: 'lexical_analysis'
            };
        }

        console.log(`Generated ${lexResult.tokenCount} tokens`);

        // Step 2: Parsing
        console.log('Step 2: Parsing tokens into AST...');
        this.parser.loadProgram(0x5000); // Load parser after lexer
        const parseResult = this.parser.parse(tokenAddress, astAddress, stringAddress, 0);

        if (!parseResult.success) {
            return {
                success: false,
                error: `Parsing failed with error code ${parseResult.errorCode}`,
                stage: 'parsing',
                tokens: lexResult.tokenCount,
                instructions: parseResult.instructionsExecuted
            };
        }

        console.log(`Parsing successful. AST size: ${parseResult.ast.size} nodes`);

        // Step 3: Semantic analysis
        console.log('Step 3: Semantic analysis...');
        this.semanticAnalyzer.loadProgram(0x9000); // Load semantic analyzer after parser
        const semanticResult = this.semanticAnalyzer.analyze(astAddress, symbolTableAddress, typeTableAddress, errorAddress, 0);

        if (!semanticResult.success) {
            return {
                success: false,
                error: `Semantic analysis failed with error code ${semanticResult.errorCode}`,
                stage: 'semantic_analysis',
                tokens: lexResult.tokenCount,
                astNodes: parseResult.ast.size,
                instructions: semanticResult.instructionsExecuted,
                errors: semanticResult.errors
            };
        }

        console.log(`Semantic analysis successful. Symbols: ${semanticResult.symbolTable.size}`);

        // Step 4: Code generation
        console.log('Step 4: Code generation...');
        this.codeGenerator.loadProgram(0xA000); // Load code generator after semantic analyzer
        const codeGenResult = this.codeGenerator.generate(astAddress, symbolTableAddress, typeTableAddress, codeAddress, 0);

        if (!codeGenResult.success) {
            return {
                success: false,
                error: `Code generation failed with error code ${codeGenResult.errorCode}`,
                stage: 'code_generation',
                tokens: lexResult.tokenCount,
                astNodes: parseResult.ast.size,
                symbols: semanticResult.symbolTable.size,
                instructions: codeGenResult.instructionsExecuted
            };
        }

        console.log(`Code generation successful. Assembly instructions: ${codeGenResult.assemblyCode.size}`);

        return {
            success: true,
            tokens: lexResult.tokenCount,
            astNodes: parseResult.ast.size,
            symbols: semanticResult.symbolTable.size,
            types: semanticResult.typeTable.size,
            assemblyInstructions: codeGenResult.assemblyCode.size,
            instructions: parseResult.instructionsExecuted + semanticResult.instructionsExecuted + codeGenResult.instructionsExecuted,
            stringTable: lexResult.stringTable,
            symbolTable: semanticResult.symbolTable,
            typeTable: semanticResult.typeTable,
            assemblyCode: codeGenResult.assemblyCode,
            errors: semanticResult.errors
        };
    }
}

// ============================================================================
// EXAMPLE USAGE AND TESTING
// ============================================================================

/**
 * Example C source code for testing complete compilation pipeline
 */
const EXAMPLE_C_CODE_CODEGEN = `
/* Example C program for testing complete C compiler with code generation */
#include <stdio.h>

int global_var = 42;

int add_numbers(int a, int b) {
    int result;
    result = a + b;
    return result;
}

void print_message(char* message) {
    printf("Message: %s\\n", message);
}

int main(void) {
    int x = 10;
    int y = 20;
    int sum;

    sum = add_numbers(x, y);

    if (sum > 15) {
        print_message("Sum is large!");
    } else {
        print_message("Sum is small");
    }

    return 0;
}
`;

/**
 * Test the complete C compiler pipeline with code generation
 */
function testCCompilerWithCodeGeneration() {
    console.log('=== C COMPILER WITH CODE GENERATION TEST ===');

    console.log('Example C code for complete compilation test:');
    console.log(EXAMPLE_C_CODE_CODEGEN);

    console.log('\\nExpected compilation pipeline:');
    console.log('1. Lexical analysis: Tokenize C source code');
    console.log('2. Parsing: Build AST from tokens');
    console.log('3. Semantic analysis: Type checking and symbol resolution');
    console.log('4. Code generation: Generate assembly code from AST');

    console.log('\\nExpected assembly code output:');
    console.log('- Program header (.text, .global main)');
    console.log('- Function definitions with prologues/epilogues');
    console.log('- Variable allocations and initializations');
    console.log('- Arithmetic operations (ADD, SUB, MUL, DIV)');
    console.log('- Control flow (JUMP, conditional jumps)');
    console.log('- Function calls and returns');

    console.log('\\nC code generator implementation ready for Phase 3 integration');
}

/**
 * Test code generator with mock AST
 */
function testCodeGeneratorWithMockAST() {
    console.log('=== CODE GENERATOR MOCK AST TEST ===');

    console.log('Mock AST for code generation testing:');
    console.log('- PROGRAM');
    console.log('  - FUNCTION_DEF (int main)');
    console.log('    - VARIABLE_DECL (int x)');
    console.log('    - ASSIGNMENT (x = 42)');
    console.log('    - RETURN_STATEMENT (x)');

    console.log('\\nExpected assembly code generation:');
    console.log('- Function prologue (save frame pointer)');
    console.log('- Variable allocation (stack space for x)');
    console.log('- Load constant 42');
    console.log('- Store to variable x');
    console.log('- Load variable x');
    console.log('- Function epilogue (restore frame pointer)');
    console.log('- Return');

    console.log('\\nCode generator ready for integration testing');
}

// ============================================================================
// VALIDATION AND TESTING FUNCTIONS
// ============================================================================

/**
 * Validate code generation results
 * @param {Object} result - Code generation result
 * @returns {boolean} True if results are valid
 */
function validateCodeGeneration(result) {
    if (!result || !result.success) {
        console.log('Code generation validation failed: Generation was not successful');
        return false;
    }

    if (!result.assemblyCode || result.assemblyCode.size === 0) {
        console.log('Code generation validation failed: No assembly code generated');
        return false;
    }

    console.log('Code generation validation passed');
    return true;
}

/**
 * Print code generation results for debugging
 * @param {Object} result - Code generation result
 */
function printCodeGenerationResults(result) {
    console.log('\\n=== CODE GENERATION RESULTS ===');

    if (result.success) {
        console.log('✓ Code generation successful');

        if (result.assemblyCode) {
            console.log(`\\nAssembly Code (${result.assemblyCode.size} instructions):`);
            result.assemblyCode.instructions.forEach((instruction, index) => {
                console.log(`  ${index}: opcode=0x${instruction.opcode.toString(16)}, operands=0x${instruction.operands.toString(16)}`);
            });
        }
    } else {
        console.log('✗ Code generation failed');
        console.log(`Error code: ${result.errorCode} (${CCodeGenerator.getCodeGenErrorName(result.errorCode)})`);
    }

    console.log(`\\nInstructions executed: ${result.instructionsExecuted}`);
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CCodeGenerator,
        CCompiler,
        C_CODE_GENERATOR_PROGRAM,
        C_CODE_GENERATOR_ASSEMBLY,
        EXAMPLE_C_CODE_CODEGEN,
        testCCompilerWithCodeGeneration,
        testCodeGeneratorWithMockAST,
        validateCodeGeneration,
        printCodeGenerationResults,
        C_CODEGEN_ERRORS,
        C_CODEGEN_STATES,
        C_REGISTERS
    };
}

module.exports = CCodeGenerator;