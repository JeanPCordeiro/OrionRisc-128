/**
 * OrionRisc-128 Floppy Disk Controller - Disk Image Tests
 *
 * Comprehensive test suite for disk image management functionality
 */

const DiskImage = require('./disk-image');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class DiskImageTest {
    constructor() {
        this.diskImage = new DiskImage();
        this.testDir = path.join(os.tmpdir(), 'orion-fdc-test');
        this.testDiskPath = path.join(this.testDir, 'test-disk.img');
    }

    /**
     * Run all disk image tests
     */
    async runAllTests() {
        console.log('💾 Running Disk Image Tests...\n');

        try {
            await this.setupTestEnvironment();
            await this.testDiskCreation();
            await this.testDiskMounting();
            await this.testSectorOperations();
            await this.testMultipleDrives();
            await this.testDiskValidation();
            await this.testErrorConditions();
            await this.cleanupTestEnvironment();

            console.log('✅ All disk image tests passed!\n');

        } catch (error) {
            console.error('❌ Disk image tests failed:', error);
            throw error;
        }
    }

    /**
     * Set up test environment
     */
    async setupTestEnvironment() {
        console.log('Setting up disk image test environment...');

        // Create test directory
        await fs.mkdir(this.testDir, { recursive: true });

        console.log('✅ Test environment ready');
    }

    /**
     * Test disk creation
     */
    async testDiskCreation() {
        console.log('Testing disk creation...');

        // Test 360KB disk creation
        const created360KB = await this.diskImage.createBlankDisk(this.testDiskPath, false);
        if (!created360KB) {
            throw new Error('Failed to create 360KB disk');
        }

        // Verify file exists and has correct size
        const stats = await fs.stat(this.testDiskPath);
        if (stats.size !== 368640) { // 360KB in bytes
            throw new Error(`Incorrect 360KB disk size: ${stats.size}`);
        }

        // Test 720KB disk creation
        const test720KBPath = path.join(this.testDir, 'test-720kb-disk.img');
        const created720KB = await this.diskImage.createBlankDisk(test720KBPath, true);
        if (!created720KB) {
            throw new Error('Failed to create 720KB disk');
        }

        // Verify 720KB file size
        const stats720KB = await fs.stat(test720KBPath);
        if (stats720KB.size !== 737280) { // 720KB in bytes
            throw new Error(`Incorrect 720KB disk size: ${stats720KB.size}`);
        }

        console.log('✅ Disk creation tests passed');
    }

    /**
     * Test disk mounting and unmounting
     */
    async testDiskMounting() {
        console.log('Testing disk mounting...');

        // Test mounting 360KB disk
        const mounted = await this.diskImage.mountDisk('A:', this.testDiskPath);
        if (!mounted) {
            throw new Error('Failed to mount disk to drive A:');
        }

        // Verify drive is mounted
        if (!this.diskImage.isDriveMounted('A:')) {
            throw new Error('Drive A: not properly mounted');
        }

        // Test getting disk buffer
        const diskBuffer = this.diskImage.getDiskBuffer('A:');
        if (!diskBuffer) {
            throw new Error('Failed to get disk buffer for drive A:');
        }

        if (diskBuffer.length !== 368640) {
            throw new Error(`Incorrect disk buffer size: ${diskBuffer.length}`);
        }

        // Test unmounting
        const unmounted = await this.diskImage.unmountDisk('A:');
        if (!unmounted) {
            throw new Error('Failed to unmount drive A:');
        }

        // Verify drive is unmounted
        if (this.diskImage.isDriveMounted('A:')) {
            throw new Error('Drive A: still mounted after unmount');
        }

        console.log('✅ Disk mounting tests passed');
    }

    /**
     * Test sector operations through disk image interface
     */
    async testSectorOperations() {
        console.log('Testing sector operations through disk image...');

        // Mount test disk
        await this.diskImage.mountDisk('A:', this.testDiskPath);

        // Create test data
        const testData = Buffer.alloc(512);
        for (let i = 0; i < testData.length; i++) {
            testData[i] = (i * 5) % 256;
        }

        // Test writing sector
        const writeSuccess = this.diskImage.writeSector('A:', 0, 1, testData);
        if (!writeSuccess) {
            throw new Error('Failed to write sector through disk image');
        }

        // Test reading sector back
        const readData = this.diskImage.readSector('A:', 0, 1);
        if (!readData) {
            throw new Error('Failed to read sector through disk image');
        }

        // Verify data integrity
        for (let i = 0; i < 512; i++) {
            if (readData[i] !== testData[i]) {
                throw new Error(`Sector data mismatch at byte ${i}: expected ${testData[i]}, got ${readData[i]}`);
            }
        }

        // Test writing to different track/sector
        const track5Sector3 = Buffer.alloc(512);
        for (let i = 0; i < track5Sector3.length; i++) {
            track5Sector3[i] = (i * 7) % 256;
        }

        const writeSuccess2 = this.diskImage.writeSector('A:', 5, 3, track5Sector3);
        if (!writeSuccess2) {
            throw new Error('Failed to write to track 5, sector 3');
        }

        const readData2 = this.diskImage.readSector('A:', 5, 3);
        if (!readData2) {
            throw new Error('Failed to read from track 5, sector 3');
        }

        for (let i = 0; i < 512; i++) {
            if (readData2[i] !== track5Sector3[i]) {
                throw new Error(`Track 5 sector 3 data mismatch at byte ${i}`);
            }
        }

        // Unmount disk
        await this.diskImage.unmountDisk('A:');

        console.log('✅ Sector operations tests passed');
    }

    /**
     * Test multiple drive operations
     */
    async testMultipleDrives() {
        console.log('Testing multiple drive operations...');

        // Create second test disk
        const testDiskBPath = path.join(this.testDir, 'test-disk-b.img');
        await this.diskImage.createBlankDisk(testDiskBPath, false);

        // Mount both drives
        await this.diskImage.mountDisk('A:', this.testDiskPath);
        await this.diskImage.mountDisk('B:', testDiskBPath);

        // Verify both drives are mounted
        if (!this.diskImage.isDriveMounted('A:') || !this.diskImage.isDriveMounted('B:')) {
            throw new Error('Failed to mount both drives');
        }

        // Write different data to each drive
        const dataA = Buffer.alloc(512, 0xAA);
        const dataB = Buffer.alloc(512, 0xBB);

        this.diskImage.writeSector('A:', 0, 1, dataA);
        this.diskImage.writeSector('B:', 0, 1, dataB);

        // Read back and verify
        const readA = this.diskImage.readSector('A:', 0, 1);
        const readB = this.diskImage.readSector('B:', 0, 1);

        if (!readA.every(byte => byte === 0xAA)) {
            throw new Error('Drive A data corrupted');
        }

        if (!readB.every(byte => byte === 0xBB)) {
            throw new Error('Drive B data corrupted');
        }

        // Test drive information
        const mountedDrives = this.diskImage.getMountedDrives();
        if (!mountedDrives['A:'] || !mountedDrives['B:']) {
            throw new Error('Drive information not available');
        }

        if (mountedDrives['A:'].path !== this.testDiskPath) {
            throw new Error('Incorrect drive A path in drive info');
        }

        if (mountedDrives['B:'].path !== testDiskBPath) {
            throw new Error('Incorrect drive B path in drive info');
        }

        // Unmount both drives
        await this.diskImage.unmountDisk('A:');
        await this.diskImage.unmountDisk('B:');

        console.log('✅ Multiple drive tests passed');
    }

    /**
     * Test disk validation
     */
    async testDiskValidation() {
        console.log('Testing disk validation...');

        // Test valid disk
        const validDiskPath = path.join(this.testDir, 'valid-disk.img');
        await this.diskImage.createBlankDisk(validDiskPath, false);

        const mounted = await this.diskImage.mountDisk('A:', validDiskPath);
        if (!mounted) {
            throw new Error('Valid disk should mount successfully');
        }

        await this.diskImage.unmountDisk('A:');

        // Test invalid disk size
        const invalidDiskPath = path.join(this.testDir, 'invalid-disk.img');
        const invalidBuffer = Buffer.alloc(1024); // Wrong size
        await fs.writeFile(invalidDiskPath, invalidBuffer);

        const invalidMounted = await this.diskImage.mountDisk('A:', invalidDiskPath);
        if (invalidMounted) {
            throw new Error('Invalid disk should not mount');
        }

        console.log('✅ Disk validation tests passed');
    }

    /**
     * Test error conditions
     */
    async testErrorConditions() {
        console.log('Testing error conditions...');

        // Test mounting non-existent file
        const nonExistentMounted = await this.diskImage.mountDisk('A:', '/non/existent/file.img');
        if (nonExistentMounted) {
            throw new Error('Non-existent file should not mount');
        }

        // Test mounting to invalid drive
        const invalidDriveMounted = await this.diskImage.mountDisk('C:', this.testDiskPath);
        if (invalidDriveMounted) {
            throw new Error('Invalid drive should not be mountable');
        }

        // Test operations on unmounted drive
        const readUnmounted = this.diskImage.readSector('A:', 0, 1);
        if (readUnmounted !== null) {
            throw new Error('Reading from unmounted drive should return null');
        }

        const writeUnmounted = this.diskImage.writeSector('A:', 0, 1, Buffer.alloc(512));
        if (writeUnmounted) {
            throw new Error('Writing to unmounted drive should fail');
        }

        // Test unmounting unmounted drive
        const unmountUnmounted = await this.diskImage.unmountDisk('A:');
        if (unmountUnmounted) {
            throw new Error('Unmounting unmounted drive should fail');
        }

        console.log('✅ Error condition tests passed');
    }

    /**
     * Clean up test environment
     */
    async cleanupTestEnvironment() {
        console.log('Cleaning up disk image test environment...');

        // Unmount all drives
        await this.diskImage.unmountAllDrives();

        // Remove test files
        try {
            await fs.rm(this.testDir, { recursive: true, force: true });
        } catch (error) {
            console.warn('Failed to clean up test directory:', error.message);
        }

        console.log('✅ Test environment cleaned up');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new DiskImageTest();
    test.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = DiskImageTest;