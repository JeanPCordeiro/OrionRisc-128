/**
 * OrionRisc-128 Floppy Disk Controller (FDC)
 *
 * Main FDC emulation with memory-mapped I/O interface
 * Manages two 360KB floppy disk drives with FAT12 file system support
 *
 * Memory-mapped I/O registers (0xF800-0xF900):
 * - 0xF800: Command register
 * - 0xF801: Status register
 * - 0xF802: Data register
 * - 0xF803: Drive select register
 * - 0xF804: Track register
 * - 0xF805: Sector register
 * - 0xF806: DMA address low
 * - 0xF807: DMA address high
 * - 0xF808: DMA count
 * - 0xF809: Control register
 */

const DiskImage = require('./disk-image');
const FAT12FileSystem = require('./fat12-filesystem');
const FileOperations = require('./file-operations');

class FloppyDiskController {
    constructor(memory) {
        this.memory = memory; // Reference to MMU for memory-mapped I/O

        // FDC Components
        this.diskImage = new DiskImage();
        this.fat12 = new FAT12FileSystem();
        this.fileOps = new FileOperations();

        // Memory-mapped I/O base address
        this.BASE_ADDRESS = 0xF800;
        this.IO_SIZE = 0x100; // 256 bytes of I/O space

        // FDC Registers (memory-mapped)
        this.registers = {
            COMMAND: 0x00,      // Command register
            STATUS: 0x01,       // Status register
            DATA: 0x02,         // Data register
            DRIVE_SELECT: 0x03, // Drive select (0=A:, 1=B:)
            TRACK: 0x04,        // Current track
            SECTOR: 0x05,       // Current sector
            DMA_ADDR_LOW: 0x06, // DMA address low byte
            DMA_ADDR_HIGH: 0x07,// DMA address high byte
            DMA_COUNT: 0x08,    // DMA transfer count
            CONTROL: 0x09       // Control register
        };

        // Initialize register values
        this.reset();

        // Command execution state
        this.currentCommand = null;
        this.commandPhase = 0;
        this.sectorBuffer = Buffer.alloc(512);
        this.bufferIndex = 0;

        // DMA state
        this.dmaAddress = 0;
        this.dmaCount = 0;

        // Interrupt state
        this.interruptPending = false;

        // FDC Commands
        this.COMMANDS = {
            READ_SECTOR: 0x01,
            WRITE_SECTOR: 0x02,
            SEEK_TRACK: 0x03,
            READ_STATUS: 0x04,
            FORMAT_TRACK: 0x05,
            READ_ID: 0x06,
            RECALIBRATE: 0x07,
            SENSE_INTERRUPT: 0x08
        };

        // Status bits
        this.STATUS = {
            BUSY: 0x01,           // FDC is busy
            DATA_REQUEST: 0x02,   // Ready for data transfer
            DATA_DIRECTION: 0x04, // 0=CPU to FDC, 1=FDC to CPU
            TRACK_0: 0x08,        // Head at track 0
            SEEK_COMPLETE: 0x10,  // Seek operation complete
            CRC_ERROR: 0x20,      // CRC error detected
            DRIVE_READY: 0x40,    // Drive ready
            DRIVE_FAULT: 0x80     // Drive fault
        };
    }

    /**
     * Reset FDC to initial state
     */
    reset() {
        // Clear all registers
        for (let i = 0; i < this.IO_SIZE; i++) {
            this.memory.writeByte(this.BASE_ADDRESS + i, 0x00);
        }

        // Set initial status
        this.memory.writeByte(this.BASE_ADDRESS + this.registers.STATUS,
            this.STATUS.DRIVE_READY | this.STATUS.TRACK_0);

        // Reset state
        this.currentCommand = null;
        this.commandPhase = 0;
        this.bufferIndex = 0;
        this.dmaAddress = 0;
        this.dmaCount = 0;
        this.interruptPending = false;
    }

    /**
     * Handle memory-mapped I/O read
     * @param {number} address - Memory address to read
     * @returns {number} - Byte value
     */
    readByte(address) {
        const offset = address - this.BASE_ADDRESS;

        switch (offset) {
            case this.registers.STATUS:
                return this.getStatus();

            case this.registers.DATA:
                return this.readData();

            case this.registers.DRIVE_SELECT:
                return this.memory.readByte(address); // Return stored value

            case this.registers.TRACK:
                return this.memory.readByte(address); // Return stored value

            case this.registers.SECTOR:
                return this.memory.readByte(address); // Return stored value

            default:
                return this.memory.readByte(address);
        }
    }

