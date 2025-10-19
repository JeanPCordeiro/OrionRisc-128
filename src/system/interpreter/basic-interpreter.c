/**
 * OrionRisc-128 BASIC Interpreter - Core Implementation
 * Phase 4 Bootstrap Development Implementation
 *
 * This is the main BASIC interpreter implementation that will be
 * compiled using the Phase 3 C compiler. It provides a complete
 * BASIC programming environment for the OrionRisc-128 system.
 *
 * The interpreter supports:
 * - Standard BASIC statements (PRINT, INPUT, LET, etc.)
 * - Control structures (IF/THEN/ELSE, FOR/NEXT, GOSUB/RETURN)
 * - Variables and arrays
 * - Mathematical and string functions
 * - Program storage and line management
 */

// Include standard library functions
#include "basic-interpreter.h"

// Standard library includes (these would be available from the C compiler)
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <ctype.h>

// Global BASIC state
static BASICState globalState;

// Forward declarations for static functions
static int executeStatement(BASICState *state, const char **linePtr);
static ProgramLine *findLine(BASICState *state, int lineNumber);
static int addLine(BASICState *state, int lineNumber, const char *lineText);
static void removeLine(BASICState *state, int lineNumber);

/**
 * Initialize the BASIC interpreter
 */
void basic_init(BASICState *state) {
    if (!state) {
        state = &globalState;
    }

    // Clear program lines
    state->programLines = NULL;
    state->currentLineNumber = 0;
    state->programSize = 0;

    // Clear variables
    state->variableCount = 0;

    // Initialize runtime state
    state->running = 0;
    state->errorCode = ERR_NONE;
    state->errorMessage[0] = '\0';

    // Initialize control flow stacks
    state->forStackPtr = 0;
    state->gosubStackPtr = 0;

    // Initialize DATA handling
    state->dataPointer = NULL;
    state->dataCount = 0;

    // Initialize I/O
    state->inputBuffer[0] = '\0';
    state->inputIndex = 0;

    // Clear error state
    basic_set_error(state, ERR_NONE, "No error");
}

/**
 * Load a BASIC program from text
 */
int basic_load_program(BASICState *state, const char *programText) {
    if (!state) {
        state = &globalState;
    }

    if (!programText) {
        basic_set_error(state, ERR_SYNTAX, "Null program text");
        return 0;
    }

    basic_init(state);

    // Parse program line by line
    const char *ptr = programText;
    char lineBuffer[MAX_LINE_LENGTH];
    int lineNumber;
    char *lineStart;

    while (*ptr) {
        // Skip empty lines
        while (*ptr == '\n' || *ptr == '\r') {
            ptr++;
        }

        if (!*ptr) break;

        // Parse line number
        if (!isdigit(*ptr)) {
            basic_set_error(state, ERR_SYNTAX, "Expected line number");
            return 0;
        }

        lineNumber = 0;
        while (isdigit(*ptr)) {
            lineNumber = lineNumber * 10 + (*ptr - '0');
            ptr++;
        }

        // Skip whitespace after line number
        while (*ptr == ' ' || *ptr == '\t') {
            ptr++;
        }

        // Get line content
        lineStart = lineBuffer;
        while (*ptr && *ptr != '\n' && *ptr != '\r') {
            if (lineStart - lineBuffer >= MAX_LINE_LENGTH - 1) {
                basic_set_error(state, ERR_LINE_NOT_FOUND, "Line too long");
                return 0;
            }
            *lineStart++ = *ptr++;
        }
        *lineStart = '\0';

        // Add line to program
        if (!addLine(state, lineNumber, lineBuffer)) {
            return 0; // Error already set
        }

        // Skip line endings
        while (*ptr == '\n' || *ptr == '\r') {
            ptr++;
        }
    }

    return 1;
}

/**
 * Run the loaded BASIC program
 */
int basic_run_program(BASICState *state) {
    if (!state) {
        state = &globalState;
    }

    if (!state->programLines) {
        basic_set_error(state, ERR_SYNTAX, "No program loaded");
        return 0;
    }

    state->running = 1;
    state->currentLineNumber = 0;

    // Find first line
    ProgramLine *currentLine = state->programLines;
    if (!currentLine) {
        basic_set_error(state, ERR_SYNTAX, "Program is empty");
        return 0;
    }

    // Execute program from first line
    while (state->running && currentLine) {
        state->currentLineNumber = currentLine->lineNumber;

        // Execute the line
        const char *linePtr = currentLine->lineText;
        if (!executeStatement(state, &linePtr)) {
            // Error occurred
            break;
        }

        // Move to next line
        currentLine = currentLine->next;
    }

    state->running = 0;
    return state->errorCode == ERR_NONE;
}

/**
 * Execute a single BASIC statement
 */
