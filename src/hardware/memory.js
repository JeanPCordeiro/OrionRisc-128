/**
 * OrionRisc-128 Memory Management System
 *
 * Provides 128KB of RAM for the emulated system.
 * Supports byte and word access operations.
 */

class Memory {
    constructor() {
        // 128KB memory space (131,072 bytes)
        this.size = 128 * 1024; // 0x20000 bytes
        this.data = new Uint8Array(this.size);

        // Memory-mapped I/O regions
        this.IO_START = 0x1FF00;  // Start of I/O region
        this.IO_SIZE = 256;       // 256 bytes for I/O

        // Initialize memory to zero
        this.clear();
    }

    /**
     * Clear all memory to zero
     */
    clear() {
        this.data.fill(0);
    }

    /**
     * Read a byte from memory
     * @param {number} address - 17-bit address (0 to 0x1FFFF)
     * @returns {number} Byte value (0-255)
     */
    readByte(address) {
        address = address & 0x1FFFF; // Mask to 17-bit address space

        if (address >= this.IO_START && address < this.IO_START + this.IO_SIZE) {
            return this.readIO(address - this.IO_START);
        }

        return this.data[address];
    }

    /**
     * Write a byte to memory
     * @param {number} address - 17-bit address (0 to 0x1FFFF)
     * @param {number} value - Byte value (0-255)
     */
    writeByte(address, value) {
        address = address & 0x1FFFF; // Mask to 17-bit address space
        value = value & 0xFF;        // Mask to 8 bits

        if (address >= this.IO_START && address < this.IO_START + this.IO_SIZE) {
            this.writeIO(address - this.IO_START, value);
            return;
        }

        this.data[address] = value;
    }

    /**
     * Read a 16-bit word from memory (little-endian)
     * @param {number} address - 17-bit address (must be even)
     * @returns {number} 16-bit word value
     */
    readWord(address) {
        const addr1 = address & 0x1FFFF;
        const addr2 = (address + 1) & 0x1FFFF;

        const lowByte = this.readByte(addr1);
        const highByte = this.readByte(addr2);

        return (highByte << 8) | lowByte;
    }

    /**
     * Write a 16-bit word to memory (little-endian)
     * @param {number} address - 17-bit address (must be even)
     * @param {number} value - 16-bit word value
     */
    writeWord(address, value) {
        const addr1 = address & 0x1FFFF;
        const addr2 = (address + 1) & 0x1FFFF;

        const lowByte = value & 0xFF;
        const highByte = (value >> 8) & 0xFF;

        this.writeByte(addr1, lowByte);
        this.writeByte(addr2, highByte);
    }

    /**
     * Read I/O register
     * @param {number} offset - I/O register offset (0-255)
     * @returns {number} I/O register value
     */
    readIO(offset) {
        // For now, return 0 for all I/O reads
        // In a full implementation, this would interface with actual I/O devices
        return 0;
    }

    /**
     * Write I/O register
     * @param {number} offset - I/O register offset (0-255)
     * @param {number} value - Value to write
     */
    writeIO(offset, value) {
        // For now, ignore I/O writes
        // In a full implementation, this would interface with actual I/O devices
        // console.log(`I/O write: offset=${offset}, value=${value}`);
    }

    /**
     * Load a program into memory
     * @param {Uint16Array} program - Array of 16-bit words
     * @param {number} startAddress - Starting address (default: 0)
     */
    loadProgram(program, startAddress = 0) {
        for (let i = 0; i < program.length; i++) {
            const address = startAddress + (i * 2);
            this.writeWord(address, program[i]);
        }
    }

    /**
     * Load binary data into memory
     * @param {Uint8Array} data - Binary data
     * @param {number} startAddress - Starting address (default: 0)
     */
    loadData(data, startAddress = 0) {
        for (let i = 0; i < data.length && i < this.size - startAddress; i++) {
            this.writeByte(startAddress + i, data[i]);
        }
    }

