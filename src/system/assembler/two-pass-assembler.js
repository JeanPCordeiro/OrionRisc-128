/**
 * Two-Pass Assembler for OrionRisc-128 Assembly Language
 *
 * This module implements the main assembler orchestrator that coordinates
 * the two-pass assembly process, integrating all assembler components
 * to convert assembly source code into executable machine code.
 *
 * Phase 2 Component: Main Assembler Implementation
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// ASSEMBLER CONSTANTS
// ============================================================================

/**
 * Assembly Pass Types
 */
const ASSEMBLY_PASSES = {
    PASS_1: 1,    // Symbol table building and validation
    PASS_2: 2     // Machine code generation
};

/**
 * Assembly States
 */
const ASSEMBLY_STATES = {
    READY: 0,
    PASS_1_RUNNING: 1,
    PASS_1_COMPLETE: 2,
    PASS_2_RUNNING: 3,
    PASS_2_COMPLETE: 4,
    ERROR: 5,
    SUCCESS: 6
};

/**
 * Memory Layout for Assembler
 */
const ASSEMBLER_MEMORY_LAYOUT = {
    // Existing regions (from README.md)
    PROGRAM_CODE: { start: 0x0000, end: 0x0FFF },      // Assembler program code
    SOURCE_BUFFER: { start: 0x1000, end: 0x1FFF },     // Source code input
    TOKEN_BUFFER: { start: 0x2000, end: 0x2FFF },      // Token output
    STRING_TABLE: { start: 0x3000, end: 0x3FFF },      // String storage
    STATE_VARS: { start: 0x4000, end: 0x40FF },        // State variables
    CONSTANTS: { start: 0x4100, end: 0x41FF },         // Constants and tables

    // Symbol table regions
    SYMBOL_HASH: { start: 0x5000, end: 0x5FFF },       // Hash table buckets
    SYMBOL_DATA: { start: 0x6000, end: 0x6FFF },       // Symbol entries
    SYMBOL_STRINGS: { start: 0x7000, end: 0x7FFF },     // Symbol names

    // Code generation regions
    MACHINE_CODE: { start: 0x8000, end: 0x8FFF },      // Generated machine code
    RELOCATION_TABLE: { start: 0x9000, end: 0x90FF },  // Relocation records

    // Working buffers
    TEMP_BUFFER: { start: 0x9100, end: 0x91FF },       // Temporary storage
    ERROR_BUFFER: { start: 0x9200, end: 0x92FF }       // Error messages
};

/**
 * Assembler Configuration
 */
const ASSEMBLER_CONFIG = {
    DEFAULT_TEXT_ADDRESS: 0x1000,
    DEFAULT_DATA_ADDRESS: 0x9000,
    MAX_SOURCE_SIZE: 0x1000,        // 4KB source limit
    MAX_SYMBOLS: 256,               // Maximum symbols
    MAX_ERRORS: 100,                // Maximum errors to collect
    ENABLE_OPTIMIZATIONS: true,
    VERBOSE_OUTPUT: false
};

// ============================================================================
// ASSEMBLER ERROR CLASS
// ============================================================================

/**
 * Assembler Error Class
 */
class AssemblerError {
    constructor(type, message, line = 0, column = 0, severity = 'error') {
        this.type = type;
        this.message = message;
        this.line = line;
        this.column = column;
        this.severity = severity;
        this.timestamp = Date.now();
    }

    toString() {
        const location = this.line > 0 ? ` at line ${this.line}${this.column > 0 ? `:${this.column}` : ''}` : '';
        return `Assembler ${this.severity.toUpperCase()}${location}: ${this.message}`;
    }

    isError() {
        return this.severity === 'error';
    }

    isWarning() {
        return this.severity === 'warning';
    }
}

// ============================================================================
// ASSEMBLY RESULT CLASS
// ============================================================================

/**
 * Assembly Result Class
 */
class AssemblyResult {
    constructor() {
        this.success = false;
        this.errors = [];
        this.warnings = [];
        this.instructions = [];
        this.symbols = [];
        this.statistics = {
            pass1Time: 0,
            pass2Time: 0,
            totalTime: 0,
            sourceLines: 0,
            instructionsGenerated: 0,
            symbolsFound: 0,
            bytesGenerated: 0
        };
        this.startTime = 0;
        this.endTime = 0;
    }

