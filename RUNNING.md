# Running the OrionRisc-128 System

## Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the system**:
   ```bash
   npm start
   ```

3. **Access the system**:
   - Open your browser and go to: `http://localhost:3000`
   - The complete 1980s-style computer interface will be displayed

## System Architecture

The OrionRisc-128 system consists of several integrated layers:

### 1. Hardware Emulation Layer (`src/emulation/`)
- **CPU**: 32-bit RISC processor with 16 registers
- **MMU**: 128KB RAM with memory-mapped I/O
- **GPU**: 640x200 monochrome graphics with 80x25 text mode
- **FDC**: Two 360KB floppy disk drives with FAT12 file system

### 2. System Software Layer (`src/system/`)
- **OS Kernel**: Program loading, execution, and I/O management
- **Assembler**: Machine language to binary translation
- **C Compiler**: C source to assembly compilation
- **BASIC Interpreter**: High-level programming interface

### 3. Communication Layer (`src/communication/`)
- **WebSocket Handler**: Real-time frontend-backend communication
- **Message Routing**: System control and data exchange

### 4. Frontend Interface (`src/frontend/`)
- **Visual Computer**: Authentic 1980s computer interface
- **Terminal Emulation**: Text-based interaction
- **File Browser**: Disk management interface
- **Debug Panel**: System monitoring and debugging

## API Endpoints

### System Control
- `GET /health` - System health check
- `POST /api/system/start` - Start emulation
- `POST /api/system/stop` - Stop emulation
- `POST /api/system/reset` - Reset entire system
- `GET /api/system/state` - Get complete system state

### Program Management
- `POST /api/programs/load` - Load program into memory
- `POST /api/programs/execute` - Execute loaded program

### File System
- `POST /api/files/mount` - Mount disk image
- `GET /api/files/list/:drive?` - List files on disk
- `GET /api/files/read/:drive/:filename` - Read file from disk

## WebSocket Messages

### System Control Messages
```javascript
// Start system emulation
{ type: 'system_start', data: {} }

// Stop system emulation
{ type: 'system_stop', data: {} }

// Reset system
{ type: 'system_reset', data: {} }

// Get system state
{ type: 'get_system_state', data: {} }
```

### Program Execution Messages
```javascript
// Load program
{ type: 'load_program', data: {
    programData: [/* array of 32-bit instructions */],
    programName: 'myprogram',
    startAddress: 0x0000
}}

// Execute program
{ type: 'execute_program', data: {
    programName: 'myprogram'
}}
```

### File System Messages
```javascript
// Mount disk
{ type: 'mount_disk', data: {
    drive: 'A:',
    imagePath: '/path/to/disk.img'
}}

// List files
{ type: 'list_files', data: {
    drive: 'A:'
}}

// Load file
{ type: 'load_file', data: {
    drive: 'A:',
    filename: 'program.bas',
    maxLength: 8192
}}
```

## Development Commands

### Start in development mode (with auto-restart):
```bash
npm run dev
```

### Run tests:
```bash
npm test
```

### Lint code:
```bash
npm run lint
```

### Format code:
```bash
npm run format
```

## System Features

### Bootstrap Development
The system follows a bootstrap development approach:

1. **Machine Language** - Direct binary programming
2. **Assembler** - Assembly language development (self-hosted)
3. **C Compiler** - C language development (assembly-based)
4. **BASIC Interpreter** - High-level programming (C-based)

### Hardware Emulation
- **Complete RISC CPU** with instruction execution
- **Memory management** with 128KB RAM
- **Graphics rendering** with 640x200 display
- **Floppy disk storage** with FAT12 file system

### Real-time Operation
- **WebSocket communication** for live updates
- **Frame-by-frame execution** with visual feedback
- **Interactive debugging** with register inspection
- **File system operations** with disk mounting

## File Structure

```
orionrisc-128/
├── server.js           # Main Express.js server
├── start.js           # Startup script
├── package.json       # Project configuration
├── src/
│   ├── emulation/     # Hardware component emulation
│   ├── system/        # System software (OS, assembler, compiler)
│   ├── frontend/      # Browser-based user interface
│   └── communication/ # WebSocket communication layer
└── tests/             # Test suites
```

## Integration Points

The system is designed with clear integration points:

- **Modular hardware components** with well-defined interfaces
- **Memory-mapped I/O** for hardware communication
- **System call interface** for program-kernel interaction
- **WebSocket API** for frontend-backend communication
- **File system abstraction** for storage operations

## Error Handling

The system includes comprehensive error handling:

- **Hardware fault detection** and reporting
- **Program execution errors** with debugging information
- **File system errors** with appropriate status codes
- **Network communication errors** with reconnection logic

## Performance Considerations

- **Efficient emulation loop** with cycle-based execution
- **Optimized memory access** with caching strategies
- **Asynchronous I/O operations** for file system access
- **WebSocket message batching** for smooth real-time updates

The complete OrionRisc-128 system is now ready to run! 🚀