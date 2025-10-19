/**
 * OrionRisc-128 Floppy Disk Controller - Sector Operations
 *
 * Low-level sector read/write operations for 360KB floppy disks
 * Handles disk geometry, sector addressing, and data integrity
 *
 * Disk Specifications:
 * - 40 tracks (0-39)
 * - 9 sectors per track (1-9)
 * - 512 bytes per sector
 * - Total capacity: 360KB
 */

class SectorOperations {
    constructor() {
        // Disk geometry constants
        this.TRACKS_PER_DISK = 40;
        this.SECTORS_PER_TRACK = 9;
        this.BYTES_PER_SECTOR = 512;
        this.TOTAL_SECTORS = this.TRACKS_PER_DISK * this.SECTORS_PER_TRACK;

        // Sector buffer for data transfer
        this.sectorBuffer = Buffer.alloc(this.BYTES_PER_SECTOR);

        // Error detection
        this.crcTable = this.generateCRCTable();
    }

    /**
     * Convert logical sector number to track and sector
     * @param {number} logicalSector - Logical sector number (0-359)
     * @returns {object} - {track: number, sector: number}
     */
    logicalToPhysical(logicalSector) {
        if (logicalSector < 0 || logicalSector >= this.TOTAL_SECTORS) {
            throw new Error(`Invalid logical sector: ${logicalSector}`);
        }

        const track = Math.floor(logicalSector / this.SECTORS_PER_TRACK);
        const sector = (logicalSector % this.SECTORS_PER_TRACK) + 1; // Sectors 1-9

        return { track, sector };
    }

    /**
     * Convert track and sector to logical sector number
     * @param {number} track - Track number (0-39)
     * @param {number} sector - Sector number (1-9)
     * @returns {number} - Logical sector number (0-359)
     */
    physicalToLogical(track, sector) {
        if (track < 0 || track >= this.TRACKS_PER_DISK) {
            throw new Error(`Invalid track: ${track}`);
        }
        if (sector < 1 || sector > this.SECTORS_PER_TRACK) {
            throw new Error(`Invalid sector: ${sector}`);
        }

        return (track * this.SECTORS_PER_TRACK) + (sector - 1);
    }

    /**
     * Calculate disk offset for given track and sector
     * @param {number} track - Track number (0-39)
     * @param {number} sector - Sector number (1-9)
     * @returns {number} - Byte offset in disk image
     */
    calculateOffset(track, sector) {
        return this.physicalToLogical(track, sector) * this.BYTES_PER_SECTOR;
    }

    /**
     * Read sector data from disk buffer
     * @param {Buffer} diskBuffer - Complete disk image buffer
     * @param {number} track - Track number (0-39)
     * @param {number} sector - Sector number (1-9)
     * @returns {Buffer} - Sector data (512 bytes)
     */
    readSector(diskBuffer, track, sector) {
        const offset = this.calculateOffset(track, sector);

        if (offset + this.BYTES_PER_SECTOR > diskBuffer.length) {
            throw new Error(`Sector read beyond disk bounds: track=${track}, sector=${sector}`);
        }

        // Copy sector data to buffer
        diskBuffer.copy(this.sectorBuffer, 0, offset, offset + this.BYTES_PER_SECTOR);

        return Buffer.from(this.sectorBuffer);
    }

    /**
     * Write sector data to disk buffer
     * @param {Buffer} diskBuffer - Complete disk image buffer
     * @param {number} track - Track number (0-39)
     * @param {number} sector - Sector number (1-9)
     * @param {Buffer} data - Data to write (512 bytes)
     */
    writeSector(diskBuffer, track, sector, data) {
        if (data.length !== this.BYTES_PER_SECTOR) {
            throw new Error(`Invalid sector data size: ${data.length} bytes (expected 512)`);
        }

        const offset = this.calculateOffset(track, sector);

        if (offset + this.BYTES_PER_SECTOR > diskBuffer.length) {
            throw new Error(`Sector write beyond disk bounds: track=${track}, sector=${sector}`);
        }

        // Write data to disk buffer
        data.copy(diskBuffer, offset);
    }

    /**
     * Verify sector data integrity using CRC
     * @param {Buffer} data - Sector data to verify
     * @returns {boolean} - True if CRC is valid
     */
    verifySectorCRC(data) {
        if (data.length !== this.BYTES_PER_SECTOR) {
            return false;
        }

        // Calculate CRC for data portion (excluding potential CRC bytes)
        const crcData = data.slice(0, this.BYTES_PER_SECTOR - 2);
        const expectedCRC = data.readUInt16LE(this.BYTES_PER_SECTOR - 2);

        const calculatedCRC = this.calculateCRC16(crcData);

        return calculatedCRC === expectedCRC;
    }

