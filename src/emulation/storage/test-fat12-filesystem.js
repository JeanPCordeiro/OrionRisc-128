/**
 * OrionRisc-128 Floppy Disk Controller - FAT12 File System Tests
 *
 * Comprehensive test suite for FAT12 file system functionality
 */

const FAT12FileSystem = require('./fat12-filesystem');
const SectorOperations = require('./sector-operations');

class FAT12FileSystemTest {
    constructor() {
        this.fat12 = new FAT12FileSystem();
        this.sectorOps = new SectorOperations();
        this.testDiskBuffer = null;
    }

    /**
     * Run all FAT12 file system tests
     */
    async runAllTests() {
        console.log('📁 Running FAT12 File System Tests...\n');

        try {
            await this.setupTestEnvironment();
            await this.testFileSystemInitialization();
            await this.testFATOperations();
            await this.testDirectoryOperations();
            await this.testClusterOperations();
            await this.testBootSector();
            await this.testErrorConditions();
            await this.cleanupTestEnvironment();

            console.log('✅ All FAT12 file system tests passed!\n');

        } catch (error) {
            console.error('❌ FAT12 file system tests failed:', error);
            throw error;
        }
    }

    /**
     * Set up test environment
     */
    async setupTestEnvironment() {
        console.log('Setting up FAT12 test environment...');

        // Create test disk buffer
        this.testDiskBuffer = Buffer.alloc(368640); // 360KB

        console.log('✅ FAT12 test environment ready');
    }

    /**
     * Test file system initialization
     */
    async testFileSystemInitialization() {
        console.log('Testing file system initialization...');

        // Initialize file system
        const initialized = this.fat12.initializeFileSystem(this.testDiskBuffer);
        if (!initialized) {
            throw new Error('Failed to initialize FAT12 file system');
        }

        // Verify boot sector
        const bootSector = this.sectorOps.readSector(this.testDiskBuffer, 0, 1);
        if (bootSector.readUInt16LE(510) !== 0xAA55) {
            throw new Error('Boot sector signature not written correctly');
        }

        // Verify FAT tables
        const fat1Sector1 = this.sectorOps.readSector(this.testDiskBuffer, 1, 1);
        const fat2Sector1 = this.sectorOps.readSector(this.testDiskBuffer, 4, 1);

        // FAT should have reserved entries and end markers
        if (fat1Sector1.readUInt16LE(0) !== 0xFF00) {
            throw new Error('FAT1 reserved entry not correct');
        }

        if (fat2Sector1.readUInt16LE(0) !== 0xFF00) {
            throw new Error('FAT2 reserved entry not correct');
        }

        // Verify root directory is empty (all zeros)
        const rootDirSector = this.sectorOps.readSector(this.testDiskBuffer, 7, 1);
        if (!rootDirSector.every(byte => byte === 0x00)) {
            throw new Error('Root directory not properly initialized');
        }

        console.log('✅ File system initialization tests passed');
    }

