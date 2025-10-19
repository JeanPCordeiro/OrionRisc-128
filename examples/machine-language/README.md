# OrionRisc-128 Machine Language Programming Examples

This directory contains comprehensive machine language programming examples for the OrionRisc-128 system. These examples demonstrate the complete capabilities of the system and serve as a foundation for understanding the architecture and developing the Phase 2 assembler.

## Overview

The examples are written as JavaScript programs that generate 32-bit machine code instructions for the OrionRisc-128 RISC processor. Each example includes:

- **Complete program generation** - Binary machine code ready for execution
- **Comprehensive documentation** - Detailed explanations of program flow and techniques
- **Educational value** - Progressive complexity from simple to advanced concepts
- **System integration** - Proper use of system calls and hardware features

## System Architecture

### Instruction Set Architecture (ISA)

The OrionRisc-128 uses a 32-bit RISC instruction format:
```
[opcode(8)] [reg1(4)] [reg2(4)] [reg3(4)] [immediate(16)]
```

**Available Instructions:**
- `NOP` (0x00) - No operation
- `LOAD` (0x01) - Load from memory to register: `LOAD reg1, [reg2 + immediate]`
- `STORE` (0x02) - Store register to memory: `STORE reg1, [reg2 + immediate]`
- `ADD` (0x03) - Add registers: `ADD reg1, reg2`
- `SUB` (0x04) - Subtract registers: `SUB reg1, reg2`
- `SYSCALL` (0x05) - System call (triggers OS interrupt)
- `HALT` (0xFF) - Halt execution

### Register Set

- **16 general-purpose registers** (R0-R15)
- **R0** - Commonly used for system calls and base addressing
- **R1-R4** - General data manipulation
- **R13** - Stack pointer (SP)
- **R12** - Base pointer (BP)

### System Calls

System calls are triggered using the `SYSCALL` instruction with the call number in R0:

| System Call | Number | Description |
|-------------|--------|-------------|
| `PRINT_CHAR` | 0x01 | Print character from R0 to console |
| `READ_CHAR` | 0x02 | Read character into R0 (simulated) |
| `EXIT` | 0x03 | Terminate program |
| `LOAD_PROGRAM` | 0x04 | Load another program |
| `GET_TIME` | 0x05 | Get system time into R0 |

## Example Programs

### 1. Basic Arithmetic Demo (`arithmetic-demo.js`)

**Purpose:** Demonstrates fundamental arithmetic operations and system call integration.

**Key Features:**
- Register-to-register ADD and SUB operations
- Immediate value loading using memory addressing
- System call integration for output
- Multi-digit number printing
- Program structure and flow control

**Program Flow:**
1. Initialize two numbers (25 and 17)
2. Perform addition: 25 + 17 = 42
3. Display addition result with formatting
4. Perform subtraction: 42 - 25 = 17
5. Display subtraction result
6. Exit gracefully

**Sample Output:**
```
First number: 25
Second number: 17
Addition result: 25 + 17 = 42
Subtraction result: 42 - 25 = 17
Arithmetic demo complete!
```

**Technical Highlights:**
- Demonstrates proper register usage patterns
- Shows memory-based immediate value loading
- Illustrates system call conventions
- Provides foundation for arithmetic programming

### 2. Memory Operations Demo (`memory-demo.js`)

**Purpose:** Demonstrates memory access patterns and data manipulation techniques.

**Key Features:**
- LOAD and STORE operations with various addressing modes
- Memory layout organization and planning
- Array storage and retrieval patterns
- Memory region inspection and debugging
- Data manipulation and computation

**Memory Layout:**
- **Data Area** (0x0100-0x010F): Individual data values
- **Array Area** (0x0110-0x012F): Fibonacci sequence storage
- **Temp Storage** (0x0120-0x0127): Calculation results
- **Result Area** (0x0130-0x013F): Display formatting

**Program Flow:**
1. Initialize test data in registers
2. Store data to specific memory locations
3. Load data back and verify contents
4. Create and manipulate memory arrays (Fibonacci sequence)
5. Perform memory-based calculations
6. Inspect and display memory regions

**Sample Output:**
```
Step 1: Initializing data in registers
Step 2: Storing data to memory locations
Step 3: Loading data back from memory
Memory[0x0100]: 42 (66 decimal)
Memory[0x0104]: 17 (23 decimal)
...
Fibonacci array in memory:
  [0]: 1
  [1]: 1
  [2]: 2
  [3]: 3
  [4]: 5
  [5]: 8
  [6]: 13
  [7]: 21
```

