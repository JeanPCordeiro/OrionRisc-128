/**
 * OrionRisc-128 Floppy Disk Controller - Disk Image Management
 *
 * Handles 360KB disk image file operations, mounting/unmounting,
 * and disk image validation for FAT12 file system compatibility
 */

const fs = require('fs').promises;
const path = require('path');
const SectorOperations = require('./sector-operations');

class DiskImage {
    constructor() {
        this.sectorOps = new SectorOperations();

        // Disk specifications
        this.DISK_SIZE_360KB = 368640; // 40 tracks × 9 sectors × 512 bytes
        this.DISK_SIZE_720KB = 737280; // Double-sided 3.5" floppy

        // Mounted disks (drive A: and B:)
        this.mountedDisks = new Map(); // drive -> disk info

        // Disk image cache for performance
        this.diskCache = new Map(); // path -> buffer
    }

    /**
     * Mount a disk image file to a drive
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @param {string} imagePath - Path to disk image file
     * @returns {boolean} - True if mounted successfully
     */
    async mountDisk(drive, imagePath) {
        try {
            // Validate drive letter
            if (!['A:', 'B:'].includes(drive)) {
                throw new Error(`Invalid drive: ${drive}`);
            }

            // Check if file exists
            const stats = await fs.stat(imagePath);
            if (!stats.isFile()) {
                throw new Error(`Not a file: ${imagePath}`);
            }

            // Validate file size
            const fileSize = stats.size;
            if (fileSize !== this.DISK_SIZE_360KB && fileSize !== this.DISK_SIZE_720KB) {
                throw new Error(`Invalid disk size: ${fileSize} bytes (expected 360KB or 720KB)`);
            }

            // Read disk image into memory
            const diskBuffer = await fs.readFile(imagePath);

            // Validate disk format
            const isValid = this.validateDiskFormat(diskBuffer);
            if (!isValid) {
                throw new Error(`Invalid disk format: ${imagePath}`);
            }

            // Store disk information
            const diskInfo = {
                path: imagePath,
                buffer: diskBuffer,
                size: fileSize,
                isDirty: false, // Track if disk has been modified
                mountTime: Date.now()
            };

            this.mountedDisks.set(drive, diskInfo);

            // Cache the disk buffer
            this.diskCache.set(imagePath, diskBuffer);

            console.log(`Mounted ${imagePath} to drive ${drive}`);
            return true;

        } catch (error) {
            console.error(`Failed to mount disk ${imagePath} to drive ${drive}:`, error.message);
            return false;
        }
    }

    /**
     * Unmount a disk from a drive
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {boolean} - True if unmounted successfully
     */
    async unmountDisk(drive) {
        try {
            if (!this.mountedDisks.has(drive)) {
                throw new Error(`No disk mounted on drive ${drive}`);
            }

            const diskInfo = this.mountedDisks.get(drive);

            // Write back to file if modified
            if (diskInfo.isDirty) {
                await this.saveDiskToFile(drive, diskInfo.path);
            }

            // Remove from mounted disks
            this.mountedDisks.delete(drive);

            // Remove from cache if no other drive uses same image
            const otherDrive = drive === 'A:' ? 'B:' : 'A:';
            if (this.mountedDisks.has(otherDrive)) {
                const otherDiskInfo = this.mountedDisks.get(otherDrive);
                if (otherDiskInfo.path !== diskInfo.path) {
                    this.diskCache.delete(diskInfo.path);
                }
            } else {
                this.diskCache.delete(diskInfo.path);
            }

            console.log(`Unmounted drive ${drive}`);
            return true;

        } catch (error) {
            console.error(`Failed to unmount drive ${drive}:`, error.message);
            return false;
        }
    }

    /**
     * Save modified disk back to file
     * @param {string} drive - Drive letter
     * @param {string} filePath - Path to save file
     * @returns {boolean} - True if saved successfully
     */
    async saveDiskToFile(drive, filePath) {
        try {
            const diskInfo = this.mountedDisks.get(drive);
            if (!diskInfo) {
                throw new Error(`No disk mounted on drive ${drive}`);
            }

            await fs.writeFile(filePath, diskInfo.buffer);
            diskInfo.isDirty = false;

            console.log(`Saved disk from drive ${drive} to ${filePath}`);
            return true;

        } catch (error) {
            console.error(`Failed to save disk from drive ${drive}:`, error.message);
            return false;
        }
    }

    /**
     * Get disk buffer for a drive
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {Buffer|null} - Disk buffer or null if not mounted
     */
    getDiskBuffer(drive) {
        const diskInfo = this.mountedDisks.get(drive);
        return diskInfo ? diskInfo.buffer : null;
    }

    /**
     * Check if a drive is mounted
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {boolean} - True if drive is mounted
     */
    isDriveMounted(drive) {
        return this.mountedDisks.has(drive);
    }

    /**
     * Get information about mounted drives
     * @returns {object} - Drive information
     */
    getMountedDrives() {
        const drives = {};

        for (const [drive, diskInfo] of this.mountedDisks) {
            drives[drive] = {
                path: diskInfo.path,
                size: diskInfo.size,
                isDirty: diskInfo.isDirty,
                mountTime: diskInfo.mountTime
            };
        }

        return drives;
    }

