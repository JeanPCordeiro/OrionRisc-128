/**
 * OrionRisc-128 Floppy Disk Controller - File Operations
 *
 * High-level file system operations for FAT12 file system
 * Provides file I/O, directory management, and file system utilities
 */

const FAT12FileSystem = require('./fat12-filesystem');
const SectorOperations = require('./sector-operations');

class FileOperations {
    constructor() {
        this.fat12 = new FAT12FileSystem();
        this.sectorOps = new SectorOperations();

        // File attributes
        this.ATTR_READ_ONLY = 0x01;
        this.ATTR_HIDDEN = 0x02;
        this.ATTR_SYSTEM = 0x04;
        this.ATTR_VOLUME_ID = 0x08;
        this.ATTR_DIRECTORY = 0x10;
        this.ATTR_ARCHIVE = 0x20;
        this.ATTR_LONG_NAME = 0x0F;

        // Open files tracking
        this.openFiles = new Map(); // fileHandle -> fileInfo
        this.nextFileHandle = 1;
    }

    /**
     * Open file for reading or writing
     * @param {Buffer} diskBuffer - Disk buffer
     * @param {string} filename - File name (8.3 format)
     * @param {string} mode - 'r' for read, 'w' for write
     * @returns {number|null} - File handle or null if error
     */
    openFile(diskBuffer, filename, mode) {
        try {
            // Find file in root directory
            const rootDirBuffer = this.readRootDirectory(diskBuffer);
            const fileEntry = this.fat12.findDirectoryEntry(rootDirBuffer, filename);

            if (mode === 'r') {
                // Read mode - file must exist
                if (!fileEntry) {
                    throw new Error(`File not found: ${filename}`);
                }

                const fileInfo = {
                    handle: this.nextFileHandle++,
                    filename: filename,
                    entry: fileEntry,
                    mode: 'r',
                    position: 0,
                    startCluster: fileEntry.startCluster,
                    fileSize: fileEntry.fileSize,
                    diskBuffer: diskBuffer // Store reference to disk buffer
                };

                this.openFiles.set(fileInfo.handle, fileInfo);
                return fileInfo.handle;

            } else if (mode === 'w') {
                // Write mode - create file if it doesn't exist
                let startCluster;

                if (fileEntry) {
                    // File exists, use existing cluster chain
                    startCluster = fileEntry.startCluster;
                    // Free existing cluster chain
                    const fatBuffer = this.fat12.getFATBuffer(diskBuffer);
                    this.fat12.freeClusterChain(fatBuffer, startCluster);
                } else {
                    // Create new file - need to allocate cluster
                    const fatBuffer = this.fat12.getFATBuffer(diskBuffer);
                    startCluster = this.fat12.findFreeCluster(fatBuffer);

                    if (startCluster === 0) {
                        throw new Error('No free clusters available');
                    }

                    // Mark cluster as EOF in FAT
                    this.fat12.writeFAT12Entry(fatBuffer, startCluster, this.fat12.FAT12_EOF_CLUSTER);
                    this.fat12.writeFATBuffer(diskBuffer, fatBuffer);

                    // Create directory entry
                    const dirEntry = this.fat12.createDirectoryEntry(filename, 0, startCluster, 0);
                    const freeOffset = this.fat12.findFreeDirectoryEntry(rootDirBuffer);

                    if (freeOffset === null) {
                        throw new Error('Root directory is full');
                    }

                    dirEntry.copy(rootDirBuffer, freeOffset, 0, this.fat12.DIR_ENTRY_SIZE);
                    this.writeRootDirectory(diskBuffer, rootDirBuffer);

                    startCluster = startCluster;
                }

                const fileInfo = {
                    handle: this.nextFileHandle++,
                    filename: filename,
                    mode: 'w',
                    position: 0,
                    startCluster: startCluster,
                    fileSize: 0,
                    diskBuffer: diskBuffer // Store reference to disk buffer
                };

                this.openFiles.set(fileInfo.handle, fileInfo);
                return fileInfo.handle;
            }

            throw new Error(`Invalid mode: ${mode}`);

        } catch (error) {
            console.error(`Failed to open file ${filename}:`, error.message);
            return null;
        }
    }

