# OrionRisc-128 BASIC Interpreter

## Overview

The BASIC Interpreter is Phase 4 of the OrionRisc-128 bootstrap development process. It is written in C and compiled using the Phase 3 C compiler, providing a high-level programming interface for the OrionRisc-128 system.

## Features

### Core Language Features
- **Variables**: Numeric and string variables with automatic type detection
- **Arrays**: Multi-dimensional arrays with DIM statement
- **Control Structures**: IF/THEN/ELSE, FOR/NEXT loops, GOSUB/RETURN subroutines
- **I/O Operations**: PRINT and INPUT statements for console interaction
- **Program Management**: Line-based program storage and editing

### Mathematical Functions
- `ABS(x)` - Absolute value
- `SQR(x)` - Square root
- `SIN(x)` - Sine
- `COS(x)` - Cosine
- `TAN(x)` - Tangent
- `LOG(x)` - Natural logarithm
- `EXP(x)` - Exponential function
- `INT(x)` - Integer part
- `SGN(x)` - Sign function
- `RND(x)` - Random number generation

### String Functions
- `LEFT$(str, n)` - Leftmost n characters
- `RIGHT$(str, n)` - Rightmost n characters
- `MID$(str, start, n)` - Substring starting at position
- `LEN(str)` - String length
- `CHR$(n)` - Character from ASCII code
- `ASC(str)` - ASCII code of first character
- `STR$(x)` - String representation of number
- `VAL(str)` - Numeric value of string

## Language Syntax

### Program Structure
```
10 REM This is a comment
20 LET A = 10
30 PRINT "Hello, World!"
40 IF A > 5 THEN PRINT "A is greater than 5"
50 FOR I = 1 TO 10
60 PRINT I
70 NEXT I
80 END
```

### Variables
- Variable names consist of letters and digits, starting with a letter
- Variables are case-insensitive
- Numeric variables are stored as floating-point values
- String variables end with `$` (e.g., `NAME$`)

### Arrays
```
DIM ARRAY(10)           ' Single dimension
DIM MATRIX(5, 5)        ' Two dimensions
LET ARRAY(1) = 100      ' Array assignment
PRINT ARRAY(1)          ' Array access
```

### Control Structures

#### IF/THEN/ELSE
```
IF condition THEN statement
IF condition THEN statement ELSE statement
```

#### FOR/NEXT Loops
```
FOR variable = start TO end [STEP increment]
    statements
NEXT [variable]
```

#### Subroutines
```
GOSUB line_number
    statements
RETURN
```

### Input/Output

#### PRINT Statement
```
PRINT "Hello"                    ' Print string
PRINT A                          ' Print variable
PRINT "A = "; A                  ' Print with separator
PRINT A, B, C                    ' Print multiple items
PRINT A;                         ' Print without newline
```

#### INPUT Statement
```
INPUT variable                   ' Input single variable
INPUT "Prompt: "; variable       ' Input with prompt
```

## Error Handling

The interpreter provides comprehensive error handling:

- **Syntax Errors**: Invalid BASIC syntax
- **Runtime Errors**: Division by zero, undefined variables
- **Memory Errors**: Out of memory conditions
- **Array Bounds**: Invalid array access

## Memory Management

- **Variable Storage**: Up to 256 variables
- **Program Size**: Maximum 16KB per program
- **Array Support**: Up to 3 dimensions, 1000 elements max
- **String Handling**: Dynamic string allocation

## Integration with System

The BASIC interpreter integrates with:

- **OS Kernel**: Uses system calls for I/O operations
- **Memory Management**: Coordinates with system memory allocation
- **Standard Library**: Leverages C standard library functions

## Development Bootstrap

As part of the bootstrap development process:

1. **Phase 1**: Machine language foundation
2. **Phase 2**: Assembly language development
3. **Phase 3**: C compiler implementation
4. **Phase 4**: BASIC interpreter (this component)

The interpreter is written in C and compiled using the Phase 3 C compiler, demonstrating the self-hosting capability of the system.

## Testing

### Test Programs
- `test-basic-programs.bas` - Comprehensive test suite
- `test-basic-interpreter.c` - C test harness

### Test Coverage
- Variable assignment and arithmetic
- Control structures and flow control
- Array operations and bounds checking
- String manipulation and functions
- Mathematical function library
- Error handling and recovery
- Program loading and execution

## Usage Examples

### Simple Calculator
```
10 PRINT "Simple Calculator"
20 INPUT "Enter first number: "; A
30 INPUT "Enter second number: "; B
40 PRINT "Sum: "; A + B
50 PRINT "Difference: "; A - B
60 PRINT "Product: "; A * B
70 IF B <> 0 THEN PRINT "Quotient: "; A / B
80 END
```

### Array Processing
```
10 DIM SCORES(5)
20 FOR I = 1 TO 5
30 INPUT "Enter score "; I; ": "; SCORES(I)
40 NEXT I
50 PRINT "Scores entered:"
60 FOR I = 1 TO 5
70 PRINT "Score "; I; ": "; SCORES(I)
80 NEXT I
90 END
```

### String Manipulation
```
10 INPUT "Enter your name: "; NAME$
20 PRINT "Hello, "; NAME$
30 PRINT "Your name has "; LEN(NAME$); " characters"
40 PRINT "First letter: "; LEFT$(NAME$, 1)
50 PRINT "Last letter: "; RIGHT$(NAME$, 1)
60 END
```

## Implementation Details

### File Structure
- `basic-interpreter.h` - Function declarations and type definitions
- `basic-interpreter.c` - Main interpreter implementation
- `test-basic-programs.bas` - Test programs
- `test-basic-interpreter.c` - C test harness

### Architecture
- **Lexical Analysis**: Token-based parsing
- **Expression Evaluation**: Recursive descent parser
- **Statement Execution**: Dispatch-based statement handling
- **Variable Management**: Linear search with dynamic allocation
- **Error Recovery**: Graceful error handling with state cleanup

### Performance Characteristics
- **Memory Efficient**: Optimized for 128KB system
- **Fast Execution**: Minimal overhead interpreter design
- **Scalable**: Supports program sizes up to 16KB
- **Responsive**: Immediate execution of statements

## Future Enhancements

Potential improvements for future versions:

- **File I/O**: LOAD/SAVE program files
- **Graphics Support**: Integration with GPU for graphics
- **Sound Support**: Audio capabilities
- **Extended Functions**: Additional mathematical and string functions
- **Debug Features**: Single-step execution and breakpoints
- **Performance Optimization**: Bytecode compilation

## Success Criteria

The BASIC interpreter is considered complete when it can:

1. ✅ Execute basic PRINT and INPUT statements
2. ✅ Support variable assignment and arithmetic operations
3. ✅ Handle control structures (IF/THEN/ELSE, FOR/NEXT, GOSUB/RETURN)
4. ✅ Manage arrays and string operations
5. ✅ Integrate properly with system I/O
6. ✅ Operate within memory constraints (128KB system)
7. ✅ Provide stable and reliable execution
8. ✅ Pass comprehensive test suite

## Compilation

The BASIC interpreter is compiled using the Phase 3 C compiler:

```
c-compiler basic-interpreter.c -o basic-interpreter
```

This demonstrates the bootstrap development approach where each phase enables the next level of abstraction.