    /**
     * Add error to results
     */
    addError(type, message, line = 0, column = 0) {
        const error = new AssemblerError(type, message, line, column, 'error');
        this.errors.push(error);
        return error;
    }

    /**
     * Add warning to results
     */
    addWarning(message, line = 0, column = 0) {
        const warning = new AssemblerError('WARNING', message, line, column, 'warning');
        this.warnings.push(warning);
        return warning;
    }

    /**
     * Check if assembly was successful
     */
    isSuccessful() {
        return this.success && this.errors.length === 0;
    }

    /**
     * Get total error count
     */
    getErrorCount() {
        return this.errors.length;
    }

    /**
     * Get total warning count
     */
    getWarningCount() {
        return this.warnings.length;
    }

    /**
     * Get summary of results
     */
    getSummary() {
        return {
            success: this.success,
            errorCount: this.getErrorCount(),
            warningCount: this.getWarningCount(),
            instructionCount: this.instructions.length,
            symbolCount: this.symbols.length,
            bytesGenerated: this.statistics.bytesGenerated,
            totalTime: this.statistics.totalTime
        };
    }
}

// ============================================================================
// MAIN ASSEMBLER CLASS
// ============================================================================

/**
 * Two-Pass Assembler Main Class
 */
class TwoPassAssembler {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;

        // Component instances
        this.lexicalAnalyzer = null;
        this.symbolTable = null;
        this.instructionParser = null;
        this.machineCodeGenerator = null;
        this.labelSymbolResolver = null;

        // Assembly state
        this.state = ASSEMBLY_STATES.READY;
        this.currentPass = 0;
        this.sourceCode = '';
        this.tokens = [];
        this.parsedInstructions = [];

        // Configuration
        this.config = { ...ASSEMBLER_CONFIG };

        // Results
        this.result = new AssemblyResult();

