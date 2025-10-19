#!/usr/bin/env node

/**
 * OrionRisc-128 Empty Disk Image Creator
 *
 * Creates empty 360KB floppy disk images for drives A and B
 * These can be used for testing the file system functionality
 */

const DiskImage = require('./src/emulation/storage/disk-image');
const path = require('path');

class EmptyDiskCreator {
    constructor() {
        this.diskImage = new DiskImage();
    }

    /**
     * Create empty disk images for both drives
     */
    async createEmptyDisks() {
        console.log('🛠️  Creating empty disk images for OrionRisc-128...');

        try {
            // Create disks directory if it doesn't exist
            const fs = require('fs').promises;
            const disksDir = path.join(__dirname, 'disks');
            await fs.mkdir(disksDir, { recursive: true });

            // Create empty disk for drive A
            const diskAPath = path.join(disksDir, 'empty-disk-a.img');
            const diskBPath = path.join(disksDir, 'empty-disk-b.img');

            console.log('📀 Creating empty disk A...');
            const successA = await this.diskImage.createBlankDisk(diskAPath, false); // 360KB
            if (successA) {
                console.log(`✅ Created empty disk A: ${diskAPath}`);
            } else {
                console.error('❌ Failed to create disk A');
                return false;
            }

            console.log('📀 Creating empty disk B...');
            const successB = await this.diskImage.createBlankDisk(diskBPath, false); // 360KB
            if (successB) {
                console.log(`✅ Created empty disk B: ${diskBPath}`);
            } else {
                console.error('❌ Failed to create disk B');
                return false;
            }

            console.log('\n🎉 Empty disk images created successfully!');
            console.log(`📂 Location: ${disksDir}`);
            console.log('\n💡 Usage:');
            console.log('   • Mount these disks in the OrionRisc-128 system');
            console.log('   • Use them for testing file operations');
            console.log('   • Format them with a FAT12 file system');

            return true;

        } catch (error) {
            console.error('❌ Error creating empty disks:', error.message);
            return false;
        }
    }

    /**
     * Display disk information
     */
    async showDiskInfo(diskPath) {
        try {
            const fs = require('fs').promises;
            const stats = await fs.stat(diskPath);
            console.log(`📊 Disk: ${path.basename(diskPath)}`);
            console.log(`   Size: ${stats.size} bytes (${Math.round(stats.size / 1024)}KB)`);
            console.log(`   Created: ${stats.birthtime}`);
            console.log(`   Modified: ${stats.mtime}`);
        } catch (error) {
            console.error(`❌ Error reading disk info for ${diskPath}:`, error.message);
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 OrionRisc-128 Empty Disk Creator');
    console.log('==================================\n');

    const creator = new EmptyDiskCreator();
    const success = await creator.createEmptyDisks();

    if (success) {
        // Show information about created disks
        const fs = require('fs').promises;
        const disksDir = path.join(__dirname, 'disks');

        try {
            const files = await fs.readdir(disksDir);
            console.log('\n📋 Created disks:');

            for (const file of files) {
                if (file.endsWith('.img')) {
                    const filePath = path.join(disksDir, file);
                    await creator.showDiskInfo(filePath);
                }
            }
        } catch (error) {
            // Directory might not exist if creation failed
        }

        console.log('\n✅ Empty disk creation completed successfully!');
        process.exit(0);
    } else {
        console.log('\n❌ Empty disk creation failed!');
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

module.exports = EmptyDiskCreator;