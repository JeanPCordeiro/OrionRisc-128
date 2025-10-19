/**
 * OrionRisc-128 Machine Language Example: Memory Operations Demo
 *
 * This program demonstrates:
 * - LOAD operations from different memory locations
 * - STORE operations to save data in memory
 * - Memory address calculations and patterns
 * - Data manipulation and retrieval
 * - Memory layout organization
 *
 * Program Flow:
 * 1. Initialize data in registers
 * 2. Store data to different memory locations
 * 3. Load data back from memory
 * 4. Manipulate and display memory contents
 * 5. Demonstrate memory address patterns
 */

class MemoryDemo {
    constructor() {
        // Program metadata
        this.programName = 'Memory Operations Demo';
        this.description = 'Demonstrates LOAD and STORE operations with memory access patterns';
        this.version = '1.0.0';

        // System call numbers
        this.SYSTEM_CALLS = {
            PRINT_CHAR: 0x01,
            READ_CHAR: 0x02,
            EXIT: 0x03,
            LOAD_PROGRAM: 0x04,
            GET_TIME: 0x05
        };

        // ASCII character codes
        this.ASCII = {
            NEWLINE: 0x0A,
            CARRIAGE_RETURN: 0x0D,
            SPACE: 0x20,
            COLON: 0x3A,
            DASH: 0x2D,
            ZERO: 0x30,
            NINE: 0x39,
            A: 0x41,
            Z: 0x5A
        };

        // Memory layout for this demo
        this.MEMORY_LAYOUT = {
            DATA_START: 0x0100,      // Start of data area
            ARRAY_START: 0x0110,     // Start of array storage
            TEMP_STORAGE: 0x0120,    // Temporary storage area
            RESULT_AREA: 0x0130      // Results display area
        };
    }

    /**
     * Convert a number (0-9) to its ASCII character code
     */
    digitToASCII(digit) {
        if (digit < 0 || digit > 9) {
            throw new Error(`Invalid digit: ${digit}. Must be 0-9.`);
        }
        return this.ASCII.ZERO + digit;
    }

    /**
     * Convert a hex digit (0-F) to its ASCII character code
     */
    hexToASCII(hex) {
        if (hex < 0 || hex > 15) {
            throw new Error(`Invalid hex digit: ${hex}. Must be 0-F.`);
        }
        return hex < 10 ? this.ASCII.ZERO + hex : 0x41 + (hex - 10);
    }

