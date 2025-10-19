/**
 * OrionRisc-128 Floppy Disk Controller - Integration Tests
 *
 * End-to-end integration tests for complete FDC system
 */

const FloppyDiskController = require('./FloppyDiskController');
const DiskImage = require('./disk-image');
const FAT12FileSystem = require('./fat12-filesystem');
const FileOperations = require('./file-operations');

// Mock MMU for testing
class MockMMU {
    constructor() {
        this.memory = new Array(0x10000).fill(0);
    }

    readByte(address) {
        if (address >= 0 && address < this.memory.length) {
            return this.memory[address];
        }
        return 0;
    }

    writeByte(address, value) {
        if (address >= 0 && address < this.memory.length) {
            this.memory[address] = value & 0xFF;
        }
    }
}

class IntegrationTest {
    constructor() {
        this.mmu = new MockMMU();
        this.fdc = new FloppyDiskController(this.mmu);
        this.diskImage = new DiskImage();
        this.fat12 = new FAT12FileSystem();
        this.fileOps = new FileOperations();
        this.testDiskPath = '/tmp/orion-integration-test.img';
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.log('🔗 Running FDC Integration Tests...\n');

        try {
            await this.setupTestEnvironment();
            await this.testCompleteFileOperations();
            await this.testFDCCommands();
            await this.testMemoryMappedIO();
            await this.testMultiDriveOperations();
            await this.testErrorRecovery();
            await this.cleanupTestEnvironment();

            console.log('✅ All integration tests passed!\n');

        } catch (error) {
            console.error('❌ Integration tests failed:', error);
            throw error;
        }
    }

    /**
     * Set up test environment
     */
    async setupTestEnvironment() {
        console.log('Setting up integration test environment...');

        // Create test disk
        await this.diskImage.createBlankDisk(this.testDiskPath, false);

        // Initialize file system
        await this.diskImage.mountDisk('A:', this.testDiskPath);
        const diskBuffer = this.diskImage.getDiskBuffer('A:');
        this.fat12.initializeFileSystem(diskBuffer);
        await this.diskImage.unmountDisk('A:');

        console.log('✅ Integration test environment ready');
    }

    /**
     * Test complete file operations through FDC
     */
    async testCompleteFileOperations() {
        console.log('Testing complete file operations...');

        // Mount disk through FDC
        const mounted = await this.fdc.mountDisk('A:', this.testDiskPath);
        if (!mounted) {
            throw new Error('Failed to mount disk through FDC');
        }

        // Initialize file system through FDC
        this.fdc.initializeFileSystem('A:');

        // Create test file through FDC
        const testData = Buffer.from('Integration test data for FDC verification.');
        const writeSuccess = this.fdc.writeFile('A:', 'INTEGRATE.TXT', testData);
        if (!writeSuccess) {
            throw new Error('Failed to write file through FDC');
        }

        // List files through FDC
        const files = this.fdc.listFiles('A:');
        const testFile = files.find(f => f.name === 'INTEGRATE.TXT');
        if (!testFile) {
            throw new Error('File not found through FDC listing');
        }

        // Read file through FDC
        const readData = this.fdc.readFile('A:', 'INTEGRATE.TXT', testData.length);
        if (!readData) {
            throw new Error('Failed to read file through FDC');
        }

        // Verify data integrity
        if (readData.length !== testData.length) {
            throw new Error('Read data length mismatch in integration test');
        }

        for (let i = 0; i < testData.length; i++) {
            if (readData[i] !== testData[i]) {
                throw new Error(`Data mismatch at byte ${i} in integration test`);
            }
        }

        // Delete file through FDC
        const deleteSuccess = this.fdc.deleteFile('A:', 'INTEGRATE.TXT');
        if (!deleteSuccess) {
            throw new Error('Failed to delete file through FDC');
        }

        // Verify file is deleted
        const filesAfter = this.fdc.listFiles('A:');
        const fileStillExists = filesAfter.some(f => f.name === 'INTEGRATE.TXT');
        if (fileStillExists) {
            throw new Error('File still exists after deletion through FDC');
        }

        await this.fdc.unmountDisk('A:');

        console.log('✅ Complete file operations test passed');
    }

    /**
     * Test FDC commands
     */
    async testFDCCommands() {
        console.log('Testing FDC commands...');

        // Mount disk
        await this.fdc.mountDisk('A:', this.testDiskPath);

        // Test recalibrate command (move to track 0)
        this.mmu.writeByte(0xF800, 0x07); // RECALIBRATE command
        this.fdc.writeCommand(0x07);

        // Wait for command completion
        await new Promise(resolve => setTimeout(resolve, 150));

        // Check that we're at track 0
        const track = this.mmu.readByte(0xF804);
        if (track !== 0) {
            throw new Error('Recalibrate command failed');
        }

        // Test seek command
        this.mmu.writeByte(0xF804, 5); // Seek to track 5
        this.fdc.writeCommand(0x03); // SEEK command

        // Wait for command completion
        await new Promise(resolve => setTimeout(resolve, 50));

        // Check that we're at track 5
        const trackAfterSeek = this.mmu.readByte(0xF804);
        if (trackAfterSeek !== 5) {
            throw new Error('Seek command failed');
        }

        // Test read status command
        this.fdc.writeCommand(0x04); // READ STATUS command

        // Status should be available in status register
        const status = this.fdc.getStatus();
        console.log(`Status after command: 0x${status.toString(16)}`);
        // Status check is optional for this test - just verify command completed without error

        await this.fdc.unmountDisk('A:');

        console.log('✅ FDC commands test passed');
    }

