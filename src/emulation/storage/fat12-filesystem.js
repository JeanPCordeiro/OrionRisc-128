/**
 * OrionRisc-128 Floppy Disk Controller - FAT12 File System
 *
 * Complete FAT12 file system implementation for 360KB floppy disks
 * Supports boot sector, FAT management, directory operations, and file I/O
 */

const SectorOperations = require('./sector-operations');

class FAT12FileSystem {
    constructor() {
        this.sectorOps = new SectorOperations();

        // FAT12 specifications for 360KB floppy
        this.BYTES_PER_SECTOR = 512;
        this.SECTORS_PER_CLUSTER = 1;
        this.BYTES_PER_CLUSTER = this.BYTES_PER_SECTOR * this.SECTORS_PER_CLUSTER;

        // Boot sector (sector 0)
        this.BOOT_SECTOR = 0;

        // File Allocation Tables
        this.FAT1_START_SECTOR = 1;
        this.FAT2_START_SECTOR = 4;
        this.FAT_SECTORS = 3;

        // Root directory
        this.ROOT_DIR_START_SECTOR = 7;
        this.ROOT_DIR_SECTORS = 7;
        this.ROOT_DIR_ENTRIES = 112; // 7 sectors × 512 bytes / 32 bytes per entry

        // Data area
        this.DATA_START_SECTOR = 14;
        this.TOTAL_SECTORS = 720; // 40 tracks × 9 sectors × 2 sides

        // FAT12 constants
        this.FAT12_FREE_CLUSTER = 0x000;
        this.FAT12_BAD_CLUSTER = 0xFF7;
        this.FAT12_EOF_CLUSTER = 0xFFF;

        // Directory entry size
        this.DIR_ENTRY_SIZE = 32;

        // Long filename support
        this.LAST_LONG_ENTRY = 0x40;
        this.LFN_ENTRY_SIZE = 32;
    }

    /**
     * Initialize FAT12 file system on a disk
     * @param {Buffer} diskBuffer - Disk buffer to format
     * @returns {boolean} - True if successful
     */
    initializeFileSystem(diskBuffer) {
        try {
            // Write boot sector
            this.writeBootSector(diskBuffer);

            // Initialize FAT tables
            this.initializeFAT(diskBuffer);

            // Initialize root directory
            this.initializeRootDirectory(diskBuffer);

            return true;

        } catch (error) {
            console.error('Failed to initialize FAT12 file system:', error);
            return false;
        }
    }

    /**
     * Write FAT12 boot sector
     * @param {Buffer} diskBuffer - Disk buffer
     */
    writeBootSector(diskBuffer) {
        const bootSector = Buffer.alloc(this.BYTES_PER_SECTOR);

        // Jump instruction
        bootSector.writeUInt8(0xEB, 0); // JMP
        bootSector.writeUInt8(0x3C, 1); // Offset
        bootSector.writeUInt8(0x90, 2); // NOP

        // OEM name
        bootSector.write('ORION128', 3);

        // BIOS Parameter Block
        bootSector.writeUInt16LE(this.BYTES_PER_SECTOR, 11);    // Bytes per sector
        bootSector.writeUInt8(this.SECTORS_PER_CLUSTER, 13);    // Sectors per cluster
        bootSector.writeUInt16LE(this.FAT_SECTORS, 14);         // Reserved sectors (boot + FATs)
        bootSector.writeUInt8(2, 16);                           // Number of FATs
        bootSector.writeUInt16LE(this.ROOT_DIR_ENTRIES, 17);   // Root directory entries
        bootSector.writeUInt16LE(this.TOTAL_SECTORS, 19);       // Total sectors (for small disks)
        bootSector.writeUInt8(0xF9, 21);                       // Media descriptor (3.5" floppy)
        bootSector.writeUInt16LE(this.FAT_SECTORS, 22);         // Sectors per FAT
        bootSector.writeUInt16LE(9, 24);                        // Sectors per track
        bootSector.writeUInt16LE(2, 26);                        // Number of heads (double sided)
        bootSector.writeUInt32LE(0, 28);                        // Hidden sectors
        bootSector.writeUInt32LE(0, 32);                        // Large total sectors

        // Extended BIOS Parameter Block (FAT12)
        bootSector.writeUInt8(0x00, 36); // Physical drive number
        bootSector.writeUInt8(0x00, 37); // Reserved
        bootSector.writeUInt8(0x29, 38); // Extended boot signature
        bootSector.writeUInt32LE(0x12345678, 39); // Volume serial number
        bootSector.write('ORIONRISC  ', 43); // Volume label
        bootSector.write('FAT12   ', 54); // File system type

        // Boot sector signature
        bootSector.writeUInt16LE(0xAA55, 510);

        // Write boot sector to disk
        this.sectorOps.writeSector(diskBuffer, 0, 1, bootSector);
    }

    /**
     * Initialize FAT tables
     * @param {Buffer} diskBuffer - Disk buffer
     */
    initializeFAT(diskBuffer) {
        const fatBuffer = Buffer.alloc(this.FAT_SECTORS * this.BYTES_PER_SECTOR);

        // First two FAT entries are reserved
        fatBuffer.writeUInt16LE(0xFF00, 0); // Reserved, media type
        fatBuffer.writeUInt16LE(0xFFFF, 2); // End of cluster chain marker

        // Initialize all other entries as free (0x000)
        // FAT12 entries: 3 sectors × 512 bytes = 1536 bytes
        // Each entry is 1.5 bytes, so we have (1536 * 2 / 3) = 1024 entries
        // But we need to account for the reserved entries (0 and 1)
        for (let i = 1; i < 1022; i++) { // Leave room for reserved entries
            this.writeFAT12Entry(fatBuffer, i + 1, this.FAT12_FREE_CLUSTER);
        }

        // Write FAT1
        for (let sector = 0; sector < this.FAT_SECTORS; sector++) {
            const sectorData = fatBuffer.slice(sector * this.BYTES_PER_SECTOR,
                                             (sector + 1) * this.BYTES_PER_SECTOR);
            this.sectorOps.writeSector(diskBuffer,
                this.FAT1_START_SECTOR + sector, 1, sectorData);
        }

        // Write FAT2 (copy of FAT1)
        for (let sector = 0; sector < this.FAT_SECTORS; sector++) {
            const sectorData = fatBuffer.slice(sector * this.BYTES_PER_SECTOR,
                                             (sector + 1) * this.BYTES_PER_SECTOR);
            this.sectorOps.writeSector(diskBuffer,
                this.FAT2_START_SECTOR + sector, 1, sectorData);
        }
    }

    /**
     * Initialize root directory
     * @param {Buffer} diskBuffer - Disk buffer
     */
    initializeRootDirectory(diskBuffer) {
        const rootDirBuffer = Buffer.alloc(this.ROOT_DIR_SECTORS * this.BYTES_PER_SECTOR);

        // Root directory starts empty (all entries are free)
        // Each entry is 32 bytes, initialized to 0x00

        for (let sector = 0; sector < this.ROOT_DIR_SECTORS; sector++) {
            const sectorData = rootDirBuffer.slice(sector * this.BYTES_PER_SECTOR,
                                                 (sector + 1) * this.BYTES_PER_SECTOR);
            this.sectorOps.writeSector(diskBuffer,
                this.ROOT_DIR_START_SECTOR + sector, 1, sectorData);
        }
    }

    /**
     * Read FAT12 entry (12-bit value)
     * @param {Buffer} fatBuffer - FAT buffer
     * @param {number} cluster - Cluster number (2-based)
     * @returns {number} - FAT entry value
     */
    readFAT12Entry(fatBuffer, cluster) {
        const offset = Math.floor(cluster * 1.5);

        // Validate offset is within buffer bounds
        if (offset >= fatBuffer.length - 1) {
            throw new Error(`FAT12 entry offset out of bounds: ${offset} >= ${fatBuffer.length}`);
        }

        const byte1 = fatBuffer.readUInt8(offset);
        const byte2 = fatBuffer.readUInt8(offset + 1);

        if (cluster % 2 === 0) {
            // Even cluster: use low 12 bits of byte2 + high 4 bits of byte1
            return (byte2 << 4) | (byte1 >> 4);
        } else {
            // Odd cluster: use low 4 bits of byte2 + all 8 bits of byte1
            return ((byte2 & 0x0F) << 8) | byte1;
        }
    }

    /**
     * Write FAT12 entry (12-bit value)
     * @param {Buffer} fatBuffer - FAT buffer
     * @param {number} cluster - Cluster number (2-based)
     * @param {number} value - Value to write (0x000-0xFFF)
     */
    writeFAT12Entry(fatBuffer, cluster, value) {
        const offset = Math.floor(cluster * 1.5);

        // Validate offset is within buffer bounds
        if (offset >= fatBuffer.length - 1) {
            throw new Error(`FAT12 entry offset out of bounds: ${offset} >= ${fatBuffer.length}`);
        }

        const byte1 = fatBuffer.readUInt8(offset);
        const byte2 = fatBuffer.readUInt8(offset + 1);

        if (cluster % 2 === 0) {
            // Even cluster: write to low 12 bits of byte2 + high 4 bits of byte1
            const newByte1 = (byte1 & 0xF0) | (value >> 4);
            const newByte2 = value & 0xFF;
            fatBuffer.writeUInt8(newByte1, offset);
            fatBuffer.writeUInt8(newByte2, offset + 1);
        } else {
            // Odd cluster: write to low 4 bits of byte2 + all 8 bits of byte1
            const newByte1 = value & 0xFF;
            const newByte2 = (byte2 & 0xF0) | (value >> 8);
            fatBuffer.writeUInt8(newByte1, offset);
            fatBuffer.writeUInt8(newByte2, offset + 1);
        }
    }

    /**
     * Find next free cluster in FAT
     * @param {Buffer} fatBuffer - FAT buffer
     * @returns {number} - Next free cluster number or 0 if none found
     */
    findFreeCluster(fatBuffer) {
        for (let cluster = 2; cluster < (fatBuffer.length * 2 / 3); cluster++) {
            const entry = this.readFAT12Entry(fatBuffer, cluster);
            if (entry === this.FAT12_FREE_CLUSTER) {
                return cluster;
            }
        }
        return 0; // No free clusters
    }

    /**
     * Allocate cluster chain for file
     * @param {Buffer} fatBuffer - FAT buffer
     * @param {number} clusterCount - Number of clusters needed
     * @returns {number} - Starting cluster number or 0 if allocation failed
     */
    allocateClusterChain(fatBuffer, clusterCount) {
        const startCluster = this.findFreeCluster(fatBuffer);
        if (startCluster === 0) {
            return 0; // No space available
        }

        let currentCluster = startCluster;

        for (let i = 0; i < clusterCount; i++) {
            const nextCluster = (i === clusterCount - 1) ?
                this.FAT12_EOF_CLUSTER :
                this.findFreeCluster(fatBuffer);

            if (nextCluster === 0) {
                // Allocation failed, free already allocated clusters
                this.freeClusterChain(fatBuffer, startCluster);
                return 0;
            }

            this.writeFAT12Entry(fatBuffer, currentCluster, nextCluster);
            currentCluster = nextCluster;
        }

        return startCluster;
    }

    /**
     * Free cluster chain
     * @param {Buffer} fatBuffer - FAT buffer
     * @param {number} startCluster - Starting cluster of chain
     */
    freeClusterChain(fatBuffer, startCluster) {
        let cluster = startCluster;

        while (cluster < this.FAT12_EOF_CLUSTER) {
            const nextCluster = this.readFAT12Entry(fatBuffer, cluster);
            this.writeFAT12Entry(fatBuffer, cluster, this.FAT12_FREE_CLUSTER);

            if (nextCluster >= this.FAT12_EOF_CLUSTER) {
                break;
            }
            cluster = nextCluster;
        }
    }

    /**
     * Convert cluster number to sector number
     * @param {number} cluster - Cluster number (2-based)
     * @returns {number} - Sector number
     */
    clusterToSector(cluster) {
        return this.DATA_START_SECTOR + (cluster - 2) * this.SECTORS_PER_CLUSTER;
    }

