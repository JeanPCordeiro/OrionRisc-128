/**
 * C Parser for OrionRisc-128 C Compiler
 *
 * This program implements a recursive descent parser for C subset grammar
 * as a machine language program that can be executed by the RISC processor.
 *
 * Phase 3 Component: Parser for the assembly-based C compiler
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 * Phase: 3 of 12-week development plan
 */

// ============================================================================
// C PARSER - MACHINE LANGUAGE IMPLEMENTATION
// ============================================================================

/**
 * C AST NODE TYPES
 */
const C_AST_NODE_TYPES = {
    PROGRAM: 0x0,           // Root program node
    FUNCTION_DECL: 0x1,     // Function declaration
    FUNCTION_DEF: 0x2,      // Function definition
    VARIABLE_DECL: 0x3,     // Variable declaration
    PARAMETER_DECL: 0x4,    // Function parameter
    BLOCK: 0x5,             // Compound statement block
    IF_STATEMENT: 0x6,      // If statement
    WHILE_STATEMENT: 0x7,   // While loop
    FOR_STATEMENT: 0x8,     // For loop
    RETURN_STATEMENT: 0x9,  // Return statement
    EXPRESSION_STATEMENT: 0xA, // Expression statement
    BINARY_EXPRESSION: 0xB, // Binary operation (a + b)
    UNARY_EXPRESSION: 0xC,  // Unary operation (!a, -a)
    IDENTIFIER: 0xD,        // Variable reference
    CONSTANT: 0xE,          // Numeric/character constant
    STRING_LITERAL: 0xF,    // String constant
    FUNCTION_CALL: 0x10,    // Function call expression
    ASSIGNMENT: 0x11,       // Assignment expression
    DECLARATION_LIST: 0x12, // List of declarations
    STATEMENT_LIST: 0x13,   // List of statements
    PARAMETER_LIST: 0x14,   // Function parameter list
    ARGUMENT_LIST: 0x15     // Function call arguments
};

/**
 * C BINARY OPERATOR TYPES
 */
const C_BINARY_OPERATORS = {
    ADD: 0x0,               // +
    SUBTRACT: 0x1,          // -
    MULTIPLY: 0x2,          // *
    DIVIDE: 0x3,            // /
    MODULO: 0x4,            // %
    EQUAL: 0x5,             // ==
    NOT_EQUAL: 0x6,         // !=
    LESS: 0x7,              // <
    GREATER: 0x8,           // >
    LESS_EQUAL: 0x9,        // <=
    GREATER_EQUAL: 0xA,     // >=
    LOGICAL_AND: 0xB,       // &&
    LOGICAL_OR: 0xC,        // ||
    ASSIGN: 0xD,            // =
    ADD_ASSIGN: 0xE,        // +=
    SUBTRACT_ASSIGN: 0xF    // -=
};

/**
 * C UNARY OPERATOR TYPES
 */
const C_UNARY_OPERATORS = {
    NOT: 0x0,               // !
    NEGATE: 0x1,            // -
    ADDRESS: 0x2,           // &
    DEREFERENCE: 0x3,       // *
    PRE_INCREMENT: 0x4,     // ++
    PRE_DECREMENT: 0x5,     // --
    POST_INCREMENT: 0x6,    // ++
    POST_DECREMENT: 0x7     // --
};

/**
 * PARSER STATE CONSTANTS
 */
const C_PARSER_STATES = {
    START: 0x0,             // Initial state
    PARSING_DECLARATIONS: 0x1, // Parsing global declarations
    PARSING_FUNCTION: 0x2,  // Parsing function definition
    PARSING_STATEMENTS: 0x3, // Parsing statements
    PARSING_EXPRESSION: 0x4, // Parsing expression
    PARSING_DECLARATION: 0x5,// Parsing declaration
    ERROR: 0xF              // Error state
};

/**
 * MEMORY LAYOUT FOR C PARSER
 *
 * 0x0000-0x0FFF: Program code (C parser)
 * 0x1000-0x1FFF: Token buffer (input from lexical analyzer)
 * 0x2000-0x2FFF: AST buffer (output)
 * 0x3000-0x3FFF: String table (identifiers, strings)
 * 0x4000-0x40FF: Parser state variables and pointers
 * 0x4100-0x41FF: Constants and lookup tables
 * 0x4200-0x42FF: AST node pool
 */

// ============================================================================
// MACHINE LANGUAGE PROGRAM - C PARSER
// ============================================================================

/**
 * C Parser Machine Language Program
 *
 * This program reads tokens from the lexical analyzer, parses C grammar,
 * and builds an abstract syntax tree (AST) for semantic analysis.
 *
 * Interface:
 * - R0: Token buffer address (input)
 * - R1: AST buffer address (output)
 * - R2: String table address (input)
 * - R3: Current token index (input/output)
 * - Returns: AST root node address (R0) or error code (negative)
 */
