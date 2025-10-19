#!/usr/bin/env node

/**
 * OrionRisc-128 BASIC Interpreter Disk Creator
 *
 * Creates a disk image containing the BASIC interpreter and example programs
 * This demonstrates the complete bootstrap development process
 */

const fs = require('fs').promises;
const path = require('path');

class BasicDiskCreator {
    constructor() {
        this.diskSize = 368640; // 360KB floppy disk
    }

    /**
     * Create a disk image with BASIC interpreter and example programs
     */
    async createBasicDisk() {
        console.log('💾 Creating BASIC interpreter disk image...');

        try {
            // Create disks directory if it doesn't exist
            const disksDir = path.join(__dirname, 'disks');
            await fs.mkdir(disksDir, { recursive: true });

            // Create the disk image path
            const diskPath = path.join(disksDir, 'basic-interpreter.img');

            // Create empty disk buffer
            const diskBuffer = Buffer.alloc(this.diskSize, 0x00);

            // Initialize with a simple file system structure
            this.initializeDiskFileSystem(diskBuffer);

            // Add BASIC interpreter (simulated as text for now)
            await this.addBasicInterpreter(diskBuffer);

            // Add example BASIC programs
            await this.addExamplePrograms(diskBuffer);

            // Write disk image to file
            await fs.writeFile(diskPath, diskBuffer);

            console.log(`✅ Created BASIC interpreter disk: ${diskPath}`);
            console.log(`📊 Size: ${diskBuffer.length} bytes (${Math.round(diskBuffer.length / 1024)}KB)`);

            return diskPath;

        } catch (error) {
            console.error('❌ Error creating BASIC disk:', error.message);
            return null;
        }
    }

    /**
     * Initialize basic file system structure in the disk buffer
     */
    initializeDiskFileSystem(buffer) {
        // Write a simple boot sector (first 512 bytes)
        const bootSector = Buffer.alloc(512, 0);

        // Simple FAT12 boot sector signature
        bootSector.write('ORIONRISC', 3); // OEM name
        bootSector.writeUInt16LE(512, 11); // Bytes per sector
        bootSector.writeUInt8(1, 13); // Sectors per cluster
        bootSector.writeUInt16LE(1, 14); // Reserved sectors
        bootSector.writeUInt8(2, 16); // Number of FATs
        bootSector.writeUInt16LE(224, 17); // Root directory entries
        bootSector.writeUInt16LE(2880, 19); // Total sectors (for 1.44MB)
        bootSector.writeUInt8(0xF0, 21); // Media descriptor
        bootSector.writeUInt16LE(9, 22); // Sectors per FAT
        bootSector.writeUInt16LE(18, 24); // Sectors per track
        bootSector.writeUInt16LE(2, 26); // Number of heads
        bootSector.writeUInt32LE(0, 28); // Hidden sectors
        bootSector.writeUInt32LE(0, 32); // Total sectors (large)

        // FAT12 signature
        bootSector.writeUInt16LE(0xAA55, 510);

        // Copy boot sector to disk buffer
        bootSector.copy(buffer, 0, 0, 512);

        console.log('📋 Initialized disk file system structure');
    }

    /**
     * Add BASIC interpreter to the disk (simulated)
     */
    async addBasicInterpreter(buffer) {
        // For demonstration, we'll add the BASIC interpreter as a text file
        // In a real system, this would be the compiled binary

        const interpreterInfo = `
OrionRisc-128 BASIC Interpreter v1.0
====================================

This disk contains the BASIC interpreter and example programs
for the OrionRisc-128 computer system.

Files:
- BASIC.COM    - BASIC interpreter executable
- HELLO.BAS    - Hello World example program
- DEMO.BAS     - Graphics demonstration program
- GAMES.BAS    - Simple games collection

To run BASIC:
1. Type: BASIC
2. Load a program: LOAD "HELLO.BAS"
3. Run the program: RUN

BASIC Commands:
- PRINT "Hello"  - Display text
- INPUT A        - Get user input
- LET X = 5      - Assign variables
- IF X > 0 THEN PRINT "Positive"
- FOR I = 1 TO 10: PRINT I: NEXT I
- GOSUB 100      - Call subroutine
- GOTO 200       - Jump to line

Have fun programming!
`;

        // Write interpreter info to a file entry (simplified)
        const fileEntryOffset = 512 * 19; // Start of root directory
        const infoBuffer = Buffer.from(interpreterInfo);

        // Copy to disk (in a real implementation, this would use proper FAT12 structures)
        infoBuffer.copy(buffer, fileEntryOffset, 0, Math.min(infoBuffer.length, 512));

        console.log('💻 Added BASIC interpreter information');
    }

