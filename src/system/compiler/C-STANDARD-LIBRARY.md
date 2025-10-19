# OrionRisc-128 C Standard Library - Phase 3

## Overview

The C Standard Library provides essential runtime support functions for C programs compiled for the OrionRisc-128 system. All functions are implemented in assembly language and follow the RISC processor calling conventions.

## Architecture

### Memory Layout

The standard library functions are organized in memory regions by category:

```
0x1000-0x1FFF: I/O Functions
  0x1000-0x10FF: printf
  0x1100-0x11FF: putchar
  0x1200-0x12FF: getchar
  0x1300-0x13FF: puts
  0x1400-0x14FF: gets

0x2000-0x2FFF: String Functions
  0x2000-0x20FF: strlen
  0x2100-0x21FF: strcpy
  0x2200-0x22FF: strcmp
  0x2300-0x23FF: strcat
  0x2400-0x24FF: memset
  0x2500-0x25FF: memcpy

0x3000-0x3FFF: Memory Functions
  0x3000-0x30FF: malloc
  0x3100-0x31FF: free
  0x3200-0x32FF: calloc
  0x3300-0x33FF: realloc

0x4000-0x4FFF: Math Functions
  0x4000-0x40FF: abs
  0x4100-0x41FF: rand
  0x4200-0x42FF: srand

0x5000-0x5FFF: Utility Functions
  0x5000-0x50FF: exit
  0x5100-0x51FF: atoi
  0x5200-0x52FF: itoa
```

### Calling Conventions

- **Parameters**: Passed in registers R0-R3 (first 4 parameters)
- **Return Values**: Returned in R0 (integers) or R0/R1 (larger values)
- **Stack Management**: Caller responsible for stack frame management
- **System Calls**: Use SYSCALL instruction with syscall number in R0

## Function Reference

### I/O Functions

#### `printf` (0x1000)
**Purpose**: Formatted output to console
**Parameters**:
- R0: Format string address
- R1-R3: Optional arguments for format specifiers
**Returns**: R0 = Number of characters printed
**Supported Format Specifiers**: %d, %s, %c, %x (simplified implementation)

**Example Usage**:
```c
printf("Hello, %s! Value: %d\n", "World", 42);
```

#### `putchar` (0x1100)
**Purpose**: Output single character to console
**Parameters**:
- R0: Character to output (ASCII value)
**Returns**: R0 = Character output (success indicator)

**Example Usage**:
```c
putchar('A');
putchar('\n');
```

#### `getchar` (0x1200)
**Purpose**: Read single character from console
**Parameters**: None
**Returns**: R0 = Character read (ASCII value)

**Example Usage**:
```c
char c = getchar();
```

#### `puts` (0x1300)
**Purpose**: Output string followed by newline
**Parameters**:
- R0: String address (null-terminated)
**Returns**: R0 = 0 on success

**Example Usage**:
```c
puts("Hello, World!");
```

#### `gets` (0x1400)
**Purpose**: Read string from console input
**Parameters**:
- R0: Buffer address to store string
**Returns**: R0 = Buffer address

**Example Usage**:
```c
char buffer[100];
gets(buffer);
```

### String Functions

#### `strlen` (0x2000)
**Purpose**: Calculate string length
**Parameters**:
- R0: String address (null-terminated)
**Returns**: R0 = String length (excluding null terminator)

**Example Usage**:
```c
int len = strlen("Hello");  // Returns 5
```

#### `strcpy` (0x2100)
**Purpose**: Copy string from source to destination
**Parameters**:
- R0: Destination buffer address
- R1: Source string address
**Returns**: R0 = Destination address

**Example Usage**:
```c
char dest[100];
strcpy(dest, "Hello, World!");
```

#### `strcmp` (0x2200)
**Purpose**: Compare two strings lexicographically
**Parameters**:
- R0: First string address
- R1: Second string address
**Returns**:
- R0 < 0: First string is less than second
- R0 = 0: Strings are equal
- R0 > 0: First string is greater than second

**Example Usage**:
```c
if (strcmp(str1, str2) == 0) {
    // Strings are equal
}
```