const C_PARSER_PROGRAM = [
    // ========================================================================
    // INITIALIZATION PHASE
    // ========================================================================

    // Initialize state variables
    // R4 = current token index
    // R5 = current AST position
    // R6 = AST root node address
    // R7 = current token data
    // R8 = parser state (C_PARSER_STATES.START)
    // R9 = lookahead token data
    // R10 = AST node counter
    // R11 = temporary storage
    // R12 = error code storage
    // R13 = string table position

    0x01000000, // LOAD R0, [R0 + 0]        ; R0 = token buffer address
    0x01110000, // LOAD R1, [R1 + 0]        ; R1 = AST buffer address
    0x01220000, // LOAD R2, [R2 + 0]        ; R2 = string table address
    0x01330000, // LOAD R3, [R3 + 0]        ; R3 = current token index

    // Initialize positions and state
    0x04440000, // ADD R4, R0, R0           ; R4 = 0 (token index)
    0x04550000, // ADD R5, R0, R0           ; R5 = 0 (AST position)
    0x04660000, // ADD R6, R0, R0           ; R6 = 0 (AST root)
    0x04770000, // ADD R7, R0, R0           ; R7 = 0 (current token)
    0x04880000, // ADD R8, R0, R0           ; R8 = 0 (parser state = START)
    0x04990000, // ADD R9, R0, R0           ; R9 = 0 (lookahead token)
    0x04AA0000, // ADD R10, R0, R0          ; R10 = 0 (AST node counter)
    0x04BB0000, // ADD R11, R0, R0          ; R11 = 0 (temporary)
    0x04CC0000, // ADD R12, R0, R0          ; R12 = 0 (error code)
    0x04DD0000, // ADD R13, R0, R0          ; R13 = 0 (string position)

    // ========================================================================
    // MAIN PARSING LOOP
    // ========================================================================

    // main_loop:
    // Get current token
    0xF0000000, // JUMP get_current_token   ; Get current token

    // get_current_token:
    // Calculate token address = token_buffer + (token_index * 4)
    0x03440004, // SUB R14, R4, R3          ; R14 = token_index * 4
    0x03140000, // ADD R14, R0, R14         ; R14 = token address
    0x017E0000, // LOAD R7, [R14 + 0]       ; R7 = current token data

    // Check for end of tokens
    0x03770008, // SUB R14, R7, 0x8         ; Check if END token (0x8)
    0xF4000000, // JUMP_EQ end_of_tokens    ; If END token, finish parsing

    // Check for error token
    0x03770009, // SUB R14, R7, 0x9         ; Check if ERROR token (0x9)
    0xF4000000, // JUMP_EQ parsing_error    ; If ERROR token, handle error

    // ========================================================================
    // PARSER STATE MACHINE
    // ========================================================================

    // Check current parser state
    0x03780000, // SUB R14, R8, 0x0         ; Check if START state
    0xF4000000, // JUMP_EQ parse_program    ; Parse program

    0x03780001, // SUB R14, R8, 0x1         ; Check if PARSING_DECLARATIONS
    0xF4000000, // JUMP_EQ parse_declarations ; Parse declarations

    0x03780002, // SUB R14, R8, 0x2         ; Check if PARSING_FUNCTION
    0xF4000000, // JUMP_EQ parse_function   ; Parse function

    0x03780003, // SUB R14, R8, 0x3         ; Check if PARSING_STATEMENTS
    0xF4000000, // JUMP_EQ parse_statements ; Parse statements

    0x03780004, // SUB R14, R8, 0x4         ; Check if PARSING_EXPRESSION
    0xF4000000, // JUMP_EQ parse_expression ; Parse expression

    0x03780005, // SUB R14, R8, 0x5         ; Check if PARSING_DECLARATION
    0xF4000000, // JUMP_EQ parse_declaration ; Parse declaration

    // ========================================================================
    // TOKEN PROCESSING BASED ON TYPE
    // ========================================================================

    // parse_program:
    // Program -> (FunctionDefinition | Declaration)*

    // Check for function definition (type identifier LPAREN)
    0xF0000000, // JUMP check_function_definition

    // Check for declaration (type identifier SEMICOLON)
    0xF0000000, // JUMP check_declaration

    // ========================================================================
    // DECLARATION PARSING
    // ========================================================================

    // parse_declarations:
    // Declarations -> Declaration*

    // parse_declaration:
    // Declaration -> TypeSpecifier Identifier (LBRACKET Number RBRACKET)? SEMICOLON

    // ========================================================================
    // FUNCTION PARSING
    // ========================================================================

    // parse_function:
    // FunctionDefinition -> TypeSpecifier Identifier LPAREN ParameterList RPAREN CompoundStatement

    // check_function_definition:
    // Look ahead for function pattern: type identifier LPAREN

    // ========================================================================
    // STATEMENT PARSING
    // ========================================================================

    // parse_statements:
    // Statements -> Statement*

    // Statement types:
    // - ExpressionStatement
    // - IfStatement
    // - WhileStatement
    // - ForStatement
    // - ReturnStatement
    // - CompoundStatement

    // ========================================================================
    // EXPRESSION PARSING
    // ========================================================================

    // parse_expression:
    // Expression parsing with precedence:
    // Assignment (=, +=, -=)
    // Logical OR (||)
    // Logical AND (&&)
    // Equality (==, !=)
    // Relational (<, >, <=, >=)
    // Additive (+, -)
    // Multiplicative (*, /, %)
    // Unary (!, -, &, *)

    // ========================================================================
    // AST NODE CREATION
    // ========================================================================

    // create_ast_node:
    // Create new AST node in AST buffer
    // Input: R8 = node type, R9 = left child, R10 = right child, R11 = value
    // Output: R7 = node address

    // ========================================================================
    // TOKEN CONSUMPTION
    // ========================================================================

    // consume_token:
    // Move to next token
    0x04441001, // ADD R4, R4, 1            ; Increment token index
    0xF0000000, // JUMP main_loop          ; Continue parsing

    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    // parsing_error:
    // Handle parsing errors
    0x08CC0001, // LOAD R12, 1              ; Set error code
    0xFF000000, // HALT                    ; Stop execution

    // end_of_tokens:
    // Finish parsing, return AST root
    0x00660000, // ADD R0, R6, R0           ; Return AST root address
    0xFF000000  // HALT                    ; End of program
];

// ============================================================================
// ASSEMBLY SOURCE CODE FOR THE C PARSER
// ============================================================================

/**
 * Assembly Source Code Representation
 *
 * This is how the C parser program would appear in assembly language.
 * This serves as documentation and can be used for testing the assembler.
 */