**Technical Highlights:**
- Demonstrates memory addressing strategies
- Shows array implementation techniques
- Illustrates memory layout planning
- Provides debugging and inspection methods

### 3. I/O Operations Demo (`io-demo.js`)

**Purpose:** Demonstrates comprehensive input/output operations and console interaction.

**Key Features:**
- Character output using PRINT_CHAR system call
- String printing and text formatting
- Interactive input simulation
- Formatted output with numbers and letters
- Special characters and ASCII art
- System time retrieval and display

**Character Set Demonstrated:**
- **Control Characters:** Newline, carriage return, tab
- **Numeric Digits:** 0-9 with proper formatting
- **Alphabetic Characters:** A-Z and a-z sequences
- **Special Symbols:** Punctuation and mathematical symbols
- **ASCII Art Elements:** Box drawing and visual elements

**Program Flow:**
1. Display welcome message and I/O menu
2. Demonstrate character output capabilities
3. Show string printing with various formats
4. Simulate interactive user input
5. Display formatted numbers and letters
6. Create visual elements and ASCII art
7. Show system time functionality

**Sample Output:**
```
Welcome to OrionRisc-128 I/O Demo!
===================================

I/O Operations Menu:
1. Character Output Demo
Characters: A B C

2. String Printing Demo
Sample strings:
  Hello, World!
  OrionRisc-128 Rocks!
  ASCII Art: ***

4. Formatted Output Demo
Numbers: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
Letters: A, B, C, D, E
         F, G, H, I, J
         ...

Special Characters: ! @ # $ % ^ & *
```

**Technical Highlights:**
- Comprehensive character set utilization
- Advanced formatting and display techniques
- Interactive program simulation
- Visual output design and ASCII art

### 4. Interactive Calculator (`calculator-demo.js`)

**Purpose:** Demonstrates a complete interactive application with menu-driven interface.

**Key Features:**
- Menu-driven user interface
- Multi-step interactive input
- Four basic arithmetic operations
- Input validation and error handling
- Real-time calculation and display
- Multiple calculation examples

**Supported Operations:**
- **Addition (+):** Direct register-to-register addition
- **Subtraction (-):** Direct register-to-register subtraction
- **Multiplication (×):** Implemented as repeated addition
- **Division (÷):** Implemented as repeated subtraction

**Program Flow:**
1. Display calculator menu and options
2. Prompt for first number input
3. Prompt for operation selection (1-4)
4. Prompt for second number input
5. Perform selected arithmetic operation
6. Display calculation result with formatting
7. Prompt for continuation or exit

**Demo Calculations:**
- **Addition:** 7 + 3 = 10
- **Multiplication:** 8 × 4 = 32
- **Division:** 15 ÷ 3 = 5

**Sample Output:**
```
OrionRisc-128 Interactive Calculator
===================================

Calculator Menu:
1. Addition (+)
2. Subtraction (-)
3. Multiplication (*)
4. Division (/)

Demo Calculation:
Enter first number (0-9): 7
Choose operation (1-4): 1
Enter second number (0-9): 3
Result: 7 + 3 = 10

Another Demo: 8 * 4 = 32
Division Demo: 15 / 3 = 5

Another calculation? (Y/N): N
Thank you for using the calculator!
```

**Technical Highlights:**
- Complete interactive application structure
- Multi-step user input handling
- Complex arithmetic implementation
- Menu system and flow control
- User experience design

## Usage Instructions

### Running the Examples

Each example can be run independently to see its documentation and generated machine code:

```bash
# Run arithmetic demo
node examples/machine-language/arithmetic-demo.js

# Run memory operations demo
node examples/machine-language/memory-demo.js

# Run I/O operations demo
node examples/machine-language/io-demo.js

# Run calculator demo
node examples/machine-language/calculator-demo.js
```

### Understanding the Output

Each example provides:

1. **Comprehensive Documentation** - Detailed explanation of the program's purpose and techniques
2. **Generated Machine Code** - Actual 32-bit instructions that can be loaded into the OrionRisc-128
3. **Sample Output** - What the program would display when executed
4. **Technical Analysis** - Register usage, memory layout, and system call patterns

### Integration with OrionRisc-128 System

To run these programs on the actual OrionRisc-128 system:

1. **Load the Program** - Use the OS kernel's `loadProgram()` method with the generated instruction array
2. **Set System Call Handler** - Ensure the OS kernel is properly initialized to handle system calls
3. **Execute** - Use the OS kernel's `executeProgram()` method to run the loaded program
4. **View Output** - System calls will output to the console through the OS kernel

