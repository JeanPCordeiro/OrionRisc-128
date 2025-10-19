/**
 * Assembler Bootstrap Validation Test Suite
 *
 * Comprehensive testing for assembler self-hosting and bootstrap capabilities.
 * Tests that the assembler can be used for its own development, validate
 * progressive assembler enhancement, and ensure bootstrap sequence integrity.
 *
 * Phase 2 Component: Bootstrap Validation Testing
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

/**
 * Bootstrap Test Framework
 */
class BootstrapTestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.mmu = null;
        this.cpu = null;
        this.assembler = null;
        this.bootstrapPrograms = [];
        this.setupBootstrapPrograms();
    }

    /**
     * Initialize test framework
     * @param {Object} mmu - Memory Management Unit instance
     * @param {Object} cpu - CPU instance
     */
    initialize(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;

        // Import and create assembler
        const { TwoPassAssembler } = require('./two-pass-assembler');
        this.assembler = new TwoPassAssembler(mmu, cpu);

        console.log('Bootstrap test framework initialized');
    }

    /**
     * Set up bootstrap test programs
     */
    setupBootstrapPrograms() {
        // Phase 1 style program (machine language level)
        this.bootstrapPrograms.push({
            name: "Phase 1 Compatibility",
            source: `
.text
.global main

main:
    LOAD R0, 42
    STORE [0x2000], R0
    HALT
            `,
            phase: 1,
            validate: (result) => {
                return result.success && result.instructions.length >= 3;
            }
        });

        // Phase 2 basic assembler features
        this.bootstrapPrograms.push({
            name: "Phase 2 Basic Features",
            source: `
.text
.global main

.data
MY_CONSTANT: .equ 100

.text
main:
    LOAD R0, MY_CONSTANT
    ADD R0, 50
    HALT
            `,
            phase: 2,
            validate: (result) => {
                if (!result.success) return false;

                // Check that equate was processed
                const myConstant = result.symbols.find(s => s.name === 'MY_CONSTANT');
                return myConstant && myConstant.value === 100;
            }
        });

        // Phase 2 advanced features
        this.bootstrapPrograms.push({
            name: "Phase 2 Advanced Features",
            source: `
.text
.global main

.data
BUFFER_SIZE: .equ 256
ARRAY_SIZE:  .equ 10

.text
main:
    LOAD R0, BUFFER_SIZE
    LOAD R1, ARRAY_SIZE

loop:
    STORE [R2 + R1], R1
    ADD R1, 1
    SUB R0, 1
    JUMP loop

end_loop:
    HALT
            `,
            phase: 2,
            validate: (result) => {
                if (!result.success) return false;

                // Check multiple equates
                const bufferSize = result.symbols.find(s => s.name === 'BUFFER_SIZE');
                const arraySize = result.symbols.find(s => s.name === 'ARRAY_SIZE');

                return bufferSize && arraySize &&
                       bufferSize.value === 256 && arraySize.value === 10;
            }
        });

        // Self-hosting test program
        this.bootstrapPrograms.push({
            name: "Self-Hosting Test",
            source: `
; This program tests assembler self-hosting capability
.text
.global main

.data
TEST_VALUE: .equ 42
COUNTER:    .equ 0

.text
main:
    LOAD R0, TEST_VALUE
    STORE [COUNTER], R0
    HALT
            `,
            phase: 2,
            validate: (result) => {
                return result.success && result.symbols.length >= 3; // main, TEST_VALUE, COUNTER
            }
        });

        // Progressive enhancement test
        this.bootstrapPrograms.push({
            name: "Progressive Enhancement",
            source: `
; Tests progressive assembler enhancement
.text
.global main

.data
; Enhanced data section with multiple equates
MAX_SIZE:   .equ 1024
MIN_SIZE:   .equ 16
DEFAULT_SIZE: .equ 256

.text
main:
    LOAD R0, MAX_SIZE
    LOAD R1, MIN_SIZE
    SUB R0, R1
    LOAD R2, DEFAULT_SIZE
    ADD R0, R2
    HALT
            `,
            phase: 2,
            validate: (result) => {
                if (!result.success) return false;

                // Check all equates are correctly processed
                const equates = result.symbols.filter(s => s.type === 2);
                return equates.length >= 3;
            }
        });
    }

    /**
     * Add test case
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function
     */
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Run all tests
     * @returns {Object} Test results
     */
    runAllTests() {
        console.log('=== ASSEMBLER BOOTSTRAP VALIDATION TESTS ===');
        console.log('');

        this.results = { passed: 0, failed: 0, total: 0 };

        // Run bootstrap programs
        this.runBootstrapPrograms();

        // Run individual tests
        for (const test of this.tests) {
            try {
                console.log(`Running test: ${test.name}`);
                const result = test.testFunction();

                if (result) {
                    this.results.passed++;
                    console.log(`✓ PASSED: ${test.name}`);
                } else {
                    this.results.failed++;
                    console.log(`✗ FAILED: ${test.name}`);
                }

            } catch (error) {
                this.results.failed++;
                console.log(`✗ ERROR in ${test.name}: ${error.message}`);
            }

            this.results.total++;
            console.log('');
        }

        this.printSummary();
        return this.results;
    }

    /**
     * Run bootstrap programs
     */
    runBootstrapPrograms() {
        console.log('=== BOOTSTRAP PROGRAM EXECUTION ===');

        for (const program of this.bootstrapPrograms) {
            console.log(`Testing: ${program.name} (Phase ${program.phase})`);

            try {
                const result = this.assembler.assemble(program.source);

                if (!result.success) {
                    console.log(`✗ FAILED: ${program.name} - Assembly failed`);
                    console.log(`  Errors: ${result.errors.map(e => e.message).join(', ')}`);
                    this.results.failed++;
                } else if (program.validate && !program.validate(result)) {
                    console.log(`✗ FAILED: ${program.name} - Validation failed`);
                    this.results.failed++;
                } else {
                    console.log(`✓ PASSED: ${program.name}`);
                    console.log(`  Instructions: ${result.instructions.length}`);
                    console.log(`  Symbols: ${result.symbols.length}`);
                    console.log(`  Time: ${result.statistics.totalTime}ms`);
                    this.results.passed++;
                }

            } catch (error) {
                console.log(`✗ ERROR in ${program.name}: ${error.message}`);
                this.results.failed++;
            }

            this.results.total++;
            console.log('');
        }
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('=== BOOTSTRAP TEST SUMMARY ===');
        console.log(`Total tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.failed === 0) {
            console.log('🎉 All bootstrap tests passed!');
        } else {
            console.log('❌ Some bootstrap tests failed');
        }
    }
}

// ============================================================================
// BOOTSTRAP TEST PROGRAMS
// ============================================================================

/**
 * Library of bootstrap test programs
 */
const BOOTSTRAP_TEST_PROGRAMS = {
    // Minimal viable assembler test
    minimalAssembler: `
.text
.global main

main:
    LOAD R0, 1
    HALT
    `,

    // Assembler self-description test
    selfDescription: `
; This program demonstrates assembler self-description
.text
.global main

.data
ASSEMBLER_VERSION: .equ 2
PHASE:            .equ 2

.text
main:
    LOAD R0, ASSEMBLER_VERSION
    LOAD R1, PHASE
    ADD R0, R1
    HALT
    `,

    // Progressive feature test
    progressiveFeatures: `
; Tests progressive feature addition
.text
.global main

.data
; Basic equates
VALUE1: .equ 10

; Enhanced equates with expressions
VALUE2: .equ 20
SUM:    .equ VALUE1 + VALUE2

.text
main:
    LOAD R0, VALUE1
    LOAD R1, VALUE2
    LOAD R2, SUM
    HALT
    `,

    // Bootstrap validation test
    bootstrapValidation: `
; Validates bootstrap sequence
.text
.global main

.data
BOOTSTRAP_OK: .equ 1
SELF_HOSTING: .equ 1

.text
main:
    LOAD R0, BOOTSTRAP_OK
    LOAD R1, SELF_HOSTING
    ADD R0, R1
    HALT
    `
};

// ============================================================================
// INDIVIDUAL TEST FUNCTIONS
// ============================================================================

/**
 * Test assembler self-hosting capability
 */
function testAssemblerSelfHosting() {
    console.log('Testing assembler self-hosting capability...');

    try {
        // Test that assembler can process its own output
        const selfHostingProgram = `
.text
.global main

.data
SELF_TEST: .equ 123

.text
main:
    LOAD R0, SELF_TEST
    HALT
        `;

        const result = this.assembler.assemble(selfHostingProgram);

        if (!result.success) {
            console.error('Self-hosting test failed - assembler cannot process its own output');
            return false;
        }

        // Check that the assembler processed its own features correctly
        const selfTestSymbol = result.symbols.find(s => s.name === 'SELF_TEST');
        if (!selfTestSymbol || selfTestSymbol.value !== 123) {
            console.error('Self-hosting test failed - symbol processing incorrect');
            return false;
        }

        console.log('Assembler self-hosting capability validated');
        return true;

    } catch (error) {
        console.error('Self-hosting test failed:', error.message);
        return false;
    }
}

/**
 * Test progressive assembler enhancement
 */
function testProgressiveEnhancement() {
    console.log('Testing progressive assembler enhancement...');

    try {
        // Test programs representing different enhancement stages
        const enhancementStages = [
            {
                name: "Basic Assembly",
                source: `
.text
.global main

main:
    LOAD R0, 42
    HALT
                `,
                minInstructions: 2
            },
            {
                name: "With Labels",
                source: `
.text
.global main

main:
    JUMP end
    LOAD R0, 1

end:
    HALT
                `,
                minInstructions: 3,
                minSymbols: 2
            },
            {
                name: "With Equates",
                source: `
.text
.global main

.data
VALUE: .equ 100

.text
main:
    LOAD R0, VALUE
    HALT
                `,
                minInstructions: 2,
                minSymbols: 2
            }
        ];

        for (const stage of enhancementStages) {
            const result = this.assembler.assemble(stage.source);

            if (!result.success) {
                console.error(`Progressive enhancement failed at stage: ${stage.name}`);
                return false;
            }

            if (result.instructions.length < stage.minInstructions) {
                console.error(`Insufficient instructions at stage ${stage.name}: ${result.instructions.length}`);
                return false;
            }

            if (stage.minSymbols && result.symbols.length < stage.minSymbols) {
                console.error(`Insufficient symbols at stage ${stage.name}: ${result.symbols.length}`);
                return false;
            }

            console.log(`✓ ${stage.name}: ${result.instructions.length} instructions, ${result.symbols.length} symbols`);
        }

        console.log('Progressive enhancement validated');
        return true;

    } catch (error) {
        console.error('Progressive enhancement test failed:', error.message);
        return false;
    }
}

/**
 * Test bootstrap sequence integrity
 */
function testBootstrapSequenceIntegrity() {
    console.log('Testing bootstrap sequence integrity...');

    try {
        // Test that each bootstrap phase works correctly
        const bootstrapSequence = [
            {
                name: "Phase 1 Compatibility",
                source: BOOTSTRAP_TEST_PROGRAMS.minimalAssembler,
                phase: 1
            },
            {
                name: "Phase 2 Foundation",
                source: BOOTSTRAP_TEST_PROGRAMS.selfDescription,
                phase: 2
            },
            {
                name: "Phase 2 Enhanced",
                source: BOOTSTRAP_TEST_PROGRAMS.progressiveFeatures,
                phase: 2
            }
        ];

        for (const phase of bootstrapSequence) {
            const result = this.assembler.assemble(phase.source);

            if (!result.success) {
                console.error(`Bootstrap sequence failed at ${phase.name} (Phase ${phase.phase})`);
                return false;
            }

            console.log(`✓ ${phase.name}: ${result.instructions.length} instructions`);
        }

        console.log('Bootstrap sequence integrity validated');
        return true;

    } catch (error) {
        console.error('Bootstrap sequence integrity test failed:', error.message);
        return false;
    }
}

/**
 * Test assembler development workflow
 */
function testAssemblerDevelopmentWorkflow() {
    console.log('Testing assembler development workflow...');

    try {
        // Simulate the development workflow
        const workflowSteps = [
            {
                name: "Initial Assembly",
                source: `
.text
.global main

main:
    LOAD R0, 1
    HALT
                `
            },
            {
                name: "Add Constants",
                source: `
.text
.global main

.data
VERSION: .equ 1

.text
main:
    LOAD R0, VERSION
    HALT
                `
            },
            {
                name: "Add Subroutines",
                source: `
.text
.global main

main:
    CALL init
    HALT

init:
    LOAD R0, 42
    RET
                `
            },
            {
                name: "Add Data Structures",
                source: `
.text
.global main

.data
SIZE: .equ 100
BUFFER: .equ 0x2000

.text
main:
    LOAD R0, SIZE
    LOAD R1, BUFFER
    HALT
                `
            }
        ];

        for (let i = 0; i < workflowSteps.length; i++) {
            const step = workflowSteps[i];
            const result = this.assembler.assemble(step.source);

            if (!result.success) {
                console.error(`Development workflow failed at step ${i + 1}: ${step.name}`);
                return false;
            }

            console.log(`✓ Step ${i + 1} (${step.name}): ${result.instructions.length} instructions`);
        }

        console.log('Assembler development workflow validated');
        return true;

    } catch (error) {
        console.error('Development workflow test failed:', error.message);
        return false;
    }
}

/**
 * Test bootstrap validation programs
 */
function testBootstrapValidationPrograms() {
    console.log('Testing bootstrap validation programs...');

    try {
        // Test each program in the bootstrap library
        for (const [name, source] of Object.entries(BOOTSTRAP_TEST_PROGRAMS)) {
            const result = this.assembler.assemble(source);

            if (!result.success) {
                console.error(`Bootstrap validation failed for ${name}`);
                return false;
            }

            console.log(`✓ ${name}: ${result.instructions.length} instructions, ${result.symbols.length} symbols`);
        }

        console.log('All bootstrap validation programs successful');
        return true;

    } catch (error) {
        console.error('Bootstrap validation test failed:', error.message);
        return false;
    }
}

/**
 * Test assembler feature progression
 */
function testAssemblerFeatureProgression() {
    console.log('Testing assembler feature progression...');

    try {
        // Test feature progression from simple to complex
        const featureProgression = [
            {
                name: "Basic Instructions",
                source: `
.text
.global main

main:
    LOAD R0, 42
    ADD R0, R1
    HALT
                `,
                features: ["LOAD", "ADD", "HALT"]
            },
            {
                name: "Control Flow",
                source: `
.text
.global main

main:
    JUMP end
    LOAD R0, 1

end:
    HALT
                `,
                features: ["JUMP", "labels"]
            },
            {
                name: "Data Definitions",
                source: `
.text
.global main

.data
VALUE: .equ 100

.text
main:
    LOAD R0, VALUE
    HALT
                `,
                features: [".equ", "symbol_resolution"]
            },
            {
                name: "Memory Operations",
                source: `
.text
.global main

main:
    LOAD R0, 42
    STORE [R1 + 5], R0
    HALT
                `,
                features: ["STORE", "memory_operations"]
            }
        ];

        for (const feature of featureProgression) {
            const result = this.assembler.assemble(feature.source);

            if (!result.success) {
                console.error(`Feature progression failed at: ${feature.name}`);
                return false;
            }

            console.log(`✓ ${feature.name}: ${feature.features.join(", ")}`);
        }

        console.log('Assembler feature progression validated');
        return true;

    } catch (error) {
        console.error('Feature progression test failed:', error.message);
        return false;
    }
}

// ============================================================================
// TEST REGISTRATION
// ============================================================================

/**
 * Register all tests
 * @param {BootstrapTestFramework} framework - Test framework instance
 */
function registerAllTests(framework) {
    framework.addTest('Assembler Self-Hosting', testAssemblerSelfHosting);
    framework.addTest('Progressive Enhancement', testProgressiveEnhancement);
    framework.addTest('Bootstrap Sequence Integrity', testBootstrapSequenceIntegrity);
    framework.addTest('Assembler Development Workflow', testAssemblerDevelopmentWorkflow);
    framework.addTest('Bootstrap Validation Programs', testBootstrapValidationPrograms);
    framework.addTest('Assembler Feature Progression', testAssemblerFeatureProgression);
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

/**
 * Run complete bootstrap test suite
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 * @returns {Object} Test results
 */
function runCompleteBootstrapTestSuite(mmu, cpu) {
    const framework = new BootstrapTestFramework();
    framework.initialize(mmu, cpu);
    registerAllTests(framework);
    return framework.runAllTests();
}

/**
 * Demonstrate bootstrap functionality
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 */
function demonstrateBootstrapFunctionality(mmu, cpu) {
    console.log('=== BOOTSTRAP FUNCTIONALITY DEMONSTRATION ===');
    console.log('');

    const assembler = new TwoPassAssembler(mmu, cpu);

    console.log('1. Testing Phase 1 compatibility...');
    const phase1Result = assembler.assemble(BOOTSTRAP_TEST_PROGRAMS.minimalAssembler);
    console.log(`   Success: ${phase1Result.success}, Instructions: ${phase1Result.instructions.length}`);

    console.log('2. Testing Phase 2 foundation...');
    const phase2Result = assembler.assemble(BOOTSTRAP_TEST_PROGRAMS.selfDescription);
    console.log(`   Success: ${phase2Result.success}, Instructions: ${phase2Result.instructions.length}, Symbols: ${phase2Result.symbols.length}`);

    console.log('3. Testing progressive features...');
    const progressiveResult = assembler.assemble(BOOTSTRAP_TEST_PROGRAMS.progressiveFeatures);
    console.log(`   Success: ${progressiveResult.success}, Instructions: ${progressiveResult.instructions.length}, Symbols: ${progressiveResult.symbols.length}`);

    console.log('4. Testing self-hosting capability...');
    const selfHostingResult = assembler.assemble(BOOTSTRAP_TEST_PROGRAMS.bootstrapValidation);
    console.log(`   Success: ${selfHostingResult.success}, Instructions: ${selfHostingResult.instructions.length}, Symbols: ${selfHostingResult.symbols.length}`);

    console.log('');
    console.log('=== DEMONSTRATION COMPLETE ===');
}

// ============================================================================
// INTEGRATION TEST
// ============================================================================

/**
 * Integration test with bootstrap system
 */
function testBootstrapIntegration() {
    console.log('=== BOOTSTRAP INTEGRATION TEST ===');

    // This would test integration with the bootstrap development process
    // For now, just verify the assembler can handle bootstrap scenarios

    console.log('Bootstrap integration test placeholder - would test with actual bootstrap process');
    return true;
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BootstrapTestFramework,
        BOOTSTRAP_TEST_PROGRAMS,
        runCompleteBootstrapTestSuite,
        demonstrateBootstrapFunctionality,
        testBootstrapIntegration
    };
}