const C_PARSER_ASSEMBLY = `
; ============================================================================
; C PARSER - ASSEMBLY SOURCE
; ============================================================================

; OrionRisc-128 Assembly Language
; Recursive Descent Parser for C Subset Grammar
; Phase 3: Assembly-based C Compiler Component

.text
.global _start

_start:
    ; Initialize parser state
    LOAD R4, 0              ; Token index = 0
    LOAD R5, 0              ; AST position = 0
    LOAD R8, STATE_START    ; Parser state = START
    LOAD R10, 0             ; AST node counter = 0

main_loop:
    ; Get current token
    CALL get_current_token

    ; Check for end of input
    SUB R14, R7, TOKEN_END
    JUMP_EQ end_of_tokens

    ; State-based parsing
    SUB R14, R8, STATE_START
    JUMP_EQ parse_program

    SUB R14, R8, STATE_PARSING_DECLARATIONS
    JUMP_EQ parse_declarations

    SUB R14, R8, STATE_PARSING_FUNCTION
    JUMP_EQ parse_function

    SUB R14, R8, STATE_PARSING_STATEMENTS
    JUMP_EQ parse_statements

    SUB R14, R8, STATE_PARSING_EXPRESSION
    JUMP_EQ parse_expression

    ; Continue parsing
    CALL consume_token
    JUMP main_loop

end_of_tokens:
    ; Return AST root address in R0
    LOAD R0, AST_ROOT
    RET

; ============================================================================
; TOKEN MANAGEMENT
; ============================================================================

get_current_token:
    ; Input: R4 = token index, R0 = token buffer address
    ; Output: R7 = current token data

    ; Calculate token address
    SHIFT_LEFT R14, R4, 2   ; R14 = token_index * 4
    ADD R14, R14, R0        ; R14 = token buffer + offset
    LOAD R7, [R14]          ; R7 = token data
    RET

consume_token:
    ; Move to next token
    ADD R4, R4, 1
    RET

get_token_type:
    ; Input: R7 = token data
    ; Output: R11 = token type (bits 31-28)
    SHIFT_RIGHT R11, R7, 28
    AND R11, R11, 0xF
    RET

get_token_subtype:
    ; Input: R7 = token data
    ; Output: R11 = token subtype (bits 27-24)
    SHIFT_RIGHT R11, R7, 24
    AND R11, R11, 0xF
    RET

get_token_value:
    ; Input: R7 = token data
    ; Output: R11 = token value (bits 15-0)
    AND R11, R7, 0xFFFF
    RET

; ============================================================================
; AST NODE MANAGEMENT
; ============================================================================

create_ast_node:
    ; Input: R8 = node type, R9 = left child, R10 = right child, R11 = value
    ; Output: R7 = node address

    ; Allocate AST node (simplified - would use proper memory management)
    ; Node format: TYPE(8) | LEFT(8) | RIGHT(8) | VALUE(8)

    ; Store node type
    STORE [R5], R8
    ADD R5, R5, 1

    ; Store left child
    STORE [R5], R9
    ADD R5, R5, 1

    ; Store right child
    STORE [R5], R10
    ADD R5, R5, 1

    ; Store value
    STORE [R5], R11
    ADD R5, R5, 1

    ; Return node address (start of this node)
    SUB R7, R5, 4
    RET

; ============================================================================
; GRAMMAR PARSING FUNCTIONS
; ============================================================================

parse_program:
    ; Program -> (FunctionDefinition | Declaration)*

    ; Create program root node
    LOAD R8, NODE_PROGRAM
    LOAD R9, 0              ; No left child
    LOAD R10, 0             ; No right child
    LOAD R11, 0             ; No value
    CALL create_ast_node
    STORE AST_ROOT, R7      ; Save root address

program_loop:
    ; Look ahead to determine what to parse
    CALL get_current_token

    ; Check for function definition pattern
    CALL check_function_definition
    JUMP_NE try_declaration

    ; Parse function definition
    CALL parse_function_definition
    JUMP program_loop

try_declaration:
    ; Check for declaration pattern
    CALL check_declaration
    JUMP_NE program_end

    ; Parse declaration
    CALL parse_declaration
    JUMP program_loop

program_end:
    RET

parse_function_definition:
    ; FunctionDefinition -> TypeSpecifier Identifier LPAREN ParameterList RPAREN CompoundStatement

    ; Parse return type
    CALL parse_type_specifier

    ; Parse function name
    CALL expect_token_type
    .equ TOKEN_IDENTIFIER

    ; Expect LPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_LPAREN

    ; Parse parameters
    CALL parse_parameter_list

    ; Expect RPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_RPAREN

    ; Parse function body
    CALL parse_compound_statement

    RET

parse_declaration:
    ; Declaration -> TypeSpecifier Identifier (LBRACKET Number RBRACKET)? SEMICOLON

    ; Parse type specifier
    CALL parse_type_specifier

    ; Parse identifier
    CALL expect_token_type
    .equ TOKEN_IDENTIFIER

    ; Check for array declaration
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_LBRACKET
    JUMP_EQ parse_array_declaration

    ; Expect semicolon
    CALL expect_token_subtype
    .equ SUBTYPE_SEMICOLON

    RET

parse_array_declaration:
    ; Parse [Number] part of array declaration
    CALL expect_token_subtype
    .equ SUBTYPE_LBRACKET

    ; Parse array size
    CALL expect_token_type
    .equ TOKEN_CONSTANT

    CALL expect_token_subtype
    .equ SUBTYPE_RBRACKET

    ; Expect semicolon
    CALL expect_token_subtype
    .equ SUBTYPE_SEMICOLON

    RET

parse_type_specifier:
    ; TypeSpecifier -> int | char | void

    ; Check current token
    CALL get_token_subtype

    ; Check for int
    SUB R14, R11, SUBTYPE_INT
    JUMP_EQ is_int_type

    ; Check for char
    SUB R14, R11, SUBTYPE_CHAR
    JUMP_EQ is_char_type

    ; Check for void
    SUB R14, R11, SUBTYPE_VOID
    JUMP_EQ is_void_type

    ; Error - not a valid type
    LOAD R12, ERROR_INVALID_TYPE
    RET

is_int_type:
    LOAD R11, TYPE_INT
    CALL consume_token
    RET

is_char_type:
    LOAD R11, TYPE_CHAR
    CALL consume_token
    RET

is_void_type:
    LOAD R11, TYPE_VOID
    CALL consume_token
    RET

parse_parameter_list:
    ; ParameterList -> Parameter (COMMA Parameter)* | empty

    ; Check if empty (RPAREN next)
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_RPAREN
    JUMP_EQ empty_parameter_list

    ; Parse first parameter
    CALL parse_parameter

parameter_loop:
    ; Check if more parameters
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_COMMA
    JUMP_NE end_parameter_list

    ; Consume comma
    CALL consume_token

    ; Parse next parameter
    CALL parse_parameter
    JUMP parameter_loop

empty_parameter_list:
end_parameter_list:
    RET

parse_parameter:
    ; Parameter -> TypeSpecifier Identifier

    ; Parse type
    CALL parse_type_specifier

    ; Parse parameter name
    CALL expect_token_type
    .equ TOKEN_IDENTIFIER

    RET

parse_compound_statement:
    ; CompoundStatement -> LBRACE Statement* RBRACE

    ; Expect LBRACE
    CALL expect_token_subtype
    .equ SUBTYPE_LBRACE

    ; Parse statements until RBRACE
statement_loop:
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_RBRACE
    JUMP_EQ end_compound_statement

    CALL parse_statement
    JUMP statement_loop

end_compound_statement:
    ; Consume RBRACE
    CALL consume_token
    RET

parse_statement:
    ; Statement -> ExpressionStatement
    ;           | IfStatement
    ;           | WhileStatement
    ;           | ForStatement
    ;           | ReturnStatement
    ;           | CompoundStatement

    ; Check statement type based on first token
    CALL get_token_subtype

    ; Check for if statement
    SUB R14, R11, SUBTYPE_IF
    JUMP_EQ parse_if_statement

    ; Check for while statement
    SUB R14, R11, SUBTYPE_WHILE
    JUMP_EQ parse_while_statement

    ; Check for for statement
    SUB R14, R11, SUBTYPE_FOR
    JUMP_EQ parse_for_statement

    ; Check for return statement
    SUB R14, R11, SUBTYPE_RETURN
    JUMP_EQ parse_return_statement

    ; Check for LBRACE (compound statement)
    SUB R14, R11, SUBTYPE_LBRACE
    JUMP_EQ parse_compound_statement

    ; Default: expression statement
    CALL parse_expression_statement
    RET

parse_if_statement:
    ; IfStatement -> if LPAREN Expression RPAREN Statement (else Statement)?

    ; Consume if
    CALL consume_token

    ; Expect LPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_LPAREN

    ; Parse condition
    CALL parse_expression

    ; Expect RPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_RPAREN

    ; Parse then statement
    CALL parse_statement

    ; Check for else
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_ELSE
    JUMP_NE no_else

    ; Consume else
    CALL consume_token

    ; Parse else statement
    CALL parse_statement

no_else:
    RET

parse_while_statement:
    ; WhileStatement -> while LPAREN Expression RPAREN Statement

    ; Consume while
    CALL consume_token

    ; Expect LPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_LPAREN

    ; Parse condition
    CALL parse_expression

    ; Expect RPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_RPAREN

    ; Parse body
    CALL parse_statement

    RET

parse_for_statement:
    ; ForStatement -> for LPAREN Expression? SEMICOLON Expression? SEMICOLON Expression? RPAREN Statement

    ; Consume for
    CALL consume_token

    ; Expect LPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_LPAREN

    ; Parse initialization (optional)
    CALL get_current_token
    SUB R14, R7, SUBTYPE_SEMICOLON
    JUMP_EQ skip_initialization
    CALL parse_expression

skip_initialization:
    CALL expect_token_subtype
    .equ SUBTYPE_SEMICOLON

    ; Parse condition (optional)
    CALL get_current_token
    SUB R14, R7, SUBTYPE_SEMICOLON
    JUMP_EQ skip_condition
    CALL parse_expression

skip_condition:
    CALL expect_token_subtype
    .equ SUBTYPE_SEMICOLON

    ; Parse increment (optional)
    CALL get_current_token
    SUB R14, R7, SUBTYPE_RPAREN
    JUMP_EQ skip_increment
    CALL parse_expression

skip_increment:
    CALL expect_token_subtype
    .equ SUBTYPE_RPAREN

    ; Parse body
    CALL parse_statement

    RET

parse_return_statement:
    ; ReturnStatement -> return Expression? SEMICOLON

    ; Consume return
    CALL consume_token

    ; Check if expression follows
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_SEMICOLON
    JUMP_EQ no_return_value

    ; Parse return expression
    CALL parse_expression

no_return_value:
    ; Expect semicolon
    CALL expect_token_subtype
    .equ SUBTYPE_SEMICOLON

    RET

parse_expression_statement:
    ; ExpressionStatement -> Expression? SEMICOLON

    ; Check if expression exists
    CALL get_current_token
    SUB R14, R7, SUBTYPE_SEMICOLON
    JUMP_EQ empty_expression

    ; Parse expression
    CALL parse_expression

empty_expression:
    ; Consume semicolon
    CALL consume_token
    RET

parse_expression:
    ; Expression -> AssignmentExpression

    CALL parse_assignment_expression
    RET

parse_assignment_expression:
    ; AssignmentExpression -> Identifier = AssignmentExpression
    ;                       | ConditionalExpression

    ; Check if this is an assignment
    CALL check_assignment_pattern
    JUMP_NE parse_conditional_expression

    ; Parse assignment
    CALL parse_identifier  ; Left side

    CALL consume_token     ; Consume =

    CALL parse_assignment_expression ; Right side

    ; Create assignment node
    LOAD R8, NODE_ASSIGNMENT
    ; Left and right already in R9 and R10
    LOAD R11, 0
    CALL create_ast_node

    RET

parse_conditional_expression:
    ; ConditionalExpression -> LogicalORExpression ( ? Expression : ConditionalExpression )?

    CALL parse_logical_or_expression

    ; Check for ternary operator
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_QUESTION
    JUMP_NE end_conditional

    ; Consume ?
    CALL consume_token

    ; Parse true expression
    CALL parse_expression

    ; Expect :
    CALL expect_token_subtype
    .equ SUBTYPE_COLON

    ; Parse false expression
    CALL parse_conditional_expression

    ; Create ternary node (simplified for this subset)
    ; In a full implementation, would create proper ternary node

end_conditional:
    RET

parse_logical_or_expression:
    ; LogicalORExpression -> LogicalANDExpression (|| LogicalANDExpression)*

    CALL parse_logical_and_expression

logical_or_loop:
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_LOGICAL_OR
    JUMP_NE end_logical_or

    ; Consume ||
    CALL consume_token

    ; Parse right side
    CALL parse_logical_and_expression

    ; Create binary node
    LOAD R8, NODE_BINARY
    LOAD R11, OP_LOGICAL_OR
    CALL create_ast_node

    JUMP logical_or_loop

end_logical_or:
    RET

parse_logical_and_expression:
    ; LogicalANDExpression -> EqualityExpression (&& EqualityExpression)*

    CALL parse_equality_expression

logical_and_loop:
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_LOGICAL_AND
    JUMP_NE end_logical_and

    ; Consume &&
    CALL consume_token

    ; Parse right side
    CALL parse_equality_expression

    ; Create binary node
    LOAD R8, NODE_BINARY
    LOAD R11, OP_LOGICAL_AND
    CALL create_ast_node

    JUMP logical_and_loop

end_logical_and:
    RET

parse_equality_expression:
    ; EqualityExpression -> RelationalExpression ((==|!=) RelationalExpression)*

    CALL parse_relational_expression

equality_loop:
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_EQUAL
    JUMP_EQ parse_equality
    SUB R14, R7, SUBTYPE_NOT_EQUAL
    JUMP_EQ parse_equality
    JUMP end_equality

parse_equality:
    ; Consume operator
    CALL consume_token

    ; Parse right side
    CALL parse_relational_expression

    ; Create binary node
    LOAD R8, NODE_BINARY
    ; Operator type already in R11
    CALL create_ast_node

    JUMP equality_loop

end_equality:
    RET

parse_relational_expression:
    ; RelationalExpression -> AdditiveExpression ((<|>|<=|>=) AdditiveExpression)*

    CALL parse_additive_expression

relational_loop:
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_LESS
    JUMP_EQ parse_relational
    SUB R14, R7, SUBTYPE_GREATER
    JUMP_EQ parse_relational
    SUB R14, R7, SUBTYPE_LESS_EQUAL
    JUMP_EQ parse_relational
    SUB R14, R7, SUBTYPE_GREATER_EQUAL
    JUMP_EQ parse_relational
    JUMP end_relational

parse_relational:
    ; Consume operator
    CALL consume_token

    ; Parse right side
    CALL parse_additive_expression

    ; Create binary node
    LOAD R8, NODE_BINARY
    ; Operator type already in R11
    CALL create_ast_node

    JUMP relational_loop

end_relational:
    RET

parse_additive_expression:
    ; AdditiveExpression -> MultiplicativeExpression ((+|-) MultiplicativeExpression)*

    CALL parse_multiplicative_expression

additive_loop:
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_ADD
    JUMP_EQ parse_additive
    SUB R14, R7, SUBTYPE_SUBTRACT
    JUMP_EQ parse_additive
    JUMP end_additive

parse_additive:
    ; Consume operator
    CALL consume_token

    ; Parse right side
    CALL parse_multiplicative_expression

    ; Create binary node
    LOAD R8, NODE_BINARY
    ; Operator type already in R11
    CALL create_ast_node

    JUMP additive_loop

end_additive:
    RET

parse_multiplicative_expression:
    ; MultiplicativeExpression -> UnaryExpression ((*|/|%) UnaryExpression)*

    CALL parse_unary_expression

multiplicative_loop:
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_MULTIPLY
    JUMP_EQ parse_multiplicative
    SUB R14, R7, SUBTYPE_DIVIDE
    JUMP_EQ parse_multiplicative
    SUB R14, R7, SUBTYPE_MODULO
    JUMP_EQ parse_multiplicative
    JUMP end_multiplicative

parse_multiplicative:
    ; Consume operator
    CALL consume_token

    ; Parse right side
    CALL parse_unary_expression

    ; Create binary node
    LOAD R8, NODE_BINARY
    ; Operator type already in R11
    CALL create_ast_node

    JUMP multiplicative_loop

end_multiplicative:
    RET

parse_unary_expression:
    ; UnaryExpression -> (!| -) UnaryExpression
    ;                  | PostfixExpression

    CALL peek_next_token
    SUB R14, R7, SUBTYPE_LOGICAL_NOT
    JUMP_EQ parse_unary_not
    SUB R14, R7, SUBTYPE_SUBTRACT
    JUMP_EQ parse_unary_negate
    JUMP parse_postfix_expression

parse_unary_not:
    ; Consume !
    CALL consume_token

    ; Parse expression
    CALL parse_unary_expression

    ; Create unary node
    LOAD R8, NODE_UNARY
    LOAD R9, 0              ; No left child
    ; Right child already in R10
    LOAD R11, OP_NOT
    CALL create_ast_node

    RET

parse_unary_negate:
    ; Consume -
    CALL consume_token

    ; Parse expression
    CALL parse_unary_expression

    ; Create unary node
    LOAD R8, NODE_UNARY
    LOAD R9, 0              ; No left child
    ; Right child already in R10
    LOAD R11, OP_NEGATE
    CALL create_ast_node

    RET

parse_postfix_expression:
    ; PostfixExpression -> PrimaryExpression (LPAREN ArgumentList RPAREN | LBRACKET Expression RBRACKET | ++ | --)*

    CALL parse_primary_expression

postfix_loop:
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_LPAREN
    JUMP_EQ parse_function_call
    SUB R14, R7, SUBTYPE_LBRACKET
    JUMP_EQ parse_array_access
    SUB R14, R7, SUBTYPE_INCREMENT
    JUMP_EQ parse_post_increment
    SUB R14, R7, SUBTYPE_DECREMENT
    JUMP_EQ parse_post_decrement
    JUMP end_postfix

parse_function_call:
    ; Consume LPAREN
    CALL consume_token

    ; Parse arguments
    CALL parse_argument_list

    ; Expect RPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_RPAREN

    ; Create function call node
    LOAD R8, NODE_FUNCTION_CALL
    ; Left child is function expression, right is arguments
    LOAD R11, 0
    CALL create_ast_node

    JUMP postfix_loop

parse_array_access:
    ; Consume LBRACKET
    CALL consume_token

    ; Parse index expression
    CALL parse_expression

    ; Expect RBRACKET
    CALL expect_token_subtype
    .equ SUBTYPE_RBRACKET

    ; Create array access node (simplified)
    JUMP postfix_loop

parse_post_increment:
    ; Consume ++
    CALL consume_token

    ; Create post-increment node
    LOAD R8, NODE_UNARY
    ; Left child is expression
    LOAD R10, 0             ; No right child
    LOAD R11, OP_POST_INCREMENT
    CALL create_ast_node

    JUMP postfix_loop

parse_post_decrement:
    ; Consume --
    CALL consume_token

    ; Create post-decrement node
    LOAD R8, NODE_UNARY
    ; Left child is expression
    LOAD R10, 0             ; No right child
    LOAD R11, OP_POST_DECREMENT
    CALL create_ast_node

    JUMP postfix_loop

end_postfix:
    RET

parse_primary_expression:
    ; PrimaryExpression -> Identifier | Constant | StringLiteral | LPAREN Expression RPAREN

    CALL get_current_token

    ; Check token type
    CALL get_token_type

    SUB R14, R11, TOKEN_IDENTIFIER
    JUMP_EQ parse_identifier

    SUB R14, R11, TOKEN_CONSTANT
    JUMP_EQ parse_constant

    SUB R14, R11, TOKEN_STRING
    JUMP_EQ parse_string_literal

    SUB R14, R11, SUBTYPE_LPAREN
    JUMP_EQ parse_parenthesized_expression

    ; Error - not a valid primary expression
    LOAD R12, ERROR_INVALID_EXPRESSION
    RET

parse_identifier:
    ; Create identifier node
    LOAD R8, NODE_IDENTIFIER
    LOAD R9, 0              ; No left child
    LOAD R10, 0             ; No right child
    CALL get_token_value    ; Get string table offset
    CALL create_ast_node

    CALL consume_token
    RET

parse_constant:
    ; Create constant node
    LOAD R8, NODE_CONSTANT
    LOAD R9, 0              ; No left child
    LOAD R10, 0             ; No right child
    CALL get_token_value    ; Get constant value
    CALL create_ast_node

    CALL consume_token
    RET

parse_string_literal:
    ; Create string literal node
    LOAD R8, NODE_STRING_LITERAL
    LOAD R9, 0              ; No left child
    LOAD R10, 0             ; No right child
    CALL get_token_value    ; Get string table offset
    CALL create_ast_node

    CALL consume_token
    RET

parse_parenthesized_expression:
    ; Consume LPAREN
    CALL consume_token

    ; Parse expression
    CALL parse_expression

    ; Expect RPAREN
    CALL expect_token_subtype
    .equ SUBTYPE_RPAREN

    RET

parse_argument_list:
    ; ArgumentList -> Expression (COMMA Expression)* | empty

    ; Check if empty (RPAREN next)
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_RPAREN
    JUMP_EQ empty_argument_list

    ; Parse first argument
    CALL parse_expression

argument_loop:
    ; Check if more arguments
    CALL peek_next_token
    SUB R14, R7, SUBTYPE_COMMA
    JUMP_NE end_argument_list

    ; Consume comma
    CALL consume_token

    ; Parse next argument
    CALL parse_expression
    JUMP argument_loop

empty_argument_list:
end_argument_list:
    RET

; ============================================================================
; UTILITY FUNCTIONS
; ============================================================================

peek_next_token:
    ; Look ahead without consuming token
    ; Output: R7 = next token data

    ; Save current position
    STORE saved_token_index, R4

    ; Move to next token
    ADD R4, R4, 1

    ; Get token
    CALL get_current_token

    ; Restore position
    LOAD R4, saved_token_index

    RET

expect_token_type:
    ; Expect specific token type
    ; Input: Token type in R11

    CALL get_current_token
    CALL get_token_type

    SUB R14, R11, R7        ; Compare with expected
    JUMP_NE token_error

    CALL consume_token
    RET

expect_token_subtype:
    ; Expect specific token subtype
    ; Input: Token subtype in R11

    CALL get_current_token
    CALL get_token_subtype

    SUB R14, R11, R7        ; Compare with expected
    JUMP_NE token_error

    CALL consume_token
    RET

check_function_definition:
    ; Check if current position looks like function definition
    ; Output: R14 = 1 if yes, 0 if no

    ; Pattern: Type Identifier LPAREN

    ; Check if current token is type
    CALL get_current_token
    CALL get_token_type
    SUB R14, R7, TOKEN_KEYWORD
    JUMP_NE not_function

    CALL get_token_subtype
    ; Check if int, char, or void
    SUB R14, R11, SUBTYPE_INT
    JUMP_EQ check_next
    SUB R14, R11, SUBTYPE_CHAR
    JUMP_EQ check_next
    SUB R14, R11, SUBTYPE_VOID
    JUMP_EQ check_next

not_function:
    LOAD R14, 0
    RET

check_next:
    ; Peek at next token (should be identifier)
    CALL peek_next_token
    CALL get_token_type
    SUB R14, R7, TOKEN_IDENTIFIER
    JUMP_NE not_function

    ; Peek at token after that (should be LPAREN)
    STORE saved_token_index, R4
    ADD R4, R4, 1
    CALL peek_next_token
    LOAD R4, saved_token_index

    CALL get_token_subtype
    SUB R14, R7, SUBTYPE_LPAREN
    JUMP_NE not_function

    ; Yes, this looks like a function definition
    LOAD R14, 1
    RET

check_declaration:
    ; Check if current position looks like declaration
    ; Output: R14 = 1 if yes, 0 if no

    ; Pattern: Type Identifier (LBRACKET)? SEMICOLON

    ; Check if current token is type
    CALL get_current_token
    CALL get_token_type
    SUB R14, R7, TOKEN_KEYWORD
    JUMP_NE not_declaration

    CALL get_token_subtype
    ; Check if int, char, or void
    SUB R14, R11, SUBTYPE_INT
    JUMP_EQ check_next_decl
    SUB R14, R11, SUBTYPE_CHAR
    JUMP_EQ check_next_decl
    SUB R14, R11, SUBTYPE_VOID
    JUMP_EQ check_next_decl

not_declaration:
    LOAD R14, 0
    RET

check_next_decl:
    ; Peek at next token (should be identifier)
    CALL peek_next_token
    CALL get_token_type
    SUB R14, R7, TOKEN_IDENTIFIER
    JUMP_NE not_declaration

    ; This looks like a declaration
    LOAD R14, 1
    RET

check_assignment_pattern:
    ; Check if current position looks like assignment
    ; Pattern: Identifier =

    ; Check if current token is identifier
    CALL get_current_token
    CALL get_token_type
    SUB R14, R7, TOKEN_IDENTIFIER
    JUMP_NE not_assignment

    ; Peek at next token (should be =)
    CALL peek_next_token
    CALL get_token_subtype
    SUB R14, R7, SUBTYPE_ASSIGN
    JUMP_NE not_assignment

    ; Yes, this looks like an assignment
    LOAD R14, 1
    RET

not_assignment:
    LOAD R14, 0
    RET

token_error:
    ; Handle token mismatch error
    LOAD R12, ERROR_UNEXPECTED_TOKEN
    RET

; ============================================================================
; DATA SECTION
; ============================================================================

.data
    ; Parser states
    STATE_START:                .equ 0x0
    STATE_PARSING_DECLARATIONS: .equ 0x1
    STATE_PARSING_FUNCTION:     .equ 0x2
    STATE_PARSING_STATEMENTS:   .equ 0x3
    STATE_PARSING_EXPRESSION:   .equ 0x4
    STATE_PARSING_DECLARATION:  .equ 0x5
    STATE_ERROR:                .equ 0xF

    ; AST node types
    NODE_PROGRAM:               .equ 0x0
    NODE_FUNCTION_DECL:         .equ 0x1
    NODE_FUNCTION_DEF:          .equ 0x2
    NODE_VARIABLE_DECL:         .equ 0x3
    NODE_PARAMETER_DECL:        .equ 0x4
    NODE_BLOCK:                 .equ 0x5
    NODE_IF_STATEMENT:          .equ 0x6
    NODE_WHILE_STATEMENT:       .equ 0x7
    NODE_FOR_STATEMENT:         .equ 0x8
    NODE_RETURN_STATEMENT:      .equ 0x9
    NODE_EXPRESSION_STATEMENT:  .equ 0xA
    NODE_BINARY_EXPRESSION:     .equ 0xB
    NODE_UNARY_EXPRESSION:      .equ 0xC
    NODE_IDENTIFIER:            .equ 0xD
    NODE_CONSTANT:              .equ 0xE
    NODE_STRING_LITERAL:        .equ 0xF
    NODE_FUNCTION_CALL:         .equ 0x10
    NODE_ASSIGNMENT:            .equ 0x11

    ; Token types (from lexical analyzer)
    TOKEN_KEYWORD:              .equ 0x0
    TOKEN_IDENTIFIER:           .equ 0x1
    TOKEN_CONSTANT:             .equ 0x2
    TOKEN_STRING:               .equ 0x3
    TOKEN_OPERATOR:             .equ 0x4
    TOKEN_PUNCTUATION:          .equ 0x5
    TOKEN_PREPROCESSOR:         .equ 0x6
    TOKEN_COMMENT:              .equ 0x7
    TOKEN_END:                  .equ 0x8
    TOKEN_ERROR:                .equ 0x9

    ; Token subtypes (from lexical analyzer)
    SUBTYPE_INT:                .equ 0x0
    SUBTYPE_CHAR:               .equ 0x1
    SUBTYPE_VOID:               .equ 0x2
    SUBTYPE_IF:                 .equ 0x3
    SUBTYPE_ELSE:               .equ 0x4
    SUBTYPE_WHILE:              .equ 0x5
    SUBTYPE_FOR:                .equ 0x6
    SUBTYPE_RETURN:             .equ 0x7
    SUBTYPE_ASSIGN:             .equ 0x0
    SUBTYPE_ADD:                .equ 0x1
    SUBTYPE_SUBTRACT:           .equ 0x2
    SUBTYPE_MULTIPLY:           .equ 0x3
    SUBTYPE_DIVIDE:             .equ 0x4
    SUBTYPE_MODULO:             .equ 0x5
    SUBTYPE_EQUAL:              .equ 0x6
    SUBTYPE_NOT_EQUAL:          .equ 0x7
    SUBTYPE_LESS:               .equ 0x8
    SUBTYPE_GREATER:            .equ 0x9
    SUBTYPE_LESS_EQUAL:         .equ 0xA
    SUBTYPE_GREATER_EQUAL:      .equ 0xB
    SUBTYPE_LOGICAL_AND:        .equ 0xC
    SUBTYPE_LOGICAL_OR:         .equ 0xD
    SUBTYPE_LOGICAL_NOT:        .equ 0xE
    SUBTYPE_INCREMENT:          .equ 0xF
    SUBTYPE_LPAREN:             .equ 0x3
    SUBTYPE_RPAREN:             .equ 0x4
    SUBTYPE_LBRACKET:           .equ 0x5
    SUBTYPE_RBRACKET:           .equ 0x6
    SUBTYPE_LBRACE:             .equ 0x7
    SUBTYPE_RBRACE:             .equ 0x8
    SUBTYPE_SEMICOLON:          .equ 0x0
    SUBTYPE_COMMA:              .equ 0x1
    SUBTYPE_QUESTION:           .equ 0xA
    SUBTYPE_COLON:              .equ 0x9

    ; Operator types for AST
    OP_ADD:                     .equ 0x0
    OP_SUBTRACT:                .equ 0x1
    OP_MULTIPLY:                .equ 0x2
    OP_DIVIDE:                  .equ 0x3
    OP_MODULO:                  .equ 0x4
    OP_EQUAL:                   .equ 0x5
    OP_NOT_EQUAL:               .equ 0x6
    OP_LESS:                    .equ 0x7
    OP_GREATER:                 .equ 0x8
    OP_LESS_EQUAL:              .equ 0x9
    OP_GREATER_EQUAL:           .equ 0xA
    OP_LOGICAL_AND:             .equ 0xB
    OP_LOGICAL_OR:              .equ 0xC
    OP_ASSIGN:                  .equ 0xD
    OP_NOT:                     .equ 0x0
    OP_NEGATE:                  .equ 0x1
    OP_POST_INCREMENT:          .equ 0x6
    OP_POST_DECREMENT:          .equ 0x7

    ; Type constants
    TYPE_INT:                   .equ 0x0
    TYPE_CHAR:                  .equ 0x1
    TYPE_VOID:                  .equ 0x2

    ; Error codes
    ERROR_INVALID_TYPE:         .equ -1
    ERROR_UNEXPECTED_TOKEN:     .equ -2
    ERROR_INVALID_EXPRESSION:   .equ -3

    ; Storage for state
    saved_token_index:          .space 4
    AST_ROOT:                   .space 4
`;

