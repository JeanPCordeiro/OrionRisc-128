/**
 * OrionRisc-128 Machine Language Example: I/O Operations Demo
 *
 * This program demonstrates:
 * - Character output using PRINT_CHAR system call
 * - String printing and formatting
 * - Interactive user input (simulated)
 * - Console I/O operations
 * - Text formatting and display
 *
 * Program Flow:
 * 1. Display welcome message
 * 2. Demonstrate character output
 * 3. Show string printing capabilities
 * 4. Simulate interactive input
 * 5. Display formatted output
 * 6. Exit gracefully
 */

class IODemo {
    constructor() {
        // Program metadata
        this.programName = 'I/O Operations Demo';
        this.description = 'Demonstrates character I/O operations and console interaction';
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
            // Control characters
            NEWLINE: 0x0A,
            CARRIAGE_RETURN: 0x0D,
            TAB: 0x09,
            SPACE: 0x20,

            // Numbers
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

            // Uppercase letters
            A: 0x41,
            B: 0x42,
            C: 0x43,
            D: 0x44,
            E: 0x45,
            F: 0x46,
            G: 0x47,
            H: 0x48,
            I: 0x49,
            J: 0x4A,
            K: 0x4B,
            L: 0x4C,
            M: 0x4D,
            N: 0x4E,
            O: 0x4F,
            P: 0x50,
            Q: 0x51,
            R: 0x52,
            S: 0x53,
            T: 0x54,
            U: 0x55,
            V: 0x56,
            W: 0x57,
            X: 0x58,
            Y: 0x59,
            Z: 0x5A,

            // Lowercase letters
            a: 0x61,
            b: 0x62,
            c: 0x63,
            d: 0x64,
            e: 0x65,
            f: 0x66,
            g: 0x67,
            h: 0x68,
            i: 0x69,
            j: 0x6A,
            k: 0x6B,
            l: 0x6C,
            m: 0x6D,
            n: 0x6E,
            o: 0x6F,
            p: 0x70,
            q: 0x71,
            r: 0x72,
            s: 0x73,
            t: 0x74,
            u: 0x75,
            v: 0x76,
            w: 0x77,
            x: 0x78,
            y: 0x79,
            z: 0x7A,

            // Symbols
            EXCLAMATION: 0x21,
            QUESTION: 0x3F,
            PERIOD: 0x2E,
            COMMA: 0x2C,
            COLON: 0x3A,
            SEMICOLON: 0x3B,
            DASH: 0x2D,
            UNDERSCORE: 0x5F,
            EQUALS: 0x3D,
            PLUS: 0x2B,
            ASTERISK: 0x2A,
            SLASH: 0x2F,
            BACKSLASH: 0x5C,
            PIPE: 0x7C,
            AT: 0x40,
            HASH: 0x23,
            DOLLAR: 0x24,
            PERCENT: 0x25,
            CARET: 0x5E,
            AMPERSAND: 0x26,
            PAREN_OPEN: 0x28,
            PAREN_CLOSE: 0x29,
            BRACKET_OPEN: 0x5B,
            BRACKET_CLOSE: 0x5D,
            BRACE_OPEN: 0x7B,
            BRACE_CLOSE: 0x7D,
            QUOTE: 0x22,
            APOSTROPHE: 0x27,
            LESS_THAN: 0x3C,
            GREATER_THAN: 0x3E
        };

        // Common string constants
        this.STRINGS = {
            WELCOME: "Welcome to OrionRisc-128 I/O Demo!\r\n",
            MENU: "I/O Operations Menu:\r\n",
            CHAR_DEMO: "1. Character Output Demo\r\n",
            STRING_DEMO: "2. String Printing Demo\r\n",
            INTERACTIVE_DEMO: "3. Interactive Input Demo\r\n",
            FORMATTED_DEMO: "4. Formatted Output Demo\r\n",
            GOODBYE: "Thank you for using OrionRisc-128!\r\n",
            DEMO_COMPLETE: "Demo completed successfully!\r\n"
        };