    /**
     * Handle memory-mapped I/O write
     * @param {number} address - Memory address to write
     * @param {number} value - Byte value to write
     */
    writeByte(address, value) {
        const offset = address - this.BASE_ADDRESS;

        switch (offset) {
            case this.registers.COMMAND:
                this.writeCommand(value);
                break;

            case this.registers.DATA:
                this.writeData(value);
                break;

            case this.registers.DRIVE_SELECT:
                this.selectDrive(value);
                break;

            case this.registers.DMA_ADDR_LOW:
                this.dmaAddress = (this.dmaAddress & 0xFF00) | value;
                break;

            case this.registers.DMA_ADDR_HIGH:
                this.dmaAddress = (this.dmaAddress & 0x00FF) | (value << 8);
                break;

            case this.registers.DMA_COUNT:
                this.dmaCount = value;
                break;

            case this.registers.CONTROL:
                this.writeControl(value);
                break;

            default:
                // Store in memory for other registers
                this.memory.writeByte(address, value);
                break;
        }
    }

    /**
     * Get current status register value
     * @returns {number} - Status byte
     */
    getStatus() {
        let status = 0;

        // Set status bits based on current state
        if (this.currentCommand !== null) {
            status |= this.STATUS.BUSY;
        }

        if (this.commandPhase > 0) {
            status |= this.STATUS.DATA_REQUEST;
        }

        // Check if drive is ready
        const driveSelect = this.memory.readByte(this.BASE_ADDRESS + this.registers.DRIVE_SELECT);
        const drive = driveSelect === 0 ? 'A:' : 'B:';

        if (this.diskImage.isDriveMounted(drive)) {
            status |= this.STATUS.DRIVE_READY;
        }

        // Check if at track 0
        const currentTrack = this.memory.readByte(this.BASE_ADDRESS + this.registers.TRACK);
        if (currentTrack === 0) {
            status |= this.STATUS.TRACK_0;
        }

        return status;
    }

    /**
     * Write command to FDC
     * @param {number} command - Command byte
     */
    writeCommand(command) {
        this.currentCommand = command;
        this.commandPhase = 0;

        // Set busy status
        const status = this.getStatus() | this.STATUS.BUSY;
        this.memory.writeByte(this.BASE_ADDRESS + this.registers.STATUS, status);

        // Execute command
        this.executeCommand(command);
    }

    /**
     * Execute FDC command
     * @param {number} command - Command to execute
     */
    executeCommand(command) {
        try {
            switch (command) {
                case this.COMMANDS.READ_SECTOR:
                    this.executeReadSector();
                    break;

                case this.COMMANDS.WRITE_SECTOR:
                    this.executeWriteSector();
                    break;

                case this.COMMANDS.SEEK_TRACK:
                    this.executeSeekTrack();
                    break;

                case this.COMMANDS.READ_STATUS:
                    this.executeReadStatus();
                    break;

                case this.COMMANDS.RECALIBRATE:
                    this.executeRecalibrate();
                    break;

                case this.COMMANDS.SENSE_INTERRUPT:
                    this.executeSenseInterrupt();
                    break;

                default:
                    console.warn(`Unknown FDC command: 0x${command.toString(16)}`);
                    this.commandComplete(0x80); // Invalid command error
                    break;
            }
        } catch (error) {
            console.error('FDC command execution error:', error);
            this.commandComplete(0x40); // Abnormal termination
        }
    }

    /**
     * Execute read sector command
     */
    executeReadSector() {
        const driveSelect = this.memory.readByte(this.BASE_ADDRESS + this.registers.DRIVE_SELECT);
        const track = this.memory.readByte(this.BASE_ADDRESS + this.registers.TRACK);
        const sector = this.memory.readByte(this.BASE_ADDRESS + this.registers.SECTOR);

        const drive = driveSelect === 0 ? 'A:' : 'B:';

        if (!this.diskImage.isDriveMounted(drive)) {
            this.commandComplete(0x50); // Drive not ready
            return;
        }

        try {
            const sectorData = this.diskImage.readSector(drive, track, sector);

            if (sectorData) {
                // Copy sector data to buffer for DMA transfer
                this.sectorBuffer = Buffer.from(sectorData);
                this.bufferIndex = 0;

                // Set up DMA transfer
                this.setupDMA();

                this.commandComplete(0x00); // Success
            } else {
                this.commandComplete(0x10); // ID not found
            }

        } catch (error) {
            this.commandComplete(0x20); // CRC error
        }
    }

