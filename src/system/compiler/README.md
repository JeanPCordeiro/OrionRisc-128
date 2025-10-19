# OrionRisc-128 C Compiler - Phase 3

## Overview

This directory contains the **Phase 3** implementation of the OrionRisc-128 C compiler. The C compiler is built in assembly language using the Phase 2 assembler, following the bootstrap development philosophy of the project.

## Component Architecture

### C Lexical Analyzer (`c-lexical-analyzer.js`)

The C lexical analyzer is the first major component of the C compiler, responsible for tokenizing C source code into recognizable tokens for the parser.

#### Features

- **C Token Recognition**: Identifies all major C language tokens
- **State Machine Implementation**: Uses finite state machine for robust tokenization
- **Memory Management**: Efficient token and string storage in emulated memory
- **Error Detection**: Identifies invalid characters and malformed tokens
- **Assembly Language Foundation**: Written in machine language for the RISC processor

#### Supported Token Types

##### Keywords
- `int`, `char`, `void` - Type specifiers
- `if`, `else` - Conditional statements
- `while`, `for` - Loop constructs
- `return` - Function return
- `struct`, `typedef` - Structure definitions
- `sizeof` - Size operator

##### Identifiers
- Variable and function names
- Alphanumeric characters plus underscore
- Must start with letter or underscore

##### Constants
- **Integer constants**: Decimal (`42`), hexadecimal (`0x2A`), octal (`052`)
- **Character constants**: `'A'`, `'\n'`, escape sequences
- **String literals**: `"Hello, World!"` with escape sequence support

##### Operators
- **Arithmetic**: `+`, `-`, `*`, `/`, `%`
- **Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Logical**: `&&`, `||`, `!`
- **Assignment**: `=`
- **Increment/Decrement**: `++`, `--` (future)

##### Punctuation
- Semicolons `;`, commas `,`, periods `.`
- Parentheses `( )`, brackets `[ ]`, braces `{ }`
- Colon `:`, question mark `?`

##### Preprocessor Directives
- `#include`, `#define`, `#ifdef`, `#endif`

#### Memory Layout

```
0x0000-0x0FFF: Program code (C lexical analyzer)
0x1000-0x1FFF: C source code buffer (input)
0x2000-0x2FFF: Token buffer (output)
0x3000-0x3FFF: String table (identifiers, strings)
0x4000-0x40FF: State variables and pointers
0x4100-0x41FF: Constants and lookup tables
0x4200-0x42FF: Keyword hash table
```

#### Interface

```javascript
// Initialize with MMU and CPU
const lexer = new CLexicalAnalyzer(mmu, cpu);

// Load program into memory
lexer.loadProgram(0x0000);

// Tokenize C source code
const result = lexer.tokenize(cSourceCode, 0x1000, 0x2000, 0x3000);

console.log(\`Found \${result.tokenCount} tokens\`);
result.tokens.forEach(token => {
    console.log(\`Token: \${CLexicalAnalyzer.getTokenTypeName(token.type)}\`);
});
```

### C Parser (`c-parser.js`)

The C parser is the second major component of the C compiler, responsible for parsing tokens from the lexical analyzer and building an abstract syntax tree (AST) for semantic analysis.

#### Features

- **Recursive Descent Parser**: Complete C subset grammar implementation
- **AST Construction**: Builds structured representation of C programs
- **Error Reporting**: Detailed error messages for syntax issues
- **Parser State Management**: Tracks parsing position and context
- **Assembly Language Foundation**: Written in machine language for the RISC processor

#### Supported C Grammar Rules

##### Declarations
- Variable declarations: `int x;`, `char arr[10];`
- Function declarations: `int func(int a, char b);`
- Type specifiers: `int`, `char`, `void`

##### Statements
- Expression statements: `x = 5;`
- If/else statements: `if (x > 0) { ... } else { ... }`
- While loops: `while (x < 10) { ... }`
- For loops: `for (int i = 0; i < 10; i++) { ... }`
- Return statements: `return 0;`
- Compound statements: `{ ... }`

##### Expressions
- **Arithmetic**: `+`, `-`, `*`, `/`, `%`
- **Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Logical**: `&&`, `||`, `!`
- **Assignment**: `=`, `+=`, `-=`
- **Unary**: `!`, `-`, `++`, `--`
- **Function calls**: `func(a, b)`
- **Parenthesized**: `(expression)`

##### Function Definitions
- Complete function definitions with parameters and body
- Parameter lists with type specifications
- Function body parsing with statement sequences

#### AST Node Structure