    /**
     * Test FAT operations
     */
    async testFATOperations() {
        console.log('Testing FAT operations...');

        // Initialize FAT buffer with zeros first
        const fatBuffer = Buffer.alloc(this.fat12.FAT_SECTORS * this.fat12.BYTES_PER_SECTOR, 0x00);

        // Read FAT1 from disk
        for (let sector = 0; sector < this.fat12.FAT_SECTORS; sector++) {
            const sectorData = this.sectorOps.readSector(this.testDiskBuffer,
                this.fat12.FAT1_START_SECTOR + sector, 1);
            sectorData.copy(fatBuffer, sector * this.fat12.BYTES_PER_SECTOR);
        }

        console.log('FAT buffer initialized, first 8 bytes:', Array.from(fatBuffer.slice(0, 8)).map(b => b.toString(16)));

        // Test FAT12 entry manipulation on this buffer
        console.log('Testing FAT12 manipulation on test buffer...');
        console.log('Before write - cluster 2:', this.fat12.readFAT12Entry(fatBuffer, 2).toString(16));

        // Let's also check the raw bytes around cluster 2
        const offset = Math.floor(2 * 1.5); // 3
        console.log('Raw bytes at offset', offset, ':', fatBuffer[offset].toString(16), fatBuffer[offset + 1].toString(16));

        // Test FAT12 entry operations
        this.fat12.writeFAT12Entry(fatBuffer, 2, 0xFFF); // EOF marker
        this.fat12.writeFAT12Entry(fatBuffer, 3, 0x004); // Point to cluster 4
        this.fat12.writeFAT12Entry(fatBuffer, 4, 0x005); // Point to cluster 5
        this.fat12.writeFAT12Entry(fatBuffer, 5, 0xFFF); // EOF marker

        // Read back and verify
        const cluster2Value = this.fat12.readFAT12Entry(fatBuffer, 2);
        console.log(`Cluster 2 value: 0x${cluster2Value.toString(16)} (expected: 0xFFF)`);
        if (cluster2Value !== 0xFFF) {
            throw new Error(`FAT12 entry write/read failed for cluster 2: got 0x${cluster2Value.toString(16)}, expected 0xFFF`);
        }

        const cluster3Value = this.fat12.readFAT12Entry(fatBuffer, 3);
        console.log(`Cluster 3 value: 0x${cluster3Value.toString(16)} (expected: 0x004)`);
        if (cluster3Value !== 0x004) {
            throw new Error(`FAT12 entry write/read failed for cluster 3: got 0x${cluster3Value.toString(16)}, expected 0x004`);
        }

        const cluster4Value = this.fat12.readFAT12Entry(fatBuffer, 4);
        console.log(`Cluster 4 value: 0x${cluster4Value.toString(16)} (expected: 0x005)`);
        if (cluster4Value !== 0x005) {
            throw new Error(`FAT12 entry write/read failed for cluster 4: got 0x${cluster4Value.toString(16)}, expected 0x005`);
        }

        const cluster5Value = this.fat12.readFAT12Entry(fatBuffer, 5);
        console.log(`Cluster 5 value: 0x${cluster5Value.toString(16)} (expected: 0xFFF)`);
        if (cluster5Value !== 0xFFF) {
            throw new Error(`FAT12 entry write/read failed for cluster 5: got 0x${cluster5Value.toString(16)}, expected 0xFFF`);
        }

        // Test find free cluster
        const freeCluster = this.fat12.findFreeCluster(fatBuffer);
        if (freeCluster === 0) {
            throw new Error('Should have found free clusters');
        }

        // Test cluster allocation
        const startCluster = this.fat12.allocateClusterChain(fatBuffer, 3);
        if (startCluster === 0) {
            throw new Error('Failed to allocate cluster chain');
        }

        // Verify chain is allocated
        const chainStart = this.fat12.readFAT12Entry(fatBuffer, startCluster);
        if (chainStart === this.fat12.FAT12_FREE_CLUSTER) {
            throw new Error('Allocated cluster chain not marked as used');
        }

        // Test freeing cluster chain
        this.fat12.freeClusterChain(fatBuffer, startCluster);

        // Verify chain is freed
        const freedEntry = this.fat12.readFAT12Entry(fatBuffer, startCluster);
        if (freedEntry !== this.fat12.FAT12_FREE_CLUSTER) {
            throw new Error('Cluster chain not properly freed');
        }

        // Write FAT buffer back to disk
        for (let sector = 0; sector < this.fat12.FAT_SECTORS; sector++) {
            const sectorData = fatBuffer.slice(sector * this.fat12.BYTES_PER_SECTOR,
                                             (sector + 1) * this.fat12.BYTES_PER_SECTOR);
            this.sectorOps.writeSector(this.testDiskBuffer,
                this.fat12.FAT1_START_SECTOR + sector, 1, sectorData);
        }

        console.log('✅ FAT operations tests passed');
    }

    /**
     * Test directory operations
     */
    async testDirectoryOperations() {
        console.log('Testing directory operations...');

        // Get root directory buffer
        const rootDirBuffer = Buffer.alloc(7 * 512); // 7 sectors

        // Read current root directory from disk
        for (let sector = 0; sector < 7; sector++) {
            const sectorData = this.sectorOps.readSector(this.testDiskBuffer, 7 + sector, 1);
            sectorData.copy(rootDirBuffer, sector * 512);
        }

        // Test creating directory entry
        const testEntry = this.fat12.createDirectoryEntry('TEST    TXT', 0, 2, 1024);
        if (testEntry.length !== 32) {
            throw new Error('Directory entry has wrong size');
        }

        // Verify filename in entry
        const filename = testEntry.toString('ascii', 0, 8).replace(/\s+$/, '');
        if (filename !== 'TEST') {
            throw new Error('Filename not written correctly to directory entry');
        }

        const extension = testEntry.toString('ascii', 8, 11).replace(/\s+$/, '');
        if (extension !== 'TXT') {
            throw new Error('Extension not written correctly to directory entry');
        }

        // Test finding free directory entry
        const freeOffset = this.fat12.findFreeDirectoryEntry(rootDirBuffer);
        if (freeOffset === null) {
            throw new Error('Should have found free directory entry');
        }

        // Write test entry to root directory
        testEntry.copy(rootDirBuffer, freeOffset);

        // Write root directory back to disk
        for (let sector = 0; sector < 7; sector++) {
            const sectorData = rootDirBuffer.slice(sector * 512, (sector + 1) * 512);
            this.sectorOps.writeSector(this.testDiskBuffer, 7 + sector, 1, sectorData);
        }

        // Test finding directory entry
        const foundEntry = this.fat12.findDirectoryEntry(rootDirBuffer, 'TEST.TXT');
        if (!foundEntry) {
            throw new Error('Could not find directory entry after writing');
        }

        if (foundEntry.filename !== 'TEST') {
            throw new Error('Found entry has wrong filename');
        }

        if (foundEntry.extension !== 'TXT') {
            throw new Error('Found entry has wrong extension');
        }

        if (foundEntry.fileSize !== 1024) {
            throw new Error('Found entry has wrong file size');
        }

        console.log('✅ Directory operations tests passed');
    }