    /**
     * Format a track with empty sectors
     * @param {Buffer} diskBuffer - Complete disk image buffer
     * @param {number} track - Track number to format (0-39)
     * @returns {boolean} - True if formatting successful
     */
    formatTrack(diskBuffer, track) {
        if (track < 0 || track >= this.TRACKS_PER_DISK) {
            throw new Error(`Invalid track: ${track}`);
        }

        const emptySectorData = Buffer.alloc(this.BYTES_PER_SECTOR, 0x00);

        for (let sector = 1; sector <= this.SECTORS_PER_TRACK; sector++) {
            this.writeSector(diskBuffer, track, sector, emptySectorData);
        }

        return true;
    }

    /**
     * Format entire disk
     * @param {Buffer} diskBuffer - Complete disk image buffer
     * @returns {boolean} - True if formatting successful
     */
    formatDisk(diskBuffer) {
        for (let track = 0; track < this.TRACKS_PER_DISK; track++) {
            this.formatTrack(diskBuffer, track);
        }

        return true;
    }

    /**
     * Read multiple consecutive sectors
     * @param {Buffer} diskBuffer - Complete disk image buffer
     * @param {number} startTrack - Starting track number
     * @param {number} startSector - Starting sector number
     * @param {number} count - Number of sectors to read
     * @returns {Buffer} - Combined sector data
     */
    readMultipleSectors(diskBuffer, startTrack, startSector, count) {
        let result = Buffer.alloc(count * this.BYTES_PER_SECTOR);

        for (let i = 0; i < count; i++) {
            const track = startTrack + Math.floor((startSector + i - 1) / this.SECTORS_PER_TRACK);
            const sector = ((startSector + i - 1) % this.SECTORS_PER_TRACK) + 1;

            if (track >= this.TRACKS_PER_DISK) {
                throw new Error(`Read beyond disk bounds at sector ${i + 1}`);
            }

            const sectorData = this.readSector(diskBuffer, track, sector);
            sectorData.copy(result, i * this.BYTES_PER_SECTOR);
        }

        return result;
    }

    /**
     * Write multiple consecutive sectors
     * @param {Buffer} diskBuffer - Complete disk image buffer
     * @param {number} startTrack - Starting track number
     * @param {number} startSector - Starting sector number
     * @param {Buffer} data - Data to write (must be multiple of sector size)
     */
    writeMultipleSectors(diskBuffer, startTrack, startSector, data) {
        const sectorCount = data.length / this.BYTES_PER_SECTOR;

        if (data.length % this.BYTES_PER_SECTOR !== 0) {
            throw new Error(`Data size must be multiple of sector size (${this.BYTES_PER_SECTOR})`);
        }

        for (let i = 0; i < sectorCount; i++) {
            const track = startTrack + Math.floor((startSector + i - 1) / this.SECTORS_PER_TRACK);
            const sector = ((startSector + i - 1) % this.SECTORS_PER_TRACK) + 1;

            if (track >= this.TRACKS_PER_DISK) {
                throw new Error(`Write beyond disk bounds at sector ${i + 1}`);
            }

            const sectorData = data.slice(i * this.BYTES_PER_SECTOR, (i + 1) * this.BYTES_PER_SECTOR);
            this.writeSector(diskBuffer, track, sector, sectorData);
        }
    }

    /**
     * Generate CRC-16 table for error detection
     * @returns {Array} - CRC lookup table
     */
    generateCRCTable() {
        const table = new Array(256);

        for (let i = 0; i < 256; i++) {
            let crc = i;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 1) ? (crc >>> 1) ^ 0xA001 : crc >>> 1;
            }
            table[i] = crc;
        }

        return table;
    }

    /**
     * Calculate CRC-16 for data buffer
     * @param {Buffer} data - Data to calculate CRC for
     * @returns {number} - 16-bit CRC value
     */
    calculateCRC16(data) {
        let crc = 0xFFFF;

        for (let i = 0; i < data.length; i++) {
            crc = this.crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }

        return crc;
    }

    /**
     * Get disk geometry information
     * @returns {object} - Disk geometry details
     */
    getDiskGeometry() {
        return {
            tracksPerDisk: this.TRACKS_PER_DISK,
            sectorsPerTrack: this.SECTORS_PER_TRACK,
            bytesPerSector: this.BYTES_PER_SECTOR,
            totalSectors: this.TOTAL_SECTORS,
            totalBytes: this.TOTAL_SECTORS * this.BYTES_PER_SECTOR
        };
    }

    /**
     * Validate track and sector numbers
     * @param {number} track - Track number to validate
     * @param {number} sector - Sector number to validate
     * @returns {boolean} - True if valid
     */
    isValidAddress(track, sector) {
        return track >= 0 && track < this.TRACKS_PER_DISK &&
               sector >= 1 && sector <= this.SECTORS_PER_TRACK;
    }
}

module.exports = SectorOperations;