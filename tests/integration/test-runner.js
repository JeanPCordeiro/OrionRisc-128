/**
 * OrionRisc-128 Integration Test Runner
 * Comprehensive test reporting and diagnostics for the complete system
 */

console.log('DEBUG: Starting test-runner.js');
const SystemBootstrapTest = require('./system-bootstrap-test');
console.log('DEBUG: SystemBootstrapTest loaded');
const ProgramExecutionTest = require('./program-execution-test');
console.log('DEBUG: ProgramExecutionTest loaded');
const EndToEndTest = require('./end-to-end-test');
console.log('DEBUG: EndToEndTest loaded');
const PerformanceTest = require('./performance-test');
console.log('DEBUG: PerformanceTest loaded');

class IntegrationTestRunner {
    constructor() {
        this.testSuites = [
            { name: 'System Bootstrap', class: SystemBootstrapTest },
            { name: 'Program Execution', class: ProgramExecutionTest },
            { name: 'End-to-End Workflow', class: EndToEndTest },
            { name: 'Performance Validation', class: PerformanceTest }
        ];

        this.results = {
            startTime: null,
            endTime: null,
            testSuites: [],
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                successRate: 0,
                totalDuration: 0
            }
        };
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.log('🚀 OrionRisc-128 Comprehensive Integration Test Suite');
        console.log('=' .repeat(80));
        console.log('Testing complete system functionality for bootstrap development');
        console.log('=' .repeat(80));

        this.results.startTime = new Date().toISOString();

        for (const suiteInfo of this.testSuites) {
            console.log(`\n📋 Running ${suiteInfo.name} Tests...`);
            console.log('-'.repeat(60));

            try {
                const testSuite = new suiteInfo.class();
                const suiteResults = await testSuite.runAllTests();

                this.results.testSuites.push({
                    name: suiteInfo.name,
                    results: suiteResults,
                    success: suiteResults.overallSuccess,
                    startTime: new Date().toISOString()
                });

                // Update summary statistics
                this.results.summary.totalTests++;
                if (suiteResults.overallSuccess) {
                    this.results.summary.passedTests++;
                } else {
                    this.results.summary.failedTests++;
                }

            } catch (error) {
                console.error(`❌ ${suiteInfo.name} test suite failed:`, error.message);

                this.results.testSuites.push({
                    name: suiteInfo.name,
                    results: null,
                    success: false,
                    error: error.message,
                    startTime: new Date().toISOString()
                });

                this.results.summary.totalTests++;
                this.results.summary.failedTests++;
            }
        }

        this.results.endTime = new Date().toISOString();
        const duration = new Date(this.results.endTime) - new Date(this.results.startTime);
        this.results.summary.totalDuration = duration;
        this.results.summary.successRate = (this.results.summary.passedTests / this.results.summary.totalTests) * 100;