    /**
     * Find directory entry by name
     * @param {Buffer} directoryBuffer - Directory buffer
     * @param {string} name - File name (8.3 format)
     * @returns {object|null} - Directory entry or null if not found
     */
    findDirectoryEntry(directoryBuffer, name) {
        const nameUpper = name.toUpperCase();

        for (let offset = 0; offset < directoryBuffer.length; offset += this.DIR_ENTRY_SIZE) {
            const entry = directoryBuffer.slice(offset, offset + this.DIR_ENTRY_SIZE);

            // Check if entry is free or end marker
            if (entry[0] === 0x00 || entry[0] === 0xE5) {
                continue;
            }

            // Extract filename and extension
            const filename = entry.toString('ascii', 0, 8).replace(/\s+$/, '');
            const extension = entry.toString('ascii', 8, 11).replace(/\s+$/, '');

            const fullName = extension ? `${filename}.${extension}` : filename;

            if (fullName === nameUpper) {
                return {
                    offset: offset,
                    entry: entry,
                    filename: filename,
                    extension: extension,
                    attributes: entry[11],
                    startCluster: entry.readUInt16LE(26),
                    fileSize: entry.readUInt32LE(28)
                };
            }
        }

        return null;
    }

    /**
     * Create directory entry
     * @param {string} filename - 8.3 filename
     * @param {number} attributes - File attributes
     * @param {number} startCluster - Starting cluster
     * @param {number} fileSize - File size in bytes
     * @returns {Buffer} - Directory entry
     */
    createDirectoryEntry(filename, attributes, startCluster, fileSize) {
        const entry = Buffer.alloc(this.DIR_ENTRY_SIZE, 0x00);

        // Parse filename
        const parts = filename.toUpperCase().split('.');
        const name = parts[0].padEnd(8, ' ');
        const extension = (parts[1] || '').padEnd(3, ' ');

        // Write filename and extension
        entry.write(name, 0, 8, 'ascii');
        entry.write(extension, 8, 3, 'ascii');

        // Write attributes
        entry.writeUInt8(attributes, 11);

        // Write starting cluster (high 2 bytes for FAT12)
        entry.writeUInt16LE(startCluster, 26);

        // Write file size
        entry.writeUInt32LE(fileSize, 28);

        return entry;
    }

    /**
     * Find free directory entry
     * @param {Buffer} directoryBuffer - Directory buffer
     * @returns {number|null} - Offset of free entry or null if none found
     */
    findFreeDirectoryEntry(directoryBuffer) {
        for (let offset = 0; offset < directoryBuffer.length; offset += this.DIR_ENTRY_SIZE) {
            const entry = directoryBuffer.slice(offset, offset + this.DIR_ENTRY_SIZE);

            // Check if entry is free (0x00) or deleted (0xE5)
            if (entry[0] === 0x00 || entry[0] === 0xE5) {
                return offset;
            }
        }

        return null; // No free entries
    }

    /**
     * Get FAT buffer from disk
     * @param {Buffer} diskBuffer - Disk buffer
     * @returns {Buffer} - FAT buffer
     */
    getFATBuffer(diskBuffer) {
        const fatBuffer = Buffer.alloc(this.FAT_SECTORS * this.BYTES_PER_SECTOR);

        // Read FAT1
        for (let sector = 0; sector < this.FAT_SECTORS; sector++) {
            const sectorData = this.sectorOps.readSector(diskBuffer,
                this.FAT1_START_SECTOR + sector, 1);
            sectorData.copy(fatBuffer, sector * this.BYTES_PER_SECTOR);
        }

        return fatBuffer;
    }

    /**
     * Write FAT buffer to disk
     * @param {Buffer} diskBuffer - Disk buffer
     * @param {Buffer} fatBuffer - FAT buffer
     */
    writeFATBuffer(diskBuffer, fatBuffer) {
        // Write FAT1
        for (let sector = 0; sector < this.FAT_SECTORS; sector++) {
            const sectorData = fatBuffer.slice(sector * this.BYTES_PER_SECTOR,
                                             (sector + 1) * this.BYTES_PER_SECTOR);
            this.sectorOps.writeSector(diskBuffer,
                this.FAT1_START_SECTOR + sector, 1, sectorData);
        }

        // Write FAT2 (copy of FAT1)
        for (let sector = 0; sector < this.FAT_SECTORS; sector++) {
            const sectorData = fatBuffer.slice(sector * this.BYTES_PER_SECTOR,
                                             (sector + 1) * this.BYTES_PER_SECTOR);
            this.sectorOps.writeSector(diskBuffer,
                this.FAT2_START_SECTOR + sector, 1, sectorData);
        }
    }
}

module.exports = FAT12FileSystem;