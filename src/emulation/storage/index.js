/**
 * OrionRisc-128 Floppy Disk Controller - Module Exports
 *
 * Exports all FDC components for use by other system modules
 */

// Core FDC components
const FloppyDiskController = require('./FloppyDiskController');
const DiskImage = require('./disk-image');
const FAT12FileSystem = require('./fat12-filesystem');
const FileOperations = require('./file-operations');
const SectorOperations = require('./sector-operations');

// Test modules (for development and validation)
const TestRunner = require('./test-runner');
const SectorOperationsTest = require('./test-sector-operations');
const DiskImageTest = require('./test-disk-image');
const FAT12FileSystemTest = require('./test-fat12-filesystem');
const FileOperationsTest = require('./test-file-operations');
const IntegrationTest = require('./test-integration');

module.exports = {
    // Main FDC class
    FloppyDiskController,

    // FDC sub-components
    DiskImage,
    FAT12FileSystem,
    FileOperations,
    SectorOperations,

    // Test suites
    TestRunner,
    SectorOperationsTest,
    DiskImageTest,
    FAT12FileSystemTest,
    FileOperationsTest,
    IntegrationTest
};