    /**
     * Dump memory contents as an array of bytes
     * @param {number} start - Start address
     * @param {number} length - Number of bytes to dump
     * @returns {Uint8Array} Memory contents
     */
    dump(start = 0, length = this.size) {
        const end = Math.min(start + length, this.size);
        return this.data.slice(start, end);
    }

    /**
     * Get memory usage statistics
     * @returns {object} Memory statistics
     */
    getStats() {
        let used = 0;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] !== 0) {
                used++;
            }
        }

        return {
            total: this.size,
            used: used,
            free: this.size - used,
            usagePercent: (used / this.size) * 100
        };
    }

    /**
     * Check if address is valid
     * @param {number} address - Address to check
     * @returns {boolean} True if address is valid
     */
    isValidAddress(address) {
        return address >= 0 && address < this.size;
    }

    /**
     * Get a range of memory as words for debugging
     * @param {number} startAddress - Start address
     * @param {number} wordCount - Number of words to read
     * @returns {Uint16Array} Array of words
     */
    readWords(startAddress, wordCount) {
        const words = new Uint16Array(wordCount);
        for (let i = 0; i < wordCount; i++) {
            words[i] = this.readWord(startAddress + (i * 2));
        }
        return words;
    }

    /**
     * Write words to memory for debugging
     * @param {number} startAddress - Start address
     * @param {Uint16Array} words - Words to write
     */
    writeWords(startAddress, words) {
        for (let i = 0; i < words.length; i++) {
            this.writeWord(startAddress + (i * 2), words[i]);
        }
    }

    /**
     * Find a pattern in memory
     * @param {Uint8Array} pattern - Byte pattern to search for
     * @param {number} start - Start address (default: 0)
     * @returns {number|null} Address of first match or null if not found
     */
    findPattern(pattern, start = 0) {
        const end = this.size - pattern.length;

        for (let i = start; i <= end; i++) {
            let found = true;

            for (let j = 0; j < pattern.length; j++) {
                if (this.data[i + j] !== pattern[j]) {
                    found = false;
                    break;
                }
            }

            if (found) {
                return i;
            }
        }

        return null;
    }

    /**
     * Copy memory from one region to another
     * @param {number} source - Source address
     * @param {number} destination - Destination address
     * @param {number} length - Number of bytes to copy
     */
    copy(source, destination, length) {
        const sourceEnd = source + length;
        const destEnd = destination + length;

        // Check for overlap and handle appropriately
        if (source < destination && sourceEnd > destination) {
            // Overlapping copy - copy backwards
            for (let i = length - 1; i >= 0; i--) {
                this.data[destination + i] = this.data[source + i];
            }
        } else {
            // Non-overlapping or forward copy
            for (let i = 0; i < length; i++) {
                this.data[destination + i] = this.data[source + i];
            }
        }
    }

    /**
     * Fill a memory region with a value
     * @param {number} address - Start address
     * @param {number} length - Number of bytes to fill
     * @param {number} value - Value to fill with
     */
    fill(address, length, value) {
        value = value & 0xFF;
        const end = Math.min(address + length, this.size);

        for (let i = address; i < end; i++) {
            this.data[i] = value;
        }
    }

    /**
     * Get memory as a formatted hex dump for debugging
     * @param {number} start - Start address
     * @param {number} lines - Number of lines to dump (16 bytes per line)
     * @returns {string} Formatted hex dump
     */
    hexDump(start = 0, lines = 16) {
        let result = '';

        for (let line = 0; line < lines; line++) {
            const address = start + (line * 16);
            if (address >= this.size) break;

            let lineStr = `${address.toString(16).padStart(5, '0')}: `;

            // Hex bytes
            for (let i = 0; i < 16; i++) {
                if (address + i >= this.size) {
                    lineStr += '   ';
                } else {
                    lineStr += this.data[address + i].toString(16).padStart(2, '0') + ' ';
                }
            }

            // ASCII representation
            lineStr += ' ';
            for (let i = 0; i < 16; i++) {
                if (address + i >= this.size) {
                    lineStr += ' ';
                } else {
                    const byte = this.data[address + i];
                    lineStr += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
                }
            }

            result += lineStr + '\n';
        }

        return result;
    }
}

module.exports = Memory;