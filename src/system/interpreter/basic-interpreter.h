/**
 * OrionRisc-128 BASIC Interpreter - Header File
 * Phase 4 Bootstrap Development Implementation
 *
 * This header file defines the interface for the BASIC interpreter
 * that will be compiled using the Phase 3 C compiler.
 */

// Maximum program size in bytes
#define MAX_PROGRAM_SIZE 16384

// Maximum number of variables
#define MAX_VARIABLES 256

// Maximum number of program lines
#define MAX_LINES 1000

// Maximum line length
#define MAX_LINE_LENGTH 256

// Variable name length
#define MAX_VAR_NAME_LENGTH 32

// Array dimensions
#define MAX_ARRAY_DIMENSIONS 3
#define MAX_ARRAY_SIZE 1000

// Error codes
#define ERR_NONE 0
#define ERR_SYNTAX 1
#define ERR_OUT_OF_MEMORY 2
#define ERR_UNDEFINED_VARIABLE 3
#define ERR_TYPE_MISMATCH 4
#define ERR_DIVISION_BY_ZERO 5
#define ERR_ARRAY_BOUNDS 6
#define ERR_STACK_OVERFLOW 7
#define ERR_PROGRAM_TOO_LARGE 8
#define ERR_LINE_NOT_FOUND 9
#define ERR_NEXT_WITHOUT_FOR 10

// Token types for lexical analysis
typedef enum {
    TOK_EOL,           // End of line
    TOK_NUMBER,        // Numeric constant
    TOK_STRING,        // String constant
    TOK_VARIABLE,      // Variable name
    TOK_PRINT,         // PRINT keyword
    TOK_INPUT,         // INPUT keyword
    TOK_LET,           // LET keyword
    TOK_IF,            // IF keyword
    TOK_THEN,          // THEN keyword
    TOK_ELSE,          // ELSE keyword
    TOK_FOR,           // FOR keyword
    TOK_TO,            // TO keyword
    TOK_STEP,          // STEP keyword
    TOK_NEXT,          // NEXT keyword
    TOK_GOSUB,         // GOSUB keyword
    TOK_RETURN,        // RETURN keyword
    TOK_GOTO,          // GOTO keyword
    TOK_READ,          // READ keyword
    TOK_DATA,          // DATA keyword
    TOK_DIM,           // DIM keyword
    TOK_END,           // END keyword
    TOK_STOP,          // STOP keyword
    TOK_REM,           // REM keyword
    TOK_COMMA,         // Comma
    TOK_SEMICOLON,     // Semicolon
    TOK_COLON,         // Colon
    TOK_LPAREN,        // Left parenthesis
    TOK_RPAREN,        // Right parenthesis
    TOK_PLUS,          // Plus operator
    TOK_MINUS,         // Minus operator
    TOK_MULTIPLY,      // Multiply operator
    TOK_DIVIDE,        // Divide operator
    TOK_EQUALS,        // Equals sign
    TOK_LESS,          // Less than
    TOK_GREATER,       // Greater than
    TOK_LESS_EQUAL,    // Less than or equal
    TOK_GREATER_EQUAL, // Greater than or equal
    TOK_NOT_EQUAL,     // Not equal
    TOK_AND,           // AND operator
    TOK_OR,            // OR operator
    TOK_NOT,           // NOT operator
    TOK_FUNCTION       // Function call
} TokenType;

// Token structure
typedef struct {
    TokenType type;
    char stringValue[MAX_VAR_NAME_LENGTH];
    int intValue;
    double floatValue;
} Token;

// Variable types
typedef enum {
    VAR_NUMERIC,
    VAR_STRING,
    VAR_ARRAY_NUMERIC,
    VAR_ARRAY_STRING
} VariableType;

// Variable structure
typedef struct {
    char name[MAX_VAR_NAME_LENGTH];
    VariableType type;
    int dimensions[MAX_ARRAY_DIMENSIONS];
    int size;
    union {
        double numericValue;
        char *stringValue;
        double *numericArray;
        char **stringArray;
    } value;
} Variable;

// Program line structure
typedef struct {
    int lineNumber;
    char *lineText;
    struct ProgramLine *next;
} ProgramLine;