## Educational Value

### Progressive Learning Path

The examples are designed to build knowledge progressively:

1. **Arithmetic Demo** - Master basic instructions and system calls
2. **Memory Demo** - Understand memory access and data structures
3. **I/O Demo** - Learn console interaction and text formatting
4. **Calculator Demo** - Apply all concepts in a complete application

### Key Learning Objectives

**For Each Example:**
- Understand instruction encoding and execution
- Learn proper register usage patterns
- Master system call conventions
- Practice memory layout and addressing
- Develop debugging and testing skills

**Architecture Understanding:**
- RISC instruction set design principles
- Memory management and addressing modes
- System call interface design
- Input/output operation handling
- Program structure and flow control

### Foundation for Assembler Development

These examples provide the foundation for Phase 2 assembler development by:

- **Documenting Instruction Patterns** - Clear examples of how instructions should be used
- **Establishing Coding Conventions** - Consistent patterns for register usage and memory access
- **Demonstrating System Integration** - Proper use of OS services and system calls
- **Providing Test Cases** - Working programs that can validate assembler output
- **Creating Documentation Standards** - Comprehensive program documentation patterns

## Technical Implementation

### Instruction Generation

All examples use a consistent instruction generation pattern:

```javascript
createInstruction(opcode, reg1, reg2, reg3, immediate) {
    return (opcode << 24) | (reg1 << 20) | (reg2 << 16) | (reg3 << 12) | immediate;
}
```

### System Call Convention

System calls follow a consistent pattern:
1. Load system call number into R0
2. Execute SYSCALL instruction
3. OS kernel handles the system call via interrupt

### Memory Management

Each example demonstrates proper memory usage:
- **Data Storage** - Variables and constants in memory
- **Array Handling** - Sequential data structures
- **Temporary Storage** - Intermediate calculation results
- **Program Organization** - Logical memory layout

## Extension and Modification

### Adding New Instructions

To add support for new instructions:
1. Update the `INSTRUCTIONS` object in `RiscProcessor.js`
2. Add the instruction implementation in the `execute()` method
3. Update examples to demonstrate the new instruction

### Creating New Examples

When creating new examples:
1. Follow the established class structure and documentation patterns
2. Include comprehensive program documentation
3. Provide sample output and technical analysis
4. Test with the actual OrionRisc-128 system
5. Update this README with the new example

### Integration with Assembler

These examples will serve as:
- **Validation Tests** - Ensure assembler generates correct machine code
- **Documentation Sources** - Real-world usage patterns and conventions
- **Learning Resources** - Step-by-step progression from simple to complex

## Troubleshooting

### Common Issues

**Program Doesn't Load:**
- Check that all instructions are valid 32-bit values
- Verify memory addresses are within valid range (0x0000-0xFFFF)
- Ensure program size doesn't exceed available memory

**System Calls Don't Work:**
- Verify OS kernel is properly initialized
- Check that system call handler is set on the CPU
- Ensure system call numbers match OS kernel definitions

**Unexpected Output:**
- Verify instruction encoding matches CPU expectations
- Check register usage and data flow
- Debug memory access patterns and addressing

### Testing Approach

Each example includes built-in testing capabilities:
1. **Documentation Generation** - Verify program structure and flow
2. **Machine Code Generation** - Ensure valid instruction encoding
3. **Sample Output Display** - Preview program behavior
4. **Integration Testing** - Validate with actual OrionRisc-128 system

## Future Enhancements

### Planned Extensions

- **Control Flow Examples** - Conditional branching and loops
- **Subroutine Examples** - Function calls and stack management
- **Data Structure Examples** - Advanced memory organization
- **System Programming Examples** - OS kernel interaction
- **Performance Examples** - Optimization techniques

### Advanced Features

- **Floating Point Operations** - If supported by hardware
- **String Manipulation** - Text processing algorithms
- **File I/O Operations** - Disk storage and retrieval
- **Graphics Programming** - If GPU component is available

## Contributing

When contributing new examples:
1. Follow the established code structure and documentation patterns
2. Include comprehensive technical documentation
3. Provide sample output and usage instructions
4. Test with the current OrionRisc-128 system
5. Update this README with new example information

## Conclusion

These machine language examples provide a comprehensive foundation for understanding the OrionRisc-128 system architecture and serve as essential learning tools for developing the Phase 2 assembler. They demonstrate practical programming techniques while establishing patterns and conventions that will guide future system development.

The examples progress from basic concepts to complex applications, providing both educational value and practical utility for the OrionRisc-128 development project.