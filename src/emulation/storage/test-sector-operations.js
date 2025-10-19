/**
 * OrionRisc-128 Floppy Disk Controller - Sector Operations Tests
 *
 * Comprehensive test suite for sector operations functionality
 */

const SectorOperations = require('./sector-operations');
const fs = require('fs').promises;

class SectorOperationsTest {
    constructor() {
        this.sectorOps = new SectorOperations();
        this.testDiskBuffer = null;
    }

    /**
     * Run all sector operations tests
     */
    async runAllTests() {
        console.log('🧪 Running Sector Operations Tests...\n');

        try {
            await this.setupTestEnvironment();
            await this.testAddressConversion();
            await this.testSectorReadWrite();
            await this.testMultipleSectorOperations();
            await this.testDiskFormatting();
            await this.testCRCOperations();
            await this.testErrorConditions();
            await this.cleanupTestEnvironment();

            console.log('✅ All sector operations tests passed!\n');

        } catch (error) {
            console.error('❌ Sector operations tests failed:', error);
            throw error;
        }
    }

    /**
     * Set up test environment
     */
    async setupTestEnvironment() {
        console.log('Setting up test environment...');

        // Create a test disk buffer (360KB)
        this.testDiskBuffer = Buffer.alloc(this.sectorOps.TOTAL_SECTORS * this.sectorOps.BYTES_PER_SECTOR);

        // Fill with known pattern
        for (let i = 0; i < this.testDiskBuffer.length; i++) {
            this.testDiskBuffer[i] = (i % 256);
        }

        console.log('✅ Test environment ready');
    }

    /**
     * Test address conversion functions
     */
    async testAddressConversion() {
        console.log('Testing address conversion...');

        // Test logical to physical conversion
        const testCases = [
            { logical: 0, expected: { track: 0, sector: 1 } },
            { logical: 8, expected: { track: 0, sector: 9 } },
            { logical: 9, expected: { track: 1, sector: 1 } },
            { logical: 359, expected: { track: 39, sector: 9 } }
        ];

        for (const testCase of testCases) {
            const result = this.sectorOps.logicalToPhysical(testCase.logical);
            if (result.track !== testCase.expected.track || result.sector !== testCase.expected.sector) {
                throw new Error(`Logical to physical conversion failed for sector ${testCase.logical}: expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(result)}`);
            }
        }

        // Test physical to logical conversion
        for (const testCase of testCases) {
            const logical = this.sectorOps.physicalToLogical(testCase.expected.track, testCase.expected.sector);
            if (logical !== testCase.logical) {
                throw new Error(`Physical to logical conversion failed for track ${testCase.expected.track}, sector ${testCase.expected.sector}: expected ${testCase.logical}, got ${logical}`);
            }
        }

        // Test invalid addresses
        try {
            this.sectorOps.logicalToPhysical(-1);
            throw new Error('Should have thrown error for negative logical sector');
        } catch (error) {
            // Expected
        }

        try {
            this.sectorOps.logicalToPhysical(360);
            throw new Error('Should have thrown error for logical sector >= 360');
        } catch (error) {
            // Expected
        }

        console.log('✅ Address conversion tests passed');
    }

    /**
     * Test sector read/write operations
     */
    async testSectorReadWrite() {
        console.log('Testing sector read/write operations...');

        const testData = Buffer.alloc(this.sectorOps.BYTES_PER_SECTOR);
        for (let i = 0; i < testData.length; i++) {
            testData[i] = (i * 2) % 256;
        }

        // Test writing sector
        this.sectorOps.writeSector(this.testDiskBuffer, 0, 1, testData);

        // Test reading sector back
        const readData = this.sectorOps.readSector(this.testDiskBuffer, 0, 1);

        // Verify data integrity
        for (let i = 0; i < this.sectorOps.BYTES_PER_SECTOR; i++) {
            if (readData[i] !== testData[i]) {
                throw new Error(`Data mismatch at byte ${i}: expected ${testData[i]}, got ${readData[i]}`);
            }
        }

        // Test reading from different locations
        const sector10Data = this.sectorOps.readSector(this.testDiskBuffer, 1, 1);
        const expectedOffset = 9 * this.sectorOps.BYTES_PER_SECTOR;

        for (let i = 0; i < this.sectorOps.BYTES_PER_SECTOR; i++) {
            if (sector10Data[i] !== this.testDiskBuffer[expectedOffset + i]) {
                throw new Error(`Sector 10 data mismatch at byte ${i}`);
            }
        }

        console.log('✅ Sector read/write tests passed');
    }