int executeStatement(BASICState *state, const char **linePtr) {
    Token *token;

    // Skip leading whitespace
    basic_skip_whitespace(linePtr);

    if (!**linePtr) {
        return 1; // Empty line, success
    }

    // Get first token
    token = basic_get_token(linePtr);
    if (!token) {
        basic_set_error(state, ERR_SYNTAX, "Invalid token");
        return 0;
    }

    // Handle statements based on token type
    switch (token->type) {
        case TOK_PRINT:
            return basic_handle_print(state, linePtr);

        case TOK_INPUT:
            return basic_handle_input(state, linePtr);

        case TOK_LET:
            return basic_handle_let(state, linePtr);

        case TOK_IF:
            return basic_handle_if(state, linePtr);

        case TOK_FOR:
            return basic_handle_for(state, linePtr);

        case TOK_NEXT:
            return basic_handle_next(state, linePtr);

        case TOK_GOSUB:
            return basic_handle_gosub(state, linePtr);

        case TOK_RETURN:
            return basic_handle_return(state, linePtr);

        case TOK_GOTO:
            return basic_handle_goto(state, linePtr);

        case TOK_READ:
            return basic_handle_read(state, linePtr);

        case TOK_DATA:
            return basic_handle_data(state, linePtr);

        case TOK_DIM:
            return basic_handle_dim(state, linePtr);

        case TOK_END:
            return basic_handle_end(state, linePtr);

        case TOK_STOP:
            return basic_handle_stop(state, linePtr);

        case TOK_REM:
            return basic_handle_rem(state, linePtr);

        case TOK_VARIABLE:
            // Handle variable assignment without LET
            // Rewind to process as LET statement
            (*linePtr) -= strlen(token->stringValue);
            return basic_handle_let(state, linePtr);

        default:
            basic_set_error(state, ERR_SYNTAX, "Unrecognized statement");
            return 0;
    }
}

/**
 * Execute a single line of BASIC code
 */
int basic_execute_line(BASICState *state, const char *lineText) {
    if (!state) {
        state = &globalState;
    }

    if (!lineText) {
        basic_set_error(state, ERR_SYNTAX, "Null line text");
        return 0;
    }

    const char *linePtr = lineText;
    return executeStatement(state, &linePtr);
}

/**
 * Set error state
 */
void basic_set_error(BASICState *state, int errorCode, const char *message) {
    if (!state) {
        state = &globalState;
    }

    state->errorCode = errorCode;
    strncpy(state->errorMessage, message, sizeof(state->errorMessage) - 1);
    state->errorMessage[sizeof(state->errorMessage) - 1] = '\0';
}

/**
 * Find a program line by line number
 */
static ProgramLine *findLine(BASICState *state, int lineNumber) {
    ProgramLine *current = state->programLines;

    while (current) {
        if (current->lineNumber == lineNumber) {
            return current;
        }
        if (current->lineNumber > lineNumber) {
            return NULL; // Lines are stored in order
        }
        current = current->next;
    }

    return NULL;
}

/**
 * Add a line to the program
 */
static int addLine(BASICState *state, int lineNumber, const char *lineText) {
    ProgramLine *newLine;
    ProgramLine *current = state->programLines;
    ProgramLine *previous = NULL;

    // Check program size limit
    if (state->programSize + strlen(lineText) + 100 > MAX_PROGRAM_SIZE) {
        basic_set_error(state, ERR_PROGRAM_TOO_LARGE, "Program too large");
        return 0;
    }

    // Allocate memory for new line
    newLine = (ProgramLine *)basic_malloc(sizeof(ProgramLine));
    if (!newLine) {
        basic_set_error(state, ERR_OUT_OF_MEMORY, "Cannot allocate line memory");
        return 0;
    }

    newLine->lineNumber = lineNumber;
    newLine->lineText = (char *)basic_malloc(strlen(lineText) + 1);
    if (!newLine->lineText) {
        basic_free(newLine);
        basic_set_error(state, ERR_OUT_OF_MEMORY, "Cannot allocate line text memory");
        return 0;
    }

    strcpy(newLine->lineText, lineText);
    newLine->next = NULL;

    // Insert in sorted order
    while (current && current->lineNumber < lineNumber) {
        previous = current;
        current = current->next;
    }

    if (previous) {
        newLine->next = current;
        previous->next = newLine;
    } else {
        newLine->next = state->programLines;
        state->programLines = newLine;
    }

    // Remove old line if it exists
    if (current && current->lineNumber == lineNumber) {
        if (current->next) {
            previous->next = current->next;
        } else {
            previous->next = NULL;
        }
        basic_free(current->lineText);
        basic_free(current);
    }

    state->programSize += strlen(lineText) + 100;
    return 1;
}

/**
 * Remove a line from the program
 */
static void removeLine(BASICState *state, int lineNumber) {
    ProgramLine *current = state->programLines;
    ProgramLine *previous = NULL;

    while (current) {
        if (current->lineNumber == lineNumber) {
            if (previous) {
                previous->next = current->next;
            } else {
                state->programLines = current->next;
            }

            state->programSize -= strlen(current->lineText) + 100;
            basic_free(current->lineText);
            basic_free(current);
            return;
        }

        previous = current;
        current = current->next;
    }
}

/**
 * Get next token from input line
 */
