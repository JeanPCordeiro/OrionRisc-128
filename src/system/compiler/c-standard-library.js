/**
 * OrionRisc-128 C Standard Library - Phase 3 Implementation
 *
 * This file contains assembly language implementations of essential C standard library
 * functions for the OrionRisc-128 system. These functions are written in assembly
 * language and serve as the foundation for C program development.
 *
 * The library functions follow the RISC processor calling conventions:
 * - Parameters passed in R0-R3 (first 4 parameters)
 * - Additional parameters passed on stack
 * - Return values in R0 (integers) or R0/R1 (larger values)
 * - Stack frame management for local variables
 */

class CStandardLibrary {
    constructor(mmu, cpu) {
        this.mmu = mmu;
        this.cpu = cpu;

        // System call numbers for I/O operations
        this.SYSCALL = {
            PUTCHAR: 1,    // Output character to console
            GETCHAR: 2,    // Read character from console
            PUTS: 3,       // Output string to console
            GETS: 4,       // Read string from console
            EXIT: 5,       // Terminate program
            MALLOC: 6,     // Allocate memory
            FREE: 7,       // Free memory
            PRINTF: 8      // Formatted output
        };

        // Library function addresses (to be loaded into memory)
        this.FUNCTION_ADDRESSES = {
            // I/O Functions
            printf: 0x1000,
            putchar: 0x1100,
            getchar: 0x1200,
            puts: 0x1300,
            gets: 0x1400,

            // String Functions
            strlen: 0x2000,
            strcpy: 0x2100,
            strcmp: 0x2200,
            strcat: 0x2300,
            memset: 0x2400,
            memcpy: 0x2500,

            // Memory Functions
            malloc: 0x3000,
            free: 0x3100,
            calloc: 0x3200,
            realloc: 0x3300,

            // Math Functions
            abs: 0x4000,
            rand: 0x4100,
            srand: 0x4200,

            // Utility Functions
            exit: 0x5000,
            atoi: 0x5100,
            itoa: 0x5200
        };

        // Memory management
        this.heapStart = 0x8000;
        this.heapEnd = 0xEFFF;
        this.nextFreeAddress = this.heapStart;
        this.freeList = [];
    }

    /**
     * Load all standard library functions into memory
     */
    loadLibrary() {
        console.log('Loading C Standard Library into memory...');

        // Load I/O functions
        this.loadPrintf();
        this.loadPutchar();
        this.loadGetchar();
        this.loadPuts();
        this.loadGets();

        // Load string functions
        this.loadStrlen();
        this.loadStrcpy();
        this.loadStrcmp();
        this.loadStrcat();
        this.loadMemset();
        this.loadMemcpy();

        // Load memory functions
        this.loadMalloc();
        this.loadFree();
        this.loadCalloc();
        this.loadRealloc();

        // Load math functions
        this.loadAbs();
        this.loadRand();
        this.loadSrand();

        // Load utility functions
        this.loadExit();
        this.loadAtoi();
        this.loadItoa();

        console.log('C Standard Library loaded successfully');
    }

    /**
     * I/O Functions Implementation
     */

    loadPrintf() {
        // printf implementation - simplified version supporting %d, %s, %c, %x
        const printfCode = [
            // Function prologue - save registers and set up stack frame
            0x00000000, // NOP - placeholder for function entry

            // Simplified printf implementation
            // Parameters: format string address in R0, arguments in R1-R3
            // For now, just output the format string as-is
            // Real implementation would parse format specifiers

            // Load format string address
            // This is a placeholder - real implementation would parse % format specifiers
            0x00000000, // NOP

            // Function epilogue - restore registers and return
            0x00000000  // NOP
        ];

        // Load into memory at printf address
        this.loadFunctionCode(this.FUNCTION_ADDRESSES.printf, printfCode);
    }

    loadPutchar() {
        // putchar(c) - output single character
        const putcharCode = [
            // Function prologue
            0x00000000, // NOP

            // Put character from R0 to console via syscall
            // R0 contains character to output
            (this.SYSCALL.PUTCHAR << 24) | 0x000000, // SYSCALL PUTCHAR

            // Return 0 on success (character value)
            0x01000000, // LOAD R0, 0 (return success)

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.putchar, putcharCode);
    }