    /**
     * Close file
     * @param {number} handle - File handle
     * @returns {boolean} - True if closed successfully
     */
    closeFile(handle) {
        if (!this.openFiles.has(handle)) {
            return false;
        }

        this.openFiles.delete(handle);
        return true;
    }

    /**
     * Read data from file
     * @param {number} handle - File handle
     * @param {number} length - Number of bytes to read
     * @returns {Buffer|null} - Data read or null if error
     */
    readFile(handle, length) {
        try {
            const fileInfo = this.openFiles.get(handle);
            if (!fileInfo || fileInfo.mode !== 'r') {
                throw new Error('File not open for reading');
            }

            if (fileInfo.position >= fileInfo.fileSize) {
                return Buffer.alloc(0); // EOF
            }

            const bytesToRead = Math.min(length, fileInfo.fileSize - fileInfo.position);
            const result = Buffer.alloc(bytesToRead);

            let bytesRead = 0;
            let currentCluster = fileInfo.startCluster;
            let clusterOffset = fileInfo.position;

            // Navigate to correct cluster and offset
            while (bytesRead < bytesToRead && currentCluster < 0xFFF) {
                const sector = this.fat12.clusterToSector(currentCluster);
                const sectorData = this.sectorOps.readSector(fileInfo.diskBuffer, sector, 1);

                const clusterStart = Math.floor(clusterOffset / this.fat12.BYTES_PER_CLUSTER) * this.fat12.BYTES_PER_CLUSTER;
                const offsetInCluster = clusterOffset % this.fat12.BYTES_PER_CLUSTER;
                const bytesFromCluster = Math.min(bytesToRead - bytesRead, this.fat12.BYTES_PER_CLUSTER - offsetInCluster);

                sectorData.copy(result, bytesRead, offsetInCluster, offsetInCluster + bytesFromCluster);

                bytesRead += bytesFromCluster;
                fileInfo.position += bytesFromCluster;
                clusterOffset += bytesFromCluster;

                // Move to next cluster if needed
                if (clusterOffset >= this.fat12.BYTES_PER_CLUSTER && bytesRead < bytesToRead) {
                    const fatBuffer = this.fat12.getFATBuffer(fileInfo.diskBuffer);
                    currentCluster = this.fat12.readFAT12Entry(fatBuffer, currentCluster);
                    clusterOffset = 0;
                }
            }

            return result;

        } catch (error) {
            console.error(`Failed to read file handle ${handle}:`, error.message);
            return null;
        }
    }

    /**
     * Write data to file
     * @param {number} handle - File handle
     * @param {Buffer} data - Data to write
     * @returns {number|null} - Number of bytes written or null if error
     */
    writeFile(handle, data) {
        try {
            if (!data) {
                throw new Error('Data parameter is undefined or null');
            }

            const fileInfo = this.openFiles.get(handle);
            if (!fileInfo || fileInfo.mode !== 'w') {
                throw new Error('File not open for writing');
            }

            // This is a simplified implementation - in a full implementation,
            // we'd need to handle cluster allocation, FAT updates, etc.
            // For now, we'll just write to the allocated cluster

            const bytesToWrite = Math.min(data.length, this.fat12.BYTES_PER_CLUSTER);
            const sector = this.fat12.clusterToSector(fileInfo.startCluster);

            // Read existing sector data
            const existingData = this.sectorOps.readSector(fileInfo.diskBuffer, sector, 1);

            // For simplicity, we'll pad the data to sector size if needed
            // In a full implementation, we'd handle multiple clusters properly
            let writeData;
            if (bytesToWrite < this.fat12.BYTES_PER_SECTOR) {
                // Pad data to sector size for this simplified implementation
                writeData = Buffer.alloc(this.fat12.BYTES_PER_SECTOR);
                data.copy(writeData, 0, 0, bytesToWrite);
            } else {
                writeData = data.slice(0, bytesToWrite);
            }

            this.sectorOps.writeSector(fileInfo.diskBuffer, sector, 1, writeData);

            fileInfo.position += bytesToWrite;
            if (fileInfo.position > fileInfo.fileSize) {
                fileInfo.fileSize = fileInfo.position;

                // Update file size in directory entry
                this.updateFileSizeInDirectory(fileInfo);
            }

            return bytesToWrite;

        } catch (error) {
            console.error(`Failed to write file handle ${handle}:`, error.message);
            return null;
        }
    }

