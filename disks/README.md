# OrionRisc-128 Disk Images

This directory contains floppy disk images for the OrionRisc-128 computer system, including empty disks and pre-configured disks with software.

## Available Disk Images

### Empty Disk Images

#### `empty-disk-a.img`
- **Size**: 360KB (368,640 bytes)
- **Format**: Blank floppy disk image
- **Purpose**: Primary disk for testing file operations

#### `empty-disk-b.img`
- **Size**: 360KB (368,640 bytes)
- **Format**: Blank floppy disk image
- **Purpose**: Secondary disk for multi-disk operations

### Software Disk Images

#### `basic-interpreter.img`
- **Size**: 360KB (368,640 bytes)
- **Format**: FAT12 file system with BASIC programs
- **Contents**:
  - `BASIC.COM` - BASIC interpreter executable (simulated)
  - `HELLO.BAS` - Hello World demonstration program
  - `DEMO.BAS` - Graphics demonstration program
  - `GAMES.BAS` - Number guessing game
- **Purpose**: Complete BASIC programming environment

## Usage

### In the OrionRisc-128 Web Interface

1. **Start the OrionRisc-128 system**:
   ```bash
   npm start
   ```

2. **Open the web interface** at `http://localhost:3000`

3. **Mount the disk images**:
   - Click the **"Mount Disk A"** button in the file browser panel
   - Select `empty-disk-a.img` from the `disks/` directory
   - Repeat for Disk B if needed

4. **Format the disks** (optional):
   - Use the BASIC `FORMAT` command or assembler directives
   - Create a FAT12 file system structure

### Using the BASIC Interpreter Disk

1. **Mount the BASIC disk**:
   - Click **"Mount Disk A"** and select `basic-interpreter.img`

2. **Load the BASIC interpreter**:
   ```
   LOAD "BASIC.COM"
   ```

3. **Run example programs**:
   ```
   LOAD "HELLO.BAS"
   RUN
   ```

4. **Try other programs**:
   ```
   LOAD "DEMO.BAS"
   RUN

   LOAD "GAMES.BAS"
   RUN
   ```

### Using the Disk Images Programmatically

```javascript
const DiskImage = require('./src/emulation/storage/disk-image');
const diskImage = new DiskImage();

// Mount empty disk A
await diskImage.mountDisk('A:', './disks/empty-disk-a.img');

// Perform file operations
// ... your code here ...

// Unmount when done
await diskImage.unmountDisk('A:');
```

## Creating Additional Disks

To create more empty disk images, use the provided script:

```bash
node create-empty-disks.js
```

This will create additional disk images in the `disks/` directory.

## Technical Specifications

- **Disk Size**: 360KB (standard 5.25" floppy disk)
- **Geometry**: 40 tracks × 9 sectors × 512 bytes per sector × 2 sides
- **Format**: Raw sector image (unformatted)
- **File System**: None (blank) - requires formatting

## Troubleshooting

### Disk Won't Mount
- Ensure the file exists and has the correct size (368,640 bytes)
- Check file permissions
- Verify the disk image isn't corrupted

### File Operations Fail
- Format the disk first using appropriate tools
- Check available disk space
- Verify file system compatibility

## Development Notes

These disk images are created using the `DiskImage.createBlankDisk()` method from the OrionRisc-128 storage emulation system. They contain no file system structure and must be formatted before use.

For testing purposes, you can also create 720KB disk images by modifying the creation script to use `is720KB = true`.