#### `strcat` (0x2300)
**Purpose**: Concatenate source string to destination string
**Parameters**:
- R0: Destination string address (must have enough space)
- R1: Source string address
**Returns**: R0 = Destination address

**Example Usage**:
```c
char result[200] = "Hello";
strcat(result, ", World!");  // result = "Hello, World!"
```

#### `memset` (0x2400)
**Purpose**: Set memory block to specific value
**Parameters**:
- R0: Memory address
- R1: Value to set (byte value)
- R2: Number of bytes to set
**Returns**: R0 = Memory address

**Example Usage**:
```c
char buffer[100];
memset(buffer, 0, 100);  // Clear buffer
```

#### `memcpy` (0x2500)
**Purpose**: Copy memory block from source to destination
**Parameters**:
- R0: Destination address
- R1: Source address
- R2: Number of bytes to copy
**Returns**: R0 = Destination address

**Example Usage**:
```c
char src[] = "Hello";
char dest[10];
memcpy(dest, src, 6);  // Copy including null terminator
```

### Memory Functions

#### `malloc` (0x3000)
**Purpose**: Allocate memory block from heap
**Parameters**:
- R0: Number of bytes to allocate
**Returns**: R0 = Allocated memory address (or 0 if failed)

**Example Usage**:
```c
char* buffer = malloc(100);
if (buffer != 0) {
    // Use allocated memory
}
```

#### `free` (0x3100)
**Purpose**: Free previously allocated memory
**Parameters**:
- R0: Memory address to free
**Returns**: R0 = 0 on success

**Example Usage**:
```c
free(buffer);
```

#### `calloc` (0x3200)
**Purpose**: Allocate and clear memory block
**Parameters**:
- R0: Number of elements
- R1: Size of each element in bytes
**Returns**: R0 = Allocated memory address (or 0 if failed)

**Example Usage**:
```c
int* array = calloc(50, sizeof(int));  // Allocate 50 integers, initialized to 0
```

#### `realloc` (0x3300)
**Purpose**: Reallocate memory block to new size
**Parameters**:
- R0: Current memory address
- R1: New size in bytes
**Returns**: R0 = New memory address (or 0 if failed)

**Example Usage**:
```c
char* buffer = malloc(50);
char* new_buffer = realloc(buffer, 100);
```

### Math Functions

#### `abs` (0x4000)
**Purpose**: Calculate absolute value of integer
**Parameters**:
- R0: Integer value
**Returns**: R0 = Absolute value

**Example Usage**:
```c
int result = abs(-42);  // Returns 42
```

#### `rand` (0x4100)
**Purpose**: Generate pseudo-random number
**Parameters**: None
**Returns**: R0 = Random number (0-32767)

**Example Usage**:
```c
int random_value = rand();
```

#### `srand` (0x4200)
**Purpose**: Set seed for random number generator
**Parameters**:
- R0: Seed value
**Returns**: None

**Example Usage**:
```c
srand(12345);  // Set seed for reproducible results
```

### Utility Functions

#### `exit` (0x5000)
**Purpose**: Terminate program execution
**Parameters**:
- R0: Exit status code
**Returns**: Does not return

**Example Usage**:
```c
exit(0);  // Normal termination
```

#### `atoi` (0x5100)
**Purpose**: Convert string to integer
**Parameters**:
- R0: String address (null-terminated)
**Returns**: R0 = Converted integer value

**Example Usage**:
```c
int value = atoi("42");  // Returns 42
```

#### `itoa` (0x5200)
**Purpose**: Convert integer to string
**Parameters**:
- R0: Integer value
- R1: Buffer address for result
- R2: Numeric base (2-36)
**Returns**: R0 = Buffer address

**Example Usage**:
```c
char buffer[20];
itoa(42, buffer, 10);  // Convert 42 to decimal string
```

## System Call Interface

The library functions use system calls for I/O operations:

### System Call Numbers
- **1**: PUTCHAR - Output character
- **2**: GETCHAR - Read character
- **3**: PUTS - Output string
- **4**: GETS - Read string
- **5**: EXIT - Terminate program
- **6**: MALLOC - Allocate memory
- **7**: FREE - Free memory
- **8**: PRINTF - Formatted output