AST nodes use a compact 32-bit format:
```
Bits 31-24: Node type (256 possible types)
Bits 23-16: Left child address (offset)
Bits 15-8:  Right child address (offset)
Bits 7-0:   Node value or data
```

#### Memory Layout

```
0x0000-0x0FFF: Program code (C parser)
0x1000-0x1FFF: Token buffer (input from lexical analyzer)
0x2000-0x2FFF: AST buffer (output)
0x3000-0x3FFF: String table (identifiers, strings)
0x4000-0x40FF: Parser state variables and pointers
0x4100-0x41FF: Constants and lookup tables
0x4200-0x42FF: AST node pool
```

#### Interface

```javascript
// Initialize with MMU and CPU
const parser = new CParser(mmu, cpu);

// Load program into memory
parser.loadProgram(0x5000);

// Parse tokens into AST
const result = parser.parse(0x2000, 0x3000, 0x4000, 0);

if (result.success) {
    console.log(\`Parsed \${result.ast.size} AST nodes\`);
    console.log(\`Root node at address: 0x\${result.rootAddress.toString(16)}\`);
} else {
    console.log(\`Parsing failed with error code: \${result.errorCode}\`);
}
```

### C Semantic Analyzer (`c-semantic-analyzer.js`)

The C semantic analyzer is the third major component of the C compiler, responsible for type checking, symbol resolution, and scope management on the AST generated by the C parser.

#### Features

- **Type Checking**: Validates type compatibility and usage
- **Symbol Resolution**: Resolves variable and function references
- **Scope Management**: Handles variable scoping and visibility
- **Error Reporting**: Detailed type and semantic error messages
- **Assembly Language Foundation**: Written in machine language for the RISC processor

#### Type Checking Rules

##### Variable Usage
- Check variable declarations before use
- Validate variable scope and accessibility
- Detect redeclaration of symbols

##### Type Compatibility
- Validate assignment and operation compatibility
- Support int/char compatibility in expressions
- Handle pointer type compatibility rules

##### Function Calls
- Verify function exists in symbol table
- Validate parameter count and types match
- Check return type compatibility

##### Pointer Operations
- Validate pointer arithmetic operations
- Check pointer dereferencing safety
- Handle null pointer constants

#### Symbol Management

##### Global Symbols
- Track global variables and functions
- Manage global scope symbol table
- Handle extern and static modifiers

##### Local Symbols
- Manage function-local variables and parameters
- Track block scope symbols
- Handle automatic variable lifetime

##### Scope Resolution
- Handle nested scopes and name resolution
- Support scope-based symbol lookup
- Manage scope entry and exit

#### Symbol Table Entry Format

Symbol table entries use a compact 32-bit format:
```
Bits 31-24: Data type (C_TYPES)
Bits 23-20: Type modifiers (C_TYPE_MODIFIERS)
Bits 19-16: Scope level (C_SCOPE_LEVELS)
Bits 15-8:  Size in bytes
Bits 7-0:   Memory address or offset
```

#### Memory Layout

```
0x0000-0x0FFF: Program code (C semantic analyzer)
0x1000-0x1FFF: AST buffer (input from parser)
0x2000-0x2FFF: Symbol table (global and local symbols)
0x3000-0x3FFF: Type table (type information storage)
0x4000-0x40FF: Semantic state variables and pointers
0x4100-0x41FF: Error reporting buffer
0x4200-0x42FF: String table (for error messages)
```

#### Interface

```javascript
// Initialize with MMU and CPU
const semanticAnalyzer = new CSemanticAnalyzer(mmu, cpu);

// Load program into memory
semanticAnalyzer.loadProgram(0x9000);

// Perform semantic analysis on AST
const result = semanticAnalyzer.analyze(0x3000, 0x5000, 0x6000, 0x7000, 0);

if (result.success) {
    console.log(\`Semantic analysis successful\`);
    console.log(\`Symbols found: \${result.symbolTable.size}\`);
    console.log(\`Types analyzed: \${result.typeTable.size}\`);
} else {
    console.log(\`Semantic analysis failed: \${CSemanticAnalyzer.getSemanticErrorName(result.errorCode)}\`);
    result.errors.forEach(error => {
        console.log(\`Error: \${CSemanticAnalyzer.getSemanticErrorName(error.code)}\`);
    });
}
```

### C Code Generator (`c-code-generator.js`)

The C code generator is the fourth major component of the C compiler, responsible for generating assembly language code from the type-checked AST produced by the semantic analyzer.

#### Features

