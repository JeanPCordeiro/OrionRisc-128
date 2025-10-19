/**
 * OrionRisc-128 Floppy Disk Controller - File Operations Tests
 *
 * Comprehensive test suite for high-level file operations
 */

const FileOperations = require('./file-operations');
const FAT12FileSystem = require('./fat12-filesystem');
const SectorOperations = require('./sector-operations');

class FileOperationsTest {
    constructor() {
        this.fileOps = new FileOperations();
        this.fat12 = new FAT12FileSystem();
        this.sectorOps = new SectorOperations();
        this.testDiskBuffer = null;
    }

    /**
     * Run all file operations tests
     */
    async runAllTests() {
        console.log('📄 Running File Operations Tests...\n');

        try {
            await this.setupTestEnvironment();
            await this.testFileCreation();
            await this.testFileReading();
            await this.testFileWriting();
            await this.testFileDeletion();
            await this.testDirectoryListing();
            await this.testFileInfo();
            await this.testFreeSpace();
            await this.testErrorConditions();
            await this.cleanupTestEnvironment();

            console.log('✅ All file operations tests passed!\n');

        } catch (error) {
            console.error('❌ File operations tests failed:', error);
            throw error;
        }
    }

    /**
     * Set up test environment
     */
    async setupTestEnvironment() {
        console.log('Setting up file operations test environment...');

        // Create test disk buffer
        this.testDiskBuffer = Buffer.alloc(368640); // 360KB

        // Initialize FAT12 file system
        this.fat12.initializeFileSystem(this.testDiskBuffer);

        console.log('✅ File operations test environment ready');
    }

    /**
     * Test file creation
     */
    async testFileCreation() {
        console.log('Testing file creation...');

        // Test creating a simple file
        const handle = this.fileOps.openFile(this.testDiskBuffer, 'TEST.TXT', 'w');
        if (!handle) {
            throw new Error('Failed to create file');
        }

        // Write some data
        const testData = Buffer.from('Hello, World!');
        console.log(`Writing ${testData.length} bytes: ${testData.toString()}`);
        const bytesWritten = this.fileOps.writeFile(handle, testData);
        console.log(`Bytes written: ${bytesWritten}`);
        if (bytesWritten === null || bytesWritten <= 0) {
            throw new Error('Failed to write data to file');
        }

        // Close file
        const closed = this.fileOps.closeFile(handle);
        if (!closed) {
            throw new Error('Failed to close file');
        }

        // Verify file was created in directory
        const files = this.fileOps.listFiles(this.testDiskBuffer);
        const testFile = files.find(f => f.name === 'TEST.TXT');

        if (!testFile) {
            throw new Error('File not found in directory after creation');
        }

        if (testFile.size !== testData.length) {
            throw new Error(`File size incorrect: expected ${testData.length}, got ${testFile.size}`);
        }

        console.log('✅ File creation tests passed');
    }

    /**
     * Test file reading
     */
    async testFileReading() {
        console.log('Testing file reading...');

        // First, create a test file with known content
        const handle = this.fileOps.openFile(this.testDiskBuffer, 'READTEST.TXT', 'w');
        const originalData = Buffer.from('This is test data for reading operations.');
        this.fileOps.writeFile(handle, originalData);
        this.fileOps.closeFile(handle);

        // Now read the file back
        const readHandle = this.fileOps.openFile(this.testDiskBuffer, 'READTEST.TXT', 'r');
        if (!readHandle) {
            throw new Error('Failed to open file for reading');
        }

        const readData = this.fileOps.readFile(readHandle, originalData.length);
        if (!readData) {
            throw new Error('Failed to read file data');
        }

        // Verify data integrity
        if (readData.length !== originalData.length) {
            throw new Error(`Read data length mismatch: expected ${originalData.length}, got ${readData.length}`);
        }

        for (let i = 0; i < originalData.length; i++) {
            if (readData[i] !== originalData[i]) {
                throw new Error(`Data mismatch at byte ${i}: expected ${originalData[i]}, got ${readData[i]}`);
            }
        }

        this.fileOps.closeFile(readHandle);

        console.log('✅ File reading tests passed');
    }

    /**
     * Test file writing and appending
     */
    async testFileWriting() {
        console.log('Testing file writing...');

        // Create file and write initial data
        const handle = this.fileOps.openFile(this.testDiskBuffer, 'WRITETEST.BIN', 'w');
        if (!handle) {
            throw new Error('Failed to create WRITETEST.BIN');
        }

        const initialData = Buffer.from('Initial content');
        const initialWritten = this.fileOps.writeFile(handle, initialData);
        if (initialWritten === null || initialWritten <= 0) {
            throw new Error('Failed to write initial data');
        }

        // Write more data (simulating append)
        const appendData = Buffer.from('Appended content');
        const appendWritten = this.fileOps.writeFile(handle, appendData);
        if (appendWritten === null || appendWritten <= 0) {
            throw new Error('Failed to write append data');
        }

        this.fileOps.closeFile(handle);

        // Read back and verify
        const readHandle = this.fileOps.openFile(this.testDiskBuffer, 'WRITETEST.BIN', 'r');
        if (!readHandle) {
            console.log('Available files:', this.fileOps.listFiles(this.testDiskBuffer).map(f => f.name));
            throw new Error('Failed to open WRITETEST.BIN for reading');
        }

        const totalLength = initialData.length + appendData.length;
        const readData = this.fileOps.readFile(readHandle, totalLength);

        if (readData.length !== totalLength) {
            throw new Error('Written data length incorrect');
        }

        // Check initial content
        for (let i = 0; i < initialData.length; i++) {
            if (readData[i] !== initialData[i]) {
                throw new Error(`Initial data mismatch at byte ${i}`);
            }
        }

        // Check appended content
        for (let i = 0; i < appendData.length; i++) {
            if (readData[i + initialData.length] !== appendData[i]) {
                throw new Error(`Appended data mismatch at byte ${i}`);
            }
        }

        this.fileOps.closeFile(readHandle);

        console.log('✅ File writing tests passed');
    }

