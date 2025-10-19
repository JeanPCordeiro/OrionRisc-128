/**
 * OrionRisc-128 Development Tools
 *
 * Collection of utilities for developing software for the OrionRisc-128 system.
 * Includes assembler, debugger, test utilities, and development helpers.
 */

class Assembler {
    constructor() {
        this.symbols = new Map();
        this.instructions = [];
        this.currentAddress = 0;
        this.labels = new Map();
        this.currentSection = '.text';
    }

    /**
     * Assemble assembly code into machine code
     * @param {string} source - Assembly source code
     * @returns {Uint16Array} Machine code
     */
    assemble(source) {
        this.reset();

        // First pass: collect symbols and labels
        this.firstPass(source);

        // Second pass: generate machine code
        this.secondPass(source);

        return new Uint16Array(this.instructions);
    }

    reset() {
        this.symbols.clear();
        this.instructions = [];
        this.currentAddress = 0;
        this.labels.clear();
        this.currentSection = '.text';
    }

    firstPass(source) {
        const lines = source.split('\n');
        let lineNumber = 0;

        for (const line of lines) {
            lineNumber++;
            const cleanLine = this.cleanLine(line);

            if (!cleanLine || this.isComment(cleanLine)) {
                continue;
            }

            if (this.isLabel(cleanLine)) {
                const label = cleanLine.replace(':', '');
                this.labels.set(label, this.currentAddress);
            } else if (this.isDirective(cleanLine)) {
                this.handleDirective(cleanLine, lineNumber);
            } else if (this.isInstruction(cleanLine)) {
                this.currentAddress += 2; // Each instruction is 2 bytes
            }
        }
    }

    secondPass(source) {
        const lines = source.split('\n');
        let lineNumber = 0;

        for (const line of lines) {
            lineNumber++;
            const cleanLine = this.cleanLine(line);

            if (!cleanLine || this.isComment(cleanLine) || this.isLabel(cleanLine)) {
                continue;
            }

            if (this.isDirective(cleanLine)) {
                this.handleDirective(cleanLine, lineNumber, true);
            } else if (this.isInstruction(cleanLine)) {
                const instruction = this.assembleInstruction(cleanLine, lineNumber);
                if (instruction !== null) {
                    this.instructions.push(instruction);
                }
            }
        }
    }

    cleanLine(line) {
        return line.trim().replace(/\s+/g, ' ');
    }

    isComment(line) {
        return line.startsWith(';') || line.startsWith('//');
    }

    isLabel(line) {
        return line.includes(':') && !line.includes(' ');
    }

    isDirective(line) {
        return line.startsWith('.');
    }

    isInstruction(line) {
        const parts = line.split(' ');
        const mnemonic = parts[0].toUpperCase();

        return ['ADD', 'SUB', 'MUL', 'DIV', 'AND', 'OR', 'XOR', 'NOT',
                'LD', 'ST', 'LDI', 'LDA', 'JMP', 'JZ', 'JNZ', 'CALL',
                'IN', 'OUT', 'HALT', 'NOP'].includes(mnemonic);
    }

    handleDirective(line, lineNumber, secondPass = false) {
        const parts = line.split(' ');
        const directive = parts[0].substring(1); // Remove the dot

        switch (directive) {
            case 'org':
                if (secondPass) {
                    this.currentAddress = parseInt(parts[1], 16);
                }
                break;

            case 'word':
                if (secondPass) {
                    const value = this.parseValue(parts[1]);
                    this.instructions.push(value);
                } else {
                    this.currentAddress += 2;
                }
                break;

            case 'byte':
                if (secondPass) {
                    const value = this.parseValue(parts[1]);
                    // Store as word with byte in low position
                    this.instructions.push(value & 0xFF);
                } else {
                    this.currentAddress += 2;
                }
                break;

            case 'text':
                this.currentSection = '.text';
                break;

            case 'data':
                this.currentSection = '.data';
                break;

            default:
                throw new Error(`Unknown directive .${directive} at line ${lineNumber}`);
        }
    }

