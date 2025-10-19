/**
 * OrionRisc-128 Storage Subsystem
 *
 * Emulates two 360KB 3.5-inch floppy disk drives.
 * Provides sector-based storage with basic file system simulation.
 */

class FloppyDisk {
    constructor(size = 360 * 1024) {
        this.size = size;                    // Disk size in bytes
        this.sectorsPerTrack = 9;           // Sectors per track
        this.tracksPerSide = 80;            // Tracks per side (0-79)
        this.sides = 2;                     // Double-sided

        this.totalSectors = this.tracksPerSide * this.sectorsPerTrack * this.sides;
        this.sectorSize = Math.floor(this.size / this.totalSectors); // 512 bytes typically

        // Disk data storage
        this.data = new Uint8Array(this.size);

        // Disk geometry
        this.geometry = {
            tracks: this.tracksPerSide,
            sectors: this.sectorsPerTrack,
            sides: this.sides,
            sectorSize: this.sectorSize
        };

        // Disk state
        this.inserted = false;
        this.writeProtected = false;
        this.modified = false;

        // Initialize with empty filesystem
        this.format();
    }

    /**
     * Format the disk with empty filesystem
     */
    format() {
        this.data.fill(0);

        // Write boot sector (simplified)
        this.writeSector(0, 0, 0, this.createBootSector());

        // Initialize FAT (simplified)
        this.initializeFAT();

        // Initialize root directory
        this.initializeRootDirectory();

        this.modified = false;
    }

    /**
     * Create a simple boot sector
     * @returns {Uint8Array} Boot sector data
     */
    createBootSector() {
        const boot = new Uint8Array(this.sectorSize);

        // Jump instruction
        boot[0] = 0xEB;  // JMP
        boot[1] = 0x3C;  // Offset
        boot[2] = 0x90;  // NOP

        // OEM name
        const oemName = 'ORION128';
        for (let i = 0; i < oemName.length && i < 8; i++) {
            boot[3 + i] = oemName.charCodeAt(i);
        }

        // BIOS Parameter Block (simplified)
        boot[11] = 0x00;  // Sector size low (512)
        boot[12] = 0x02;  // Sector size high
        boot[13] = this.sectorsPerTrack;  // Sectors per cluster
        boot[14] = 0x01;  // Reserved sectors low
        boot[15] = 0x00;  // Reserved sectors high
        boot[16] = this.sides;  // Number of FATs
        boot[17] = 0x00;  // Root entries low
        boot[18] = 0x00;  // Root entries high
        boot[19] = 0x00;  // Total sectors low
        boot[20] = 0x00;  // Total sectors high
        boot[21] = 0xF8;  // Media descriptor

        return boot;
    }

    /**
     * Initialize File Allocation Table (simplified)
     */
    initializeFAT() {
        // FAT starts at sector 1
        const fatStart = this.sectorSize;
        const fatSize = this.sectorsPerTrack * this.sectorSize; // One track for FAT

        // Mark first two entries as reserved/end of chain
        this.data[fatStart] = 0xF8;  // Media descriptor
        this.data[fatStart + 1] = 0xFF;  // End of chain
        this.data[fatStart + 2] = 0xFF;  // End of chain

        // Rest of FAT is free (0x00)
        for (let i = fatStart + 3; i < fatStart + fatSize; i++) {
            this.data[i] = 0x00;
        }
    }

    /**
     * Initialize root directory
     */
    initializeRootDirectory() {
        // Root directory starts after FAT
        const rootStart = this.sectorSize + (this.sectorsPerTrack * this.sectorSize);
        const rootSize = this.sectorsPerTrack * this.sectorSize; // One track for root

        // Clear root directory
        for (let i = rootStart; i < rootStart + rootSize; i++) {
            this.data[i] = 0x00;
        }
    }