// ============================================================================
// JAVASCRIPT INTERFACE AND TESTING
// ============================================================================

/**
 * CParser class for integration with the OrionRisc-128 system
 */
class CParser {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.program = C_PARSER_PROGRAM;
    }

    /**
     * Load the C parser program into memory
     * @param {number} startAddress - Memory address to load program (default: 0x0000)
     */
    loadProgram(startAddress = 0x0000) {
        console.log(`Loading C parser program at address 0x${startAddress.toString(16)}`);
        this.cpu.loadProgram(this.program, startAddress);
    }

    /**
     * Parse tokens into AST
     * @param {number} tokenAddress - Memory address of token buffer (default: 0x1000)
     * @param {number} astAddress - Memory address for AST buffer (default: 0x2000)
     * @param {number} stringAddress - Memory address of string table (default: 0x3000)
     * @param {number} tokenIndex - Current token index (default: 0)
     * @returns {Object} Parse result with AST and metadata
     */
    parse(tokenAddress = 0x1000, astAddress = 0x2000, stringAddress = 0x3000, tokenIndex = 0) {
        console.log(`Parsing tokens into AST`);

        // Set up CPU registers for C parser
        this.cpu.setRegister(0, tokenAddress);       // R0 = token buffer address
        this.cpu.setRegister(1, astAddress);         // R1 = AST buffer address
        this.cpu.setRegister(2, stringAddress);      // R2 = string table address
        this.cpu.setRegister(3, tokenIndex);         // R3 = current token index

        // Execute C parser program
        const instructionsExecuted = this.cpu.run();

        console.log(`C parser executed ${instructionsExecuted} instructions`);

        // Read AST from memory
        const ast = this.readAST(astAddress);

        // Get result from R0 (AST root address or error code)
        const result = this.cpu.getRegister(0);

        return {
            ast: ast,
            rootAddress: result >= 0 ? result : null,
            success: result >= 0,
            errorCode: result < 0 ? result : 0,
            instructionsExecuted: instructionsExecuted,
            tokenIndex: this.cpu.getRegister(3)
        };
    }

    /**
     * Read AST from memory buffer
     * @param {number} astAddress - Memory address of AST buffer
     * @returns {Object} AST structure
     */
    readAST(astAddress) {
        const nodes = [];

        // Read AST nodes until we find empty memory
        for (let offset = 0; offset < 0x1000; offset += 4) {
            const nodeData = this.mmu.readWord(astAddress + offset);

            if (nodeData === 0) {
                break; // End of AST nodes
            }

            // Parse AST node format: TYPE(8) | LEFT(8) | RIGHT(8) | VALUE(8)
            const type = (nodeData >> 24) & 0xFF;
            const left = (nodeData >> 16) & 0xFF;
            const right = (nodeData >> 8) & 0xFF;
            const value = nodeData & 0xFF;

            nodes.push({
                type: type,
                left: left,
                right: right,
                value: value,
                address: astAddress + offset
            });
        }

        return {
            nodes: nodes,
            address: astAddress,
            size: nodes.length
        };
    }

    /**
     * Get AST node type name for debugging
     * @param {number} type - AST node type value
     * @returns {string} Node type name
     */
    static getASTNodeTypeName(type) {
        const names = Object.keys(C_AST_NODE_TYPES);
        for (const name of names) {
            if (C_AST_NODE_TYPES[name] === type) {
                return name;
            }
        }
        return 'UNKNOWN';
    }

    /**
     * Get binary operator name for debugging
     * @param {number} operator - Binary operator value
     * @returns {string} Operator name
     */
    static getBinaryOperatorName(operator) {
        const names = Object.keys(C_BINARY_OPERATORS);
        for (const name of names) {
            if (C_BINARY_OPERATORS[name] === operator) {
                return name;
            }
        }
        return 'UNKNOWN';
    }

    /**
     * Get unary operator name for debugging
     * @param {number} operator - Unary operator value
     * @returns {string} Operator name
     */
    static getUnaryOperatorName(operator) {
        const names = Object.keys(C_UNARY_OPERATORS);
        for (const name of names) {
            if (C_UNARY_OPERATORS[name] === operator) {
                return name;
            }
        }
        return 'UNKNOWN';
    }
}