    loadGetchar() {
        // getchar() - read single character
        const getcharCode = [
            // Function prologue
            0x00000000, // NOP

            // Get character from console via syscall
            (this.SYSCALL.GETCHAR << 24) | 0x000000, // SYSCALL GETCHAR
            // Result will be in R0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.getchar, getcharCode);
    }

    loadPuts() {
        // puts(str) - output string followed by newline
        const putsCode = [
            // Function prologue - save registers
            0x00000000, // NOP

            // R0 contains string address
            // Output string via syscall
            (this.SYSCALL.PUTS << 24) | 0x000000, // SYSCALL PUTS

            // Output newline character
            0x01000A00, // LOAD R0, 10 (newline character)
            (this.SYSCALL.PUTCHAR << 24) | 0x000000, // SYSCALL PUTCHAR

            // Return 0 on success
            0x01000000, // LOAD R0, 0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.puts, putsCode);
    }

    loadGets() {
        // gets(str) - read string from input
        const getsCode = [
            // Function prologue
            0x00000000, // NOP

            // R0 contains buffer address
            // Read string via syscall
            (this.SYSCALL.GETS << 24) | 0x000000, // SYSCALL GETS

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.gets, getsCode);
    }

    /**
     * String Functions Implementation
     */

    loadStrlen() {
        // strlen(str) - calculate string length
        const strlenCode = [
            // Function prologue - R0 contains string address
            0x00000000, // NOP

            // Initialize length counter in R1 = 0
            0x01100000, // LOAD R1, 0

            // Load string address into R2
            0x02000000, // LOAD R2, R0

            // Main loop: load character and check for null terminator
            // strlen_loop:
            0x03020000, // LOAD R3, [R2 + 0]  // Load character from string

            // Check if character is null (end of string)
            0x00000000, // NOP - placeholder for comparison

            // If not null, increment counter and continue
            0x01110001, // ADD R1, 1  // Increment length
            0x02020001, // ADD R2, 1  // Move to next character
            0x00000000, // NOP - placeholder for jump back to loop

            // Return length in R0
            0x00010000, // LOAD R0, R1

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.strlen, strlenCode);
    }

    loadStrcpy() {
        // strcpy(dest, src) - copy string
        const strcpyCode = [
            // Function prologue - R0 = dest, R1 = src
            0x00000000, // NOP

            // Load addresses into working registers
            0x02000000, // LOAD R2, R0  // R2 = dest
            0x03000001, // LOAD R3, R1  // R3 = src

            // Copy loop
            // strcpy_loop:
            0x04030000, // LOAD R4, [R3 + 0]  // Load character from src
            0x05020004, // STORE R4, [R2 + 0] // Store to dest

            // Check for null terminator
            0x00000000, // NOP - placeholder for null check

            // If not null, continue copying
            0x02020001, // ADD R2, 1  // Increment dest pointer
            0x03030001, // ADD R3, 1  // Increment src pointer
            0x00000000, // NOP - placeholder for loop jump

            // Return dest address in R0
            0x00000000, // NOP

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.strcpy, strcpyCode);
    }

    loadStrcmp() {
        // strcmp(s1, s2) - compare strings
        const strcmpCode = [
            // Function prologue - R0 = s1, R1 = s2
            0x00000000, // NOP

            // Load string addresses
            0x02000000, // LOAD R2, R0  // R2 = s1
            0x03000001, // LOAD R3, R1  // R3 = s2

            // Compare loop
            // strcmp_loop:
            0x04020000, // LOAD R4, [R2 + 0]  // Load char from s1
            0x05030000, // LOAD R5, [R3 + 0]  // Load char from s2

            // Compare characters
            0x04050004, // SUB R4, R5  // R4 = s1_char - s2_char

            // If different, return difference
            0x00000000, // NOP - placeholder for conditional return

            // If same, check for null terminator
            0x00000000, // NOP - placeholder for null check

            // If not null, continue comparing
            0x02020001, // ADD R2, 1
            0x03030001, // ADD R3, 1
            0x00000000, // NOP - placeholder for loop jump

            // Strings are equal, return 0
            0x00000000, // LOAD R0, 0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.strcmp, strcmpCode);
    }

    loadStrcat() {
        // strcat(dest, src) - concatenate strings
        const strcatCode = [
            // Function prologue - R0 = dest, R1 = src
            0x00000000, // NOP

            // Find end of dest string
            0x02000000, // LOAD R2, R0  // R2 = dest

            // find_end_loop:
            0x03020000, // LOAD R3, [R2 + 0]  // Load character
            0x00000000, // NOP - placeholder for null check
            0x02020001, // ADD R2, 1  // Move to next character
            0x00000000, // NOP - placeholder for loop

            // R2 now points to end of dest, start copying src
            0x03000001, // LOAD R3, R1  // R3 = src

            // copy_loop:
            0x04030000, // LOAD R4, [R3 + 0]  // Load char from src
            0x05020004, // STORE R4, [R2 + 0] // Store to dest

            // Check for null terminator
            0x00000000, // NOP - placeholder for null check

            // If not null, continue
            0x02020001, // ADD R2, 1
            0x03030001, // ADD R3, 1
            0x00000000, // NOP - placeholder for loop

            // Return dest address
            0x00000000, // LOAD R0, R0  (dest address already in R0)

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.strcat, strcatCode);
    }

    loadMemset() {
        // memset(dest, value, count) - set memory to value
        const memsetCode = [
            // Function prologue - R0 = dest, R1 = value, R2 = count
            0x00000000, // NOP

            // Initialize counter in R3 = 0
            0x03100000, // LOAD R3, 0

            // Set loop
            // memset_loop:
            0x00000000, // NOP - placeholder for count check
            0x04120001, // STORE R1, [R0 + 0]  // Store value to memory

            // Increment pointers and counter
            0x00000001, // ADD R0, 1
            0x03130001, // ADD R3, 1

            // Loop back if not done
            0x00000000, // NOP - placeholder for loop

            // Return dest address
            0x00000000, // LOAD R0, R0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.memset, memsetCode);
    }

    loadMemcpy() {
        // memcpy(dest, src, count) - copy memory block
        const memcpyCode = [
            // Function prologue - R0 = dest, R1 = src, R2 = count
            0x00000000, // NOP

            // Initialize counter in R3 = 0
            0x03100000, // LOAD R3, 0

            // Copy loop
            // memcpy_loop:
            0x00000000, // NOP - placeholder for count check
            0x04110000, // LOAD R4, [R1 + 0]  // Load from src
            0x05020004, // STORE R4, [R0 + 0] // Store to dest

            // Increment pointers and counter
            0x00000001, // ADD R0, 1
            0x01110001, // ADD R1, 1
            0x03130001, // ADD R3, 1

            // Loop back if not done
            0x00000000, // NOP - placeholder for loop

            // Return dest address
            0x00000000, // LOAD R0, R0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.memcpy, memcpyCode);
    }

    /**
     * Memory Functions Implementation
     */

    loadMalloc() {
        // malloc(size) - allocate memory
        const mallocCode = [
            // Function prologue - R0 contains size
            0x00000000, // NOP

            // Simple malloc: just return next free address
            // Real implementation would manage free list
            0x01100000, // LOAD R1, R0  // R1 = size

            // Check if we have enough space
            0x00000000, // NOP - placeholder for space check

            // Allocate memory (simple bump pointer)
            0x02000000, // LOAD R2, nextFreeAddress (would need to be global)

            // Update next free address
            0x02020001, // ADD R2, R1
            0x00000000, // STORE R2, nextFreeAddress

            // Return allocated address in R0
            0x00020000, // LOAD R0, R2

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.malloc, mallocCode);
    }

    loadFree() {
        // free(ptr) - free memory (simplified)
        const freeCode = [
            // Function prologue - R0 contains pointer to free
            0x00000000, // NOP

            // Simple free: just add to free list
            // Real implementation would coalesce free blocks
            0x00000000, // NOP - placeholder for free list management

            // Return 0 on success
            0x01000000, // LOAD R0, 0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.free, freeCode);
    }

    loadCalloc() {
        // calloc(count, size) - allocate and clear memory
        const callocCode = [
            // Function prologue - R0 = count, R1 = size
            0x00000000, // NOP

            // Calculate total size: R2 = count * size
            0x02000000, // LOAD R2, R0  // R2 = count
            0x02020001, // MUL R2, R1  // R2 = count * size (would need MUL instruction)

            // Allocate memory using malloc logic
            0x00000000, // NOP - placeholder for malloc call

            // Clear allocated memory (set to 0)
            0x03000000, // LOAD R3, R0  // R3 = allocated address
            0x04000000, // LOAD R4, R2  // R4 = size
            0x01100000, // LOAD R1, 0   // R1 = 0 (value to set)

            // clear_loop:
            0x00000000, // NOP - placeholder for size check
            0x05130001, // STORE R1, [R3 + 0]  // Store 0 to memory
            0x03030001, // ADD R3, 1
            0x00000000, // NOP - placeholder for loop

            // Return allocated address
            0x00000000, // LOAD R0, R0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.calloc, callocCode);
    }

    loadRealloc() {
        // realloc(ptr, size) - reallocate memory
        const reallocCode = [
            // Function prologue - R0 = ptr, R1 = new size
            0x00000000, // NOP

            // For simplicity, just allocate new block and copy
            // Real implementation would check if can resize in place

            // Allocate new memory
            0x02000001, // LOAD R2, R1  // R2 = new size
            0x00000000, // NOP - placeholder for malloc call

            // Copy old data to new location
            0x03000000, // LOAD R3, R0  // R3 = old ptr
            0x04000000, // LOAD R4, R0  // R4 = new ptr
            0x05000001, // LOAD R5, R1  // R5 = size

            // copy_loop:
            0x00000000, // NOP - placeholder for size check
            0x06130000, // LOAD R6, [R3 + 0]  // Load from old location
            0x07040006, // STORE R6, [R4 + 0] // Store to new location
            0x03030001, // ADD R3, 1
            0x04040001, // ADD R4, 1
            0x00000000, // NOP - placeholder for loop

            // Free old memory
            0x00000000, // NOP - placeholder for free call

            // Return new address
            0x00000000, // LOAD R0, R0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.realloc, reallocCode);
    }

    /**
     * Math Functions Implementation
     */

    loadAbs() {
        // abs(n) - absolute value
        const absCode = [
            // Function prologue - R0 contains number
            0x00000000, // NOP

            // Check if negative (bit 31 set)
            0x00000000, // NOP - placeholder for sign check

            // If negative, negate
            0x01000000, // LOAD R1, 0
            0x01010000, // SUB R1, R0  // R1 = 0 - R0

            // Return absolute value in R0
            0x00010000, // LOAD R0, R1

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.abs, absCode);
    }

    loadRand() {
        // rand() - generate pseudo-random number
        const randCode = [
            // Function prologue
            0x00000000, // NOP

            // Simple linear congruential generator
            // Use a simple algorithm: next = (next * 1103515245 + 12345) & 0x7FFF

            // Load current seed (would need to be stored in memory)
            0x00000000, // NOP - placeholder for seed loading

            // Generate next random number
            0x00000000, // NOP - placeholder for LCG calculation

            // Return random number in R0
            0x00000000, // LOAD R0, R0

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.rand, randCode);
    }

    loadSrand() {
        // srand(seed) - set random seed
        const srandCode = [
            // Function prologue - R0 contains seed
            0x00000000, // NOP

            // Store seed in memory for rand() to use
            0x00000000, // NOP - placeholder for seed storage

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.srand, srandCode);
    }

    /**
     * Utility Functions Implementation
     */

    loadExit() {
        // exit(status) - terminate program
        const exitCode = [
            // Function prologue - R0 contains exit status
            0x00000000, // NOP

            // Call exit syscall
            (this.SYSCALL.EXIT << 24) | 0x000000, // SYSCALL EXIT

            // Function epilogue (won't be reached)
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.exit, exitCode);
    }

    loadAtoi() {
        // atoi(str) - convert string to integer
        const atoiCode = [
            // Function prologue - R0 contains string address
            0x00000000, // NOP

            // Initialize result in R1 = 0
            0x01100000, // LOAD R1, 0

            // Load string address into R2
            0x02000000, // LOAD R2, R0

            // Skip leading whitespace
            // skip_whitespace:
            0x03020000, // LOAD R3, [R2 + 0]  // Load character
            0x00000000, // NOP - placeholder for whitespace check
            0x02020001, // ADD R2, 1
            0x00000000, // NOP - placeholder for loop

            // Check for sign
            0x03020000, // LOAD R3, [R2 + 0]
            0x00000000, // NOP - placeholder for sign check

            // Convert digits to number
            // conversion_loop:
            0x03020000, // LOAD R3, [R2 + 0]  // Load digit character
            0x00000000, // NOP - placeholder for digit check

            // Convert ASCII digit to numeric value
            0x03030030, // SUB R3, 48  // '0' = 48 in ASCII

            // Multiply current result by 10 and add new digit
            0x0111000A, // LOAD R4, 10
            0x01110001, // MUL R1, R4  // R1 = result * 10
            0x01110003, // ADD R1, R3  // R1 = result * 10 + digit

            // Move to next character
            0x02020001, // ADD R2, 1

            // Loop if more digits
            0x00000000, // NOP - placeholder for loop

            // Return result in R0
            0x00010000, // LOAD R0, R1

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.atoi, atoiCode);
    }

    loadItoa() {
        // itoa(n, str, base) - convert integer to string
        const itoaCode = [
            // Function prologue - R0 = number, R1 = buffer, R2 = base
            0x00000000, // NOP

            // Handle special case of 0
            0x00000000, // NOP - placeholder for zero check

            // Handle negative numbers (for base 10)
            0x00000000, // NOP - placeholder for sign handling

            // Generate digits in reverse order
            0x03000000, // LOAD R3, R0  // R3 = number
            0x04000001, // LOAD R4, R1  // R4 = buffer pointer

            // digit_loop:
            0x00000000, // NOP - placeholder for division
            0x00000000, // NOP - placeholder for remainder

            // Convert remainder to ASCII digit
            0x00000000, // NOP - placeholder for digit conversion

            // Store digit in buffer
            0x05040000, // STORE R5, [R4 + 0]

            // Move buffer pointer
            0x04040001, // ADD R4, 1

            // Loop if quotient != 0
            0x00000000, // NOP - placeholder for loop

            // Add null terminator
            0x01000000, // LOAD R1, 0
            0x05040001, // STORE R1, [R4 + 0]

            // Reverse the string in place
            0x00000000, // NOP - placeholder for string reversal

            // Return buffer address
            0x00010000, // LOAD R0, R1

            // Function epilogue
            0x00000000  // NOP
        ];

        this.loadFunctionCode(this.FUNCTION_ADDRESSES.itoa, itoaCode);
    }

    /**
     * Helper function to load function code into memory
     */
    loadFunctionCode(address, code) {
        const byteData = [];
        for (let i = 0; i < code.length; i++) {
            const instruction = code[i];
            // Split 32-bit instruction into 4 bytes (big-endian)
            byteData.push((instruction >> 24) & 0xFF);
            byteData.push((instruction >> 16) & 0xFF);
            byteData.push((instruction >> 8) & 0xFF);
            byteData.push(instruction & 0xFF);
        }

        this.mmu.loadMemory(address, byteData);
        console.log(`Loaded function at address 0x${address.toString(16)} (${code.length} instructions)`);
    }

    /**
     * Get function address by name
     */
    getFunctionAddress(functionName) {
        return this.FUNCTION_ADDRESSES[functionName] || 0;
    }

    /**
     * Get all function addresses for linking
     */
    getAllFunctionAddresses() {
        return { ...this.FUNCTION_ADDRESSES };
    }
}

module.exports = CStandardLibrary;