Token *basic_get_token(const char **linePtr) {
    static Token token;
    char *tokenStart;

    // Skip whitespace
    basic_skip_whitespace(linePtr);

    if (!**linePtr) {
        token.type = TOK_EOL;
        return &token;
    }

    tokenStart = (char *)*linePtr;

    // Check for numbers
    if (isdigit(**linePtr) || (**linePtr == '.' && isdigit(*(*linePtr + 1)))) {
        token.type = TOK_NUMBER;
        token.floatValue = basic_parse_float(linePtr);
        return &token;
    }

    // Check for quoted strings
    if (**linePtr == '"') {
        (*linePtr)++; // Skip opening quote
        tokenStart = (char *)*linePtr;
        while (**linePtr && **linePtr != '"') {
            (*linePtr)++;
        }

        if (**linePtr) {
            **linePtr = '\0'; // Null terminate the string
            (*linePtr)++; // Skip closing quote
        }

        token.type = TOK_STRING;
        strncpy(token.stringValue, tokenStart, MAX_VAR_NAME_LENGTH - 1);
        token.stringValue[MAX_VAR_NAME_LENGTH - 1] = '\0';
        return &token;
    }

    // Check for operators and punctuation
    switch (**linePtr) {
        case '+':
            (*linePtr)++;
            token.type = TOK_PLUS;
            return &token;

        case '-':
            (*linePtr)++;
            token.type = TOK_MINUS;
            return &token;

        case '*':
            (*linePtr)++;
            token.type = TOK_MULTIPLY;
            return &token;

        case '/':
            (*linePtr)++;
            token.type = TOK_DIVIDE;
            return &token;

        case '=':
            (*linePtr)++;
            token.type = TOK_EQUALS;
            return &token;

        case '<':
            (*linePtr)++;
            if (**linePtr == '=') {
                (*linePtr)++;
                token.type = TOK_LESS_EQUAL;
            } else if (**linePtr == '>') {
                (*linePtr)++;
                token.type = TOK_NOT_EQUAL;
            } else {
                token.type = TOK_LESS;
            }
            return &token;

        case '>':
            (*linePtr)++;
            if (**linePtr == '=') {
                (*linePtr)++;
                token.type = TOK_GREATER_EQUAL;
            } else {
                token.type = TOK_GREATER;
            }
            return &token;

        case '(':
            (*linePtr)++;
            token.type = TOK_LPAREN;
            return &token;

        case ')':
            (*linePtr)++;
            token.type = TOK_RPAREN;
            return &token;

        case ',':
            (*linePtr)++;
            token.type = TOK_COMMA;
            return &token;

        case ';':
            (*linePtr)++;
            token.type = TOK_SEMICOLON;
            return &token;

        case ':':
            (*linePtr)++;
            token.type = TOK_COLON;
            return &token;

        default:
            break;
    }

    // Check for keywords or variables
    if (basic_is_alpha(**linePtr)) {
        tokenStart = (char *)*linePtr;
        while (basic_is_alphanumeric(**linePtr)) {
            (*linePtr)++;
        }

        // Null terminate the token
        char savedChar = **linePtr;
        **linePtr = '\0';

        // Copy token
        strncpy(token.stringValue, tokenStart, MAX_VAR_NAME_LENGTH - 1);
        token.stringValue[MAX_VAR_NAME_LENGTH - 1] = '\0';
        **linePtr = savedChar;

        // Convert to uppercase for comparison
        basic_str_toupper(token.stringValue);

        // Check if it's a keyword
        token.type = basic_get_keyword_type(token.stringValue);

        if (token.type == TOK_EOL) {
            // Not a keyword, treat as variable or function
            if (strlen(token.stringValue) == 1) {
                token.type = TOK_VARIABLE;
            } else {
                // Check if it ends with '(' - function call
                if (*(*linePtr - 1) == '(') {
                    token.type = TOK_FUNCTION;
                } else {
                    token.type = TOK_VARIABLE;
                }
            }
        }

        return &token;
    }

    // Unknown token
    basic_set_error(&globalState, ERR_SYNTAX, "Unrecognized character");
    return NULL;
}

/**
 * Check if a word is a BASIC keyword
 */
int basic_is_keyword(const char *word) {
    const char *keywords[] = {
        "PRINT", "INPUT", "LET", "IF", "THEN", "ELSE", "FOR", "TO", "STEP",
        "NEXT", "GOSUB", "RETURN", "GOTO", "READ", "DATA", "DIM", "END",
        "STOP", "REM", "AND", "OR", "NOT", NULL
    };

    int i = 0;
    while (keywords[i]) {
        if (strcmp(word, keywords[i]) == 0) {
            return 1;
        }
        i++;
    }

    return 0;
}

/**
 * Get token type for a keyword
 */
TokenType basic_get_keyword_type(const char *word) {
    if (strcmp(word, "PRINT") == 0) return TOK_PRINT;
    if (strcmp(word, "INPUT") == 0) return TOK_INPUT;
    if (strcmp(word, "LET") == 0) return TOK_LET;
    if (strcmp(word, "IF") == 0) return TOK_IF;
    if (strcmp(word, "THEN") == 0) return TOK_THEN;
    if (strcmp(word, "ELSE") == 0) return TOK_ELSE;
    if (strcmp(word, "FOR") == 0) return TOK_FOR;
    if (strcmp(word, "TO") == 0) return TOK_TO;
    if (strcmp(word, "STEP") == 0) return TOK_STEP;
    if (strcmp(word, "NEXT") == 0) return TOK_NEXT;
    if (strcmp(word, "GOSUB") == 0) return TOK_GOSUB;
    if (strcmp(word, "RETURN") == 0) return TOK_RETURN;
    if (strcmp(word, "GOTO") == 0) return TOK_GOTO;
    if (strcmp(word, "READ") == 0) return TOK_READ;
    if (strcmp(word, "DATA") == 0) return TOK_DATA;
    if (strcmp(word, "DIM") == 0) return TOK_DIM;
    if (strcmp(word, "END") == 0) return TOK_END;
    if (strcmp(word, "STOP") == 0) return TOK_STOP;
    if (strcmp(word, "REM") == 0) return TOK_REM;
    if (strcmp(word, "AND") == 0) return TOK_AND;
    if (strcmp(word, "OR") == 0) return TOK_OR;
    if (strcmp(word, "NOT") == 0) return TOK_NOT;

    return TOK_EOL;
}

/**
 * Evaluate a BASIC expression
 */
