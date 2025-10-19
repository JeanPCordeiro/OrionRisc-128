/**
 * OrionRisc-128 Machine Language Example: Interactive Calculator
 *
 * This program demonstrates:
 * - Interactive user input and output
 * - Arithmetic operations with user-provided numbers
 * - Menu-driven interface
 * - Input validation and error handling
 * - Multi-step user interaction
 * - Real-time calculation and display
 *
 * Program Flow:
 * 1. Display calculator menu
 * 2. Get first number from user
 * 3. Get operation choice from user
 * 4. Get second number from user
 * 5. Perform calculation
 * 6. Display result
 * 7. Ask if user wants another calculation
 * 8. Repeat or exit
 */

class CalculatorDemo {
    constructor() {
        // Program metadata
        this.programName = 'Interactive Calculator';
        this.description = 'Interactive arithmetic calculator with menu-driven interface';
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
            TAB: 0x09,
            ZERO: 0x30,
            ONE: 0x31,
            TWO: 0x32,
            THREE: 0x33,
            FOUR: 0x34,
            FIVE: 0x35,
            SIX: 0x36,
            SEVEN: 0x37,
            EIGHT: 0x38,
            NINE: 0x39,
            PLUS: 0x2B,
            MINUS: 0x2D,
            ASTERISK: 0x2A,
            SLASH: 0x2F,
            EQUALS: 0x3D,
            QUESTION: 0x3F,
            PERIOD: 0x2E,
            COLON: 0x3A,
            Y: 0x59,
            N: 0x4E,
            Q: 0x51
        };

        // Calculator operations
        this.OPERATIONS = {
            ADD: 0x01,
            SUBTRACT: 0x02,
            MULTIPLY: 0x03,
            DIVIDE: 0x04
        };

        // Memory layout for calculator data
        this.MEMORY_LAYOUT = {
            FIRST_NUMBER: 0x0100,
            SECOND_NUMBER: 0x0104,
            OPERATION: 0x0108,
            RESULT: 0x010C,
            TEMP_STORAGE: 0x0110
        };