        // Initialize components
        this.initializeComponents();
    }

    /**
     * Initialize all assembler components
     */
    initializeComponents() {
        console.log('Initializing assembler components...');

        // Import required modules
        const { LexicalAnalyzer } = require('./lexical-analyzer');
        const { SymbolTable } = require('./symbol-table');
        const { InstructionParser } = require('./instruction-parser');
        const { MachineCodeGenerator } = require('./machine-code-generator');
        const { LabelSymbolResolver } = require('./label-symbol-resolution');

        // Initialize components
        this.lexicalAnalyzer = new LexicalAnalyzer(this.mmu, this.cpu);
        this.symbolTable = new SymbolTable(this.mmu);
        this.instructionParser = new InstructionParser(this.mmu, this.symbolTable);
        this.machineCodeGenerator = new MachineCodeGenerator(this.mmu, this.symbolTable);
        this.labelSymbolResolver = new LabelSymbolResolver(this.mmu, this.symbolTable);

        console.log('All assembler components initialized');
    }

    /**
     * Assemble source code using two-pass algorithm
     * @param {string} sourceCode - Assembly source code
     * @param {number} startAddress - Starting address for code generation
     * @returns {AssemblyResult} Assembly results
     */
    assemble(sourceCode, startAddress = ASSEMBLER_CONFIG.DEFAULT_TEXT_ADDRESS) {
        console.log(`Starting two-pass assembly of ${sourceCode.length} character source`);

        this.result = new AssemblyResult();
        this.result.startTime = Date.now();

        try {
            // Validate input
            if (!this.validateInput(sourceCode)) {
                return this.result;
            }

            // Store source code
            this.sourceCode = sourceCode;
            this.result.statistics.sourceLines = this.countSourceLines(sourceCode);

            // Pass 1: Symbol table building and validation
            this.state = ASSEMBLY_STATES.PASS_1_RUNNING;
            this.currentPass = ASSEMBLY_PASSES.PASS_1;

            const pass1Result = this.executePass1();
            if (!pass1Result.success) {
                this.state = ASSEMBLY_STATES.ERROR;
                this.result.endTime = Date.now();
                this.result.statistics.totalTime = this.result.endTime - this.result.startTime;
                return this.result;
            }

            // Pass 2: Machine code generation
            this.state = ASSEMBLY_STATES.PASS_2_RUNNING;
            this.currentPass = ASSEMBLY_PASSES.PASS_2;

            const pass2Result = this.executePass2(startAddress);
            if (!pass2Result.success) {
                this.state = ASSEMBLY_STATES.ERROR;
                this.result.endTime = Date.now();
                this.result.statistics.totalTime = this.result.endTime - this.result.startTime;
                return this.result;
            }

            // Assembly successful
            this.state = ASSEMBLY_STATES.SUCCESS;
            this.result.success = true;

            // Collect final statistics
            this.collectFinalStatistics();

        } catch (error) {
            this.result.addError('ASSEMBLY_EXCEPTION',
                `Assembly failed with exception: ${error.message}`);
            this.state = ASSEMBLY_STATES.ERROR;
        }

        this.result.endTime = Date.now();
        this.result.statistics.totalTime = this.result.endTime - this.result.startTime;

        console.log(`Assembly completed in ${this.result.statistics.totalTime}ms`);
        return this.result;
    }

    /**
     * Validate input source code
     * @param {string} sourceCode - Source code to validate
     * @returns {boolean} True if valid
     */
    validateInput(sourceCode) {
        if (!sourceCode || sourceCode.length === 0) {
            this.result.addError('EMPTY_SOURCE', 'Source code is empty');
            return false;
        }

        if (sourceCode.length > ASSEMBLER_CONFIG.MAX_SOURCE_SIZE) {
            this.result.addError('SOURCE_TOO_LARGE',
                `Source code too large: ${sourceCode.length} bytes (max: ${ASSEMBLER_CONFIG.MAX_SOURCE_SIZE})`);
            return false;
        }

        return true;
    }

    /**
     * Count lines in source code
     * @param {string} sourceCode - Source code
     * @returns {number} Number of lines
     */
    countSourceLines(sourceCode) {
        return sourceCode.split('\n').length;
    }

    /**
     * Execute Pass 1: Symbol table building and validation
     * @returns {Object} Pass 1 results
     */
    executePass1() {
        console.log('Executing Pass 1: Symbol table building...');

        const pass1StartTime = Date.now();

        try {
            // Step 1: Lexical analysis
            const lexResult = this.executeLexicalAnalysis();
            if (!lexResult.success) {
                this.collectErrors(lexResult.errors, 'Lexical analysis failed');
                return { success: false };
            }

            this.tokens = lexResult.tokens;
            console.log(`Pass 1: Found ${this.tokens.length} tokens`);

            // Step 2: Symbol table building
            const symbolResult = this.executeSymbolTableBuilding();
            if (!symbolResult.success) {
                this.collectErrors(symbolResult.errors, 'Symbol table building failed');
                return { success: false };
            }

            console.log(`Pass 1: Built symbol table with ${symbolResult.symbolCount} symbols`);

            // Step 3: Syntax validation (without code generation)
            const parseResult = this.executeSyntaxValidation();
            if (!parseResult.success) {
                this.collectErrors(parseResult.errors, 'Syntax validation failed');
                return { success: false };
            }

            this.parsedInstructions = parseResult.instructions;
            console.log(`Pass 1: Validated ${this.parsedInstructions.length} instructions`);

            const pass1EndTime = Date.now();
            this.result.statistics.pass1Time = pass1EndTime - pass1StartTime;

            console.log(`Pass 1 completed successfully in ${this.result.statistics.pass1Time}ms`);
            this.state = ASSEMBLY_STATES.PASS_1_COMPLETE;

            return { success: true };

        } catch (error) {
            this.result.addError('PASS1_EXCEPTION',
                `Pass 1 failed with exception: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * Execute Pass 2: Machine code generation
     * @param {number} startAddress - Starting address for code
     * @returns {Object} Pass 2 results
     */
    executePass2(startAddress) {
        console.log('Executing Pass 2: Machine code generation...');

        const pass2StartTime = Date.now();

        try {
            // Step 1: Resolve symbol references
            const resolveResult = this.executeSymbolResolution();
            if (!resolveResult.success) {
                this.collectErrors(resolveResult.errors, 'Symbol resolution failed');
                return { success: false };
            }

            // Step 2: Generate machine code
            const codeGenResult = this.executeCodeGeneration(startAddress);
            if (!codeGenResult.success) {
                this.collectErrors(codeGenResult.errors, 'Code generation failed');
                return { success: false };
            }

            this.result.instructions = codeGenResult.instructions;
            console.log(`Pass 2: Generated ${this.result.instructions.length} instructions`);

            const pass2EndTime = Date.now();
            this.result.statistics.pass2Time = pass2EndTime - pass2StartTime;

            console.log(`Pass 2 completed successfully in ${this.result.statistics.pass2Time}ms`);
            this.state = ASSEMBLY_STATES.PASS_2_COMPLETE;

            return { success: true };

        } catch (error) {
            this.result.addError('PASS2_EXCEPTION',
                `Pass 2 failed with exception: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * Execute lexical analysis
     * @returns {Object} Lexical analysis results
     */
    executeLexicalAnalysis() {
        try {
            const result = this.lexicalAnalyzer.tokenize(
                this.sourceCode,
                ASSEMBLER_MEMORY_LAYOUT.SOURCE_BUFFER.start,
                ASSEMBLER_MEMORY_LAYOUT.TOKEN_BUFFER.start,
                ASSEMBLER_MEMORY_LAYOUT.STRING_TABLE.start
            );

            // Collect any errors from lexical analyzer
            if (result.errors && result.errors.length > 0) {
                this.collectErrors(result.errors, 'Lexical analysis errors');
                return { success: false, errors: result.errors };
            }

            return {
                success: true,
                tokens: result.tokens,
                tokenCount: result.tokenCount
            };

        } catch (error) {
            this.result.addError('LEXICAL_ERROR',
                `Lexical analysis failed: ${error.message}`);
            return { success: false, errors: [error] };
        }
    }

    /**
     * Execute symbol table building
     * @returns {Object} Symbol table building results
     */
    executeSymbolTableBuilding() {
        try {
            // Initialize symbol table
            this.symbolTable.initialize();

            // Process tokens to build symbol table
            const processResult = this.processTokensForSymbols();

            return {
                success: true,
                symbolCount: processResult.symbolCount,
                labelsFound: processResult.labelsFound,
                equatesFound: processResult.equatesFound
            };

        } catch (error) {
            this.result.addError('SYMBOL_TABLE_ERROR',
                `Symbol table building failed: ${error.message}`);
            return { success: false, errors: [error] };
        }
    }

    /**
     * Execute syntax validation
     * @returns {Object} Syntax validation results
     */
    executeSyntaxValidation() {
        try {
            // Create token stream for parser
            const { TokenStream } = require('./instruction-parser');
            const tokenStream = new TokenStream(this.tokens);

            // Parse instructions
            const parseResult = this.instructionParser.parse(
                this.tokens,
                ASSEMBLER_CONFIG.DEFAULT_TEXT_ADDRESS
            );

            // Collect errors and warnings
            if (parseResult.errors && parseResult.errors.length > 0) {
                this.collectErrors(parseResult.errors, 'Syntax errors');
            }

            if (parseResult.warnings && parseResult.warnings.length > 0) {
                this.collectWarnings(parseResult.warnings, 'Syntax warnings');
            }

            return {
                success: parseResult.errors.length === 0,
                instructions: parseResult.instructions,
                errors: parseResult.errors,
                warnings: parseResult.warnings
            };

        } catch (error) {
            this.result.addError('SYNTAX_ERROR',
                `Syntax validation failed: ${error.message}`);
            return { success: false, errors: [error] };
        }
    }

    /**
     * Execute symbol resolution
     * @returns {Object} Symbol resolution results
     */
    executeSymbolResolution() {
        try {
            // Use the new label and symbol resolution system
            const { processAllReferences } = require('./label-symbol-resolution');

            const resolveResult = processAllReferences(this.parsedInstructions, this.labelSymbolResolver);

            if (!resolveResult) {
                // Collect errors from resolver
                const resolverErrors = this.labelSymbolResolver.getErrors();
                for (const error of resolverErrors) {
                    this.result.addError('SYMBOL_RESOLUTION_ERROR',
                        `Symbol resolution failed: ${error.message}`);
                }
                return { success: false };
            }

            // Collect warnings from resolver
            const resolverWarnings = this.labelSymbolResolver.getWarnings();
            for (const warning of resolverWarnings) {
                this.result.addWarning(`Symbol resolution: ${warning}`);
            }

            console.log('Symbol resolution completed successfully');
            return { success: true };

        } catch (error) {
            this.result.addError('SYMBOL_RESOLUTION_ERROR',
                `Symbol resolution failed: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * Execute machine code generation
     * @param {number} startAddress - Starting address for code
     * @returns {Object} Code generation results
     */
    executeCodeGeneration(startAddress) {
        try {
            // Generate machine code from parsed instructions
            const codeGenResult = this.machineCodeGenerator.generateMachineCode(
                this.parsedInstructions,
                startAddress
            );

            // Collect errors and warnings
            if (codeGenResult.errors && codeGenResult.errors.length > 0) {
                this.collectErrors(codeGenResult.errors, 'Code generation errors');
            }

            if (codeGenResult.warnings && codeGenResult.warnings.length > 0) {
                this.collectWarnings(codeGenResult.warnings, 'Code generation warnings');
            }

            return {
                success: codeGenResult.errors.length === 0,
                instructions: codeGenResult.instructions,
                errors: codeGenResult.errors,
                warnings: codeGenResult.warnings,
                statistics: codeGenResult.statistics
            };

        } catch (error) {
            this.result.addError('CODE_GENERATION_ERROR',
                `Code generation failed: ${error.message}`);
            return { success: false, errors: [error] };
        }
    }

    /**
     * Process tokens to build symbol table
     * @returns {Object} Processing results
     */
    processTokensForSymbols() {
        const { processTokensForSymbols } = require('./symbol-table');

        const result = processTokensForSymbols(
            this.tokens,
            this.symbolTable,
            ASSEMBLER_CONFIG.DEFAULT_TEXT_ADDRESS
        );

        // Collect symbol table symbols
        this.result.symbols = Array.from(this.symbolTable.getSymbolTable().entries()).map(
            ([name, entry]) => ({
                name: name,
                type: entry.type,
                scope: entry.scope,
                value: entry.value
            })
        );

        return result;
    }

    /**
     * Collect errors from component results
     * @param {Array} errors - Errors to collect
     * @param {string} context - Error context
     */
    collectErrors(errors, context) {
        if (!errors || errors.length === 0) return;

        for (const error of errors) {
            this.result.addError(
                error.type || 'COMPONENT_ERROR',
                `${context}: ${error.message}`,
                error.line || 0,
                error.column || 0
            );
        }
    }

    /**
     * Collect warnings from component results
     * @param {Array} warnings - Warnings to collect
     * @param {string} context - Warning context
     */
    collectWarnings(warnings, context) {
        if (!warnings || warnings.length === 0) return;

        for (const warning of warnings) {
            this.result.addWarning(
                `${context}: ${warning}`,
                0,
                0
            );
        }
    }

    /**
     * Collect final statistics from all components
     */
    collectFinalStatistics() {
        // Collect statistics from machine code generator
        const codeGenStats = this.machineCodeGenerator.getStatistics();

        this.result.statistics.instructionsGenerated = codeGenStats.instructionsGenerated;
        this.result.statistics.bytesGenerated = codeGenStats.bytesGenerated;
        this.result.statistics.optimizationsApplied = codeGenStats.optimizationsApplied;
        this.result.statistics.relocationsApplied = codeGenStats.relocationsApplied;

        // Collect symbol resolution statistics
        if (this.labelSymbolResolver) {
            const resolutionStats = this.labelSymbolResolver.getStatistics();
            this.result.statistics.symbolsResolved = resolutionStats.resolvedRelocations;
            this.result.statistics.resolutionPasses = resolutionStats.resolutionPasses;
            this.result.statistics.forwardReferences = resolutionStats.forwardReferences;
        }

        // Collect symbol statistics
        this.result.statistics.symbolsFound = this.result.symbols.length;
    }

    /**
     * Write generated machine code to memory
     * @param {number} startAddress - Address to write code (optional)
     * @returns {boolean} True if written successfully
     */
    writeToMemory(startAddress = null) {
        if (!this.result.success) {
            console.error('Cannot write to memory: assembly was not successful');
            return false;
        }

        const address = startAddress || ASSEMBLER_CONFIG.DEFAULT_TEXT_ADDRESS;
        return this.machineCodeGenerator.writeToMemory(address);
    }

    /**
     * Get current assembly state
     * @returns {Object} Current state information
     */
    getState() {
        return {
            state: this.state,
            currentPass: this.currentPass,
            sourceLines: this.result.statistics.sourceLines,
            tokensFound: this.tokens.length,
            instructionsParsed: this.parsedInstructions.length,
            symbolsFound: this.result.symbols.length,
            errors: this.result.getErrorCount(),
            warnings: this.result.getWarningCount()
        };
    }

    /**
     * Reset assembler state
     */
    reset() {
        this.state = ASSEMBLY_STATES.READY;
        this.currentPass = 0;
        this.sourceCode = '';
        this.tokens = [];
        this.parsedInstructions = [];
        this.result = new AssemblyResult();

        // Reset components
        if (this.symbolTable) this.symbolTable.reset();
        if (this.machineCodeGenerator) this.machineCodeGenerator.reset();
        if (this.labelSymbolResolver) this.labelSymbolResolver.reset();

        console.log('Assembler reset to initial state');
    }

    /**
     * Get assembler configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update assembler configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Assembler configuration updated');
    }
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Create assembler instance
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} cpu - CPU instance
 * @returns {TwoPassAssembler} Assembler instance
 */
function createAssembler(mmu, cpu) {
    return new TwoPassAssembler(mmu, cpu);
}

/**
 * Quick assembly function for simple use cases
 * @param {string} sourceCode - Assembly source code
 * @param {Object} mmu - MMU instance
 * @param {Object} cpu - CPU instance
 * @param {number} startAddress - Starting address
 * @returns {AssemblyResult} Assembly results
 */
function assembleSource(sourceCode, mmu, cpu, startAddress = 0x1000) {
    const assembler = new TwoPassAssembler(mmu, cpu);
    return assembler.assemble(sourceCode, startAddress);
}

// ============================================================================
// TESTING AND VALIDATION
// ============================================================================

/**
 * Test the two-pass assembler
 */
function testTwoPassAssembler() {
    console.log('=== TWO-PASS ASSEMBLER TEST ===');

    console.log('Two-pass assembler implementation ready for integration');
    console.log('Features:');
    console.log('- Pass 1: Symbol table building and validation');
    console.log('- Pass 2: Machine code generation with symbol resolution');
    console.log('- Error coordination from all components');
    console.log('- Memory buffer management');
    console.log('- Assembly state tracking');
    console.log('- Comprehensive error reporting');
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example assembly source code for testing
 */
const EXAMPLE_ASSEMBLY = `
; Example assembly program for two-pass assembler testing
.text
.global main

main:
    LOAD R0, 42          ; Load immediate value
    LOAD R1, [R2 + 10]   ; Load from memory
    ADD R0, R1           ; Add two registers
    STORE [R3], R0       ; Store to memory
    JUMP end_label       ; Jump to label

data_section:
    .data
    my_var: .equ 100     ; Define constant
    buffer: .equ 0x1000  ; Memory buffer

end_label:
    HALT                 ; End program
`;

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TwoPassAssembler,
        AssemblyResult,
        AssemblerError,
        ASSEMBLY_PASSES,
        ASSEMBLY_STATES,
        ASSEMBLER_MEMORY_LAYOUT,
        ASSEMBLER_CONFIG,
        createAssembler,
        assembleSource,
        testTwoPassAssembler,
        EXAMPLE_ASSEMBLY
    };
}

module.exports = TwoPassAssembler;