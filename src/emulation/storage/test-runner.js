/**
 * OrionRisc-128 Floppy Disk Controller - Test Runner
 *
 * Runs all FDC component tests in sequence
 */

const SectorOperationsTest = require('./test-sector-operations');
const DiskImageTest = require('./test-disk-image');
const FAT12FileSystemTest = require('./test-fat12-filesystem');
const FileOperationsTest = require('./test-file-operations');
const IntegrationTest = require('./test-integration');

class TestRunner {
    constructor() {
        this.tests = [
            { name: 'Sector Operations', test: SectorOperationsTest },
            { name: 'Disk Image Management', test: DiskImageTest },
            { name: 'FAT12 File System', test: FAT12FileSystemTest },
            { name: 'File Operations', test: FileOperationsTest },
            { name: 'Integration Tests', test: IntegrationTest }
        ];

        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 OrionRisc-128 FDC Test Suite\n');
        console.log('=' .repeat(50));

        const startTime = Date.now();

        for (const testInfo of this.tests) {
            try {
                console.log(`\n📋 Running ${testInfo.name}...`);
                console.log('-'.repeat(40));

                const test = new testInfo.test();
                await test.runAllTests();

                this.results.passed++;
                console.log(`✅ ${testInfo.name} PASSED`);

            } catch (error) {
                this.results.failed++;
                console.log(`❌ ${testInfo.name} FAILED: ${error.message}`);
            }

            this.results.total++;
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        this.printSummary(duration);
    }

    /**
     * Print test results summary
     */
    printSummary(duration) {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(50));

        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Duration: ${duration}s`);

        if (this.results.failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! FDC implementation is ready.');
            process.exit(0);
        } else {
            console.log('\n💥 SOME TESTS FAILED! Please review the errors above.');
            process.exit(1);
        }
    }

    /**
     * Run individual test by name
     */
    async runTest(testName) {
        const testInfo = this.tests.find(t => t.name.toLowerCase() === testName.toLowerCase());

        if (!testInfo) {
            console.error(`Test '${testName}' not found. Available tests:`);
            this.tests.forEach(t => console.log(`  - ${t.name}`));
            return;
        }

        try {
            console.log(`Running ${testInfo.name}...`);
            const test = new testInfo.test();
            await test.runAllTests();
            console.log(`✅ ${testInfo.name} PASSED`);

        } catch (error) {
            console.error(`❌ ${testInfo.name} FAILED: ${error.message}`);
            throw error;
        }
    }
}

// Command line interface
if (require.main === module) {
    const runner = new TestRunner();
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Run all tests
        runner.runAllTests().catch(error => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
    } else {
        // Run specific test
        const testName = args[0];
        runner.runTest(testName).catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
    }
}

module.exports = TestRunner;