    /**
     * List files in root directory
     * @param {Buffer} diskBuffer - Disk buffer
     * @returns {Array} - Array of file information objects
     */
    listFiles(diskBuffer) {
        try {
            const rootDirBuffer = this.readRootDirectory(diskBuffer);
            const files = [];

            for (let offset = 0; offset < rootDirBuffer.length; offset += this.fat12.DIR_ENTRY_SIZE) {
                const entry = rootDirBuffer.slice(offset, offset + this.fat12.DIR_ENTRY_SIZE);

                // Skip free entries
                if (entry[0] === 0x00) {
                    continue;
                }

                // Extract filename and extension
                const filename = entry.toString('ascii', 0, 8).replace(/\s+$/, '');
                const extension = entry.toString('ascii', 8, 11).replace(/\s+$/, '');

                if (filename) {
                    const fullName = extension ? `${filename}.${extension}` : filename;

                    files.push({
                        name: fullName,
                        size: entry.readUInt32LE(28),
                        attributes: entry[11],
                        startCluster: entry.readUInt16LE(26),
                        isDirectory: (entry[11] & this.ATTR_DIRECTORY) !== 0
                    });
                }
            }

            return files;

        } catch (error) {
            console.error('Failed to list files:', error.message);
            return [];
        }
    }

    /**
     * Delete file
     * @param {Buffer} diskBuffer - Disk buffer
     * @param {string} filename - File name to delete
     * @returns {boolean} - True if deleted successfully
     */
    deleteFile(diskBuffer, filename) {
        try {
            const rootDirBuffer = this.readRootDirectory(diskBuffer);
            const fileEntry = this.fat12.findDirectoryEntry(rootDirBuffer, filename);

            if (!fileEntry) {
                throw new Error(`File not found: ${filename}`);
            }

            // Free cluster chain
            const fatBuffer = this.fat12.getFATBuffer(diskBuffer);
            this.fat12.freeClusterChain(fatBuffer, fileEntry.startCluster);
            this.fat12.writeFATBuffer(diskBuffer, fatBuffer);

            // Mark directory entry as deleted
            rootDirBuffer[fileEntry.offset] = 0xE5;
            this.writeRootDirectory(diskBuffer, rootDirBuffer);

            return true;

        } catch (error) {
            console.error(`Failed to delete file ${filename}:`, error.message);
            return false;
        }
    }

    /**
     * Get file information
     * @param {Buffer} diskBuffer - Disk buffer
     * @param {string} filename - File name
     * @returns {object|null} - File information or null if not found
     */
    getFileInfo(diskBuffer, filename) {
        try {
            const rootDirBuffer = this.readRootDirectory(diskBuffer);
            const fileEntry = this.fat12.findDirectoryEntry(rootDirBuffer, filename);

            return fileEntry;

        } catch (error) {
            console.error(`Failed to get file info for ${filename}:`, error.message);
            return null;
        }
    }

    /**
     * Read root directory from disk
     * @param {Buffer} diskBuffer - Disk buffer
     * @returns {Buffer} - Root directory buffer
     */
    readRootDirectory(diskBuffer) {
        const rootDirBuffer = Buffer.alloc(this.fat12.ROOT_DIR_SECTORS * this.fat12.BYTES_PER_SECTOR);

        for (let sector = 0; sector < this.fat12.ROOT_DIR_SECTORS; sector++) {
            const sectorData = this.sectorOps.readSector(diskBuffer,
                this.fat12.ROOT_DIR_START_SECTOR + sector, 1);
            sectorData.copy(rootDirBuffer, sector * this.fat12.BYTES_PER_SECTOR);
        }

        return rootDirBuffer;
    }

    /**
     * Write root directory to disk
     * @param {Buffer} diskBuffer - Disk buffer
     * @param {Buffer} rootDirBuffer - Root directory buffer
     */
    writeRootDirectory(diskBuffer, rootDirBuffer) {
        for (let sector = 0; sector < this.fat12.ROOT_DIR_SECTORS; sector++) {
            const sectorData = rootDirBuffer.slice(sector * this.fat12.BYTES_PER_SECTOR,
                                                 (sector + 1) * this.fat12.BYTES_PER_SECTOR);
            this.sectorOps.writeSector(diskBuffer,
                this.fat12.ROOT_DIR_START_SECTOR + sector, 1, sectorData);
        }
    }

