/**
 * RISC Processor (CPU) for OrionRisc-128
 * 32-bit RISC architecture with 16 general-purpose registers
 * Provides the core instruction execution engine for the emulated system
 */
class RiscProcessor {
    constructor(mmu) {
        // Validate MMU dependency
        if (!mmu) {
            throw new Error('RiscProcessor requires a MemoryManagementUnit instance');
        }

        this.mmu = mmu;

        // Initialize 16 general-purpose registers (R0-R15)
        this.registers = new Array(16).fill(0);

        // Program Counter - points to current instruction address
        this.programCounter = 0x0000;

        // CPU state flags
        this.isRunning = false;
        this.isHalted = false;

        // Instruction set constants
        this.INSTRUCTIONS = {
            NOP: 0x00,    // No operation
            LOAD: 0x01,   // Load from memory to register
            STORE: 0x02,  // Store register to memory
            ADD: 0x03,    // Add two registers
            SUB: 0x04,    // Subtract two registers
            HALT: 0xFF    // Halt execution
        };

        console.log('RISC Processor initialized with 16 registers');
    }

    /**
     * Reset CPU to initial state
     */
    reset() {
        // Clear all registers
        this.registers.fill(0);

        // Reset program counter
        this.programCounter = 0x0000;

        // Reset CPU state
        this.isRunning = false;
        this.isHalted = false;

        console.log('RISC Processor reset to initial state');
    }

    /**
     * Get register value by index
     * @param {number} index - Register index (0-15)
     * @returns {number} Register value
     */
    getRegister(index) {
        this.validateRegisterIndex(index);
        return this.registers[index];
    }

    /**
     * Set register value by index
     * @param {number} index - Register index (0-15)
     * @param {number} value - Value to set (32-bit)
     */
    setRegister(index, value) {
        this.validateRegisterIndex(index);
        this.validateRegisterValue(value);
        this.registers[index] = value;
    }

    /**
     * Get current program counter value
     * @returns {number} Current PC value
     */
    getProgramCounter() {
        return this.programCounter;
    }

    /**
     * Set program counter to specific address
     * @param {number} address - Memory address to set PC to
     */
    setProgramCounter(address) {
        this.validateAddress(address);
        this.programCounter = address;
    }

    /**
     * Execute a single instruction
     * @param {number} instruction - 32-bit instruction to execute
     * @returns {boolean} True if execution should continue, false if halted
     */
    execute(instruction) {
        if (this.isHalted) {
            return false;
        }

        try {
            // Extract instruction components (32-bit instruction format)
            // Bits 31-24: opcode (8 bits)
            // Bits 23-20: reg1 (4 bits)
            // Bits 19-16: reg2 (4 bits)
            // Bits 15-0: immediate (16 bits)
            const opcode = (instruction >> 24) & 0xFF;
            const reg1 = (instruction >> 20) & 0x0F;
            const reg2 = (instruction >> 16) & 0x0F;
            const immediate = instruction & 0xFFFF;

            switch (opcode) {
                case this.INSTRUCTIONS.NOP:
                    // No operation - do nothing
                    break;

                case this.INSTRUCTIONS.LOAD:
                    // LOAD reg1, [reg2 + immediate]
                    this.validateRegisterIndex(reg1);
                    this.validateRegisterIndex(reg2);
                    const loadAddress = (this.registers[reg2] + immediate) & 0xFFFF;
                    this.registers[reg1] = this.mmu.readWord(loadAddress);
                    break;

                case this.INSTRUCTIONS.STORE:
                    // STORE reg1, [reg2 + immediate]
                    this.validateRegisterIndex(reg1);
                    this.validateRegisterIndex(reg2);
                    const storeAddress = (this.registers[reg2] + immediate) & 0xFFFF;
                    this.mmu.writeWord(storeAddress, this.registers[reg1]);
                    break;

                case this.INSTRUCTIONS.ADD:
                    // ADD reg1, reg2
                    this.validateRegisterIndex(reg1);
                    this.validateRegisterIndex(reg2);
                    this.registers[reg1] = (this.registers[reg1] + this.registers[reg2]) & 0xFFFFFFFF;
                    break;

                case this.INSTRUCTIONS.SUB:
                    // SUB reg1, reg2
                    this.validateRegisterIndex(reg1);
                    this.validateRegisterIndex(reg2);
                    this.registers[reg1] = (this.registers[reg1] - this.registers[reg2]) & 0xFFFFFFFF;
                    break;

                case this.INSTRUCTIONS.HALT:
                    // Halt execution
                    this.isHalted = true;
                    this.isRunning = false;
                    console.log('CPU halted by HALT instruction');
                    return false;

                default:
                    throw new Error(`Unknown instruction opcode: 0x${opcode.toString(16)}`);
            }

            return true;

        } catch (error) {
            console.error(`Error executing instruction 0x${instruction.toString(16)}:`, error.message);
            this.isHalted = true;
            this.isRunning = false;
            return false;
        }
    }

