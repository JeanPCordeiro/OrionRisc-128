/**
 * OrionRisc-128 File Browser Component
 * Handles floppy disk management and file operations
 */

class FileBrowser {
    constructor() {
        this.diskAFiles = document.getElementById('disk-a-files');
        this.diskBFiles = document.getElementById('disk-b-files');
        this.mountDiskAButton = document.getElementById('mount-disk-a');
        this.mountDiskBButton = document.getElementById('mount-disk-b');

        this.diskState = {
            A: {
                mounted: false,
                imageName: null,
                files: [],
                writeProtected: false
            },
            B: {
                mounted: false,
                imageName: null,
                files: [],
                writeProtected: false
            }
        };

        this.currentDirectory = '';
        this.selectedFile = null;
        this.selectedDrive = null;

        this.initializeEventListeners();
        this.setupWebSocketHandlers();
        this.refreshDiskDisplays();
    }

    /**
     * Initialize file browser event listeners
     */
    initializeEventListeners() {
        this.mountDiskAButton.addEventListener('click', () => this.mountDisk('A'));
        this.mountDiskBButton.addEventListener('click', () => this.mountDisk('B'));

        // Keyboard shortcuts for file operations
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'o':
                        e.preventDefault();
                        this.loadProgram();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveProgram();
                        break;
                }
            }
        });
    }

    /**
     * Set up WebSocket handlers for disk communication
     */
    setupWebSocketHandlers() {
        if (window.OrionRiscApp && window.OrionRiscApp.components.websocket) {
            const ws = window.OrionRiscApp.components.websocket;

            ws.addMessageHandler('disk_mounted', (data) => {
                this.handleDiskMounted(data.drive, data.imageName, data.files);
            });

            ws.addMessageHandler('disk_ejected', (data) => {
                this.handleDiskEjected(data.drive);
            });

            ws.addMessageHandler('disk_files', (data) => {
                this.updateDiskFiles(data.drive, data.files);
            });

            ws.addMessageHandler('file_loaded', (data) => {
                this.handleFileLoaded(data.filename, data.success);
            });

            ws.addMessageHandler('file_saved', (data) => {
                this.handleFileSaved(data.filename, data.success);
            });
        }
    }

    /**
     * Get WebSocket instance
     */
    getWebSocket() {
        return window.OrionRiscApp && window.OrionRiscApp.components.websocket;
    }

    /**
     * Handle WebSocket connection establishment
     */
    onConnected() {
        console.log('File browser connected to server');
        // Request initial disk state or perform any connection-time initialization
        const ws = this.getWebSocket();
        if (ws && ws.isConnected) {
            // Request current disk state from server
            ws.send({
                type: 'disk_request_state'
            });
        }
    }

    /**
     * Mount a disk image for the specified drive
     */
    mountDisk(drive) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.img,.dsk,.bas,.asm,.com,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.mountDiskImage(drive, file);
            }
        };
        input.click();
    }

    /**
     * Mount disk image file
     */
    mountDiskImage(drive, file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = e.target.result;

            const ws = this.getWebSocket();
            if (ws && ws.isConnected) {
                ws.send({
                    type: 'mount_disk',
                    drive: drive,
                    filename: file.name,
                    data: data
                });
            } else {
                // Local simulation
                this.simulateDiskMount(drive, file.name, this.parseFileData(data));
            }
        };

        reader.readAsArrayBuffer(file);
    }

    /**
     * Parse file data for local simulation
     */
    parseFileData(data) {
        const files = [];

        if (data instanceof ArrayBuffer) {
            // Binary disk image - simulate file system
            const view = new DataView(data);
            const size = Math.min(data.byteLength, 1000); // Limit for demo

            for (let i = 0; i < size; i += 64) {
                if (view.getUint8(i) !== 0) {
                    files.push({
                        name: `FILE${Math.floor(i / 64).toString().padStart(3, '0')}.DAT`,
                        size: 64,
                        type: 'data'
                    });
                }
            }
        } else {
            // Text data - parse as file listing
            const lines = data.split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    files.push({
                        name: line.trim(),
                        size: Math.floor(Math.random() * 1000) + 100,
                        type: this.getFileType(line.trim())
                    });
                }
            }
        }

        return files;
    }

    /**
     * Get file type based on extension
     */
    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        switch (ext) {
            case 'bas': return 'basic';
            case 'asm': return 'assembly';
            case 'com': return 'executable';
            case 'txt': return 'text';
            case 'img':
            case 'dsk': return 'disk';
            default: return 'data';
        }
    }

    /**
     * Simulate disk mounting for local testing
     */
    simulateDiskMount(drive, imageName, files) {
        this.diskState[drive].mounted = true;
        this.diskState[drive].imageName = imageName;
        this.diskState[drive].files = files;

        this.refreshDiskDisplays();

        // Update control panel indicators
        if (window.OrionRiscApp && window.OrionRiscApp.components.controls) {
            window.OrionRiscApp.components.controls.updateDiskStatus({
                [`disk${drive}`]: true
            });
        }
    }

    /**
     * Handle disk mounted event from backend
     */
    handleDiskMounted(drive, imageName, files) {
        this.diskState[drive].mounted = true;
        this.diskState[drive].imageName = imageName;
        this.diskState[drive].files = files;

        this.refreshDiskDisplays();
    }

    /**
     * Handle disk ejected event from backend
     */
    handleDiskEjected(drive) {
        this.diskState[drive].mounted = false;
        this.diskState[drive].imageName = null;
        this.diskState[drive].files = [];

        this.refreshDiskDisplays();

        // Update control panel indicators
        if (window.OrionRiscApp && window.OrionRiscApp.components.controls) {
            window.OrionRiscApp.components.controls.updateDiskStatus({
                [`disk${drive}`]: false
            });
        }
    }

    /**
     * Update files on disk
     */
    updateDiskFiles(drive, files) {
        this.diskState[drive].files = files;
        this.refreshDiskDisplay(drive);
    }

    /**
     * Refresh disk displays
     */
    refreshDiskDisplays() {
        this.refreshDiskDisplay('A');
        this.refreshDiskDisplay('B');
    }

    /**
     * Refresh specific disk display
     */
    refreshDiskDisplay(drive) {
        const container = drive === 'A' ? this.diskAFiles : this.diskBFiles;
        const state = this.diskState[drive];

        container.innerHTML = '';

        if (!state.mounted) {
            container.innerHTML = '<div style="color: #666; font-style: italic;">No disk mounted</div>';
            return;
        }

        // Disk header
        const header = document.createElement('div');
        header.style.cssText = 'color: #0f0; font-size: 10px; margin-bottom: 8px; font-weight: bold;';
        header.textContent = `${state.imageName} (${state.files.length} files)`;
        container.appendChild(header);

        // File list
        if (state.files.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color: #666; font-style: italic;';
            empty.textContent = 'Disk is empty';
            container.appendChild(empty);
        } else {
            for (const file of state.files) {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'file-item';
                fileDiv.innerHTML = `
                    <span style="color: #fff;">${file.name}</span>
                    <span style="color: #888; font-size: 9px;">${this.formatFileSize(file.size)}</span>
                `;

                fileDiv.addEventListener('click', () => {
                    this.selectFile(drive, file);
                });

                fileDiv.addEventListener('dblclick', () => {
                    this.loadFile(drive, file);
                });

                container.appendChild(fileDiv);
            }
        }
    }

    /**
     * Select a file
     */
    selectFile(drive, file) {
        this.selectedFile = file;
        this.selectedDrive = drive;

        // Update visual selection
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.style.background = 'transparent';
        });

        event.target.style.background = 'rgba(0, 255, 136, 0.2)';
    }

    /**
     * Load selected file
     */
    loadFile(drive, file) {
        const ws = this.getWebSocket();
        if (ws && ws.isConnected) {
            ws.send({
                type: 'load_file',
                drive: drive,
                filename: file.name
            });
        } else {
            // Local simulation
            this.simulateFileLoad(file);
        }
    }

    /**
     * Save file to disk
     */
    saveFile(drive, filename, data) {
        const ws = this.getWebSocket();
        if (ws && ws.isConnected) {
            ws.send({
                type: 'save_file',
                drive: drive,
                filename: filename,
                data: data
            });
        } else {
            // Local simulation
            this.simulateFileSave(filename, data);
        }
    }

    /**
     * Load program (public interface)
     */
    loadProgram() {
        if (this.selectedFile) {
            this.loadFile(this.selectedDrive, this.selectedFile);
        } else {
            // Show file dialog
            this.mountDisk('A');
        }
    }

    /**
     * Save program (public interface)
     */
    saveProgram() {
        const filename = prompt('Enter filename to save:');
        if (filename) {
            const data = this.getProgramData();
            this.saveFile('A', filename, data);
        }
    }

    /**
     * Get current program data for saving
     */
    getProgramData() {
        // This would typically get data from the terminal or memory
        // For now, return sample data
        return '10 PRINT "HELLO WORLD"\n20 GOTO 10\n';
    }

    /**
     * Handle file loaded event
     */
    handleFileLoaded(filename, success) {
        if (success) {
            this.showMessage(`File "${filename}" loaded successfully`);
        } else {
            this.showMessage(`Failed to load file "${filename}"`, 'error');
        }
    }

    /**
     * Handle file saved event
     */
    handleFileSaved(filename, success) {
        if (success) {
            this.showMessage(`File "${filename}" saved successfully`);
        } else {
            this.showMessage(`Failed to save file "${filename}"`, 'error');
        }
    }

    /**
     * Simulate file loading for local testing
     */
    simulateFileLoad(file) {
        let content = '';

        switch (file.type) {
            case 'basic':
                content = '10 PRINT "BASIC PROGRAM LOADED"\n20 END\n';
                break;
            case 'assembly':
                content = '; Assembly program loaded\nMOV R0, #42\n';
                break;
            case 'executable':
                content = 'Binary executable data';
                break;
            default:
                content = `File: ${file.name}\nSize: ${file.size} bytes\nType: ${file.type}`;
        }

        // Send to terminal
        if (window.OrionRiscApp && window.OrionRiscApp.components.terminal) {
            window.OrionRiscApp.components.terminal.writeOutput(`\nLoaded: ${file.name}\n`);
            window.OrionRiscApp.components.terminal.writeOutput(content);
            window.OrionRiscApp.components.terminal.writeOutput('\n> ');
        }

        this.showMessage(`Loaded "${file.name}" (${this.formatFileSize(file.size)})`);
    }

    /**
     * Simulate file saving for local testing
     */
    simulateFileSave(filename, data) {
        // Add file to disk
        const file = {
            name: filename,
            size: data.length,
            type: this.getFileType(filename)
        };

        if (!this.diskState.A.mounted) {
            this.showMessage('No disk in drive A', 'error');
            return;
        }

        this.diskState.A.files.push(file);
        this.refreshDiskDisplay('A');
        this.showMessage(`Saved "${filename}" (${this.formatFileSize(data.length)})`);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + 'B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB';
        return Math.round(bytes / (1024 * 1024)) + 'MB';
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        const color = type === 'error' ? '#ff4444' : '#00ff88';

        if (window.OrionRiscApp && window.OrionRiscApp.components.terminal) {
            window.OrionRiscApp.components.terminal.writeOutput(`[${type.toUpperCase()}] ${message}\n`);
        } else {
            // Fallback message display
            console.log(`FileBrowser: ${message}`);
        }
    }

    /**
     * Create new file
     */
    createFile(drive, filename, content = '') {
        if (!this.diskState[drive].mounted) {
            this.showMessage(`No disk in drive ${drive}`, 'error');
            return false;
        }

        const file = {
            name: filename,
            size: content.length,
            type: this.getFileType(filename)
        };

        this.diskState[drive].files.push(file);
        this.refreshDiskDisplay(drive);

        return true;
    }

    /**
     * Delete file
     */
    deleteFile(drive, filename) {
        if (!this.diskState[drive].mounted) {
            this.showMessage(`No disk in drive ${drive}`, 'error');
            return false;
        }

        const index = this.diskState[drive].files.findIndex(f => f.name === filename);
        if (index >= 0) {
            this.diskState[drive].files.splice(index, 1);
            this.refreshDiskDisplay(drive);
            return true;
        }

        return false;
    }

    /**
     * Get disk state
     */
    getState() {
        return { ...this.diskState };
    }

    /**
     * Set disk state from external source
     */
    setState(state) {
        Object.assign(this.diskState, state);
        this.refreshDiskDisplays();
    }

    /**
     * Export disk image
     */
    exportDiskImage(drive) {
        if (!this.diskState[drive].mounted) {
            this.showMessage(`No disk in drive ${drive}`, 'error');
            return null;
        }

        const data = {
            imageName: this.diskState[drive].imageName,
            files: this.diskState[drive].files,
            exported: new Date().toISOString()
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Import disk image
     */
    importDiskImage(drive, data) {
        try {
            const diskData = JSON.parse(data);
            this.diskState[drive].mounted = true;
            this.diskState[drive].imageName = diskData.imageName || 'Imported Disk';
            this.diskState[drive].files = diskData.files || [];

            this.refreshDiskDisplay(drive);
            this.showMessage(`Imported disk "${this.diskState[drive].imageName}"`);
        } catch (e) {
            this.showMessage('Failed to import disk image', 'error');
        }
    }
}

// Export for use in other modules
window.FileBrowser = FileBrowser;