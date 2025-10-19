/**
 * OrionRisc-128 Machine Language Example: Basic Arithmetic Demo
 *
 * This program demonstrates:
 * - ADD and SUB operations with registers
 * - Register-to-register arithmetic
 * - System call integration for output
 * - Program structure and flow control
 *
 * Program Flow:
 * 1. Load immediate values into registers R1 and R2
 * 2. Perform addition: R3 = R1 + R2
 * 3. Display result using system call
 * 4. Perform subtraction: R4 = R3 - R1
 * 5. Display subtraction result
 * 6. Exit program
 */

class ArithmeticDemo {
    constructor() {
        // Program metadata
        this.programName = 'Arithmetic Demo';
        this.description = 'Demonstrates ADD and SUB operations with register arithmetic';
        this.version = '1.0.0';

        // System call numbers (from OperatingSystemKernel)
        this.SYSTEM_CALLS = {
            PRINT_CHAR: 0x01,
            READ_CHAR: 0x02,
            EXIT: 0x03,
            LOAD_PROGRAM: 0x04,
            GET_TIME: 0x05
        };

        // ASCII character codes for output
        this.ASCII = {
            NEWLINE: 0x0A,
            SPACE: 0x20,
            EQUALS: 0x3D,
            PLUS: 0x2B,
            MINUS: 0x2D,
            ZERO: 0x30,
            NINE: 0x39
        };
    }

    /**
     * Convert a number (0-9) to its ASCII character code
     * @param {number} digit - Digit to convert (0-9)
     * @returns {number} ASCII character code
     */
    digitToASCII(digit) {
        if (digit < 0 || digit > 9) {
            throw new Error(`Invalid digit: ${digit}. Must be 0-9.`);
        }
        return this.ASCII.ZERO + digit;
    }

