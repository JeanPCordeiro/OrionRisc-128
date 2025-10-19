/**
 * Operating System Kernel for OrionRisc-128
 * Provides system bootstrap, program loading, execution control, and I/O operations
 * Serves as the foundation for the bootstrap development approach
 */
class OperatingSystemKernel {
    constructor(cpu, mmu) {
        // Validate hardware dependencies
        if (!cpu || !mmu) {
            throw new Error('OperatingSystemKernel requires CPU and MMU instances');
        }

        this.cpu = cpu;
        this.mmu = mmu;

        // System state
        this.isInitialized = false;
        this.isRunning = false;
        this.loadedPrograms = new Map(); // Program name -> metadata

        // Memory layout constants
        this.MEMORY_LAYOUT = {
            PROGRAM_START: 0x0000,      // Start of program area
            PROGRAM_MAX: 0xEFFF,        // End of program area (before MMIO)
            STACK_START: 0xEFFF,        // Stack grows downward from here
            STACK_MAX: 0xE000,          // Stack limit (avoid MMIO area)
            MMIO_START: 0xF000,         // Memory-mapped I/O start
            MMIO_END: 0xFFFF           // Memory-mapped I/O end
        };

        // Interrupt types
        this.INTERRUPTS = {
            SYSTEM_CALL: 0x01,          // System call interrupt
            PROGRAM_EXIT: 0x02,         // Program termination
            HARDWARE_ERROR: 0x03,       // Hardware fault
            TIMER: 0x04,                // Timer interrupt
            IO_READY: 0x05              // I/O operation complete
        };

        // System call numbers
        this.SYSTEM_CALLS = {
            PRINT_CHAR: 0x01,           // Print character to console
            READ_CHAR: 0x02,            // Read character from console
            EXIT: 0x03,                 // Terminate program
            LOAD_PROGRAM: 0x04,         // Load another program
            GET_TIME: 0x05              // Get system time
        };

        console.log('Operating System Kernel initialized');
    }