    /**
     * Test cluster to sector conversion
     */
    async testClusterOperations() {
        console.log('Testing cluster operations...');

        // Test cluster to sector conversion
        const testClusters = [
            { cluster: 2, expectedSector: 14 },
            { cluster: 3, expectedSector: 15 },
            { cluster: 10, expectedSector: 22 }
        ];

        for (const testCase of testClusters) {
            const sector = this.fat12.clusterToSector(testCase.cluster);
            if (sector !== testCase.expectedSector) {
                throw new Error(`Cluster to sector conversion failed for cluster ${testCase.cluster}: expected ${testCase.expectedSector}, got ${sector}`);
            }
        }

        // Test data area boundaries
        const firstDataSector = this.fat12.clusterToSector(2);
        if (firstDataSector !== this.fat12.DATA_START_SECTOR) {
            throw new Error('First data sector incorrect');
        }

        console.log('✅ Cluster operations tests passed');
    }

    /**
     * Test boot sector structure
     */
    async testBootSector() {
        console.log('Testing boot sector structure...');

        const bootSector = this.sectorOps.readSector(this.testDiskBuffer, 0, 1);

        // Test BIOS Parameter Block values
        if (bootSector.readUInt16LE(11) !== 512) { // Bytes per sector
            throw new Error('Bytes per sector not correct in boot sector');
        }

        if (bootSector.readUInt8(13) !== 1) { // Sectors per cluster
            throw new Error('Sectors per cluster not correct in boot sector');
        }

        if (bootSector.readUInt16LE(14) !== 5) { // Reserved sectors (boot + FATs)
            throw new Error('Reserved sectors not correct in boot sector');
        }

        if (bootSector.readUInt8(16) !== 2) { // Number of FATs
            throw new Error('Number of FATs not correct in boot sector');
        }

        if (bootSector.readUInt16LE(17) !== 112) { // Root directory entries
            throw new Error('Root directory entries not correct in boot sector');
        }

        if (bootSector.readUInt16LE(19) !== 720) { // Total sectors
            throw new Error('Total sectors not correct in boot sector');
        }

        if (bootSector.readUInt8(21) !== 0xF9) { // Media descriptor
            throw new Error('Media descriptor not correct in boot sector');
        }

        if (bootSector.readUInt16LE(22) !== 3) { // Sectors per FAT
            throw new Error('Sectors per FAT not correct in boot sector');
        }

        // Test volume label and file system type
        const volumeLabel = bootSector.toString('ascii', 43, 54).replace(/\s+$/, '');
        if (volumeLabel !== 'ORIONRISC') {
            throw new Error('Volume label not correct in boot sector');
        }

        const fsType = bootSector.toString('ascii', 54, 62).replace(/\s+$/, '');
        if (fsType !== 'FAT12') {
            throw new Error('File system type not correct in boot sector');
        }

        console.log('✅ Boot sector tests passed');
    }

    /**
     * Test error conditions
     */
    async testErrorConditions() {
        console.log('Testing FAT12 error conditions...');

        // Test invalid cluster numbers
        const fatBuffer = this.fat12.getFATBuffer(this.testDiskBuffer);

        try {
            this.fat12.readFAT12Entry(fatBuffer, 0); // Reserved cluster
            // Should not throw error, but result may be invalid
        } catch (error) {
            throw new Error('Reading reserved cluster should not throw error');
        }

        // Test cluster chain allocation with insufficient space
        // Fill up FAT with allocated clusters
        for (let cluster = 2; cluster < 10; cluster++) {
            this.fat12.writeFAT12Entry(fatBuffer, cluster, 0xFFF);
        }

        // Try to allocate more clusters than available
        const insufficientAllocation = this.fat12.allocateClusterChain(fatBuffer, 100);
        if (insufficientAllocation !== 0) {
            throw new Error('Should have failed to allocate insufficient clusters');
        }

        console.log('✅ Error condition tests passed');
    }

    /**
     * Clean up test environment
     */
    async cleanupTestEnvironment() {
        console.log('Cleaning up FAT12 test environment...');

        this.testDiskBuffer = null;

        console.log('✅ FAT12 test environment cleaned up');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new FAT12FileSystemTest();
    test.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = FAT12FileSystemTest;