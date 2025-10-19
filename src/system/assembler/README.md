# OrionRisc-128 Assembler - Phase 2 Implementation

## Lexical Analyzer Component

This directory contains the Phase 2 lexical analyzer implementation for the OrionRisc-128 assembler. The lexical analyzer is responsible for tokenizing assembly language source code and serves as the foundation for the complete assembler system.

## Overview

The lexical analyzer is implemented as a machine language program that can be executed by the RISC processor. It reads assembly source code from memory, processes it character by character using a finite state machine, and produces a structured token stream for the parser.

### Key Features

- **Machine Language Implementation**: Written in machine language for self-hosting capability
- **Finite State Machine**: Robust character processing and token recognition
- **Comprehensive Token Support**: Handles all assembly language constructs
- **Error Detection**: Identifies invalid characters and malformed tokens
- **Memory Efficient**: Optimized for the 128KB memory space
- **Integration Ready**: Designed for seamless integration with the parser

## Architecture

### Files Structure

```
src/system/assembler/
├── README.md                    # This documentation file
├── lexical-analyzer.js          # Main lexical analyzer implementation
├── state-machine.js             # Finite state machine logic
├── symbol-table.js              # Symbol table management system
├── instruction-parser.js        # Instruction parser and validator
├── test-lexical-analyzer.js     # Lexical analyzer test suite
├── test-symbol-table.js         # Symbol table test suite
├── test-instruction-parser.js   # Instruction parser test suite
└── demo-symbol-table.js         # Symbol table demonstration
```

### Memory Layout

The lexical analyzer uses the following memory regions:

- **0x0000-0x0FFF**: Program code (lexical analyzer machine code)
- **0x1000-0x1FFF**: Source code buffer (input assembly code)
- **0x2000-0x2FFF**: Token buffer (output token stream)
- **0x3000-0x3FFF**: String table (labels, instruction names)
- **0x4000-0x40FF**: State variables and pointers
- **0x4100-0x41FF**: Constants and lookup tables

### Token Format

Tokens are stored in a compact 32-bit format:

```
Bits 31-28: Token type (4 bits)
Bits 27-24: Token subtype/flags (4 bits)
Bits 23-16: String length (8 bits)
Bits 15-0:  Value or string pointer (16 bits)
```

## Token Types

### Instructions (Type 0x0)
Recognizes all OrionRisc-128 machine instructions:
- `LOAD` (0x01) - Load from memory to register
- `STORE` (0x02) - Store register to memory
- `ADD` (0x03) - Add two registers
- `SUB` (0x04) - Subtract two registers
- `JUMP` (0x06) - Jump to address
- `CALL` (0x07) - Call subroutine
- `RET` (0x08) - Return from subroutine
- `HALT` (0xFF) - Halt execution
- `SYSCALL` (0x05) - System call
- `NOP` (0x00) - No operation

### Registers (Type 0x1)
Recognizes register identifiers:
- `R0` through `R15` (16 general-purpose registers)

### Immediate Values (Type 0x2)
Recognizes numeric constants:
- Decimal numbers: `42`, `255`, `1024`
- Hexadecimal numbers: `0FFH`, `1AH`, `7FFFH`

### Labels (Type 0x3)
Recognizes label definitions:
- `main:`, `loop_start:`, `data_section:`
- Alphanumeric identifiers followed by colon

### Directives (Type 0x4)
Recognizes assembler directives:
- `.text` - Code section
- `.data` - Data section
- `.equ` - Define constant
- `.global` - Global symbol

### Separators (Type 0x5)
Recognizes syntax elements:
- `,` - Comma separator
- `[` - Left bracket
- `]` - Right bracket
- `:` - Colon (label terminator)

### Comments (Type 0x6)
Recognizes comment lines:
- `;` - Semicolon starts comment
- Comment extends to end of line

## Implementation Details

### Character Classification

The lexical analyzer classifies input characters into categories:

- **Letters**: A-Z, a-z
- **Digits**: 0-9
- **Whitespace**: Space, tab, newline
- **Special**: `:`, `;`, `,`, `[`, `]`, `.`, `$`
- **Invalid**: Any other character

### State Machine

The finite state machine handles token recognition:

