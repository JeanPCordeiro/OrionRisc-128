/**
 * OrionRisc-128 Processor Emulation
 *
 * Implements the custom 16-bit RISC processor as defined in docs/isa.md
 * This is the core component of the hardware emulation layer.
 */

class Processor {
    constructor(memory) {
        this.memory = memory;

        // Registers: 8 general-purpose 16-bit registers
        this.registers = new Uint16Array(8); // R0-R7

        // Special registers
        this.pc = 0;          // Program Counter
        this.ir = 0;          // Instruction Register
        this.flags = {        // Status flags
            carry: false,
            overflow: false,
            zero: false,
            negative: false
        };

        // Execution state
        this.halted = false;
        this.cycles = 0;

        // Opcode constants
        this.OPCODES = {
            // Arithmetic operations
            ADD: 0x00, SUB: 0x01, MUL: 0x02, DIV: 0x03,
            // Logical operations
            AND: 0x04, OR: 0x05, XOR: 0x06, NOT: 0x07,
            // Memory operations
            LD: 0x08, ST: 0x09, LDI: 0x0A, LDA: 0x0B,
            // Control flow
            JMP: 0x0C, JZ: 0x0D, JNZ: 0x0E, CALL: 0x0F,
            // I/O operations
            IN: 0x10, OUT: 0x11, HALT: 0x12, NOP: 0x13
        };

        // Device addresses for I/O operations
        this.DEVICES = {
            KEYBOARD: 0x00,
            TIMER: 0x01,
            RANDOM: 0x02,
            CONSOLE: 0x00,
            GRAPHICS: 0x01,
            DISK: 0x02
        };
    }

    /**
     * Reset the processor to initial state
     */
    reset() {
        this.registers.fill(0);
        this.pc = 0;
        this.ir = 0;
        this.flags = { carry: false, overflow: false, zero: false, negative: false };
        this.halted = false;
        this.cycles = 0;
    }

    /**
     * Execute one instruction cycle (fetch, decode, execute)
     */
    step() {
        if (this.halted) {
            return false;
        }

        // Fetch instruction
        this.ir = this.memory.readWord(this.pc);
        this.pc += 2; // 16-bit instructions
        this.cycles++;

        // Decode and execute
        return this.executeInstruction(this.ir);
    }

    /**
     * Execute a single instruction
     * @param {number} instruction - 16-bit instruction word
     * @returns {boolean} true if execution should continue
     */
    executeInstruction(instruction) {
        const opcode = (instruction >> 12) & 0xF; // Bits 15-12
        const rd = (instruction >> 9) & 0x7;     // Bits 11-9 (destination register)
        const rs = (instruction >> 6) & 0x7;     // Bits 8-6 (source register)
        const imm = instruction & 0x3F;          // Bits 5-0 (immediate value)

        switch (opcode) {
            case this.OPCODES.ADD:
                this.executeAdd(rd, rs, imm);
                break;

            case this.OPCODES.SUB:
                this.executeSub(rd, rs, imm);
                break;

            case this.OPCODES.MUL:
                this.executeMul(rd, rs, imm);
                break;

            case this.OPCODES.DIV:
                this.executeDiv(rd, rs, imm);
                break;

            case this.OPCODES.AND:
                this.executeAnd(rd, rs, imm);
                break;

            case this.OPCODES.OR:
                this.executeOr(rd, rs, imm);
                break;

            case this.OPCODES.XOR:
                this.executeXor(rd, rs, imm);
                break;

            case this.OPCODES.NOT:
                this.executeNot(rd, rs);
                break;

            case this.OPCODES.LD:
                this.executeLoad(rd, rs, imm);
                break;

            case this.OPCODES.ST:
                this.executeStore(rd, rs, imm);
                break;

            case this.OPCODES.LDI:
                this.executeLoadImmediate(rd, imm);
                break;

            case this.OPCODES.LDA:
                this.executeLoadAddress(rd, imm);
                break;

            case this.OPCODES.JMP:
                this.executeJump(imm);
                break;

            case this.OPCODES.JZ:
                this.executeJumpZero(rd, imm);
                break;

            case this.OPCODES.JNZ:
                this.executeJumpNotZero(rd, imm);
                break;

            case this.OPCODES.CALL:
                this.executeCall(rd);
                break;

            case this.OPCODES.IN:
                this.executeInput(rd, imm);
                break;

            case this.OPCODES.OUT:
                this.executeOutput(imm, rs);
                break;

            case this.OPCODES.HALT:
                this.executeHalt();
                return false; // Stop execution

            case this.OPCODES.NOP:
                // No operation
                break;

            default:
                throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
        }

        return true; // Continue execution
    }

    /**
     * Arithmetic Operations
     */

    executeAdd(rd, rs, imm) {
        const rsVal = this.registers[rs];
        const result = rsVal + imm;

        this.registers[rd] = result & 0xFFFF;
        this.updateFlags(result);
    }

    executeSub(rd, rs, imm) {
        const rsVal = this.registers[rs];
        const result = rsVal - imm;

        this.registers[rd] = result & 0xFFFF;
        this.updateFlags(result);
    }

    executeMul(rd, rs, imm) {
        const rsVal = this.registers[rs];
        const result = rsVal * imm;

        this.registers[rd] = result & 0xFFFF;
        this.flags.overflow = (result > 0xFFFF) || (result < -0x8000);
        this.flags.zero = (result & 0xFFFF) === 0;
        this.flags.negative = (result & 0x8000) !== 0;
    }

