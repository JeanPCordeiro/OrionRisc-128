/**
 * Debug Program Counter Corruption Issue
 * Minimal test case to reproduce PC corruption where PC gets set to 0x41 (ASCII 'A')
 */

const RiscProcessor = require('./src/emulation/cpu/RiscProcessor');
const MemoryManagementUnit = require('./src/emulation/memory/MemoryManagementUnit');
const OperatingSystemKernel = require('./src/system/os/OperatingSystemKernel');

class PCCorruptionDebugger {
    constructor() {
        console.log('🔍 Initializing PC Corruption Debugger...');
    }

    /**
     * Create a minimal test program that should trigger the issue
     */
    createTestProgram() {
        // Create a program that includes LOAD/STORE operations and system calls
        // This is more likely to trigger the corruption issue

        const instructions = [
            0x01000041, // LOAD R0, [R0 + 0x41] - Load character 'A' (0x41) into R0
            0x05000000, // SYSCALL - Print character in R0 (should print 'A')
            0x02000042, // STORE R0, [R0 + 0x42] - Store 'A' to memory location 0x42
            0x01010042, // LOAD R1, [R0 + 0x42] - Load from memory location 0x42 into R1
            0x05000000, // SYSCALL - Print character in R0 again
            0xFF000000  // HALT
        ];

        // Convert to bytes (big-endian as per current implementation)
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
            name: 'pc-corruption-test-extended'
        };
    }

    /**
     * Test the system with our minimal program
     */
    async testPCCorruption() {
        console.log('\n🚀 Starting PC Corruption Test...');

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
                console.log('\n❌ PC CORRUPTION DETECTED!');
                console.log('   Program Counter was set to 0x41 (ASCII \'A\')');
                console.log('   This confirms the corruption issue');
                return false;
            } else {
                console.log('\n✅ No PC corruption detected in this test');
                console.log(`   Final PC: 0x${cpu.getProgramCounter().toString(16)}`);
                return true;
            }

        } catch (error) {
            console.error('\n💥 Test failed with error:', error.message);
            return false;
        }
    }

    /**
     * Analyze the root cause based on our findings
     */
    analyzeRootCause() {
        console.log('\n🔍 Analyzing Root Cause...');

        console.log('\n📋 Potential Issues Identified:');
        console.log('1. **Byte Order Mismatch**:');
        console.log('   - Instructions created in BIG-ENDIAN format');
        console.log('   - MMU readWord() reads in LITTLE-ENDIAN format');
        console.log('   - This causes instructions to be interpreted incorrectly');

        console.log('\n2. **Example of the Problem**:');
        console.log('   - Original instruction: 0xFF000000 (HALT)');
        console.log('   - Stored as bytes: [0xFF, 0x00, 0x00, 0x00] (big-endian)');
        console.log('   - Read back as: 0x000000FF (little-endian interpretation)');
        console.log('   - If a byte like 0x41 is misinterpreted as an opcode, PC gets corrupted');

        console.log('\n3. **The Fix**:');
        console.log('   - Option A: Change MMU readWord() to use big-endian');
        console.log('   - Option B: Change instruction creation/storage to use little-endian');
        console.log('   - Option A is safer as it maintains CPU instruction format consistency');

        return {
            likelyCause: 'Byte order mismatch between instruction creation and memory reading',
            confidence: 'High',
            recommendedFix: 'Change MMU readWord() to use big-endian format'
        };
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const pcDebugger = new PCCorruptionDebugger();

    console.log('='.repeat(60));
    console.log('PROGRAM COUNTER CORRUPTION DEBUGGER');
    console.log('='.repeat(60));

    pcDebugger.testPCCorruption().then(success => {
        const analysis = pcDebugger.analyzeRootCause();

        console.log('\n' + '='.repeat(60));
        console.log('DEBUG SESSION COMPLETE');
        console.log('='.repeat(60));

        if (!success) {
            console.log('\n🎯 Ready to implement fix for confirmed PC corruption');
        } else {
            console.log('\n❓ PC corruption not reproduced - may need different test case');
        }

        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('\n💥 Debug session failed:', error.message);
        process.exit(1);
    });
}

module.exports = PCCorruptionDebugger;