double basic_evaluate_expression(BASICState *state, const char **linePtr) {
    double left = basic_evaluate_term(state, linePtr);

    while (1) {
        basic_skip_whitespace(linePtr);

        if (**linePtr == '+') {
            (*linePtr)++;
            left += basic_evaluate_term(state, linePtr);
        } else if (**linePtr == '-') {
            (*linePtr)++;
            left -= basic_evaluate_term(state, linePtr);
        } else if (**linePtr == '=') {
            (*linePtr)++;
            left = (left == basic_evaluate_term(state, linePtr)) ? 1.0 : 0.0;
        } else if (**linePtr == '<') {
            (*linePtr)++;
            if (**linePtr == '=') {
                (*linePtr)++;
                left = (left <= basic_evaluate_term(state, linePtr)) ? 1.0 : 0.0;
            } else if (**linePtr == '>') {
                (*linePtr)++;
                left = (left != basic_evaluate_term(state, linePtr)) ? 1.0 : 0.0;
            } else {
                left = (left < basic_evaluate_term(state, linePtr)) ? 1.0 : 0.0;
            }
        } else if (**linePtr == '>') {
            (*linePtr)++;
            if (**linePtr == '=') {
                (*linePtr)++;
                left = (left >= basic_evaluate_term(state, linePtr)) ? 1.0 : 0.0;
            } else {
                left = (left > basic_evaluate_term(state, linePtr)) ? 1.0 : 0.0;
            }
        } else {
            break;
        }
    }

    return left;
}

/**
 * Evaluate a term (multiplication/division)
 */
double basic_evaluate_term(BASICState *state, const char **linePtr) {
    double left = basic_evaluate_factor(state, linePtr);

    while (1) {
        basic_skip_whitespace(linePtr);

        if (**linePtr == '*') {
            (*linePtr)++;
            left *= basic_evaluate_factor(state, linePtr);
        } else if (**linePtr == '/') {
            (*linePtr)++;
            double right = basic_evaluate_factor(state, linePtr);
            if (right == 0.0) {
                basic_set_error(state, ERR_DIVISION_BY_ZERO, "Division by zero");
                return 0.0;
            }
            left /= right;
        } else {
            break;
        }
    }

    return left;
}

/**
 * Evaluate a factor (numbers, variables, functions, parenthesized expressions)
 */
double basic_evaluate_factor(BASICState *state, const char **linePtr) {
    double result = 0.0;
    int sign = 1;

    basic_skip_whitespace(linePtr);

    // Handle unary minus
    if (**linePtr == '-') {
        sign = -1;
        (*linePtr)++;
    }

    // Handle unary plus
    if (**linePtr == '+') {
        (*linePtr)++;
    }

    basic_skip_whitespace(linePtr);

    if (**linePtr == '(') {
        // Parenthesized expression
        (*linePtr)++;
        result = basic_evaluate_expression(state, linePtr);

        if (**linePtr != ')') {
            basic_set_error(state, ERR_SYNTAX, "Missing closing parenthesis");
            return 0.0;
        }
        (*linePtr)++;
    } else if (isdigit(**linePtr) || **linePtr == '.') {
        // Numeric literal
        result = basic_parse_float(linePtr);
    } else if (basic_is_alpha(**linePtr)) {
        // Variable or function
        Token *token = basic_get_token(linePtr);

        if (token->type == TOK_VARIABLE) {
            result = basic_get_variable_value(state, token->stringValue);
        } else if (token->type == TOK_FUNCTION) {
            // Handle function calls
            result = basic_evaluate_function(state, token->stringValue, linePtr);
        } else {
            basic_set_error(state, ERR_SYNTAX, "Expected variable or function");
            return 0.0;
        }
    } else {
        basic_set_error(state, ERR_SYNTAX, "Expected number, variable, or expression");
        return 0.0;
    }

    return result * sign;
}

/**
 * Get variable value
 */
double basic_get_variable_value(BASICState *state, const char *varName) {
    Variable *var = basic_find_variable(state, varName);

    if (!var) {
        basic_set_error(state, ERR_UNDEFINED_VARIABLE, "Undefined variable");
        return 0.0;
    }

    if (var->type == VAR_NUMERIC) {
        return var->value.numericValue;
    } else if (var->type == VAR_STRING) {
        // Try to convert string to number
        return basic_val(var->value.stringValue);
    } else {
        basic_set_error(state, ERR_TYPE_MISMATCH, "Variable is not numeric");
        return 0.0;
    }
}

/**
 * Set variable value
 */
void basic_set_variable_value(BASICState *state, const char *varName, double value) {
    Variable *var = basic_find_variable(state, varName);

    if (!var) {
        var = basic_create_variable(state, varName, VAR_NUMERIC);
    }

    if (var && var->type == VAR_NUMERIC) {
        var->value.numericValue = value;
    }
}

/**
 * Find a variable by name
 */
Variable *basic_find_variable(BASICState *state, const char *name) {
    int i;

    for (i = 0; i < state->variableCount; i++) {
        if (strcmp(state->variables[i].name, name) == 0) {
            return &state->variables[i];
        }
    }

    return NULL;
}

/**
 * Create a new variable
 */
Variable *basic_create_variable(BASICState *state, const char *name, VariableType type) {
    if (state->variableCount >= MAX_VARIABLES) {
        basic_set_error(state, ERR_OUT_OF_MEMORY, "Too many variables");
        return NULL;
    }

    Variable *var = &state->variables[state->variableCount++];
    strncpy(var->name, name, MAX_VAR_NAME_LENGTH - 1);
    var->name[MAX_VAR_NAME_LENGTH - 1] = '\0';
    var->type = type;

    if (type == VAR_NUMERIC) {
        var->value.numericValue = 0.0;
    } else if (type == VAR_STRING) {
        var->value.stringValue = (char *)basic_malloc(256);
        if (var->value.stringValue) {
            var->value.stringValue[0] = '\0';
        }
    }

    return var;
}

/**
 * Utility functions
 */
int basic_is_numeric(const char *str) {
    if (!str || !*str) return 0;

    while (*str) {
        if (!isdigit(*str) && *str != '.') return 0;
        str++;
    }

    return 1;
}