    /**
     * Initialize the operating system and hardware components
     * @returns {boolean} True if initialization successful
     */
    initialize() {
        try {
            console.log('Starting OS kernel initialization...');

            // Reset hardware components
            this.cpu.reset();
            this.mmu.clearMemory();

            // Initialize memory layout
            this.initializeMemoryLayout();

            // Set up interrupt vector table
            this.initializeInterruptVectors();

            // Initialize I/O system
            this.initializeIOSystem();

            this.isInitialized = true;
            this.isRunning = true;

            console.log('OS kernel initialization complete');
            return true;

        } catch (error) {
            console.error('OS kernel initialization failed:', error.message);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Initialize memory layout and system areas
     */
    initializeMemoryLayout() {
        // Reserve memory for system data structures
        // Stack starts at STACK_START and grows downward
        this.cpu.setRegister(13, this.MEMORY_LAYOUT.STACK_START); // SP = R13

        // Base register points to program area
        this.cpu.setRegister(12, this.MEMORY_LAYOUT.PROGRAM_START); // BP = R12

        console.log('Memory layout initialized');
    }

    /**
     * Initialize interrupt vector table
     */
    initializeInterruptVectors() {
        // Set up interrupt handlers in memory
        // For now, we'll use a simple jump table approach
        const interruptTable = [
            0x00000000, // SYSTEM_CALL handler (placeholder)
            0x00000000, // PROGRAM_EXIT handler (placeholder)
            0x00000000, // HARDWARE_ERROR handler (placeholder)
            0x00000000, // TIMER handler (placeholder)
            0x00000000  // IO_READY handler (placeholder)
        ];

        // Load interrupt table into memory (starting at address 0xFF00)
        const tableStart = 0xFF00;
        for (let i = 0; i < interruptTable.length; i++) {
            this.mmu.writeWord(tableStart + (i * 4), interruptTable[i]);
        }

        console.log('Interrupt vector table initialized');
    }

    /**
     * Initialize I/O system
     */
    initializeIOSystem() {
        // Initialize console I/O buffers
        this.consoleBuffer = '';
        this.inputBuffer = '';

        console.log('I/O system initialized');
    }

    /**
     * Load a program into memory
     * @param {Array|Uint8Array} programData - Binary program data
     * @param {string} programName - Name identifier for the program
     * @param {number} startAddress - Memory address to load program (optional)
     * @returns {boolean} True if program loaded successfully
     */
    loadProgram(programData, programName, startAddress = null) {
        try {
            if (!this.isInitialized) {
                throw new Error('System not initialized. Call initialize() first.');
            }

            if (!programData || (Array.isArray(programData) && programData.length === 0)) {
                throw new Error('Invalid program data provided');
            }

            // Determine load address
            const loadAddress = startAddress || this.findNextAvailableAddress(programData.length);

            if (loadAddress + programData.length > this.MEMORY_LAYOUT.PROGRAM_MAX) {
                throw new Error(`Program too large: ${programData.length} bytes. Available space: ${this.MEMORY_LAYOUT.PROGRAM_MAX - loadAddress} bytes`);
            }

            // Convert to byte array if needed
            let byteData;
            if (programData instanceof Uint8Array) {
                byteData = Array.from(programData);
            } else if (Array.isArray(programData)) {
                byteData = programData;
            } else {
                throw new Error('Program data must be Array or Uint8Array');
            }

            // Validate all bytes
            for (let i = 0; i < byteData.length; i++) {
                if (typeof byteData[i] !== 'number' || byteData[i] < 0 || byteData[i] > 255) {
                    throw new Error(`Invalid byte at index ${i}: ${byteData[i]}`);
                }
            }

            // Load program into memory
            this.mmu.loadMemory(loadAddress, byteData);

            // Store program metadata
            const programInfo = {
                name: programName,
                startAddress: loadAddress,
                size: byteData.length,
                entryPoint: loadAddress, // First instruction is entry point
                loadTime: Date.now()
            };

            this.loadedPrograms.set(programName, programInfo);

            console.log(`Loaded program '${programName}' (${byteData.length} bytes) at 0x${loadAddress.toString(16)}`);
            return true;

        } catch (error) {
            console.error(`Failed to load program '${programName}':`, error.message);
            return false;
        }
    }

    /**
     * Find next available memory address for program loading
     * @param {number} programSize - Size of program in bytes
     * @returns {number} Available start address
     */
    findNextAvailableAddress(programSize) {
        let currentAddress = this.MEMORY_LAYOUT.PROGRAM_START;

        // Simple first-fit allocation
        // In a real OS, this would be more sophisticated
        for (const programInfo of this.loadedPrograms.values()) {
            if (currentAddress + programSize <= programInfo.startAddress) {
                return currentAddress;
            }
            currentAddress = programInfo.startAddress + programInfo.size;
        }

        // Check if there's space at the end
        if (currentAddress + programSize <= this.MEMORY_LAYOUT.PROGRAM_MAX) {
            return currentAddress;
        }

        throw new Error('Insufficient memory for program');
    }

    /**
     * Execute a loaded program
     * @param {string} programName - Name of the program to execute
     * @param {number} entryPoint - Entry point address (optional, uses loaded address if not specified)
     * @returns {boolean} True if execution started successfully
     */
    executeProgram(programName, entryPoint = null) {
        try {
            if (!this.isInitialized) {
                throw new Error('System not initialized. Call initialize() first.');
            }

            const programInfo = this.loadedPrograms.get(programName);
            if (!programInfo) {
                throw new Error(`Program '${programName}' not found. Load it first.`);
            }

            // Set entry point
            const startAddress = entryPoint || programInfo.entryPoint;

            // Validate entry point
            if (startAddress < programInfo.startAddress ||
                startAddress >= programInfo.startAddress + programInfo.size) {
                throw new Error(`Invalid entry point 0x${startAddress.toString(16)} for program '${programName}'`);
            }

            // Set CPU program counter
            this.cpu.setProgramCounter(startAddress);

            // Set up stack if not already done
            if (this.cpu.getRegister(13) === 0) { // SP = R13
                this.cpu.setRegister(13, this.MEMORY_LAYOUT.STACK_START);
            }

            console.log(`Starting execution of '${programName}' at 0x${startAddress.toString(16)}`);

            // Execute program (this will run until halt or error)
            const instructionsExecuted = this.cpu.run();

            console.log(`Program '${programName}' executed ${instructionsExecuted} instructions`);
            return true;

        } catch (error) {
            console.error(`Failed to execute program '${programName}':`, error.message);
            return false;
        }
    }

    /**
     * Handle system interrupts
     * @param {number} interruptType - Type of interrupt
     * @param {number} data - Additional interrupt data
     * @returns {boolean} True if interrupt handled successfully
     */
    handleInterrupt(interruptType, data = 0) {
        try {
            switch (interruptType) {
                case this.INTERRUPTS.SYSTEM_CALL:
                    return this.handleSystemCall(data) >= 0;

                case this.INTERRUPTS.PROGRAM_EXIT:
                    console.log('Program exit interrupt received');
                    return true;

                case this.INTERRUPTS.HARDWARE_ERROR:
                    console.error(`Hardware error interrupt: 0x${data.toString(16)}`);
                    return false;

                case this.INTERRUPTS.TIMER:
                    // Timer interrupt - for now, just acknowledge
                    return true;

                case this.INTERRUPTS.IO_READY:
                    console.log('I/O ready interrupt received');
                    return true;

                default:
                    console.warn(`Unknown interrupt type: 0x${interruptType.toString(16)}`);
                    return false;
            }

        } catch (error) {
            console.error('Error handling interrupt:', error.message);
            return false;
        }
    }

    /**
     * Handle system calls from user programs
     * @param {number} systemCallNumber - System call number
     * @returns {number} System call result
     */
    handleSystemCall(systemCallNumber) {
        try {
            switch (systemCallNumber) {
                case this.SYSTEM_CALLS.PRINT_CHAR:
                    // Print character from R0 to console
                    const charCode = this.cpu.getRegister(0) & 0xFF;
                    if (charCode > 0 && charCode <= 255) {
                        process.stdout.write(String.fromCharCode(charCode));
                    }
                    return 0;

                case this.SYSTEM_CALLS.READ_CHAR:
                    // Read character into R0 (for now, return 0)
                    // In a real implementation, this would read from stdin
                    this.cpu.setRegister(0, 0);
                    return 0;

                case this.SYSTEM_CALLS.EXIT:
                    // Exit program
                    console.log('Program called exit system call');
                    this.cpu.isHalted = true;
                    this.cpu.isRunning = false;
                    return 0;

                case this.SYSTEM_CALLS.GET_TIME:
                    // Get system time in milliseconds (ensure positive value)
                    try {
                        const rawTime = Date.now();
                        const timeValue = ((rawTime < 0 ? -rawTime : rawTime) & 0x7FFFFFFF) | 0;
                        this.cpu.setRegister(0, timeValue);
                        return 0;
                    } catch (error) {
                        console.error('Error setting time register:', error.message);
                        return -1;
                    }

                default:
                    console.warn(`Unknown system call: 0x${systemCallNumber.toString(16)}`);
                    return -1;
            }
        } catch (error) {
            console.error('Error in system call:', error.message);
            return -1;
        }
    }

    /**
     * Graceful system shutdown
     * @returns {boolean} True if shutdown successful
     */
    shutdown() {
        try {
            console.log('Shutting down OS kernel...');

            // Halt any running programs
            this.cpu.isHalted = true;
            this.cpu.isRunning = false;

            // Clear program list
            this.loadedPrograms.clear();

            // Reset system state
            this.isRunning = false;

            console.log('OS kernel shutdown complete');
            return true;

        } catch (error) {
            console.error('Error during shutdown:', error.message);
            return false;
        }
    }

    /**
     * Get system status information
     * @returns {Object} System status object
     */
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            loadedPrograms: Array.from(this.loadedPrograms.entries()).map(([name, info]) => ({
                name,
                startAddress: info.startAddress,
                size: info.size,
                entryPoint: info.entryPoint
            })),
            cpuState: this.cpu.getState(),
            memoryStats: this.mmu.getMemoryStats()
        };
    }
}

module.exports = OperatingSystemKernel;