        this.generateFinalReport();
    }

    /**
     * Generate comprehensive final report
     */
    generateFinalReport() {
        console.log('\n' + '='.repeat(80));
        console.log('ORIONRISC-128 INTEGRATION TEST FINAL REPORT');
        console.log('='.repeat(80));

        // Overall summary
        console.log('\n📊 EXECUTIVE SUMMARY');
        console.log('-'.repeat(50));
        console.log(`Test Start: ${new Date(this.results.startTime).toLocaleString()}`);
        console.log(`Test End: ${new Date(this.results.endTime).toLocaleString()}`);
        console.log(`Total Duration: ${(this.results.summary.totalDuration / 1000).toFixed(2)} seconds`);

        console.log('\n📈 TEST RESULTS');
        console.log('-'.repeat(50));
        console.log(`Total Test Suites: ${this.results.summary.totalTests}`);
        console.log(`Passed: ${this.results.summary.passedTests} ✅`);
        console.log(`Failed: ${this.results.summary.failedTests} ❌`);
        console.log(`Overall Success Rate: ${this.results.summary.successRate.toFixed(1)}%`);

        // Detailed results for each test suite
        console.log('\n📋 DETAILED RESULTS');
        console.log('-'.repeat(50));

        for (const suite of this.results.testSuites) {
            const status = suite.success ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${suite.name}`);

            if (suite.error) {
                console.log(`   Error: ${suite.error}`);
            }

            if (suite.results) {
                // Show specific test results for the suite
                const results = suite.results;
                if (results.arithmeticDemo !== undefined) {
                    console.log(`   Arithmetic Demo: ${results.arithmeticDemo ? '✅' : '❌'}`);
                }
                if (results.memoryDemo !== undefined) {
                    console.log(`   Memory Demo: ${results.memoryDemo ? '✅' : '❌'}`);
                }
                if (results.ioDemo !== undefined) {
                    console.log(`   I/O Demo: ${results.ioDemo ? '✅' : '❌'}`);
                }
                if (results.calculatorDemo !== undefined) {
                    console.log(`   Calculator Demo: ${results.calculatorDemo ? '✅' : '❌'}`);
                }
                if (results.completeWorkflow !== undefined) {
                    console.log(`   Complete Workflow: ${results.completeWorkflow ? '✅' : '❌'}`);
                }
                if (results.emulationSpeed !== undefined) {
                    console.log(`   Emulation Speed: ${results.emulationSpeed ? '✅' : '❌'}`);
                }
                if (results.errorRecovery !== undefined) {
                    console.log(`   Error Recovery: ${results.errorRecovery ? '✅' : '❌'}`);
                }
            }
        }

        // System readiness assessment
        this.generateReadinessAssessment();

        // Recommendations
        this.generateRecommendations();

        console.log('\n' + '='.repeat(80));
    }

    /**
     * Generate system readiness assessment
     */
    generateReadinessAssessment() {
        console.log('\n🎯 SYSTEM READINESS ASSESSMENT');
        console.log('-'.repeat(50));

        const passedSuites = this.results.testSuites.filter(s => s.success).length;
        const totalSuites = this.results.testSuites.length;

        if (passedSuites === totalSuites) {
            console.log('✅ SYSTEM READY FOR PHASE 2 DEVELOPMENT');
            console.log('   All integration tests passed successfully.');
            console.log('   Foundation is solid for assembler development.');
            console.log('   Ready to proceed with bootstrap sequence.');

        } else if (passedSuites >= totalSuites * 0.8) {
            console.log('⚠️  SYSTEM MOSTLY READY WITH MINOR ISSUES');
            console.log('   Most functionality working correctly.');
            console.log('   Minor issues should be addressed before proceeding.');
            console.log('   Consider these issues as development continues.');

        } else if (passedSuites >= totalSuites * 0.5) {
            console.log('⚠️  SYSTEM REQUIRES ATTENTION');
            console.log('   Core functionality working but significant issues remain.');
            console.log('   Address critical failures before proceeding.');
            console.log('   Some features may be unstable.');

        } else {
            console.log('❌ SYSTEM NOT READY');
            console.log('   Major functionality failures detected.');
            console.log('   System requires significant fixes before proceeding.');
            console.log('   Do not proceed to Phase 2 until issues are resolved.');
        }
    }

    /**
     * Generate development recommendations
     */
    generateRecommendations() {
        console.log('\n💡 DEVELOPMENT RECOMMENDATIONS');
        console.log('-'.repeat(50));

        const failedSuites = this.results.testSuites.filter(s => !s.success);

        if (failedSuites.length === 0) {
            console.log('✅ No specific recommendations - system performing well');
            console.log('   Consider proceeding with Phase 2: Assembler Development');
            console.log('   Monitor performance as system complexity increases');

        } else {
            console.log('📋 Issues to address:');

            for (const suite of failedSuites) {
                console.log(`\n   ${suite.name}:`);

                if (suite.results) {
                    const results = suite.results;

                    if (!results.systemInitialization && results.systemInitialization !== undefined) {
                        console.log('     - Fix system initialization process');
                    }
                    if (!results.hardwareIntegration && results.hardwareIntegration !== undefined) {
                        console.log('     - Resolve hardware component integration issues');
                    }
                    if (!results.arithmeticDemo && results.arithmeticDemo !== undefined) {
                        console.log('     - Debug arithmetic demo execution');
                    }
                    if (!results.memoryDemo && results.memoryDemo !== undefined) {
                        console.log('     - Fix memory demo functionality');
                    }
                    if (!results.ioDemo && results.ioDemo !== undefined) {
                        console.log('     - Resolve I/O system issues');
                    }
                    if (!results.emulationSpeed && results.emulationSpeed !== undefined) {
                        console.log('     - Improve emulation performance');
                    }
                    if (!results.errorRecovery && results.errorRecovery !== undefined) {
                        console.log('     - Enhance error handling and recovery');
                    }
                } else {
                    console.log(`     - ${suite.error}`);
                }
            }
        }

        // Always include these general recommendations
        console.log('\n📋 General Recommendations:');
        console.log('   - Monitor memory usage as programs become more complex');
        console.log('   - Add logging for debugging system call execution');
        console.log('   - Consider adding more comprehensive unit tests');
        console.log('   - Document any workarounds for known issues');
        console.log('   - Plan for increased testing as new components are added');
    }

    /**
     * Save test results to file
     */
    saveResults(filename = 'integration-test-results.json') {
        const fs = require('fs');
        const path = require('path');

        const resultsPath = path.join(__dirname, filename);
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));

        console.log(`\n💾 Test results saved to: ${resultsPath}`);
    }

    /**
     * Generate JUnit-style XML report
     */
    generateJUnitReport(filename = 'integration-test-results.xml') {
        const fs = require('fs');
        const path = require('path');

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<testsuites>\n';

        for (const suite of this.results.testSuites) {
            xml += `  <testsuite name="${suite.name}" tests="1" failures="${suite.success ? 0 : 1}" errors="0">\n`;

            if (suite.success) {
                xml += `    <testcase name="${suite.name}" classname="IntegrationTests" time="0"/>\n`;
            } else {
                xml += `    <testcase name="${suite.name}" classname="IntegrationTests" time="0">\n`;
                xml += `      <failure message="Test suite failed">`;
                if (suite.error) {
                    xml += `${suite.error}`;
                } else {
                    xml += 'One or more tests in the suite failed';
                }
                xml += '</failure>\n';
                xml += `    </testcase>\n`;
            }

            xml += '  </testsuite>\n';
        }

        xml += '</testsuites>\n';

        const resultsPath = path.join(__dirname, filename);
        fs.writeFileSync(resultsPath, xml);

        console.log(`💾 JUnit XML report saved to: ${resultsPath}`);
    }
}

// Export for use in other modules
module.exports = IntegrationTestRunner;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new IntegrationTestRunner();

    // Handle command line arguments
    const args = process.argv.slice(2);
    const saveResults = args.includes('--save');
    const junitReport = args.includes('--junit');

    testRunner.runAllTests()
        .then(() => {
            if (saveResults) {
                testRunner.saveResults();
            }
            if (junitReport) {
                testRunner.generateJUnitReport();
            }

            // Exit with appropriate code
            const success = testRunner.results.summary.successRate === 100;
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('\n💥 Integration test suite crashed:', error.message);
            process.exit(1);
        });
}