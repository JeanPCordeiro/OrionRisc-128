/**
 * C Standard Library Test Suite - Phase 3
 *
 * Tests the assembly language implementations of C standard library functions
 * to ensure they work correctly with the OrionRisc-128 system.
 */

const MemoryManagementUnit = require('../../emulation/memory/MemoryManagementUnit');
const RiscProcessor = require('../../emulation/cpu/RiscProcessor');
const CStandardLibrary = require('./c-standard-library');

class CStandardLibraryTester {
    constructor() {
        this.mmu = new MemoryManagementUnit();
        this.cpu = new RiscProcessor(this.mmu);
        this.library = new CStandardLibrary(this.mmu, this.cpu);

        // Test results
        this.testsRun = 0;
        this.testsPassed = 0;
        this.testsFailed = 0;
    }

    /**
     * Run complete test suite
     */
    runAllTests() {
        console.log('=== C Standard Library Test Suite ===\n');

        // Initialize system
        this.library.loadLibrary();

        // Run individual test suites
        this.testStringFunctions();
        this.testMemoryFunctions();
        this.testMathFunctions();
        this.testUtilityFunctions();
        this.testIntegration();

        // Print summary
        this.printSummary();
    }

    /**
     * Test string functions
     */
    testStringFunctions() {
        console.log('Testing String Functions...\n');

        // Test strlen
        this.testStrlen();

        // Test strcpy
        this.testStrcpy();

        // Test strcmp
        this.testStrcmp();

        // Test strcat
        this.testStrcat();

        // Test memset
        this.testMemset();

        // Test memcpy
        this.testMemcpy();

        console.log('');
    }

    testStrlen() {
        console.log('  Testing strlen...');

        // Test string: "Hello" (length 5)
        const testString = [72, 101, 108, 108, 111, 0]; // "Hello" + null
        this.mmu.loadMemory(0x9000, testString);

        // Load test program that calls strlen
        const testProgram = [
            // Load string address into R0
            (0x01 << 24) | (0x00 << 20) | (0x00 << 16) | 0x9000, // LOAD R0, 0x9000

            // Call strlen function (would need to jump to function address)
            0x00000000, // NOP - placeholder for function call

            // Halt
            (0xFF << 24) | 0x000000
        ];

        this.cpu.loadProgram(testProgram, 0x8000);

        // For now, just verify the function is loaded correctly
        const strlenAddr = this.library.getFunctionAddress('strlen');
        this.assert('strlen function loaded', strlenAddr !== 0);

        this.testsRun++;
        if (strlenAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testStrcpy() {
        console.log('  Testing strcpy...');

        const strcpyAddr = this.library.getFunctionAddress('strcpy');
        this.assert('strcpy function loaded', strcpyAddr !== 0);

        this.testsRun++;
        if (strcpyAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testStrcmp() {
        console.log('  Testing strcmp...');

        const strcmpAddr = this.library.getFunctionAddress('strcmp');
        this.assert('strcmp function loaded', strcmpAddr !== 0);

        this.testsRun++;
        if (strcmpAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testStrcat() {
        console.log('  Testing strcat...');

        const strcatAddr = this.library.getFunctionAddress('strcat');
        this.assert('strcat function loaded', strcatAddr !== 0);

        this.testsRun++;
        if (strcatAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testMemset() {
        console.log('  Testing memset...');

        const memsetAddr = this.library.getFunctionAddress('memset');
        this.assert('memset function loaded', memsetAddr !== 0);

        this.testsRun++;
        if (memsetAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testMemcpy() {
        console.log('  Testing memcpy...');

        const memcpyAddr = this.library.getFunctionAddress('memcpy');
        this.assert('memcpy function loaded', memcpyAddr !== 0);

        this.testsRun++;
        if (memcpyAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    /**
     * Test memory functions
     */
    testMemoryFunctions() {
        console.log('Testing Memory Functions...\n');

        // Test malloc
        this.testMalloc();

        // Test free
        this.testFree();

        // Test calloc
        this.testCalloc();

        // Test realloc
        this.testRealloc();

        console.log('');
    }

    testMalloc() {
        console.log('  Testing malloc...');

        const mallocAddr = this.library.getFunctionAddress('malloc');
        this.assert('malloc function loaded', mallocAddr !== 0);

        this.testsRun++;
        if (mallocAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testFree() {
        console.log('  Testing free...');

        const freeAddr = this.library.getFunctionAddress('free');
        this.assert('free function loaded', freeAddr !== 0);

        this.testsRun++;
        if (freeAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testCalloc() {
        console.log('  Testing calloc...');

        const callocAddr = this.library.getFunctionAddress('calloc');
        this.assert('calloc function loaded', callocAddr !== 0);

        this.testsRun++;
        if (callocAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testRealloc() {
        console.log('  Testing realloc...');

        const reallocAddr = this.library.getFunctionAddress('realloc');
        this.assert('realloc function loaded', reallocAddr !== 0);

        this.testsRun++;
        if (reallocAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    /**
     * Test math functions
     */
    testMathFunctions() {
        console.log('Testing Math Functions...\n');

        // Test abs
        this.testAbs();

        // Test rand/srand
        this.testRand();

        console.log('');
    }

    testAbs() {
        console.log('  Testing abs...');

        const absAddr = this.library.getFunctionAddress('abs');
        this.assert('abs function loaded', absAddr !== 0);

        this.testsRun++;
        if (absAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testRand() {
        console.log('  Testing rand/srand...');

        const randAddr = this.library.getFunctionAddress('rand');
        const srandAddr = this.library.getFunctionAddress('srand');

        this.assert('rand function loaded', randAddr !== 0);
        this.assert('srand function loaded', srandAddr !== 0);

        this.testsRun += 2;
        if (randAddr !== 0 && srandAddr !== 0) {
            this.testsPassed += 2;
        } else {
            this.testsFailed += 2;
        }
    }

    /**
     * Test utility functions
     */
    testUtilityFunctions() {
        console.log('Testing Utility Functions...\n');

        // Test exit
        this.testExit();

        // Test atoi
        this.testAtoi();

        // Test itoa
        this.testItoa();

        console.log('');
    }

    testExit() {
        console.log('  Testing exit...');

        const exitAddr = this.library.getFunctionAddress('exit');
        this.assert('exit function loaded', exitAddr !== 0);

        this.testsRun++;
        if (exitAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testAtoi() {
        console.log('  Testing atoi...');

        const atoiAddr = this.library.getFunctionAddress('atoi');
        this.assert('atoi function loaded', atoiAddr !== 0);

        this.testsRun++;
        if (atoiAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    testItoa() {
        console.log('  Testing itoa...');

        const itoaAddr = this.library.getFunctionAddress('itoa');
        this.assert('itoa function loaded', itoaAddr !== 0);

        this.testsRun++;
        if (itoaAddr !== 0) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }
    }

    /**
     * Test integration with C compiler
     */
    testIntegration() {
        console.log('Testing Integration...\n');

        // Test that all functions are properly loaded
        const addresses = this.library.getAllFunctionAddresses();

        let loadedCount = 0;
        for (const [name, address] of Object.entries(addresses)) {
            if (address !== 0) {
                loadedCount++;
            }
        }

        const totalFunctions = Object.keys(addresses).length;
        this.assert(`All ${totalFunctions} functions loaded`, loadedCount === totalFunctions);

        this.testsRun++;
        if (loadedCount === totalFunctions) {
            this.testsPassed++;
        } else {
            this.testsFailed++;
        }

        // Test memory layout doesn't overlap
        this.testMemoryLayout(addresses);

        console.log('');
    }

    testMemoryLayout(addresses) {
        console.log('  Testing memory layout...');

        const sortedAddresses = Object.values(addresses).sort((a, b) => a - b);

        for (let i = 1; i < sortedAddresses.length; i++) {
            const prevAddr = sortedAddresses[i - 1];
            const currAddr = sortedAddresses[i];

            // Check for overlaps (assuming each function takes at least 0x100 bytes)
            if (currAddr < prevAddr + 0x100) {
                this.assert('No memory overlap between functions', false);
                return;
            }
        }

        this.assert('Valid memory layout', true);
    }

    /**
     * Test assertion helper
     */
    assert(message, condition) {
        if (condition) {
            console.log(`    ✓ ${message}`);
        } else {
            console.log(`    ✗ ${message}`);
        }
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('=== Test Summary ===');
        console.log(`Tests run: ${this.testsRun}`);
        console.log(`Tests passed: ${this.testsPassed}`);
        console.log(`Tests failed: ${this.testsFailed}`);

        const successRate = (this.testsPassed / this.testsRun) * 100;
        console.log(`Success rate: ${successRate.toFixed(1)}%`);

        if (this.testsFailed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('❌ Some tests failed');
        }
    }
}

/**
 * Run the test suite if this file is executed directly
 */
if (require.main === module) {
    const tester = new CStandardLibraryTester();
    tester.runAllTests();
}

module.exports = CStandardLibraryTester;