        // Additional strings
        this.PROMPT = "Press any key to continue...";
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
     * Generate the complete I/O demo program as byte array
     */
    generateProgram() {
        const instructions = [];

        // Program header
        instructions.push(...this.instructionToBytes(0x00000000)); // NOP - Program start marker

        // Display welcome message
        instructions.push(...this.printMessage(this.STRINGS.WELCOME));
        instructions.push(...this.printMessage(this.STRINGS.MENU));

        // Character output demo
        instructions.push(...this.printMessage(this.STRINGS.CHAR_DEMO));
        instructions.push(...this.printMessage("Characters: "));
        instructions.push(...this.printCharacter(this.ASCII.A));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printCharacter(this.ASCII.B));
        instructions.push(...this.printCharacter(this.ASCII.SPACE));
        instructions.push(...this.printCharacter(this.ASCII.C));
        instructions.push(...this.printMessage("\r\n"));

        // String printing demo
        instructions.push(...this.printMessage(this.STRINGS.STRING_DEMO));
        instructions.push(...this.printMessage("Sample strings:\r\n"));
        instructions.push(...this.printMessage("  Hello, World!\r\n"));
        instructions.push(...this.printMessage("  OrionRisc-128 Rocks!\r\n"));
        instructions.push(...this.printMessage("  ASCII Art: "));
        instructions.push(...this.printCharacter(this.ASCII.ASTERISK));
        instructions.push(...this.printCharacter(this.ASCII.ASTERISK));
        instructions.push(...this.printCharacter(this.ASCII.ASTERISK));
        instructions.push(...this.printMessage("\r\n"));

        // Interactive input demo (simulated)
        instructions.push(...this.printMessage(this.STRINGS.INTERACTIVE_DEMO));
        instructions.push(...this.printMessage("Simulating user input...\r\n"));
        instructions.push(...this.printMessage(this.PROMPT));

        // Simulate reading input (in real implementation, this would use READ_CHAR)
        // For demo purposes, we'll simulate reading 'Y' character
        instructions.push(...this.printMessage(" Read: "));
        instructions.push(...this.printCharacter(this.ASCII.Y));
        instructions.push(...this.printMessage(" (echoed)\r\n"));

        // Formatted output demo
        instructions.push(...this.printMessage(this.STRINGS.FORMATTED_DEMO));
        instructions.push(...this.printMessage("Numbers: "));

        // Print numbers 0-9 with formatting
        for (let i = 0; i <= 9; i++) {
            if (i > 0) {
                instructions.push(...this.printMessage(", "));
            }
            instructions.push(...this.printNumber(i));
        }
        instructions.push(...this.printMessage("\r\n"));

        // Print letters A-Z with formatting
        instructions.push(...this.printMessage("Letters: "));
        for (let i = 0; i < 26; i++) {
            if (i > 0 && i % 5 === 0) {
                instructions.push(...this.printMessage("\r\n         "));
            } else if (i > 0) {
                instructions.push(...this.printMessage(", "));
            }
            instructions.push(...this.printCharacter(this.ASCII.A + i));
        }
        instructions.push(...this.printMessage("\r\n"));

        // Special characters demo
        instructions.push(...this.printMessage("Special Characters: "));
        const specialChars = [
            this.ASCII.EXCLAMATION, this.ASCII.AT, this.ASCII.HASH, this.ASCII.DOLLAR,
            this.ASCII.PERCENT, this.ASCII.CARET, this.ASCII.AMPERSAND, this.ASCII.ASTERISK
        ];

        for (const charCode of specialChars) {
            instructions.push(...this.printCharacter(charCode));
            instructions.push(...this.printCharacter(this.ASCII.SPACE));
        }
        instructions.push(...this.printMessage("\r\n"));

        // Time display demo (using GET_TIME system call)
        instructions.push(...this.printMessage("System Time Demo:\r\n"));
        instructions.push(...this.instructionToBytes(this.createInstruction(0x01, 0, 1, 0, this.SYSTEM_CALLS.GET_TIME)));
        instructions.push(...this.instructionToBytes(this.createInstruction(0x05, 0, 0, 0, 0))); // SYSCALL for GET_TIME
        instructions.push(...this.printMessage("Time retrieved and stored in R0\r\n"));

        // Box drawing demo
        instructions.push(...this.printMessage("Box Drawing:\r\n"));
        instructions.push(...this.printMessage("+"));
        for (let i = 0; i < 10; i++) {
            instructions.push(...this.printCharacter(this.ASCII.DASH));
        }
        instructions.push(...this.printMessage("+\r\n"));

