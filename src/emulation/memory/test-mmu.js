/**
 * Simple test script for MemoryManagementUnit
 * Tests basic functionality to ensure MMU works correctly
 */

const { MemoryManagementUnit } = require('./index');

function testMMU() {
    console.log('Testing Memory Management Unit...\n');

    try {
        // Create MMU instance
        const mmu = new MemoryManagementUnit();

        // Test 1: Basic byte operations
        console.log('Test 1: Basic byte operations');
        mmu.writeByte(0x0000, 0x42);
        const byteValue = mmu.readByte(0x0000);
        console.log(`  Write 0x42 to 0x0000, read back: 0x${byteValue.toString(16)} ${byteValue === 0x42 ? '✓' : '✗'}`);

        // Test 2: Word operations
        console.log('Test 2: Word operations');
        mmu.writeWord(0x0004, 0xDEADBEEF);
        const wordValue = mmu.readWord(0x0004);
        console.log(`  Write 0xDEADBEEF to 0x0004, read back: 0x${wordValue.toString(16)} ${wordValue === 0xDEADBEEF ? '✓' : '✗'}`);

        // Test 3: Bulk memory load
        console.log('Test 3: Bulk memory load');
        const testData = [0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF];
        mmu.loadMemory(0x0100, testData);
        const loadedData = mmu.dumpMemory(0x0100, testData.length);
        const loadSuccess = testData.every((value, index) => value === loadedData[index]);
        console.log(`  Loaded ${testData.length} bytes at 0x0100: ${loadSuccess ? '✓' : '✗'}`);

        // Test 4: Memory statistics
        console.log('Test 4: Memory statistics');
        const stats = mmu.getMemoryStats();
        console.log(`  Total: ${stats.totalBytes} bytes, Used: ${stats.usedBytes} bytes (${stats.utilizationPercent}%)`);

        // Test 5: Address validation
        console.log('Test 5: Address validation');
        try {
            mmu.readByte(0x10000); // Should fail
            console.log('  ✗ Address validation failed - should have thrown error');
        } catch (error) {
            console.log('  ✓ Address validation working - correctly caught out of bounds access');
        }

        // Test 6: Memory-mapped I/O region
        console.log('Test 6: Memory-mapped I/O region');
        const mmioAddress = 0xF000;
        const isMMIO = mmu.isMemoryMappedIO(mmioAddress);
        console.log(`  Address 0x${mmioAddress.toString(16)} is MMIO region: ${isMMIO ? '✓' : '✗'}`);

        // Test 7: Word alignment validation
        console.log('Test 7: Word alignment validation');
        try {
            mmu.writeWord(0x0001, 0x12345678); // Should fail - unaligned
            console.log('  ✗ Word alignment validation failed - should have thrown error');
        } catch (error) {
            console.log('  ✓ Word alignment validation working - correctly caught unaligned access');
        }

        console.log('\nAll tests completed!');

    } catch (error) {
        console.error(`Test failed with error: ${error.message}`);
        console.error(error.stack);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testMMU();
}

module.exports = { testMMU };