```
START → [Letter] → INSTRUCTION
    → [Digit] → NUMBER
    → [.] → DIRECTIVE
    → [;] → COMMENT
    → [Separator] → SEPARATOR
    → [Invalid] → ERROR
```

### Error Handling

The lexical analyzer detects and reports:

- Invalid characters in source code
- Malformed numbers (invalid hexadecimal)
- Unterminated strings or comments
- Buffer overflow conditions

## Interface

### Machine Language Interface

The lexical analyzer program uses the following register convention:

- **R0**: Source buffer address (input)
- **R1**: Source buffer length (input)
- **R2**: Token buffer address (output)
- **R3**: String table address (output)
- **Returns**: Number of tokens found (R0) or error code (negative)

### JavaScript Interface

```javascript
// Create lexical analyzer instance
const analyzer = new LexicalAnalyzer(mmu, cpu);

// Load program into memory
analyzer.loadProgram(0x0000);

// Tokenize assembly source code
const result = analyzer.tokenize(sourceCode, 0x1000, 0x2000, 0x3000);

// Access results
console.log(`Found ${result.tokenCount} tokens`);
result.tokens.forEach(token => {
    console.log(`Token: ${token.type}, Value: ${token.value}`);
});
```

## Testing

### Running Tests

```javascript
// Run complete test suite
const { runCompleteTestSuite } = require('./test-lexical-analyzer');
const results = runCompleteTestSuite();

// Run demonstration
const { demonstrateLexicalAnalyzer } = require('./test-lexical-analyzer');
demonstrateLexicalAnalyzer();
```

### Test Coverage

The test suite includes:

- **Unit Tests**: Individual token recognition
- **Integration Tests**: Full system integration
- **Performance Tests**: Speed and memory usage
- **Error Tests**: Invalid input handling
- **Edge Cases**: Empty input, large files

## Integration with Parser

The lexical analyzer produces tokens that feed into the parser:

1. **Token Stream**: Sequential list of classified tokens
2. **String Table**: Storage for identifiers and strings
3. **Error Information**: Position and type of errors found

### Parser Interface

The parser reads tokens from the token buffer:

```javascript
// Read tokens from memory
const tokens = analyzer.readTokens(0x2000);

// Process each token
tokens.forEach(token => {
    switch (token.type) {
        case TOKEN_TYPES.INSTRUCTION:
            // Process instruction
            break;
        case TOKEN_TYPES.REGISTER:
            // Process register
            break;
        case TOKEN_TYPES.IMMEDIATE:
            // Process immediate value
            break;
        // ... other token types
    }
});
```

## Development Bootstrap

This lexical analyzer serves as the foundation for Phase 2:

1. **Phase 2A**: Lexical analyzer (this implementation)
2. **Phase 2B**: Parser implementation
3. **Phase 2C**: Code generation
4. **Phase 2D**: Complete assembler

## Performance Characteristics

### Memory Usage
- **Program Size**: ~256 bytes of machine code
- **Buffer Sizes**: Configurable based on source size
- **String Table**: Dynamic sizing based on identifiers

### Execution Speed
- **Character Processing**: ~1000+ characters/second
- **Token Recognition**: State machine based for efficiency
- **Memory Access**: Optimized for MMU performance

## Example Usage

### Simple Assembly Program

```assembly
; Simple program
.text
.global main

main:
    LOAD R0, 42
    ADD R0, R1
    STORE [R2], R0
    HALT
```

### Tokenization Result

```
Token 0: INSTRUCTION "LOAD" (0x01)
Token 1: REGISTER "R0" (0)
Token 2: IMMEDIATE "42" (42)
Token 3: INSTRUCTION "ADD" (0x03)
Token 4: REGISTER "R0" (0)
Token 5: REGISTER "R1" (1)
Token 6: INSTRUCTION "STORE" (0x02)
Token 7: REGISTER "R2" (2)
Token 8: REGISTER "R0" (0)
Token 9: INSTRUCTION "HALT" (0xFF)
```

## Symbol Table Management Component

The symbol table management system handles labels, equates, and symbol resolution for the assembler. It provides efficient storage and lookup of program symbols within the 128KB memory constraints.

### Key Features