    /**
     * Execute single instruction and advance program counter
     * @returns {boolean} True if execution should continue, false if halted
     */
    step() {
        if (this.isHalted) {
            return false;
        }

        try {
            // Fetch instruction from memory
            const instruction = this.mmu.readWord(this.programCounter);

            // Execute instruction
            const shouldContinue = this.execute(instruction);

            // Advance program counter (next instruction is 4 bytes ahead)
            if (shouldContinue && !this.isHalted) {
                this.programCounter = (this.programCounter + 4) & 0xFFFF;
            }

            return shouldContinue;

        } catch (error) {
            console.error(`Error in step execution at PC 0x${this.programCounter.toString(16)}:`, error.message);
            this.isHalted = true;
            this.isRunning = false;
            return false;
        }
    }

    /**
     * Execute instructions continuously until halt
     * @param {number} maxSteps - Maximum number of steps to execute (optional)
     * @returns {number} Number of instructions executed
     */
    run(maxSteps = 1000000) {
        this.isRunning = true;
        let stepsExecuted = 0;

        console.log(`Starting CPU execution from PC 0x${this.programCounter.toString(16)}`);

        while (this.isRunning && !this.isHalted && stepsExecuted < maxSteps) {
            if (!this.step()) {
                break;
            }
            stepsExecuted++;
        }

        this.isRunning = false;

        if (this.isHalted) {
            console.log(`CPU execution halted after ${stepsExecuted} instructions`);
        } else if (stepsExecuted >= maxSteps) {
            console.log(`CPU execution stopped after ${stepsExecuted} instructions (max steps reached)`);
        }

        return stepsExecuted;
    }

    /**
     * Get current CPU state information
     * @returns {Object} CPU state object
     */
    getState() {
        return {
            programCounter: this.programCounter,
            registers: [...this.registers],
            isRunning: this.isRunning,
            isHalted: this.isHalted,
            instructionSet: { ...this.INSTRUCTIONS }
        };
    }

    /**
     * Validate register index
     * @param {number} index - Register index to validate
     * @throws {Error} If index is invalid
     */
    validateRegisterIndex(index) {
        if (typeof index !== 'number' || isNaN(index)) {
            throw new Error(`Invalid register index: ${index}. Must be a number.`);
        }

        if (index < 0 || index > 15) {
            throw new Error(`Register index out of range: ${index}. Valid range: 0-15`);
        }
    }

    /**
     * Validate register value
     * @param {number} value - Value to validate
     * @throws {Error} If value is invalid
     */
    validateRegisterValue(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(`Invalid register value: ${value}. Must be a number.`);
        }

        if (value < 0 || value > 0xFFFFFFFF) {
            throw new Error(`Register value out of range: ${value}. Valid range: 0-0xFFFFFFFF`);
        }
    }

    /**
     * Validate memory address
     * @param {number} address - Address to validate
     * @throws {Error} If address is invalid
     */
    validateAddress(address) {
        if (typeof address !== 'number' || isNaN(address)) {
            throw new Error(`Invalid address: ${address}. Must be a number.`);
        }

        if (address < 0 || address > 0xFFFF) {
            throw new Error(`Address out of range: 0x${address.toString(16)}. Valid range: 0x0000-0xFFFF`);
        }
    }

    /**
     * Load a program into memory and set PC
     * @param {Array} program - Array of 32-bit instructions
     * @param {number} startAddress - Starting memory address (default: 0x0000)
     */
    loadProgram(program, startAddress = 0x0000) {
        if (!Array.isArray(program)) {
            throw new Error('Program must be an array of instructions');
        }

        // Convert instructions to bytes for MMU loading
        const byteData = [];
        for (let i = 0; i < program.length; i++) {
            const instruction = program[i];
            if (typeof instruction !== 'number' || isNaN(instruction)) {
                throw new Error(`Invalid instruction at index ${i}: ${instruction}`);
            }

            // Split 32-bit instruction into 4 bytes (little-endian)
            byteData.push((instruction >> 0) & 0xFF);
            byteData.push((instruction >> 8) & 0xFF);
            byteData.push((instruction >> 16) & 0xFF);
            byteData.push((instruction >> 24) & 0xFF);
        }

        // Load program into memory
        this.mmu.loadMemory(startAddress, byteData);

        // Set program counter to start address
        this.setProgramCounter(startAddress);

        console.log(`Loaded program with ${program.length} instructions at 0x${startAddress.toString(16)}`);
    }
}

module.exports = RiscProcessor;