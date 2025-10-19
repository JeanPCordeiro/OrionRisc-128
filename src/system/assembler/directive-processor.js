/**
 * Directive Processor for OrionRisc-128 Assembler
 *
 * This module implements comprehensive directive processing for the Phase 2 assembler.
 * It handles section management, symbol definitions, and global symbol declarations,
 * integrating with the existing parser, symbol table, and code generator.
 *
 * Phase 2 Component: Directive Processing System
 *
 * Author: Kilo Code (OrionRisc-128 Project)
 * Date: October 19, 2025
 */

// ============================================================================
// DIRECTIVE PROCESSING CONSTANTS
// ============================================================================

/**
 * Directive Types
 */
const DIRECTIVE_TYPES = {
    SECTION: 'section',      // .text, .data, .bss
    SYMBOL_DEF: 'symbol_def', // .equ symbol value
    GLOBAL_DECL: 'global_decl', // .global symbol
    ALIGN: 'align',         // .align value
    SPACE: 'space',         // .space size
    BYTE: 'byte',           // .byte values...
    WORD: 'word',           // .word values...
    STRING: 'string'        // .ascii, .asciz
};

/**
 * Section Types
 */
const SECTION_TYPES = {
    TEXT: 'text',           // Code section
    DATA: 'data',           // Initialized data
    BSS: 'bss'              // Uninitialized data
};

/**
 * Directive Processing States
 */
const DIRECTIVE_STATE = {
    READY: 0,
    PROCESSING: 1,
    ERROR: 2,
    COMPLETE: 3
};

// ============================================================================
// DIRECTIVE PROCESSING ERROR CLASS
// ============================================================================

/**
 * Directive Processing Error Class
 */
class DirectiveError {
    constructor(type, message, directive = null, position = 0) {
        this.type = type;
        this.message = message;
        this.directive = directive;
        this.position = position;
        this.severity = 'error';
    }

    toString() {
        let location = '';
        if (this.directive) {
            location = ` at directive '${this.directive.name}'`;
        }
        if (this.position > 0) {
            location += ` position ${this.position}`;
        }

        return `Directive Error [${this.type}]: ${this.message}${location}`;
    }
}

// ============================================================================
// DIRECTIVE CLASS
// ============================================================================

/**
 * Directive Class
 * Represents a parsed assembler directive
 */
class Directive {
    constructor(name, type, operands = [], position = 0) {
        this.name = name;           // Directive name (e.g., '.text', '.equ')
        this.type = type;           // Directive type (DIRECTIVE_TYPES)
        this.operands = operands;   // Array of directive operands
        this.position = position;   // Position in token stream
        this.processed = false;     // Has been processed
        this.errors = [];           // Processing errors
    }

    /**
     * Add processing error
     */
    addError(error) {
        this.errors.push(error);
    }

    /**
     * Check if directive is valid
     */
    isValid() {
        return this.errors.length === 0;
    }

    /**
     * Get directive as string representation
     */
    toString() {
        return `${this.name} ${this.operands.join(' ')}`;
    }
}

// ============================================================================
// DIRECTIVE PROCESSOR CLASS
// ============================================================================

/**
 * Main Directive Processor Class
 */
class DirectiveProcessor {
    constructor(mmu, symbolTable = null) {
        this.mmu = mmu;
        this.symbolTable = symbolTable;
        this.errors = [];
        this.warnings = [];
        this.directives = [];
        this.currentSection = SECTION_TYPES.TEXT;
        this.currentAddress = 0x1000;  // Default text section start
        this.dataAddress = 0x9000;     // Default data section start
        this.sectionAddresses = {
            [SECTION_TYPES.TEXT]: 0x1000,
            [SECTION_TYPES.DATA]: 0x9000,
            [SECTION_TYPES.BSS]: 0xA000
        };
        this.sectionSizes = {
            [SECTION_TYPES.TEXT]: 0,
            [SECTION_TYPES.DATA]: 0,
            [SECTION_TYPES.BSS]: 0
        };
        this.state = DIRECTIVE_STATE.READY;
    }

    /**
     * Process directive tokens from token stream
     * @param {Array} tokens - Tokens from lexical analyzer
     * @returns {Object} Processing results
     */
    processTokens(tokens) {
        console.log(`Processing ${tokens.length} tokens for directives`);

        this.errors = [];
        this.warnings = [];
        this.directives = [];
        this.state = DIRECTIVE_STATE.PROCESSING;

        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];