        for (let i = 0; i < 3; i++) {
            instructions.push(...this.printCharacter(this.ASCII.PIPE));
            for (let j = 0; j < 10; j++) {
                instructions.push(...this.printCharacter(this.ASCII.SPACE));
            }
            instructions.push(...this.printCharacter(this.ASCII.PIPE));
            instructions.push(...this.printMessage("\r\n"));
        }

        instructions.push(...this.printMessage("+"));
        for (let i = 0; i < 10; i++) {
            instructions.push(...this.printCharacter(this.ASCII.DASH));
        }
        instructions.push(...this.printMessage("+\r\n"));

        // Completion message
        instructions.push(...this.printMessage(this.STRINGS.DEMO_COMPLETE));

        // Goodbye message
        instructions.push(...this.printMessage(this.STRINGS.GOODBYE));

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
                'Character output using PRINT_CHAR',
                'String printing and formatting',
                'Interactive input simulation',
                'Formatted number display',
                'Alphabet and special character printing',
                'System time retrieval',
                'ASCII art and box drawing',
                'Console-based user interface'
            ],
            systemCalls: [
                'PRINT_CHAR: Character output',
                'GET_TIME: System time retrieval',
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
        console.log('I/O OPERATIONS DEMONSTRATED:');
        console.log('- Character output using PRINT_CHAR system call');
        console.log('- String printing with formatting');
        console.log('- Interactive input simulation');
        console.log('- Formatted number and text display');
        console.log('- Special characters and symbols');
        console.log('- System time retrieval');
        console.log('- ASCII art and visual elements');
        console.log();
        console.log('SYSTEM CALLS USED:');
        console.log('- PRINT_CHAR (0x01): Output single character');
        console.log('- GET_TIME (0x05): Retrieve system time');
        console.log('- EXIT (0x03): Terminate program');
        console.log();
        console.log('CHARACTER SET DEMONSTRATED:');
        console.log('- Control characters (newline, carriage return)');
        console.log('- Numeric digits (0-9)');
        console.log('- Alphabetic characters (A-Z, a-z)');
        console.log('- Special symbols and punctuation');
        console.log('- ASCII art elements');
        console.log();
        console.log('PROGRAM FLOW:');
        console.log('1. Display welcome message and menu');
        console.log('2. Demonstrate character output');
        console.log('3. Show string printing capabilities');
        console.log('4. Simulate interactive input');
        console.log('5. Display formatted output');
        console.log('6. Show system time functionality');
        console.log('7. Create visual elements');
        console.log('8. Exit gracefully');
        console.log();
        console.log('REGISTER USAGE:');
        console.log('- R0: System call parameter/character output');
        console.log('- R1: Temporary storage for immediate values');
        console.log();
        console.log('OUTPUT FEATURES:');
        console.log('- Multi-line formatted text');
        console.log('- Number and character sequences');
        console.log('- Visual formatting with spaces and newlines');
        console.log('- Interactive-style prompts');
        console.log('- System information display');
        console.log('='.repeat(60));
    }
}

// Export for use in other modules
module.exports = IODemo;

// Example usage and testing
if (require.main === module) {
    const demo = new IODemo();
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

    // Show some sample output that the program would generate
    console.log('\nSAMPLE PROGRAM OUTPUT:');
    console.log('Welcome to OrionRisc-128 I/O Demo!');
    console.log('===================================');
    console.log();
    console.log('I/O Operations Menu:');
    console.log('1. Character Output Demo');
    console.log('Characters: A B C');
    console.log();
    console.log('2. String Printing Demo');
    console.log('Sample strings:');
    console.log('  Hello, World!');
    console.log('  OrionRisc-128 Rocks!');
    console.log('  ASCII Art: ***');
    console.log();
    console.log('3. Interactive Input Demo');
    console.log('Simulating user input...');
    console.log('Press any key to continue... Read: Y (echoed)');
    console.log();
    console.log('4. Formatted Output Demo');
    console.log('Numbers: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9');
    console.log('Letters: A, B, C, D, E');
    console.log('         F, G, H, I, J');
    console.log('         K, L, M, N, O');
    console.log('         P, Q, R, S, T');
    console.log('         U, V, W, X, Y');
    console.log('         Z');
    console.log();
    console.log('Thank you for using OrionRisc-128!');
}