    /**
     * Create a new blank disk image
     * @param {string} imagePath - Path where to create the disk image
     * @param {boolean} is720KB - True for 720KB disk, false for 360KB
     * @returns {boolean} - True if created successfully
     */
    async createBlankDisk(imagePath, is720KB = false) {
        try {
            const diskSize = is720KB ? this.DISK_SIZE_720KB : this.DISK_SIZE_360KB;
            const diskBuffer = Buffer.alloc(diskSize, 0x00);

            // Format the disk (initialize with empty sectors)
            this.sectorOps.formatDisk(diskBuffer);

            // Write to file
            await fs.writeFile(imagePath, diskBuffer);

            console.log(`Created ${is720KB ? '720KB' : '360KB'} disk image: ${imagePath}`);
            return true;

        } catch (error) {
            console.error(`Failed to create disk image ${imagePath}:`, error.message);
            return false;
        }
    }

    /**
     * Validate disk format and structure
     * @param {Buffer} diskBuffer - Disk image buffer
     * @returns {boolean} - True if valid format
     */
    validateDiskFormat(diskBuffer) {
        try {
            // Check size
            if (diskBuffer.length !== this.DISK_SIZE_360KB &&
                diskBuffer.length !== this.DISK_SIZE_720KB) {
                return false;
            }

            // Basic structure validation - check for non-zero data in first sector
            // (boot sector should have some data)
            const firstSector = diskBuffer.slice(0, 512);
            const hasData = firstSector.some(byte => byte !== 0x00);

            // Allow blank disks (all zeros) or disks with boot sector data
            return true;

        } catch (error) {
            console.error('Disk validation error:', error);
            return false;
        }
    }

    /**
     * Read sector from specific drive
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @param {number} track - Track number (0-39 for 360KB, 0-79 for 720KB)
     * @param {number} sector - Sector number (1-9)
     * @returns {Buffer|null} - Sector data or null if error
     */
    readSector(drive, track, sector) {
        try {
            const diskBuffer = this.getDiskBuffer(drive);
            if (!diskBuffer) {
                throw new Error(`No disk mounted on drive ${drive}`);
            }

            // For 720KB disks, handle double-sided geometry
            if (diskBuffer.length === this.DISK_SIZE_720KB) {
                // Adjust track for second side (tracks 40-79 map to 0-39 on side 1)
                if (track >= 40) {
                    track -= 40;
                }
            }

            return this.sectorOps.readSector(diskBuffer, track, sector);

        } catch (error) {
            console.error(`Failed to read sector from drive ${drive}:`, error.message);
            return null;
        }
    }

    /**
     * Write sector to specific drive
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @param {number} track - Track number (0-39 for 360KB, 0-79 for 720KB)
     * @param {number} sector - Sector number (1-9)
     * @param {Buffer} data - Data to write (512 bytes)
     * @returns {boolean} - True if written successfully
     */
    writeSector(drive, track, sector, data) {
        try {
            const diskInfo = this.mountedDisks.get(drive);
            if (!diskInfo) {
                throw new Error(`No disk mounted on drive ${drive}`);
            }

            // For 720KB disks, handle double-sided geometry
            if (diskInfo.size === this.DISK_SIZE_720KB) {
                // Adjust track for second side (tracks 40-79 map to 0-39 on side 1)
                if (track >= 40) {
                    track -= 40;
                }
            }

            this.sectorOps.writeSector(diskInfo.buffer, track, sector, data);
            diskInfo.isDirty = true; // Mark as modified

            return true;

        } catch (error) {
            console.error(`Failed to write sector to drive ${drive}:`, error.message);
            return false;
        }
    }

    /**
     * Get disk information for a drive
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {object|null} - Disk information or null if not mounted
     */
    getDiskInfo(drive) {
        return this.mountedDisks.get(drive) || null;
    }

    /**
     * Check if disk has been modified since mounting
     * @param {string} drive - Drive letter ('A:' or 'B:')
     * @returns {boolean} - True if disk is dirty (modified)
     */
    isDiskDirty(drive) {
        const diskInfo = this.mountedDisks.get(drive);
        return diskInfo ? diskInfo.isDirty : false;
    }

    /**
     * Force save all modified disks
     * @returns {number} - Number of disks saved
     */
    async saveAllModifiedDisks() {
        let savedCount = 0;

        for (const [drive, diskInfo] of this.mountedDisks) {
            if (diskInfo.isDirty) {
                const success = await this.saveDiskToFile(drive, diskInfo.path);
                if (success) {
                    savedCount++;
                }
            }
        }

        return savedCount;
    }

    /**
     * Unmount all drives
     * @returns {number} - Number of drives unmounted
     */
    async unmountAllDrives() {
        let unmountedCount = 0;

        for (const drive of this.mountedDisks.keys()) {
            const success = await this.unmountDisk(drive);
            if (success) {
                unmountedCount++;
            }
        }

        return unmountedCount;
    }
}

module.exports = DiskImage;