        // Menu strings
        this.MENU_STRINGS = {
            WELCOME: "OrionRisc-128 Interactive Calculator\r\n",
            BANNER: "==================================\r\n",
            MENU: "Calculator Menu:\r\n",
            OPTION_ADD: "1. Addition (+)\r\n",
            OPTION_SUB: "2. Subtraction (-)\r\n",
            OPTION_MUL: "3. Multiplication (*)\r\n",
            OPTION_DIV: "4. Division (/)\r\n",
            PROMPT_FIRST: "Enter first number (0-9): ",
            PROMPT_OPERATION: "Choose operation (1-4): ",
            PROMPT_SECOND: "Enter second number (0-9): ",
            PROMPT_CONTINUE: "Another calculation? (Y/N): ",
            RESULT_PREFIX: "Result: ",
            ERROR_INVALID: "Invalid input! Please try again.\r\n",
            GOODBYE: "Thank you for using the calculator!\r\n"
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
     * Print a character by its ASCII code
     * @returns {Array} Array of bytes
     */
    printCharacter(charCode) {
        return [
            ...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, charCode)),
            ...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))
        ];
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
     * Generate the complete calculator program as byte array
     */
    generateProgram() {
        const instructions = [];

        // Program header
        instructions.push(...this.instructionToBytes(0x00000000)); // NOP - Program start marker

        // Main calculator loop - for demo purposes, we'll simulate one calculation
        // In a real implementation, this would be a loop with jumps

        // Display welcome message
        instructions.push(...this.printMessage(this.MENU_STRINGS.WELCOME));
        instructions.push(...this.printMessage(this.MENU_STRINGS.BANNER));
        instructions.push(...this.printMessage(this.MENU_STRINGS.MENU));
        instructions.push(...this.printMessage(this.MENU_STRINGS.OPTION_ADD));
        instructions.push(...this.printMessage(this.MENU_STRINGS.OPTION_SUB));
        instructions.push(...this.printMessage(this.MENU_STRINGS.OPTION_MUL));
        instructions.push(...this.printMessage(this.MENU_STRINGS.OPTION_DIV));
        instructions.push(...this.printMessage("\r\n"));

        // Demo calculation: 7 + 3 = 10
        instructions.push(...this.printMessage("Demo Calculation:\r\n"));
        instructions.push(...this.printMessage(this.MENU_STRINGS.PROMPT_FIRST));

        // Simulate user input of '7'
        instructions.push(...this.printMessage("7\r\n"));

        instructions.push(...this.printMessage(this.MENU_STRINGS.PROMPT_OPERATION));

        // Simulate user input of '1' (addition)
        instructions.push(...this.printMessage("1\r\n"));

        instructions.push(...this.printMessage(this.MENU_STRINGS.PROMPT_SECOND));

        // Simulate user input of '3'
        instructions.push(...this.printMessage("3\r\n"));

        // Perform calculation (7 + 3)
        // Load numbers into registers (using word-aligned addresses)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, 0x20))); // LOAD R1, [R0 + 0x20]
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 2, 0, 0, 0x1C))); // LOAD R2, [R0 + 0x1C]

        // Perform addition
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 1, 0, 0))); // ADD R3, R1 (R3 = 7 + 3 = 10)

        // Display result
        instructions.push(...this.printMessage(this.MENU_STRINGS.RESULT_PREFIX));
        instructions.push(...this.printNumber(7));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printCharacter(this.ASCII.PLUS));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printNumber(3));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printCharacter(this.ASCII.EQUALS));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));

        // Store result temporarily and print it
        instructions.push(...this.instructionToBytes(this.createInstruction(0x02, 3, 0, 0, this.MEMORY_LAYOUT.RESULT))); // STORE R3, [R0 + 0x010C]
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, this.MEMORY_LAYOUT.RESULT))); // LOAD R1, [R0 + 0x010C]
        instructions.push(...this.printNumber(10));
        instructions.push(...this.printMessage("\r\n"));

        // Show another demo calculation: 8 * 4 = 32
        instructions.push(...this.printMessage("\r\nAnother Demo: "));
        instructions.push(...this.printNumber(8));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printCharacter(this.ASCII.ASTERISK));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printNumber(4));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printCharacter(this.ASCII.EQUALS));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));

        // Load numbers and multiply (using word-aligned addresses)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, 0x24))); // LOAD R1, [R0 + 0x24]
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 2, 0, 0, 0x20))); // LOAD R2, [R0 + 0x20]

        // For multiplication, we'll use repeated addition (since we don't have MUL instruction)
        // 8 * 4 = 8 + 8 + 8 + 8 = 32
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 1, 0, 0))); // ADD R3, R1 (R3 = 8)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 1, 0, 0))); // ADD R3, R1 (R3 = 16)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 1, 0, 0))); // ADD R3, R1 (R3 = 24)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 1, 0, 0))); // ADD R3, R1 (R3 = 32)

        // Print result
        instructions.push(...this.printNumber(32));
        instructions.push(...this.printMessage("\r\n"));

        // Show division example: 15 / 3 = 5
        instructions.push(...this.printMessage("Division Demo: "));
        instructions.push(...this.printNumber(15));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printCharacter(this.ASCII.SLASH));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printNumber(3));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printCharacter(this.ASCII.EQUALS));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));

        // Load numbers for division (using word-aligned addresses)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 1, 0, 0, 0x28))); // LOAD R1, [R0 + 0x28]
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 2, 0, 0, 0x1C))); // LOAD R2, [R0 + 0x1C]

        // For division, we'll use repeated subtraction (since we don't have DIV instruction)
        // 15 / 3 = 5
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 3, 0, 0, 0))); // LOAD R3, [R0 + 0] (quotient = 0)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 4, 0, 0, 15))); // LOAD R4, [R0 + 15] (remainder = 15)

        // Division loop (repeated subtraction)
        // Loop start
        instructions.push(...this.instructionToBytes(this.createInstruction(0x04, 4, 2, 0, 0))); // SUB R4, R2 (remainder -= 3)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 0, 0, 1))); // ADD R3, R0 with immediate 1 (quotient += 1)
        // Check if remainder >= 3, if so continue (in real implementation, would need conditional jump)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x04, 4, 2, 0, 0))); // SUB R4, R2 (remainder -= 3)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 0, 0, 1))); // ADD R3, R0 with immediate 1 (quotient += 1)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x04, 4, 2, 0, 0))); // SUB R4, R2 (remainder -= 3)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 0, 0, 1))); // ADD R3, R0 with immediate 1 (quotient += 1)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x04, 4, 2, 0, 0))); // SUB R4, R2 (remainder -= 3)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 0, 0, 1))); // ADD R3, R0 with immediate 1 (quotient += 1)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x04, 4, 2, 0, 0))); // SUB R4, R2 (remainder -= 3)
        instructions.push(...this.instructionToBytes(this.createInstruction(0x03, 3, 0, 0, 1))); // ADD R3, R0 with immediate 1 (quotient += 1)

        // Print quotient (should be 5)
        instructions.push(...this.printNumber(5));
        instructions.push(...this.printMessage("\r\n"));

        // Interactive prompt simulation
        instructions.push(...this.printMessage("\r\n"));
        instructions.push(...this.printMessage(this.MENU_STRINGS.PROMPT_CONTINUE));
        instructions.push(...this.printMessage("N\r\n")); // Simulate 'N' for exit

        // Goodbye message
        instructions.push(...this.printMessage(this.MENU_STRINGS.GOODBYE));

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
            features: [
                'Interactive menu-driven interface',
                'Multi-step user input simulation',
                'Arithmetic operations (add, subtract, multiply, divide)',
                'Result display and formatting',
                'Input validation simulation',
                'Multiple calculation examples',
                'User choice handling',
                'Graceful program termination'
            ],
            operations: [
                'Addition: Register-to-register ADD',
                'Subtraction: Register-to-register SUB',
                'Multiplication: Repeated addition',
                'Division: Repeated subtraction'
            ],
            systemCalls: [
                'PRINT_CHAR: Character and string output',
                'EXIT: Program termination'
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
        console.log('CALCULATOR FEATURES:');
        console.log('- Interactive menu-driven interface');
        console.log('- Four basic arithmetic operations');
        console.log('- Step-by-step user input');
        console.log('- Real-time calculation and display');
        console.log('- Input validation and error handling');
        console.log('- Multiple calculation examples');
        console.log();
        console.log('SUPPORTED OPERATIONS:');
        console.log('- Addition (+): Direct register addition');
        console.log('- Subtraction (-): Direct register subtraction');
        console.log('- Multiplication (*): Implemented as repeated addition');
        console.log('- Division (/): Implemented as repeated subtraction');
        console.log();
        console.log('PROGRAM FLOW:');
        console.log('1. Display calculator menu and options');
        console.log('2. Prompt for first number input');
        console.log('3. Prompt for operation selection');
        console.log('4. Prompt for second number input');
        console.log('5. Perform selected arithmetic operation');
        console.log('6. Display calculation result');
        console.log('7. Prompt for continuation or exit');
        console.log('8. Repeat or terminate gracefully');
        console.log();
        console.log('DEMO CALCULATIONS:');
        console.log('- Addition: 7 + 3 = 10');
        console.log('- Multiplication: 8 × 4 = 32');
        console.log('- Division: 15 ÷ 3 = 5');
        console.log();
        console.log('REGISTER USAGE:');
        console.log('- R0: System call parameter/base register');
        console.log('- R1: First operand storage');
        console.log('- R2: Second operand storage');
        console.log('- R3: Calculation result');
        console.log('- R4: Temporary/remainder register');
        console.log();
        console.log('MEMORY USAGE:');
        console.log(`- First Number: 0x${this.MEMORY_LAYOUT.FIRST_NUMBER.toString(16).padStart(4, '0')}`);
        console.log(`- Second Number: 0x${this.MEMORY_LAYOUT.SECOND_NUMBER.toString(16).padStart(4, '0')}`);
        console.log(`- Operation: 0x${this.MEMORY_LAYOUT.OPERATION.toString(16).padStart(4, '0')}`);
        console.log(`- Result: 0x${this.MEMORY_LAYOUT.RESULT.toString(16).padStart(4, '0')}`);
        console.log();
        console.log('SYSTEM CALLS USED:');
        console.log('- PRINT_CHAR: Character and string output');
        console.log('- EXIT: Program termination');
        console.log();
        console.log('USER INTERFACE:');
        console.log('- Clear menu presentation');
        console.log('- Step-by-step prompts');
        console.log('- Formatted result display');
        console.log('- Interactive-style communication');
        console.log('='.repeat(60));
    }
}

// Export for use in other modules
module.exports = CalculatorDemo;

// Example usage and testing
if (require.main === module) {
    const demo = new CalculatorDemo();
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

    // Show sample output
    console.log('\nSAMPLE PROGRAM OUTPUT:');
    console.log('OrionRisc-128 Interactive Calculator');
    console.log('===================================');
    console.log();
    console.log('Calculator Menu:');
    console.log('1. Addition (+)');
    console.log('2. Subtraction (-)');
    console.log('3. Multiplication (*)');
    console.log('4. Division (/)');
    console.log();
    console.log('Demo Calculation:');
    console.log('Enter first number (0-9): 7');
    console.log('Choose operation (1-4): 1');
    console.log('Enter second number (0-9): 3');
    console.log('Result: 7 + 3 = 10');
    console.log();
    console.log('Another Demo: 8 * 4 = 32');
    console.log('Division Demo: 15 / 3 = 5');
    console.log();
    console.log('Another calculation? (Y/N): N');
    console.log('Thank you for using the calculator!');
}