    /**
     * Add example BASIC programs to the disk
     */
    async addExamplePrograms(buffer) {
        const programs = {
            'HELLO.BAS': `10 PRINT "Hello, OrionRisc-128!"
20 PRINT "Welcome to BASIC programming!"
30 PRINT "Current time: "; TIME$
40 INPUT "What is your name"; N$
50 PRINT "Hello, "; N$; "!"
60 PRINT "Let's learn BASIC together!"
70 END
`,

            'DEMO.BAS': `10 REM Graphics Demonstration Program
20 PRINT "Starting graphics demo..."
30 FOR I = 1 TO 10
40   PRINT "Drawing pattern "; I
50   REM Graphics commands would go here
60 NEXT I
70 PRINT "Demo complete!"
80 END
`,

            'GAMES.BAS': `10 REM Simple Number Guessing Game
20 PRINT "Guess a number between 1 and 10"
30 LET SECRET = 7
40 INPUT "Your guess"; GUESS
50 IF GUESS = SECRET THEN PRINT "Correct!": END
60 IF GUESS < SECRET THEN PRINT "Too low, try again"
70 IF GUESS > SECRET THEN PRINT "Too high, try again"
80 GOTO 40
`,

            'BASIC.COM': `BASIC Interpreter Binary
This would be the compiled BASIC.COM executable file.
In a real system, this would be loaded at address 0x0100.
`
        };

        let offset = 512 * 20; // Start after root directory

        for (const [filename, content] of Object.entries(programs)) {
            const contentBuffer = Buffer.from(content);

            // Write filename (8.3 format)
            const filenamePadded = (filename + '           ').substring(0, 11);
            Buffer.from(filenamePadded).copy(buffer, offset);

            // Write file size (simplified)
            buffer.writeUInt32LE(contentBuffer.length, offset + 28);

            // Write file content
            contentBuffer.copy(buffer, offset + 64, 0, Math.min(contentBuffer.length, 512 - 64));

            offset += 512; // Next directory entry

            console.log(`📄 Added ${filename} (${contentBuffer.length} bytes)`);
        }

        console.log('🎮 Added example BASIC programs');
    }

    /**
     * Display disk contents
     */
    async showDiskContents(diskPath) {
        try {
            console.log(`\n📋 Contents of ${path.basename(diskPath)}:`);

            // Read and display file information (simplified)
            const buffer = await fs.readFile(diskPath);

            // Show some basic info
            console.log(`   Total size: ${buffer.length} bytes`);
            console.log('   File system: FAT12 (simulated)');
            console.log('   Contains: BASIC interpreter and example programs');

        } catch (error) {
            console.error(`❌ Error reading disk contents:`, error.message);
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 OrionRisc-128 BASIC Interpreter Disk Creator');
    console.log('===============================================\n');

    const creator = new BasicDiskCreator();
    const diskPath = await creator.createBasicDisk();

    if (diskPath) {
        await creator.showDiskContents(diskPath);

        console.log('\n🎉 BASIC interpreter disk created successfully!');
        console.log(`📂 Location: ${diskPath}`);
        console.log('\n💡 Next steps:');
        console.log('   1. Mount this disk in the OrionRisc-128 system');
        console.log('   2. Run: LOAD "HELLO.BAS"');
        console.log('   3. Run: RUN');
        console.log('   4. Try the other example programs');

        console.log('\n📚 Available programs:');
        console.log('   • HELLO.BAS    - Hello World program');
        console.log('   • DEMO.BAS     - Graphics demonstration');
        console.log('   • GAMES.BAS    - Number guessing game');
        console.log('   • BASIC.COM    - BASIC interpreter');

        process.exit(0);
    } else {
        console.log('\n❌ BASIC disk creation failed!');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = BasicDiskCreator;