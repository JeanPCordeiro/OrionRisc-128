/**
 * Debug System Calls - Minimal test case to isolate system call issues
 */

const RiscProcessor = require('./src/emulation/cpu/RiscProcessor');
const MemoryManagementUnit = require('./src/emulation/memory/MemoryManagementUnit');
const OperatingSystemKernel = require('./src/system/os/OperatingSystemKernel');

console.log('=== SYSTEM CALL DEBUGGING SESSION ===\n');

// Create hardware components
const mmu = new MemoryManagementUnit();
const cpu = new RiscProcessor(mmu);
const os = new OperatingSystemKernel(cpu, mmu);

// Initialize the system
console.log('1. Initializing system...');
const initResult = os.initialize();
console.log(`   Initialization result: ${initResult}`);
console.log(`   OS initialized: ${os.isInitialized}`);
console.log(`   OS running: ${os.isRunning}`);

// Create a simple test program with system calls
console.log('\n2. Creating test program with system calls...');

// System call numbers
const SYSTEM_CALLS = {
    PRINT_CHAR: 0x01,
    READ_CHAR: 0x02,
    EXIT: 0x03,
    GET_TIME: 0x05
};

// Create a simple program that works with current instruction set limitations:
// 1. Store character values in memory first (word-aligned addresses)
// 2. Load characters from memory into R0
// 3. Call PRINT_CHAR system call
// 4. Exit

// Memory layout for our data (all word-aligned):
// 0x0100: 'H' (0x48) - stored as word 0x00000048
// 0x0104: 'i' (0x69) - stored as word 0x00000069
// 0x0108: '!' (0x21) - stored as word 0x00000021
// 0x010C: newline (0x0A) - stored as word 0x0000000A
// 0x0110: syscall number for PRINT_CHAR (0x01)
// 0x0114: syscall number for EXIT (0x03)

const program = [];

// Initialize R1 as base register for memory addresses
program.push(0x01); // LOAD opcode
program.push(0x01); // R1, R0 (load 0 into R1 as base address)
program.push(0x00); // immediate high
program.push(0x00); // immediate low

// Store 'H' in memory at address 0x0100
program.push(0x01); // LOAD opcode
program.push(0x02); // R2, R0 (value to store = 'H' in R2)
program.push(0x00); // immediate high
program.push(0x48); // immediate low (0x48 = 'H')

program.push(0x02); // STORE opcode
program.push(0x02); // R2, R1 (store R2 to [R1 + 0x0100])
program.push(0x01); // immediate high (0x01)
program.push(0x00); // immediate low (0x0100)

// Store 'i' in memory at address 0x0104
program.push(0x01); // LOAD opcode
program.push(0x02); // R2, R0 (value to store = 'i' in R2)
program.push(0x00); // immediate high
program.push(0x69); // immediate low (0x69 = 'i')

program.push(0x02); // STORE opcode
program.push(0x02); // R2, R1 (store R2 to [R1 + 0x0104])
program.push(0x01); // immediate high (0x01)
program.push(0x04); // immediate low (0x0104)

// Store '!' in memory at address 0x0108
program.push(0x01); // LOAD opcode
program.push(0x02); // R2, R0 (value to store = '!' in R2)
program.push(0x00); // immediate high
program.push(0x21); // immediate low (0x21 = '!')

program.push(0x02); // STORE opcode
program.push(0x02); // R2, R1 (store R2 to [R1 + 0x0108])
program.push(0x01); // immediate high (0x01)
program.push(0x08); // immediate low (0x0108)

// Store newline in memory at address 0x010C
program.push(0x01); // LOAD opcode
program.push(0x02); // R2, R0 (value to store = newline in R2)
program.push(0x00); // immediate high
program.push(0x0A); // immediate low (0x0A = newline)

program.push(0x02); // STORE opcode
program.push(0x02); // R2, R1 (store R2 to [R1 + 0x010C])
program.push(0x01); // immediate high (0x01)
program.push(0x0C); // immediate low (0x010C)

