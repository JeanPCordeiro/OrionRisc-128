/**
 * OrionRisc-128 I/O Device Abstraction Layer
 *
 * Provides unified I/O interface for all hardware devices.
 * Routes I/O operations from processor to appropriate devices.
 */

class IODevice {
    constructor(name, baseAddress, size) {
        this.name = name;
        this.baseAddress = baseAddress;
        this.size = size;
        this.endAddress = baseAddress + size - 1;
    }

    /**
     * Check if address is in device range
     * @param {number} address - Address to check
     * @returns {boolean} True if address is in range
     */
    inRange(address) {
        return address >= this.baseAddress && address <= this.endAddress;
    }

    /**
     * Read from device register
     * @param {number} address - Register address
     * @returns {number} Register value
     */
    read(address) {
        throw new Error(`Read not implemented for ${this.name}`);
    }

    /**
     * Write to device register
     * @param {number} address - Register address
     * @param {number} value - Value to write
     */
    write(address, value) {
        throw new Error(`Write not implemented for ${this.name}`);
    }
}

class GraphicsDevice extends IODevice {
    constructor(graphics) {
        super('Graphics', 0x0000, 0x0100); // 256 bytes for graphics I/O
        this.graphics = graphics;
    }

    read(address) {
        const offset = address - this.baseAddress;
        return this.graphics.readRegister(offset);
    }

    write(address, value) {
        const offset = address - this.baseAddress;
        this.graphics.writeRegister(offset, value);
    }
}

class StorageDevice extends IODevice {
    constructor(storage) {
        super('Storage', 0x0100, 0x0100); // 256 bytes for storage I/O
        this.storage = storage;
    }

    read(address) {
        const offset = address - this.baseAddress;
        return this.storage.readRegister(offset);
    }

    write(address, value) {
        const offset = address - this.baseAddress;
        this.storage.writeRegister(offset, value);
    }
}

class TimerDevice extends IODevice {
    constructor() {
        super('Timer', 0x0200, 0x0010); // 16 bytes for timer I/O
        this.startTime = Date.now();
        this.lastRead = 0;
    }

    read(address) {
        const offset = address - this.baseAddress;

        switch (offset) {
            case 0x00: // Timer low byte
                return (this.getTimerValue() & 0xFF);

            case 0x01: // Timer high byte
                return (this.getTimerValue() >> 8) & 0xFF;

            case 0x02: // Timer control
                return 0x00;

            default:
                return 0x00;
        }
    }

    write(address, value) {
        const offset = address - this.baseAddress;

        switch (offset) {
            case 0x02: // Timer control
                // Timer control operations
                break;
        }
    }

    getTimerValue() {
        return Math.floor((Date.now() - this.startTime) / 10); // 100Hz timer
    }
}

class KeyboardDevice extends IODevice {
    constructor() {
        super('Keyboard', 0x0300, 0x0010); // 16 bytes for keyboard I/O
        this.keyBuffer = [];
        this.status = 0x00;

        // Listen for keyboard events
        this.setupKeyboardListener();
    }

    setupKeyboardListener() {
        document.addEventListener('keydown', (event) => {
            if (!event.repeat) {
                this.keyBuffer.push(event.key.charCodeAt(0));
                this.status |= 0x01; // Data available
            }
        });
    }

    read(address) {
        const offset = address - this.baseAddress;

        switch (offset) {
            case 0x00: // Data register
                if (this.keyBuffer.length > 0) {
                    const key = this.keyBuffer.shift();
                    if (this.keyBuffer.length === 0) {
                        this.status &= ~0x01; // No data available
                    }
                    return key;
                }
                return 0x00;

            case 0x01: // Status register
                return this.status;

            default:
                return 0x00;
        }
    }

    write(address, value) {
        // Keyboard is read-only
    }
}

class SerialDevice extends IODevice {
    constructor() {
        super('Serial', 0x0400, 0x0010); // 16 bytes for serial I/O
        this.txBuffer = [];
        this.rxBuffer = [];
        this.status = 0x00;
    }

    read(address) {
        const offset = address - this.baseAddress;

        switch (offset) {
            case 0x00: // Receive data
                if (this.rxBuffer.length > 0) {
                    return this.rxBuffer.shift();
                }
                return 0x00;

            case 0x01: // Status
                return this.status;

            default:
                return 0x00;
        }
    }

    write(address, value) {
        const offset = address - this.baseAddress;

        switch (offset) {
            case 0x00: // Transmit data
                this.txBuffer.push(value);
                this.transmitData(value);
                break;

            case 0x01: // Control
                this.status = value;
                break;
        }
    }

    transmitData(data) {
        // For now, just log to console
        // In a full implementation, this would send data over serial
        console.log(`Serial TX: ${String.fromCharCode(data)}`);
    }

    receiveData(data) {
        this.rxBuffer.push(data);
    }
}

class InterruptController extends IODevice {
    constructor() {
        super('Interrupt Controller', 0x0500, 0x0010); // 16 bytes for interrupts
        this.pendingInterrupts = 0x00;
        this.enabledInterrupts = 0x00;
        this.callbacks = {};
    }