// BASIC interpreter state
typedef struct {
    // Program storage
    ProgramLine *programLines;
    int currentLineNumber;
    int programSize;

    // Variable storage
    Variable variables[MAX_VARIABLES];
    int variableCount;

    // Runtime state
    int running;
    int errorCode;
    char errorMessage[256];

    // Control flow
    int forStack[32];  // FOR loop stack
    int forStackPtr;
    int gosubStack[32]; // GOSUB stack
    int gosubStackPtr;

    // DATA statement handling
    char *dataPointer;
    int dataCount;

    // I/O state
    char inputBuffer[256];
    int inputIndex;
} BASICState;

// Function declarations

// Core interpreter functions
void basic_init(BASICState *state);
int basic_load_program(BASICState *state, const char *programText);
int basic_run_program(BASICState *state);
int basic_execute_line(BASICState *state, const char *lineText);
void basic_set_error(BASICState *state, int errorCode, const char *message);

// Lexical analysis
Token *basic_get_token(const char **linePtr);
int basic_is_keyword(const char *word);
TokenType basic_get_keyword_type(const char *word);

// Expression evaluation
double basic_evaluate_expression(BASICState *state, const char **linePtr);
double basic_evaluate_term(BASICState *state, const char **linePtr);
double basic_evaluate_factor(BASICState *state, const char **linePtr);
double basic_get_variable_value(BASICState *state, const char *varName);
void basic_set_variable_value(BASICState *state, const char *varName, double value);

// Statement handlers
int basic_handle_print(BASICState *state, const char **linePtr);
int basic_handle_input(BASICState *state, const char **linePtr);
int basic_handle_let(BASICState *state, const char **linePtr);
int basic_handle_if(BASICState *state, const char **linePtr);
int basic_handle_for(BASICState *state, const char **linePtr);
int basic_handle_next(BASICState *state, const char **linePtr);
int basic_handle_gosub(BASICState *state, const char **linePtr);
int basic_handle_return(BASICState *state, const char **linePtr);
int basic_handle_goto(BASICState *state, const char **linePtr);
int basic_handle_read(BASICState *state, const char **linePtr);
int basic_handle_data(BASICState *state, const char **linePtr);
int basic_handle_dim(BASICState *state, const char **linePtr);
int basic_handle_end(BASICState *state, const char **linePtr);
int basic_handle_stop(BASICState *state, const char **linePtr);
int basic_handle_rem(BASICState *state, const char **linePtr);

// Variable and array management
Variable *basic_find_variable(BASICState *state, const char *name);
Variable *basic_create_variable(BASICState *state, const char *name, VariableType type);
int basic_create_array(BASICState *state, const char *name, int dimensions[], int size);
double basic_get_array_element(BASICState *state, const char *name, int indices[]);
void basic_set_array_element(BASICState *state, const char *name, int indices[], double value);

// Utility functions
int basic_is_numeric(const char *str);
int basic_is_alpha(const char c);
int basic_is_alphanumeric(const char c);
void basic_str_toupper(char *str);
int basic_parse_int(const char **linePtr);
double basic_parse_float(const char **linePtr);
void basic_skip_whitespace(const char **linePtr);

// Built-in functions
double basic_abs(double x);
double basic_rnd(double x);
double basic_sqr(double x);
double basic_sin(double x);
double basic_cos(double x);
double basic_tan(double x);
double basic_log(double x);
double basic_exp(double x);
double basic_int(double x);
double basic_sgn(double x);

// String functions
char *basic_left(const char *str, int length);
char *basic_right(const char *str, int length);
char *basic_mid(const char *str, int start, int length);
char *basic_str(double value);
double basic_val(const char *str);
int basic_len(const char *str);
char *basic_chr(int asciiCode);
int basic_asc(const char *str);

// Memory management
void *basic_malloc(int size);
void basic_free(void *ptr);
void *basic_calloc(int count, int size);

// I/O functions
void basic_print_char(char c);
char basic_read_char();
void basic_print_string(const char *str);
void basic_print_newline();
void basic_input_string(char *buffer, int maxLength);

// Error handling
const char *basic_get_error_message(int errorCode);

// Debug functions
void basic_dump_variables(BASICState *state);
void basic_dump_program(BASICState *state);
void basic_dump_state(BASICState *state);