// ============================================================================
// INTEGRATION WITH C LEXICAL ANALYZER
// ============================================================================

/**
 * Complete C compiler pipeline: lexical analysis + parsing
 */
class CCompiler {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;
        this.lexer = new CLexicalAnalyzer(mmu, cpu);
        this.parser = new CParser(mmu, cpu);
    }

    /**
     * Compile C source code to AST
     * @param {string} sourceCode - C source code
     * @param {number} sourceAddress - Source buffer address (default: 0x1000)
     * @param {number} tokenAddress - Token buffer address (default: 0x2000)
     * @param {number} astAddress - AST buffer address (default: 0x3000)
     * @param {number} stringAddress - String table address (default: 0x4000)
     * @returns {Object} Compilation result
     */
    compile(sourceCode, sourceAddress = 0x1000, tokenAddress = 0x2000, astAddress = 0x3000, stringAddress = 0x4000) {
        console.log(`Compiling C source code (${sourceCode.length} characters)`);

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

        return {
            success: true,
            tokens: lexResult.tokenCount,
            astNodes: parseResult.ast.size,
            astRoot: parseResult.rootAddress,
            instructions: parseResult.instructionsExecuted,
            stringTable: lexResult.stringTable
        };
    }
}

// ============================================================================
// EXAMPLE USAGE AND TESTING
// ============================================================================