    /**
     * Test file deletion
     */
    async testFileDeletion() {
        console.log('Testing file deletion...');

        // Create a file to delete
        const handle = this.fileOps.openFile(this.testDiskBuffer, 'DELETE.TMP', 'w');
        this.fileOps.writeFile(handle, Buffer.from('File to be deleted'));
        this.fileOps.closeFile(handle);

        // Verify file exists
        const filesBefore = this.fileOps.listFiles(this.testDiskBuffer);
        const fileExists = filesBefore.some(f => f.name === 'DELETE.TMP');
        if (!fileExists) {
            throw new Error('File to delete was not created');
        }

        // Delete the file
        const deleted = this.fileOps.deleteFile(this.testDiskBuffer, 'DELETE.TMP');
        if (!deleted) {
            throw new Error('Failed to delete file');
        }

        // Verify file no longer exists
        const filesAfter = this.fileOps.listFiles(this.testDiskBuffer);
        const fileStillExists = filesAfter.some(f => f.name === 'DELETE.TMP');
        if (fileStillExists) {
            throw new Error('File still exists after deletion');
        }

        console.log('✅ File deletion tests passed');
    }

    /**
     * Test directory listing
     */
    async testDirectoryListing() {
        console.log('Testing directory listing...');

        // Create multiple test files
        const testFiles = [
            'FILE1.TXT',
            'FILE2.DAT',
            'PROGRAM.COM',
            'DATA.BIN'
        ];

        for (const filename of testFiles) {
            const handle = this.fileOps.openFile(this.testDiskBuffer, filename, 'w');
            this.fileOps.writeFile(handle, Buffer.from(`Content of ${filename}`));
            this.fileOps.closeFile(handle);
        }

        // List directory
        const files = this.fileOps.listFiles(this.testDiskBuffer);

        // Verify all files are listed
        for (const expectedFile of testFiles) {
            const found = files.some(f => f.name === expectedFile);
            if (!found) {
                throw new Error(`File ${expectedFile} not found in directory listing`);
            }
        }

        // Verify file count
        if (files.length < testFiles.length) {
            throw new Error(`Directory listing incomplete: expected at least ${testFiles.length} files, got ${files.length}`);
        }

        // Test file info retrieval
        const fileInfo = this.fileOps.getFileInfo(this.testDiskBuffer, 'FILE1.TXT');
        if (!fileInfo) {
            throw new Error('Failed to get file info');
        }

        if (fileInfo.filename !== 'FILE1') {
            throw new Error('File info has incorrect filename');
        }

        console.log('✅ Directory listing tests passed');
    }

    /**
     * Test free space calculation
     */
    async testFreeSpace() {
        console.log('Testing free space calculation...');

        const freeSpace = this.fileOps.getFreeSpace(this.testDiskBuffer);
        if (!freeSpace) {
            throw new Error('Failed to get free space information');
        }

        // Should have free space available
        if (freeSpace.freeBytes <= 0) {
            throw new Error('No free space reported');
        }

        if (freeSpace.totalBytes <= 0) {
            throw new Error('Invalid total bytes');
        }

        if (freeSpace.freeClusters <= 0) {
            throw new Error('No free clusters reported');
        }

        // Create a file and verify free space decreases
        const handle = this.fileOps.openFile(this.testDiskBuffer, 'FREESPACE.TST', 'w');
        this.fileOps.writeFile(handle, Buffer.alloc(1024)); // 1KB file
        this.fileOps.closeFile(handle);

        const freeSpaceAfter = this.fileOps.getFreeSpace(this.testDiskBuffer);
        if (freeSpaceAfter.freeBytes >= freeSpace.freeBytes) {
            throw new Error('Free space should have decreased after creating file');
        }

        console.log('✅ Free space tests passed');
    }

    /**
     * Test error conditions
     */
    async testErrorConditions() {
        console.log('Testing file operations error conditions...');

        // Test opening non-existent file for reading
        const readHandle = this.fileOps.openFile(this.testDiskBuffer, 'NONEXISTENT.TXT', 'r');
        if (readHandle !== null) {
            throw new Error('Should not be able to open non-existent file for reading');
        }

        // Test opening file for writing when disk is full (simulate)
        // This is hard to test without actually filling the disk

        // Test reading from invalid handle
        const invalidData = this.fileOps.readFile(99999, 100);
        if (invalidData !== null) {
            throw new Error('Should not be able to read from invalid handle');
        }

        // Test writing to invalid handle
        const invalidWrite = this.fileOps.writeFile(99999, Buffer.from('test'));
        if (invalidWrite !== null) {
            throw new Error('Should not be able to write to invalid handle');
        }

        // Test deleting non-existent file
        const deleteNonExistent = this.fileOps.deleteFile(this.testDiskBuffer, 'NONEXISTENT.DEL');
        if (deleteNonExistent) {
            throw new Error('Should not be able to delete non-existent file');
        }

        console.log('✅ Error condition tests passed');
    }

    /**
     * Clean up test environment
     */
    async cleanupTestEnvironment() {
        console.log('Cleaning up file operations test environment...');

        // Close all open files
        this.fileOps.closeAllFiles();
        this.testDiskBuffer = null;

        console.log('✅ File operations test environment cleaned up');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new FileOperationsTest();
    test.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = FileOperationsTest;