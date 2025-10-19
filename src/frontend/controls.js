/**
 * OrionRisc-128 Control Panel Component
 * Handles system management, status monitoring, and user controls
 */

class ControlPanel {
    constructor() {
        this.powerButton = document.getElementById('power-btn');
        this.resetButton = document.getElementById('reset-btn');
        this.loadButton = document.getElementById('load-btn');
        this.saveButton = document.getElementById('save-btn');

        this.powerIndicator = document.getElementById('power-indicator');
        this.runIndicator = document.getElementById('run-indicator');
        this.diskAIndicator = document.getElementById('disk-a-indicator');
        this.diskBIndicator = document.getElementById('disk-b-indicator');

        this.cpuStatus = document.getElementById('cpu-status');
        this.memoryStatus = document.getElementById('memory-status');
        this.pcStatus = document.getElementById('pc-status');
        this.instructionCount = document.getElementById('instruction-count');

        this.debugToggle = document.getElementById('debug-toggle');
        this.debugContent = document.getElementById('debug-content');
        this.registerDisplay = document.getElementById('register-display');
        this.lastInstruction = document.getElementById('last-instruction');
        this.systemCalls = document.getElementById('system-calls');

        this.systemState = {
            power: false,
            running: false,
            diskA: false,
            diskB: false,
            memoryUsed: 0,
            memoryTotal: 131072, // 128KB
            pc: 0x0000,
            instructions: 0,
            registers: new Array(16).fill(0),
            lastInstruction: 'None',
            systemCalls: 0
        };

        this.debugPanelVisible = false;

        this.initializeEventListeners();
        this.setupWebSocketHandlers();
        this.startStatusUpdateLoop();
    }