    executeDiv(rd, rs, imm) {
        if (imm === 0) {
            throw new Error('Division by zero');
        }

        const rsVal = this.registers[rs];
        const result = Math.floor(rsVal / imm);

        this.registers[rd] = result & 0xFFFF;
        this.updateFlags(result);
    }

    /**
     * Logical Operations
     */

    executeAnd(rd, rs, imm) {
        const rsVal = this.registers[rs];
        const result = rsVal & imm;

        this.registers[rd] = result;
        this.updateFlags(result);
    }

    executeOr(rd, rs, imm) {
        const rsVal = this.registers[rs];
        const result = rsVal | imm;

        this.registers[rd] = result;
        this.updateFlags(result);
    }

    executeXor(rd, rs, imm) {
        const rsVal = this.registers[rs];
        const result = rsVal ^ imm;

        this.registers[rd] = result;
        this.updateFlags(result);
    }

    executeNot(rd, rs) {
        const rsVal = this.registers[rs];
        const result = ~rsVal & 0xFFFF;

        this.registers[rd] = result;
        this.updateFlags(result);
    }

    /**
     * Memory Operations
     */

    executeLoad(rd, rs, imm) {
        const address = (this.registers[rs] + imm) & 0x1FFFF; // 128KB address space
        this.registers[rd] = this.memory.readWord(address);
    }

    executeStore(rd, rs, imm) {
        const address = (this.registers[rd] + imm) & 0x1FFFF;
        this.memory.writeWord(address, this.registers[rs]);
    }

    executeLoadImmediate(rd, imm) {
        // Sign-extend the 6-bit immediate value
        const signedImm = (imm & 0x20) ? (imm | 0xFFC0) : (imm & 0x3F);
        this.registers[rd] = signedImm;
        this.updateFlags(signedImm);
    }

    executeLoadAddress(rd, imm) {
        // Zero-extend the 6-bit immediate value to 16 bits
        this.registers[rd] = imm & 0x3F;
    }

    /**
     * Control Flow Operations
     */

    executeJump(imm) {
        this.pc = imm;
    }

    executeJumpZero(rd, imm) {
        if (this.flags.zero) {
            this.pc = imm;
        }
    }

    executeJumpNotZero(rd, imm) {
        if (!this.flags.zero) {
            this.pc = imm;
        }
    }

    executeCall(rd) {
        // Save return address in R3
        this.registers[3] = this.pc;
        // Jump to address in Rd
        this.pc = this.registers[rd];
    }

    /**
     * I/O Operations
     */

    executeInput(rd, device) {
        let value = 0;

        switch (device) {
            case this.DEVICES.KEYBOARD:
                // For now, return 0 (no input)
                // In a full implementation, this would interface with keyboard input
                value = 0;
                break;

            case this.DEVICES.TIMER:
                value = this.cycles & 0xFFFF;
                break;

            case this.DEVICES.RANDOM:
                value = Math.floor(Math.random() * 0x10000);
                break;

            default:
                throw new Error(`Unknown input device: ${device}`);
        }

        this.registers[rd] = value;
    }

    executeOutput(device, rs) {
        const value = this.registers[rs];

        switch (device) {
            case this.DEVICES.CONSOLE:
                // For now, just log to console
                // In a full implementation, this would interface with a console output
                console.log(`Console output: ${value}`);
                break;

            case this.DEVICES.GRAPHICS:
                // Graphics output will be handled by graphics subsystem
                break;

            case this.DEVICES.DISK:
                // Disk output will be handled by storage subsystem
                break;

            default:
                throw new Error(`Unknown output device: ${device}`);
        }
    }

    executeHalt() {
        this.halted = true;
    }

    /**
     * Update status flags based on result
     * @param {number} result - 16-bit result value
     */
    updateFlags(result) {
        this.flags.carry = (result > 0xFFFF) || (result < 0);
        this.flags.overflow = (result > 0x7FFF) || (result < -0x8000);
        this.flags.zero = (result & 0xFFFF) === 0;
        this.flags.negative = (result & 0x8000) !== 0;
    }

    /**
     * Load a program into memory starting at address 0
     * @param {Uint16Array} program - Array of 16-bit instructions
     */
    loadProgram(program) {
        for (let i = 0; i < program.length; i++) {
            this.memory.writeWord(i * 2, program[i]);
        }
        this.pc = 0;
    }

    /**
     * Get current processor state for debugging
     */
    getState() {
        return {
            registers: Array.from(this.registers),
            pc: this.pc,
            ir: this.ir,
            flags: {...this.flags},
            halted: this.halted,
            cycles: this.cycles
        };
    }

    /**
     * Set register value for debugging/testing
     * @param {number} reg - Register number (0-7)
     * @param {number} value - 16-bit value
     */
    setRegister(reg, value) {
        if (reg >= 0 && reg < 8) {
            this.registers[reg] = value & 0xFFFF;
        }
    }

    /**
     * Get register value for debugging/testing
     * @param {number} reg - Register number (0-7)
     * @returns {number} 16-bit register value
     */
    getRegister(reg) {
        if (reg >= 0 && reg < 8) {
            return this.registers[reg];
        }
        return 0;
    }
}

module.exports = Processor;