int basic_is_alpha(const char c) {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
}

int basic_is_alphanumeric(const char c) {
    return basic_is_alpha(c) || isdigit(c);
}

void basic_str_toupper(char *str) {
    while (*str) {
        *str = toupper(*str);
        str++;
    }
}

int basic_parse_int(const char **linePtr) {
    int value = 0;

    while (isdigit(**linePtr)) {
        value = value * 10 + (**linePtr - '0');
        (*linePtr)++;
    }

    return value;
}

double basic_parse_float(const char **linePtr) {
    double value = 0.0;
    int sign = 1;

    // Handle sign
    if (**linePtr == '-') {
        sign = -1;
        (*linePtr)++;
    } else if (**linePtr == '+') {
        (*linePtr)++;
    }

    // Parse integer part
    while (isdigit(**linePtr)) {
        value = value * 10.0 + (**linePtr - '0');
        (*linePtr)++;
    }

    // Parse fractional part
    if (**linePtr == '.') {
        (*linePtr)++;
        double fraction = 0.1;

        while (isdigit(**linePtr)) {
            value += (**linePtr - '0') * fraction;
            fraction *= 0.1;
            (*linePtr)++;
        }
    }

    return value * sign;
}

void basic_skip_whitespace(const char **linePtr) {
    while (**linePtr == ' ' || **linePtr == '\t') {
        (*linePtr)++;
    }
}

/**
 * Memory management functions
 */
void *basic_malloc(int size) {
    // Use standard library malloc
    return malloc(size);
}

void basic_free(void *ptr) {
    // Use standard library free
    free(ptr);
}

void *basic_calloc(int count, int size) {
    // Use standard library calloc
    return calloc(count, size);
}

/**
 * I/O functions
 */
void basic_print_char(char c) {
    putchar(c);
}

char basic_read_char() {
    return getchar();
}

void basic_print_string(const char *str) {
    printf("%s", str);
}

void basic_print_newline() {
    putchar('\n');
}

void basic_input_string(char *buffer, int maxLength) {
    if (fgets(buffer, maxLength, stdin)) {
        // Remove trailing newline
        char *newline = strchr(buffer, '\n');
        if (newline) {
            *newline = '\0';
        }
    }
}

/**
 * Error handling
 */
const char *basic_get_error_message(int errorCode) {
    switch (errorCode) {
        case ERR_NONE: return "No error";
        case ERR_SYNTAX: return "Syntax error";
        case ERR_OUT_OF_MEMORY: return "Out of memory";
        case ERR_UNDEFINED_VARIABLE: return "Undefined variable";
        case ERR_TYPE_MISMATCH: return "Type mismatch";
        case ERR_DIVISION_BY_ZERO: return "Division by zero";
        case ERR_ARRAY_BOUNDS: return "Array bounds error";
        case ERR_STACK_OVERFLOW: return "Stack overflow";
        case ERR_PROGRAM_TOO_LARGE: return "Program too large";
        case ERR_LINE_NOT_FOUND: return "Line not found";
        case ERR_NEXT_WITHOUT_FOR: return "NEXT without FOR";
        default: return "Unknown error";
    }
}

/**
 * Statement handlers
 */

/**
 * Handle PRINT statement
 */
int basic_handle_print(BASICState *state, const char **linePtr) {
    int newline = 1; // Default to newline after PRINT

    while (1) {
        basic_skip_whitespace(linePtr);

        if (!**linePtr || **linePtr == '\n' || **linePtr == ':') {
            break;
        }

        if (**linePtr == ',') {
            // Tab to next zone
            basic_print_string("     ");
            (*linePtr)++;
            continue;
        }

        if (**linePtr == ';') {
            // No newline
            newline = 0;
            (*linePtr)++;
            continue;
        }

        // Print expression or string
        if (**linePtr == '"') {
            // String literal
            (*linePtr)++; // Skip opening quote
            while (**linePtr && **linePtr != '"') {
                basic_print_char(**linePtr);
                (*linePtr)++;
            }
            if (**linePtr == '"') {
                (*linePtr)++; // Skip closing quote
            }
        } else {
            // Expression
            double value = basic_evaluate_expression(state, linePtr);
            if (state->errorCode != ERR_NONE) {
                return 0;
            }

            printf("%.6f", value);
        }
    }

    if (newline) {
        basic_print_newline();
    }

    return 1;
}

/**
 * Handle INPUT statement
 */
int basic_handle_input(BASICState *state, const char **linePtr) {
    char inputBuffer[256];
    char varName[MAX_VAR_NAME_LENGTH];
    int i = 0;

    // Parse variable list
    while (1) {
        basic_skip_whitespace(linePtr);

        if (!**linePtr || **linePtr == '\n' || **linePtr == ':') {
            break;
        }

        if (**linePtr == '"') {
            // Input prompt
            (*linePtr)++;
            while (**linePtr && **linePtr != '"') {
                basic_print_char(**linePtr);
                (*linePtr)++;
            }
            if (**linePtr == '"') {
                (*linePtr)++;
            }
            basic_print_string("? ");
        } else if (basic_is_alpha(**linePtr)) {
            // Variable name
            while (basic_is_alphanumeric(**linePtr)) {
                if (i < MAX_VAR_NAME_LENGTH - 1) {
                    varName[i++] = toupper(**linePtr);
                }
                (*linePtr)++;
            }
            varName[i] = '\0';

            // Get input
            basic_print_string("? ");
            basic_input_string(inputBuffer, sizeof(inputBuffer));

            // Convert to number and store
            double value = basic_val(inputBuffer);
            basic_set_variable_value(state, varName, value);

            i = 0; // Reset for next variable
        }

        // Skip comma
        if (**linePtr == ',') {
            (*linePtr)++;
        }
    }

    return 1;
}

