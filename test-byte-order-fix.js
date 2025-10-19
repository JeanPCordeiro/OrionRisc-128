/**
 * Test Byte Order Fix for OrionRisc-128
 * Verifies that the MMU byte order fix resolves PC corruption issues
 */

const RiscProcessor = require('./src/emulation/cpu/RiscProcessor');
const MemoryManagementUnit = require('./src/emulation/memory/MemoryManagementUnit');
const OperatingSystemKernel = require('./src/system/os/OperatingSystemKernel');

class ByteOrderTest {
    constructor() {
        console.log('🔧 Testing Byte Order Fix...');
    }

    /**
     * Create a test program with word-aligned memory accesses
     */
    createTestProgram() {
        // Create a simple program that uses only word-aligned memory accesses
        const instructions = [
            0x01000000, // LOAD R0, [R0 + 0x00] - Load from address 0x00 (word-aligned)
            0x05000000, // SYSCALL - Print character in R0
            0x02000004, // STORE R0, [R0 + 0x04] - Store to address 0x04 (word-aligned)
            0x01010004, // LOAD R1, [R0 + 0x04] - Load from address 0x04 (word-aligned)
            0x05000000, // SYSCALL - Print character in R0 again
            0xFF000000  // HALT
        ];

        // Convert to bytes (big-endian format)
        const byteData = [];
        for (let i = 0; i < instructions.length; i++) {
            const instruction = instructions[i];
            byteData.push((instruction >> 24) & 0xFF); // MSB
            byteData.push((instruction >> 16) & 0xFF);
            byteData.push((instruction >> 8) & 0xFF);
            byteData.push(instruction & 0xFF);        // LSB
        }

        console.log(`📝 Created test program: ${instructions.length} instructions (${byteData.length} bytes)`);
        console.log(`   Instructions: ${instructions.map(i => `0x${i.toString(16)}`).join(', ')}`);
        console.log(`   Byte data: [${byteData.map(b => `0x${b.toString(16)}`).join(', ')}]`);

        return {
            instructions: instructions,
            byteData: byteData,
            name: 'byte-order-test'
        };
    }

    /**
     * Test the system with our corrected program
     */
    async testByteOrderFix() {
        console.log('\n🚀 Starting Byte Order Fix Test...');

        try {
            // Create hardware components
            const mmu = new MemoryManagementUnit();
            const cpu = new RiscProcessor(mmu);
            const os = new OperatingSystemKernel(cpu, mmu);

            // Initialize system
            console.log('\n📋 Initializing system...');
            const initResult = os.initialize();
            if (!initResult) {
                throw new Error('System initialization failed');
            }

            // Create and load test program
            console.log('\n💾 Loading test program...');
            const testProgram = this.createTestProgram();
            const loadResult = os.loadProgram(testProgram.byteData, testProgram.name);

            if (!loadResult) {
                throw new Error('Program loading failed');
            }

            // Check initial state
            console.log('\n🔍 Initial state:');
            console.log(`   PC: 0x${cpu.getProgramCounter().toString(16)}`);
            console.log(`   CPU Running: ${cpu.isRunning}`);
            console.log(`   CPU Halted: ${cpu.isHalted}`);

            // Execute program
            console.log('\n▶️  Executing program...');
            const executeResult = os.executeProgram(testProgram.name);

            console.log('\n📊 Execution Results:');
            console.log(`   Execute result: ${executeResult}`);
            console.log(`   Final PC: 0x${cpu.getProgramCounter().toString(16)}`);
            console.log(`   CPU Running: ${cpu.isRunning}`);
            console.log(`   CPU Halted: ${cpu.isHalted}`);

            // Check if corruption occurred
            if (cpu.getProgramCounter() === 0x41) {
                console.log('\n❌ PC CORRUPTION STILL DETECTED!');
                console.log('   Program Counter was set to 0x41 (ASCII \'A\')');
                return false;
            } else {
                console.log('\n✅ No PC corruption detected!');
                console.log(`   Final PC: 0x${cpu.getProgramCounter().toString(16)}`);
                return true;
            }

        } catch (error) {
            console.error('\n💥 Test failed with error:', error.message);
            return false;
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const byteOrderTest = new ByteOrderTest();

    console.log('='.repeat(60));
    console.log('BYTE ORDER FIX VERIFICATION TEST');
    console.log('='.repeat(60));

    byteOrderTest.testByteOrderFix().then(success => {
        console.log('\n' + '='.repeat(60));
        console.log('BYTE ORDER TEST COMPLETE');
        console.log('='.repeat(60));

        if (success) {
            console.log('\n🎉 Byte order fix verified! System is working correctly.');
        } else {
            console.log('\n❌ Byte order fix needs more work.');
        }

        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('\n💥 Test session failed:', error.message);
        process.exit(1);
    });
}

module.exports = ByteOrderTest;