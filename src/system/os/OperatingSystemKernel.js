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

        // Initialize FDC for file system operations
        const { FloppyDiskController } = require('../../emulation/storage');
        this.fdc = new FloppyDiskController(mmu);

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
            GET_TIME: 0x05,             // Get system time
            MOUNT_DISK: 0x06,           // Mount floppy disk
            LOAD_FILE: 0x07,            // Load file from disk
            LIST_FILES: 0x08,           // List files on disk
            CREATE_FILE: 0x09,          // Create file on disk
            DELETE_FILE: 0x0A           // Delete file from disk
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
            console.log(`DEBUG: OS init - Before CPU reset, PC is 0x${this.cpu.getProgramCounter().toString(16)}`);
            this.cpu.reset();
            console.log(`DEBUG: OS init - After CPU reset, PC is 0x${this.cpu.getProgramCounter().toString(16)}`);
            this.mmu.clearMemory();

            // Set up system call handler
            this.cpu.setSystemCallHandler((syscallNumber) => {
                this.handleSystemCall(syscallNumber);
            });

            // Initialize memory layout
            this.initializeMemoryLayout();

            // Set up interrupt vector table
            this.initializeInterruptVectors();

            // Initialize I/O system
            this.initializeIOSystem();

            // Initialize FDC system
            this.initializeFDCSystem();

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
     * Initialize FDC system
     */
    initializeFDCSystem() {
        // FDC is already initialized in constructor
        console.log('FDC system initialized');
    }

    /**
     * Load program from disk file
     * @param {string} filename - Name of program file on disk
     * @param {string} programName - Name identifier for the program
     * @param {number} startAddress - Memory address to load program (optional)
     * @returns {boolean} True if program loaded successfully
     */
    loadProgramFromDisk(filename, programName, startAddress = null) {
        try {
            if (!this.isInitialized) {
                throw new Error('System not initialized. Call initialize() first.');
            }

            console.log(`Loading program '${programName}' from disk file '${filename}'`);

            // Read program file from disk
            const maxProgramSize = this.MEMORY_LAYOUT.PROGRAM_MAX - (startAddress || this.MEMORY_LAYOUT.PROGRAM_START);
            const programData = this.fdc.readFile('A:', filename, maxProgramSize);

            if (!programData || programData.length === 0) {
                throw new Error(`Program file '${filename}' not found or empty`);
            }

            // Load program into memory using existing method
            return this.loadProgram(programData, programName, startAddress);

        } catch (error) {
            console.error(`Failed to load program '${programName}' from disk:`, error.message);
            return false;
        }
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
            console.log(`DEBUG: OS loading ${byteData.length} bytes at 0x${loadAddress.toString(16)}`);
            console.log(`DEBUG: First 8 bytes: [${byteData.slice(0, 8).map(b => `0x${b.toString(16)}`).join(', ')}]`);
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

            // Validate and set CPU program counter
            if (startAddress % 4 !== 0) {
                throw new Error(`Invalid entry point 0x${startAddress.toString(16)} - must be word-aligned (divisible by 4)`);
            }

            console.log(`DEBUG: Setting PC to 0x${startAddress.toString(16)} (word-aligned: ${startAddress % 4 === 0})`);
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
            console.log(`DEBUG: System call ${systemCallNumber} at PC 0x${this.cpu.getProgramCounter().toString(16)}`);
            console.log(`DEBUG: System call handler called with syscall number: ${systemCallNumber}`);
            console.log(`DEBUG: Available system calls - PRINT_CHAR: ${this.SYSTEM_CALLS.PRINT_CHAR}, READ_CHAR: ${this.SYSTEM_CALLS.READ_CHAR}, EXIT: ${this.SYSTEM_CALLS.EXIT}`);

            switch (systemCallNumber) {
                case this.SYSTEM_CALLS.PRINT_CHAR:
                    // Print character from R0 to console
                    const charCode = this.cpu.getRegister(0) & 0xFF;
                    console.log(`DEBUG: PRINT_CHAR - charCode: 0x${charCode.toString(16)} (${String.fromCharCode(charCode)})`);
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

                case this.SYSTEM_CALLS.MOUNT_DISK:
                    // Mount floppy disk (R1 = drive 'A:' or 'B:', R2 = disk image path pointer)
                    try {
                        const driveLetter = this.cpu.getRegister(1);
                        const pathPtr = this.cpu.getRegister(2);

                        // Read disk path from memory (null-terminated string)
                        let path = '';
                        let address = pathPtr;
                        while (address < 0x10000) {
                            const byte = this.mmu.readByte(address);
                            if (byte === 0) break;
                            path += String.fromCharCode(byte);
                            address++;
                        }

                        const drive = driveLetter === 0 ? 'A:' : 'B:';
                        const mounted = this.fdc.mountDisk(drive, path);

                        this.cpu.setRegister(0, mounted ? 1 : 0);
                        return mounted ? 0 : -1;
                    } catch (error) {
                        console.error('Error mounting disk:', error.message);
                        this.cpu.setRegister(0, 0);
                        return -1;
                    }

                case this.SYSTEM_CALLS.LOAD_FILE:
                    // Load file from disk (R1 = filename pointer, R2 = buffer address, R3 = max length)
                    try {
                        const filenamePtr = this.cpu.getRegister(1);
                        const bufferAddr = this.cpu.getRegister(2);
                        const maxLength = this.cpu.getRegister(3);

                        // Read filename from memory
                        let filename = '';
                        let address = filenamePtr;
                        while (address < 0x10000) {
                            const byte = this.mmu.readByte(address);
                            if (byte === 0) break;
                            filename += String.fromCharCode(byte);
                            address++;
                        }

                        // Read file from disk
                        const fileData = this.fdc.readFile('A:', filename, maxLength);

                        if (fileData && fileData.length > 0) {
                            // Copy file data to memory buffer
                            const dataToCopy = Math.min(fileData.length, maxLength);
                            for (let i = 0; i < dataToCopy; i++) {
                                this.mmu.writeByte(bufferAddr + i, fileData[i]);
                            }

                            this.cpu.setRegister(0, dataToCopy); // Return bytes read
                            return 0;
                        } else {
                            this.cpu.setRegister(0, 0); // Return 0 bytes read
                            return -1;
                        }
                    } catch (error) {
                        console.error('Error loading file:', error.message);
                        this.cpu.setRegister(0, 0);
                        return -1;
                    }

                case this.SYSTEM_CALLS.LIST_FILES:
                    // List files on disk (R1 = buffer address for file list)
                    try {
                        const bufferAddr = this.cpu.getRegister(1);

                        // Get file list from FDC
                        const files = this.fdc.listFiles('A:');

                        // Format file list as string and write to memory
                        let fileList = '';
                        for (const file of files) {
                            fileList += `${file.name.padEnd(12)} ${file.size.toString().padStart(8)}\n`;
                        }

                        // Copy to memory buffer
                        for (let i = 0; i < Math.min(fileList.length, 512); i++) {
                            this.mmu.writeByte(bufferAddr + i, fileList.charCodeAt(i));
                        }

                        this.cpu.setRegister(0, files.length); // Return file count
                        return 0;
                    } catch (error) {
                        console.error('Error listing files:', error.message);
                        this.cpu.setRegister(0, 0);
                        return -1;
                    }

                case this.SYSTEM_CALLS.CREATE_FILE:
                    // Create file on disk (R1 = filename pointer, R2 = data buffer, R3 = data length)
                    try {
                        const filenamePtr = this.cpu.getRegister(1);
                        const dataPtr = this.cpu.getRegister(2);
                        const dataLength = this.cpu.getRegister(3);

                        // Read filename from memory
                        let filename = '';
                        let address = filenamePtr;
                        while (address < 0x10000) {
                            const byte = this.mmu.readByte(address);
                            if (byte === 0) break;
                            filename += String.fromCharCode(byte);
                            address++;
                        }

                        // Read file data from memory
                        const fileData = Buffer.alloc(dataLength);
                        for (let i = 0; i < dataLength; i++) {
                            fileData[i] = this.mmu.readByte(dataPtr + i);
                        }

                        const created = this.fdc.writeFile('A:', filename, fileData);

                        this.cpu.setRegister(0, created ? 1 : 0);
                        return created ? 0 : -1;
                    } catch (error) {
                        console.error('Error creating file:', error.message);
                        this.cpu.setRegister(0, 0);
                        return -1;
                    }

                case this.SYSTEM_CALLS.DELETE_FILE:
                    // Delete file from disk (R1 = filename pointer)
                    try {
                        const filenamePtr = this.cpu.getRegister(1);

                        // Read filename from memory
                        let filename = '';
                        let address = filenamePtr;
                        while (address < 0x10000) {
                            const byte = this.mmu.readByte(address);
                            if (byte === 0) break;
                            filename += String.fromCharCode(byte);
                            address++;
                        }

                        const deleted = this.fdc.deleteFile('A:', filename);

                        this.cpu.setRegister(0, deleted ? 1 : 0);
                        return deleted ? 0 : -1;
                    } catch (error) {
                        console.error('Error deleting file:', error.message);
                        this.cpu.setRegister(0, 0);
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