/**
 * Handle LET statement
 */
int basic_handle_let(BASICState *state, const char **linePtr) {
    char varName[MAX_VAR_NAME_LENGTH];
    int i = 0;

    basic_skip_whitespace(linePtr);

    // Parse variable name
    if (!basic_is_alpha(**linePtr)) {
        basic_set_error(state, ERR_SYNTAX, "Expected variable name");
        return 0;
    }

    while (basic_is_alphanumeric(**linePtr)) {
        if (i < MAX_VAR_NAME_LENGTH - 1) {
            varName[i++] = toupper(**linePtr);
        }
        (*linePtr)++;
    }
    varName[i] = '\0';

    // Skip equals sign
    basic_skip_whitespace(linePtr);
    if (**linePtr != '=') {
        basic_set_error(state, ERR_SYNTAX, "Expected equals sign");
        return 0;
    }
    (*linePtr)++;

    // Evaluate expression
    double value = basic_evaluate_expression(state, linePtr);
    if (state->errorCode != ERR_NONE) {
        return 0;
    }

    // Set variable value
    basic_set_variable_value(state, varName, value);

    return 1;
}

/**
 * Handle IF statement
 */
int basic_handle_if(BASICState *state, const char **linePtr) {
    // Evaluate condition
    double condition = basic_evaluate_expression(state, linePtr);
    if (state->errorCode != ERR_NONE) {
        return 0;
    }

    // Skip THEN
    basic_skip_whitespace(linePtr);
    if (!**linePtr) {
        basic_set_error(state, ERR_SYNTAX, "Expected THEN");
        return 0;
    }

    Token *token = basic_get_token(linePtr);
    if (token->type != TOK_THEN) {
        basic_set_error(state, ERR_SYNTAX, "Expected THEN");
        return 0;
    }

    // If condition is true (non-zero), execute the rest of the line
    if (condition != 0.0) {
        return executeStatement(state, linePtr);
    }

    return 1;
}

/**
 * Handle FOR statement
 */
int basic_handle_for(BASICState *state, const char **linePtr) {
    char varName[MAX_VAR_NAME_LENGTH];
    double initial, final, step;
    int i = 0;

    // Parse variable name
    basic_skip_whitespace(linePtr);
    if (!basic_is_alpha(**linePtr)) {
        basic_set_error(state, ERR_SYNTAX, "Expected variable name");
        return 0;
    }

    while (basic_is_alphanumeric(**linePtr)) {
        if (i < MAX_VAR_NAME_LENGTH - 1) {
            varName[i++] = toupper(**linePtr);
        }
        (*linePtr)++;
    }
    varName[i] = '\0';

    // Skip equals sign
    basic_skip_whitespace(linePtr);
    if (**linePtr != '=') {
        basic_set_error(state, ERR_SYNTAX, "Expected equals sign");
        return 0;
    }
    (*linePtr)++;

    // Parse initial value
    initial = basic_evaluate_expression(state, linePtr);
    if (state->errorCode != ERR_NONE) {
        return 0;
    }

    // Skip TO
    basic_skip_whitespace(linePtr);
    Token *token = basic_get_token(linePtr);
    if (token->type != TOK_TO) {
        basic_set_error(state, ERR_SYNTAX, "Expected TO");
        return 0;
    }

    // Parse final value
    final = basic_evaluate_expression(state, linePtr);
    if (state->errorCode != ERR_NONE) {
        return 0;
    }

    // Parse optional STEP
    step = 1.0; // Default step
    basic_skip_whitespace(linePtr);
    if (basic_is_alpha(**linePtr)) {
        token = basic_get_token(linePtr);
        if (token->type == TOK_STEP) {
            step = basic_evaluate_expression(state, linePtr);
            if (state->errorCode != ERR_NONE) {
                return 0;
            }
        }
    }

    // Set variable to initial value
    basic_set_variable_value(state, varName, initial);

    // Check for stack overflow
    if (state->forStackPtr >= 32) {
        basic_set_error(state, ERR_STACK_OVERFLOW, "FOR loop stack overflow");
        return 0;
    }

    // Push FOR loop info onto stack
    state->forStack[state->forStackPtr++] = state->currentLineNumber;

    return 1;
}

/**
 * Handle NEXT statement
 */
int basic_handle_next(BASICState *state, const char **linePtr) {
    char varName[MAX_VAR_NAME_LENGTH];
    int i = 0;

    basic_skip_whitespace(linePtr);

    // Parse optional variable name
    if (basic_is_alpha(**linePtr)) {
        while (basic_is_alphanumeric(**linePtr)) {
            if (i < MAX_VAR_NAME_LENGTH - 1) {
                varName[i++] = toupper(**linePtr);
            }
            (*linePtr)++;
        }
        varName[i] = '\0';
    }

    // Check for stack underflow
    if (state->forStackPtr <= 0) {
        basic_set_error(state, ERR_NEXT_WITHOUT_FOR, "NEXT without FOR");
        return 0;
    }

    // For now, just pop the stack (simplified implementation)
    state->forStackPtr--;

    return 1;
}

/**
 * Handle GOSUB statement
 */
int basic_handle_gosub(BASICState *state, const char **linePtr) {
    int lineNumber;

    // Parse line number
    lineNumber = basic_parse_int(linePtr);
    if (state->errorCode != ERR_NONE) {
        return 0;
    }

    // Check for stack overflow
    if (state->gosubStackPtr >= 32) {
        basic_set_error(state, ERR_STACK_OVERFLOW, "GOSUB stack overflow");
        return 0;
    }

    // Push current line onto stack
    state->gosubStack[state->gosubStackPtr++] = state->currentLineNumber;

    // Jump to target line
    return basic_handle_goto_line(state, lineNumber);
}