- **AST-Based Code Generation**: Traverses type-checked AST to generate assembly code
- **Register Allocation**: Manages CPU register usage for expression evaluation
- **Memory Management**: Handles variable allocation and stack frame management
- **Control Flow Generation**: Generates assembly for if/else, loops, and function calls
- **Expression Compilation**: Converts C expressions to assembly instruction sequences
- **Assembly Language Foundation**: Written in machine language for the RISC processor

#### Code Generation Capabilities

##### Variable Management
- **Global Variables**: Allocate fixed memory locations for global variables
- **Local Variables**: Allocate stack space for function-local variables
- **Variable Access**: Generate LOAD/STORE sequences for variable access
- **Initialization**: Generate code for variable initialization

##### Expression Generation
- **Arithmetic Operations**: Generate ADD/SUB/MUL/DIV sequences for arithmetic
- **Comparison Operations**: Generate comparison and conditional jump sequences
- **Logical Operations**: Generate AND/OR/NOT logical operation sequences
- **Assignment**: Generate assignment and compound assignment code

##### Control Flow
- **If/Else Statements**: Generate conditional jump sequences
- **While/For Loops**: Generate loop structures with proper back edges
- **Function Calls**: Generate CALL/RET sequences with parameter passing
- **Return Statements**: Generate function return and cleanup code

##### Function Management
- **Function Prologue**: Generate stack frame setup and register saving
- **Function Epilogue**: Generate stack frame cleanup and register restoration
- **Parameter Passing**: Generate code for function call parameters
- **Return Values**: Generate code for function return value handling

#### Memory Layout

```
0x0000-0x0FFF: Program code (C code generator)
0x1000-0x1FFF: AST buffer (input from semantic analyzer)
0x2000-0x2FFF: Symbol table (input from semantic analyzer)
0x3000-0x3FFF: Type table (input from semantic analyzer)
0x4000-0x4FFF: Assembly code buffer (output)
0x5000-0x50FF: Code generation state variables and pointers
0x5100-0x51FF: Register allocation table
0x5200-0x52FF: Label counter and jump targets
0x5300-0x53FF: String table for assembly code
```

#### Interface

```javascript
// Initialize with MMU and CPU
const codeGenerator = new CCodeGenerator(mmu, cpu);

// Load program into memory
codeGenerator.loadProgram(0xA000);

// Generate assembly code from type-checked AST
const result = codeGenerator.generate(0x3000, 0x5000, 0x6000, 0x8000, 0);

if (result.success) {
    console.log(\`Code generation successful!\`);
    console.log(\`Assembly instructions: \${result.assemblyCode.size}\`);
    console.log(\`Instructions executed: \${result.instructionsExecuted}\`);
} else {
    console.log(\`Code generation failed: \${CCodeGenerator.getCodeGenErrorName(result.errorCode)}\`);
}
```

### Complete C Compiler Pipeline (`CCompiler`)

The C compiler integrates all four components (lexical analyzer, parser, semantic analyzer, and code generator) to provide a complete compilation pipeline from C source code to assembly language.

#### Interface

```javascript
// Initialize complete compiler
const compiler = new CCompiler(mmu, cpu);

// Compile C source to assembly language
const result = compiler.compile(cSourceCode, 0x1000, 0x2000, 0x3000, 0x4000, 0x5000, 0x6000, 0x7000, 0x8000);

if (result.success) {
    console.log(\`Compilation successful!\`);
    console.log(\`Tokens: \${result.tokens}\`);
    console.log(\`AST nodes: \${result.astNodes}\`);
    console.log(\`Symbols: \${result.symbols}\`);
    console.log(\`Types: \${result.types}\`);
    console.log(\`Assembly instructions: \${result.assemblyInstructions}\`);
    console.log(\`Instructions executed: \${result.instructions}\`);
} else {
    console.log(\`Compilation failed at stage: \${result.stage}\`);
    console.log(\`Error: \${result.error}\`);
    if (result.errors) {
        result.errors.forEach(error => {
            console.log(\`Semantic error: \${CSemanticAnalyzer.getSemanticErrorName(error.code)}\`);
        });
    }
}
```

## Implementation Strategy

### Bootstrap Development
Both C compiler components follow the project's bootstrap development approach:

1. **Machine Language Foundation**: Core parsing logic in machine language
2. **Assembly Language Interface**: Assembly source code for documentation and testing
3. **JavaScript Integration**: High-level interface for system integration
4. **Progressive Enhancement**: Foundation for code generator and semantic analysis

### Parser Architecture

The C parser uses a recursive descent approach with:

- **Top-down parsing** for C grammar rules
- **Predictive parsing** with one-token lookahead
- **Left-recursive expression handling** with proper precedence
- **Error recovery** to continue parsing after errors when possible

### AST Design

The AST uses a binary tree structure optimized for:

- **Memory efficiency** in the 128KB address space
- **Assembly language compatibility** for future phases
- **Semantic analysis** requirements for code generation
- **Debugging and visualization** support

## Testing and Validation

### Example C Code

```c
/* Example C program for testing complete compilation pipeline */
#include <stdio.h>

int global_var = 42;

int add_numbers(int a, int b) {
    int result = a + b;
    return result;
}

void print_message(char* message) {
    printf("Message: %s\n", message);
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
        printf("Count: %d\n", i);
    }

    return 0;
}
```

### Expected Compilation Pipeline

1. **Lexical Analysis**:
    - Keywords: `int`, `char`, `if`, `else`, `for`, `return`, `void`
    - Identifiers: `global_var`, `add_numbers`, `main`, `printf`, etc.
    - Constants: `42`, `10`, `20`, `3`, string literals
    - Operators: `=`, `+`, `>`, `<`
    - Punctuation: `;`, `,`, `(`, `)`, `{`, `}`

2. **Parsing**:
    - Program structure with global declarations
    - Function definitions with parameters and bodies
    - Variable declarations and initializations
    - Control flow statements (if/else, for)
    - Expression parsing with proper precedence

3. **AST Generation**:
    - PROGRAM node as root
    - FUNCTION_DEF nodes for each function
    - VARIABLE_DECL nodes for global and local variables
    - STATEMENT nodes for control flow
    - EXPRESSION nodes for computations

4. **Semantic Analysis**:
    - Symbol table construction with global and local symbols
    - Type checking for all expressions and assignments
    - Function call validation and parameter type checking
    - Scope management and symbol resolution
    - Detection of type mismatches and semantic errors

## Integration with Assembler

The C compiler components are designed to work with the Phase 2 assembler:

1. **Assembly Language Input**: Accepts C source code as input
2. **Token Stream**: Produces tokens compatible with parser expectations
3. **AST Structure**: Creates AST suitable for code generation
4. **Memory Management**: Uses same memory management patterns as assembler
5. **Error Handling**: Consistent error reporting with assembler

## Development Status

- **Phase 3 Milestone**: Complete C compiler implementation with code generation
- **Components Completed**:
  - C lexical analyzer (tokenization)
  - C parser (AST generation)
  - C semantic analyzer (type checking and symbol resolution)
  - C code generator (assembly code generation)
- **Next Steps**: Integration testing and validation with Phase 2 assembler
- **Bootstrap Validation**: Ready for compilation of system software components

## Future Enhancements

- **Extended Grammar**: Additional C language features
- **Code Generation**: Assembly code output from semantically analyzed AST
- **Optimization**: Basic compiler optimizations
- **Error Recovery**: Better error reporting and recovery
- **Advanced Types**: Structure and union support

## Files

- `c-lexical-analyzer.js` - Main lexical analyzer implementation
- `c-parser.js` - Main parser implementation
- `c-semantic-analyzer.js` - Main semantic analyzer implementation
- `c-code-generator.js` - Main code generator implementation
- `test-code-generator.js` - Code generator test suite
- `README.md` - This documentation file

## Usage in OrionRisc-128 System

The C compiler serves as the foundation for high-level language development:

1. **Tokenization**: Convert C source to tokens
2. **Parsing**: Build abstract syntax tree
3. **Semantic Analysis**: Type checking and symbol resolution
4. **Code Generation**: Generate assembly code (future)
5. **Compilation**: Complete C to assembly translation (future)

This component enables the next phase of system development where C programs can be compiled and executed on the OrionRisc-128 computer.

### Complete Compilation Pipeline

```javascript
// Initialize the complete C compiler
const compiler = new CCompiler(mmu, cpu);

// Compile C source through all stages
const result = compiler.compile(cSourceCode);

// Check for semantic errors
if (result.success) {
    console.log('Compilation successful!');
    console.log(\`Found \${result.tokens} tokens\`);
    console.log(\`Built \${result.astNodes} AST nodes\`);
    console.log(\`Analyzed \${result.symbols} symbols\`);
    console.log(\`Processed \${result.types} types\`);
} else {
    console.log(\`Compilation failed at \${result.stage}\`);

    if (result.errors) {
        result.errors.forEach(error => {
            console.log(\`Semantic Error: \${CSemanticAnalyzer.getSemanticErrorName(error.code)}\`);
        });
    }
}
```