- **Label Storage**: Store program labels and their memory addresses
- **Equate Handling**: Process symbol definitions (.equ directive)
- **Symbol Resolution**: Convert label references to numeric addresses
- **Hash Table**: Efficient symbol lookup with collision handling
- **Memory Management**: Optimized storage within 128KB system
- **Machine Language Compatible**: Can be implemented in machine language

### Memory Layout Extension

The symbol table extends the assembler memory layout:

- **0x5000-0x5FFF**: Hash table buckets (256 x 2 bytes each)
- **0x6000-0x6FFF**: Symbol entry data storage (8 bytes per entry)
- **0x7000-0x7FFF**: String storage for symbol names
- **0x8000-0x80FF**: Symbol table metadata and pointers

### Symbol Entry Format

Each symbol entry uses 8 bytes:
```
Bytes 0-1: String pointer (offset into string storage)
Byte 2:    Symbol type (LABEL, EQUATE, EXTERNAL, GLOBAL)
Byte 3:    Symbol scope (LOCAL, GLOBAL, EXTERN)
Bytes 4-7: Symbol value (32-bit address or constant)
```

### Interface Functions

```javascript
// Create symbol table instance
const symbolTable = new SymbolTable(mmu);

// Add symbol to table
symbolTable.addSymbol('main', SYMBOL_TYPES.LABEL, 0x1000);

// Look up symbol
const entry = symbolTable.lookupSymbol('main');

// Resolve symbol value
const address = symbolTable.resolveSymbol('main');

// Get complete symbol table
const table = symbolTable.getSymbolTable();
```

### Symbol Types

- **LABEL**: Program location markers (main:, loop:, end:)
- **EQUATE**: Symbol definitions (.equ BUFFER_SIZE 256)
- **EXTERNAL**: Global symbols for inter-program references
- **GLOBAL**: Exported symbols

### Integration with Lexical Analyzer

The symbol table processes tokens from the lexical analyzer:

```javascript
// Process tokens for symbols
const result = processTokensForSymbols(tokens, symbolTable, currentAddress);

// Access results
console.log(`Found ${result.labelsFound} labels`);
console.log(`Found ${result.equatesFound} equates`);
console.log(`Added ${result.symbolsAdded} total symbols`);
```

### Testing

Run the symbol table test suite:

```javascript
// Run complete test suite
const { runCompleteSymbolTableTestSuite } = require('./test-symbol-table');
const results = runCompleteSymbolTableTestSuite();

// Run demonstration
const { demonstrateSymbolTable } = require('./demo-symbol-table');
demonstrateSymbolTable();
```

## Machine Code Generator Component

The machine code generator is the core component of Phase 2C, responsible for converting parsed instructions into 32-bit machine code for the RISC processor. It handles instruction encoding, address resolution, memory layout management, and code optimization.

### Key Features

- **32-bit Instruction Encoding**: Converts parsed instructions to machine code format
- **Address Resolution**: Resolves labels and symbols to numeric addresses
- **Memory Layout Management**: Organizes code and data sections properly
- **Relocation Support**: Handles forward references and address fixups
- **Code Optimization**: Basic optimizations for code efficiency
- **Error Handling**: Comprehensive validation and error reporting
- **Integration Ready**: Works seamlessly with parser and symbol table

### Machine Code Format

The RISC processor uses a 32-bit instruction format:

```
Bits 31-28: Opcode (4 bits) - Instruction type
Bits 27-24: Destination register (4 bits) - Target register
Bits 23-20: Source register 1 (4 bits) - First source register
Bits 19-16: Source register 2 (4 bits) - Second source register
Bits 15-0:  Immediate value or address (16 bits) - Data or address
```

### Instruction Encoding Examples

#### LOAD Instruction
```assembly
LOAD R0, 42
```
- **Binary**: 0001 0000 0000 0000 0000 0000 0010 1010
- **Hex**: 0x1000002A
- **Format**: opcode(1) + R0(0) + 0 + 0 + 42

#### STORE Instruction
```assembly
STORE [R1 + 5], R2
```
- **Binary**: 0010 0001 0010 0101 0000 0000 0000 0000
- **Hex**: 0x21250000
- **Format**: opcode(2) + R1(1) + R2(2) + offset(5) + 0