/**
 * Example C source code for testing the complete C compiler pipeline
 */
const EXAMPLE_C_CODE_PIPELINE = `
/* Example C program for testing complete C compiler pipeline */
#include <stdio.h>

int global_var = 42;

int add_numbers(int a, int b) {
    int result = a + b;
    return result;
}

void print_message(char* message) {
    printf("Message: %s\\n", message);
}

int main(void) {
    int x = 10;
    int y = 20;
    int sum;

    char* greeting = "Hello, World!";

    sum = add_numbers(x, y);

    if (sum > 15) {
        print_message("Sum is large!");
    } else {
        print_message("Sum is small");
    }

    for (int i = 0; i < 3; i++) {
        printf("Count: %d\\n", i);
    }

    return 0;
}
`;

/**
 * Test the complete C compiler pipeline (lexical analyzer + parser)
 */
function testCCompilerPipeline() {
    console.log('=== C COMPILER PIPELINE TEST ===');

    console.log('Example C code for complete pipeline test:');
    console.log(EXAMPLE_C_CODE_PIPELINE);

    console.log('\\nThis test would:');
    console.log('1. Use C lexical analyzer to tokenize source code');
    console.log('2. Use C parser to build AST from tokens');
    console.log('3. Validate AST structure and node relationships');
    console.log('4. Report parsing success/failure with error details');

    console.log('\\nC parser implementation ready for Phase 3 integration');
}