    assembleInstruction(line, lineNumber) {
        const parts = line.split(' ');
        const mnemonic = parts[0].toUpperCase();

        // Parse operands
        let operands = [];
        if (parts.length > 1) {
            operands = parts[1].split(',').map(op => op.trim());
        }

        const opcodeMap = {
            'ADD': 0x00, 'SUB': 0x01, 'MUL': 0x02, 'DIV': 0x03,
            'AND': 0x04, 'OR': 0x05, 'XOR': 0x06, 'NOT': 0x07,
            'LD': 0x08, 'ST': 0x09, 'LDI': 0x0A, 'LDA': 0x0B,
            'JMP': 0x0C, 'JZ': 0x0D, 'JNZ': 0x0E, 'CALL': 0x0F,
            'IN': 0x10, 'OUT': 0x11, 'HALT': 0x12, 'NOP': 0x13
        };

        const opcode = opcodeMap[mnemonic];
        if (opcode === undefined) {
            throw new Error(`Unknown instruction ${mnemonic} at line ${lineNumber}`);
        }

        let instruction = opcode << 12; // Opcode in bits 15-12

        switch (mnemonic) {
            case 'ADD': case 'SUB': case 'MUL': case 'DIV':
            case 'AND': case 'OR': case 'XOR':
                // Format: opcode rd, rs, imm
                const rd = this.parseRegister(operands[0]);
                const rs = this.parseRegister(operands[1]);
                const imm = this.parseValue(operands[2]);
                instruction |= (rd << 9) | (rs << 6) | (imm & 0x3F);
                break;

            case 'NOT':
                // Format: opcode rd, rs
                const rdNot = this.parseRegister(operands[0]);
                const rsNot = this.parseRegister(operands[1]);
                instruction |= (rdNot << 9) | (rsNot << 6);
                break;

            case 'LD':
                // Format: opcode rd, [rs+imm]
                const rdLd = this.parseRegister(operands[0]);
                const rsLd = this.parseRegister(operands[1]);
                const immLd = this.parseValue(operands[2]);
                instruction |= (rdLd << 9) | (rsLd << 6) | (immLd & 0x3F);
                break;

            case 'ST':
                // Format: opcode [rd+imm], rs
                const rdSt = this.parseRegister(operands[0]);
                const rsSt = this.parseRegister(operands[1]);
                const immSt = this.parseValue(operands[2]);
                instruction |= (rdSt << 9) | (rsSt << 6) | (immSt & 0x3F);
                break;

            case 'LDI': case 'LDA':
                // Format: opcode rd, imm
                const rdImm = this.parseRegister(operands[0]);
                const immVal = this.parseValue(operands[1]);
                instruction |= (rdImm << 9) | (immVal & 0x3F);
                break;

            case 'JMP': case 'JZ': case 'JNZ':
                // Format: opcode rd, imm
                const rdJmp = this.parseRegister(operands[0]);
                const immJmp = this.parseValue(operands[1]);
                instruction |= (rdJmp << 9) | (immJmp & 0x3F);
                break;

            case 'CALL':
                // Format: opcode rd
                const rdCall = this.parseRegister(operands[0]);
                instruction |= (rdCall << 9);
                break;

            case 'IN':
                // Format: opcode rd, imm
                const rdIn = this.parseRegister(operands[0]);
                const immIn = this.parseValue(operands[1]);
                instruction |= (rdIn << 9) | (immIn & 0x3F);
                break;

            case 'OUT':
                // Format: opcode imm, rs
                const immOut = this.parseValue(operands[0]);
                const rsOut = this.parseRegister(operands[1]);
                instruction |= (rsOut << 9) | (immOut & 0x3F);
                break;

            case 'HALT': case 'NOP':
                // No operands
                break;

            default:
                throw new Error(`Unhandled instruction ${mnemonic} at line ${lineNumber}`);
        }

        return instruction;
    }

    parseRegister(operand) {
        if (operand.startsWith('R') || operand.startsWith('r')) {
            const regNum = parseInt(operand.substring(1));
            if (regNum >= 0 && regNum < 8) {
                return regNum;
            }
        }
        throw new Error(`Invalid register: ${operand}`);
    }