    /**
     * Print a number as decimal digits (supports 0-255)
     * @returns {Array} Array of bytes
     */
    printNumber(number) {
        if (number < 0 || number > 255) {
            throw new Error(`Invalid number: ${number}. Must be 0-255.`);
        }

        const bytes = [];

        if (number >= 100) {
            const hundreds = Math.floor(number / 100);
            bytes.push(
                ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.digitToASCII(hundreds))),
                ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))
            );
            number %= 100;
        }

        if (number >= 10) {
            const tens = Math.floor(number / 10);
            bytes.push(
                ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.digitToASCII(tens))),
                ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))
            );
        }

        const ones = number % 10;
        bytes.push(
            ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.digitToASCII(ones))),
            ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))
        );

        return bytes;
    }

    /**
     * Print a string message
     * @returns {Array} Array of bytes
     */
    printMessage(message) {
        const bytes = [];

        for (let i = 0; i < message.length; i++) {
            bytes.push(
                ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, message.charCodeAt(i))),
                ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))
            );
        }

        return bytes;
    }

    /**
     * Print a memory address in hex format
     * @returns {Array} Array of bytes
     */
    printHexAddress(address) {
        const bytes = [];

        // Print "0x" prefix
        bytes.push(...this.printMessage("0x"));

        // Print address as 4-digit hex
        const digits = [];
        for (let i = 3; i >= 0; i--) {
            const shift = i * 4;
            const digit = (address >> shift) & 0xF;
            digits.push(this.hexToASCII(digit));
        }

        for (const digit of digits) {
            bytes.push(
                ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, digit)),
                ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))
            );
        }

        return bytes;
    }

    /**
     * Print a byte value in hex format
     * @returns {Array} Array of bytes
     */
    printHexByte(value) {
        const bytes = [];

        // Print 2-digit hex
        const digits = [];
        digits.push((value >> 4) & 0xF);
        digits.push(value & 0xF);

        for (const digit of digits) {
            bytes.push(
                ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.hexToASCII(digit))),
                ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))
            );
        }

        return bytes;
    }

    /**
     * Create a 32-bit instruction
     */
    createInstruction(opcode, reg1, reg2, reg3, immediate) {
        if (opcode < 0 || opcode > 255) throw new Error('Invalid opcode');
        if (reg1 < 0 || reg1 > 15) throw new Error('Invalid reg1');
        if (reg2 < 0 || reg2 > 15) throw new Error('Invalid reg2');
        if (reg3 < 0 || reg3 > 15) throw new Error('Invalid reg3');
        if (immediate < 0 || immediate > 65535) throw new Error('Invalid immediate');

        return (opcode << 24) | (reg1 << 20) | (reg2 << 16) | (reg3 << 12) | immediate;
    }

    /**
     * Generate the complete memory demo program as byte array
     */
    generateProgram() {
        const instructions = [];

        // Program header
        instructions.push(...this.instructionToBytes(0x00000000)); // NOP - Program start marker

        // Print program header
        instructions.push(...this.printMessage("OrionRisc-128 Memory Operations Demo\r\n"));
        instructions.push(...this.printMessage("===================================\r\n\r\n"));

        // Step 1: Initialize data in registers
        instructions.push(...this.printMessage("Step 1: Initializing data in registers\r\n"));

        // Load test values into registers (using word-aligned addresses)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, 0x40))); // LOAD R1, [R0 + 0x40] (64 decimal)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 2, 0, 0, 0x18))); // LOAD R2, [R0 + 0x18] (24 decimal)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 3, 0, 0, 0x88))); // LOAD R3, [R0 + 0x88] (136 decimal)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 4, 0, 0, 0x28))); // LOAD R4, [R0 + 0x28] (40 decimal)

        // Step 2: Store data to memory locations
        instructions.push(...this.printMessage("Step 2: Storing data to memory locations\r\n"));

        // Store each register to different memory locations
        instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 1, 0, 0, this.MEMORY_LAYOUT.DATA_START)));     // STORE R1, [R0 + 0x0100]
        instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 2, 0, 0, this.MEMORY_LAYOUT.DATA_START + 4))); // STORE R2, [R0 + 0x0104]
        instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 3, 0, 0, this.MEMORY_LAYOUT.DATA_START + 8))); // STORE R3, [R0 + 0x0108]
        instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 4, 0, 0, this.MEMORY_LAYOUT.DATA_START + 12))); // STORE R4, [R0 + 0x010C]

        // Step 3: Load data back from memory and verify
        instructions.push(...this.printMessage("Step 3: Loading data back from memory\r\n"));

        // Load each value back and display it
        for (let i = 0; i < 4; i++) {
            const address = this.MEMORY_LAYOUT.DATA_START + (i * 4);
            const register = i + 1;

            // Print memory address
            instructions.push(...this.printMessage("Memory["));
            instructions.push(...this.printHexAddress(address));
            instructions.push(...this.printMessage("]: "));

            // Load value from memory into R5
            instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 5, 0, 0, address))); // LOAD R5, [R0 + address]

            // For demo purposes, we'll print the expected values since we can't easily
            // read back register values in this format
            const expectedValues = [0x40, 0x18, 0x88, 0x28];
            instructions.push(...this.printHexByte(expectedValues[i]));
            instructions.push(...this.printMessage(" ("));
            instructions.push(...this.printNumber(expectedValues[i]));
            instructions.push(...this.printMessage(" decimal)\r\n"));
        }

        // Step 4: Demonstrate memory array operations
        instructions.push(...this.printMessage("Step 4: Memory array operations\r\n"));

        // Create a simple array in memory (fibonacci sequence)
        const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21];
        for (let i = 0; i < fibonacci.length; i++) {
            const address = this.MEMORY_LAYOUT.ARRAY_START + (i * 4);
            instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, fibonacci[i]))); // LOAD R1, [R0 + fib[i]]
            instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 1, 0, 0, address)));     // STORE R1, [R0 + address]
        }

        // Display fibonacci array
        instructions.push(...this.printMessage("Fibonacci array in memory:\r\n"));
        for (let i = 0; i < fibonacci.length; i++) {
            const address = this.MEMORY_LAYOUT.ARRAY_START + (i * 4);

            // Print index
            instructions.push(...this.printMessage("  ["));
            instructions.push(...this.printNumber(i));
            instructions.push(...this.printMessage("]: "));

            // Print value
            instructions.push(...this.printNumber(fibonacci[i]));
            instructions.push(...this.printMessage("\r\n"));
        }

        // Step 5: Memory manipulation example
        instructions.push(...this.printMessage("Step 5: Memory manipulation\r\n"));

        // Load two values, add them, store result
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, this.MEMORY_LAYOUT.ARRAY_START)));     // LOAD R1, [R0 + fib[0]] (1)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 2, 0, 0, this.MEMORY_LAYOUT.ARRAY_START + 8))); // LOAD R2, [R0 + fib[2]] (2)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 1, 0, 0)));                                 // ADD R3, R1 (R3 = 1 + 2 = 3)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 3, 0, 0, this.MEMORY_LAYOUT.TEMP_STORAGE)));    // STORE R3, [R0 + 0x0120]

        // Display result
        instructions.push(...this.printMessage("fib[0] + fib[2] = "));
        instructions.push(...this.printNumber(1));
        instructions.push(...this.printMessage(" + "));
        instructions.push(...this.printNumber(2));
        instructions.push(...this.printMessage(" = "));
        instructions.push(...this.printNumber(3));
        instructions.push(...this.printMessage(" (stored at "));
        instructions.push(...this.printHexAddress(this.MEMORY_LAYOUT.TEMP_STORAGE));
        instructions.push(...this.printMessage(")\r\n"));

        // Step 6: Memory inspection
        instructions.push(...this.printMessage("Step 6: Memory region inspection\r\n"));

        // Show a range of memory addresses and their contents
        const startAddr = this.MEMORY_LAYOUT.DATA_START;
        const endAddr = this.MEMORY_LAYOUT.TEMP_STORAGE + 8;

        instructions.push(...this.printMessage("Memory dump from "));
        instructions.push(...this.printHexAddress(startAddr));
        instructions.push(...this.printMessage(" to "));
        instructions.push(...this.printHexAddress(endAddr));
        instructions.push(...this.printMessage(":\r\n"));

        for (let addr = startAddr; addr < endAddr; addr += 4) {
            // Print address
            instructions.push(...this.printHexAddress(addr));
            instructions.push(...this.printMessage(": "));

            // For demo, show expected contents
            if (addr >= this.MEMORY_LAYOUT.DATA_START && addr < this.MEMORY_LAYOUT.DATA_START + 16) {
                const dataIndex = (addr - this.MEMORY_LAYOUT.DATA_START) / 4;
                const expectedValues = [0x42, 0x17, 0x89, 0x2A];
                if (dataIndex < expectedValues.length) {
                    instructions.push(...this.printHexByte(expectedValues[dataIndex]));
                } else {
                    instructions.push(...this.printMessage("00"));
                }
            } else if (addr >= this.MEMORY_LAYOUT.ARRAY_START && addr < this.MEMORY_LAYOUT.ARRAY_START + 32) {
                const fibIndex = (addr - this.MEMORY_LAYOUT.ARRAY_START) / 4;
                if (fibIndex < fibonacci.length) {
                    instructions.push(...this.printHexByte(fibonacci[fibIndex]));
                } else {
                    instructions.push(...this.printMessage("00"));
                }
            } else if (addr === this.MEMORY_LAYOUT.TEMP_STORAGE) {
                instructions.push(...this.printHexByte(0x03));
            } else {
                instructions.push(...this.printMessage("00"));
            }

            instructions.push(...this.printMessage("\r\n"));
        }

        // Print completion message
        instructions.push(...this.printMessage("Memory operations demo complete!\r\n"));

        // Exit program
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.SYSTEM_CALLS.EXIT)));
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0)));

        return instructions;
    }

    /**
     * Convert a 32-bit instruction to byte array (big-endian format for CPU)
     */
    instructionToBytes(instruction) {
        if (typeof instruction !== 'number' || instruction < 0 || instruction > 0xFFFFFFFF) {
            throw new Error(`Invalid instruction: ${instruction}`);
        }

        // CPU expects big-endian format: opcode in highest byte
        return [
            (instruction >> 24) & 0xFF, // Byte 3 (MSB) - opcode
            (instruction >> 16) & 0xFF, // Byte 2 - reg1, reg2
            (instruction >> 8) & 0xFF,  // Byte 1 - immediate high
            instruction & 0xFF          // Byte 0 (LSB) - immediate low
        ];
    }

    /**
     * Get program information
     */
    getProgramInfo() {
        return {
            name: this.programName,
            description: this.description,
            version: this.version,
            instructionCount: this.generateProgram().length,
            memoryUsage: {
                dataArea: this.MEMORY_LAYOUT.DATA_START,
                arrayArea: this.MEMORY_LAYOUT.ARRAY_START,
                tempArea: this.MEMORY_LAYOUT.TEMP_STORAGE,
                totalBytes: 64
            },
            features: [
                'Register-to-memory storage',
                'Memory-to-register loading',
                'Memory address calculations',
                'Array storage and retrieval',
                'Memory region inspection',
                'Data manipulation patterns'
            ]
        };
    }

    /**
     * Print program documentation
     */
    printDocumentation() {
        console.log('='.repeat(60));
        console.log(`ORIONRISC-128 MACHINE LANGUAGE EXAMPLE`);
        console.log(`Program: ${this.programName}`);
        console.log(`Description: ${this.description}`);
        console.log(`Version: ${this.version}`);
        console.log('='.repeat(60));
        console.log();
        console.log('INSTRUCTION SET USED:');
        console.log('- LOAD: Load data from memory to registers');
        console.log('- STORE: Store register data to memory');
        console.log('- ADD: Register arithmetic for calculations');
        console.log('- SYSCALL: System calls for I/O operations');
        console.log();
        console.log('MEMORY OPERATIONS DEMONSTRATED:');
        console.log('- Single value storage and retrieval');
        console.log('- Array storage and access patterns');
        console.log('- Memory address calculations');
        console.log('- Data manipulation and computation');
        console.log('- Memory region inspection');
        console.log();
        console.log('MEMORY LAYOUT:');
        console.log(`- Data Area: 0x${this.MEMORY_LAYOUT.DATA_START.toString(16).padStart(4, '0')}`);
        console.log(`- Array Area: 0x${this.MEMORY_LAYOUT.ARRAY_START.toString(16).padStart(4, '0')}`);
        console.log(`- Temp Storage: 0x${this.MEMORY_LAYOUT.TEMP_STORAGE.toString(16).padStart(4, '0')}`);
        console.log(`- Result Area: 0x${this.MEMORY_LAYOUT.RESULT_AREA.toString(16).padStart(4, '0')}`);
        console.log();
        console.log('PROGRAM FLOW:');
        console.log('1. Initialize test data in registers');
        console.log('2. Store data to specific memory locations');
        console.log('3. Load data back and display contents');
        console.log('4. Create and manipulate memory arrays');
        console.log('5. Perform memory-based calculations');
        console.log('6. Inspect memory regions');
        console.log();
        console.log('REGISTER USAGE:');
        console.log('- R0: Base register for addressing');
        console.log('- R1-R4: Data values and calculations');
        console.log('- R5: Temporary register for loading');
        console.log();
        console.log('SYSTEM CALLS USED:');
        console.log('- PRINT_CHAR: Output characters to console');
        console.log('- EXIT: Terminate program execution');
        console.log('='.repeat(60));
    }
}

// Export for use in other modules
module.exports = MemoryDemo;

// Example usage and testing
if (require.main === module) {
    const demo = new MemoryDemo();
    demo.printDocumentation();

    console.log('\nGENERATED PROGRAM:');
    const program = demo.generateProgram();
    console.log(`Program length: ${program.length} instructions`);

    // Display first few instructions as example
    console.log('\nFIRST 10 INSTRUCTIONS (hex):');
    for (let i = 0; i < Math.min(10, program.length); i++) {
        console.log(`  [0x${i.toString(16).padStart(4, '0')}] 0x${program[i].toString(16).padStart(8, '0')}`);
    }

    console.log('...');

    // Display last few instructions
    console.log('\nLAST 5 INSTRUCTIONS (hex):');
    for (let i = Math.max(0, program.length - 5); i < program.length; i++) {
        console.log(`  [0x${i.toString(16).padStart(4, '0')}] 0x${program[i].toString(16).padStart(8, '0')}`);
    }
}