#### JUMP Instruction
```assembly
JUMP main
```
- **Binary**: 0110 0000 0000 0000 0001 0000 0000 0000
- **Hex**: 0x60001000
- **Format**: opcode(6) + 0 + 0 + 0 + address(0x1000)

### Interface

#### JavaScript Interface
```javascript
// Create code generator instance
const generator = new MachineCodeGenerator(mmu, symbolTable);

// Generate machine code from parsed instructions
const result = generator.generateMachineCode(parsedInstructions, startAddress);

// Access results
console.log(`Generated ${result.instructions.length} instructions`);
result.instructions.forEach(instruction => {
    console.log(`0x${instruction.address.toString(16)}: 0x${instruction.machineCode.toString(16)}`);
});
```

#### Machine Language Interface
The code generator can be implemented as machine language subroutines that can be called from the main assembler program.

### Integration with Other Components

The code generator integrates with:

1. **Instruction Parser**: Receives validated ParsedInstruction objects
2. **Symbol Table**: Resolves labels and equates to addresses
3. **Memory Management Unit**: Writes generated code to memory
4. **Error System**: Reports encoding and validation errors

### Testing

Run the code generator test suite:

```javascript
// Run complete test suite
const { runCompleteTestSuite } = require('./test-machine-code-generator');
const results = runCompleteTestSuite();

// Run demonstration
const { demonstrateCodeGenerator } = require('./test-machine-code-generator');
demonstrateCodeGenerator();
```

### Performance Characteristics

- **Encoding Speed**: Fast instruction-by-instruction processing
- **Memory Usage**: Efficient buffering of generated code
- **Address Resolution**: Hash table-based symbol lookup
- **Optimization**: Optional passes for code improvement

## Instruction Parser Component

The instruction parser and validator is the core component of Phase 2B, responsible for processing tokens from the lexical analyzer and validating assembly instruction syntax. It implements a recursive descent parser with comprehensive error handling and recovery mechanisms.

### Key Features

- **Token Stream Processing**: Sequential token processing with lookahead capability
- **Instruction Validation**: Comprehensive syntax and semantic validation
- **Operand Processing**: Support for registers, immediates, addresses, and memory operands
- **Error Reporting**: Detailed error messages with position information
- **Symbol Integration**: Label resolution using symbol table
- **Recovery Mechanisms**: Continue parsing after errors when possible

### Instruction Types Supported

#### Data Movement Instructions
- `LOAD dest, src` - Load immediate or memory value to register
- `STORE src, [dest + offset]` - Store register value to memory

#### Arithmetic Instructions
- `ADD dest, src` - Add two registers
- `SUB dest, src` - Subtract two registers

#### Control Flow Instructions
- `JUMP address` - Jump to address or label
- `CALL address` - Call subroutine at address or label
- `RET` - Return from subroutine

#### System Instructions
- `SYSCALL number` - System call with number
- `HALT` - Halt execution
- `NOP` - No operation

### Operand Types

#### Register Operands
- `R0` through `R15` (16 general-purpose registers)
- Validation: Range checking and context validation

#### Immediate Operands
- Decimal numbers: `42`, `255`, `1024`
- Hexadecimal numbers: `0FFH`, `1AH`, `7FFFH`
- Validation: Range checking (-32768 to 65535)

#### Address Operands
- Numeric addresses: `1000`, `0x1000`
- Label references: `main`, `data_section`
- Validation: Symbol table resolution

#### Memory Operands
- Simple: `[R0]` - Register indirect
- With offset: `[R1 + 10]` - Register indirect with offset
- Validation: Base register and offset validation

### Parser Architecture

#### TokenStream Class
- Sequential access to tokens with lookahead
- Position tracking and error recovery
- Line number calculation for error reporting

#### Recursive Descent Parser
- Top-down parsing approach
- Instruction-specific parsing methods
- Expression evaluation support

#### Error Handling
- Detailed error classification
- Position and context information
- Recovery strategies for continued parsing

### Memory Integration

The parser integrates with the existing memory layout:

- **Token Buffer**: Reads tokens from lexical analyzer output (0x2000-0x2FFF)
- **String Table**: Accesses identifier strings (0x3000-0x3FFF)
- **Symbol Table**: Resolves labels and equates (0x5000-0x8FFF)
- **State Variables**: Parser state and position tracking (0x4000-0x40FF)