    /**
     * Execute write sector command
     */
    executeWriteSector() {
        const driveSelect = this.memory.readByte(this.BASE_ADDRESS + this.registers.DRIVE_SELECT);
        const track = this.memory.readByte(this.BASE_ADDRESS + this.registers.TRACK);
        const sector = this.memory.readByte(this.BASE_ADDRESS + this.registers.SECTOR);

        const drive = driveSelect === 0 ? 'A:' : 'B:';

        if (!this.diskImage.isDriveMounted(drive)) {
            this.commandComplete(0x50); // Drive not ready
            return;
        }

        // Set data direction (CPU to FDC)
        const status = this.getStatus() | this.STATUS.DATA_REQUEST | this.STATUS.DATA_DIRECTION;
        this.memory.writeByte(this.BASE_ADDRESS + this.registers.STATUS, status);

        // Wait for data transfer (this would be handled by the CPU writing to data register)
        this.commandPhase = 1; // Data transfer phase
    }

    /**
     * Execute seek track command
     */
    executeSeekTrack() {
        const track = this.memory.readByte(this.BASE_ADDRESS + this.registers.TRACK);

        // Update current track
        this.memory.writeByte(this.BASE_ADDRESS + this.registers.TRACK, track);

        // Simulate seek time
        setTimeout(() => {
            this.commandComplete(0x00); // Success
        }, 10); // 10ms seek time
    }

    /**
     * Execute read status command
     */
    executeReadStatus() {
        // Status is already available in status register
        this.commandComplete(0x00);
    }

    /**
     * Execute recalibrate command
     */
    executeRecalibrate() {
        // Move to track 0
        this.memory.writeByte(this.BASE_ADDRESS + this.registers.TRACK, 0);

        // Simulate recalibrate time
        setTimeout(() => {
            this.commandComplete(0x00); // Success
        }, 100); // 100ms recalibrate time
    }

    /**
     * Execute sense interrupt status command
     */
    executeSenseInterrupt() {
        if (this.interruptPending) {
            // Return interrupt status
            this.memory.writeByte(this.BASE_ADDRESS + this.registers.DATA, 0x20); // Interrupt code
            this.interruptPending = false;
        } else {
            this.memory.writeByte(this.BASE_ADDRESS + this.registers.DATA, 0x80); // No interrupt
        }

        this.commandComplete(0x00);
    }

    /**
     * Read data from FDC (for DMA transfer)
     * @returns {number} - Data byte
     */
    readData() {
        if (this.bufferIndex < this.sectorBuffer.length) {
            const data = this.sectorBuffer[this.bufferIndex];
            this.bufferIndex++;

            // Check if DMA transfer complete
            if (this.bufferIndex >= this.dmaCount) {
                this.commandComplete(0x00);
            }

            return data;
        }

        return 0x00; // No more data
    }

    /**
     * Write data to FDC (for sector write)
     * @param {number} value - Data byte
     */
    writeData(value) {
        if (this.commandPhase === 1) { // Data transfer phase
            this.sectorBuffer[this.bufferIndex] = value;
            this.bufferIndex++;

            // Check if sector buffer is full
            if (this.bufferIndex >= 512) {
                this.completeWriteSector();
            }
        }
    }

    /**
     * Complete write sector operation
     */
    completeWriteSector() {
        const driveSelect = this.memory.readByte(this.BASE_ADDRESS + this.registers.DRIVE_SELECT);
        const track = this.memory.readByte(this.BASE_ADDRESS + this.registers.TRACK);
        const sector = this.memory.readByte(this.BASE_ADDRESS + this.registers.SECTOR);

        const drive = driveSelect === 0 ? 'A:' : 'B:';

        try {
            const success = this.diskImage.writeSector(drive, track, sector, this.sectorBuffer);

            if (success) {
                this.commandComplete(0x00); // Success
            } else {
                this.commandComplete(0x10); // Write fault
            }

        } catch (error) {
            this.commandComplete(0x20); // CRC error
        }
    }

    /**
     * Select drive
     * @param {number} driveSelect - 0 for A:, 1 for B:
     */
    selectDrive(driveSelect) {
        this.memory.writeByte(this.BASE_ADDRESS + this.registers.DRIVE_SELECT, driveSelect);

        // Update status based on selected drive
        const drive = driveSelect === 0 ? 'A:' : 'B:';
        const status = this.getStatus();

        if (this.diskImage.isDriveMounted(drive)) {
            this.memory.writeByte(this.BASE_ADDRESS + this.registers.STATUS,
                status | this.STATUS.DRIVE_READY);
        } else {
            this.memory.writeByte(this.BASE_ADDRESS + this.registers.STATUS,
                status & ~this.STATUS.DRIVE_READY);
        }
    }

    /**
     * Write control register
     * @param {number} value - Control value
     */
    writeControl(value) {
        // Handle control bits
        if (value & 0x01) {
            this.reset(); // Reset FDC
        }

        if (value & 0x02) {
            this.interruptPending = true; // Enable interrupts
        }
    }

