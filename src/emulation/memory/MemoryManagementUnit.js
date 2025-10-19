/**
 * Memory Management Unit (MMU) for OrionRisc-128
 * Provides 128KB RAM with memory-mapped I/O support
 */
class MemoryManagementUnit {
    constructor() {
        // Initialize 128KB RAM (0x0000-0xFFFF)
        this.RAM_SIZE = 0x10000; // 65536 bytes
        this.MEMORY_MAPPED_IO_START = 0xF000; // Memory-mapped I/O region
        this.MEMORY_MAPPED_IO_SIZE = 0x1000;  // 4KB for I/O

        // Create memory as Uint8Array for efficient byte operations
        this.memory = new Uint8Array(this.RAM_SIZE);

        // Initialize memory to zero
        this.clearMemory();

        console.log(`MMU initialized: ${this.RAM_SIZE} bytes RAM (${this.RAM_SIZE / 1024}KB)`);
    }

    /**
     * Clear all memory to zero
     */
    clearMemory() {
        this.memory.fill(0);
    }

    /**
     * Validate memory address
     * @param {number} address - Memory address to validate
     * @throws {Error} If address is out of bounds
     */
    validateAddress(address) {
        if (typeof address !== 'number' || isNaN(address)) {
            throw new Error(`Invalid address: ${address}. Address must be a number.`);
        }

        if (address < 0 || address >= this.RAM_SIZE) {
            throw new Error(`Address out of bounds: 0x${address.toString(16)}. Valid range: 0x0000-0x${(this.RAM_SIZE - 1).toString(16)}`);
        }
    }

    /**
     * Check if address is in memory-mapped I/O region
     * @param {number} address - Memory address to check
     * @returns {boolean} True if address is in MMIO region
     */
    isMemoryMappedIO(address) {
        return address >= this.MEMORY_MAPPED_IO_START && address < (this.MEMORY_MAPPED_IO_START + this.MEMORY_MAPPED_IO_SIZE);
    }

    /**
     * Read a single byte from memory
     * @param {number} address - Memory address (0x0000-0xFFFF)
     * @returns {number} Byte value (0-255)
     */
    readByte(address) {
        this.validateAddress(address);
        return this.memory[address];
    }

    /**
     * Write a single byte to memory
     * @param {number} address - Memory address (0x0000-0xFFFF)
     * @param {number} value - Byte value to write (0-255)
     */
    writeByte(address, value) {
        this.validateAddress(address);

        // Validate value
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(`Invalid value: ${value}. Value must be a number.`);
        }

        if (value < 0 || value > 255) {
            throw new Error(`Value out of range: ${value}. Valid range: 0-255`);
        }

        this.memory[address] = value;
    }

    /**
     * Read a 32-bit word from memory (little-endian)
     * @param {number} address - Memory address (must be word-aligned)
     * @returns {number} 32-bit word value
     */
    readWord(address) {
        this.validateAddress(address);

        // Check word alignment
        if (address % 4 !== 0) {
            throw new Error(`Unaligned word access at address 0x${address.toString(16)}. Address must be divisible by 4.`);
        }

        // Read 4 bytes and combine into 32-bit word (little-endian)
        const byte0 = this.memory[address];
        const byte1 = this.memory[address + 1];
        const byte2 = this.memory[address + 2];
        const byte3 = this.memory[address + 3];

        // Use arithmetic operations to avoid JavaScript bitwise operator limitations
        return (byte3 * 0x1000000) + (byte2 * 0x10000) + (byte1 * 0x100) + byte0;
    }

    /**
     * Write a 32-bit word to memory (little-endian)
     * @param {number} address - Memory address (must be word-aligned)
     * @param {number} value - 32-bit word value to write
     */
    writeWord(address, value) {
        this.validateAddress(address);

        // Check word alignment
        if (address % 4 !== 0) {
            throw new Error(`Unaligned word access at address 0x${address.toString(16)}. Address must be divisible by 4.`);
        }

        // Validate value
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(`Invalid value: ${value}. Value must be a number.`);
        }

        if (value < 0 || value > 0xFFFFFFFF) {
            throw new Error(`Value out of range: ${value}. Valid range: 0-0xFFFFFFFF`);
        }

        // Split 32-bit word into 4 bytes (little-endian)
        const byte0 = (value >> 0) & 0xFF;
        const byte1 = (value >> 8) & 0xFF;
        const byte2 = (value >> 16) & 0xFF;
        const byte3 = (value >> 24) & 0xFF;

        // Write bytes to memory
        this.memory[address] = byte0;
        this.memory[address + 1] = byte1;
        this.memory[address + 2] = byte2;
        this.memory[address + 3] = byte3;
    }

    /**
     * Load an array of bytes into memory
     * @param {number} startAddress - Starting memory address
     * @param {Array|Uint8Array} data - Array of byte values
     */
    loadMemory(startAddress, data) {
        this.validateAddress(startAddress);

        if (!Array.isArray(data) && !(data instanceof Uint8Array)) {
            throw new Error('Data must be an array or Uint8Array');
        }

        // Check if data fits within memory bounds
        if (startAddress + data.length > this.RAM_SIZE) {
            throw new Error(`Data too large: ${data.length} bytes. Available space: ${this.RAM_SIZE - startAddress} bytes`);
        }

        // Copy data into memory
        for (let i = 0; i < data.length; i++) {
            const address = startAddress + i;
            const value = data[i];

            // Validate each byte value
            if (typeof value !== 'number' || isNaN(value) || value < 0 || value > 255) {
                throw new Error(`Invalid byte value at index ${i}: ${value}. Must be 0-255`);
            }

            this.memory[address] = value;
        }

        console.log(`Loaded ${data.length} bytes into memory starting at 0x${startAddress.toString(16)}`);
    }

    /**
     * Get memory statistics
     * @returns {Object} Memory usage information
     */
    getMemoryStats() {
        let usedBytes = 0;
        for (let i = 0; i < this.RAM_SIZE; i++) {
            if (this.memory[i] !== 0) {
                usedBytes++;
            }
        }

        return {
            totalBytes: this.RAM_SIZE,
            usedBytes: usedBytes,
            freeBytes: this.RAM_SIZE - usedBytes,
            memoryMappedIOStart: this.MEMORY_MAPPED_IO_START,
            memoryMappedIOSize: this.MEMORY_MAPPED_IO_SIZE,
            utilizationPercent: ((usedBytes / this.RAM_SIZE) * 100).toFixed(2)
        };
    }

    /**
     * Dump memory contents as array of bytes
     * @param {number} startAddress - Start address (default: 0x0000)
     * @param {number} length - Number of bytes to dump (default: 256)
     * @returns {Uint8Array} Memory contents
     */
    dumpMemory(startAddress = 0x0000, length = 256) {
        this.validateAddress(startAddress);

        if (startAddress + length > this.RAM_SIZE) {
            length = this.RAM_SIZE - startAddress;
        }

        return new Uint8Array(this.memory.slice(startAddress, startAddress + length));
    }
}

module.exports = MemoryManagementUnit;