    /**
     * Initialize control panel event listeners
     */
    initializeEventListeners() {
        this.powerButton.addEventListener('click', () => this.togglePower());
        this.resetButton.addEventListener('click', () => this.resetSystem());
        this.loadButton.addEventListener('click', () => this.loadProgram());
        this.saveButton.addEventListener('click', () => this.saveProgram());

        this.debugToggle.addEventListener('click', () => this.toggleDebugPanel());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'p':
                        e.preventDefault();
                        this.togglePower();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetSystem();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.toggleDebugPanel();
                        break;
                }
            }
        });
    }

    /**
     * Set up WebSocket handlers for system communication
     */
    setupWebSocketHandlers() {
        if (window.EmulationWebSocket) {
            window.EmulationWebSocket.addMessageHandler('system_status', (data) => {
                this.updateSystemStatus(data);
            });

            window.EmulationWebSocket.addMessageHandler('cpu_status', (data) => {
                this.updateCPUStatus(data);
            });

            window.EmulationWebSocket.addMessageHandler('memory_status', (data) => {
                this.updateMemoryStatus(data);
            });

            window.EmulationWebSocket.addMessageHandler('disk_status', (data) => {
                this.updateDiskStatus(data);
            });

            window.EmulationWebSocket.addMessageHandler('debug_info', (data) => {
                this.updateDebugInfo(data);
            });
        }
    }

    /**
     * Start periodic status update loop
     */
    startStatusUpdateLoop() {
        setInterval(() => {
            this.updateDisplay();
        }, 100); // 10 FPS updates
    }

    /**
     * Toggle system power
     */
    togglePower() {
        this.systemState.power = !this.systemState.power;

        if (window.EmulationWebSocket && window.EmulationWebSocket.isConnected()) {
            window.EmulationWebSocket.send({
                type: 'system_power',
                state: this.systemState.power
            });
        } else {
            // Local simulation
            this.updateSystemStatus({
                power: this.systemState.power,
                running: this.systemState.power ? this.systemState.running : false
            });
        }

        this.playButtonSound();
    }

    /**
     * Reset the system
     */
    resetSystem() {
        if (window.EmulationWebSocket && window.EmulationWebSocket.isConnected()) {
            window.EmulationWebSocket.send({
                type: 'system_reset'
            });
        } else {
            // Local simulation
            this.systemState.running = false;
            this.systemState.pc = 0x0000;
            this.systemState.instructions = 0;
            this.systemState.registers.fill(0);
            this.systemState.lastInstruction = 'None';
        }

        this.playButtonSound();
    }

    /**
     * Load program from disk
     */
    loadProgram() {
        if (window.FileBrowser) {
            window.FileBrowser.loadProgram();
        } else {
            // Fallback file dialog
            this.showLoadDialog();
        }

        this.playButtonSound();
    }

    /**
     * Save program to disk
     */
    saveProgram() {
        if (window.FileBrowser) {
            window.FileBrowser.saveProgram();
        } else {
            // Fallback file dialog
            this.showSaveDialog();
        }

        this.playButtonSound();
    }

    /**
     * Toggle debug panel visibility
     */
    toggleDebugPanel() {
        this.debugPanelVisible = !this.debugPanelVisible;
        this.debugContent.style.display = this.debugPanelVisible ? 'block' : 'none';
        this.debugToggle.textContent = this.debugPanelVisible ? 'Hide Debug' : 'Debug Info';
    }

    /**
     * Update system status indicators
     */
    updateSystemStatus(data) {
        if (data.power !== undefined) {
            this.systemState.power = data.power;
        }
        if (data.running !== undefined) {
            this.systemState.running = data.running;
        }

        this.updateDisplay();
    }

    /**
     * Update CPU status information
     */
    updateCPUStatus(data) {
        if (data.pc !== undefined) {
            this.systemState.pc = data.pc;
        }
        if (data.instructions !== undefined) {
            this.systemState.instructions = data.instructions;
        }
        if (data.registers) {
            this.systemState.registers = data.registers;
        }
        if (data.lastInstruction) {
            this.systemState.lastInstruction = data.lastInstruction;
        }

        this.updateDisplay();
    }

    /**
     * Update memory status information
     */
    updateMemoryStatus(data) {
        if (data.used !== undefined) {
            this.systemState.memoryUsed = data.used;
        }
        if (data.total !== undefined) {
            this.systemState.memoryTotal = data.total;
        }

        this.updateDisplay();
    }

    /**
     * Update disk status indicators
     */
    updateDiskStatus(data) {
        if (data.diskA !== undefined) {
            this.systemState.diskA = data.diskA;
        }
        if (data.diskB !== undefined) {
            this.systemState.diskB = data.diskB;
        }

        this.updateDisplay();
    }

    /**
     * Update debug information
     */
    updateDebugInfo(data) {
        if (data.systemCalls !== undefined) {
            this.systemState.systemCalls = data.systemCalls;
        }
        if (data.registers) {
            this.systemState.registers = data.registers;
        }
        if (data.lastInstruction) {
            this.systemState.lastInstruction = data.lastInstruction;
        }

        this.updateDisplay();
    }

    /**
     * Update all display elements
     */
    updateDisplay() {
        // Update indicators
        this.powerIndicator.className = `indicator-light ${this.systemState.power ? 'on' : 'off'}`;
        this.runIndicator.className = `indicator-light ${this.systemState.running ? 'on' : 'off'}`;
        this.diskAIndicator.className = `indicator-light ${this.systemState.diskA ? 'on' : 'off'}`;
        this.diskBIndicator.className = `indicator-light ${this.systemState.diskB ? 'on' : 'off'}`;

        // Update status displays
        this.cpuStatus.textContent = this.systemState.running ? 'RUNNING' : 'STOPPED';
        this.memoryStatus.textContent = `${Math.round(this.systemState.memoryUsed / 1024)}KB / ${Math.round(this.systemState.memoryTotal / 1024)}KB`;
        this.pcStatus.textContent = `0x${this.systemState.pc.toString(16).toUpperCase().padStart(4, '0')}`;
        this.instructionCount.textContent = this.systemState.instructions.toLocaleString();

        // Update debug panel
        this.updateRegisterDisplay();
        this.lastInstruction.textContent = this.systemState.lastInstruction;
        this.systemCalls.textContent = this.systemState.systemCalls;

        // Update button states
        this.powerButton.textContent = this.systemState.power ? 'POWER OFF' : 'POWER ON';
        this.powerButton.disabled = false; // Always allow power toggle
    }

    /**
     * Update register display in debug panel
     */
    updateRegisterDisplay() {
        this.registerDisplay.innerHTML = '';

        for (let i = 0; i < 16; i++) {
            const regDiv = document.createElement('div');
            regDiv.innerHTML = `
                <span style="font-size: 9px; color: #666;">R${i}:</span>
                <span style="font-size: 9px; color: #0f0;">0x${this.systemState.registers[i].toString(16).padStart(4, '0')}</span>
            `;
            this.registerDisplay.appendChild(regDiv);
        }
    }

    /**
     * Play button sound effect
     */
    playButtonSound() {
        // Simple audio feedback using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Ignore audio errors
        }
    }

    /**
     * Show load program dialog (fallback)
     */
    showLoadDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.bas,.asm,.com';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadFile(file);
            }
        };
        input.click();
    }

    /**
     * Show save program dialog (fallback)
     */
    showSaveDialog() {
        const data = prompt('Enter program data to save (hex):');
        if (data) {
            const blob = new Blob([data], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'program.com';
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Load file from disk (fallback implementation)
     */
    loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;

            if (window.EmulationWebSocket && window.EmulationWebSocket.isConnected()) {
                window.EmulationWebSocket.send({
                    type: 'load_program',
                    filename: file.name,
                    data: data
                });
            } else {
                // Local simulation
                console.log(`Loaded file: ${file.name}, Size: ${data.length} bytes`);
                this.updateSystemStatus({ running: true });
            }
        };
        reader.readAsText(file);
    }

    /**
     * Get current system state
     */
    getState() {
        return { ...this.systemState };
    }

    /**
     * Set system state from external source
     */
    setState(state) {
        Object.assign(this.systemState, state);
        this.updateDisplay();
    }

    /**
     * Request system status from backend
     */
    requestStatus() {
        if (window.EmulationWebSocket && window.EmulationWebSocket.isConnected()) {
            window.EmulationWebSocket.send({
                type: 'request_status'
            });
        }
    }

    /**
     * Emergency stop (for debugging)
     */
    emergencyStop() {
        this.systemState.running = false;
        this.systemState.power = false;

        if (window.EmulationWebSocket && window.EmulationWebSocket.isConnected()) {
            window.EmulationWebSocket.send({
                type: 'emergency_stop'
            });
        }

        this.updateDisplay();
    }

    /**
     * Reset debug counters
     */
    resetDebugCounters() {
        this.systemState.instructions = 0;
        this.systemState.systemCalls = 0;
        this.systemState.lastInstruction = 'None';

        if (window.EmulationWebSocket && window.EmulationWebSocket.isConnected()) {
            window.EmulationWebSocket.send({
                type: 'reset_counters'
            });
        }

        this.updateDisplay();
    }

    /**
     * Take system snapshot for debugging
     */
    takeSnapshot() {
        const snapshot = {
            timestamp: new Date().toISOString(),
            systemState: this.getState(),
            terminalState: window.TerminalEmulator ? window.TerminalEmulator.getState() : null,
            graphicsState: window.GraphicsDisplay ? window.GraphicsDisplay.getState() : null
        };

        console.log('System Snapshot:', snapshot);
        return snapshot;
    }
}

// Export for use in other modules
window.ControlPanel = ControlPanel;