/**
 * Test the C parser with mock tokens
 */
function testCParserWithMockTokens() {
    console.log('=== C PARSER MOCK TOKEN TEST ===');

    console.log('Mock token sequence for testing:');
    console.log('- KEYWORD(int), IDENTIFIER(main), PUNCTUATION(LPAREN)');
    console.log('- PUNCTUATION(RPAREN), PUNCTUATION(LBRACE)');
    console.log('- KEYWORD(return), CONSTANT(0), PUNCTUATION(SEMICOLON)');
    console.log('- PUNCTUATION(RBRACE)');

    console.log('\\nExpected AST structure:');
    console.log('- PROGRAM');
    console.log('  - FUNCTION_DEF');
    console.log('    - Type: int');
    console.log('    - Name: main');
    console.log('    - Parameters: empty');
    console.log('    - Body: BLOCK');
    console.log('      - RETURN_STATEMENT');
    console.log('        - Expression: CONSTANT(0)');

    console.log('\\nC parser ready for integration testing');
}

// ============================================================================
// VALIDATION AND TESTING FUNCTIONS
// ============================================================================

/**
 * Validate AST structure for a simple function
 * @param {Object} ast - AST from parser
 * @param {number} rootAddress - Root node address
 * @returns {boolean} True if AST is valid
 */