### Interface

#### Machine Language Interface
```javascript
// Parser program would be loaded into memory
// Interface registers:
// R0: Token buffer address (input)
// R1: Token count (input)
// R2: Instruction buffer address (output)
// R3: Symbol table address (input)
// Returns: Number of instructions parsed (R0) or error code (negative)
```

#### JavaScript Interface
```javascript
// Create parser instance
const parser = new InstructionParser(mmu, symbolTable);

// Parse tokens
const result = parser.parse(tokens, startAddress);

// Access results
console.log(`Parsed ${result.instructionCount} instructions`);
result.instructions.forEach(instruction => {
    console.log(`Instruction: ${instruction.mnemonic} at 0x${instruction.address.toString(16)}`);
});
```

### Error Types

#### Syntax Errors
- Unexpected tokens
- Missing or extra operands
- Malformed instruction syntax

#### Semantic Errors
- Invalid register numbers
- Out-of-range immediate values
- Undefined label references

#### Context Errors
- Invalid operand combinations
- Incorrect instruction usage

### Integration with Symbol Table

The parser integrates with the symbol table for:

- **Label Resolution**: Convert label references to numeric addresses
- **Equate Processing**: Handle constant definitions
- **Scope Management**: Local vs global symbol handling
- **Error Reporting**: Symbol-related error messages

### Testing

#### Test Coverage
- Unit tests for each instruction type
- Error condition validation
- Integration with lexical analyzer
- Performance testing with large token streams

#### Running Tests
```javascript
// Run complete test suite
const { runCompleteTestSuite } = require('./test-instruction-parser');
const results = runCompleteTestSuite();

// Run demonstration
const { demonstrateInstructionParser } = require('./test-instruction-parser');
demonstrateInstructionParser();
```

## Future Enhancements

### Phase 2C (Code Generation)
- Machine code output from parsed instructions
- Address resolution using symbol table
- Optimization passes
- Relocation handling

### Phase 2D (Complete Assembler)
- File I/O integration for source files
- Listing generation with symbol information
- Error reporting with source line context
- Cross-reference generation

## Troubleshooting

### Common Issues

1. **Invalid Characters**: Check for unsupported characters in source
2. **Buffer Overflow**: Increase buffer sizes for large source files
3. **Memory Alignment**: Ensure proper word alignment for MMU access

### Debug Information

Enable debug logging to troubleshoot issues:

```javascript
// Enable debug output
console.log('Debug: Character processing...');
// Add debug prints in machine language program
```

## References

- [OrionRisc-128 System Architecture](../../architecture.md)
- [RISC Processor Implementation](../cpu/RiscProcessor.js)
- [Memory Management Unit](../memory/MemoryManagementUnit.js)
- [Phase 1 Integration Tests](../os/integration-test.js)

## Two-Pass Assembler Implementation

The two-pass assembler is the main orchestrator that coordinates all assembler components to convert assembly source code into executable machine code. It implements the complete two-pass assembly algorithm with proper error coordination and state management.

### Key Features

- **Pass 1**: Symbol table building and syntax validation
- **Pass 2**: Machine code generation with symbol resolution
- **Error Coordination**: Collects and reports errors from all components
- **Memory Management**: Manages buffers and temporary storage
- **State Tracking**: Monitors assembly progress across passes
- **Integration**: Seamlessly coordinates all assembler components

### Files Structure Extension

```
src/system/assembler/
├── two-pass-assembler.js           # Main assembler orchestrator
├── test-two-pass-assembler.js      # Comprehensive test suite
├── assembler-integration-example.js # Integration examples
├── lexical-analyzer.js             # Lexical analysis component
├── symbol-table.js                 # Symbol table management
├── instruction-parser.js           # Instruction parsing and validation
├── machine-code-generator.js       # Machine code generation
└── README.md                       # This documentation
```

### Two-Pass Algorithm

#### Pass 1: Symbol Table Building and Validation
1. **Lexical Analysis**: Tokenize source code using lexical analyzer
2. **Symbol Collection**: Extract labels and equates from token stream
3. **Symbol Table Building**: Store symbols with their addresses/types
4. **Syntax Validation**: Parse and validate instruction syntax
5. **Error Collection**: Gather all errors from Pass 1 components