    parseValue(value) {
        if (value.startsWith('0x') || value.startsWith('0X')) {
            return parseInt(value, 16);
        } else if (value.startsWith('0b') || value.startsWith('0B')) {
            return parseInt(value.substring(2), 2);
        } else if (!isNaN(value)) {
            return parseInt(value, 10);
        } else if (this.labels.has(value)) {
            return this.labels.get(value);
        } else {
            throw new Error(`Invalid value: ${value}`);
        }
    }
}

class Debugger {
    constructor(processor, memory) {
        this.processor = processor;
        this.memory = memory;
        this.breakpoints = new Set();
        this.watchpoints = new Set();
        this.instructionHistory = [];
        this.maxHistoryLength = 1000;
    }

    /**
     * Add a breakpoint at address
     * @param {number} address - Address to break at
     */
    addBreakpoint(address) {
        this.breakpoints.add(address);
    }

    /**
     * Remove a breakpoint
     * @param {number} address - Address to remove breakpoint from
     */
    removeBreakpoint(address) {
        this.breakpoints.delete(address);
    }

    /**
     * Check if address is a breakpoint
     * @param {number} address - Address to check
     * @returns {boolean} True if breakpoint exists
     */
    isBreakpoint(address) {
        return this.breakpoints.has(address);
    }

    /**
     * Add a watchpoint for memory address
     * @param {number} address - Address to watch
     */
    addWatchpoint(address) {
        this.watchpoints.add(address);
    }

    /**
     * Remove a watchpoint
     * @param {number} address - Address to remove watchpoint from
     */
    removeWatchpoint(address) {
        this.watchpoints.delete(address);
    }

    /**
     * Step through execution with debugging
     * @returns {object} Debug information
     */
    stepDebug() {
        const stateBefore = this.processor.getState();
        const pc = stateBefore.pc;

        // Check breakpoint
        if (this.isBreakpoint(pc)) {
            return {
                type: 'breakpoint',
                address: pc,
                state: stateBefore
            };
        }

        // Execute instruction
        const success = this.processor.step();

        if (!success) {
            return {
                type: 'halted',
                state: this.processor.getState()
            };
        }

        const stateAfter = this.processor.getState();

        // Add to history
        this.addToHistory({
            pc: pc,
            instruction: stateBefore.ir,
            stateBefore: stateBefore,
            stateAfter: stateAfter
        });

        // Check watchpoints
        for (const watchpoint of this.watchpoints) {
            const valueBefore = this.memory.readWord(watchpoint);
            const valueAfter = this.memory.readWord(watchpoint);

            if (valueBefore !== valueAfter) {
                return {
                    type: 'watchpoint',
                    address: watchpoint,
                    valueBefore: valueBefore,
                    valueAfter: valueAfter,
                    state: stateAfter
                };
            }
        }

        return {
            type: 'step',
            state: stateAfter
        };
    }

    addToHistory(entry) {
        this.instructionHistory.unshift(entry);

        if (this.instructionHistory.length > this.maxHistoryLength) {
            this.instructionHistory = this.instructionHistory.slice(0, this.maxHistoryLength);
        }
    }

    /**
     * Get execution history
     * @param {number} count - Number of entries to return
     * @returns {Array} History entries
     */
    getHistory(count = 50) {
        return this.instructionHistory.slice(0, count);
    }