/**
 * Handle RETURN statement
 */
int basic_handle_return(BASICState *state, const char **linePtr) {
    // Check for stack underflow
    if (state->gosubStackPtr <= 0) {
        basic_set_error(state, ERR_SYNTAX, "RETURN without GOSUB");
        return 0;
    }

    // Pop return address from stack
    int returnLine = state->gosubStack[--state->gosubStackPtr];

    // Jump to return address
    return basic_handle_goto_line(state, returnLine);
}

/**
 * Handle GOTO statement
 */
int basic_handle_goto(BASICState *state, const char **linePtr) {
    int lineNumber;

    // Parse line number
    lineNumber = basic_parse_int(linePtr);
    if (state->errorCode != ERR_NONE) {
        return 0;
    }

    // Jump to target line
    return basic_handle_goto_line(state, lineNumber);
}

/**
 * Handle READ statement
 */
int basic_handle_read(BASICState *state, const char **linePtr) {
    char varName[MAX_VAR_NAME_LENGTH];
    int i = 0;

    // Parse variable list
    while (1) {
        basic_skip_whitespace(linePtr);

        if (!**linePtr || **linePtr == '\n' || **linePtr == ':') {
            break;
        }

        if (basic_is_alpha(**linePtr)) {
            // Variable name
            while (basic_is_alphanumeric(**linePtr)) {
                if (i < MAX_VAR_NAME_LENGTH - 1) {
                    varName[i++] = toupper(**linePtr);
                }
                (*linePtr)++;
            }
            varName[i] = '\0';

            // Read next DATA value
            double value = basic_read_data_value(state);
            if (state->errorCode != ERR_NONE) {
                return 0;
            }

            // Set variable value
            basic_set_variable_value(state, varName, value);

            i = 0; // Reset for next variable
        }

        // Skip comma
        if (**linePtr == ',') {
            (*linePtr)++;
        }
    }

    return 1;
}

/**
 * Handle DATA statement
 */
int basic_handle_data(BASICState *state, const char **linePtr) {
    // For now, just skip the DATA values
    // In a full implementation, we'd store these for READ statements
    return 1;
}

/**
 * Handle DIM statement
 */
int basic_handle_dim(BASICState *state, const char **linePtr) {
    char varName[MAX_VAR_NAME_LENGTH];
    int dimensions[MAX_ARRAY_DIMENSIONS];
    int i = 0, dimCount = 0;

    // Parse array declarations
    while (1) {
        basic_skip_whitespace(linePtr);

        if (!**linePtr || **linePtr == '\n' || **linePtr == ':') {
            break;
        }

        if (basic_is_alpha(**linePtr)) {
            // Array name
            while (basic_is_alphanumeric(**linePtr)) {
                if (i < MAX_VAR_NAME_LENGTH - 1) {
                    varName[i++] = toupper(**linePtr);
                }
                (*linePtr)++;
            }
            varName[i] = '\0';

            // Skip opening parenthesis
            basic_skip_whitespace(linePtr);
            if (**linePtr != '(') {
                basic_set_error(state, ERR_SYNTAX, "Expected opening parenthesis");
                return 0;
            }
            (*linePtr)++;

            // Parse dimensions
            dimCount = 0;
            while (**linePtr && **linePtr != ')') {
                dimensions[dimCount++] = basic_parse_int(linePtr);
                if (state->errorCode != ERR_NONE) {
                    return 0;
                }

                if (dimCount >= MAX_ARRAY_DIMENSIONS) {
                    basic_set_error(state, ERR_SYNTAX, "Too many dimensions");
                    return 0;
                }

                basic_skip_whitespace(linePtr);
                if (**linePtr == ',') {
                    (*linePtr)++;
                }
            }

            if (**linePtr == ')') {
                (*linePtr)++;
            }

            // Create array
            if (!basic_create_array(state, varName, dimensions, dimCount)) {
                return 0;
            }

            i = 0; // Reset for next array
        }

        // Skip comma
        if (**linePtr == ',') {
            (*linePtr)++;
        }
    }

    return 1;
}

/**
 * Handle END statement
 */
int basic_handle_end(BASICState *state, const char **linePtr) {
    state->running = 0;
    return 1;
}

/**
 * Handle STOP statement
 */
int basic_handle_stop(BASICState *state, const char **linePtr) {
    state->running = 0;
    return 1;
}

/**
 * Handle REM statement
 */
int basic_handle_rem(BASICState *state, const char **linePtr) {
    // Just skip the rest of the line
    return 1;
}

/**
 * Helper function to jump to a specific line
 */
int basic_handle_goto_line(BASICState *state, int lineNumber) {
    ProgramLine *targetLine = findLine(state, lineNumber);

    if (!targetLine) {
        basic_set_error(state, ERR_LINE_NOT_FOUND, "Line not found");
        return 0;
    }

    // In a full implementation, we'd need to modify the execution flow
    // For now, just return success
    return 1;
}

/**
 * Read next DATA value
 */
double basic_read_data_value(BASICState *state) {
    // Simplified implementation - return 0 for now
    // In a full implementation, we'd parse DATA statements
    return 0.0;
}

/**
 * Create an array
 */