    /**
     * Read a sector from the disk
     * @param {number} track - Track number (0-79)
     * @param {number} sector - Sector number (0-8)
     * @param {number} side - Side number (0-1)
     * @returns {Uint8Array} Sector data
     */
    readSector(track, sector, side) {
        const sectorAddress = this.calculateSectorAddress(track, sector, side);
        return this.data.slice(sectorAddress, sectorAddress + this.sectorSize);
    }

    /**
     * Write a sector to the disk
     * @param {number} track - Track number (0-79)
     * @param {number} sector - Sector number (0-8)
     * @param {number} side - Side number (0-1)
     * @param {Uint8Array} data - Data to write (must be sectorSize bytes)
     */
    writeSector(track, sector, side, data) {
        if (data.length !== this.sectorSize) {
            throw new Error(`Data size must be ${this.sectorSize} bytes`);
        }

        if (this.writeProtected) {
            throw new Error('Disk is write protected');
        }

        const sectorAddress = this.calculateSectorAddress(track, sector, side);
        this.data.set(data, sectorAddress);
        this.modified = true;
    }

    /**
     * Calculate physical address of a sector
     * @param {number} track - Track number
     * @param {number} sector - Sector number
     * @param {number} side - Side number
     * @returns {number} Byte address
     */
    calculateSectorAddress(track, sector, side) {
        if (track >= this.tracksPerSide || sector >= this.sectorsPerTrack || side >= this.sides) {
            throw new Error('Invalid track, sector, or side');
        }

        return (track * this.sectorsPerTrack * this.sides + side * this.sectorsPerTrack + sector) * this.sectorSize;
    }

    /**
     * Read data from logical sector number
     * @param {number} sectorNum - Logical sector number
     * @returns {Uint8Array} Sector data
     */
    readLogicalSector(sectorNum) {
        const track = Math.floor(sectorNum / (this.sectorsPerTrack * this.sides));
        const remaining = sectorNum % (this.sectorsPerTrack * this.sides);
        const side = Math.floor(remaining / this.sectorsPerTrack);
        const sector = remaining % this.sectorsPerTrack;

        return this.readSector(track, sector, side);
    }

    /**
     * Write data to logical sector number
     * @param {number} sectorNum - Logical sector number
     * @param {Uint8Array} data - Data to write
     */
    writeLogicalSector(sectorNum, data) {
        const track = Math.floor(sectorNum / (this.sectorsPerTrack * this.sides));
        const remaining = sectorNum % (this.sectorsPerTrack * this.sides);
        const side = Math.floor(remaining / this.sectorsPerTrack);
        const sector = remaining % this.sectorsPerTrack;

        this.writeSector(track, sector, side, data);
    }

    /**
     * Get disk information
     * @returns {object} Disk information
     */
    getInfo() {
        return {
            size: this.size,
            inserted: this.inserted,
            writeProtected: this.writeProtected,
            modified: this.modified,
            geometry: {...this.geometry}
        };
    }

    /**
     * Insert/eject disk
     * @param {boolean} inserted - Whether disk is inserted
     */
    setInserted(inserted) {
        this.inserted = inserted;
    }

    /**
     * Set write protection
     * @param {boolean} writeProtected - Whether disk is write protected
     */
    setWriteProtected(writeProtected) {
        this.writeProtected = writeProtected;
    }

    /**
     * Save disk to file (for persistence)
     * @returns {Uint8Array} Disk data
     */
    save() {
        return new Uint8Array(this.data);
    }

    /**
     * Load disk from data
     * @param {Uint8Array} data - Disk data
     */
    load(data) {
        if (data.length !== this.size) {
            throw new Error(`Invalid disk size: expected ${this.size}, got ${data.length}`);
        }

        this.data.set(data);
        this.inserted = true;
        this.modified = false;
    }
}

class Storage {
    constructor() {
        // Two floppy disk drives
        this.drives = [
            new FloppyDisk(),
            new FloppyDisk()
        ];

        // Currently selected drive
        this.currentDrive = 0;

        // Drive status
        this.motorRunning = false;
        this.motorTimeout = null;

        // I/O registers
        this.registers = {
            status: 0x00,      // Drive status
            data: 0x00,        // Data register
            sector: 0x00,      // Sector register
            track: 0x00,       // Track register
            side: 0x00,        // Side register
            command: 0x00      // Command register
        };
    }

    /**
     * Select a drive
     * @param {number} drive - Drive number (0 or 1)
     */
    selectDrive(drive) {
        if (drive >= 0 && drive < this.drives.length) {
            this.currentDrive = drive;
        }
    }

    /**
     * Get current drive
     * @returns {FloppyDisk} Current drive
     */
    getCurrentDrive() {
        return this.drives[this.currentDrive];
    }

    /**
     * Read from I/O register
     * @param {number} reg - Register address
     * @returns {number} Register value
     */
    readRegister(reg) {
        const drive = this.getCurrentDrive();

        switch (reg) {
            case 0x00: // Status register
                let status = 0x00;
                if (drive.inserted) status |= 0x01;        // Disk inserted
                if (!drive.writeProtected) status |= 0x02;  // Not write protected
                if (this.motorRunning) status |= 0x04;     // Motor running
                if (drive.modified) status |= 0x08;        // Disk modified
                return status;

            case 0x01: // Data register
                return this.registers.data;

            case 0x02: // Sector register
                return this.registers.sector;

            case 0x03: // Track register
                return this.registers.track;

            case 0x04: // Side register
                return this.registers.side;

            default:
                return 0x00;
        }
    }

    /**
     * Write to I/O register
     * @param {number} reg - Register address
     * @param {number} value - Value to write
     */
    writeRegister(reg, value) {
        switch (reg) {
            case 0x00: // Command register
                this.executeCommand(value);
                break;

            case 0x01: // Data register
                this.registers.data = value;
                break;

            case 0x02: // Sector register
                this.registers.sector = value;
                break;

            case 0x03: // Track register
                this.registers.track = value;
                break;

            case 0x04: // Side register
                this.registers.side = value & 0x01;
                break;
        }
    }

    /**
     * Execute a disk command
     * @param {number} command - Command byte
     */
    executeCommand(command) {
        const drive = this.getCurrentDrive();

        switch (command & 0x0F) {
            case 0x00: // Motor on
                this.motorOn();
                break;

            case 0x01: // Motor off
                this.motorOff();
                break;

            case 0x02: // Seek to track
                this.seek(this.registers.track);
                break;

            case 0x03: // Read sector
                this.readSector();
                break;

            case 0x04: // Write sector
                this.writeSector();
                break;

            case 0x05: // Format track
                this.formatTrack();
                break;

            case 0x06: // Read multiple sectors
                this.readMultiple();
                break;

            case 0x07: // Write multiple sectors
                this.writeMultiple();
                break;
        }
    }

    /**
     * Turn motor on
     */
    motorOn() {
        this.motorRunning = true;

        // Auto-turn off after 5 seconds of inactivity
        if (this.motorTimeout) {
            clearTimeout(this.motorTimeout);
        }

        this.motorTimeout = setTimeout(() => {
            this.motorOff();
        }, 5000);
    }

    /**
     * Turn motor off
     */
    motorOff() {
        this.motorRunning = false;
        if (this.motorTimeout) {
            clearTimeout(this.motorTimeout);
            this.motorTimeout = null;
        }
    }

    /**
     * Seek to track
     * @param {number} track - Target track
     */
    seek(track) {
        if (!this.motorRunning) {
            this.motorOn();
        }

        // Simulate seek time (track * 10ms)
        setTimeout(() => {
            this.registers.track = track;
        }, track * 10);
    }