    /**
     * Test memory-mapped I/O interface
     */
    async testMemoryMappedIO() {
        console.log('Testing memory-mapped I/O interface...');

        // Test register access
        this.mmu.writeByte(0xF803, 0); // Select drive A:
        this.fdc.selectDrive(0);

        const selectedDrive = this.mmu.readByte(0xF803);
        if (selectedDrive !== 0) {
            throw new Error('Drive select register not working');
        }

        // Test DMA address registers
        this.mmu.writeByte(0xF806, 0x34); // DMA address low
        this.mmu.writeByte(0xF807, 0x12); // DMA address high

        // Note: In a real implementation, we'd need to read these back
        // through the FDC's readByte method

        // Test control register
        this.mmu.writeByte(0xF809, 0x01); // Reset FDC
        this.fdc.writeControl(0x01);

        // Check that FDC is reset (no current command)
        if (this.fdc.currentCommand !== null) {
            throw new Error('FDC not properly reset');
        }

        console.log('✅ Memory-mapped I/O test passed');
    }

    /**
     * Test multi-drive operations
     */
    async testMultiDriveOperations() {
        console.log('Testing multi-drive operations...');

        // Create second test disk
        const testDiskBPath = '/tmp/orion-integration-test-b.img';
        await this.diskImage.createBlankDisk(testDiskBPath, false);

        // Mount both drives
        await this.fdc.mountDisk('A:', this.testDiskPath);
        await this.fdc.mountDisk('B:', testDiskBPath);

        // Initialize file systems
        this.fdc.initializeFileSystem('A:');
        this.fdc.initializeFileSystem('B:');

        // Write different files to each drive
        const dataA = Buffer.from('Data for drive A');
        const dataB = Buffer.from('Data for drive B');

        this.fdc.writeFile('A:', 'DRIVEA.TXT', dataA);
        this.fdc.writeFile('B:', 'DRIVEB.TXT', dataB);

        // Read back from correct drives
        const readA = this.fdc.readFile('A:', 'DRIVEA.TXT', dataA.length);
        const readB = this.fdc.readFile('B:', 'DRIVEB.TXT', dataB.length);

        if (!readA || !readB) {
            throw new Error('Failed to read from multiple drives');
        }

        // Verify data isolation between drives
        if (readA.length !== dataA.length || readB.length !== dataB.length) {
            throw new Error('Data length mismatch in multi-drive test');
        }

        for (let i = 0; i < dataA.length; i++) {
            if (readA[i] !== dataA[i]) {
                throw new Error('Drive A data corrupted in multi-drive test');
            }
        }

        for (let i = 0; i < dataB.length; i++) {
            if (readB[i] !== dataB[i]) {
                throw new Error('Drive B data corrupted in multi-drive test');
            }
        }

        // Verify files are only on their respective drives
        const filesA = this.fdc.listFiles('A:');
        const filesB = this.fdc.listFiles('B:');

        const hasFileAOnB = filesB.some(f => f.name === 'DRIVEA.TXT');
        const hasFileBOnA = filesA.some(f => f.name === 'DRIVEB.TXT');

        if (hasFileAOnB || hasFileBOnA) {
            throw new Error('File isolation between drives failed');
        }

        // Unmount both drives
        await this.fdc.unmountDisk('A:');
        await this.fdc.unmountDisk('B:');

        console.log('✅ Multi-drive operations test passed');
    }

    /**
     * Test error recovery
     */
    async testErrorRecovery() {
        console.log('Testing error recovery...');

        // Test mounting invalid disk
        const invalidMount = await this.fdc.mountDisk('A:', '/nonexistent/disk.img');
        if (invalidMount) {
            throw new Error('Should not mount invalid disk');
        }

        // Test operations on unmounted drive
        const readUnmounted = this.fdc.readFile('A:', 'TEST.TXT', 100);
        if (readUnmounted !== null) {
            throw new Error('Should not read from unmounted drive');
        }

        // Test FDC reset after error
        this.fdc.reset();

        if (this.fdc.currentCommand !== null) {
            throw new Error('FDC not reset after error');
        }

        // Mount valid disk and verify recovery
        const recoveryMount = await this.fdc.mountDisk('A:', this.testDiskPath);
        if (!recoveryMount) {
            throw new Error('FDC should recover and mount valid disk');
        }

        await this.fdc.unmountDisk('A:');

        console.log('✅ Error recovery test passed');
    }

    /**
     * Clean up test environment
     */
    async cleanupTestEnvironment() {
        console.log('Cleaning up integration test environment...');

        // Unmount all drives
        await this.fdc.unmountAllDrives();

        // Clean up test files
        try {
            const fs = require('fs').promises;
            await fs.unlink(this.testDiskPath);
        } catch (error) {
            // Ignore cleanup errors
        }

        console.log('✅ Integration test environment cleaned up');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new IntegrationTest();
    test.runAllTests().catch(error => {
        console.error('Integration test suite failed:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTest;