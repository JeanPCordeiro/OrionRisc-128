# OrionRisc-128 Floppy Disk Controller (FDC)

Complete floppy disk controller emulation for OrionRisc-128 with FAT12 file system support.

## Overview

The FDC provides two 360KB floppy disk drives (A: and B:) with complete FAT12 file system implementation. It includes memory-mapped I/O interface for hardware emulation and supports all standard floppy disk operations.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 FloppyDiskController                    │
│              (Memory-mapped I/O 0xF800)                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ DiskImage   │ │ FAT12File   │ │ FileOps     │        │
│  │ Management  │ │ System      │ │             │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────┤
│              SectorOperations                           │
│          (Low-level sector I/O)                         │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. FloppyDiskController (`FloppyDiskController.js`)
Main FDC class providing memory-mapped I/O interface and command processing.

**Features:**
- Memory-mapped I/O registers (0xF800-0xF900)
- Command execution (read, write, seek, format)
- DMA transfer support
- Interrupt handling
- Two drive support (A: and B:)

**Memory Map:**
- `0xF800`: Command register
- `0xF801`: Status register
- `0xF802`: Data register
- `0xF803`: Drive select (0=A:, 1=B:)
- `0xF804`: Track register
- `0xF805`: Sector register
- `0xF806`: DMA address low
- `0xF807`: DMA address high
- `0xF808`: DMA count
- `0xF809`: Control register

### 2. Disk Image Management (`disk-image.js`)
Handles 360KB/720KB disk image files and mounting operations.

**Features:**
- 360KB and 720KB disk support
- Disk mounting/unmounting
- File I/O operations
- Disk validation
- Multi-drive management

### 3. FAT12 File System (`fat12-filesystem.js`)
Complete FAT12 file system implementation.

**Features:**
- Boot sector management
- FAT (File Allocation Table) handling
- Directory operations
- Cluster management
- 12-bit FAT entries

**Disk Layout:**
- Sector 0: Boot sector
- Sectors 1-3: FAT1
- Sectors 4-6: FAT2 (backup)
- Sectors 7-13: Root directory (112 entries)
- Sectors 14+: Data area

### 4. File Operations (`file-operations.js`)
High-level file system operations interface.

**Features:**
- File create, read, write, delete
- Directory listing
- File handle management
- Free space calculation

### 5. Sector Operations (`sector-operations.js`)
Low-level sector read/write operations.

**Features:**
- Track/sector addressing
- CRC verification
- Multiple sector operations
- Disk formatting

## Specifications

### Hardware Specifications
- **Drives:** 2 floppy disk drives (A: and B:)
- **Capacity:** 360KB per disk (40 tracks × 9 sectors × 512 bytes)
- **Sector Size:** 512 bytes
- **Tracks:** 40 per disk (0-39)
- **Sectors:** 9 per track (1-9)

### File System Specifications
- **File System:** FAT12 with 12-bit cluster addressing
- **Cluster Size:** 1 sector (512 bytes)
- **Root Directory:** 112 entries (7 sectors)
- **FAT Size:** 3 sectors each (FAT1 and FAT2)
- **Boot Sector:** Standard FAT12 boot sector

## Usage Examples

### Basic FDC Operations

```javascript
const { FloppyDiskController } = require('./src/emulation/storage');
const mmu = new MMU(); // Your MMU implementation
const fdc = new FloppyDiskController(mmu);

// Mount disk image
await fdc.mountDisk('A:', 'disk1.img');

// Initialize file system
fdc.initializeFileSystem('A:');

// Write file
const data = Buffer.from('Hello, World!');
fdc.writeFile('A:', 'HELLO.TXT', data);

// Read file
const readData = fdc.readFile('A:', 'HELLO.TXT', data.length);

// List files
const files = fdc.listFiles('A:');
```

### Memory-Mapped I/O

```javascript
// Select drive A:
mmu.writeByte(0xF803, 0);

// Seek to track 5
mmu.writeByte(0xF804, 5);
mmu.writeByte(0xF800, 0x03); // SEEK command

// Read sector
mmu.writeByte(0xF804, 10); // Track 10
mmu.writeByte(0xF805, 3);  // Sector 3
mmu.writeByte(0xF800, 0x01); // READ SECTOR command

// Read data from data register
const data = [];
for (let i = 0; i < 512; i++) {
    data.push(mmu.readByte(0xF802));
}
```

### File System Operations

```javascript
// Create new disk
await fdc.createDisk('newdisk.img', false); // 360KB

// Mount and use
await fdc.mountDisk('A:', 'newdisk.img');
fdc.initializeFileSystem('A:');

// Create multiple files
const files = ['PROGRAM.COM', 'DATA.DAT', 'README.TXT'];
for (const file of files) {
    fdc.writeFile('A:', file, Buffer.from(`Content of ${file}`));
}

// List and verify
const listedFiles = fdc.listFiles('A:');
console.log('Files on disk:', listedFiles);
```

## Testing

Run the complete test suite:

```bash
node src/emulation/storage/test-runner.js
```

Run individual test suites:

```bash
# Test sector operations
node src/emulation/storage/test-sector-operations.js

# Test disk image management
node src/emulation/storage/test-disk-image.js

# Test FAT12 file system
node src/emulation/storage/test-fat12-filesystem.js

# Test file operations
node src/emulation/storage/test-file-operations.js

# Test integration
node src/emulation/storage/test-integration.js
```

## Integration with OS Kernel

The FDC integrates with the OS kernel through:

1. **Memory-mapped I/O** - CPU accesses FDC registers directly
2. **Interrupt handling** - FDC generates interrupts on command completion
3. **File operations** - OS uses FDC for program loading and data storage

### OS Integration Example

```javascript
// In OS kernel
class OperatingSystemKernel {
    constructor(mmu) {
        this.mmu = mmu;
        this.fdc = new FloppyDiskController(mmu);
    }

    async loadProgram(filename) {
        // Mount system disk
        await this.fdc.mountDisk('A:', 'system.img');

        // Read program file
        const programData = this.fdc.readFile('A:', filename, 65536);

        if (programData) {
            // Load into memory and execute
            return this.executeProgram(programData);
        }

        return false;
    }
}
```

## Performance Considerations

- **Sector caching** - Disk images are cached in memory for performance
- **Efficient FAT operations** - FAT entries are cached during operations
- **Minimal memory usage** - Only essential disk buffers are kept in memory
- **Async operations** - File I/O operations are asynchronous where appropriate

## Error Handling

The FDC provides comprehensive error handling:

- **Invalid disk images** - Validation on mount
- **Corrupt file systems** - FAT and directory validation
- **Hardware errors** - Simulated drive faults and CRC errors
- **Out of space** - Proper handling of disk full conditions

## Development Status

✅ **Completed Components:**
- Sector operations (low-level I/O)
- Disk image management
- FAT12 file system implementation
- File operations (high-level API)
- Main FDC controller with memory-mapped I/O
- Comprehensive test suite
- Integration testing

🔄 **Next Steps:**
- Integration with OS kernel
- Frontend file browser integration
- Performance optimization
- Extended file system features

## File Structure

```
src/emulation/storage/
├── index.js                    # Module exports
├── README.md                   # This documentation
├── FloppyDiskController.js     # Main FDC class
├── disk-image.js              # Disk image management
├── fat12-filesystem.js        # FAT12 implementation
├── file-operations.js         # High-level file I/O
├── sector-operations.js       # Low-level sector I/O
├── test-runner.js             # Test suite runner
├── test-sector-operations.js  # Sector operations tests
├── test-disk-image.js         # Disk image tests
├── test-fat12-filesystem.js   # FAT12 tests
├── test-file-operations.js    # File operations tests
└── test-integration.js        # Integration tests
```

## Compatibility

- **Node.js 16+** - Modern JavaScript features
- **Modern browsers** - For frontend integration
- **FAT12 standard** - Compatible with DOS and vintage systems
- **360KB/720KB disks** - Standard floppy disk formats

## Future Enhancements

- **Subdirectory support** - Full hierarchical file system
- **Long filename support** - VFAT LFN implementation
- **Disk compression** - Space-saving techniques
- **Error correction** - Reed-Solomon or other ECC
- **Performance optimization** - Caching and buffering improvements