    /**
     * Read a sector
     */
    readSector() {
        if (!this.motorRunning || !this.getCurrentDrive().inserted) {
            return;
        }

        try {
            const data = this.getCurrentDrive().readSector(
                this.registers.track,
                this.registers.sector,
                this.registers.side
            );

            // Copy data to processor-accessible location
            // In a real implementation, this would use DMA or programmed I/O
            this.sectorBuffer = data;

        } catch (error) {
            console.error('Disk read error:', error);
        }
    }

    /**
     * Write a sector
     */
    writeSector() {
        if (!this.motorRunning || !this.getCurrentDrive().inserted) {
            return;
        }

        try {
            // In a real implementation, data would come from processor memory
            const data = new Uint8Array(this.getCurrentDrive().geometry.sectorSize);

            this.getCurrentDrive().writeSector(
                this.registers.track,
                this.registers.sector,
                this.registers.side,
                data
            );

        } catch (error) {
            console.error('Disk write error:', error);
        }
    }

    /**
     * Format current track
     */
    formatTrack() {
        if (!this.motorRunning || !this.getCurrentDrive().inserted) {
            return;
        }

        try {
            const drive = this.getCurrentDrive();

            for (let sector = 0; sector < drive.geometry.sectors; sector++) {
                const emptySector = new Uint8Array(drive.geometry.sectorSize);
                drive.writeSector(drive.registers.track, sector, drive.registers.side, emptySector);
            }

        } catch (error) {
            console.error('Disk format error:', error);
        }
    }

    /**
     * Read multiple sectors
     */
    readMultiple() {
        // Simplified implementation
        this.readSector();
    }

    /**
     * Write multiple sectors
     */
    writeMultiple() {
        // Simplified implementation
        this.writeSector();
    }

    /**
     * Insert a disk image into a drive
     * @param {number} drive - Drive number (0 or 1)
     * @param {Uint8Array} data - Disk image data
     */
    insertDisk(drive, data) {
        if (drive >= 0 && drive < this.drives.length) {
            this.drives[drive].load(data);
        }
    }

    /**
     * Eject disk from drive
     * @param {number} drive - Drive number (0 or 1)
     * @returns {Uint8Array|null} Disk data if disk was modified, null otherwise
     */
    ejectDisk(drive) {
        if (drive >= 0 && drive < this.drives.length) {
            const disk = this.drives[drive];
            if (disk.modified) {
                const data = disk.save();
                disk.setInserted(false);
                return data;
            }
            disk.setInserted(false);
        }
        return null;
    }

    /**
     * Get drive status
     * @param {number} drive - Drive number (0 or 1)
     * @returns {object} Drive status
     */
    getDriveStatus(drive) {
        if (drive >= 0 && drive < this.drives.length) {
            return this.drives[drive].getInfo();
        }
        return null;
    }

    /**
     * Save all modified disks to files
     * @returns {object} Object with drive numbers as keys and disk data as values
     */
    saveDisks() {
        const result = {};

        for (let i = 0; i < this.drives.length; i++) {
            if (this.drives[i].modified) {
                result[i] = this.drives[i].save();
            }
        }

        return result;
    }

    /**
     * Load disk images from files
     * @param {object} disks - Object with drive numbers as keys and disk data as values
     */
    loadDisks(disks) {
        for (const driveNum in disks) {
            const drive = parseInt(driveNum);
            if (drive >= 0 && drive < this.drives.length) {
                this.drives[drive].load(disks[drive]);
            }
        }
    }

    /**
     * Get storage system status
     * @returns {object} System status
     */
    getStatus() {
        return {
            currentDrive: this.currentDrive,
            motorRunning: this.motorRunning,
            drives: [
                this.getDriveStatus(0),
                this.getDriveStatus(1)
            ]
        };
    }

    /**
     * Reset storage system
     */
    reset() {
        this.motorOff();
        this.registers = {
            status: 0x00,
            data: 0x00,
            sector: 0x00,
            track: 0x00,
            side: 0x00,
            command: 0x00
        };
    }
}

module.exports = Storage;