#### Pass 2: Machine Code Generation
1. **Symbol Resolution**: Resolve label references to addresses
2. **Instruction Encoding**: Convert parsed instructions to machine code
3. **Address Resolution**: Apply relocations for forward references
4. **Code Optimization**: Apply optimizations (if enabled)
5. **Memory Output**: Write final machine code to memory

### Interface

#### JavaScript Interface
```javascript
// Create assembler instance
const { TwoPassAssembler } = require('./two-pass-assembler');
const assembler = new TwoPassAssembler(mmu, cpu);

// Assemble source code
const sourceCode = '.text\n.global main\nmain:\nLOAD R0, 42\nHALT';
const result = assembler.assemble(sourceCode, 0x1000);

// Check results
if (result.success) {
    console.log(`Generated ${result.instructions.length} instructions`);
    assembler.writeToMemory(0x1000); // Write to memory
} else {
    console.log('Errors:', result.errors);
}
```

#### Assembly Result Object
```javascript
{
    success: boolean,              // Assembly successful
    errors: Array,                 // Error list
    warnings: Array,               // Warning list
    instructions: Array,           // Generated instructions
    symbols: Array,                // Symbol table entries
    statistics: {                  // Performance statistics
        pass1Time: number,
        pass2Time: number,
        totalTime: number,
        sourceLines: number,
        instructionsGenerated: number,
        symbolsFound: number,
        bytesGenerated: number
    }
}
```

### Memory Layout Integration

The two-pass assembler extends the existing memory layout:

- **0x0000-0x0FFF**: Assembler program code
- **0x1000-0x1FFF**: Source code buffer (input)
- **0x2000-0x2FFF**: Token buffer (lexical analyzer output)
- **0x3000-0x3FFF**: String table (identifiers and strings)
- **0x4000-0x40FF**: State variables and pointers
- **0x4100-0x41FF**: Constants and lookup tables
- **0x5000-0x5FFF**: Symbol hash table (256 buckets)
- **0x6000-0x6FFF**: Symbol data entries (8 bytes each)
- **0x7000-0x7FFF**: Symbol name strings
- **0x8000-0x8FFF**: Generated machine code output
- **0x9000-0x90FF**: Relocation table records

### Error Handling

The assembler provides comprehensive error handling:

- **Component Errors**: Errors from individual components (lexical, parser, code generator)
- **Integration Errors**: Errors in component interaction
- **Validation Errors**: Syntax and semantic validation errors
- **Memory Errors**: Buffer overflow and allocation errors

### State Management

The assembler tracks its state throughout the assembly process:

```javascript
const state = assembler.getState();
// Returns: { state, currentPass, sourceLines, tokensFound, instructionsParsed, symbolsFound, errors, warnings }
```

### Testing

#### Running Tests
```javascript
// Run complete test suite
const { runCompleteTestSuite } = require('./test-two-pass-assembler');
const results = runCompleteTestSuite(mmu, cpu);

// Run integration examples
const { AssemblerIntegrationExample } = require('./assembler-integration-example');
const example = new AssemblerIntegrationExample();
example.initialize(mmu, cpu);
example.runAllExamples();
```

#### Test Coverage
- Component initialization and integration
- Simple program assembly
- Label and symbol processing
- Equate handling
- Memory operations
- Error handling and recovery
- State tracking
- Memory writing and verification
- Performance testing

### Integration with Existing Components

The two-pass assembler integrates seamlessly with existing system components:

1. **Memory Management Unit (MMU)**: Uses MMU for all memory operations
2. **RISC Processor (CPU)**: Uses CPU for lexical analyzer execution
3. **Component Architecture**: Coordinates all assembler components
4. **Error System**: Integrates with existing error reporting

### Bootstrap Compatibility

The assembler is designed for bootstrap development:

- **Machine Language Compatible**: Can be implemented in machine language
- **Memory Efficient**: Works within 128KB memory constraints
- **Component Based**: Uses existing component interfaces
- **Progressive Development**: Supports incremental feature addition

## Version History

- **v2.0.0**: Initial Phase 2 implementation
- **v2.1.0**: Two-pass assembler implementation
- **Date**: October 19, 2025
- **Status**: Ready for integration testing
- **Next**: Full system integration and testing