/**
 * GPU Test Runner - Executes all GPU component tests
 */

const { runFrameBufferTests } = require('./test-frame-buffer');
const { runCharacterROMTests } = require('./test-character-rom');
const { runGraphicsPrimitivesTests } = require('./test-graphics-primitives');
const { runTextModeEngineTests } = require('./test-text-mode');
const { runGPUTests } = require('./test-gpu');

function runAllGPUTests() {
    console.log('='.repeat(60));
    console.log('ORIONRISC-128 GPU TEST SUITE');
    console.log('='.repeat(60));
    console.log('');

    const tests = [
        { name: 'Frame Buffer', fn: runFrameBufferTests },
        { name: 'Character ROM', fn: runCharacterROMTests },
        { name: 'Graphics Primitives', fn: runGraphicsPrimitivesTests },
        { name: 'Text Mode Engine', fn: runTextModeEngineTests },
        { name: 'GPU Integration', fn: runGPUTests }
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach((test, index) => {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Test ${index + 1}: ${test.name}`);
        console.log('='.repeat(50));

        try {
            const result = test.fn();
            if (result) {
                passed++;
                console.log(`\n✅ ${test.name} tests PASSED`);
            } else {
                failed++;
                console.log(`\n❌ ${test.name} tests FAILED`);
            }
        } catch (error) {
            failed++;
            console.log(`\n💥 ${test.name} tests CRASHED: ${error.message}`);
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log('GPU TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 ALL GPU TESTS PASSED! 🎉');
        console.log('The GPU implementation is ready for integration.');
        return true;
    } else {
        console.log(`\n⚠️  ${failed} test suite(s) failed. Please review the errors above.`);
        return false;
    }
}

// Export for use in other test files
module.exports = { runAllGPUTests };

// Run tests if this file is executed directly
if (require.main === module) {
    runAllGPUTests();
}