    /**
     * Update file size in directory entry
     * @param {object} fileInfo - File information object
     */
    updateFileSizeInDirectory(fileInfo) {
        try {
            // Read root directory
            const rootDirBuffer = this.readRootDirectory(fileInfo.diskBuffer);

            // Find the file entry
            const entryOffset = this.findFileEntryOffset(rootDirBuffer, fileInfo.filename);
            if (entryOffset === null) {
                console.error(`Could not find directory entry for ${fileInfo.filename}`);
                return;
            }

            // Update file size in directory entry
            const entry = rootDirBuffer.slice(entryOffset, entryOffset + 32);
            entry.writeUInt32LE(fileInfo.fileSize, 28);

            // Write back to disk
            this.writeRootDirectory(fileInfo.diskBuffer, rootDirBuffer);

            console.log(`File size updated: ${fileInfo.filename} = ${fileInfo.fileSize} bytes`);

        } catch (error) {
            console.error(`Failed to update file size for ${fileInfo.filename}:`, error.message);
        }
    }

    /**
     * Find file entry offset in root directory
     * @param {Buffer} rootDirBuffer - Root directory buffer
     * @param {string} filename - File name to find
     * @returns {number|null} - Entry offset or null if not found
     */
    findFileEntryOffset(rootDirBuffer, filename) {
        for (let offset = 0; offset < rootDirBuffer.length; offset += 32) {
            const entry = rootDirBuffer.slice(offset, offset + 32);

            // Skip free entries
            if (entry[0] === 0x00 || entry[0] === 0xE5) {
                continue;
            }

            // Extract filename and extension
            const entryFilename = entry.toString('ascii', 0, 8).replace(/\s+$/, '');
            const extension = entry.toString('ascii', 8, 11).replace(/\s+$/, '');
            const fullName = extension ? `${entryFilename}.${extension}` : entryFilename;

            if (fullName === filename.toUpperCase()) {
                return offset;
            }
        }

        return null;
    }

    /**
     * Get free space on disk
     * @param {Buffer} diskBuffer - Disk buffer
     * @returns {object} - Free space information
     */
    getFreeSpace(diskBuffer) {
        try {
            const fatBuffer = this.fat12.getFATBuffer(diskBuffer);
            let freeClusters = 0;
            let badClusters = 0;

            // Count free and bad clusters (skip first 2 reserved entries)
            for (let cluster = 2; cluster < (fatBuffer.length * 2 / 3); cluster++) {
                const entry = this.fat12.readFAT12Entry(fatBuffer, cluster);

                if (entry === this.fat12.FAT12_FREE_CLUSTER) {
                    freeClusters++;
                } else if (entry === this.fat12.FAT12_BAD_CLUSTER) {
                    badClusters++;
                }
            }

            const totalClusters = (fatBuffer.length * 2 / 3) - 2;
            const usedClusters = totalClusters - freeClusters - badClusters;

            return {
                totalBytes: totalClusters * this.fat12.BYTES_PER_CLUSTER,
                freeBytes: freeClusters * this.fat12.BYTES_PER_CLUSTER,
                usedBytes: usedClusters * this.fat12.BYTES_PER_CLUSTER,
                totalClusters: totalClusters,
                freeClusters: freeClusters,
                usedClusters: usedClusters,
                badClusters: badClusters
            };

        } catch (error) {
            console.error('Failed to get free space:', error.message);
            return null;
        }
    }

    /**
     * Close all open files
     */
    closeAllFiles() {
        this.openFiles.clear();
    }

    /**
     * Get list of open files
     * @returns {Array} - Array of open file information
     */
    getOpenFiles() {
        return Array.from(this.openFiles.values()).map(info => ({
            handle: info.handle,
            filename: info.filename,
            mode: info.mode,
            position: info.position,
            size: info.fileSize || 0
        }));
    }
}

module.exports = FileOperations;