    /**
     * Set up DMA transfer
     */
    setupDMA() {
        // In a real implementation, this would set up DMA controller
        // For emulation, we'll handle data transfer through memory-mapped I/O
        this.bufferIndex = 0;
    }

    /**
     * Complete command execution
     * @param {number} statusCode - Completion status code
     */
    commandComplete(statusCode) {
        this.currentCommand = null;
        this.commandPhase = 0;
        this.bufferIndex = 0;

        // Clear busy status
        const status = this.getStatus() & ~this.STATUS.BUSY;
        this.memory.writeByte(this.BASE_ADDRESS + this.registers.STATUS, status);

        // Set interrupt if enabled
        if (statusCode === 0x00) { // Success
            this.interruptPending = true;
        }
    }

    /**
     * Mount disk image to drive
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @param {string} imagePath - Path to disk image file
     * @returns {boolean} - True if mounted successfully
     */
    async mountDisk(drive, imagePath) {
        const success = await this.diskImage.mountDisk(drive, imagePath);

        if (success) {
            // Update drive status
            const driveSelect = drive === 'A:' ? 0 : 1;
            this.selectDrive(driveSelect);
        }

        return success;
    }

    /**
     * Unmount disk from drive
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {boolean} - True if unmounted successfully
     */
    async unmountDisk(drive) {
        return await this.diskImage.unmountDisk(drive);
    }

    /**
     * Create new disk image
     * @param {string} imagePath - Path for new disk image
     * @param {boolean} is720KB - True for 720KB disk
     * @returns {boolean} - True if created successfully
     */
    async createDisk(imagePath, is720KB = false) {
        return await this.diskImage.createBlankDisk(imagePath, is720KB);
    }

    /**
     * Initialize file system on mounted disk
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {boolean} - True if initialized successfully
     */
    initializeFileSystem(drive) {
        const diskBuffer = this.diskImage.getDiskBuffer(drive);

        if (!diskBuffer) {
            return false;
        }

        return this.fat12.initializeFileSystem(diskBuffer);
    }

    /**
     * List files on disk
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {Array} - Array of file information
     */
    listFiles(drive) {
        const diskBuffer = this.diskImage.getDiskBuffer(drive);

        if (!diskBuffer) {
            return [];
        }

        return this.fileOps.listFiles(diskBuffer);
    }

    /**
     * Read file from disk
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @param {string} filename - File name
     * @param {number} length - Number of bytes to read
     * @returns {Buffer|null} - File data or null if error
     */
    readFile(drive, filename, length) {
        const diskBuffer = this.diskImage.getDiskBuffer(drive);

        if (!diskBuffer) {
            return null;
        }

        const handle = this.fileOps.openFile(diskBuffer, filename, 'r');

        if (!handle) {
            return null;
        }

        const data = this.fileOps.readFile(handle, length);
        this.fileOps.closeFile(handle);

        return data;
    }

    /**
     * Write file to disk
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @param {string} filename - File name
     * @param {Buffer} data - Data to write
     * @returns {boolean} - True if written successfully
     */
    writeFile(drive, filename, data) {
        const diskBuffer = this.diskImage.getDiskBuffer(drive);

        if (!diskBuffer) {
            return false;
        }

        const handle = this.fileOps.openFile(diskBuffer, filename, 'w');

        if (!handle) {
            return false;
        }

        let bytesWritten = 0;
        const chunkSize = 512; // Write in sector-sized chunks

        while (bytesWritten < data.length) {
            const chunk = data.slice(bytesWritten, bytesWritten + chunkSize);
            const written = this.fileOps.writeFile(handle, chunk);

            if (written === null) {
                this.fileOps.closeFile(handle);
                return false;
            }

            bytesWritten += written;
        }

        this.fileOps.closeFile(handle);
        return true;
    }

    /**
     * Delete file from disk
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @param {string} filename - File name to delete
     * @returns {boolean} - True if deleted successfully
     */
    deleteFile(drive, filename) {
        const diskBuffer = this.diskImage.getDiskBuffer(drive);

        if (!diskBuffer) {
            return false;
        }

        return this.fileOps.deleteFile(diskBuffer, filename);
    }

    /**
     * Get disk information
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {object|null} - Disk information or null if not mounted
     */
    getDiskInfo(drive) {
        return this.diskImage.getDiskInfo(drive);
    }

    /**
     * Get mounted drives information
     * @returns {object} - Information about mounted drives
     */
    getMountedDrives() {
        return this.diskImage.getMountedDrives();
    }
}

module.exports = FloppyDiskController;