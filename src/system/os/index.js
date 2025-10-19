/**
 * Operating System Kernel Module
 * Exports for the OrionRisc-128 OS Kernel system
 */

const OperatingSystemKernel = require('./OperatingSystemKernel');

// System constants and utilities
const SYSTEM_CONSTANTS = {
    MEMORY_LAYOUT: {
        PROGRAM_START: 0x0000,
        PROGRAM_MAX: 0xEFFF,
        STACK_START: 0xEFFF,
        STACK_MAX: 0xE000,
        MMIO_START: 0xF000,
        MMIO_END: 0xFFFF
    },

    INTERRUPTS: {
        SYSTEM_CALL: 0x01,
        PROGRAM_EXIT: 0x02,
        HARDWARE_ERROR: 0x03,
        TIMER: 0x04,
        IO_READY: 0x05
    },

    SYSTEM_CALLS: {
        PRINT_CHAR: 0x01,
        READ_CHAR: 0x02,
        EXIT: 0x03,
        LOAD_PROGRAM: 0x04,
        GET_TIME: 0x05,
        MOUNT_DISK: 0x06,
        LOAD_FILE: 0x07,
        LIST_FILES: 0x08,
        CREATE_FILE: 0x09,
        DELETE_FILE: 0x0A
    }
};

/**
 * Create a new OS kernel instance with hardware components
 * @param {Object} hardware - Hardware components (cpu, mmu, etc.)
 * @returns {OperatingSystemKernel} Configured OS kernel instance
 */
function createOSKernel(hardware) {
    if (!hardware || !hardware.cpu || !hardware.mmu) {
        throw new Error('Hardware components (cpu, mmu) are required to create OS kernel');
    }

    return new OperatingSystemKernel(hardware.cpu, hardware.mmu);
}

/**
 * Initialize complete system with OS kernel and hardware
 * @param {Object} hardware - Hardware components
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initializeSystem(hardware) {
    try {
        const kernel = createOSKernel(hardware);

        // Initialize the kernel
        const success = kernel.initialize();

        if (success) {
            // Attach kernel to hardware for easy access
            hardware.kernel = kernel;

            console.log('Complete system initialized successfully');
            return true;
        } else {
            console.error('Failed to initialize system');
            return false;
        }
    } catch (error) {
        console.error('Error initializing system:', error.message);
        return false;
    }
}

/**
 * Load and execute a program from disk
 * @param {Object} hardware - Hardware components with kernel
 * @param {string} filename - Program filename on disk
 * @param {string} programName - Program identifier
 * @param {number} startAddress - Optional start address
 * @returns {Promise<boolean>} True if loaded and executed successfully
 */
async function loadAndExecuteProgram(hardware, filename, programName, startAddress = null) {
    if (!hardware.kernel) {
        throw new Error('System not initialized. Call initializeSystem() first.');
    }

    try {
        // Load program from disk
        const loaded = hardware.kernel.loadProgramFromDisk(filename, programName, startAddress);

        if (!loaded) {
            console.error(`Failed to load program '${programName}' from '${filename}'`);
            return false;
        }

        // Execute the program
        const executed = hardware.kernel.executeProgram(programName);

        if (!executed) {
            console.error(`Failed to execute program '${programName}'`);
            return false;
        }

        console.log(`Program '${programName}' loaded and executed successfully`);
        return true;

    } catch (error) {
        console.error(`Error loading/executing program '${programName}':`, error.message);
        return false;
    }
}

/**
 * System control utilities
 */
const SystemControl = {
    /**
     * Reset the entire system
     * @param {Object} hardware - Hardware components
     */
    reset(hardware) {
        if (hardware.kernel) {
            hardware.kernel.shutdown();
        }

        hardware.cpu.reset();
        hardware.mmu.clearMemory();

        if (hardware.gpu) {
            hardware.gpu.reset();
        }

        if (hardware.fdc) {
            hardware.fdc.reset();
        }

        console.log('System reset complete');
    },

    /**
     * Get complete system status
     * @param {Object} hardware - Hardware components
     * @returns {Object} System status
     */
    getStatus(hardware) {
        const status = {
            hardware: {
                cpu: hardware.cpu.getState(),
                memory: hardware.mmu.getMemoryStats()
            }
        };

        if (hardware.gpu) {
            status.hardware.gpu = hardware.gpu.getStatus();
        }

        if (hardware.fdc) {
            status.hardware.fdc = hardware.fdc.getMountedDrives();
        }

        if (hardware.kernel) {
            status.software = hardware.kernel.getSystemStatus();
        }

        return status;
    },

    /**
     * Shutdown the system gracefully
     * @param {Object} hardware - Hardware components
     */
    shutdown(hardware) {
        if (hardware.kernel) {
            hardware.kernel.shutdown();
        }

        if (hardware.fdc) {
            // Unmount all drives
            const drives = hardware.fdc.getMountedDrives();
            Object.keys(drives).forEach(drive => {
                hardware.fdc.unmountDisk(drive);
            });
        }

        console.log('System shutdown complete');
    }
};

module.exports = {
    // Main kernel class
    OperatingSystemKernel,

    // System constants
    SYSTEM_CONSTANTS,

    // Factory functions
    createOSKernel,
    initializeSystem,
    loadAndExecuteProgram,

    // System control utilities
    SystemControl
};