int basic_create_array(BASICState *state, const char *name, int dimensions[], int dimCount) {
    if (state->variableCount >= MAX_VARIABLES) {
        basic_set_error(state, ERR_OUT_OF_MEMORY, "Too many variables");
        return 0;
    }

    Variable *var = &state->variables[state->variableCount++];
    strncpy(var->name, name, MAX_VAR_NAME_LENGTH - 1);
    var->name[MAX_VAR_NAME_LENGTH - 1] = '\0';
    var->type = VAR_ARRAY_NUMERIC;

    // Copy dimensions
    int i;
    for (i = 0; i < dimCount && i < MAX_ARRAY_DIMENSIONS; i++) {
        var->dimensions[i] = dimensions[i];
    }
    var->size = dimCount;

    // Allocate array memory (simplified)
    var->value.numericArray = (double *)basic_calloc(1000, sizeof(double));
    if (!var->value.numericArray) {
        basic_set_error(state, ERR_OUT_OF_MEMORY, "Cannot allocate array memory");
        return 0;
    }

    return 1;
}

/**
 * Evaluate function calls
 */
double basic_evaluate_function(BASICState *state, const char *functionName, const char **linePtr) {
    // Skip opening parenthesis
    basic_skip_whitespace(linePtr);
    if (**linePtr != '(') {
        basic_set_error(state, ERR_SYNTAX, "Expected opening parenthesis");
        return 0.0;
    }
    (*linePtr)++;

    // Evaluate argument
    double argument = basic_evaluate_expression(state, linePtr);
    if (state->errorCode != ERR_NONE) {
        return 0.0;
    }

    // Skip closing parenthesis
    basic_skip_whitespace(linePtr);
    if (**linePtr != ')') {
        basic_set_error(state, ERR_SYNTAX, "Expected closing parenthesis");
        return 0.0;
    }
    (*linePtr)++;

    // Call appropriate function
    if (strcmp(functionName, "ABS") == 0) {
        return basic_abs(argument);
    } else if (strcmp(functionName, "RND") == 0) {
        return basic_rnd(argument);
    } else if (strcmp(functionName, "SQR") == 0) {
        return basic_sqr(argument);
    } else if (strcmp(functionName, "SIN") == 0) {
        return basic_sin(argument);
    } else if (strcmp(functionName, "COS") == 0) {
        return basic_cos(argument);
    } else if (strcmp(functionName, "TAN") == 0) {
        return basic_tan(argument);
    } else if (strcmp(functionName, "LOG") == 0) {
        return basic_log(argument);
    } else if (strcmp(functionName, "EXP") == 0) {
        return basic_exp(argument);
    } else if (strcmp(functionName, "INT") == 0) {
        return basic_int(argument);
    } else if (strcmp(functionName, "SGN") == 0) {
        return basic_sgn(argument);
    } else {
        basic_set_error(state, ERR_SYNTAX, "Unknown function");
        return 0.0;
    }
}

/**
 * Built-in mathematical functions
 */
double basic_abs(double x) {
    return fabs(x);
}

double basic_rnd(double x) {
    return (double)rand() / (double)RAND_MAX * x;
}

double basic_sqr(double x) {
    return sqrt(x);
}

double basic_sin(double x) {
    return sin(x);
}

double basic_cos(double x) {
    return cos(x);
}

double basic_tan(double x) {
    return tan(x);
}

double basic_log(double x) {
    return log(x);
}

double basic_exp(double x) {
    return exp(x);
}

double basic_int(double x) {
    return floor(x);
}

double basic_sgn(double x) {
    if (x > 0) return 1.0;
    if (x < 0) return -1.0;
    return 0.0;
}

/**
 * String functions
 */
char *basic_left(const char *str, int length) {
    static char result[256];
    strncpy(result, str, length);
    result[length] = '\0';
    return result;
}

char *basic_right(const char *str, int length) {
    static char result[256];
    int start = strlen(str) - length;
    if (start < 0) start = 0;
    strcpy(result, str + start);
    return result;
}

char *basic_mid(const char *str, int start, int length) {
    static char result[256];
    strncpy(result, str + start - 1, length);
    result[length] = '\0';
    return result;
}

char *basic_str(double value) {
    static char result[32];
    sprintf(result, "%.6f", value);
    return result;
}

double basic_val(const char *str) {
    return atof(str);
}

int basic_len(const char *str) {
    return strlen(str);
}

char *basic_chr(int asciiCode) {
    static char result[2];
    result[0] = (char)asciiCode;
    result[1] = '\0';
    return result;
}

int basic_asc(const char *str) {
    return (int)str[0];
}

/**
 * Debug functions
 */
void basic_dump_variables(BASICState *state) {
    int i;

    printf("BASIC Variables:\n");
    for (i = 0; i < state->variableCount; i++) {
        Variable *var = &state->variables[i];
        printf("  %s = ", var->name);

        if (var->type == VAR_NUMERIC) {
            printf("%.6f", var->value.numericValue);
        } else if (var->type == VAR_STRING) {
            printf("\"%s\"", var->value.stringValue ? var->value.stringValue : "");
        } else {
            printf("[Array]");
        }

        printf("\n");
    }
}

void basic_dump_program(BASICState *state) {
    ProgramLine *current = state->programLines;

    printf("BASIC Program:\n");
    while (current) {
        printf("%d %s\n", current->lineNumber, current->lineText);
        current = current->next;
    }
}

void basic_dump_state(BASICState *state) {
    printf("BASIC State:\n");
    printf("  Running: %s\n", state->running ? "Yes" : "No");
    printf("  Current Line: %d\n", state->currentLineNumber);
    printf("  Error: %s (%d)\n", state->errorMessage, state->errorCode);
    printf("  Variables: %d\n", state->variableCount);
    printf("  Program Size: %d bytes\n", state->programSize);
    printf("  FOR Stack: %d\n", state->forStackPtr);
    printf("  GOSUB Stack: %d\n", state->gosubStackPtr);
}