    read(address) {
        const offset = address - this.baseAddress;

        switch (offset) {
            case 0x00: // Pending interrupts
                return this.pendingInterrupts;

            case 0x01: // Enabled interrupts
                return this.enabledInterrupts;

            default:
                return 0x00;
        }
    }

    write(address, value) {
        const offset = address - this.baseAddress;

        switch (offset) {
            case 0x00: // Acknowledge interrupt
                this.pendingInterrupts &= ~value;
                break;

            case 0x01: // Enable interrupts
                this.enabledInterrupts |= value;
                break;

            case 0x02: // Disable interrupts
                this.enabledInterrupts &= ~value;
                break;
        }
    }

    /**
     * Trigger an interrupt
     * @param {number} interrupt - Interrupt number (0-7)
     */
    triggerInterrupt(interrupt) {
        if (interrupt >= 0 && interrupt < 8) {
            this.pendingInterrupts |= (1 << interrupt);

            // Call registered callback if any
            if (this.callbacks[interrupt]) {
                this.callbacks[interrupt]();
            }
        }
    }

    /**
     * Register interrupt callback
     * @param {number} interrupt - Interrupt number
     * @param {function} callback - Callback function
     */
    onInterrupt(interrupt, callback) {
        this.callbacks[interrupt] = callback;
    }
}

class IOManager {
    constructor(graphics, storage) {
        this.devices = [];

        // Initialize devices
        this.graphics = new GraphicsDevice(graphics);
        this.storage = new StorageDevice(storage);
        this.timer = new TimerDevice();
        this.keyboard = new KeyboardDevice();
        this.serial = new SerialDevice();
        this.interrupts = new InterruptController();

        // Register devices
        this.registerDevice(this.graphics);
        this.registerDevice(this.storage);
        this.registerDevice(this.timer);
        this.registerDevice(this.keyboard);
        this.registerDevice(this.serial);
        this.registerDevice(this.interrupts);

        // I/O memory space (0x0000 - 0x1FFFF, but I/O is 0x0000 - 0x05FF)
        this.ioSpace = new Uint8Array(0x0600); // 1536 bytes for I/O
    }

    /**
     * Register an I/O device
     * @param {IODevice} device - Device to register
     */
    registerDevice(device) {
        this.devices.push(device);
    }

    /**
     * Read from I/O address
     * @param {number} address - I/O address
     * @returns {number} Byte value
     */
    readByte(address) {
        // Check device I/O first
        for (const device of this.devices) {
            if (device.inRange(address)) {
                return device.read(address);
            }
        }

        // Check I/O memory space
        if (address >= 0 && address < this.ioSpace.length) {
            return this.ioSpace[address];
        }

        return 0x00;
    }

    /**
     * Write to I/O address
     * @param {number} address - I/O address
     * @param {number} value - Byte value
     */
    writeByte(address, value) {
        // Check device I/O first
        for (const device of this.devices) {
            if (device.inRange(address)) {
                device.write(address, value);
                return;
            }
        }

        // Check I/O memory space
        if (address >= 0 && address < this.ioSpace.length) {
            this.ioSpace[address] = value & 0xFF;
        }
    }

    /**
     * Read 16-bit word from I/O
     * @param {number} address - I/O address
     * @returns {number} 16-bit word
     */
    readWord(address) {
        const lowByte = this.readByte(address);
        const highByte = this.readByte(address + 1);
        return (highByte << 8) | lowByte;
    }

    /**
     * Write 16-bit word to I/O
     * @param {number} address - I/O address
     * @param {number} value - 16-bit word
     */
    writeWord(address, value) {
        const lowByte = value & 0xFF;
        const highByte = (value >> 8) & 0xFF;

        this.writeByte(address, lowByte);
        this.writeByte(address + 1, highByte);
    }

    /**
     * Get device by name
     * @param {string} name - Device name
     * @returns {IODevice|null} Device or null if not found
     */
    getDevice(name) {
        return this.devices.find(device => device.name === name) || null;
    }

    /**
     * Get all devices
     * @returns {Array} Array of devices
     */
    getDevices() {
        return [...this.devices];
    }

    /**
     * Reset all I/O devices
     */
    reset() {
        this.ioSpace.fill(0);

        // Reset each device if it has a reset method
        for (const device of this.devices) {
            if (typeof device.reset === 'function') {
                device.reset();
            }
        }
    }

    /**
     * Update I/O devices (called on each emulation cycle)
     */
    update() {
        // Update timer
        // Timer updates automatically via Date.now()

        // Check for keyboard input
        // Keyboard updates via event listeners

        // Update serial device if needed
        // Serial updates via callbacks
    }

    /**
     * Get I/O statistics
     * @returns {object} I/O statistics
     */
    getStats() {
        return {
            devices: this.devices.length,
            ioSpaceSize: this.ioSpace.length,
            devices: this.devices.map(device => ({
                name: device.name,
                baseAddress: device.baseAddress,
                size: device.size
            }))
        };
    }

    /**
     * Dump I/O memory for debugging
     * @param {number} start - Start address
     * @param {number} length - Length to dump
     * @returns {Uint8Array} I/O memory contents
     */
    dumpIOMemory(start = 0, length = this.ioSpace.length) {
        return this.ioSpace.slice(start, Math.min(start + length, this.ioSpace.length));
    }
}

module.exports = IOManager;