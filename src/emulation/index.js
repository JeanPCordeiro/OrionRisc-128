/**
 * Emulation Layer - Hardware component integration for OrionRisc-128
 *
 * Integrates all hardware components (CPU, MMU, GPU) and provides
 * a unified interface for the complete emulated computer system.
 */

const MemoryManagementUnit = require('./memory/MemoryManagementUnit');
const RiscProcessor = require('./cpu/RiscProcessor');
const { GraphicsProcessingUnit } = require('./gpu');
const { FloppyDiskController } = require('./storage');

class EmulationLayer {
    constructor() {
        // Initialize core hardware components
        this.mmu = new MemoryManagementUnit();
        this.cpu = new RiscProcessor(this.mmu);
        this.gpu = new GraphicsProcessingUnit();
        this.fdc = new FloppyDiskController(this.mmu);

        // GPU memory-mapped I/O integration
        this.setupGPUMemoryMapping();

        // FDC memory-mapped I/O integration
        this.setupFDCMemoryMapping();

        // System state
        this.isRunning = false;
        this.cycleCount = 0;

        console.log('Emulation layer initialized with all hardware components');
    }

    /**
     * Set up GPU memory-mapped I/O integration with MMU
     */
    setupGPUMemoryMapping() {
        const originalMMUReadByte = this.mmu.readByte.bind(this.mmu);
        const originalMMUWriteByte = this.mmu.writeByte.bind(this.mmu);
        const originalMMUReadWord = this.mmu.readWord.bind(this.mmu);
        const originalMMUWriteWord = this.mmu.writeWord.bind(this.mmu);

        // Override MMU methods to handle GPU memory-mapped I/O
        this.mmu.readByte = (address) => {
            // Check if this is a GPU register access
            if (address >= 0xF000 && address < 0xF100) {
                return this.gpu.readRegister(address - 0xF000) & 0xFF;
            }
            return originalMMUReadByte(address);
        };

        this.mmu.writeByte = (address, value) => {
            // Check if this is a GPU register access
            if (address >= 0xF000 && address < 0xF100) {
                this.gpu.writeRegister(address - 0xF000, value);
                return;
            }
            return originalMMUWriteByte(address, value);
        };

        this.mmu.readWord = (address) => {
            // Check if this is a GPU register access (word-aligned)
            if (address >= 0xF000 && address < 0xF100 && (address % 4 === 0)) {
                const registerAddress = address - 0xF000;
                return this.gpu.readRegister(registerAddress) |
                       (this.gpu.readRegister(registerAddress + 1) << 8) |
                       (this.gpu.readRegister(registerAddress + 2) << 16) |
                       (this.gpu.readRegister(registerAddress + 3) << 24);
            }
            return originalMMUReadWord(address);
        };

        this.mmu.writeWord = (address, value) => {
            // Check if this is a GPU register access (word-aligned)
            if (address >= 0xF000 && address < 0xF100 && (address % 4 === 0)) {
                const registerAddress = address - 0xF000;
                this.gpu.writeRegister(registerAddress, value & 0xFF);
                this.gpu.writeRegister(registerAddress + 1, (value >> 8) & 0xFF);
                this.gpu.writeRegister(registerAddress + 2, (value >> 16) & 0xFF);
                this.gpu.writeRegister(registerAddress + 3, (value >> 24) & 0xFF);
                return;
            }
            return originalMMUWriteWord(address, value);
        };

        console.log('GPU memory-mapped I/O integrated with MMU');
    }

    /**
     * Set up FDC memory-mapped I/O integration with MMU
     */
    setupFDCMemoryMapping() {
        const originalMMUReadByte = this.mmu.readByte.bind(this.mmu);
        const originalMMUWriteByte = this.mmu.writeByte.bind(this.mmu);

        // Override MMU methods to handle FDC memory-mapped I/O
        this.mmu.readByte = (address) => {
            // Check if this is a FDC register access (0xF800-0xF900)
            if (address >= 0xF800 && address < 0xF900) {
                return this.fdc.readByte(address);
            }
            return originalMMUReadByte(address);
        };

        this.mmu.writeByte = (address, value) => {
            // Check if this is a FDC register access (0xF800-0xF900)
            if (address >= 0xF800 && address < 0xF900) {
                this.fdc.writeByte(address, value);
                return;
            }
            return originalMMUWriteByte(address, value);
        };

        console.log('FDC memory-mapped I/O integrated with MMU');
    }

    /**
     * Reset all hardware components
     */
    reset() {
        this.cpu.reset();
        this.gpu.reset();
        this.fdc.reset();
        this.cycleCount = 0;
        console.log('All hardware components reset');
    }