### System Call Convention
```assembly
LOAD R0, syscall_number    ; Load syscall number into R0
SYSCALL                    ; Execute system call
; Result (if any) returned in R0
```

## Integration with C Compiler

### Automatic Linking

The C compiler automatically links standard library functions when generating code:

1. **Function Resolution**: Compiler resolves function calls to library addresses
2. **Parameter Passing**: Compiler generates code to pass parameters in registers R0-R3
3. **Return Handling**: Compiler generates code to handle return values from R0

### Example Compilation

```c
// Source C code
int main() {
    char buffer[100];
    strcpy(buffer, "Hello");
    puts(buffer);
    return 0;
}
```

**Generated Assembly** (simplified):
```assembly
; Function calls automatically resolved to library addresses
LOAD R0, buffer_address    ; Pass dest parameter in R0
LOAD R1, hello_string      ; Pass src parameter in R1
LOAD R15, strcpy_address   ; Load library function address
CALL R15                   ; Call strcpy function

LOAD R0, buffer_address    ; Pass string parameter in R0
LOAD R15, puts_address     ; Load library function address
CALL R15                   ; Call puts function
```

## Error Handling

### Return Value Conventions

- **Success**: Functions return 0 or positive value
- **Failure**: Functions return negative error code
- **Null Pointers**: Functions return 0 for invalid operations

### Common Error Codes

- **-1**: Invalid parameter
- **-2**: Out of memory
- **-3**: Buffer overflow
- **-4**: Invalid format specifier

## Performance Considerations

### Memory Usage

- **Function Sizes**: Each function is optimized for minimal memory footprint
- **Buffer Management**: Temporary buffers reused when possible
- **Stack Usage**: Minimal stack space required for function calls

### Execution Speed

- **Assembly Optimization**: Functions implemented for maximum efficiency
- **Register Usage**: Optimal register allocation for performance
- **Memory Access**: Minimized memory operations for speed

## Testing

The standard library includes comprehensive tests:

```bash
# Run complete test suite
node src/system/compiler/test-c-standard-library.js
```

### Test Coverage

- **Function Loading**: Verify all functions load correctly
- **Memory Layout**: Ensure no address conflicts
- **Integration**: Test with C compiler pipeline
- **Error Conditions**: Validate error handling

## Future Enhancements

### Phase 4 Features

- **Extended printf**: Full format specifier support
- **File I/O**: fopen, fclose, fread, fwrite functions
- **Advanced Math**: sin, cos, sqrt, pow functions
- **String Search**: strchr, strstr, strtok functions

### Bootstrap Development

The standard library enables further system development:

1. **C Program Development**: Foundation for C applications
2. **System Tools**: Development of additional system utilities
3. **BASIC Interpreter**: C-based interpreter implementation
4. **Enhanced Libraries**: Additional standard library functions

## Usage Examples

### Complete C Program Example

```c
/* Example C program using standard library */
#include <stdlib.h>  // For function declarations

void print_banner() {
    char buffer[50];
    strcpy(buffer, "OrionRisc-128");
    puts(buffer);
}

int string_length_demo() {
    return strlen("Hello, World!");
}

int main() {
    char input[100];

    print_banner();

    printf("String length demo: %d\n", string_length_demo());

    puts("Enter your name:");
    gets(input);

    printf("Hello, %s!\n", input);

    return 0;
}
```

This program demonstrates:
- String manipulation functions
- I/O operations
- Parameter passing and return values
- Integration with the C compiler

## Implementation Notes

### Assembly Language Constraints

All functions are constrained by the RISC processor architecture:

- **16 registers**: Efficient register usage required
- **32-bit instructions**: Compact instruction encoding
- **128KB memory**: Memory-efficient implementations
- **No hardware multiply/divide**: Software implementation required

### Bootstrap Compatibility

The library functions are designed for bootstrap development:

- **Self-contained**: No external dependencies
- **Progressive enhancement**: Foundation for advanced features
- **Testing**: Comprehensive test coverage for reliability
- **Documentation**: Complete interface documentation

This standard library provides the essential runtime support needed for C program development on the OrionRisc-128 system, enabling the next phase of system software development.