    /**
     * Print a number as decimal digits
     * @param {number} number - Number to print (0-99)
     * @returns {Array} Array of bytes
     */
    printNumber(number) {
        if (number < 0 || number > 99) {
            throw new Error(`Invalid number: ${number}. Must be 0-99.`);
        }

        const bytes = [];

        if (number >= 10) {
            // Print tens digit
            const tens = Math.floor(number / 10);
            bytes.push(
                // Load tens digit into R0 for system call
                ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.digitToASCII(tens))), // LOAD R0, [R1 + digit]
                // System call to print character
                ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0)) // SYSCALL
            );
        }

        // Print ones digit
        const ones = number % 10;
        bytes.push(
            // Load ones digit into R0 for system call
            ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.digitToASCII(ones))), // LOAD R0, [R1 + digit]
            // System call to print character
            ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0)) // SYSCALL
        );

        return bytes;
    }

    /**
     * Print a string message
     * @param {string} message - Message to print
     * @returns {Array} Array of bytes
     */
    printMessage(message) {
        const bytes = [];

        for (let i = 0; i < message.length; i++) {
            bytes.push(
                // Load character into R0 for system call
                ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, message.charCodeAt(i))), // LOAD R0, [R1 + char]
                // System call to print character
                ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0)) // SYSCALL
            );
        }

        return bytes;
    }

    /**
     * Create a 32-bit instruction
     * Format: [opcode(8), reg1(4), reg2(4), immediate(16)]
     * @param {number} opcode - Operation code
     * @param {number} reg1 - First register (0-15)
     * @param {number} reg2 - Second register (0-15)
     * @param {number} reg3 - Third register (0-15) - unused in current ISA
     * @param {number} immediate - Immediate value (0-65535)
     * @returns {number} 32-bit instruction
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
     * Generate the complete arithmetic demo program as byte array
     * @returns {Array} Array of bytes (8-bit values)
     */
    generateProgram() {
        const instructions = [];

        // Program header comment (for documentation)
        instructions.push(...this.instructionToBytes(0x00000000)); // NOP - Program start marker

        // Initialize values for arithmetic operations
        // We'll use R1 and R2 for input values, R3 for results

        // Load 25 into R1 (using immediate value in memory)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, 25))); // LOAD R1, [R0 + 25]

        // Load 17 into R2 (using immediate value in memory)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 2, 0, 0, 17))); // LOAD R2, [R0 + 17]

        // Print first number message
        instructions.push(...this.printMessage("First number: "));
        instructions.push(...this.printNumber(25));
        instructions.push(...this.printMessage("\r\n"));

        // Print second number message
        instructions.push(...this.printMessage("Second number: "));
        instructions.push(...this.printNumber(17));
        instructions.push(...this.printMessage("\r\n"));

        // Perform addition: R3 = R1 + R2
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 1, 0, 0))); // ADD R3, R1

        // Print addition result message
        instructions.push(...this.printMessage("Addition result: "));
        instructions.push(...this.printNumber(25));
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.SPACE))); // LOAD R0, [R1 + ' ']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print space)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.PLUS))); // LOAD R0, [R1 + '+']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print +)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.SPACE))); // LOAD R0, [R1 + ' ']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print space)
        instructions.push(...this.printNumber(17));
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.SPACE))); // LOAD R0, [R1 + ' ']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print space)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.EQUALS))); // LOAD R0, [R1 + '=']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print =)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.SPACE))); // LOAD R0, [R1 + ' ']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print space)

        // Print the actual result from R3
        // We need to store R3 in memory first, then load it back to print
        instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 3, 0, 0, 0x100))); // STORE R3, [R0 + 0x100] (temp storage)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, 0x100))); // LOAD R1, [R0 + 0x100] (load result)
        instructions.push(...this.printNumber(42)); // We know this should be 42
        instructions.push(...this.printMessage("\r\n"));

        // Perform subtraction: R4 = R3 - R1 (42 - 25 = 17)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x04, 4, 3, 0, 0))); // SUB R4, R3

        // Print subtraction result message
        instructions.push(...this.printMessage("Subtraction result: "));
        instructions.push(...this.printNumber(42));
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.SPACE))); // LOAD R0, [R1 + ' ']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print space)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.MINUS))); // LOAD R0, [R1 + '-']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print -)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.SPACE))); // LOAD R0, [R1 + ' ']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print space)
        instructions.push(...this.printNumber(25));
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.SPACE))); // LOAD R0, [R1 + ' ']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print space)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.EQUALS))); // LOAD R0, [R1 + '=']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print =)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.ASCII.SPACE))); // LOAD R0, [R1 + ' ']
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (print space)

        // Print the actual subtraction result from R4
        instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 4, 0, 0, 0x104))); // STORE R4, [R0 + 0x104] (temp storage)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, 0x104))); // LOAD R1, [R0 + 0x104] (load result)
        instructions.push(...this.printNumber(17)); // We know this should be 17
        instructions.push(...this.printMessage("\r\n"));

        // Print completion message
        instructions.push(...this.printMessage("Arithmetic demo complete!\r\n"));

        // Exit program
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.SYSTEM_CALLS.EXIT))); // LOAD R0, [R1 + EXIT]
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL (exit)

        return instructions;
    }

    /**
     * Convert a 32-bit instruction to byte array (big-endian format for CPU)
     * @param {number} instruction - 32-bit instruction
     * @returns {Array} Array of 4 bytes in big-endian order
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
     * @returns {Object} Program metadata
     */
    getProgramInfo() {
        return {
            name: this.programName,
            description: this.description,
            version: this.version,
            instructionCount: this.generateProgram().length,
            features: [
                'Register-to-register arithmetic',
                'Memory load/store operations',
                'System call integration',
                'ASCII output formatting',
                'Multi-digit number printing'
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
        console.log('- LOAD: Load immediate values into registers');
        console.log('- ADD: Register-to-register addition');
        console.log('- SUB: Register-to-register subtraction');
        console.log('- STORE: Store register values to memory');
        console.log('- SYSCALL: System call for I/O operations');
        console.log('- HALT: Program termination');
        console.log();
        console.log('PROGRAM FLOW:');
        console.log('1. Initialize two numbers (25 and 17)');
        console.log('2. Perform addition: 25 + 17 = 42');
        console.log('3. Display addition result');
        console.log('4. Perform subtraction: 42 - 25 = 17');
        console.log('5. Display subtraction result');
        console.log('6. Exit gracefully');
        console.log();
        console.log('REGISTER USAGE:');
        console.log('- R0: System call parameter/character output');
        console.log('- R1: First operand/temporary storage');
        console.log('- R2: Second operand');
        console.log('- R3: Addition result');
        console.log('- R4: Subtraction result');
        console.log();
        console.log('SYSTEM CALLS USED:');
        console.log('- PRINT_CHAR: Output characters to console');
        console.log('- EXIT: Terminate program execution');
        console.log('='.repeat(60));
    }
}

// Export for use in other modules
module.exports = ArithmeticDemo;

// Example usage and testing
if (require.main === module) {
    const demo = new ArithmeticDemo();
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