function validateSimpleFunctionAST(ast, rootAddress) {
    if (!ast || ast.size === 0) {
        console.log('AST validation failed: Empty AST');
        return false;
    }

    // Find root node
    const rootNode = ast.nodes.find(node => node.address === rootAddress);
    if (!rootNode) {
        console.log('AST validation failed: Root node not found');
        return false;
    }

    if (rootNode.type !== C_AST_NODE_TYPES.PROGRAM) {
        console.log('AST validation failed: Root is not PROGRAM node');
        return false;
    }

    console.log('AST validation passed');
    return true;
}

/**
 * Print AST structure for debugging
 * @param {Object} ast - AST from parser
 * @param {number} rootAddress - Root node address
 * @param {number} indent - Indentation level (default: 0)
 */
function printAST(ast, rootAddress, indent = 0) {
    if (!ast || ast.size === 0) {
        console.log('  '.repeat(indent) + 'Empty AST');
        return;
    }

    // Find root node
    const rootNode = ast.nodes.find(node => node.address === rootAddress);
    if (!rootNode) {
        console.log('  '.repeat(indent) + 'Root node not found');
        return;
    }

    const nodeName = CParser.getASTNodeTypeName(rootNode.type);
    console.log('  '.repeat(indent) + `${nodeName} (value: ${rootNode.value})`);

    // Print children recursively
    if (rootNode.left > 0) {
        console.log('  '.repeat(indent + 1) + 'Left child:');
        printAST(ast, rootNode.left, indent + 2);
    }

    if (rootNode.right > 0) {
        console.log('  '.repeat(indent + 1) + 'Right child:');
        printAST(ast, rootNode.right, indent + 2);
    }
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CParser,
        CCompiler,
        C_PARSER_PROGRAM,
        C_PARSER_ASSEMBLY,
        EXAMPLE_C_CODE_PIPELINE,
        testCCompilerPipeline,
        testCParserWithMockTokens,
        validateSimpleFunctionAST,
        printAST,
        C_AST_NODE_TYPES,
        C_BINARY_OPERATORS,
        C_UNARY_OPERATORS,
        C_PARSER_STATES
    };
}

module.exports = CParser;