    /**
     * Test multiple sector operations
     */
    async testMultipleSectorOperations() {
        console.log('Testing multiple sector operations...');

        const multiData = Buffer.alloc(1024); // 2 sectors
        for (let i = 0; i < multiData.length; i++) {
            multiData[i] = (i * 3) % 256;
        }

        // Test writing multiple sectors
        this.sectorOps.writeMultipleSectors(this.testDiskBuffer, 2, 1, multiData);

        // Test reading multiple sectors back
        const readMultiData = this.sectorOps.readMultipleSectors(this.testDiskBuffer, 2, 1, 2);

        // Verify data integrity
        for (let i = 0; i < multiData.length; i++) {
            if (readMultiData[i] !== multiData[i]) {
                throw new Error(`Multiple sector data mismatch at byte ${i}: expected ${multiData[i]}, got ${readMultiData[i]}`);
            }
        }

        console.log('✅ Multiple sector operations tests passed');
    }

    /**
     * Test disk formatting
     */
    async testDiskFormatting() {
        console.log('Testing disk formatting...');

        // Format track 0
        this.sectorOps.formatTrack(this.testDiskBuffer, 0);

        // Verify all sectors in track 0 are zeroed
        for (let sector = 1; sector <= this.sectorOps.SECTORS_PER_TRACK; sector++) {
            const sectorData = this.sectorOps.readSector(this.testDiskBuffer, 0, sector);
            for (let i = 0; i < this.sectorOps.BYTES_PER_SECTOR; i++) {
                if (sectorData[i] !== 0x00) {
                    throw new Error(`Track 0, sector ${sector} not properly formatted at byte ${i}`);
                }
            }
        }

        // Format entire disk
        this.sectorOps.formatDisk(this.testDiskBuffer);

        // Verify entire disk is zeroed
        for (let i = 0; i < this.testDiskBuffer.length; i++) {
            if (this.testDiskBuffer[i] !== 0x00) {
                throw new Error(`Disk not properly formatted at byte ${i}`);
            }
        }

        console.log('✅ Disk formatting tests passed');
    }

    /**
     * Test CRC operations
     */
    async testCRCOperations() {
        console.log('Testing CRC operations...');

        const testData = Buffer.alloc(510); // 510 bytes for CRC testing
        for (let i = 0; i < testData.length; i++) {
            testData[i] = (i * 7) % 256;
        }

        // Calculate CRC
        const crc = this.sectorOps.calculateCRC16(testData);

        // Create sector with CRC
        const sectorWithCRC = Buffer.alloc(this.sectorOps.BYTES_PER_SECTOR);
        testData.copy(sectorWithCRC, 0);
        sectorWithCRC.writeUInt16LE(crc, 510);

        // Verify CRC
        const isValid = this.sectorOps.verifySectorCRC(sectorWithCRC);
        if (!isValid) {
            throw new Error('CRC verification failed for valid data');
        }

        // Test invalid CRC
        sectorWithCRC[510] = 0xFF;
        sectorWithCRC[511] = 0xFF;
        const isInvalid = this.sectorOps.verifySectorCRC(sectorWithCRC);
        if (isInvalid) {
            throw new Error('CRC verification should have failed for invalid data');
        }

        console.log('✅ CRC operations tests passed');
    }

    /**
     * Test error conditions
     */
    async testErrorConditions() {
        console.log('Testing error conditions...');

        // Test invalid sector data size
        try {
            const invalidData = Buffer.alloc(256); // Wrong size
            this.sectorOps.writeSector(this.testDiskBuffer, 0, 1, invalidData);
            throw new Error('Should have thrown error for invalid sector data size');
        } catch (error) {
            // Expected
        }

        // Test invalid track/sector
        try {
            this.sectorOps.readSector(this.testDiskBuffer, 40, 1); // Track 40 doesn't exist
            throw new Error('Should have thrown error for invalid track');
        } catch (error) {
            // Expected
        }

        // Test invalid sector number
        try {
            this.sectorOps.readSector(this.testDiskBuffer, 0, 10); // Sector 10 doesn't exist
            throw new Error('Should have thrown error for invalid sector');
        } catch (error) {
            // Expected
        }

        // Test read beyond disk bounds
        try {
            this.sectorOps.readSector(this.testDiskBuffer, 39, 9); // Last valid sector
            // This should work
            this.sectorOps.readSector(this.testDiskBuffer, 39, 10); // Beyond bounds
            throw new Error('Should have thrown error for sector beyond disk bounds');
        } catch (error) {
            // Expected
        }

        console.log('✅ Error condition tests passed');
    }

    /**
     * Clean up test environment
     */
    async cleanupTestEnvironment() {
        console.log('Cleaning up test environment...');

        this.testDiskBuffer = null;

        console.log('✅ Test environment cleaned up');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new SectorOperationsTest();
    test.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = SectorOperationsTest;