    /**
     * Disassemble instruction
     * @param {number} instruction - 16-bit instruction
     * @returns {string} Disassembled instruction
     */
    disassemble(instruction) {
        const opcode = (instruction >> 12) & 0xF;
        const rd = (instruction >> 9) & 0x7;
        const rs = (instruction >> 6) & 0x7;
        const imm = instruction & 0x3F;

        const opcodeNames = {
            0x00: 'ADD', 0x01: 'SUB', 0x02: 'MUL', 0x03: 'DIV',
            0x04: 'AND', 0x05: 'OR', 0x06: 'XOR', 0x07: 'NOT',
            0x08: 'LD', 0x09: 'ST', 0x0A: 'LDI', 0x0B: 'LDA',
            0x0C: 'JMP', 0x0D: 'JZ', 0x0E: 'JNZ', 0x0F: 'CALL',
            0x10: 'IN', 0x11: 'OUT', 0x12: 'HALT', 0x13: 'NOP'
        };

        const mnemonic = opcodeNames[opcode] || 'UNKNOWN';

        switch (opcode) {
            case 0x00: case 0x01: case 0x02: case 0x03:
            case 0x04: case 0x05: case 0x06:
                return `${mnemonic} R${rd}, R${rs}, ${imm}`;

            case 0x07: // NOT
                return `${mnemonic} R${rd}, R${rs}`;

            case 0x08: // LD
                return `${mnemonic} R${rd}, [R${rs}+${imm}]`;

            case 0x09: // ST
                return `${mnemonic} [R${rd}+${imm}], R${rs}`;

            case 0x0A: case 0x0B: // LDI, LDA
                return `${mnemonic} R${rd}, ${imm}`;

            case 0x0C: case 0x0D: case 0x0E: // JMP, JZ, JNZ
                return `${mnemonic} R${rd}, ${imm}`;

            case 0x0F: // CALL
                return `${mnemonic} R${rd}`;

            case 0x10: // IN
                return `${mnemonic} R${rd}, ${imm}`;

            case 0x11: // OUT
                return `${mnemonic} ${imm}, R${rs}`;

            case 0x12: case 0x13: // HALT, NOP
                return mnemonic;

            default:
                return `UNKNOWN 0x${instruction.toString(16)}`;
        }
    }

    /**
     * Get memory dump with disassembly
     * @param {number} start - Start address
     * @param {number} length - Length in bytes
     * @returns {Array} Array of {address, data, disassembly}
     */
    getMemoryDump(start = 0, length = 256) {
        const result = [];

        for (let i = 0; i < length; i += 2) {
            const address = start + i;

            if (address >= 0x20000) break; // End of memory

            const word = this.memory.readWord(address);
            const disassembly = this.disassemble(word);

            result.push({
                address: address,
                data: `0x${word.toString(16).padStart(4, '0')}`,
                disassembly: disassembly
            });
        }

        return result;
    }