// Store PRINT_CHAR syscall number (0x01) at address 0x0110
program.push(0x01); // LOAD opcode
program.push(0x02); // R2, R0 (syscall number in R2)
program.push(0x00); // immediate high
program.push(0x01); // immediate low (0x01 = PRINT_CHAR)

program.push(0x02); // STORE opcode
program.push(0x02); // R2, R1 (store R2 to [R1 + 0x0110])
program.push(0x01); // immediate high (0x01)
program.push(0x10); // immediate low (0x0110)

// Now print the characters:
// Print 'H'
program.push(0x01); // LOAD opcode
program.push(0x00); // R0, R1 (load from [R1 + 0x0100])
program.push(0x01); // immediate high (0x01)
program.push(0x00); // immediate low (0x0100)

program.push(0x05); // SYSCALL opcode
program.push(0x00); // R0, R0 (syscall number in R0)
program.push(0x00); // immediate high
program.push(0x01); // immediate low (PRINT_CHAR)

// Print 'i'
program.push(0x01); // LOAD opcode
program.push(0x00); // R0, R1 (load from [R1 + 0x0104])
program.push(0x01); // immediate high (0x01)
program.push(0x04); // immediate low (0x0104)

program.push(0x05); // SYSCALL opcode
program.push(0x00); // R0, R0
program.push(0x00); // immediate high
program.push(0x01); // immediate low (PRINT_CHAR)

// Print '!'
program.push(0x01); // LOAD opcode
program.push(0x00); // R0, R1 (load from [R1 + 0x0108])
program.push(0x01); // immediate high (0x01)
program.push(0x08); // immediate low (0x0108)

program.push(0x05); // SYSCALL opcode
program.push(0x00); // R0, R0
program.push(0x00); // immediate high
program.push(0x01); // immediate low (PRINT_CHAR)

// Print newline
program.push(0x01); // LOAD opcode
program.push(0x00); // R0, R1 (load from [R1 + 0x010C])
program.push(0x01); // immediate high (0x01)
program.push(0x0C); // immediate low (0x010C)

program.push(0x05); // SYSCALL opcode
program.push(0x00); // R0, R0
program.push(0x00); // immediate high
program.push(0x01); // immediate low (PRINT_CHAR)

// Exit program - load EXIT syscall number (0x03) directly into R0
program.push(0x01); // LOAD opcode
program.push(0x00); // R0, R0 (load EXIT syscall number)
program.push(0x00); // immediate high
program.push(0x03); // immediate low (0x03 = EXIT)

program.push(0x05); // SYSCALL opcode
program.push(0x00); // R0, R0
program.push(0x00); // immediate high
program.push(0x03); // immediate low (EXIT)

console.log(`   Created program with ${program.length} bytes`);
console.log(`   First 16 bytes: [${program.slice(0, 16).map(b => `0x${b.toString(16)}`).join(', ')}]`);

// Load the program
console.log('\n3. Loading program into memory...');
const loadResult = os.loadProgram(program, 'syscall-debug-test');
console.log(`   Load result: ${loadResult}`);

// Check system status
const status = os.getSystemStatus();
console.log(`   Loaded programs: ${status.loadedPrograms.length}`);
console.log(`   Program start address: 0x${status.loadedPrograms[0]?.startAddress?.toString(16) || 'unknown'}`);

// Execute the program
console.log('\n4. Executing program...');
console.log('   Expected output: Hi!<newline>');
const executeResult = os.executeProgram('syscall-debug-test');
console.log(`   Execute result: ${executeResult}`);

console.log('\n5. Final system state:');
console.log(`   CPU halted: ${cpu.isHalted}`);
console.log(`   CPU running: ${cpu.isRunning}`);
console.log(`   Final PC: 0x${cpu.getProgramCounter().toString(16)}`);

console.log('\n=== DEBUG SESSION COMPLETE ===');