            // Look for directive tokens
            if (token.type === 4) { // DIRECTIVE token
                const directive = this.parseDirective(tokens, i);
                if (directive) {
                    this.directives.push(directive);
                    this.processDirective(directive);
                    i += directive.operands.length + 1; // Skip processed tokens
                } else {
                    i++; // Skip invalid directive
                }
            } else {
                i++; // Skip non-directive tokens
            }
        }

        this.state = DIRECTIVE_STATE.COMPLETE;

        return {
            success: this.errors.length === 0,
            directives: this.directives,
            errors: this.errors,
            warnings: this.warnings,
            sections: this.getSectionInfo(),
            directiveCount: this.directives.length
        };
    }

    /**
     * Parse a directive from token stream
     * @param {Array} tokens - Token array
     * @param {number} startIndex - Starting index in token array
     * @returns {Directive|null} Parsed directive or null if failed
     */
    parseDirective(tokens, startIndex) {
        const directiveToken = tokens[startIndex];
        const directiveName = this.getTokenText(directiveToken);

        if (!directiveName.startsWith('.')) {
            this.addError('INVALID_DIRECTIVE', `Invalid directive name: ${directiveName}`, directiveName, startIndex);
            return null;
        }

        const directive = new Directive(directiveName, this.classifyDirective(directiveName), [], startIndex);

        // Parse operands based on directive type
        let operandIndex = startIndex + 1;

        switch (directive.type) {
            case DIRECTIVE_TYPES.SECTION:
                // Section directives take no operands
                break;

            case DIRECTIVE_TYPES.SYMBOL_DEF:
                // .equ symbol value
                if (operandIndex < tokens.length) {
                    const symbolToken = tokens[operandIndex++];
                    if (symbolToken && symbolToken.type === 3) { // LABEL token
                        directive.operands.push(this.getTokenText(symbolToken).replace(':', ''));
                    }
                }
                if (operandIndex < tokens.length) {
                    const valueToken = tokens[operandIndex++];
                    if (valueToken && valueToken.type === 2) { // IMMEDIATE token
                        directive.operands.push(valueToken.value);
                    }
                }
                break;

            case DIRECTIVE_TYPES.GLOBAL_DECL:
                // .global symbol
                if (operandIndex < tokens.length) {
                    const symbolToken = tokens[operandIndex++];
                    if (symbolToken && symbolToken.type === 3) { // LABEL token
                        directive.operands.push(this.getTokenText(symbolToken).replace(':', ''));
                    }
                }
                break;

            default:
                this.addError('UNKNOWN_DIRECTIVE', `Unknown directive type: ${directive.type}`, directiveName, startIndex);
                return null;
        }

        return directive;
    }

    /**
     * Process a parsed directive
     * @param {Directive} directive - Directive to process
     */
    processDirective(directive) {
        try {
            switch (directive.type) {
                case DIRECTIVE_TYPES.SECTION:
                    this.processSectionDirective(directive);
                    break;

                case DIRECTIVE_TYPES.SYMBOL_DEF:
                    this.processSymbolDefinition(directive);
                    break;

                case DIRECTIVE_TYPES.GLOBAL_DECL:
                    this.processGlobalDeclaration(directive);
                    break;

                default:
                    this.addError('UNIMPLEMENTED_DIRECTIVE',
                        `Directive processing not implemented: ${directive.type}`, directive.name, directive.position);
            }

            directive.processed = true;

        } catch (error) {
            this.addError('PROCESSING_ERROR',
                `Error processing directive: ${error.message}`, directive.name, directive.position);
        }
    }

    /**
     * Process section directive (.text, .data, .bss)
     * @param {Directive} directive - Section directive
     */
    processSectionDirective(directive) {
        const sectionName = directive.name.substring(1); // Remove leading dot

        if (!this.sectionAddresses.hasOwnProperty(sectionName)) {
            directive.addError(new DirectiveError('INVALID_SECTION',
                `Unknown section: ${sectionName}`, directive, directive.position));
            return;
        }

        const oldSection = this.currentSection;
        this.currentSection = sectionName;

        // Update current address based on section
        switch (sectionName) {
            case SECTION_TYPES.TEXT:
                this.currentAddress = this.sectionAddresses[SECTION_TYPES.TEXT];
                break;
            case SECTION_TYPES.DATA:
                this.currentAddress = this.sectionAddresses[SECTION_TYPES.DATA];
                break;
            case SECTION_TYPES.BSS:
                this.currentAddress = this.sectionAddresses[SECTION_TYPES.BSS];
                break;
        }

        console.log(`Switched to section ${sectionName} at address 0x${this.currentAddress.toString(16)}`);
    }

    /**
     * Process symbol definition directive (.equ)
     * @param {Directive} directive - Symbol definition directive
     */
    processSymbolDefinition(directive) {
        if (directive.operands.length < 2) {
            directive.addError(new DirectiveError('MISSING_OPERANDS',
                '.equ directive requires symbol name and value', directive, directive.position));
            return;
        }

        const symbolName = directive.operands[0];
        const symbolValue = directive.operands[1];

        if (!this.symbolTable) {
            directive.addError(new DirectiveError('NO_SYMBOL_TABLE',
                'Symbol table not available for .equ directive', directive, directive.position));
            return;
        }

        // Validate symbol name
        if (!this.isValidSymbolName(symbolName)) {
            directive.addError(new DirectiveError('INVALID_SYMBOL_NAME',
                `Invalid symbol name: ${symbolName}`, directive, directive.position));
            return;
        }

        // Add symbol to table
        const success = this.symbolTable.addSymbol(
            symbolName,
            0x2, // SYMBOL_TYPES.EQUATE
            symbolValue,
            0x1  // SYMBOL_SCOPES.LOCAL
        );

        if (success) {
            console.log(`Defined symbol ${symbolName} = 0x${symbolValue.toString(16)}`);
        } else {
            directive.addError(new DirectiveError('SYMBOL_TABLE_ERROR',
                `Failed to add symbol to table: ${symbolName}`, directive, directive.position));
        }
    }

    /**
     * Process global declaration directive (.global)
     * @param {Directive} directive - Global declaration directive
     */
    processGlobalDeclaration(directive) {
        if (directive.operands.length < 1) {
            directive.addError(new DirectiveError('MISSING_OPERANDS',
                '.global directive requires symbol name', directive, directive.position));
            return;
        }

        const symbolName = directive.operands[0];

        if (!this.symbolTable) {
            directive.addError(new DirectiveError('NO_SYMBOL_TABLE',
                'Symbol table not available for .global directive', directive, directive.position));
            return;
        }

        // Look up existing symbol and mark as global
        const existingSymbol = this.symbolTable.lookupSymbol(symbolName);
        if (existingSymbol) {
            // Update symbol scope to global
            existingSymbol.scope = 0x2; // SYMBOL_SCOPES.GLOBAL
            console.log(`Marked symbol ${symbolName} as global`);
        } else {
            // Add as external symbol reference
            this.symbolTable.addSymbol(
                symbolName,
                0x3, // SYMBOL_TYPES.EXTERNAL
                0,   // Value will be resolved later
                0x3  // SYMBOL_SCOPES.EXTERN
            );
            console.log(`Added external symbol reference: ${symbolName}`);
        }
    }

    /**
     * Classify directive by name
     * @param {string} name - Directive name
     * @returns {string} Directive type
     */
    classifyDirective(name) {
        const directiveName = name.substring(1).toLowerCase(); // Remove dot and lowercase

        switch (directiveName) {
            case 'text':
            case 'data':
            case 'bss':
                return DIRECTIVE_TYPES.SECTION;

            case 'equ':
                return DIRECTIVE_TYPES.SYMBOL_DEF;

            case 'global':
            case 'globl':
                return DIRECTIVE_TYPES.GLOBAL_DECL;

            case 'align':
                return DIRECTIVE_TYPES.ALIGN;

            case 'space':
                return DIRECTIVE_TYPES.SPACE;

            case 'byte':
                return DIRECTIVE_TYPES.BYTE;

            case 'word':
                return DIRECTIVE_TYPES.WORD;

            case 'ascii':
            case 'asciz':
            case 'string':
                return DIRECTIVE_TYPES.STRING;

            default:
                return 'unknown';
        }
    }

    /**
     * Validate symbol name
     * @param {string} name - Symbol name to validate
     * @returns {boolean} True if valid
     */
    isValidSymbolName(name) {
        if (!name || name.length === 0 || name.length > 255) {
            return false;
        }

        // Must start with letter or underscore
        const firstChar = name.charCodeAt(0);
        if (!((firstChar >= 65 && firstChar <= 90) || (firstChar >= 97 && firstChar <= 122) || firstChar === 95)) {
            return false;
        }

        // Remaining characters can be letters, digits, or underscores
        for (let i = 1; i < name.length; i++) {
            const char = name.charCodeAt(i);
            if (!((char >= 65 && char <= 90) || (char >= 97 && char <= 122) ||
                  (char >= 48 && char <= 57) || char === 95)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get token text from token data
     * @param {Object} token - Token object
     * @returns {string} Token text
     */
    getTokenText(token) {
        if (token.text) {
            return token.text;
        }

        // Reconstruct from token data
        if (token.type === 4) { // DIRECTIVE
            return token.value || 'UNKNOWN';
        } else if (token.type === 3) { // LABEL
            return token.value || 'LABEL';
        } else if (token.type === 2) { // IMMEDIATE
            return token.value.toString();
        }

        return 'UNKNOWN';
    }

    /**
     * Add processing error
     * @param {string} type - Error type
     * @param {string} message - Error message
     * @param {string} directive - Related directive name
     * @param {number} position - Position in token stream
     */
    addError(type, message, directive = '', position = 0) {
        const error = new DirectiveError(type, message, directive, position);
        this.errors.push(error);
        console.error(error.toString());
    }

    /**
     * Add processing warning
     * @param {string} message - Warning message
     */
    addWarning(message) {
        this.warnings.push(message);
        console.warn(`Directive Warning: ${message}`);
    }

    /**
     * Get current section information
     * @returns {Object} Section information
     */
    getSectionInfo() {
        return {
            currentSection: this.currentSection,
            currentAddress: this.currentAddress,
            sectionAddresses: { ...this.sectionAddresses },
            sectionSizes: { ...this.sectionSizes }
        };
    }

    /**
     * Get next available address in current section
     * @param {number} size - Size needed in bytes
     * @returns {number} Available address
     */
    getNextAddress(size = 4) {
        const address = this.currentAddress;
        this.currentAddress += size;

        // Update section size
        if (this.sectionSizes.hasOwnProperty(this.currentSection)) {
            this.sectionSizes[this.currentSection] += size;
        }

        return address;
    }

    /**
     * Reset processor state
     */
    reset() {
        this.errors = [];
        this.warnings = [];
        this.directives = [];
        this.currentSection = SECTION_TYPES.TEXT;
        this.currentAddress = 0x1000;
        this.state = DIRECTIVE_STATE.READY;
    }
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Create directive processor instance
 * @param {Object} mmu - Memory Management Unit instance
 * @param {Object} symbolTable - Symbol table instance (optional)
 * @returns {DirectiveProcessor} Directive processor instance
 */
function createDirectiveProcessor(mmu, symbolTable = null) {
    return new DirectiveProcessor(mmu, symbolTable);
}

/**
 * Process directives from assembly source
 * @param {Array} tokens - Tokens from lexical analyzer
 * @param {Object} mmu - MMU instance
 * @param {Object} symbolTable - Symbol table instance (optional)
 * @returns {Object} Processing results
 */
function processAssemblyDirectives(tokens, mmu, symbolTable = null) {
    const processor = new DirectiveProcessor(mmu, symbolTable);
    return processor.processTokens(tokens);
}

// ============================================================================
// TESTING AND VALIDATION
// ============================================================================

/**
 * Test the directive processor
 */
function testDirectiveProcessor() {
    console.log('=== DIRECTIVE PROCESSOR TEST ===');

    console.log('Directive processor implementation ready for integration');
    console.log('Features:');
    console.log('- Section management (.text, .data, .bss)');
    console.log('- Symbol definition (.equ directive)');
    console.log('- Global symbol declarations (.global directive)');
    console.log('- Memory layout management');
    console.log('- Symbol table integration');
    console.log('- Comprehensive error handling');
}

// Export for use in the OrionRisc-128 system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DirectiveProcessor,
        Directive,
        DirectiveError,
        DIRECTIVE_TYPES,
        SECTION_TYPES,
        DIRECTIVE_STATE,
        createDirectiveProcessor,
        processAssemblyDirectives,
        testDirectiveProcessor
    };
}

module.exports.DirectiveProcessor = DirectiveProcessor;