    /**
     * Export debug session data
     * @returns {object} Debug session data
     */
    exportSession() {
        return {
            breakpoints: Array.from(this.breakpoints),
            watchpoints: Array.from(this.watchpoints),
            history: this.instructionHistory.slice(0, 100), // Last 100 instructions
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Import debug session data
     * @param {object} data - Debug session data
     */
    importSession(data) {
        if (data.breakpoints) {
            this.breakpoints.clear();
            data.breakpoints.forEach(addr => this.breakpoints.add(addr));
        }

        if (data.watchpoints) {
            this.watchpoints.clear();
            data.watchpoints.forEach(addr => this.watchpoints.add(addr));
        }
    }
}

class TestFramework {
    constructor(processor, memory) {
        this.processor = processor;
        this.memory = memory;
        this.tests = [];
        this.results = [];
    }

    /**
     * Add a test case
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function
     */
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Run all tests
     * @returns {object} Test results
     */
    runAllTests() {
        this.results = [];

        for (const test of this.tests) {
            try {
                const result = this.runTest(test);
                this.results.push(result);
            } catch (error) {
                this.results.push({
                    name: test.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        return this.getSummary();
    }

    /**
     * Run a single test
     * @param {object} test - Test object
     * @returns {object} Test result
     */
    runTest(test) {
        // Reset processor and memory
        this.processor.reset();
        this.memory.clear();

        // Run test
        const startTime = performance.now();
        test.testFunction.call(this);
        const endTime = performance.now();

        return {
            name: test.name,
            passed: true,
            executionTime: endTime - startTime
        };
    }

    /**
     * Get test summary
     * @returns {object} Test summary
     */
    getSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.passed).length;
        const failed = total - passed;

        return {
            total,
            passed,
            failed,
            results: this.results,
            successRate: (passed / total) * 100
        };
    }

    /**
     * Assert that two values are equal
     * @param {any} actual - Actual value
     * @param {any} expected - Expected value
     * @param {string} message - Error message
     */
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${actual} !== ${expected}${message ? ': ' + message : ''}`);
        }
    }

    /**
     * Assert that value is true
     * @param {boolean} value - Value to test
     * @param {string} message - Error message
     */
    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`Assertion failed: expected true${message ? ': ' + message : ''}`);
        }
    }

    /**
     * Assert that value is false
     * @param {boolean} value - Value to test
     * @param {string} message - Error message
     */
    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`Assertion failed: expected false${message ? ': ' + message : ''}`);
        }
    }
}

class DevelopmentTools {
    constructor() {
        this.assembler = new Assembler();
        this.debugger = null; // Will be set when processor is available
        this.testFramework = null; // Will be set when processor is available
    }

    /**
     * Initialize with hardware components
     * @param {Processor} processor - Processor instance
     * @param {Memory} memory - Memory instance
     */
    initialize(processor, memory) {
        this.debugger = new Debugger(processor, memory);
        this.testFramework = new TestFramework(processor, memory);
    }

    /**
     * Assemble assembly code
     * @param {string} source - Assembly source code
     * @returns {Uint16Array} Machine code
     */
    assemble(source) {
        return this.assembler.assemble(source);
    }

    /**
     * Load and run assembly program
     * @param {string} source - Assembly source code
     * @param {Processor} processor - Processor instance
     * @param {Memory} memory - Memory instance
     */
    loadAndRun(source, processor, memory) {
        const machineCode = this.assemble(source);

        if (machineCode.length > 0) {
            memory.loadProgram(machineCode);
            processor.reset();
            processor.pc = 0;
        }

        return machineCode;
    }

    /**
     * Create a simple test program
     * @param {string} testName - Name of the test
     * @returns {string} Assembly code for the test
     */
    createTestProgram(testName) {
        switch (testName) {
            case 'arithmetic':
                return `
                    ; Arithmetic test program
                    .org 0x0000

                    LDI R1, 10      ; R1 = 10
                    LDI R2, 20      ; R2 = 20
                    ADD R3, R1, 5   ; R3 = R1 + 5 = 15
                    SUB R4, R2, 3   ; R4 = R2 - 3 = 17
                    MUL R5, R1, 3   ; R5 = R1 * 3 = 30
                    HALT
                `;

            case 'memory':
                return `
                    ; Memory test program
                    .org 0x0000

                    LDI R1, 0x42    ; Value to store
                    ST [R0+0x100], R1 ; Store at address 0x100
                    LD R2, [R0+0x100] ; Load from address 0x100
                    HALT
                `;

            case 'control_flow':
                return `
                    ; Control flow test program
                    .org 0x0000

                    LDI R1, 0       ; Counter
                    LDI R2, 5       ; Loop count

                loop:
                    ADD R1, R1, 1   ; Increment counter
                    JZ R1, end      ; Jump if counter == 5
                    JMP loop        ; Repeat loop

                end:
                    HALT
                `;

            default:
                return `;
                    ; Default test program
                    .org 0x0000

                    LDI R1, 42      ; Load 42 into R1
                    LDI R2, 24      ; Load 24 into R2
                    ADD R3, R1, R2  ; R3 = R1 + R2 = 66
                    HALT
                `;
        }
    }

    /**
     * Generate memory initialization file
     * @param {Array} data - Array of words to initialize memory with
     * @returns {string} Memory initialization code
     */
    generateMemoryInit(data) {
        let code = '; Memory initialization\n';
        code += '.org 0x0000\n\n';

        for (let i = 0; i < data.length; i++) {
            code += `    .word 0x${data[i].toString(16).padStart(4, '0')}  ; Address 0x${(i*2).toString(16).padStart(4, '0')}\n`;
        }

        return code;
    }

    /**
     * Create a bootable disk image
     * @param {Uint16Array} program - Program to put on disk
     * @returns {Uint8Array} Disk image
     */
    createBootableDisk(program) {
        // Create a simple FAT12 disk image
        const diskSize = 360 * 1024; // 360KB
        const disk = new Uint8Array(diskSize);

        // Write boot sector
        this.writeBootSector(disk);

        // Write FAT
        this.writeFAT(disk);

        // Write root directory
        this.writeRootDirectory(disk);

        // Write program to data area
        this.writeProgramToDisk(disk, program);

        return disk;
    }

    writeBootSector(disk) {
        // Simplified boot sector
        const bootSector = new Uint8Array(512);

        // Jump instruction
        bootSector[0] = 0xEB;
        bootSector[1] = 0x3C;
        bootSector[2] = 0x90;

        // OEM name
        const oemName = 'ORION128';
        for (let i = 0; i < oemName.length; i++) {
            bootSector[3 + i] = oemName.charCodeAt(i);
        }

        // BIOS Parameter Block (simplified)
        bootSector[11] = 0x00; // Sector size low
        bootSector[12] = 0x02; // Sector size high (512)
        bootSector[13] = 0x01; // Sectors per cluster
        bootSector[14] = 0x01; // Reserved sectors low
        bootSector[15] = 0x00; // Reserved sectors high
        bootSector[16] = 0x02; // Number of FATs
        bootSector[17] = 0x70; // Root entries low (0x0070 = 112)
        bootSector[18] = 0x00; // Root entries high
        bootSector[19] = 0x40; // Total sectors low (0x0400 = 1024)
        bootSector[20] = 0x0A; // Total sectors high
        bootSector[21] = 0xF8; // Media descriptor

        // Copy to disk
        disk.set(bootSector, 0);
    }

    writeFAT(disk) {
        // FAT starts at sector 1
        const fatStart = 512;
        const fatSize = 9 * 512; // One track for FAT

        // Mark first two entries as reserved/end of chain
        disk[fatStart] = 0xF8;  // Media descriptor
        disk[fatStart + 1] = 0xFF;  // End of chain
        disk[fatStart + 2] = 0xFF;  // End of chain

        // Rest of FAT is free (0x00)
        for (let i = fatStart + 3; i < fatStart + fatSize; i++) {
            disk[i] = 0x00;
        }
    }

    writeRootDirectory(disk) {
        // Root directory starts after FAT
        const rootStart = 512 + (9 * 512);
        const rootSize = 7 * 512; // 7 sectors for root directory

        // Clear root directory
        for (let i = rootStart; i < rootStart + rootSize; i++) {
            disk[i] = 0x00;
        }
    }

    writeProgramToDisk(disk, program) {
        // Write program starting at cluster 2 (after boot sector and FAT)
        const programStart = 512 * 33; // After boot, FAT, and root directory

        for (let i = 0; i < program.length && i < (disk.length - programStart) / 2; i++) {
            const address = programStart + (i * 2);
            const word = program[i];

            disk[address] = word & 0xFF;        // Low byte
            disk[address + 1] = (word >> 8) & 0xFF; // High byte
        }
    }

    /**
     * Export development tools state
     * @returns {object} State data
     */
    exportState() {
        return {
            assembler: {
                currentAddress: this.assembler.currentAddress,
                labels: Object.fromEntries(this.assembler.labels)
            },
            debugger: this.debugger ? this.debugger.exportSession() : null,
            testFramework: {
                testCount: this.testFramework ? this.testFramework.tests.length : 0,
                results: this.testFramework ? this.testFramework.results : []
            }
        };
    }

    /**
     * Import development tools state
     * @param {object} state - State data
     */
    importState(state) {
        if (state.assembler) {
            this.assembler.currentAddress = state.assembler.currentAddress;
            this.assembler.labels = new Map(Object.entries(state.assembler.labels));
        }

        if (state.debugger && this.debugger) {
            this.debugger.importSession(state.debugger);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DevelopmentTools, Assembler, Debugger, TestFramework };
}