    /**
     * Execute a single CPU instruction cycle
     * @returns {boolean} True if execution should continue
     */
    step() {
        if (!this.cpu.isRunning || this.cpu.isHalted) {
            return false;
        }

        // Execute one CPU instruction
        const cpuContinue = this.cpu.step();

        // Update GPU for this cycle
        this.gpu.updateFrame();

        this.cycleCount++;

        return cpuContinue;
    }

    /**
     * Run the emulation continuously
     * @param {number} maxCycles - Maximum cycles to execute
     * @returns {number} Number of cycles executed
     */
    run(maxCycles = 1000000) {
        this.isRunning = true;
        let cyclesExecuted = 0;

        console.log(`Starting emulation from PC 0x${this.cpu.getProgramCounter().toString(16)}`);

        while (this.isRunning && !this.cpu.isHalted && cyclesExecuted < maxCycles) {
            if (!this.step()) {
                break;
            }
            cyclesExecuted++;
        }

        this.isRunning = false;

        if (this.cpu.isHalted) {
            console.log(`Emulation halted after ${cyclesExecuted} cycles`);
        } else if (cyclesExecuted >= maxCycles) {
            console.log(`Emulation stopped after ${cyclesExecuted} cycles (max cycles reached)`);
        }

        return cyclesExecuted;
    }

    /**
     * Load a program into memory
     * @param {Array} program - Array of 32-bit instructions
     * @param {number} startAddress - Starting memory address
     */
    loadProgram(program, startAddress = 0x0000) {
        this.cpu.loadProgram(program, startAddress);
        console.log(`Program loaded: ${program.length} instructions at 0x${startAddress.toString(16)}`);
    }

    /**
     * Set system call handler for the CPU
     * @param {Function} handler - System call handler function
     */
    setSystemCallHandler(handler) {
        this.cpu.setSystemCallHandler(handler);
    }

    /**
     * Connect GPU to frontend WebSocket
     * @param {WebSocket} websocket - WebSocket connection
     */
    connectToFrontend(websocket) {
        this.gpu.connectToFrontend(websocket);
    }

    /**
     * Get complete system state
     * @returns {Object} System state object
     */
    getState() {
        return {
            cpu: this.cpu.getState(),
            gpu: this.gpu.getStatus(),
            memory: this.mmu.getMemoryStats(),
            emulation: {
                isRunning: this.isRunning,
                cycleCount: this.cycleCount
            }
        };
    }

    /**
     * Get individual hardware components
     * @returns {Object} Hardware components
     */
    getComponents() {
        return {
            cpu: this.cpu,
            mmu: this.mmu,
            gpu: this.gpu,
            fdc: this.fdc
        };
    }

    /**
     * Memory access methods (delegated to MMU)
     */
    readByte(address) { return this.mmu.readByte(address); }
    writeByte(address, value) { return this.mmu.writeByte(address, value); }
    readWord(address) { return this.mmu.readWord(address); }
    writeWord(address, value) { return this.mmu.writeWord(address, value); }
    loadMemory(startAddress, data) { return this.mmu.loadMemory(startAddress, data); }
    dumpMemory(startAddress, length) { return this.mmu.dumpMemory(startAddress, length); }

    /**
     * GPU access methods (delegated to GPU)
     */
    getFrameBuffer() { return this.gpu.getFrameBuffer(); }
    getTextModeEngine() { return this.gpu.getTextModeEngine(); }
    getGraphicsPrimitives() { return this.gpu.getGraphicsPrimitives(); }
    getCharacterROM() { return this.gpu.getCharacterROM(); }

    /**
     * FDC access methods (delegated to FDC)
     */
    async mountDisk(drive, imagePath) {
        console.log(`EmulationLayer: Mounting disk ${imagePath} to drive ${drive}`);
        return await this.fdc.mountDisk(drive, imagePath);
    }
    async unmountDisk(drive) { return await this.fdc.unmountDisk(drive); }
    async createDisk(imagePath, is720KB) { return await this.fdc.createDisk(imagePath, is720KB); }
    initializeFileSystem(drive) { return this.fdc.initializeFileSystem(drive); }
    listFiles(drive) { return this.fdc.listFiles(drive); }
    readFile(drive, filename, length) { return this.fdc.readFile(drive, filename, length); }
    writeFile(drive, filename, data) { return this.fdc.writeFile(drive, filename, data); }
    deleteFile(drive, filename) { return this.fdc.deleteFile(drive, filename); }
    getDiskInfo(drive) { return this.fdc.getDiskInfo(drive); }
    getMountedDrives() { return this.fdc.getMountedDrives(); }
}

module.exports = EmulationLayer;